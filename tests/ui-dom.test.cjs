const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');

async function main(){
 const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(root+'/app.html','utf8'),{url:'https://nucleus.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
 const w=dom.window,d=w.document;
 try{
  let carouselTick;const originalInterval=w.setInterval.bind(w);w.setInterval=(fn,ms)=>{if(ms===100)carouselTick=fn;return originalInterval(fn,ms);};
  w.matchMedia=()=>({matches:true,addEventListener(){}});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.fetch=async()=>({ok:true,text:async()=>fs.readFileSync(root+'/data/updates.json','utf8')});
  w.AbortController=AbortController;w.TextEncoder=TextEncoder;Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
  await new Promise(resolve=>d.addEventListener('DOMContentLoaded',resolve,{once:true}));
  for(const element of d.querySelectorAll('script[src]')){
   const name=element.getAttribute('src');
   if(name.includes('pdf_vendor'))continue;
   w.eval(fs.readFileSync(root+'/'+name,'utf8'));
  }
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  await new Promise(resolve=>setTimeout(resolve,550));
  assert.equal(d.body.dataset.screen,'screen-login');
  const click=selector=>{const el=d.querySelector(selector);assert(el,selector+' missing');el.click();return el;};
  const settle=()=>new Promise(resolve=>setTimeout(resolve,25));
  async function login(name='Amir',email='amirali@nml.com',password='nml@123'){
   d.querySelector('#login-name-input').value=name;d.querySelector('#login-contact-input').value=email;d.querySelector('#login-password-input').value=password;click('#btn-login-submit');await settle();
  }
  click('#btn-guest');assert.equal(d.body.dataset.screen,'screen-login');
  await login('');assert.match(d.querySelector('#login-error').textContent,/Enter your name/);
  await login('Amir','wrong@nml.com');assert.equal(d.body.dataset.screen,'screen-login');
  await login('Amir','amirali@nml.com','wrong');assert.equal(d.body.dataset.screen,'screen-login');
  await login('Amir');assert.equal(d.body.dataset.screen,'screen-welcome');
  assert.match(d.querySelector('#welcome-user-greeting').textContent,/Amir/);
  assert.equal(d.querySelector('#login-password-input').value,'nml@123');
  assert(d.querySelector('#workspace-save-notice').hidden);
  assert.equal(d.querySelector('#btn-carousel-pause'),null);assert.equal(d.querySelector('#preview-mode-note'),null);assert.equal(d.querySelector('#dashboard-requests'),null);
  const dot=click('.hero-dot');dot.blur();w.matchMedia=()=>({matches:false,addEventListener(){}});
  for(let i=0;i<29;i++)carouselTick();assert(d.querySelectorAll('.hero-dot')[0].classList.contains('active'));
  carouselTick();assert(d.querySelectorAll('.hero-dot')[1].classList.contains('active'),'30 ticks of 100ms must advance the banner');
  w.matchMedia=()=>({matches:true,addEventListener(){}});for(let i=0;i<35;i++)carouselTick();assert(d.querySelectorAll('.hero-dot')[1].classList.contains('active'),'Reduced motion must stop autoplay');
  const external=[];w.NucleusPlatform.openExternal=url=>external.push(url);
  for(const key of ['start','skills','compare','roadmap','courses','counselling']){
    click('[data-tile-action="'+key+'"]');assert.equal(d.body.dataset.screen,'screen-welcome');
    assert(d.querySelector('#app-modal-backdrop').classList.contains('open'));assert(d.querySelector('#app-modal-body').textContent.length>150);
    if(key==='counselling'){click('#app-modal-body .feature-action');assert.equal(external.pop(),'https://nucleusmedlabs.com/contact');}
    else assert(d.querySelector('#btn-feature-continue'));
    click('#btn-close-modal');
  }
  assert.equal(d.querySelector('#btn-refresh-updates'),null);
  click('#btn-start-journey');click('[data-prof-id="nurse"]');click('#btn-step1-proceed');
  assert.equal(d.body.dataset.screen,'screen-profile');
  const trigger=click('#dd-qualification-host .select-trigger');
  assert.equal(trigger.getAttribute('aria-expanded'),'true');trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'),'false','Second click must close the menu');
  trigger.click();d.body.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(trigger.getAttribute('aria-expanded'),'false');
  trigger.click();d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.activeElement,trigger);
  for(const id of ['dd-qualification-host','dd-experience-host','dd-setting-host']){click('#'+id+' .select-trigger');click('#'+id+' [role="option"]');}
  // Select a profile and exercise every report pane through its actual UI.
  const next=d.querySelector('#btn-profile-next');assert(next);next.click();
  assert.equal(d.body.dataset.screen,'screen-direction');click('[data-dir-id]');click('#btn-direction-next');await new Promise(resolve=>setTimeout(resolve,1900));
  assert.equal(d.body.dataset.screen,'screen-matches');click('[data-role-id]');click('#btn-step4-proceed');
  assert.equal(d.body.dataset.screen,'screen-report');
  for(const tab of d.querySelectorAll('[data-report-tab]'))tab.click();
  click('#btn-share-report');assert(d.querySelector('#btn-download-pdf'));click('#btn-close-modal');
  click('#btn-save-favorite-role');click('[data-nav="saved"]');assert(d.querySelector('#saved-page-content .btn-jump-saved-role'));
  click('[data-nav="compare"]');assert.equal(d.querySelectorAll('#compare-page-content .select-trigger').length,3);
  click('[data-report-tab="jobs"]');
  d.querySelector('#job-keywords').value='Clinical research';d.querySelector('#job-location').value='Hyderabad, India';d.querySelector('#job-experience').value='2';d.querySelector('#job-employment').value='F';d.querySelector('#job-workplace').value='2';d.querySelector('#job-date').value='r86400';
  for(const id of ['job-keywords','job-location','job-experience','job-employment','job-workplace','job-date'])d.getElementById(id).dispatchEvent(new w.Event('change'));
  click('#btn-sync-linkedin-live');const search=new URL(external.pop());assert.equal(search.searchParams.get('keywords'),'Clinical research');assert.equal(search.searchParams.get('f_E'),'2');assert.equal(search.searchParams.get('f_JT'),'F');assert.equal(search.searchParams.get('f_WT'),'2');assert.equal(search.searchParams.get('f_TPR'),'r86400');assert.equal(d.querySelectorAll('.job-card').length,0);
  click('[data-report-tab="skills"]');click('#card-bucket-gap');
  for(const box of [...d.querySelectorAll('#app-modal-body input[type="checkbox"]')]){if(!box.checked)box.click();}
  click('#btn-close-modal');assert(d.querySelector('#card-bucket-gap').classList.contains('skills-complete'));
  click('#card-bucket-gap');d.querySelector('[data-confirm-skill]').click();click('#btn-close-modal');assert(!d.querySelector('#card-bucket-gap').classList.contains('skills-complete'));
  click('[data-nav="updates"]');await new Promise(resolve=>setTimeout(resolve,20));assert.equal(d.querySelectorAll('#updates-list .update-card').length,12);assert.equal(new Set([...d.querySelectorAll('#updates-list .update-cover')].map(x=>x.src)).size,12);assert.equal(d.querySelectorAll('#updates-list .update-cover').length,d.querySelectorAll('#updates-list .update-card').length);for(const img of d.querySelectorAll('.update-cover'))assert(fs.existsSync(root+'/'+img.getAttribute('src')));
  click('#updates-list .update-bookmark');click('[data-nav="saved"]');assert(d.querySelector('#saved-updates-content .update-card'));
  click('#btn-open-settings');click('#btn-settings-toggle-theme');assert.equal(d.documentElement.dataset.theme,'dark');
  const malicious=w.NucleusUpdates.validate({schemaVersion:1,articles:[{id:'evil',title:'Bad',url:'javascript:alert(1)'},{id:'spoof',title:'Bad',url:'https://fda.gov.evil.test/x'}]});assert.equal(malicious.articles.length,0);
  const saved=JSON.parse(w.localStorage.getItem('nml_guest_workspace_v6'));assert.equal(saved.assessment.professionId,'nurse');assert.equal(saved.savedUpdates.length,1);assert.equal(saved.savedUpdateItems.length,1);assert.equal(saved.displayName,'Amir');assert(!JSON.stringify(saved).includes('nml@123'));assert(!JSON.stringify(saved).includes('amirali@nml.com'));
  assert.equal(new Set([...d.querySelectorAll('[id]')].map(x=>x.id)).size,d.querySelectorAll('[id]').length,'Duplicate IDs');
  click('#btn-settings-edit-profile');d.querySelector('#edit-prof-name').value='Amir O"Ali';click('#btn-save-prof-edits');await settle();
  assert.match(d.querySelector('#settings-user-fullname').textContent,/Amir O/);click('#btn-settings-edit-profile');assert.equal(d.querySelector('#edit-prof-name').value,'Amir O"Ali');click('#btn-close-modal');
  click('#btn-settings-logout');assert.equal(d.body.dataset.screen,'screen-login');
  w.dispatchEvent(new w.PopStateEvent('popstate',{state:{screenId:'screen-welcome'}}));assert.equal(d.body.dataset.screen,'screen-login');
  assert.equal(d.querySelector('#login-name-input').value,'Amir O"Ali');
  await login('Amir');assert.equal(d.body.dataset.screen,'screen-welcome');assert.equal(JSON.parse(w.localStorage.getItem('nml_guest_workspace_v6')).assessment.professionId,'nurse');
  click('#btn-open-settings');
  click('#btn-settings-clear');click('#confirm-clear-device');await new Promise(resolve=>setTimeout(resolve,20));assert.equal(w.localStorage.getItem('nml_guest_workspace_v6'),null);assert.equal(d.body.dataset.screen,'screen-login');assert.equal(d.querySelector('#login-name-input').value,'');
  assert.deepEqual(errors.map(e=>e.message),[]);
  console.info('PASS DOM integration: demonstration login, name, logout/back guard, preserved progress, article covers, assessment, all report panes, dropdown toggle/Escape/outside click, PDF dialog, navigation, saved articles, theme and unsafe feed links.');
 }finally{w.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
