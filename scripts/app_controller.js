// Career workspace, assessment and navigation controller.
(function () {
  "use strict";

  const PROTO = "ht" + "tps://";
  const STORAGE_KEY = "nml_guest_workspace_v6";
  const INSTALL_PREVIEW = window.NucleusRuntime?.installPreview === true;
  const REPORT_TABS_ORDER = ["overview", "skills", "roadmap", "jobs", "courses"];
  const DEFAULT_STATE = {
    theme: "light", viewport: "fullscreen", isAuthenticated: false, isGuest: false, displayName: "",
    user: {fullName:"Guest", username:"guest", contact:"", contactType:"Email"},
    pendingAuth: {contact:""}, history: [], savedUpdates: [], savedUpdateItems: [],
    assessment: {professionId:"", qualification:"", experience:"", workSetting:"", responsibilities:[], additionalSkills:[],
      selectedDirections:[], selectedRoleId:"", activeReportTab:"overview", jobLocationFilter:"All Locations", jobTypeFilter:"All Types",
      savedRoles:[], savedCourses:[], completedRoadmapSteps:{}, confirmedSkills:{}, jobSearch:{}, preferredCity:"Hyderabad, India"}
  };
  let state = freshState();
  let currentScreenId = "screen-splash", previousScreenBeforeSettings = "screen-welcome";
  let alertToastInterval = null, heroTimerTickInterval = null, currentHeroSlide = 0, heroTimerProgress = 0;
  let isHeroPaused = false, isHandlingPopState = false, demoUnlocked = false, deviceStorageError = false;
  let saveTimer = null, savePromise = null, revision = 0, changeVersion = 0, savedVersion = 0, syncBlocked = false;
  let bookings = [], backendReady = false, modalReturnFocus = null, authEpoch = 0, sessionExpired = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function freshState() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
  function normalizeAssessment(input) {
    const result = clone(DEFAULT_STATE.assessment), data = input && typeof input === 'object' ? input : {};
    Object.keys(result).forEach(key => {
      if (Array.isArray(result[key])) result[key] = Array.isArray(data[key]) ? data[key].filter(x=>typeof x==='string').slice(0,100).map(x=>sanitizeText(x,200)) : [];
      else if (typeof result[key] === 'string' && typeof data[key] === 'string') result[key] = sanitizeText(data[key],200);
    });
    ['completedRoadmapSteps','confirmedSkills'].forEach(key => {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        window.NUCLEUS_DATA.careerRoles.forEach(role => {
          if(key==='confirmedSkills') result[key][role.id]=Array.isArray(data[key][role.id]) ? data[key][role.id].filter(x=>role.newSkillsToAcquire.includes(x)) : [];
          else if(data[key][role.id]) {
            result[key][role.id]={}; role.roadmap.forEach(step=>{const v=data[key][role.id][step.step]; if(v) result[key][role.id][step.step]=typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:true;});
          }
        });
      }
    });
    if(!window.NUCLEUS_DATA.professions.some(p=>p.id===result.professionId)) result.professionId='';
    if(!window.NUCLEUS_DATA.careerRoles.some(r=>r.id===result.selectedRoleId)) result.selectedRoleId='';
    if(!REPORT_TABS_ORDER.includes(result.activeReportTab)) result.activeReportTab='overview';
    const d=window.NUCLEUS_DATA;
    ['qualification','experience','workSetting'].forEach((key,i)=>{if(![d.qualifications,d.experienceRanges,d.workSettings][i].includes(result[key]))result[key]='';});
    result.selectedDirections=result.selectedDirections.filter(id=>d.directions.some(x=>x.id===id));
    result.savedRoles=result.savedRoles.filter(id=>d.careerRoles.some(x=>x.id===id));
    result.savedCourses=result.savedCourses.filter(id=>d.careerRoles.some(x=>x.courses.some(c=>c.id===id)));
    for(const role of d.careerRoles){
      const values=data.jobSearch?.[role.id];if(!values||typeof values!=='object')continue;
      result.jobSearch[role.id]={};
      for(const key of ['job-keywords','job-location'])if(typeof values[key]==='string')result.jobSearch[role.id][key]=sanitizeText(values[key],160);
      for(const [key,allowed] of Object.entries({'job-experience':['','1','2','3','4'],'job-employment':['','F','P','C','I'],'job-workplace':['','1','2','3'],'job-date':['','r86400','r604800','r2592000']}))if(allowed.includes(values[key]))result.jobSearch[role.id][key]=values[key];
    }
    return result;
  }
  function workspacePayload() { return {assessment:state.assessment, history:state.history, theme:state.theme, viewport:state.viewport, savedUpdates:state.savedUpdates, savedUpdateItems:state.savedUpdateItems, displayName:state.displayName}; }
  function readWorkspace(data) {
    const w=data||{};
    state.savedUpdates=Array.isArray(w.savedUpdates)?w.savedUpdates.filter(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x)).slice(0,100):[];
    state.savedUpdateItems=window.NucleusUpdates.validate({schemaVersion:1,articles:Array.isArray(w.savedUpdateItems)?w.savedUpdateItems:[]}).articles.filter(item=>state.savedUpdates.includes(item.id));
    state.assessment=normalizeAssessment(w.assessment);
    state.history=Array.isArray(w.history)?w.history.slice(0,20).filter(h=>h&&typeof h==='object').map(h=>({id:sanitizeText(h.id,60),date:sanitizeText(h.date,40),assessment:normalizeAssessment(h.assessment)})):[];
    state.theme=w.theme==='dark'?'dark':'light';
    state.viewport='fullscreen';
  }
  function setSaveStatus(text, retry=false) {
    const notice=document.getElementById('workspace-save-notice'); if(notice) notice.hidden=!retry;
    const node=document.getElementById('workspace-save-status'); if(node) node.textContent=text;
    const button=document.getElementById('btn-retry-save'); if(button) button.hidden=!retry;
  }
  function saveState() {
    if(state.isGuest) {
      if(deviceStorageError){setSaveStatus('Device storage could not be loaded. Export a backup before clearing this workspace.',true);return;}
      if(window.NucleusPlatform?.native){
        setSaveStatus('Saving on this device...');
        window.NucleusPlatform.saveWorkspace(workspacePayload()).then(()=>setSaveStatus('Saved on this device')).catch(()=>setSaveStatus('Could not save. Export a backup before closing.',true));
        return;
      }
      try {localStorage.setItem(STORAGE_KEY,JSON.stringify(workspacePayload())); setSaveStatus('Saved on this device');}
      catch(e){setSaveStatus('Browser storage unavailable - keep this page open',true);}
      return;
    }
    if(!state.isAuthenticated) return;
    changeVersion++;
    setSaveStatus(sessionExpired?'Your session ended - sign in to save':syncBlocked?'Another device has newer changes':'Saving changes…',syncBlocked||sessionExpired);
    clearTimeout(saveTimer);
    if(!syncBlocked&&!sessionExpired) saveTimer=setTimeout(flushState,450);
  }
  async function flushState() {
    clearTimeout(saveTimer);
    if(state.isGuest || !state.isAuthenticated) return true;
    if(syncBlocked||sessionExpired) return false;
    if(savePromise) return savePromise;
    savePromise=(async()=>{
      while(savedVersion<changeVersion) {
        const version=changeVersion;
        try {
          const result=await window.NucleusAPI.request('workspace','PUT',{workspace:workspacePayload(),revision});
          revision=result.revision; savedVersion=version; setSaveStatus('Saved to your account');
        } catch(error) {
          syncBlocked=error.status===409;sessionExpired=error.status===401;
          setSaveStatus(sessionExpired?'Your session ended - sign in to save':syncBlocked?'Newer changes exist on another device. Review before continuing.':error.message,true);
          return false;
        }
      }
      return true;
    })();
    try{return await savePromise;} finally{savePromise=null;}
  }
  function acceptSession(result) {
    clearTimeout(saveTimer); state=freshState(); readWorkspace(result.workspace);
    state.user={...result.user,fullName:sanitizeText(result.user.fullName,60),username:sanitizeText(result.user.username,35),contact:sanitizeText(result.user.contact,80)};
    state.isAuthenticated=true; revision=result.revision||0; bookings=result.bookings||[];
    changeVersion=0;savedVersion=0;syncBlocked=false;sessionExpired=false;
    applyThemeAndViewport();renderWelcomeScreen();showScreen('screen-welcome',{replaceHistory:true});setSaveStatus('Saved to your account');
  }
  async function bootSession() {
    const epoch=++authEpoch;
    if(INSTALL_PREVIEW) {
      document.body.dataset.installPreview='true';
      document.getElementById('btn-settings-clear').hidden=false;
      document.getElementById('account-storage-note').textContent='Demonstration access uses one workspace on this device. Names do not create separate accounts. Export a backup before uninstalling or clearing app data. Cloud accounts and OTP are not enabled.';
      const edition=document.getElementById('app-edition');if(edition)edition.textContent=window.NucleusPlatform?.native?'Android - demonstration':'Web - demonstration';
      configureDemoLogin();
      try{await window.NucleusPlatform?.ready;}catch(error){deviceStorageError=true;}
      if(!window.NucleusPlatform?.native)await new Promise(resolve=>setTimeout(resolve,450));
      if(epoch===authEpoch){
        try{const saved=loadDeviceWorkspace();readWorkspace(saved);document.getElementById('login-name-input').value=window.NucleusDemo.name(saved.displayName);}catch{deviceStorageError=true;}
        applyThemeAndViewport();showScreen('screen-login',{replaceHistory:true});
        if(deviceStorageError)showLoginError('Device storage could not be loaded. Your existing data has not been replaced.');
      }
      window.dispatchEvent(new Event('nucleus-ready'));
      return;
    }
    try {const result=await window.NucleusAPI.request('session');backendReady=true;if(epoch!==authEpoch)return;
      if(result.user){acceptSession(result);return;}
    }catch(error){backendReady=false;}
    if(epoch!==authEpoch)return;
    document.getElementById('auth-service-note').textContent=backendReady?'Local pilot: accounts save to this Mac. Email / SMS verification is not connected.':'Account server unavailable. Start the Mac server or explore as a guest.';
    showScreen('screen-login',{replaceHistory:true});
  }
  function loadDeviceWorkspace() {
    return window.NucleusPlatform?.loadWorkspace?window.NucleusPlatform.loadWorkspace():JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  }
  function configureDemoLogin() {
    document.getElementById('demo-name-field').hidden=false;
    document.getElementById('login-name-input').required=true;
    document.getElementById('login-subtitle').textContent='Your next chapter starts here. Enter your name to explore your next career direction.';
    document.querySelector('label[for="login-contact-input"]').textContent='Email address';
    const email=document.getElementById('login-contact-input');email.type='email';email.placeholder='Enter the demonstration email';email.inputMode='email';email.autocapitalize='none';email.spellcheck=false;email.value='amirali@nml.com';email.readOnly=true;const password=document.getElementById('login-password-input');password.value='nml@123';password.readOnly=true;password.type='password';const eye=document.querySelector('[data-target="login-password-input"]');eye.setAttribute('aria-label','Show password');eye.setAttribute('aria-pressed','false');
    document.getElementById('auth-service-note').textContent='Demonstration access. Credentials are prefilled; your workspace stays on this device.';
    for(const id of ['btn-guest','btn-recover-account','btn-go-register','login-register-note'])document.getElementById(id).hidden=true;
  }
  function showLoginError(message) {
    const node=document.getElementById('login-error');node.textContent=message;node.hidden=!message;
  }
  function signOutDemo(clearName=false) {
    const name=clearName?'':state.displayName,theme=clearName?'light':state.theme;
    authEpoch++;demoUnlocked=false;state=freshState();state.theme=theme;bookings=[];
    document.getElementById('login-name-input').value=name;
    configureDemoLogin();
    document.getElementById('login-password-input').type='password';
    showLoginError('');setSaveStatus('');closeModal();applyThemeAndViewport();renderWelcomeScreen();showScreen('screen-login',{replaceHistory:true});
  }
  function enterGuest(name='') {
    if(INSTALL_PREVIEW&&!demoUnlocked)return;
    authEpoch++;state=freshState();state.isGuest=true;bookings=[];
    try{readWorkspace(loadDeviceWorkspace());}catch(e){deviceStorageError=true;}
    if(INSTALL_PREVIEW){state.displayName=window.NucleusDemo.name(name);state.user.fullName=state.displayName;}
    applyThemeAndViewport();renderWelcomeScreen();showScreen('screen-welcome',{replaceHistory:true});
    if(deviceStorageError)setSaveStatus('Device storage could not be loaded. Export a backup before closing.',true);
    else if(INSTALL_PREVIEW)saveState();else setSaveStatus('Workspace saved on this device');
  }
  function sanitizeText(input, maxLen) {
    if (!input) return "";
    return String(input)
      .replace(/[<>'"`]/g, "")
      .replace(/\u2014|\u2013/g, "-")
      .trim()
      .slice(0, maxLen || 80);
  }



  function preloadBannerImages() {
    setTimeout(() => {
      (window.NUCLEUS_DATA.heroBanners || []).forEach((sl) => {
        const img = new Image();
        img.decoding = "async";
        img.src = sl.image;
      });
    }, 120);
  }

  function getSvgIcon(name, size) {
    const s = size || 20;
    const icons = {
      close_x: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      chat_heart: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7.5c-.8-1-2.5-1-3.2.2-.6 1 .2 2.4 3.2 4.3 3-1.9 3.8-3.3 3.2-4.3-.7-1.2-2.4-1.2-3.2-.2z"/></svg>`,
      shield_pill: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9.5 14.5 5-5"/><path d="M10.5 9.5h4v4"/></svg>`,
      boxes_inventory: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.2 8.7 5"/></svg>`,
      file_clinical: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h4"/><path d="M9 9h2"/></svg>`,
      users_team: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      alert_ecg: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6"/><circle cx="19" cy="5" r="2.5"/></svg>`,
      user_rx: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M17 11h4m-2-2v4"/></svg>`,
      heart: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
      heart_pulse: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>`,
      apple_heart: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>`,
      microscope: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`,
      activity_person: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`,
      tooth: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3C4.5 3 3 5.2 3 8c0 2.4 1.2 4.3 2 6.5.7 1.9 1.1 5.5 2.8 5.5 1.4 0 1.8-3 4.2-3s2.8 3 4.2 3c1.7 0 2.1-3.6 2.8-5.5.8-2.2 2-4.1 2-6.5 0-2.8-1.5-5-4-5-2 0-3.2 1.2-5 1.2S9 3 7 3Z"/></svg>`,
      stethoscope: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,
      dna: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/></svg>`,
      building_med: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M10 6h4"/><path d="M12 4v4"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/></svg>`,
      brain: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/></svg>`,
      code_file: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>`,
      plus_shield: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>`,
      flask_user: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>`,
      doc_check: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>`,
      shield_alert: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      clipboard_check: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`,
      cpu_health: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>`,
      presentation_med: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/><path d="M12 7v5"/><path d="M9.5 9.5h5"/></svg>`,
      briefcase_med: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>`,
      grad_cap: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      pill: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
      leaf: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
      flask: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
      check: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      chevron_right: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
      chevron_down: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
      arrow_right: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
      map_pin: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
      printer: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
      download: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      refresh: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`
    };
    return icons[name] || icons.plus_shield;
  }

  function getToneColors(tone) {
    const map = {
      blue: { bg: "rgba(0, 130, 200, 0.13)", fg: "#0082C8" },
      teal: { bg: "rgba(0, 137, 123, 0.13)", fg: "#00897B" },
      emerald: { bg: "rgba(16, 185, 129, 0.14)", fg: "#059669" },
      purple: { bg: "rgba(99, 102, 241, 0.14)", fg: "#4F46E5" },
      indigo: { bg: "rgba(79, 70, 229, 0.13)", fg: "#4338CA" },
      coral: { bg: "rgba(225, 29, 72, 0.12)", fg: "#E11D48" },
      amber: { bg: "rgba(217, 119, 6, 0.14)", fg: "#D97706" },
      orange: { bg: "rgba(234, 88, 12, 0.14)", fg: "#EA580C" },
      cyan: { bg: "rgba(6, 182, 212, 0.14)", fg: "#0891B2" }
    };
    return map[tone] || map.blue;
  }

  // Right-Side Auto-Closing Timer Validation Popup
  function showTimerAlertToast(title, message, durationMs) {
    const toast = document.getElementById("timer-alert-toast");
    const titleEl = document.getElementById("timer-alert-title");
    const msgEl = document.getElementById("timer-alert-msg");
    const barEl = document.getElementById("timer-alert-bar");
    if (!toast || !titleEl || !msgEl || !barEl) return;

    if (alertToastInterval) clearInterval(alertToastInterval);

    titleEl.textContent = title || "Selection Required";
    msgEl.textContent = message;
    barEl.style.width = "100%";
    toast.classList.add("visible");

    const total = durationMs || 3400;
    const start = Date.now();
    alertToastInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / total) * 100);
      barEl.style.width = pct + "%";
      if (elapsed >= total) {
        clearInterval(alertToastInterval);
        toast.classList.remove("visible");
      }
    }, 50);
  }

  // Shared keyboard and touch dropdown.
  function renderCustomDropdown(containerId, optionsList, currentValue, placeholderText, onSelect) {
    const host=document.getElementById(containerId);if(!host)return;
    window.NucleusSelect.mount(host,optionsList,currentValue,placeholderText,onSelect);
  }

  function showScreen(screenId, options) {
    const opts = options || {};
    window.NucleusSelect?.close();

    if (screenId === "screen-settings" && currentScreenId !== "screen-settings") {
      previousScreenBeforeSettings = currentScreenId;
    }

    const publicScreens=['screen-splash','screen-login','screen-register','screen-account-setup','screen-buffer'];
    if(INSTALL_PREVIEW&&!demoUnlocked&&screenId!=='screen-splash')screenId='screen-login';
    if(!state.isAuthenticated&&!state.isGuest&&!publicScreens.includes(screenId)) screenId='screen-login';
    if((state.isAuthenticated||(INSTALL_PREVIEW&&state.isGuest))&&['screen-login','screen-register','screen-account-setup'].includes(screenId)) screenId='screen-welcome';
    if(!document.getElementById(screenId)) screenId='screen-welcome';
    currentScreenId = screenId;
    document.body.dataset.screen=screenId;
    const activeTab=({'screen-compare':'compare','screen-saved':'saved','screen-updates':'updates'})[screenId]||'home';
    document.querySelectorAll('[data-nav]').forEach(button=>{if(button.dataset.nav===activeTab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});

    document.querySelectorAll(".app-screen").forEach((el) => {
      el.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
    }

    const settingsBtn = document.getElementById("btn-open-settings");
    if (settingsBtn) {
      settingsBtn.classList.toggle("active-settings", screenId === "screen-settings");
    }

    if (!isHandlingPopState && !opts.skipHistory && screenId !== "screen-splash" && screenId !== "screen-buffer") {
      try {
        const method=opts.replaceHistory?'replaceState':'pushState';
        if(window.history.state?.screenId!==screenId||opts.replaceHistory) window.history[method]({screenId},'', '#'+screenId);
      } catch (e) {}
    }

    const stepHeader = document.getElementById("step-progress-header");
    const stepMap = {
      "screen-profession": { step: 1, total: 5, back: "screen-welcome" },
      "screen-profile": { step: 2, total: 5, back: "screen-profession" },
      "screen-direction": { step: 3, total: 5, back: "screen-profile" },
      "screen-matches": { step: 4, total: 5, back: "screen-direction" },
      "screen-report": { step: 5, total: 5, back: "screen-matches" },
      "screen-cta": { step: 5, total: 5, back: "screen-report" }
    };

    if (stepHeader) {
      if (stepMap[screenId]) {
        const info = stepMap[screenId];
        stepHeader.style.display = "flex";
        const pct = Math.round((info.step / info.total) * 100);
        document.getElementById("step-fill-bar").style.width = pct + "%";
        document.getElementById("step-counter-label").textContent =
          "Step " + info.step + " of " + info.total;
        stepHeader.dataset.backTarget = info.back;
      } else {
        stepHeader.style.display = "none";
      }
    }

    const reportActions = document.getElementById("topbar-report-actions");
    if (reportActions) {
      reportActions.style.display = screenId === "screen-report" ? "inline-flex" : "none";
    }

    updateSavedBadge();

    if (!opts.skipScroll) {
      const viewport = document.querySelector(".screen-viewport");
      if (viewport) viewport.scrollTop = 0;
      const heading=target && target.querySelector('h1,h2');
      if(heading){heading.tabIndex=-1;heading.classList.add('screen-focus-target');heading.focus({preventScroll:true});}
    }
  }

  window.addEventListener('popstate', event=>{
    closeModal();isHandlingPopState=true;
    let screen=event.state?.screenId || (state.isAuthenticated||state.isGuest?'screen-welcome':'screen-login');
    if(screen==='screen-profile')renderProfileScreen();
    if(screen==='screen-profession')renderProfessionScreen('');
    if(screen==='screen-direction')renderDirectionsScreen();
    if(screen==='screen-matches')renderMatchesScreen(false);
    if(screen==='screen-report')renderDetailedReportScreen();
    if(screen==='screen-welcome')renderWelcomeScreen();
    if(screen==='screen-compare')openComparisonModal();
    if(screen==='screen-saved')openSavedModal();
    if(screen==='screen-updates')openUpdatesScreen();
    showScreen(screen,{skipHistory:true});isHandlingPopState=false;
  });

  // Animated 0-to-% Circular SVG Match Gauge Helper
  function animateCircularGauge(circleEl, textEl, targetScore, radius, durationMs) {
    if (!circleEl || !textEl) return;
    const circumference = 2 * Math.PI * radius;
    circleEl.style.strokeDasharray = circumference.toFixed(1);
    circleEl.style.strokeDashoffset = circumference.toFixed(1);

    const duration = durationMs || 900;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      circleEl.style.strokeDashoffset=String(circumference-(targetScore/100)*circumference);textEl.textContent=targetScore+'/100';return;
    }
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * targetScore);
      const currentOffset = circumference - (eased * targetScore / 100) * circumference;

      circleEl.style.strokeDashoffset = currentOffset.toFixed(1);
      textEl.textContent = currentVal + "/100";

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Contextual Buffer Loader Runner
  function runBufferLoader(config, onComplete) {
    const titleEl = document.getElementById("buffer-loader-title");
    const subEl = document.getElementById("buffer-loader-subtitle");
    const barEl = document.getElementById("buffer-loader-bar");
    const stepsEl = document.getElementById("buffer-loader-steps");

    if (titleEl) titleEl.textContent = config.title;
    if (subEl) subEl.textContent = config.subtitle;
    if (barEl) barEl.style.width = "6%";

    if (stepsEl) {
      stepsEl.innerHTML = config.steps
        .map(
          (st, idx) => `
        <div class="buffer-step-item ${idx === 0 ? "active" : ""}" id="buf-step-${idx}">
          <span class="buf-icon">${getSvgIcon("check", 15)}</span>
          <span>${st}</span>
        </div>`
        )
        .join("");
    }

    showScreen("screen-buffer", { skipHistory: true });

    const totalMs = config.durationMs || 3200;
    const stepInterval = Math.floor(totalMs / config.steps.length);

    config.steps.forEach((_, idx) => {
      setTimeout(() => {
        if (barEl) {
          barEl.style.width = Math.round(((idx + 1) / config.steps.length) * 100) + "%";
        }
        for (let j = 0; j <= idx; j++) {
          const item = document.getElementById("buf-step-" + j);
          if (item) {
            item.classList.remove("active");
            item.classList.add("done");
          }
        }
        const nextItem = document.getElementById("buf-step-" + (idx + 1));
        if (nextItem) nextItem.classList.add("active");
      }, stepInterval * (idx + 1) - 200);
    });

    setTimeout(() => {
      if (typeof onComplete === "function") onComplete();
    }, totalMs);
  }

  // Transparent rules-based readiness estimate.


  function computeRankedCareerMatches() {
    return window.NucleusEngine.rank(window.NUCLEUS_DATA,state.assessment);
  }

  function renderWelcomeScreen() {
    const greetEl = document.getElementById("welcome-user-greeting");
    if (greetEl) {
      const displayName = state.user.fullName || "Healthcare Professional";
      greetEl.textContent = "Hi there, " + displayName;
    }

    renderHeroCarousel();
    renderDashboard();

    const popContainer = document.getElementById("popular-transitions-grid");
    if (!popContainer) return;

    popContainer.innerHTML = window.NUCLEUS_DATA.popularTransitions
      .map((item) => {
        const colors = getToneColors(item.tone);
        return `
        <div role="button" tabindex="0" class="popular-card" data-pop-id="${item.id}">
          <div class="popular-card-icon" style="background:${colors.bg};color:${colors.fg}">
            ${getSvgIcon(item.iconType, 19)}
          </div>
          <div>
            <div class="popular-from">${item.fromLabel}</div>
            <div class="popular-to">to ${item.toLabel}</div>
          </div>
        </div>`;
      })
      .join("");

    popContainer.querySelectorAll(".popular-card").forEach((card) => {
      card.addEventListener("click", () => {
        const popId = card.getAttribute("data-pop-id");
        const pop = window.NUCLEUS_DATA.popularTransitions.find((p) => p.id === popId);
        if (!pop) return;
        state.assessment.selectedDirections=[pop.toDirectionId];
        state.assessment.selectedRoleId=pop.toRoleId;
        if(!state.assessment.professionId) state.assessment.professionId=pop.fromId;
        saveState();
        if(!hasProfile()){renderProfileScreen();showScreen('screen-profile');}
        else {renderDetailedReportScreen();showScreen('screen-report');}
      });
    });
  }

  function renderHeroCarousel() {
    const trackEl = document.getElementById("hero-carousel-track");
    const dotsEl = document.getElementById("hero-carousel-dots");
    const shellEl = document.getElementById("hero-carousel-shell");
    if (!trackEl || !dotsEl) return;

    const slides = window.NUCLEUS_DATA.heroBanners || [];
    trackEl.innerHTML = slides
      .map(
        (sl) => `
      <div class="hero-slide ${sl.layout === "text-right" ? "layout-text-right" : "layout-text-left"}">
        <img
          src="${sl.image}"
          alt=""
          decoding="async"
          class="hero-slide-bg-img"
        />
        <div class="hero-slide-text">
          <span class="hero-slide-badge">${sl.badge}</span>
          <h2 class="hero-title">${sl.title}</h2>
          <p class="hero-desc">${sl.desc}</p>
        </div>
      </div>`
      )
      .join("");

    dotsEl.innerHTML = slides
      .map(
        (_, idx) =>
          `<button type="button" class="hero-dot ${idx === currentHeroSlide ? "active" : ""}" data-slide-idx="${idx}" aria-label="Slide ${idx + 1}"></button>`
      )
      .join("");

    dotsEl.querySelectorAll(".hero-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.getAttribute("data-slide-idx"), 10);
        goToHeroSlide(idx);
        restartHeroCarouselTimer();
      });
    });

    if (shellEl && !shellEl.dataset.swipeBound) {
      shellEl.dataset.swipeBound = "1";
      let startX = 0;
      shellEl.addEventListener(
        "touchstart",
        (e) => {
          isHeroPaused = true;
          if (e.touches && e.touches.length > 0) {
            startX = e.touches[0].clientX;
          }
        },
        { passive: true }
      );
      shellEl.addEventListener(
        "touchend",
        (e) => {
          isHeroPaused = false;
          if (!e.changedTouches || e.changedTouches.length === 0) return;
          const diffX = e.changedTouches[0].clientX - startX;
          if (Math.abs(diffX) > 40) {
            if (diffX < 0) {
              goToHeroSlide((currentHeroSlide + 1) % slides.length);
            } else {
              goToHeroSlide((currentHeroSlide - 1 + slides.length) % slides.length);
            }
            restartHeroCarouselTimer();
          }
        },
        { passive: true }
      );
      shellEl.addEventListener('touchcancel',()=>{isHeroPaused=false;restartHeroCarouselTimer();},{passive:true});
    }

    goToHeroSlide(currentHeroSlide);
    restartHeroCarouselTimer();
  }

  function goToHeroSlide(index) {
    const slides = window.NUCLEUS_DATA.heroBanners || [];
    if (!slides.length) return;
    currentHeroSlide = ((index % slides.length) + slides.length) % slides.length;
    const trackEl = document.getElementById("hero-carousel-track");
    if (trackEl) {
      trackEl.style.transform = "translateX(-" + currentHeroSlide * 100 + "%)";
      trackEl.querySelectorAll(".hero-slide").forEach((slide,i)=>slide.setAttribute("aria-hidden",String(i!==currentHeroSlide)));
    }
    document.querySelectorAll("#hero-carousel-dots .hero-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentHeroSlide);
      dot.setAttribute("aria-pressed", String(idx === currentHeroSlide));
    });
  }

  function restartHeroCarouselTimer() {
    if (heroTimerTickInterval) clearInterval(heroTimerTickInterval);
    heroTimerProgress = 0;
    const fillEl = document.getElementById("hero-timer-fill");
    if (fillEl) fillEl.style.width = "0%";

    const slides = window.NUCLEUS_DATA.heroBanners || [];
    if (!slides.length) return;

    heroTimerTickInterval = setInterval(() => {
      const keyboardFocus=document.activeElement?.matches(':focus-visible')&&document.getElementById('hero-carousel-shell')?.contains(document.activeElement);
      if (isHeroPaused || keyboardFocus || document.hidden || currentScreenId!=="screen-welcome" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      heroTimerProgress += 1;
      if (fillEl) fillEl.style.width = Math.min(100, heroTimerProgress / 30 * 100) + "%";
      if (heroTimerProgress >= 30) {
        heroTimerProgress = 0;
        goToHeroSlide((currentHeroSlide + 1) % slides.length);
      }
    }, 100);
  }

  function renderProfessionScreen(filterQuery) {
    const listEl = document.getElementById("profession-list-container");
    const proceedBtn = document.getElementById("btn-step1-proceed");
    if (!listEl) return;

    const q = (filterQuery || "").toLowerCase().trim();
    const filtered = window.NUCLEUS_DATA.professions.filter((prof) => {
      if (!q) return true;
      return (
        prof.title.toLowerCase().indexOf(q) !== -1 ||
        prof.subtitle.toLowerCase().indexOf(q) !== -1
      );
    });

    listEl.innerHTML = filtered
      .map((prof) => {
        const colors = getToneColors(prof.color);
        const isSelected = state.assessment.professionId === prof.id;
        return `
        <div role="radio" tabindex="0" aria-checked="${isSelected}" class="profession-item ${isSelected ? "selected" : ""}" data-prof-id="${prof.id}">
          <div class="profession-item-left">
            <div class="prof-icon-badge" style="background:${colors.bg};color:${colors.fg}">
              ${getSvgIcon(prof.icon, 19)}
            </div>
            <div>
              <div class="prof-title">${prof.title}</div>
              <div class="prof-sub">${prof.subtitle}</div>
            </div>
          </div>
          <div class="prof-select-radio">${getSvgIcon("check", 13)}</div>
        </div>`;
      })
      .join("");

    if(!filtered.length) listEl.innerHTML='<div class="empty-state">No professions match. Try a shorter search or choose Other healthcare.</div>';
    const selectedProfObj = window.NUCLEUS_DATA.professions.find(
      (p) => p.id === state.assessment.professionId
    );
    if (proceedBtn) {
      if (selectedProfObj) {
        proceedBtn.innerHTML = `<span>Proceed to Profile (${selectedProfObj.title})</span> ${getSvgIcon("arrow_right", 17)}`;
      } else {
        proceedBtn.innerHTML = `<span>Proceed to Profile</span> ${getSvgIcon("arrow_right", 17)}`;
      }
    }

    listEl.querySelectorAll(".profession-item").forEach((row) => {
      row.addEventListener("click", () => {
        const profId = row.getAttribute("data-prof-id");
        state.assessment.professionId = profId;
        // Smart Auto-Sync for Fresh Graduate / Clinical Intern
        if (profId === "fresh_graduate") {
          if (!state.assessment.experience) {
            state.assessment.experience = "Fresher / Internship (0-1 year)";
          }
          if (!state.assessment.workSetting) {
            state.assessment.workSetting = "Academic Institution / Fresh Graduate";
          }
        }
        saveState();
        renderProfessionScreen(filterQuery);
      });
    });
  }

  function renderProfileScreen() {
    renderCustomDropdown(
      "dd-qualification-host",
      window.NUCLEUS_DATA.qualifications,
      state.assessment.qualification,
      "Select Highest qualification",
      (val) => {
        state.assessment.qualification = val;
        saveState();
      }
    );

    renderCustomDropdown(
      "dd-experience-host",
      window.NUCLEUS_DATA.experienceRanges,
      state.assessment.experience,
      "Select Years of Experience",
      (val) => {
        state.assessment.experience = val;
        saveState();
      }
    );

    renderCustomDropdown(
      "dd-setting-host",
      window.NUCLEUS_DATA.workSettings,
      state.assessment.workSetting,
      "Select Current work setting",
      (val) => {
        state.assessment.workSetting = val;
        saveState();
      }
    );

    const respContainer = document.getElementById("profile-responsibilities-list");
    if (respContainer) {
      respContainer.innerHTML = window.NUCLEUS_DATA.responsibilitiesList
        .map((item) => {
          const respLabel = item.label || item;
          const colors = getToneColors(item.tone || "blue");
          const checked = state.assessment.responsibilities.indexOf(respLabel) !== -1;
          return `
          <div role="checkbox" tabindex="0" aria-checked="${checked}" class="checkbox-row ${checked ? "checked" : ""}" data-resp="${respLabel}">
            <div class="checkbox-row-left">
              <span class="resp-icon-box" style="background:${colors.bg};color:${colors.fg}">
                ${getSvgIcon(item.icon || "clipboard_check", 18)}
              </span>
              <span>${respLabel}</span>
            </div>
            <span class="custom-check">${checked ? getSvgIcon("check", 13) : ""}</span>
          </div>`;
        })
        .join("");

      respContainer.querySelectorAll(".checkbox-row").forEach((row) => {
        row.addEventListener("click", () => {
          const val = row.getAttribute("data-resp");
          const idx = state.assessment.responsibilities.indexOf(val);
          if (idx === -1) {
            state.assessment.responsibilities.push(val);
          } else {
            state.assessment.responsibilities.splice(idx, 1);
          }
          saveState();
          renderProfileScreen();
        });
      });
    }

    renderSkillChipsAndSuggestions();
  }

  function renderSkillChipsAndSuggestions() {
    const chipsContainer = document.getElementById("profile-skill-chips");
    const suggestionsContainer = document.getElementById("profile-suggested-skills");
    if (!chipsContainer || !suggestionsContainer) return;

    const activeSkills = state.assessment.additionalSkills || [];

    if (activeSkills.length === 0) {
      chipsContainer.innerHTML = `<span style="font-size:12px;color:var(--text-muted)">Tap any suggested skill below or type a custom skill...</span>`;
    } else {
      chipsContainer.innerHTML = activeSkills
        .map(
          (sk, idx) => `
        <span class="skill-chip">
          <span>${esc(sk)}</span>
          <button type="button" class="skill-chip-remove" data-skill-idx="${idx}" aria-label="Remove skill">
            ${getSvgIcon("close_x", 11)}
          </button>
        </span>`
        )
        .join("");

      chipsContainer.querySelectorAll(".skill-chip-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-skill-idx"), 10);
          state.assessment.additionalSkills.splice(idx, 1);
          saveState();
          renderSkillChipsAndSuggestions();
        });
      });
    }

    const pool = window.NUCLEUS_DATA.suggestedAdditionalSkills || [];
    suggestionsContainer.innerHTML = pool
      .map((sk) => {
        const isAdded = activeSkills.indexOf(sk) !== -1;
        return `
        <button type="button" class="suggested-skill-pill ${isAdded ? "added" : ""}" data-sug-skill="${sk}">
          <span>${isAdded ? "Added:" : "+"}</span>
          <span>${esc(sk)}</span>
        </button>`;
      })
      .join("");

    suggestionsContainer.querySelectorAll(".suggested-skill-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const sk = pill.getAttribute("data-sug-skill");
        const idx = state.assessment.additionalSkills.indexOf(sk);
        if (idx === -1) {
          state.assessment.additionalSkills.push(sk);
        } else {
          state.assessment.additionalSkills.splice(idx, 1);
        }
        saveState();
        renderSkillChipsAndSuggestions();
      });
    });
  }

  // Render Step 3 (12 Healthcare & Pharma Directions)
  function renderDirectionsScreen() {
    const gridEl = document.getElementById("directions-grid-container");
    if (!gridEl) return;

    gridEl.innerHTML = window.NUCLEUS_DATA.directions
      .map((dir) => {
        const isSelected = state.assessment.selectedDirections.indexOf(dir.id) !== -1;
        const colors = getToneColors(dir.tone);
        return `
        <div role="checkbox" tabindex="0" aria-checked="${isSelected}" class="direction-card ${isSelected ? "selected" : ""}" data-dir-id="${dir.id}">
          <div class="direction-check-indicator">${getSvgIcon("check", 13)}</div>
          <div class="direction-icon-circle" style="background:${colors.bg};color:${colors.fg}">
            ${getSvgIcon(dir.icon, 20)}
          </div>
          <div class="direction-title">${dir.title}</div>
          <div class="direction-sub">${dir.subtitle}</div>
        </div>`;
      })
      .join("");

    gridEl.querySelectorAll(".direction-card").forEach((card) => {
      card.addEventListener("click", () => {
        const dirId = card.getAttribute("data-dir-id");
        const idx = state.assessment.selectedDirections.indexOf(dirId);
        if (idx === -1) {
          state.assessment.selectedDirections.push(dirId);
        } else {
          state.assessment.selectedDirections.splice(idx, 1);
        }
        saveState();
        renderDirectionsScreen();
      });
    });
  }

  // Render Step 4 (Ranked Career Matches)
  function renderMatchesScreen(animateGauges) {
    const container = document.getElementById("career-matches-container");
    const proceedBtn = document.getElementById("btn-step4-proceed");
    if (!container) return;

    const ranked = computeRankedCareerMatches();

    container.innerHTML = ranked
      .map((role, index) => {
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (role.computedScore / 100) * circumference;
        const strokeColor = role.computedScore >= 84 ? "#10B981" : "#0082C8";
        const isSelected = state.assessment.selectedRoleId === role.id;

        return `
        <div role="radio" tabindex="0" aria-checked="${isSelected}" class="career-match-card ${isSelected ? "selected" : ""}" data-role-id="${role.id}">
          <div class="gauge-ring-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="${radius}" fill="none" stroke="rgba(148, 163, 184, 0.22)" stroke-width="5"/>
              <circle class="match-card-arc" data-target="${role.computedScore}" cx="28" cy="28" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="5"
                stroke-dasharray="${circumference.toFixed(1)}"
                stroke-dashoffset="${offset.toFixed(1)}"
                stroke-linecap="round"
                transform="rotate(-90 28 28)"/>
            </svg>
            <div class="gauge-ring-text match-card-pct" data-target="${role.computedScore}">${role.computedScore}/100</div>
          </div>
          <div class="career-match-info">
            <div class="career-match-top-row">
              <span class="rank-pill-clean">#${index + 1}</span>
              <div class="career-match-title">${role.title}</div>
            </div>
            <div class="career-badges-row">
              ${role.interestSelected ? '<span class="badge-pill badge-match-high">Your interest</span>' : ''}
              <span class="badge-pill badge-match-high">${role.readinessLabel}</span>
              <span class="badge-pill badge-diff-mod">${role.difficulty}</span>
              <span class="badge-pill badge-salary">${role.scaledSalaryRange} · illustrative</span>
            </div>
          </div>
          <div class="prof-select-radio" style="${isSelected ? "background:var(--brand-blue);border-color:var(--brand-blue);color:#FFF" : ""}">
            ${getSvgIcon("check", 13)}
          </div>
        </div>`;
      })
      .join("");

    const selectedRoleObj = ranked.find((r) => r.id === state.assessment.selectedRoleId);
    if (proceedBtn) {
      if (selectedRoleObj) {
        proceedBtn.innerHTML = `<span>Proceed to Check for ${selectedRoleObj.title}</span> ${getSvgIcon("arrow_right", 17)}`;
      } else {
        proceedBtn.innerHTML = `<span>Select a Career Option Above to Proceed</span> ${getSvgIcon("arrow_right", 17)}`;
      }
    }

    if (animateGauges) {
      container.querySelectorAll(".career-match-card").forEach((card) => {
        const arc = card.querySelector(".match-card-arc");
        const pct = card.querySelector(".match-card-pct");
        const target = parseInt(arc.getAttribute("data-target"), 10);
        animateCircularGauge(arc, pct, target, 22, 900);
      });
    }

    container.querySelectorAll(".career-match-card").forEach((card) => {
      card.addEventListener("click", () => {
        const roleId = card.getAttribute("data-role-id");
        state.assessment.selectedRoleId = roleId;
        saveState();
        renderMatchesScreen(false);
      });
    });
  }

  // Render Step 5 Detailed Career Transition Report
  function renderDetailedReportScreen() {
    const prof =
      window.NUCLEUS_DATA.professions.find((p) => p.id === state.assessment.professionId) ||
      window.NUCLEUS_DATA.professions[0];
    const ranked = computeRankedCareerMatches();
    const role =
      ranked.find((r) => r.id === state.assessment.selectedRoleId) || ranked[0];

    const routeEl = document.getElementById("report-hero-route-title");
    const fitEl = document.getElementById("report-hero-fit-pill");
    const diffEl = document.getElementById("report-hero-diff-pill");
    const salaryEl = document.getElementById("report-hero-salary-pill");
    const heroArc = document.getElementById("report-hero-gauge-arc");
    const heroPct = document.getElementById("report-hero-gauge-pct");

    if (routeEl) {
      routeEl.textContent = prof.title + " to " + role.title;
    }
    if (fitEl) {
      fitEl.textContent = role.computedScore + "/100 Readiness estimate";
    }
    if (diffEl) {
      diffEl.textContent = role.difficultyShort;
    }
    if (salaryEl) {
      salaryEl.textContent = role.scaledSalaryRange + " · illustrative";
    }

    if (heroArc && heroPct) {
      animateCircularGauge(heroArc, heroPct, role.computedScore, 29, 1000);
    }

    const heartBtn = document.getElementById("btn-save-favorite-role");
    if (heartBtn) {
      const isSaved = (state.assessment.savedRoles || []).indexOf(role.id) !== -1;
      heartBtn.classList.toggle("active-heart", isSaved);
    }
    updateSavedBadge();

    const overviewSummaryEl = document.getElementById("report-overview-summary");
    const overviewInsightsEl = document.getElementById("report-overview-insights");
    if (overviewSummaryEl) {
      overviewSummaryEl.textContent = "Explore " + role.title + ". Your readiness estimate uses the profile and skills you entered; it does not establish hiring eligibility.";
      renderReadinessExplanation(role);
    }
    if (overviewInsightsEl) {
      overviewInsightsEl.innerHTML = role.keyInsights
        .map(
          (ins) => `
        <div class="insight-row">
          <span class="skill-item-icon" style="background:var(--brand-emerald-soft);color:var(--brand-teal)">${getSvgIcon("check", 12)}</span>
          <span>${ins}</span>
        </div>`
        )
        .join("");
    }

    const buckets=window.NucleusEngine.skillsFor(role,state.assessment,prof);
    const currentSkills=buckets.current, transferSkills=buckets.transferable, gapSkills=buckets.gaps;
    const gapCard=document.getElementById('card-bucket-gap');gapCard.classList.toggle('skills-complete',gapSkills.length===0);
    gapCard.querySelector('.bucket-icon-box').innerHTML=getSvgIcon(gapSkills.length?'clipboard_check':'check',20);
    gapCard.querySelector('.bucket-header > div:last-child > div:first-child').textContent=gapSkills.length?'Skills to develop':'Skills confirmed';
    gapCard.querySelector('.view-all-link').textContent=gapSkills.length?'Review and confirm skills':'Review confirmed skills';
    [['current',currentSkills],['transfer',transferSkills],['gap',gapSkills]].forEach(([key,items])=>{
      const card=document.getElementById('card-bucket-'+key);
      card.querySelector('.bucket-count-badge').textContent=items.length+' skills';
      card.querySelector('.view-all-link').textContent=key==='gap'?(gapSkills.length?'Review and confirm skills':'Review confirmed skills'):'View all '+items.length+' skills';
    });
    const currentListEl = document.getElementById("skills-current-preview");
    const transferListEl = document.getElementById("skills-transfer-preview");
    const gapListEl = document.getElementById("skills-gap-preview");

    if (currentListEl) {
      currentListEl.innerHTML = currentSkills
        .slice(0, 5)
        .map(
          (sk) => `
        <div class="skill-mini-item">
          <span class="skill-item-icon" style="background:var(--brand-emerald-soft);color:var(--brand-teal)">${getSvgIcon("check", 12)}</span>
          <span>${esc(sk)}</span>
        </div>`
        )
        .join("");
    }

    if (transferListEl) {
      transferListEl.innerHTML = transferSkills
        .slice(0, 5)
        .map(
          (sk) => `
        <div class="skill-mini-item">
          <span class="skill-item-icon" style="background:var(--brand-blue-soft);color:var(--brand-blue)">${getSvgIcon("check", 12)}</span>
          <span>${esc(sk)}</span>
        </div>`
        )
        .join("");
    }

    if (gapListEl) {
      gapListEl.innerHTML = gapSkills
        .slice(0, 6)
        .map(
          (sk) => `
        <div class="skill-mini-item">
          <span class="skill-item-icon" style="background:rgba(225,29,72,0.16);color:var(--brand-rose)">${getSvgIcon("check", 12)}</span>
          <span>${esc(sk)}</span>
        </div>`
        )
        .join("");
    }

    if(!gapSkills.length)gapListEl.innerHTML='<p class="completion-message">All listed skills confirmed. You can review or change your selections.</p>';
    renderInteractiveRoadmap(role);

    renderReportJobsList(role);

    const coursesListEl = document.getElementById("report-courses-list");
    if (coursesListEl) {
      coursesListEl.innerHTML = role.courses
        .map((c) => {
          const isCourseSaved = (state.assessment.savedCourses || []).indexOf(c.id) !== -1;
          return `
          <div class="insight-card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="badge-pill badge-match-high">Learning topic</span>
              <span style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-muted)">Explore provider catalogues</span>
            </div>
            <div style="font-family:var(--font-heading);font-size:15px;font-weight:600;color:var(--text-primary)">${c.title}</div>
            <div style="font-size:12.5px;color:var(--text-secondary)">Choose a provider and verify the syllabus, eligibility, fees and recognition.</div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <button type="button" class="btn-secondary btn-save-course" data-course-id="${c.id}" data-course-title="${c.title}" style="padding:9px 12px;font-size:12.5px;flex:1;${isCourseSaved ? "border-color:#E11D48;color:#E11D48;background:rgba(225,29,72,0.08)" : ""}">
                <span>${isCourseSaved ? "Saved" : "Save course"}</span>
              </button>
              <button type="button" class="btn-primary btn-enroll-course" data-course-title="${c.title}" style="padding:9px 12px;font-size:12.5px;flex:1.3">
                <span>Find courses</span>
                ${getSvgIcon("arrow_right", 14)}
              </button>
            </div>
          </div>`;
        })
        .join("");

      coursesListEl.querySelectorAll(".btn-save-course").forEach((btn) => {
        btn.addEventListener("click", () => {
          const cid = btn.getAttribute("data-course-id");
          if (!state.assessment.savedCourses) state.assessment.savedCourses = [];
          const idx = state.assessment.savedCourses.indexOf(cid);
          if (idx === -1) {
            state.assessment.savedCourses.push(cid);
          } else {
            state.assessment.savedCourses.splice(idx, 1);
          }
          saveState();
          renderDetailedReportScreen();
        });
      });

      coursesListEl.querySelectorAll(".btn-enroll-course").forEach((btn) => {
        btn.addEventListener("click", () => {
          const topic=btn.getAttribute('data-course-title');
          openModal('Explore courses',`<p>Search provider catalogues for ${esc(topic)}. These links do not confirm enrolment, price or accreditation.</p><div class="feature-explainer"><a class="btn-primary feature-action" data-external-link href="https://www.coursera.org/search?query=${encodeURIComponent(topic)}">Search Coursera</a><a class="btn-secondary feature-action" data-external-link href="https://www.edx.org/search?q=${encodeURIComponent(topic)}">Search edX</a><a class="btn-secondary feature-action" data-external-link href="https://nucleusmedlabs.com/contact">Discuss learning with Nucleus MedLabs</a></div>`);
        });
      });
    }

    activateReportSubTab(state.assessment.activeReportTab || "overview", "none");
  }

  function renderInteractiveRoadmap(role) {
    const roadmapListEl = document.getElementById("report-roadmap-timeline");
    const estTimeEl = document.getElementById("report-est-timeline-value");
    const progressPctEl = document.getElementById("roadmap-progress-pct");
    const progressFillEl = document.getElementById("roadmap-progress-fill");
    if (!roadmapListEl) return;

    if (!state.assessment.completedRoadmapSteps) {
      state.assessment.completedRoadmapSteps = {};
    }
    const roleDoneMap = state.assessment.completedRoadmapSteps[role.id] || {};
    const doneCount = Object.keys(roleDoneMap).filter((k) => roleDoneMap[k]).length;
    const pct = Math.round((doneCount / role.roadmap.length) * 100);

    if (progressPctEl) progressPctEl.textContent = pct + "% Completed";
    if (progressFillEl) progressFillEl.style.width = pct + "%";

    roadmapListEl.innerHTML = role.roadmap
      .map((item) => {
        const isDone = !!roleDoneMap[item.step];
        return `
        <div role="checkbox" tabindex="0" aria-checked="${isDone}" class="roadmap-step-card ${isDone ? "completed" : ""}" data-step-num="${item.step}">
          <div class="roadmap-num-circle">${isDone ? getSvgIcon("check", 15) : item.step}</div>
          <div class="roadmap-step-body">
            <div class="roadmap-step-top">
              <div class="roadmap-step-title">${item.title}</div>
              <span class="roadmap-duration-pill ${item.duration === "Ongoing" ? "ongoing" : ""}">${item.duration}</span>
            </div>
            <div style="font-size:12.5px;color:var(--text-secondary);margin-top:4px">${item.desc}</div>
          </div>
        </div>`;
      })
      .join("");

    if (estTimeEl) estTimeEl.textContent = role.timeline;

    roadmapListEl.querySelectorAll(".roadmap-step-card").forEach((card) => {
      card.addEventListener("click", () => {
        const stepNum = card.getAttribute("data-step-num");
        if (!state.assessment.completedRoadmapSteps[role.id]) {
          state.assessment.completedRoadmapSteps[role.id] = {};
        }
        state.assessment.completedRoadmapSteps[role.id][stepNum] =
          state.assessment.completedRoadmapSteps[role.id][stepNum] ? false : indiaDate();
        saveState();
        renderInteractiveRoadmap(role);
      });
    });
  }

  function renderReportJobsList(role) {
    const host=document.getElementById('report-jobs-container');
    host.innerHTML=`<div class="job-search-summary"><strong>${esc(role.title)}</strong><p>Search current listings using your career direction and preferences. Availability and requirements are confirmed on LinkedIn.</p></div>`;
    const fields={'job-keywords':role.title,'job-location':state.assessment.preferredCity||'India','job-experience':'','job-employment':'','job-workplace':'','job-date':'r604800'};
    for(const [id,value] of Object.entries(fields)){
      const input=document.getElementById(id);input.value=state.assessment.jobSearch?.[role.id]?.[id]??value;
      input.onchange=()=>{state.assessment.jobSearch??={};state.assessment.jobSearch[role.id]??={};state.assessment.jobSearch[role.id][id]=input.value;saveState();};
    }
  }
  function openLiveLinkedInSearch() {
    const keyword=document.getElementById('job-keywords').value.trim()||activeRole().title;
    const location=document.getElementById('job-location').value.trim()||'India';
    const query=new URLSearchParams({keywords:keyword,location});
    for(const [id,key] of [['job-experience','f_E'],['job-employment','f_JT'],['job-workplace','f_WT'],['job-date','f_TPR']]){
      const value=document.getElementById(id).value;if(value)query.set(key,value);
    }
    window.NucleusPlatform.openExternal('https://www.linkedin.com/jobs/search/?'+query.toString());
  }

  function activateReportSubTab(tabName, slideDir) {
    const prevIdx = REPORT_TABS_ORDER.indexOf(state.assessment.activeReportTab || "overview");
    const nextIdx = REPORT_TABS_ORDER.indexOf(tabName);
    let direction = slideDir;
    if (!direction && prevIdx !== nextIdx) {
      direction = nextIdx > prevIdx ? "right" : "left";
    }

    state.assessment.activeReportTab = tabName;
    saveState();

    document.querySelectorAll(".report-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-report-tab") === tabName);
    });

    document.querySelectorAll(".report-tab-pane").forEach((pane) => {
      const isMatch = pane.id === "report-pane-" + tabName;
      pane.classList.remove("active", "slide-from-right", "slide-from-left");
      if (isMatch) {
        pane.classList.add("active");
        if (direction === "right") {
          pane.classList.add("slide-from-right");
        } else if (direction === "left") {
          pane.classList.add("slide-from-left");
        }
      }
    });
  }

  function updateSavedBadge() {
    const badgeEl = document.getElementById("wishlist-count-badge");
    const wishlistBtn = document.getElementById("btn-open-wishlist");
    if (!badgeEl || !wishlistBtn) return;

    const totalSaved =
      (state.assessment.savedRoles || []).length +
      (state.assessment.savedCourses || []).length;

    if (totalSaved > 0) {
      badgeEl.style.display = "inline-flex";
      badgeEl.textContent = String(totalSaved);
      wishlistBtn.classList.add("active-heart");
    } else {
      badgeEl.style.display = "none";
      wishlistBtn.classList.remove("active-heart");
    }
  }

  function openSavedModal() {
    closeModal();showScreen('screen-saved');renderSavedUpdates();
    const savedRoleIds = state.assessment.savedRoles || [];
    const savedCourseIds = state.assessment.savedCourses || [];

    const savedRoles = window.NUCLEUS_DATA.careerRoles.filter(
      (r) => savedRoleIds.indexOf(r.id) !== -1
    );

    const allCourses = [];
    window.NUCLEUS_DATA.careerRoles.forEach((r) => {
      (r.courses || []).forEach((c) => {
        if (savedCourseIds.indexOf(c.id) !== -1) {
          allCourses.push(Object.assign({}, c, { roleTitle: r.title, roleId: r.id }));
        }
      });
    });

    if (savedRoles.length === 0 && allCourses.length === 0) {
      renderSavedContent(
        `<div style="text-align:center;padding:18px 8px">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--brand-rose-soft);color:var(--brand-rose);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
            ${getSvgIcon("heart", 22)}
          </div>
          <div style="font-family:var(--font-heading);font-size:16px;font-weight:600;margin-bottom:6px">No Saved Pathways Yet</div>
          <p style="font-size:13px;color:var(--text-secondary)">
            Tap the heart icon on any Career Transition Report or click "Save course" inside the Courses tab to track your shortlisted career moves here.
          </p>
        </div>`
      );
      return;
    }

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        ${
          savedRoles.length > 0
            ? `<div>
                <div style="font-family:var(--font-heading);font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">
                  Saved Career Pathways (${savedRoles.length})
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${savedRoles
                    .map(
                      (r) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:12px">
                      <div>
                        <div style="font-family:var(--font-heading);font-size:14.5px;font-weight:600">${r.title}</div>
                        <div style="font-size:12px;color:var(--text-secondary)">${r.timeline} | ${r.salaryRange}</div>
                      </div>
                      <button type="button" class="btn-next-inline btn-jump-saved-role" data-role-id="${r.id}" style="padding:7px 12px;font-size:12px">
                        <span>Open</span>
                      </button>
                    </div>`
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
        ${
          allCourses.length > 0
            ? `<div>
                <div style="font-family:var(--font-heading);font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">
                  Saved Courses (${allCourses.length})
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${allCourses
                    .map(
                      (c) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:12px">
                      <div>
                        <div style="font-family:var(--font-heading);font-size:13.5px;font-weight:600">${c.title}</div>
                        <div style="font-size:11.5px;color:var(--text-secondary)">Learning topic to research</div>
                      </div>
                      <button type="button" class="btn-next-inline btn-jump-saved-course" data-role-id="${c.roleId}" style="padding:7px 12px;font-size:12px">
                        <span>View</span>
                      </button>
                    </div>`
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
      </div>
    `;

    renderSavedContent(html);

    document.querySelectorAll(".btn-jump-saved-role").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.assessment.selectedRoleId = btn.getAttribute("data-role-id");
        state.assessment.activeReportTab = "overview";
        saveState();
        closeModal();
        renderDetailedReportScreen();
        showScreen("screen-report");
      });
    });

    document.querySelectorAll(".btn-jump-saved-course").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.assessment.selectedRoleId = btn.getAttribute("data-role-id");
        state.assessment.activeReportTab = "courses";
        saveState();
        closeModal();
        renderDetailedReportScreen();
        showScreen("screen-report");
      });
    });
  }

  function renderSavedContent(html) { document.getElementById('saved-page-content').innerHTML=html; }
  function renderSavedUpdates() {
    const host=document.getElementById('saved-updates-content');if(!host)return;
    window.NucleusUpdates?.renderSaved(host,state.savedUpdates,toggleSavedUpdate,state.savedUpdateItems);
  }
  function toggleSavedUpdate(id) {
    state.savedUpdates=state.savedUpdates.includes(id)?state.savedUpdates.filter(x=>x!==id):[...state.savedUpdates,id].slice(-100);
    state.savedUpdateItems=window.NucleusUpdates.savedItems(state.savedUpdates,state.savedUpdateItems);saveState();
    if(currentScreenId==='screen-updates')window.NucleusUpdates.render(state.savedUpdates,toggleSavedUpdate);
    if(currentScreenId==='screen-saved')renderSavedUpdates();
  }
  async function openUpdatesScreen() {
    closeModal();showScreen('screen-updates');
    await window.NucleusUpdates.load();window.NucleusUpdates.render(state.savedUpdates,toggleSavedUpdate);
  }
  function openModal(title, bodyHtml) {
    window.NucleusSelect?.close();
    const backdrop=document.getElementById('app-modal-backdrop');
    if(!backdrop.classList.contains('open')) modalReturnFocus=document.activeElement;
    document.getElementById('app-modal-title').textContent=title;
    document.getElementById('app-modal-body').innerHTML=bodyHtml;
    backdrop.classList.add('open');
    document.querySelector('.workspace-stage').inert=true;
    document.getElementById('btn-close-modal').focus();
  }

  function closeModal() {
    const backdrop=document.getElementById('app-modal-backdrop');if(!backdrop.classList.contains('open'))return;
    backdrop.classList.remove('open');document.getElementById('app-modal-body').replaceChildren();
    document.querySelector('.workspace-stage').inert=false;
    if(modalReturnFocus?.isConnected)modalReturnFocus.focus();else document.querySelector(".app-screen.active h1,.app-screen.active h2")?.focus();
  }

  function openSkillsModal(bucketType) {
    const prof=window.NUCLEUS_DATA.professions.find(p=>p.id===state.assessment.professionId)||window.NUCLEUS_DATA.professions[0];
    const role=activeRole();const buckets=window.NucleusEngine.skillsFor(role,state.assessment,prof);
    if(bucketType==='gap'){
      const confirmed=state.assessment.confirmedSkills[role.id]||[];
      openModal('Review your technical skills',`<p class="content-note">Check only skills you already have. These are self-reported and will update your gap list.</p><div class="skill-confirmations">${role.newSkillsToAcquire.map((skill,index)=>`<label><input type="checkbox" data-confirm-skill="${index}" ${confirmed.includes(skill)?'checked':''}> <span>${esc(skill)}</span></label>`).join('')}</div>`);
      document.querySelectorAll('[data-confirm-skill]').forEach(input=>input.addEventListener('change',()=>{
        state.assessment.confirmedSkills[role.id]=Array.from(document.querySelectorAll('[data-confirm-skill]:checked')).map(el=>role.newSkillsToAcquire[Number(el.dataset.confirmSkill)]);
        saveState();renderDetailedReportScreen();
      }));
    }else{
      const items=bucketType==='current'?buckets.current:buckets.transferable;
      openModal(bucketType==='current'?'Self-reported skills':'Potential transferable skills',`<p class="content-note">${bucketType==='current'?'Skills and responsibilities you explicitly selected.':'Suggestions based on your profession; these are not verified competencies.'}</p>${items.length?items.map(skill=>`<div class="detail-list-row">${esc(skill)}</div>`).join(''):'<p>No skills entered yet. Add skills in your profile.</p>'}`);
    }
  }

  function openFeatureModal(key) {
    if(key==='counselling'){openConsultationModal();return;}
    const features={
      start:{title:'12 career pathways',lead:'See where your healthcare experience could take you.',how:'CareerShift maps 14 professional starting points to 12 directions, including clinical research, pharmacovigilance, regulatory affairs and healthcare operations.',why:'Explore alternatives using the same profile, instead of starting your research from scratch for every role.',value:'Each pathway brings together a readiness estimate, skills to develop and a five-phase roadmap. Estimates guide exploration; they do not predict a job offer.',action:'Explore my pathways'},
      skills:{title:'Skill mapping',lead:'Recognise what you bring. Find what to develop next.',how:'Your selected responsibilities and skills are compared with the technical topics for your chosen pathway. You can confirm the topics you already know.',why:'A focused gap list helps you prioritise learning and describe your transferable experience more clearly.',value:'Review your current strengths, potential transferable skills and remaining technical topics in one place. Skills remain self-reported.',action:'Map my skills'},
      compare:{title:'Compare pathways',lead:'Make a career choice with the trade-offs in view.',how:'Compare up to three career directions side by side using your professional profile.',why:'Look beyond a job title to compare readiness, skills, learning effort and illustrative salary ranges.',value:'Use the comparison to shortlist the options that suit your interests and circumstances. Verify pay and entry requirements with employers.',action:'Compare careers'},
      roadmap:{title:'Personalised roadmaps',lead:'Turn a possible career move into manageable next steps.',how:'Every pathway has five phases with practical activities, suggested timelines and completion markers.',why:'A sequence makes it easier to choose your next milestone and return to it after each learning session.',value:'Track completed phases and dates, then export a two-page career plan to keep or discuss with an advisor. Timelines are planning estimates.',action:'View my roadmap'},
      courses:{title:'Relevant learning',lead:'Choose learning that supports your next career direction.',how:'CareerShift groups learning tracks around the skills and knowledge relevant to each pathway.',why:'Connect a course decision to a specific gap, rather than collecting unrelated certificates.',value:'Save useful tracks and investigate the provider, syllabus, cost, recognition and eligibility before enrolling. Availability is not verified in this app.',action:'Explore learning tracks'}
    };
    const item=features[key];if(!item)return;
    openModal(item.title,`<div class="feature-explainer"><p class="eyebrow">Nucleus MedLabs CareerShift</p><p class="feature-lead">${item.lead}</p><div class="feature-detail"><h4>How it works</h4><p>${item.how}</p></div><div class="feature-detail"><h4>Why it helps</h4><p>${item.why}</p></div><div class="feature-detail"><h4>What you can take away</h4><p>${item.value}</p></div><button type="button" class="btn-primary feature-action" id="btn-feature-continue">${item.action} ${getSvgIcon('arrow_right',18)}</button></div>`);
    document.getElementById('btn-feature-continue').onclick=()=>{closeModal();if(key==='compare')openComparisonModal();else if(key==='start')continueAssessment();else openReportTab(key);};
  }

  function openConsultationModal(prefillTopic) {
    if(INSTALL_PREVIEW||!state.isAuthenticated){
      openModal('Career counselling with Nucleus MedLabs',`<div class="feature-explainer"><p class="eyebrow">Nucleus MedLabs CareerShift</p><p class="feature-lead">Turn career questions into a clearer plan with individual guidance.</p><p>Nucleus MedLabs supports healthcare, pharmacy and life sciences professionals with career planning, transitions, CV and profile development, interview preparation and job-search readiness.</p><div class="feature-detail"><h4>Make the conversation useful</h4><p>Bring your CareerShift report, the roles you are considering and your questions about skills, qualifications or next steps.</p></div><p class="content-note">Visit the Nucleus MedLabs website to enquire about a consultation and confirm availability. Guidance does not guarantee a job or placement.</p><a class="btn-primary feature-action" href="https://nucleusmedlabs.com/contact" target="_blank" rel="noopener noreferrer" data-external-link>Visit website for a consultation ${getSvgIcon('arrow_right',18)}</a><a class="feature-service-link" href="https://nucleusmedlabs.com/education/career-management-job-placement" target="_blank" rel="noopener noreferrer" data-external-link>Explore career support services</a></div>`);
      return;
    }
    const topic=prefillTopic || (state.assessment.selectedRoleId?activeRole().title:'Career exploration');
    const tomorrow=indiaDate(1), maxDate=indiaDate(90), requestKey='req_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    openModal('Request a career consultation',`<p class="content-note">Choose your preferred time. This saves a request for review; it does not reserve an advisor or send a notification.</p>
      <label class="form-label" for="consult-topic">Topic</label><input id="consult-topic" class="form-input" maxlength="200" value="${esc(topic)}">
      <label class="form-label" for="consult-date-picker">Preferred date (India time)</label><input type="date" id="consult-date-picker" class="form-input" min="${tomorrow}" max="${maxDate}" value="${tomorrow}">
      <label class="form-label" for="consult-time">Preferred time (IST)</label><select id="consult-time" class="form-input">${['10:30','12:00','14:30','16:30','18:00','19:30'].map(t=>`<option>${t}</option>`).join('')}</select>
      <label class="form-label" for="consult-mode">Mode</label><select id="consult-mode" class="form-input"><option>Video consultation</option><option>Phone call</option><option>In person</option></select>
      <p id="booking-error" class="form-error" role="alert"></p><button type="button" class="btn-primary" id="btn-confirm-consultation">Save consultation request</button>`);
    document.getElementById('btn-confirm-consultation').onclick=async(event)=>{
      const button=event.currentTarget;button.disabled=true;
      const body={topic:document.getElementById('consult-topic').value,date:document.getElementById('consult-date-picker').value,time:document.getElementById('consult-time').value,mode:document.getElementById('consult-mode').value,requestKey};
      try{const result=await window.NucleusAPI.request('bookings','POST',body);bookings=result.bookings;renderDashboard();
        openModal('Request saved - awaiting review',`<p>Your reference is <strong>${esc(result.booking.id)}</strong>.</p><p>Preferred time: ${esc(body.date)} at ${esc(body.time)} IST.</p><p class="content-note">Your appointment is not confirmed. Email/SMS and advisor notifications are not connected in this pilot.</p>`);
      }catch(error){const node=document.getElementById('booking-error');if(node)node.textContent=error.message;button.disabled=false;}
    };
  }

  function buildTransitionReport() {
    const prof=window.NUCLEUS_DATA.professions.find(p=>p.id===state.assessment.professionId)||window.NUCLEUS_DATA.professions[0];
    const role=activeRole(), done=state.assessment.completedRoadmapSteps[role.id]||{};
    const buckets=window.NucleusEngine.skillsFor(role,state.assessment,prof);
    return {title:prof.title+' to '+role.title,date:indiaDate(),
      meta:['Prepared for: '+(state.displayName||(state.isGuest?'Your personal workspace':state.user.fullName)), 'Qualification: '+state.assessment.qualification,
        'Experience: '+state.assessment.experience, 'Readiness estimate: '+role.computedScore+'/100 (self-reported)', 'Illustrative annual salary: '+role.salaryRange],
      pages:[
        [{title:'Your starting point',lines:role.factors.map(f=>f.label+': '+f.points+'/'+f.max)},
         {title:'Technical topics to develop',lines:buckets.gaps.length?buckets.gaps:['All listed technical topics are self-reported as known.']},
         {title:'Before choosing a pathway',lines:['This rules-based estimate supports planning. It does not confirm hiring eligibility or predict employment.','Verify qualifications, professional registration and salary expectations with the relevant employer or regulator.']}],
        [{title:'Your roadmap',items:role.roadmap.map(step=>({title:step.title,duration:step.duration,description:step.desc,completed:!!done[step.step],completedAt:typeof done[step.step]==='string'?done[step.step]:''}))},
         {title:'Learning tracks to research',lines:role.courses.map(c=>c.title)},
         {title:'Next actions',lines:['Choose one milestone to work on next and record your completion date.','Use Jobs to search current opportunities and verify each listing.','Export a workspace backup before changing devices or uninstalling the app.']}]
      ]};
  }
  function openTransitionPlanModal() {
    if(!hasProfile()){openReportTab('roadmap');return;}
    const report=buildTransitionReport();
    openModal('Your career plan',window.NucleusPDF.preview(report)+'<button type="button" id="btn-download-pdf" class="btn-primary">'+(window.NucleusPlatform.native?'Save or share two-page PDF':'Download two-page PDF')+'</button><p id="pdf-export-status" class="feed-status" role="status">Includes your readiness explanation, skill gaps and roadmap.</p>');
    document.getElementById('btn-download-pdf').onclick=async event=>{
      const button=event.currentTarget,status=document.getElementById('pdf-export-status');button.disabled=true;status.textContent='Preparing your two-page report...';
      try{await window.NucleusPDF.download(report);status.textContent=window.NucleusPlatform.native?'Choose an app to save, print or share the PDF.':'PDF downloaded. Open it to print or share.';}
      catch(error){status.textContent='Could not export the report. '+error.message;}
      finally{button.disabled=false;}
    };
  }

  function openQuickRoleSwitcherModal() {
    const ranked = computeRankedCareerMatches();
    const html = `
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">
        Compare your top matched career tracks based on your profile and selected directions:
      </p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${ranked
          .slice(0, 6)
          .map((r, i) => {
            const isCur = r.id === state.assessment.selectedRoleId;
            return `
            <div class="profession-item ${isCur ? "selected" : ""}" data-switch-role="${r.id}">
              <div>
                <div class="prof-title">#${i + 1} ${r.title} (${r.computedScore}/100 readiness)</div>
                <div class="prof-sub">${r.timeline} | ${r.scaledSalaryRange}</div>
              </div>
              <div class="prof-select-radio">${getSvgIcon("check", 13)}</div>
            </div>`;
          })
          .join("")}
      </div>
      <button type="button" id="btn-modal-reset-assessment" class="btn-secondary" style="margin-top:12px">
        ${getSvgIcon("refresh", 15)}
        <span>Start New assessment from Step 1</span>
      </button>
    `;
    openModal("Switch Target Career Report", html);

    document.querySelectorAll("[data-switch-role]").forEach((el) => {
      el.addEventListener("click", () => {
        state.assessment.selectedRoleId = el.getAttribute("data-switch-role");
        saveState();
        closeModal();
        renderDetailedReportScreen();
      });
    });

    const resetBtn = document.getElementById("btn-modal-reset-assessment");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        closeModal();
        resetAndStartNewAssessment();
      });
    }
  }

  function resetAndStartNewAssessment() {
    archiveAssessment();
    const {savedRoles,savedCourses,preferredCity}=state.assessment;
    state.assessment={...clone(DEFAULT_STATE.assessment),savedRoles,savedCourses,preferredCity};
    saveState();renderProfessionScreen('');showScreen('screen-profession');
  }

  function renderSettingsScreen() {
    const nameEl = document.getElementById("settings-user-fullname");
    const handleEl = document.getElementById("settings-user-handle");
    const contactEl = document.getElementById("settings-user-contact");
    const profEl = document.getElementById("settings-current-prof");
    const themeLabelEl = document.getElementById("settings-theme-status");

    const profObj =
      window.NUCLEUS_DATA.professions.find((p) => p.id === state.assessment.professionId) ||
      window.NUCLEUS_DATA.professions[1] ||
      window.NUCLEUS_DATA.professions[0];
    const qualText = state.assessment.qualification || profObj.defaultQualification;

    if (nameEl) nameEl.textContent = state.user.fullName;
    if (handleEl) handleEl.textContent = INSTALL_PREVIEW ? 'Demonstration profile' : "@" + state.user.username;
    if (contactEl) contactEl.textContent = state.user.contact;
    if (profEl) profEl.textContent = state.assessment.professionId ? profObj.title + " | " + qualText : "No assessment started";
    if (themeLabelEl) {
      themeLabelEl.textContent =
        state.theme === "dark" ? "Dark (Surgical Slate)" : "Light (Clinical Day)";
    }

    renderCustomDropdown(
      "dd-settings-city-host",
      ["Hyderabad, India", "Bengaluru, India", "Mumbai, India", "Remote / India"],
      state.assessment.preferredCity || "Hyderabad, India",
      "Select Preferred City",
      (val) => {
        state.assessment.preferredCity = val;
        state.assessment.jobLocationFilter = val;
        saveState();
      }
    );
  }

  function applyThemeAndViewport() {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.body.setAttribute("data-viewport", state.viewport);

    const logoSrc =
      state.theme === "light"
        ? "Logo-Brandkit/icons/app-rounded-light.svg"
        : "Logo-Brandkit/icons/app-rounded-dark.svg";
    document.querySelectorAll(".theme-adaptive-logo").forEach((imgEl) => {
      imgEl.src = logoSrc;
    });

    document.querySelectorAll(".preview-btn[data-vp]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-vp") === state.viewport);
    });
  }

  function hasProfile() {
    const a=state.assessment;return !!(a.professionId&&a.qualification&&a.experience&&a.workSetting);
  }
  function activeRole() {
    const roles=computeRankedCareerMatches();return roles.find(r=>r.id===state.assessment.selectedRoleId)||roles[0];
  }
  function indiaDate(offset=0) {
    return new Date(Date.now()+offset*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  }
  function archiveAssessment() {
    if(!state.assessment.professionId)return;
    state.history.unshift({id:'assessment_'+Date.now(),date:new Date().toISOString(),assessment:clone(state.assessment)});
    state.history=state.history.slice(0,20);
  }
  function continueAssessment() {
    if(!state.assessment.professionId){renderProfessionScreen('');showScreen('screen-profession');}
    else if(!hasProfile()){renderProfileScreen();showScreen('screen-profile');}
    else if(!state.assessment.selectedDirections.length){renderDirectionsScreen();showScreen('screen-direction');}
    else if(!state.assessment.selectedRoleId){renderMatchesScreen(false);showScreen('screen-matches');}
    else{renderDetailedReportScreen();showScreen('screen-report');}
  }
  function openReportTab(tab) {
    if(!hasProfile()){
      openModal('Complete your profile first','<p>Your profile helps make these suggestions useful. Continue your assessment to select a career pathway.</p><button type="button" class="btn-primary" id="btn-modal-continue">Continue assessment</button>');
      document.getElementById('btn-modal-continue').onclick=()=>{closeModal();continueAssessment();};return;
    }
    if(!state.assessment.selectedRoleId){renderMatchesScreen(false);showScreen('screen-matches');return;}
    state.assessment.activeReportTab=tab;saveState();renderDetailedReportScreen();showScreen('screen-report');
  }
  function renderDashboard() {
    const host=document.getElementById('workspace-overview');if(!host)return;
    const a=state.assessment, role=a.selectedRoleId?activeRole():null;
    const completed=role?(a.completedRoadmapSteps[role.id]||{}):{};
    const next=role?.roadmap.find(step=>!completed[step.step]);
    const pending=bookings.filter(b=>b.status==='requested');
    host.innerHTML=`<div class="dashboard-heading"><div><span class="eyebrow">YOUR NEXT STEP</span><h2>${role?'Build your next chapter':'Find your next direction'}</h2></div><span class="status-pill">${state.isGuest?'Personal workspace':'Local pilot'}</span></div>
      <p>${role?esc(role.title):a.professionId?'Your assessment is in progress. Pick up where you left off.':'Turn your healthcare experience into a practical career plan.'}</p>
      ${role?`<div class="next-milestone"><span>Next milestone</span><strong>${esc(next?.title||'Roadmap complete - review your job search')}</strong></div>`:''}
      <div class="dashboard-stats"><button type="button" id="dashboard-saved"><strong>${a.savedRoles.length+a.savedCourses.length+state.savedUpdates.length}</strong><span>Saved items</span></button><button type="button" id="dashboard-history"><strong>${state.history.length}</strong><span>Past assessments</span></button>${state.isAuthenticated?`<button type="button" id="dashboard-requests"><strong>${pending.length}</strong><span>Pending requests</span></button>`:''}</div>
      <div class="dashboard-actions"><button type="button" class="btn-secondary" id="dashboard-new">New assessment</button><button type="button" class="btn-secondary" id="dashboard-compare">Compare careers</button></div>`;
    document.getElementById('dashboard-saved').onclick=openSavedModal;
    document.getElementById('dashboard-history').onclick=openHistoryModal;
    const requests=document.getElementById('dashboard-requests');if(requests)requests.onclick=openBookingsModal;
    document.getElementById('dashboard-new').onclick=resetAndStartNewAssessment;
    document.getElementById('dashboard-compare').onclick=openComparisonModal;
    const start=document.querySelector('#btn-start-journey span');if(start)start.textContent=a.professionId?'Continue my assessment':'Start my career assessment';
  }
  function openHistoryModal() {
    openModal('Assessment history',`<p class="content-note">Your last 20 archived assessments. Opening one archives your current assessment first. Favorites stay with your workspace.</p>${state.history.length?state.history.map((item,index)=>{
      const profession=window.NUCLEUS_DATA.professions.find(p=>p.id===item.assessment.professionId);
      const role=window.NUCLEUS_DATA.careerRoles.find(r=>r.id===item.assessment.selectedRoleId);
      return `<div class="history-row"><div><strong>${esc(role?.title||profession?.title||'Assessment')}</strong><small>${esc(item.date.slice(0,10))} · ${esc(profession?.title||'')}</small></div><button type="button" class="btn-secondary" data-restore-history="${index}">Open</button></div>`;
    }).join(''):'<div class="empty-state">No archived assessments yet. Starting a new assessment saves your current one here.</div>'}`);
    document.querySelectorAll('[data-restore-history]').forEach(button=>button.onclick=()=>{
      const snapshot=clone(state.history[Number(button.dataset.restoreHistory)].assessment);
      const {savedRoles,savedCourses,preferredCity}=state.assessment;archiveAssessment();
      state.assessment={...snapshot,savedRoles,savedCourses,preferredCity};saveState();closeModal();continueAssessment();
    });
  }
  function openComparisonModal() {
    const ranked=computeRankedCareerMatches();
    closeModal();showScreen('screen-compare');
    document.getElementById('compare-page-content').innerHTML=`<p class="content-note">${hasProfile()?'Estimates reflect your self-reported starting point.':'Complete your profile for readiness estimates. You can explore the pathways now.'} Salary bands and timelines are illustrative.</p><div class="compare-selectors">${[0,1,2].map(i=>`<div><span class="form-label">Pathway ${i+1}</span><div id="compare-select-${i}"></div></div>`).join('')}</div><div id="career-comparison" class="comparison-scroll" role="region" aria-label="Pathway comparison" tabindex="0"></div>`;
    const selected=ranked.slice(0,3).map(r=>r.title);
    const render=()=>{
      const roles=selected.map(title=>ranked.find(r=>r.title===title));
      const rows=[['Readiness',r=>hasProfile()?`${r.computedScore}/100`:'Profile needed'],['Interest selected',r=>r.interestSelected?'Yes':'No'],['Suggested preparation',r=>r.timeline],['Difficulty',r=>r.difficulty],['Illustrative annual salary',r=>r.salaryRange],['Technical topics to review',r=>window.NucleusEngine.skillsFor(r,state.assessment,{transferableSkills:[]}).gaps.length],['Academic / hiring eligibility',()=> 'Verify with employer or regulator']];
      document.getElementById('career-comparison').innerHTML=`<table class="comparison-table"><caption>Pathway comparison</caption><thead><tr><th scope="col">Factor</th>${roles.map(r=>`<th scope="col">${esc(r.title)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,value])=>`<tr><th scope="row">${label}</th>${roles.map(r=>`<td>${esc(value(r))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    };
    selected.forEach((title,i)=>renderCustomDropdown('compare-select-'+i,ranked.map(r=>r.title),title,'Choose pathway '+(i+1),value=>{selected[i]=value;render();}));render();
  }
  function renderReadinessExplanation(role) {
    const host=document.getElementById('readiness-explanation');if(!host)return;
    host.innerHTML=`<details><summary>How your ${role.computedScore}/100 estimate is calculated</summary><p class="content-note">A transparent, unvalidated rules-based estimate using self-reported information. It is not a probability of employment or confirmation of eligibility.</p>${role.factors.map(f=>`<div class="factor-row"><span>${f.label}</span><strong>${f.points} / ${f.max}</strong></div>`).join('')}<p class="content-note">Interest: ${role.interestSelected?'selected':'not selected'} - shown separately. Salary bands are illustrative and are not increased automatically for past experience.</p></details>`;
  }
  async function openBookingsModal() {
    if(INSTALL_PREVIEW){openConsultationModal();return;}
    if(!state.isAuthenticated){openModal('Consultation requests',INSTALL_PREVIEW?'<p>Consultation requests are available in the local pilot on your Mac. This installation preview is for guest exploration.</p>':'<p>Sign in to save and review requests. Guest mode does not create appointments.</p>');return;}
    try{const result=await window.NucleusAPI.request('bookings');bookings=result.bookings;}catch(error){showTimerAlertToast('Unable to load requests',error.message,6500);return;}
    openModal('Your consultation requests',`<p class="content-note">Requested times are preferences, not confirmed appointments. No advisor notification is sent in this pilot.</p>${bookings.length?bookings.map(b=>`<div class="request-card"><strong>${esc(b.topic)}</strong><p>${esc(b.preferred_date)} · ${esc(b.preferred_time)} IST · ${esc(b.mode)}</p><small>${esc(b.id)} · ${b.status==='requested'?'Awaiting review':'Cancelled'}</small>${b.status==='requested'?`<button type="button" class="btn-secondary" data-cancel-request="${esc(b.id)}">Cancel request</button>`:''}</div>`).join(''):'<div class="empty-state">No consultation requests yet.</div>'}`);
    document.querySelectorAll('[data-cancel-request]').forEach(button=>button.onclick=async()=>{
      button.disabled=true;try{const result=await window.NucleusAPI.request('bookings/cancel','POST',{id:button.dataset.cancelRequest});bookings=result.bookings;renderDashboard();await openBookingsModal();}
      catch(error){showTimerAlertToast('Request not cancelled',error.message,6000);button.disabled=false;}
    });
  }
  function showRecoveryCode(code) {
    openModal('Save your private recovery code',`<p>Store this code somewhere private. It is shown once and lets you reset your password. Email and SMS recovery are not connected.</p><code class="recovery-code">${esc(code)}</code><p class="content-note">Anyone with this code and your account contact can reset your password.</p><button type="button" class="btn-primary" id="btn-recovery-saved">I have saved my recovery code</button>`);
    document.getElementById('btn-recovery-saved').onclick=closeModal;
  }
  function openRecoveryModal() {
    openModal('Recover your account',`<label class="form-label" for="recover-contact">Registered email or mobile</label><input id="recover-contact" class="form-input" autocomplete="username"><label class="form-label" for="recover-code">Private recovery code</label><input id="recover-code" class="form-input" autocomplete="off"><label class="form-label" for="recover-password">New password (12-128 characters)</label><input type="password" id="recover-password" class="form-input" autocomplete="new-password" minlength="12" maxlength="128"><p id="recover-error" class="form-error" role="alert"></p><button type="button" class="btn-primary" id="btn-recover-submit">Reset password</button>`);
    document.getElementById('btn-recover-submit').onclick=async(event)=>{
      const button=event.currentTarget;button.disabled=true;
      try{const result=await window.NucleusAPI.request('auth/recover','POST',{contact:document.getElementById('recover-contact').value,recoveryCode:document.getElementById('recover-code').value,password:document.getElementById('recover-password').value});showRecoveryCode(result.recoveryCode);}
      catch(error){const node=document.getElementById('recover-error');if(node)node.textContent=error.message;button.disabled=false;}
    };
  }
  function openRenewSessionModal() {
    openModal('Sign in again to keep your changes',`<p>Your unsaved assessment is still open. Sign in to the same account to save it.</p><label class="form-label" for="renew-password">Password for ${esc(state.user.contact)}</label><input type="password" id="renew-password" class="form-input" autocomplete="current-password"><p id="renew-error" class="form-error" role="alert"></p><button type="button" id="renew-submit" class="btn-primary">Sign in and save</button><button type="button" id="renew-export" class="btn-secondary">Download unsaved workspace</button>`);
    document.getElementById('renew-export').onclick=()=>downloadText('Nucleus-unsaved-workspace.json',JSON.stringify(workspacePayload(),null,2));
    document.getElementById('renew-submit').onclick=async(event)=>{
      const button=event.currentTarget;button.disabled=true;
      try{const result=await window.NucleusAPI.request('auth/login','POST',{contact:state.user.contact,password:document.getElementById('renew-password').value});
        if(result.user.id!==state.user.id)throw new Error('The account does not match this workspace.');
        sessionExpired=false;syncBlocked=result.revision!==revision;closeModal();
        if(syncBlocked)setSaveStatus('Another device has newer changes. Review before continuing.',true);else await flushState();
      }catch(error){const node=document.getElementById('renew-error');if(node)node.textContent=error.message;button.disabled=false;}
    };
  }
  function downloadText(filename,text,type='application/json') {
    return window.NucleusPlatform.download(text,filename,type).catch(()=>showTimerAlertToast('File could not be saved','Try exporting again.'));
  }
  function bindEnhancements() {
    document.querySelectorAll('button[title]').forEach(button=>{if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',button.title);});
    document.getElementById('btn-settings-clear').onclick=()=>{
      openModal("Clear this device's workspace", '<p>This removes your assessment, history, saved items and preferences from this device. Export a backup first if you want to keep them.</p><button type="button" id="confirm-clear-device" class="btn-secondary">Clear saved data</button><p id="clear-device-status" role="status"></p>');
      document.getElementById('confirm-clear-device').onclick=async event=>{
        event.currentTarget.disabled=true;
        try{await window.NucleusPlatform.clearWorkspace();deviceStorageError=false;closeModal();if(INSTALL_PREVIEW)signOutDemo(true);else enterGuest();}
        catch{document.getElementById('clear-device-status').textContent='Could not clear storage. Please restart the app and try again.';event.currentTarget.disabled=false;}
      };
    };

    window.addEventListener('nucleus-back',event=>{
      if(INSTALL_PREVIEW&&!demoUnlocked)return;
      if(window.NucleusSelect?.close()){event.preventDefault();return;}
      const installHelp=document.getElementById('install-help-dialog');
      if(installHelp.open){installHelp.close();event.preventDefault();return;}
      if(document.getElementById('app-modal-backdrop').classList.contains('open')){closeModal();event.preventDefault();return;}
      if(currentScreenId!=='screen-welcome'){
        event.preventDefault();
        if(['screen-compare','screen-saved','screen-updates','screen-settings'].includes(currentScreenId)){renderWelcomeScreen();showScreen('screen-welcome');}
        else if(window.history.state?.screenId)window.history.back();
        else {renderWelcomeScreen();showScreen('screen-welcome');}
      }
    });
    document.addEventListener('click',event=>{const link=event.target.closest('a[data-external-link]');if(link){event.preventDefault();window.NucleusPlatform.openExternal(link.href);}});
    window.NucleusUpdates.load().then(()=>{if(currentScreenId==='screen-saved')renderSavedUpdates();});
    document.getElementById('btn-retry-save').onclick=async()=>{
      if(state.isGuest&&deviceStorageError){showTimerAlertToast('Protect your saved work','Export a backup in Settings. Restart to retry loading existing data, or clear the workspace after keeping your backup.');return;}
      if(sessionExpired){openRenewSessionModal();return;}
      if(!syncBlocked){if(state.isGuest)saveState();else await flushState();return;}
      openModal('Another device has newer changes','<p>Download a backup of this open workspace before loading the latest saved version. This avoids overwriting changes made elsewhere.</p><button type="button" class="btn-secondary" id="btn-backup-conflict">Download this workspace</button><button type="button" class="btn-primary" id="btn-load-latest">Load saved version</button>');
      document.getElementById('btn-backup-conflict').onclick=()=>downloadText('Nucleus-workspace-backup.json',JSON.stringify(workspacePayload(),null,2));
      document.getElementById('btn-load-latest').onclick=async()=>{try{const result=await window.NucleusAPI.request('session');if(!result.user)throw new Error('Session ended. Sign in again.');closeModal();acceptSession(result);}catch(error){showTimerAlertToast('Could not reload',error.message);}};
    };
    document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>{
      const target=button.dataset.nav;
      if(target==='home'){renderWelcomeScreen();showScreen('screen-welcome');}
      if(target==='compare')openComparisonModal();
      if(target==='saved')openSavedModal();
      if(target==='updates')openUpdatesScreen();
    });
    document.getElementById('btn-settings-export').onclick=()=>downloadText('Nucleus-workspace-backup.json',JSON.stringify(workspacePayload(),null,2));
    document.getElementById('btn-settings-import').onchange=async(event)=>{
      const file=event.target.files[0];if(!file)return;
      try{if(file.size>350000)throw new Error('Please use a workspace backup smaller than 350 KB.');const imported=JSON.parse(await file.text());if(!imported.assessment||typeof imported.assessment!=='object')throw new Error('This is not a workspace backup.');archiveAssessment();const previous=clone(state.history);readWorkspace(imported);state.history=[...state.history,...previous].filter((h,i,all)=>all.findIndex(x=>x.id===h.id)===i).slice(0,20);applyThemeAndViewport();saveState();renderSettingsScreen();showTimerAlertToast('Backup imported','Your previous assessment is also in history.');}
      catch(error){showTimerAlertToast('Import failed',error.message);}finally{event.target.value='';}
    };
    window.addEventListener('beforeunload',event=>{if(state.isAuthenticated&&savedVersion<changeVersion){event.preventDefault();event.returnValue='';}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)flushState();});
    document.addEventListener('keydown',event=>{
      const modal=document.getElementById('app-modal-backdrop');
      if(modal.classList.contains('open')){
        if(event.key==='Escape'){event.preventDefault();closeModal();return;}
        if(event.key==='Tab'){
          const focusable=Array.from(modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select,a[href],[tabindex="0"]')).filter(el=>!el.hidden);
          const first=focusable[0],last=focusable[focusable.length-1];
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        }
      }
      if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"],[role="checkbox"],[role="radio"]')&&!event.target.matches('button,input')){
        event.preventDefault();event.target.click();
      }
      if(event.key==='Enter'&&event.target.matches('#login-name-input,#login-contact-input,#login-password-input')) document.getElementById('btn-login-submit').click();
    });
    document.addEventListener('click',event=>{
      const item=event.target.closest('[data-prof-id],[data-dir-id],[data-resp],[data-role-id],[data-step-num]');if(!item)return;
      const attribute=['data-prof-id','data-dir-id','data-resp','data-role-id','data-step-num'].find(a=>item.hasAttribute(a));
      const value=item.getAttribute(attribute),parent=item.parentElement;
      queueMicrotask(()=>{if(!item.isConnected&&parent?.isConnected)Array.from(parent.querySelectorAll('['+attribute+']')).find(el=>el.getAttribute(attribute)===value)?.focus({preventScroll:true});});
    },true);
  }

  function initApp() {
    applyThemeAndViewport();
    // Only render the initial Welcome screen on startup so launch is instantaneous
    renderWelcomeScreen();
    preloadBannerImages();

    document.querySelectorAll(".preview-btn[data-vp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.viewport = btn.getAttribute("data-vp");
        saveState();
        applyThemeAndViewport();
      });
    });

    const brandLockup = document.getElementById("topbar-brand-home");
    if (brandLockup) {
      brandLockup.addEventListener("click", () => {
        if (!state.isAuthenticated && !state.isGuest) {
          showScreen("screen-login");
          return;
        }
        renderWelcomeScreen();
        showScreen("screen-welcome");
      });
    }

    const wishlistBtn = document.getElementById("btn-open-wishlist");
    if (wishlistBtn) {
      wishlistBtn.addEventListener("click", () => openSavedModal());
    }

    const menuBtn = document.getElementById("btn-open-settings");
    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        if (currentScreenId === "screen-settings") {
          showScreen(
            previousScreenBeforeSettings ||
              (state.isAuthenticated || state.isGuest ? "screen-welcome" : "screen-login")
          );
        } else {
          renderSettingsScreen();
          showScreen("screen-settings");
        }
      });
    }

    const stepBackBtn = document.getElementById("btn-step-back");
    if (stepBackBtn) {
      stepBackBtn.addEventListener("click", () => {
        const header = document.getElementById("step-progress-header");
        const target = (header && header.dataset.backTarget) || "screen-welcome";
        showScreen(target);
      });
    }

    // Interactive Welcome Dashboard Feature Tiles
    document.querySelectorAll(".feature-tile[data-tile-action]").forEach((tile) => {
      tile.addEventListener("click", () => {
        const act=tile.getAttribute('data-tile-action');
        openFeatureModal(act);
      });
    });

    document.getElementById('btn-settings-consultation').onclick=()=>openConsultationModal();

    bootSession();

    document.querySelectorAll(".password-eye-btn").forEach((eyeBtn) => {
      eyeBtn.addEventListener("click", () => {
        const targetId = eyeBtn.getAttribute("data-target");
        const inp = document.getElementById(targetId);
        if (!inp) return;
        inp.type = inp.type === "password" ? "text" : "password";
        eyeBtn.setAttribute("aria-label",inp.type === "password" ? "Show password" : "Hide password");eyeBtn.setAttribute("aria-pressed",String(inp.type === "text"));
      });
    });

    document.getElementById('btn-login-submit').onclick=async(event)=>{
      const button=event.currentTarget;button.disabled=true;
      if(INSTALL_PREVIEW){
        const epoch=authEpoch;button.textContent='Signing in...';showLoginError('');
        try{
          const name=window.NucleusDemo.name(document.getElementById('login-name-input').value);
          if(!name){document.getElementById('login-name-input').focus();throw new Error('Enter your name to personalize your workspace and career plan.');}
          const valid=await window.NucleusDemo.verify(document.getElementById('login-contact-input').value,document.getElementById('login-password-input').value);
          if(epoch!==authEpoch)return;
          if(!valid)throw new Error('The email or password is incorrect. Reload to restore the prefilled demonstration credentials.');
          demoUnlocked=true;document.getElementById('login-password-input').type='password';enterGuest(name);
        }catch(error){showLoginError(error.message);}finally{button.disabled=false;button.textContent='Sign in to workspace';}
        return;
      }
      try{const result=await window.NucleusAPI.request('auth/login','POST',{contact:document.getElementById('login-contact-input').value,password:document.getElementById('login-password-input').value});
        authEpoch++;document.getElementById('login-password-input').value='';acceptSession(result);
      }catch(error){showTimerAlertToast('Sign in unsuccessful',error.message,6500);}finally{button.disabled=false;}
    };
    document.getElementById('btn-go-register').onclick=()=>showScreen('screen-register');
    document.getElementById('btn-back-to-login').onclick=()=>showScreen('screen-login');
    document.getElementById('btn-continue-register').onclick=()=>{
      const contact=document.getElementById('register-contact-input').value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)&&! /^(?:\+?91[ -]?)?[6-9][0-9 -]{9,13}$/.test(contact)){
        showTimerAlertToast('Check your contact','Enter a valid email or Indian mobile number.');return;
      }
      state.pendingAuth.contact=contact;showScreen('screen-account-setup');
    };
    document.getElementById('btn-complete-account-setup').onclick=async(event)=>{
      const button=event.currentTarget;button.disabled=true;
      try{const result=await window.NucleusAPI.request('auth/register','POST',{contact:state.pendingAuth.contact,fullName:document.getElementById('setup-fullname-input').value,username:document.getElementById('setup-username-input').value,password:document.getElementById('setup-password-input').value});
        authEpoch++;document.getElementById('setup-password-input').value='';acceptSession(result);showRecoveryCode(result.recoveryCode);
      }catch(error){showTimerAlertToast('Account not created',error.message,6500);}finally{button.disabled=false;}
    };
    document.getElementById('btn-guest').onclick=()=>enterGuest();
    document.getElementById('btn-recover-account').onclick=openRecoveryModal;
    const startJourneyBtn = document.getElementById("btn-start-journey");
    if (startJourneyBtn) {
      startJourneyBtn.addEventListener("click", () => {
        continueAssessment();
      });
    }

    const profSearchInput = document.getElementById("profession-search-input");
    if (profSearchInput) {
      profSearchInput.addEventListener("input", () => {
        renderProfessionScreen(profSearchInput.value);
      });
    }

    const step1ProceedBtn = document.getElementById("btn-step1-proceed");
    if (step1ProceedBtn) {
      step1ProceedBtn.addEventListener("click", () => {
        if (!state.assessment.professionId) {
          showTimerAlertToast(
            "Select Your Profession",
            "Please select your current Profession card to proceed to Step 2.",
            3400
          );
          return;
        }
        renderProfileScreen();
        showScreen("screen-profile");
      });
    }

    const addSkillInput = document.getElementById("profile-add-skill-input");
    if (addSkillInput) {
      addSkillInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          const clean = sanitizeText(addSkillInput.value, 36);
          if (!clean) return;
          const exists = (state.assessment.additionalSkills || []).some(
            (s) => s.toLowerCase() === clean.toLowerCase()
          );
          if (!exists) {
            state.assessment.additionalSkills.push(clean);
            addSkillInput.value = "";
            saveState();
            renderSkillChipsAndSuggestions();
          } else {
            addSkillInput.value = "";
          }
        }
      });
    }

    const profileNextBtn = document.getElementById("btn-profile-next");
    if (profileNextBtn) {
      profileNextBtn.addEventListener("click", () => {
        if (
          !state.assessment.qualification ||
          !state.assessment.experience ||
          !state.assessment.workSetting
        ) {
          showTimerAlertToast(
            "Complete Your Profile",
            "Please select your Qualification, Experience, and Work Setting to proceed.",
            3500
          );
          return;
        }
        renderDirectionsScreen();
        showScreen("screen-direction");
      });
    }

    const directionNextBtn = document.getElementById("btn-direction-next");
    if (directionNextBtn) {
      directionNextBtn.addEventListener("click", () => {
        if (
          !state.assessment.selectedDirections ||
          state.assessment.selectedDirections.length === 0
        ) {
          showTimerAlertToast(
            "Select a Career Direction",
            "Please select at least one transition direction card to proceed.",
            3500
          );
          return;
        }

        state.assessment.selectedRoleId = "";
        saveState();

        runBufferLoader(
          {
            title: "Analyzing Your Clinical Profile",
            subtitle:
              "Matching your qualification, skills, and experience against 12 healthcare career tracks...",
            steps: [
              "Reading your self-reported academic and work profile",
              "Mapping transferable competencies across selected domains",
              "Comparing selected skills with suggested learning topics",
              "Ranking best-fit career transition options and salary bands"
            ],
            durationMs: 650
          },
          () => {
            renderMatchesScreen(true);
            showScreen("screen-matches");
          }
        );
      });
    }

    const step4ProceedBtn = document.getElementById("btn-step4-proceed");
    if (step4ProceedBtn) {
      step4ProceedBtn.addEventListener("click", () => {
        if (!state.assessment.selectedRoleId) {
          showTimerAlertToast(
            "Select a Career Option",
            "Please tap one of the matched career cards above to view its full report.",
            3400
          );
          return;
        }
        state.assessment.activeReportTab = "overview";
        saveState();
        renderDetailedReportScreen();
        showScreen("screen-report");
      });
    }

    const switchRoleBtn = document.getElementById("btn-quick-switch-role");
    if (switchRoleBtn) {
      switchRoleBtn.addEventListener("click", () => openQuickRoleSwitcherModal());
    }

    document.querySelectorAll(".report-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-report-tab");
        activateReportSubTab(tab);
      });
    });

    const reportScreenEl = document.getElementById("screen-report");
    if (reportScreenEl) {
      let touchStartX = 0;
      let touchStartY = 0;
      reportScreenEl.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches && e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        },
        { passive: true }
      );
      reportScreenEl.addEventListener(
        "touchend",
        (e) => {
          if (!e.changedTouches || e.changedTouches.length === 0) return;
          if(e.target.closest("input,select,button,a,.comparison-scroll"))return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            const curIdx = REPORT_TABS_ORDER.indexOf(
              state.assessment.activeReportTab || "overview"
            );
            if (dx < 0 && curIdx < REPORT_TABS_ORDER.length - 1) {
              activateReportSubTab(REPORT_TABS_ORDER[curIdx + 1], "right");
            } else if (dx > 0 && curIdx > 0) {
              activateReportSubTab(REPORT_TABS_ORDER[curIdx - 1], "left");
            }
          }
        },
        { passive: true }
      );
    }

    const cardCurrentSkills = document.getElementById("card-bucket-current");
    const cardTransferSkills = document.getElementById("card-bucket-transfer");
    const cardGapSkills = document.getElementById("card-bucket-gap");

    if (cardCurrentSkills) {
      cardCurrentSkills.addEventListener("click", () => openSkillsModal("current"));
    }
    if (cardTransferSkills) {
      cardTransferSkills.addEventListener("click", () => openSkillsModal("transfer"));
    }
    if (cardGapSkills) {
      cardGapSkills.addEventListener("click", () => openSkillsModal("gap"));
    }

    const btnRoadmapPrint = document.getElementById("btn-roadmap-print-pdf");
    if (btnRoadmapPrint) {
      btnRoadmapPrint.addEventListener("click", () => openTransitionPlanModal());
    }

    const syncLinkedInBtn = document.getElementById("btn-sync-linkedin-live");
    const viewAllJobsBtn = document.getElementById("btn-view-all-jobs-linkedin");

    if (syncLinkedInBtn) {
      syncLinkedInBtn.addEventListener("click", () => {
        const ranked = computeRankedCareerMatches();
        const role =
          ranked.find((r) => r.id === state.assessment.selectedRoleId) || ranked[0];
        openLiveLinkedInSearch(role.title, state.assessment.jobLocationFilter);
      });
    }
    if (viewAllJobsBtn) {
      viewAllJobsBtn.addEventListener("click", () => {
        const ranked = computeRankedCareerMatches();
        const role =
          ranked.find((r) => r.id === state.assessment.selectedRoleId) || ranked[0];
        openLiveLinkedInSearch(role.title, state.assessment.jobLocationFilter);
      });
    }

    const getFullPlanBtn = document.getElementById("btn-get-full-transition-plan");
    if (getFullPlanBtn) {
      getFullPlanBtn.addEventListener("click", () => showScreen("screen-cta"));
    }

    const heartBtn = document.getElementById("btn-save-favorite-role");
    if (heartBtn) {
      heartBtn.addEventListener("click", () => {
        const roleId = state.assessment.selectedRoleId || computeRankedCareerMatches()[0].id;
        if (!state.assessment.savedRoles) state.assessment.savedRoles = [];
        const idx = state.assessment.savedRoles.indexOf(roleId);
        if (idx === -1) {
          state.assessment.savedRoles.push(roleId);
        } else {
          state.assessment.savedRoles.splice(idx, 1);
        }
        saveState();
        renderDetailedReportScreen();
      });
    }

    const shareBtn = document.getElementById("btn-share-report");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => openTransitionPlanModal());
    }

    const ctaConsultBtn = document.getElementById("btn-cta-book-consultation");
    const ctaCoursesBtn = document.getElementById("btn-cta-explore-courses");
    const ctaPlanBtn = document.getElementById("btn-cta-get-plan");

    if (ctaConsultBtn) {
      ctaConsultBtn.addEventListener("click", () => openConsultationModal());
    }
    if (ctaCoursesBtn) {
      ctaCoursesBtn.addEventListener("click", () => {
        state.assessment.activeReportTab = "courses";
        saveState();
        renderDetailedReportScreen();
        showScreen("screen-report");
      });
    }
    if (ctaPlanBtn) {
      ctaPlanBtn.addEventListener("click", () => openTransitionPlanModal());
    }

    const toggleThemeBtn = document.getElementById("btn-settings-toggle-theme");
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        saveState();
        applyThemeAndViewport();
        renderSettingsScreen();
      });
    }

    const editProfileBtn = document.getElementById("btn-settings-edit-profile");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        openModal(
          "Edit your profile",
          `<div class="form-group">
            <label class="form-label" for="edit-prof-name">Your name</label>
            <input type="text" id="edit-prof-name" class="form-input" maxlength="60" value="${esc(state.user.fullName)}" />
          </div>
          ${INSTALL_PREVIEW?'':`<div class="form-group">
            <label class="form-label" for="edit-prof-handle">Username</label>
            <input type="text" id="edit-prof-handle" class="form-input" maxlength="35" value="${esc(state.user.username)}" />
          </div>`}
          <p id="profile-error" class="form-error" role="alert"></p>
          <button type="button" id="btn-save-prof-edits" class="btn-primary">Save changes</button>`
        );
        const saveBtn = document.getElementById("btn-save-prof-edits");
        if (saveBtn) {
          saveBtn.addEventListener('click',async()=>{
            saveBtn.disabled=true;
            const profile={fullName:INSTALL_PREVIEW?window.NucleusDemo.name(document.getElementById('edit-prof-name').value):sanitizeText(document.getElementById('edit-prof-name').value,60),username:INSTALL_PREVIEW?'guest':sanitizeText(document.getElementById('edit-prof-handle').value,35)};
            try{
              if(!profile.fullName){document.getElementById('profile-error').textContent='Enter your name.';return;}
              if(state.isAuthenticated){const result=await window.NucleusAPI.request('profile','PUT',profile);state.user={...result.user,fullName:profile.fullName,username:profile.username};}
              else state.user={...state.user,...profile};
              if(INSTALL_PREVIEW){state.displayName=profile.fullName;saveState();}
              renderSettingsScreen();renderWelcomeScreen();closeModal();
            }catch(error){showTimerAlertToast('Profile not saved',error.message,6000);}finally{saveBtn.disabled=false;}
          });
        }
      });
    }

    const resetSettingsBtn = document.getElementById("btn-settings-new-assessment");
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener("click", () => {
        resetAndStartNewAssessment();
      });
    }

    const logoutBtn = document.getElementById("btn-settings-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener('click',async()=>{
        if(INSTALL_PREVIEW){signOutDemo();return;}
        if(state.isAuthenticated){if(!await flushState()){showTimerAlertToast('Changes not saved','Retry saving before signing out.');return;}
          try{await window.NucleusAPI.request('auth/logout','POST',{});}catch(error){showTimerAlertToast('Could not sign out',error.message);return;}}
        authEpoch++;clearTimeout(saveTimer);state=freshState();bookings=[];changeVersion=0;savedVersion=0;closeModal();
        document.getElementById('workspace-save-status').textContent='';renderWelcomeScreen();showScreen('screen-login',{replaceHistory:true});
      });
    }

    bindEnhancements();
    const modalCloseBtn = document.getElementById("btn-close-modal");
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal);
    }
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
