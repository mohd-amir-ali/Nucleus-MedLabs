(function (root) {
  'use strict';
  const key = 'nml_guest_workspace_v6';
  function download(bytes, filename, type) {
    const url = URL.createObjectURL(new Blob([bytes], {type}));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return Promise.resolve();
  }
  root.NucleusPlatform = {
    native: false, ready: Promise.resolve(),
    loadWorkspace() { return JSON.parse(localStorage.getItem(key) || '{}'); },
    saveWorkspace(workspace) { localStorage.setItem(key, JSON.stringify(workspace)); return Promise.resolve(); },
    clearWorkspace() { localStorage.removeItem(key); return Promise.resolve(); },
    download,
    openExternal(url) { const parsed = new URL(url); if (parsed.protocol !== 'https:') throw new Error('Only secure links are supported.'); window.open(parsed.href, '_blank', 'noopener,noreferrer'); }
  };
})(window);
