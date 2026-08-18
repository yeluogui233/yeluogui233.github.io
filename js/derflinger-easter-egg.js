(function () {
  'use strict';

  function setup(root) {
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';

    var trigger = root.querySelector('.derflinger-trigger');
    var audio = root.querySelector('.derflinger-voice');
    var hideTimer = 0;
    var longPressTimer = 0;

    function stopTimers() {
      window.clearTimeout(hideTimer);
      window.clearTimeout(longPressTimer);
    }

    function wake() {
      stopTimers();
      root.classList.add('is-awake', 'is-talking');

      if (audio) {
        audio.currentTime = 0;
        var playback = audio.play();
        if (playback && typeof playback.catch === 'function') playback.catch(function () {});
      }

      window.setTimeout(function () {
        root.classList.remove('is-talking');
      }, 760);

      hideTimer = window.setTimeout(function () {
        root.classList.remove('is-awake', 'is-talking');
      }, 3200);
    }

    trigger.addEventListener('click', wake);
    trigger.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'touch') return;
      longPressTimer = window.setTimeout(wake, 620);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (eventName) {
      trigger.addEventListener(eventName, function () {
        window.clearTimeout(longPressTimer);
      });
    });
    if (audio) {
      audio.addEventListener('ended', function () {
        root.classList.remove('is-talking');
      });
    }
  }

  function initialize() {
    document.querySelectorAll('.derflinger-easter-egg').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
