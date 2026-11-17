const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup({secure=true,standalone=false}={}) {
 const events={},domEvents={},nodes=new Map(),buttons=[{},{}];
 function node(id){if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',addEventListener(type,fn){this[type]=fn;},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);}
 buttons.forEach(b=>b.addEventListener=function(type,fn){this[type]=fn;});
 const media={matches:standalone,addEventListener(type,fn){this[type]=fn;}},window={isSecureContext:secure,matchMedia:()=>media,addEventListener:(type,fn)=>events[type]=fn};
 const navigator={serviceWorker:{register:async()=>({}),ready:Promise.resolve({})}};
 const document={getElementById:node,querySelectorAll:()=>buttons,addEventListener:(type,fn)=>domEvents[type]=fn};
 vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/install_app.js'),'utf8'),{window,navigator,document,location:{protocol:secure?'https:':'http:'},setTimeout:()=>1,clearTimeout(){}});
 domEvents.DOMContentLoaded();return {events,node,buttons,navigator,media};
}
async function swResponse({path='/',status=200,body='<h1>Tunnel unavailable</h1>',method='GET'}={}) {
 const events={},writes=[],cached=new Response('<meta name="nucleus-app" content="6.1">Cached app');
 const origin='https://preview.example',self={location:{origin},registration:{scope:origin+'/'},addEventListener:(type,fn)=>events[type]=fn};
 const context={self,URL,AbortController,Response,setTimeout,clearTimeout,fetch:async()=>new Response(body,{status,headers:{'Content-Type':'text/html'}}),caches:{match:async()=>cached,open:async()=>({put:async(...args)=>writes.push(args)})}};
 vm.runInNewContext(fs.readFileSync(root+'/sw.js','utf8'),context);
 let response;events.fetch({request:{url:origin+path,method,mode:path.endsWith('.js')?'cors':'navigate'},respondWith:p=>response=p});
 return {response:response?await response:null,writes};
}
async function main(){let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
 await test('LAN HTTP explains HTTPS instead of pretending to install',async()=>{const t=setup({secure:false});assert(t.node('install-home-card').hidden);await t.buttons[0].click();assert(t.node('install-help-dialog').open);assert.match(t.node('install-help-text').textContent,/HTTPS/);});
 await test('Chrome install event triggers one prompt and consumes it',async()=>{const t=setup();let prompts=0,prevented=false;t.events.beforeinstallprompt({preventDefault(){prevented=true;},prompt:async()=>prompts++,userChoice:Promise.resolve({outcome:'dismissed'})});await t.buttons[0].click();await t.buttons[0].click();assert(prevented);assert.equal(prompts,1);assert(!t.buttons[0].hidden);});
 await test('Accepting a prompt is not treated as a finished installation',async()=>{const t=setup();t.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{},userChoice:Promise.resolve({outcome:'accepted'})});await t.buttons[0].click();assert(!t.buttons[0].hidden);t.events.appinstalled();assert(t.buttons.every(b=>b.hidden));assert.match(t.node('install-status').textContent,/Added/);});
 await test('Standalone launch hides all install controls',()=>{const t=setup({standalone:true});assert(t.buttons.every(b=>b.hidden));assert(t.node('install-home-card').hidden);assert.match(t.node('install-status').textContent,/Running as an app/);});
 await test('Offline readiness waits until the worker is active',async()=>{const t=setup();let ready;t.navigator.serviceWorker.ready=new Promise(resolve=>ready=resolve);const pending=t.events.load();await Promise.resolve();assert(!t.node('offline-note').textContent.startsWith('Ready'));ready({});await pending;assert(t.node('offline-note').textContent.startsWith('Ready'));});
 await test('Worker failure reports offline setup failure',async()=>{const t=setup();t.navigator.serviceWorker.register=async()=>{throw new Error('No storage');};await t.events.load();assert.match(t.node('offline-note').textContent,/failed/);});
 await test('A stopped tunnel returning HTTP 404 falls back to the cached app',async()=>{const t=await swResponse({status:404});assert.match(await t.response.text(),/Cached app/);assert.equal(t.writes.length,0);});
 await test('A provider HTML page returning HTTP 200 cannot replace the app',async()=>{const t=await swResponse();assert.match(await t.response.text(),/Cached app/);assert.equal(t.writes.length,0);});
 await test('An HTML error cannot poison a cached JavaScript file',async()=>{const t=await swResponse({path:'/scripts/runtime_config.js'});assert.equal(t.writes.length,0);assert(t.response);});
 await test('The worker never intercepts account API or write requests',async()=>{assert.equal((await swResponse({path:'/api/session'})).response,null);assert.equal((await swResponse({path:'/api/workspace',method:'PUT'})).response,null);});
 console.log(`${count} installation checks passed.`);
}
module.exports=main();
