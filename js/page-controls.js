(function() {
  'use strict';

  const pickers = new WeakMap();
  const pageAnimations = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened = null;
  const chevron = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const check = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="m3.5 8 3 3 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function close(record = opened) {
    if (!record) return;
    record.menu.hidden = true;
    record.root.classList.remove('page-jump-open');
    record.button.setAttribute('aria-expanded', 'false');
    record.button.removeAttribute('aria-activedescendant');
    if (opened === record) opened = null;
  }

  function activate(record, index) {
    record.active = Math.max(0, Math.min(record.options.length - 1, index));
    record.options.forEach((option, position) => option.classList.toggle('page-jump-active', position === record.active));
    const option = record.options[record.active];
    if (option && !record.menu.hidden) {
      record.button.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  function place(record) {
    const rect = record.button.getBoundingClientRect();
    const menuHeight = Math.min(record.menu.scrollHeight, 240);
    record.menu.dataset.side = rect.top < menuHeight + 16 && innerHeight - rect.bottom > rect.top ? 'below' : 'above';
  }

  function open(record) {
    if (record.select.disabled || !record.options.length) return;
    if (opened && opened !== record) close();
    record.menu.hidden = false;
    place(record);
    record.root.classList.add('page-jump-open');
    record.button.setAttribute('aria-expanded', 'true');
    opened = record;
    activate(record, record.select.selectedIndex);
  }

  function choose(record, index) {
    const option = record.select.options[index];
    if (!option || option.disabled) return;
    const changed = record.select.value !== option.value;
    record.button.focus({ preventScroll: true });
    close(record);
    record.select.value = option.value;
    if (changed) record.select.dispatchEvent(new Event('change', { bubbles: true }));
    sync(record.select);
  }

  function sync(select) {
    if (!select) return;
    let record = pickers.get(select);
    if (!record) {
      if (!select.options.length) return;
      const label = select.labels[0];
      let root = select.parentElement;
      if (!root.classList.contains('page-selector-wrapper')) {
        root = document.createElement('span');
        select.before(root);
        root.appendChild(select);
      }
      root.classList.add('page-jump-control');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = select.id + '-button';
      button.className = 'page-jump-trigger';
      button.setAttribute('role', 'combobox');
      button.setAttribute('aria-haspopup', 'listbox');
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<span class="page-jump-value"></span>' + chevron;
      const value = button.querySelector('.page-jump-value');
      value.id = select.id + '-value';
      if (label) {
        if (!label.id) label.id = select.id + '-label';
        label.htmlFor = button.id;
        button.setAttribute('aria-labelledby', label.id + ' ' + value.id);
      } else button.setAttribute('aria-label', select.getAttribute('aria-label') || '选择页码');
      const menu = document.createElement('div');
      menu.id = select.id + '-menu';
      menu.className = 'page-jump-menu';
      menu.setAttribute('role', 'listbox');
      menu.setAttribute('aria-label', '页码');
      menu.hidden = true;
      button.setAttribute('aria-controls', menu.id);
      root.append(button, menu);
      record = { select, root, button, value, menu, options: [], signature: '', active: 0 };
      pickers.set(select, record);
      button.addEventListener('click', () => menu.hidden ? open(record) : close(record));
      button.addEventListener('keydown', event => {
        const key = event.key;
        if (key === 'Escape') { if (!menu.hidden) event.preventDefault(); close(record); return; }
        if (key === 'Tab') { close(record); return; }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) return;
        event.preventDefault();
        if (menu.hidden) {
          open(record);
          if (key === 'Home') activate(record, 0);
          if (key === 'End') activate(record, record.options.length - 1);
        } else if (key === 'Enter' || key === ' ') choose(record, record.active);
        else activate(record, key === 'Home' ? 0 : key === 'End' ? record.options.length - 1 : record.active + (key === 'ArrowDown' ? 1 : -1));
      });
      select.addEventListener('change', () => sync(select));
      select.setAttribute('data-page-jump-native', '');
      select.hidden = true;
    }
    const signature = JSON.stringify([...select.options].map(option => [option.value, option.textContent, option.disabled]));
    if (signature !== record.signature) {
      record.signature = signature;
      const fragment = document.createDocumentFragment();
      record.options = [...select.options].map((source, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'page-jump-option';
        option.id = select.id + '-option-' + index;
        option.setAttribute('role', 'option');
        option.tabIndex = -1;
        option.disabled = source.disabled;
        const text = document.createElement('span');
        text.textContent = source.textContent;
        option.appendChild(text);
        option.insertAdjacentHTML('beforeend', check);
        option.addEventListener('click', () => choose(record, index));
        option.addEventListener('pointerenter', () => activate(record, index));
        fragment.appendChild(option);
        return option;
      });
      record.menu.replaceChildren(fragment);
    }
    record.value.textContent = select.options[select.selectedIndex]?.textContent || '';
    record.button.disabled = select.disabled;
    record.options.forEach((option, index) => option.setAttribute('aria-selected', String(index === select.selectedIndex)));
    activate(record, select.selectedIndex);
    if (select.disabled) close(record);
  }

  function reveal(container, direction = 1) {
    for (const animation of pageAnimations.get(container) || []) animation.cancel();
    container.classList.add('page-turn-content');
    // The mobile theme also has scrollable card wrappers. Bring every scroll
    // ancestor to the new page's start rather than moving only the window.
    container.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (reducedMotion.matches || typeof container.animate !== 'function') return;
    // Animate only the cards visible at the new page's start, avoiding a
    // composited layer the size of the entire long diary or photo wall.
    const cards = [...container.children].filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    }).slice(0, 8);
    // Read every resting transform before starting animations, preserving each
    // card's existing hover treatment. Only visible cards receive short effects.
    const transforms = cards.map(card => getComputedStyle(card).transform);
    const offset = direction < 0 ? -8 : 8;
    const animations = cards.map((card, index) => card.animate([
      { opacity: .35, transform: `translate3d(${offset}px, 6px, 0)${transforms[index] === 'none' ? '' : ' ' + transforms[index]}` },
      { opacity: 1, transform: transforms[index] }
    ], { duration: 260, delay: Math.min(index * 12, 48), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    pageAnimations.set(container, animations);
  }

  document.addEventListener('pointerdown', event => {
    if (opened && !opened.root.contains(event.target)) close();
  }, { passive: true });
  document.addEventListener('focusin', event => {
    if (opened && !opened.root.contains(event.target)) close();
  });
  window.addEventListener('resize', () => { if (opened) place(opened); }, { passive: true });
  window.KyloPageControls = { sync, reveal };
  const initialize = () => document.querySelectorAll('#page-selector, #photo-page-select, [data-media-page-select]').forEach(sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
