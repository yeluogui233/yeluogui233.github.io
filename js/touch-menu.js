(function () {
  'use strict';

  function isTouchMenuMode() {
    return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)').matches;
  }

  function closeAll(except) {
    document.querySelectorAll('.main-menu .menu-item-has-children.is-touch-open').forEach(function (item) {
      if (item !== except) {
        item.classList.remove('is-touch-open');
        var toggle = item.querySelector('.menu-parent-toggle, > a');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function normalizePath(path) {
    if (!path) return '/';
    path = path.replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
    if (path.charAt(0) !== '/') path = '/' + path;
    if (path !== '/' && path.charAt(path.length - 1) !== '/') path += '/';
    return path;
  }

  function getDirectLink(item) {
    for (var i = 0; i < item.children.length; i++) {
      var child = item.children[i];
      if (child.matches && child.matches('a[href], .menu-parent-toggle[href]')) {
        return child;
      }
    }
    return null;
  }

  function isCurrentLink(link, currentPath) {
    try {
      var target = new URL(link.getAttribute('href'), window.location.origin);
      if (target.hostname !== window.location.hostname) return false;
      var targetPath = normalizePath(target.pathname);
      if (targetPath === '/') return currentPath === '/';
      return currentPath === targetPath || currentPath.indexOf(targetPath) === 0;
    } catch (error) {
      return false;
    }
  }

  function markActiveMenuState() {
    var menu = document.querySelector('.main-menu');
    if (!menu) return;

    var currentPath = normalizePath(window.location.pathname);
    menu.querySelectorAll('.menu-item-active').forEach(function (item) {
      item.classList.remove('menu-item-active');
    });

    menu.querySelectorAll('.menu-item').forEach(function (item) {
      var link = getDirectLink(item);
      if (link && isCurrentLink(link, currentPath)) {
        item.classList.add('menu-item-active');
      }
    });

    menu.querySelectorAll('.menu-item-has-children').forEach(function (parent) {
      if (parent.querySelector('.menu-child .menu-item-active')) {
        parent.classList.add('menu-item-active');
      }
    });
  }

  function bind() {
    document.querySelectorAll('.main-menu .menu-item-has-children > .menu-parent-toggle, .main-menu .menu-item-has-children > a').forEach(function (link) {
      if (link.dataset.touchMenuBound === 'true') return;
      link.dataset.touchMenuBound = 'true';
      var lastPointerToggleAt = 0;

      function toggleMenu(event) {
        if (!isTouchMenuMode()) return;

        var item = link.closest('.menu-item-has-children');
        if (!item) return;

        event.preventDefault();
        event.stopPropagation();

        if (item.classList.contains('is-touch-open')) {
          item.classList.remove('is-touch-open');
          link.setAttribute('aria-expanded', 'false');
        } else {
          closeAll(item);
          item.classList.add('is-touch-open');
          link.setAttribute('aria-expanded', 'true');
        }
      }

      link.addEventListener('pointerup', function (event) {
        if (event.pointerType === 'mouse' && !isTouchMenuMode()) return;
        lastPointerToggleAt = Date.now();
        toggleMenu(event);
      });

      link.addEventListener('click', function (event) {
        if (Date.now() - lastPointerToggleAt < 500) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        toggleMenu(event);
      });
    });

    document.addEventListener('click', function (event) {
      if (!isTouchMenuMode()) return;
      if (!event.target.closest('.main-menu .menu-item-has-children')) {
        closeAll();
      }
    });
  }

  function init() {
    bind();
    markActiveMenuState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pjax:success', init);
})();
