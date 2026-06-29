(function () {
  'use strict';

  function isTouchMenuMode() {
    return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)').matches;
  }

  function closeAll(except) {
    document.querySelectorAll('.main-menu .menu-item-has-children.is-touch-open').forEach(function (item) {
      if (item !== except) item.classList.remove('is-touch-open');
    });
  }

  function bind() {
    document.querySelectorAll('.main-menu .menu-item-has-children > a').forEach(function (link) {
      if (link.dataset.touchMenuBound === 'true') return;
      link.dataset.touchMenuBound = 'true';

      function toggleMenu(event) {
        if (!isTouchMenuMode()) return;

        var item = link.closest('.menu-item-has-children');
        if (!item) return;

        event.preventDefault();
        event.stopPropagation();

        if (item.classList.contains('is-touch-open')) {
          item.classList.remove('is-touch-open');
        } else {
          closeAll(item);
          item.classList.add('is-touch-open');
        }
      }

      link.addEventListener('pointerup', function (event) {
        if (event.pointerType === 'mouse' && !isTouchMenuMode()) return;
        toggleMenu(event);
      });

      link.addEventListener('click', toggleMenu);
    });

    document.addEventListener('click', function (event) {
      if (!isTouchMenuMode()) return;
      if (!event.target.closest('.main-menu .menu-item-has-children')) {
        closeAll();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.addEventListener('pjax:success', bind);
})();
