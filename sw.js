const CACHE_PREFIX='nucleus-medlabs-';
const CACHE_NAME=CACHE_PREFIX+'v8.6.0-updates-1';
const ASSETS=['./','./index.html','./app.html','./styles/platform.css','./scripts/web_platform.js','./assets/login-background.jpg','./assets/updates/career-transitions.jpg','./assets/updates/cv-preparation.jpg','./assets/updates/professional-profiles.jpg','./assets/updates/interviews.jpg','./assets/updates/counselling.jpg','./assets/updates/healthcare-privacy.jpg','./assets/updates/digital-health.jpg','./assets/updates/clinical-research.jpg','./assets/updates/regulatory-affairs.jpg','./assets/updates/medical-devices.jpg','./assets/updates/patient-safety.jpg','./assets/updates/professional-learning.jpg','./manifest.json','./styles/app.css','./styles/responsive.css','./scripts/platform.js','./scripts/demo_access.js','./scripts/controls.js','./scripts/updates.js','./scripts/pdf_vendor.js','./fonts/NotoSans-Regular.ttf','./fonts/NotoSans-Bold.ttf','./data/updates.json','./data/updates-bundled.js','./data/career_engine_data.js','./scripts/runtime_config.js','./scripts/install_app.js','./scripts/career_engine.js','./scripts/api.js','./scripts/pdf_export.js','./scripts/app_controller.js','./Logo-Brandkit/icons/app-rounded-dark.svg','./Logo-Brandkit/icons/app-rounded-light.svg','./Logo-Brandkit/icons/app-dark-192x192.png','./Logo-Brandkit/icons/app-dark-512x512.png','./Banner-Images/career-pathways.jpg','./Banner-Images/medical-advisory.jpg','./Banner-Images/learning-advancement.jpg','./Banner-Images/quality-regulatory.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Account responses and requests must never enter the public asset cache.
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  const allowed=!url.search&&ASSETS.some(asset=>new URL(asset,self.registration.scope).pathname===url.pathname);
  if(!allowed&&event.request.mode!=='navigate')return;
  event.respondWith((async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
    try{
      const response=await fetch(event.request,{signal:controller.signal});
      if(response.status>=400)throw new Error('Preview unavailable');
      // A stopped/reassigned tunnel can return an HTML error page with status 200.
      // Keep our cached app instead of replacing it with a provider's page.
      if(allowed){
        const type=response.headers.get('Content-Type')||'';
        const html=event.request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/');
        if(html){if(!(await response.clone().text()).includes('name="nucleus-app"'))throw new Error('Not the app shell');}
        else if(url.pathname.endsWith('.js')&&!/javascript/i.test(type))throw new Error('Not a script');
        else if(url.pathname.endsWith('.css')&&!/text\/css/i.test(type))throw new Error('Not a stylesheet');
      }
      if(response.ok&&allowed){try{const cache=await caches.open(CACHE_NAME);await cache.put(event.request,response.clone());}catch(error){/* Full cache must not block a valid online response. */}}
      return response;
    }catch(error){
      return await caches.match(event.request) || (event.request.mode==='navigate'?await caches.match(url.pathname.endsWith('/app.html')?'./app.html':'./index.html'):null) || new Response('Unavailable offline',{status:503,headers:{'Content-Type':'text/plain'}});
    }finally{clearTimeout(timer);}
  })());
});
