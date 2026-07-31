(function () {
  'use strict';

  var STORAGE_KEY = 'kylo-color-theme';
  var systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function storedTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : '';
    } catch (error) {
      return '';
    }
  }

  function isDark() {
    if (document.body.classList.contains('theme-force-dark')) return true;
    if (document.body.classList.contains('theme-force-light')) return false;
    return !!(systemDark && systemDark.matches);
  }

  function applyTheme(value) {
    document.body.classList.toggle('theme-force-dark', value === 'dark');
    document.body.classList.toggle('theme-force-light', value === 'light');
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  }

  function updateButtons() {
    var dark = isDark();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      var label = dark ? '切换到日间模式' : '切换到暗黑模式';
      var icon = button.querySelector('i');
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.setAttribute('title', label);
      if (icon) icon.className = dark ? 'fa fa-sun' : 'fa fa-moon';
    });
  }

  function announceTheme() {
    var dark = isDark();
    updateButtons();
    window.dispatchEvent(new CustomEvent('kylo:theme-change', {
      detail: { dark: dark }
    }));
    if (typeof window.KyloSyncGiscusTheme === 'function') {
      window.KyloSyncGiscusTheme();
    }
  }

  function setTheme(value) {
    applyTheme(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // The selected theme still applies when storage is unavailable.
    }
    announceTheme();
  }

  function bindButtons() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      if (button.dataset.themeToggleBound === 'true') return;
      button.dataset.themeToggleBound = 'true';
      button.addEventListener('click', function () {
        setTheme(isDark() ? 'light' : 'dark');
      });
    });
    updateButtons();
  }

  function init() {
    var saved = storedTheme();
    if (saved) applyTheme(saved);
    bindButtons();
    announceTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pjax:success', bindButtons);
  window.addEventListener('kylo:theme-change', updateButtons);
  if (systemDark) {
    var onSystemChange = function () {
      if (!storedTheme()) announceTheme();
    };
    if (typeof systemDark.addEventListener === 'function') {
      systemDark.addEventListener('change', onSystemChange);
    } else if (typeof systemDark.addListener === 'function') {
      systemDark.addListener(onSystemChange);
    }
  }
})();
