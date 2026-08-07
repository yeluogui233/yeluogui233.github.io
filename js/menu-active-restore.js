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
      var childMenu = Array.prototype.find.call(parent.children, function (node) {
        return node.classList && node.classList.contains('menu-child');
      });
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

    // A submenu represents a section. Keep its parent highlighted for every
    // descendant route, instead of relying on a fixed list of section paths.
    document.querySelectorAll('.main-menu > .menu-item-has-children').forEach(function (parent) {
      var childMenu = Array.prototype.find.call(parent.children, function (node) {
        return node.classList && node.classList.contains('menu-child');
      });
      if (!childMenu) return;

      var activeChild = Array.prototype.some.call(
        childMenu.querySelectorAll('.menu-item a[href]'),
        function (link) {
          var href = link.getAttribute('href');
          if (!href || href.charAt(0) === '#') return false;

          var target = cleanPath(href);
          return target !== '/' && current.indexOf(target) === 0;
        }
      );

      if (activeChild) markItem(parent);
    });

    Object.keys(groups).forEach(function (group) {
      var active = groups[group].some(function (target) {
        return current.indexOf(target) === 0;
      });

      if (active) {
        markItem(document.querySelector(
          '.main-menu > .menu-item-' + group + '.menu-item-has-children:not(.mobile-menu-clone)'
        ));
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
