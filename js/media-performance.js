(function() {
  'use strict';

  const selector = '.book-cover-img[data-src], .movie-poster-img[data-src], .photo-image[data-src], .album-thumb img[data-src]';
  const records = new WeakMap();
  const waiting = new Set();
  const active = new Set();
  const limit = 4;
  let frame = 0;

  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(pump);
  }

  function pump() {
    frame = 0;
    if (document.hidden) return;
    // Read positions together before assigning any sources. Filters and page
    // changes may have moved a queued card since its intersection callback.
    const candidates = [...waiting].filter(record => {
      if (!record.image.isConnected || !record.image.hasAttribute('data-src')) {
        waiting.delete(record);
        return false;
      }
      const rect = record.target.getBoundingClientRect();
      record.distance = Math.max(0, rect.top) + Math.max(0, -rect.bottom);
      return rect.width > 0 && rect.height > 0 && rect.bottom >= -200 && rect.top <= innerHeight + 200;
    }).sort((a, b) => a.distance - b.distance);

    for (const record of candidates) {
      if (active.size >= limit) break;
      waiting.delete(record);
      observer?.unobserve(record.target);
      active.add(record);
      const image = record.image;
      let finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        image.removeEventListener('load', finish);
        image.removeEventListener('error', finish);
        active.delete(record);
        record.cancel = null;
        schedule();
      }
      record.cancel = () => {
        // A paginated card may return while its previous request was pending.
        // Retain its source so observation can restart the interrupted load.
        image.dataset.src = image.src;
        image.removeAttribute('src');
        finish();
      };
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
      // Intersection already controls the preload distance; native lazy loading
      // must not hold one of the limited slots indefinitely.
      image.loading = 'eager';
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
      if (image.complete) finish();
    }
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.get(entry.target);
        if (!record) return;
        if (entry.isIntersecting) waiting.add(record);
        else waiting.delete(record);
      });
      schedule();
    }, { rootMargin: '200px 0px' })
    : null;

  function observe(root = document) {
    root.querySelectorAll(selector).forEach(image => {
      const target = image.closest('.book-card, .movie-card, .album-card, .photo-frame') || image;
      if (records.has(target)) return;
      const record = { image, target, cancel: null };
      records.set(target, record);
      if (observer) observer.observe(target);
      else {
        image.src = image.dataset.src;
        image.removeAttribute('data-src');
      }
    });
  }

  function release(root) {
    const cancelled = [];
    root.querySelectorAll('.photo-image, .book-cover-img, .movie-poster-img, .album-thumb img').forEach(image => {
      const target = image.closest('.book-card, .movie-card, .album-card, .photo-frame') || image;
      const record = records.get(target);
      if (!record) return;
      observer?.unobserve(target);
      waiting.delete(record);
      records.delete(target);
      if (record.cancel) cancelled.push(record);
    });
    cancelled.forEach(record => record.cancel());
  }

  window.KyloMedia = { observe, release };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => observe(), { once: true });
  } else observe();
})();
