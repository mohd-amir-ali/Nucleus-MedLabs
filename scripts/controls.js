(function (root) {
  'use strict';
  let active = null, sequence = 0;
  function close() {
    if (!active) return false;
    active.menu.hidden = true;
    active.trigger.setAttribute('aria-expanded', 'false');
    active = null;
    return true;
  }
  function mount(host, values, current, label, onChange) {
    close();
    const id = 'select-options-' + (++sequence);
    const wrap = document.createElement('div'); wrap.className = 'select-control';
    const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'select-trigger';
    trigger.setAttribute('role', 'combobox'); trigger.setAttribute('aria-label', label);
    trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-controls', id); trigger.setAttribute('aria-expanded', 'false');
    const text = document.createElement('span'); text.textContent = current || label;
    trigger.append(text);
    trigger.insertAdjacentHTML('beforeend', '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>');
    const menu = document.createElement('div'); menu.id = id; menu.className = 'select-options'; menu.hidden = true;
    menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-label', label);
    const items = values.map(value => {
      const item = document.createElement('div'); item.tabIndex = -1; item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(value === current)); item.textContent = value;
      item.addEventListener('click', () => {
        current = value; text.textContent = value;
        items.forEach(option => option.setAttribute('aria-selected', String(option === item)));
        close(); trigger.focus({preventScroll: true}); onChange(value);
      });
      menu.append(item); return item;
    });
    function open(index) {
      close(); menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); active = {menu, trigger, wrap};
      const rect = trigger.getBoundingClientRect(), available = window.visualViewport?.height || window.innerHeight;
      const clip = host.closest('.screen-viewport,.modal-sheet')?.getBoundingClientRect();
      const below = Math.min(available, clip?.bottom || available) - rect.bottom - 12;
      const above = rect.top - Math.max(0, clip?.top || 0) - 12;
      const upwards = below < 170 && above > below;
      menu.style.maxHeight = Math.max(60, Math.min(260, upwards ? above : below)) + 'px';
      wrap.classList.toggle('opens-up', upwards);
      (items[index ?? Math.max(0, values.indexOf(current))])?.focus({preventScroll: true});
      items[index ?? Math.max(0, values.indexOf(current))]?.scrollIntoView({block: 'nearest'});
    }
    trigger.addEventListener('click', () => { if (active?.trigger === trigger) close(); else open(); });
    wrap.addEventListener('keydown', event => {
      const index = items.indexOf(document.activeElement);
      if (event.key === 'Escape') { if (active?.trigger === trigger) { event.preventDefault(); event.stopPropagation(); close(); trigger.focus(); } return; }
      if (event.key === 'Tab') { close(); return; }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (active?.trigger !== trigger) open();
        else items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        if (active?.trigger === trigger) { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus(); }
      } else if ((event.key === 'Enter' || event.key === ' ') && index >= 0) {
        event.preventDefault(); event.stopPropagation(); items[index].click();
      } else if (event.key.length === 1 && /[a-z0-9]/i.test(event.key) && active?.trigger === trigger) {
        const next = items.find(item => item.textContent.toLowerCase().startsWith(event.key.toLowerCase())); next?.focus();
      }
    });
    wrap.append(trigger, menu); host.replaceChildren(wrap);
  }
  document.addEventListener('pointerdown', event => { if (active && !active.wrap.contains(event.target)) close(); });
  window.addEventListener('resize', close);
  root.NucleusSelect = {mount, close};
})(window);
