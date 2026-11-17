const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup(installPreview=false){
 const storage=new Map(),statuses=[];
 const context={window:{NucleusRuntime:{installPreview},addEventListener(){},dispatchEvent(){},NucleusAPI:{request:async()=>({revision:1})}},document:{addEventListener(){},body:{dataset:{}},getElementById(){return {hidden:false,textContent:''}}},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},setTimeout(fn,ms){if(ms===450)queueMicrotask(fn);return 1},clearTimeout(){},setInterval(){},clearInterval(){},Date,Math,Event,URL};
 vm.runInNewContext(fs.readFileSync(path.join(root,'data/career_engine_data.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/updates.js'),'utf8'),context);
 let source=fs.readFileSync(path.join(root,'scripts/app_controller.js'),'utf8');
 source=source.replace(/\}\)\(\);\s*$/,`setSaveStatus=(text)=>window.statuses.push(text);renderProfessionScreen=()=>{};showScreen=()=>{};renderWelcomeScreen=()=>{};applyThemeAndViewport=()=>{};configureDemoLogin=()=>{};
 window.test={state:()=>state,normalizeAssessment,readWorkspace,archiveAssessment,resetAndStartNewAssessment,saveState,flushState,acceptSession,bootSession,
 counters:()=>({revision,changeVersion,savedVersion,syncBlocked,sessionExpired})};})();`);
 context.window.statuses=statuses;vm.runInNewContext(source,context);
 return {api:context.window.test,window:context.window,storage,statuses};
}
async function main(){let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
 await test('Demonstration boot preserves progress but requires login without any account API call',async()=>{
  const {api,window,storage}=setup(true);window.NucleusDemo={name:value=>String(value||'')};let calls=0;window.NucleusAPI.request=async()=>{calls++;throw new Error('No API in preview');};
  storage.set('nml_guest_workspace_v6',JSON.stringify({assessment:{professionId:'nurse',additionalSkills:['Saved on Pad']}}));
  await api.bootSession();assert.equal(calls,0);assert(!api.state().isGuest);assert(!api.state().isAuthenticated);assert.equal(api.state().assessment.additionalSkills[0],'Saved on Pad');
 });
 await test('A new assessment archives an independent snapshot and keeps favorites',()=>{
  const {api}=setup(),state=api.state();state.isGuest=true;state.assessment.professionId='nurse';state.assessment.additionalSkills=['Excel'];state.assessment.savedRoles=['regulatory_affairs_associate'];state.assessment.completedRoadmapSteps={regulatory_affairs_associate:{1:'2026-11-09'}};
  api.resetAndStartNewAssessment();assert.equal(state.assessment.professionId,'');assert.equal(state.history.length,1);assert.equal(state.history[0].assessment.professionId,'nurse');assert.equal(state.assessment.savedRoles.length,1);assert.equal(Object.keys(state.assessment.completedRoadmapSteps).length,0);
  state.assessment.additionalSkills.push('Different');assert.equal(state.history[0].assessment.additionalSkills.length,1);
 });
 await test('Imported workspace data cannot authenticate or replace account identity',()=>{
  const {api}=setup();api.readWorkspace({isAuthenticated:true,user:{fullName:'Forged'},assessment:{professionId:'missing',additionalSkills:'invalid',selectedDirections:['missing'],qualification:'invented'}});
  assert.equal(api.state().isAuthenticated,false);assert.equal(api.state().user.fullName,'Guest');assert.equal(api.state().assessment.professionId,'');assert.equal(api.state().assessment.additionalSkills.length,0);assert.equal(api.state().assessment.selectedDirections.length,0);assert.equal(api.state().assessment.qualification,'');
 });
 await test('Guest storage contains no account identity or authentication material',()=>{
  const {api,storage}=setup();api.state().isGuest=true;api.state().user={contact:'private@example.test',passwordHash:'never-store'};api.saveState();
  const text=Array.from(storage.values())[0];assert(!text.includes('private@example.test'));assert(!text.includes('passwordHash'));assert(!text.includes('isAuthenticated'));
 });
 await test('Account changes never fall back into shared browser storage',async()=>{
  const {api,storage}=setup();api.state().isAuthenticated=true;api.saveState();assert(await api.flushState());assert.equal(storage.size,0);assert.equal(api.counters().savedVersion,api.counters().changeVersion);
 });
 await test('Conflicting saves stop retries and preserve unsaved work',async()=>{
  const {api,window}=setup();let calls=0;window.NucleusAPI.request=async()=>{calls++;const error=new Error('Conflict');error.status=409;throw error;};api.state().isAuthenticated=true;api.state().assessment.additionalSkills=['Unsaved skill'];api.saveState();assert.equal(await api.flushState(),false);assert(api.counters().syncBlocked);assert.equal(await api.flushState(),false);assert.equal(calls,1);assert.equal(api.state().assessment.additionalSkills[0],'Unsaved skill');
 });
 await test('An expired session preserves work and requests reauthentication',async()=>{
  const {api,window}=setup();window.NucleusAPI.request=async()=>{const error=new Error('Expired');error.status=401;throw error;};api.state().isAuthenticated=true;api.saveState();assert.equal(await api.flushState(),false);assert(api.counters().sessionExpired);assert(api.counters().savedVersion<api.counters().changeVersion);
 });
 await test('A network failure can be retried without losing changes',async()=>{
  const {api,window}=setup();let attempt=0;window.NucleusAPI.request=async()=>{if(!attempt++)throw new Error('Offline');return {revision:1};};api.state().isAuthenticated=true;api.saveState();assert.equal(await api.flushState(),false);assert.equal(await api.flushState(),true);assert.equal(api.counters().revision,1);
 });
 await test('Edits made during a save are sent in order with the new revision',async()=>{
  const {api,window}=setup();let release;const requests=[];window.NucleusAPI.request=async(path,method,body)=>{requests.push(JSON.parse(JSON.stringify(body)));if(requests.length===1)await new Promise(resolve=>release=resolve);return {revision:requests.length};};api.state().isAuthenticated=true;api.state().assessment.additionalSkills=['First'];api.saveState();const pending=api.flushState();api.state().assessment.additionalSkills.push('Second');api.saveState();release();await pending;
  assert.equal(requests.length,2);assert.equal(requests[0].revision,0);assert.equal(requests[1].revision,1);assert.equal(requests[1].workspace.assessment.additionalSkills.length,2);
 });
 console.log(`${count} workspace checks passed.`);
}
module.exports=main();
