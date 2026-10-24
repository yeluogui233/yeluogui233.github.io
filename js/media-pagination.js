(function() {
  'use strict';

  function create(grid, source, controls) {
    const size = Number(grid.dataset.pageSize) || 30;
    // Later cards stay inert until their page is displayed. Reuse the original
    // rendered markup so ratings, links, blur layers and card styles stay intact.
    const cards = [...grid.children, ...source.content.children];
    source.remove();
    let filtered = cards;
    let current = 1;
    let pages = 0;
    const previous = controls.querySelector('[data-page-prev]');
    const next = controls.querySelector('[data-page-next]');
    const info = controls.querySelector('[data-page-info]');
    const select = controls.querySelector('select');

    function render(page, reveal) {
      const total = Math.max(1, Math.ceil(filtered.length / size));
      const target = Math.max(1, Math.min(total, Number(page) || 1));
      const changed = current !== target;
      const direction = Math.sign(target - current);
      current = target;
      window.KyloMedia?.release(grid);
      const fragment = document.createDocumentFragment();
      filtered.slice((current - 1) * size, current * size).forEach(card => fragment.appendChild(card));
      grid.replaceChildren(fragment);
      previous.disabled = current === 1;
      next.disabled = current === total;
      info.textContent = '第 ' + current + ' 页 / 共 ' + total + ' 页';
      if (pages !== total) {
        pages = total;
        select.replaceChildren(...Array.from({ length: total }, (_, index) => new Option('第 ' + (index + 1) + ' 页', index + 1)));
      }
      select.value = String(current);
      select.disabled = total === 1;
      controls.hidden = total === 1;
      window.KyloPageControls?.sync(select);
      if (changed && reveal) {
        if (window.KyloPageControls) window.KyloPageControls.reveal(grid, direction);
        else grid.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
      window.KyloMedia?.observe(grid);
    }

    previous.addEventListener('click', () => render(current - 1, true));
    next.addEventListener('click', () => render(current + 1, true));
    select.addEventListener('change', () => render(select.value, true));
    render(1, false);
    return {
      filter(category) {
        filtered = category === 'all' ? cards : cards.filter(card => (card.dataset.category || '').split(/\s+/).includes(category));
        render(1, false);
      }
    };
  }

  window.KyloMediaPagination = { create };
})();
