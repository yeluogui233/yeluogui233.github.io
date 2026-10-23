(function() {
  'use strict';

  function initialize() {
    const player = document.getElementById('netease-player');
    const frame = player && player.querySelector('iframe[data-deferred-src]');
    if (!frame) return;
    let timer = 0;
    let idleTask = null;

    function loadPlayer() {
      if (!frame.dataset.deferredSrc) return;
      window.clearTimeout(timer);
      if (idleTask !== null && window.cancelIdleCallback) window.cancelIdleCallback(idleTask);
      idleTask = null;
      frame.src = frame.dataset.deferredSrc;
      frame.removeAttribute('data-deferred-src');
    }

    function schedulePlayer() {
      if (document.hidden || !frame.dataset.deferredSrc) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.hidden) return;
        if (window.requestIdleCallback) {
          idleTask = window.requestIdleCallback(() => {
            idleTask = null;
            if (!document.hidden) loadPlayer();
          }, { timeout: 1500 });
        } else {
          loadPlayer();
        }
      }, 1000);
    }

    // Intent takes priority over background scheduling; keep the player responsive.
    player.addEventListener('pointerenter', loadPlayer, { once: true, passive: true });
    player.addEventListener('pointerdown', loadPlayer, { once: true, passive: true });
    player.addEventListener('focusin', loadPlayer, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && document.readyState === 'complete') schedulePlayer();
    });
    if (document.readyState === 'complete') schedulePlayer();
    else window.addEventListener('load', schedulePlayer, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
