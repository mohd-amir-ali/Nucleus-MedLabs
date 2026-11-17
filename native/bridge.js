import {Capacitor, SystemBars, SystemBarsStyle} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Preferences} from '@capacitor/preferences';
import {Filesystem, Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {Browser} from '@capacitor/browser';
import {SplashScreen} from '@capacitor/splash-screen';

if (Capacitor.isNativePlatform()) {
  const key = 'nucleus-workspace-v7';
  let workspace = {}, writes = Promise.resolve();
  let storageError = null;
  const ready = Preferences.get({key}).then(({value}) => { workspace = value ? JSON.parse(value) : {}; }).catch(error => { storageError = error; throw error; });
  window.NucleusPlatform = {
    native: true, ready,
    loadWorkspace: () => workspace,
    saveWorkspace(value) {
      if (storageError) return Promise.reject(new Error("Existing storage could not be read. Restart the app before saving."));
      const data = JSON.stringify(value); workspace = JSON.parse(data);
      writes = writes.catch(() => {}).then(() => Preferences.set({key, value: data}));
      return writes;
    },
    async clearWorkspace() { await writes.catch(() => {}); await Preferences.remove({key}); workspace = {}; storageError = null; },
    async download(bytes, filename, type) {
      const blob = new Blob([bytes], {type});
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      const path = 'exports/' + filename.replace(/[^a-zA-Z0-9._-]/g, '-');
      await Filesystem.writeFile({path, data, directory: Directory.Cache, recursive: true});
      const {uri} = await Filesystem.getUri({path, directory: Directory.Cache});
      await Share.share({title: 'Nucleus MedLabs', files: [uri], dialogTitle: 'Save or share your file'});
    },
    async openExternal(url) {
      const parsed = new URL(url); if (parsed.protocol !== 'https:') throw new Error('Only secure links are supported.');
      await Browser.open({url: parsed.href});
    }
  };
  document.documentElement.dataset.platform = 'android';
  const applyBars = () => SystemBars.setStyle({style: document.documentElement.dataset.theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light}).catch(() => {});
  new MutationObserver(applyBars).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  applyBars();
  App.addListener('backButton', () => {
    const event = new Event('nucleus-back', {cancelable: true});
    if (window.dispatchEvent(event)) App.minimizeApp();
  });
  App.addListener('appStateChange', ({isActive}) => window.dispatchEvent(new CustomEvent('nucleus-app-state', {detail: {isActive}})));
  window.addEventListener('nucleus-ready', () => SplashScreen.hide());
}
