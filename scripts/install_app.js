// PWA installation is available on HTTPS / localhost, not a plain Wi-Fi IP.
(function () {
  'use strict';
  let deferredPrompt=null, installed=false, prompting=false;
  const standalone=window.matchMedia('(display-mode: standalone)');
  const secure=window.isSecureContext && /^https?:$/.test(location.protocol);
  const isNative=()=>window.NucleusPlatform?.native===true;
  const isInstalled=()=>isNative() || installed || standalone.matches || navigator.standalone===true;
  function update() {
    const status=document.getElementById('install-status');
    if(!status)return;
    if(isNative()){
      status.textContent='Android app - version '+(window.NucleusRuntime?.version||'8.6.0');
      document.getElementById('install-home-card').hidden=true;
      document.querySelectorAll('[data-install-app]').forEach(button=>button.hidden=true);
      return;
    }
    const launched=standalone.matches || navigator.standalone===true;
    status.textContent=launched?'Running as an app · launch it from your home screen.':installed?'Added to your device. Close this tab and open Nucleus MedLabs from your home screen.':!secure?'Open the HTTPS installation preview to install on your Pad.':deferredPrompt?'Ready to install Nucleus MedLabs on this device.':'In Chrome, use ⋮ → Add to Home screen → Install. If already installed, choose Open in app.';
    document.getElementById('install-home-card').hidden=isInstalled() || !secure;
    document.querySelectorAll('[data-install-app]').forEach(button=>{button.hidden=isInstalled();button.disabled=prompting;});
  }
  function showHelp(message) {
    document.getElementById('install-help-text').textContent=message;
    document.getElementById('install-help-dialog').showModal();
  }
  async function requestInstall() {
    if(prompting || isInstalled())return;
    if(!secure){showHelp('This Wi-Fi address can open in Chrome, but app installation needs HTTPS. Start the installation preview on your Mac, then open its https:// link on this Pad.');return;}
    if(!deferredPrompt){showHelp('In Chrome on your Pad, tap ⋮ → Add to Home screen → Install. If Chrome offers Open in app, it is already installed. If you only see Create shortcut, keep this page open until Settings says Ready for offline use, then reload and try again.');return;}
    const prompt=deferredPrompt;deferredPrompt=null;prompting=true;update();
    try {
      await prompt.prompt();
      const choice=await prompt.userChoice;
      // An accepted prompt is not proof that Android finished installation.
      if(choice.outcome==='accepted')showHelp('Chrome is adding Nucleus MedLabs to your device. Wait for installation to finish, then open its icon from your home screen or app drawer.');
    }catch(error){showHelp('Chrome could not open the install prompt. Use ⋮ → Add to Home screen → Install, or reload this HTTPS page and try again.');}
    finally{prompting=false;update();}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;update();});
  window.addEventListener('appinstalled',()=>{installed=true;deferredPrompt=null;update();});
  standalone.addEventListener('change',update);
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-install-app]').forEach(button=>button.addEventListener('click',requestInstall));
    document.getElementById('install-help-close').addEventListener('click',()=>document.getElementById('install-help-dialog').close());
    update();
    const note=document.getElementById('offline-note');
    if(isNative()){note.textContent='Career tools are included in this app. Updates and external resources need internet.';return;}
    note.textContent=secure?'Preparing offline access…':'Offline app access needs the HTTPS installation preview. Account saves need the Mac server.';
  });
  window.addEventListener('load',async()=>{
    const note=document.getElementById('offline-note');
    if(isNative()){note.textContent='Career tools are included in this app. Updates and external resources need internet.';return;}
    if(!secure || !('serviceWorker' in navigator)){if(secure)note.textContent='Offline support is unavailable in this browser.';return;}
    let timer;
    try {
      timer=setTimeout(()=>{note.textContent='Offline preparation is taking longer. Keep this page open with internet access.';},15000);
      await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      note.textContent='Ready for offline use on this device. Account saves and external links still need a connection.';
    }catch(error){note.textContent='Offline setup failed. Keep the preview running, check your connection and reload.';}
    finally{clearTimeout(timer);}
  });
})();
