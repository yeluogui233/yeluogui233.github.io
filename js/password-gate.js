(function () {
  'use strict';

  function normalize(value) {
    return (value || '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[\u00A0\u2000-\u200D\uFEFF]/g, '')
      .replace(/[０-９]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
      });
  }

  function sha1(text) {
    if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined') return Promise.reject(new Error('crypto unavailable'));
    return window.crypto.subtle.digest('SHA-1', new TextEncoder().encode(text)).then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var hex = '';
      for (var i = 0; i < bytes.length; i += 1) {
        hex += ('00' + bytes[i].toString(16)).slice(-2);
      }
      return hex;
    });
  }

  function showError(wrapper, message) {
    var error = wrapper.querySelector('[role="alert"]');
    if (error) error.textContent = message || '密码不对，再试试';
  }

  function clearError(wrapper) {
    var error = wrapper.querySelector('[role="alert"]');
    if (error) error.textContent = '';
  }

  function reveal(wrapper) {
    var template = wrapper.querySelector('template.password-gate-content');
    if (!template) return;
    var content = template.content ? template.content.cloneNode(true) : null;
    if (!content) return;
    var parent = wrapper.parentNode;
    if (!parent) return;
    var container = document.createElement('div');
    container.innerHTML = '';
    while (content.firstChild) {
      container.appendChild(content.firstChild);
    }
    container.id = 'password-gate-unlocked';
    parent.replaceChild(container, wrapper);
    try {
      window.dispatchEvent(new Event('hexo-blog-decrypt'));
    } catch (e) {}
  }

  function bind(wrapper) {
    var form = wrapper.querySelector('#hbeForm');
    var input = wrapper.querySelector('#hbePass');
    var wrongMessage = wrapper.dataset.wrongMessage || '密码不对，再试试';
    var hash = wrapper.dataset.passwordHash || '';

    if (!form || !input) return;

    input.focus();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearError(wrapper);
      var value = normalize(input.value);
      if (!value) {
        showError(wrapper, wrongMessage);
        return;
      }
      sha1(value).then(function (currentHash) {
        if (currentHash === hash) {
          reveal(wrapper);
        } else {
          showError(wrapper, wrongMessage);
          input.value = '';
          input.focus();
        }
      }).catch(function () {
        showError(wrapper, wrongMessage);
      });
    });
  }

  function boot() {
    var wrapper = document.getElementById('hexo-blog-password-gate');
    if (!wrapper) return;
    bind(wrapper);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

