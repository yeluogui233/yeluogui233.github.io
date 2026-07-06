(function () {
  'use strict';

  var groups = {
    pages: ['/gallery/', '/books/', '/movies/', '/diary/', '/bake/', '/steamgames/', '/games/', '/steam/'],
    archives: ['/archives/', '/tags/', '/categories/']
  };

  function cleanPath(value) {
    try {
      var url = new URL(value, window.location.origin);
      value = url.pathname;
    } catch (error) {
      value = String(value || '');
    }

    value = value.replace(/\/index\.html$/i, '/');
    if (!value.startsWith('/')) value = '/' + value;
    if (value.length > 1 && !value.endsWith('/')) value += '/';
    return value;
  }

  function markItem(item) {
    if (item) item.classList.add('menu-item-active');
  }

  function clearMenu() {
    document.querySelectorAll('.main-menu .menu-item-active, .sub-menu .menu-item-active').forEach(function (item) {
      item.classList.remove('menu-item-active');
    });
  }

  function stripIds(node) {
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(function (child) {
      child.removeAttribute('id');
    });
  }

  function flattenMobileMenu() {
    document.querySelectorAll('.main-menu > .mobile-menu-clone').forEach(function (item) {
      item.remove();
    });

    document.querySelectorAll('.main-menu > .menu-item-has-children').forEach(function (parent) {
      var childMenu = parent.querySelector(':scope > .menu-child');
      if (!childMenu) return;

      Array.prototype.slice.call(childMenu.children).forEach(function (child) {
        var clone = child.cloneNode(true);
        var groupClass = Array.prototype.find.call(parent.classList, function (name) {
          return name.indexOf('menu-item-') === 0 && name !== 'menu-item' && name !== 'menu-item-has-children';
        });
        stripIds(clone);
        clone.classList.add('mobile-menu-clone');
        if (groupClass) clone.classList.add('mobile-from-' + groupClass.replace('menu-item-', ''));
        parent.parentNode.insertBefore(clone, parent);
      });
    });
  }

  function activateMenu() {
    var current = cleanPath(window.location.pathname);
    clearMenu();

    document.querySelectorAll('.main-menu .menu-item a[href], .sub-menu .menu-item a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      var target = cleanPath(href);
      var isHome = target === '/';
      var exact = current === target;
      var child = !isHome && current.indexOf(target) === 0;

      if (exact || child) {
        markItem(link.closest('.menu-item'));
      }
    });

    Object.keys(groups).forEach(function (group) {
      var active = groups[group].some(function (target) {
        return current.indexOf(target) === 0;
      });

      if (active) {
        markItem(document.querySelector('.main-menu > .menu-item-' + group));
      }
    });
  }

  function refreshMenu() {
    flattenMobileMenu();
    activateMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshMenu);
  } else {
    refreshMenu();
  }

  window.addEventListener('pjax:success', refreshMenu);
})();
