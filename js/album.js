(function() {
  'use strict';

  function initialize(photos) {
    const perPage = 12;
    const total = Math.ceil(photos.length / perPage);
    const wall = document.getElementById('photo-wall');
    const pagination = document.getElementById('album-pagination');
    const previous = document.getElementById('prev-photo-page');
    const next = document.getElementById('next-photo-page');
    const select = document.getElementById('photo-page-select');
    let page = 1;
    let photoIndex = 0;
    let dialog = null;
    let returnFocus = null;
    let savedOverflow = '';

    function makePhoto(photo, index) {
      const item = document.createElement('div');
      item.className = 'photo-item';
      item.innerHTML = '<div class="photo-frame" role="button" tabindex="0">' +
        '<img class="photo-image" loading="lazy" decoding="async">' +
        '<div class="photo-zoom-icon">⤡</div>' +
        '<div class="photo-info-overlay"><div class="photo-location"><i class="fas fa-map-marker-alt"></i><span></span></div>' +
        '<div class="photo-date"><i class="far fa-clock"></i><span></span></div></div></div><p class="photo-caption"></p>';
      const frame = item.querySelector('.photo-frame');
      frame.dataset.index = index;
      frame.dataset.src = photo.url;
      frame.setAttribute('aria-label', photo.desc || '查看照片');
      const image = item.querySelector('img');
      image.dataset.src = photo.url;
      image.alt = photo.desc || '照片';
      for (const field of ['location', 'date']) {
        const node = item.querySelector('.photo-' + field);
        if (photo[field]) node.querySelector('span').textContent = photo[field];
        else node.remove();
      }
      if (!photo.location && !photo.date) item.querySelector('.photo-info-overlay').remove();
      const caption = item.querySelector('.photo-caption');
      if (photo.desc) caption.textContent = photo.desc;
      else caption.remove();
      return item;
    }

    function renderPage(number, scroll = true) {
      if (number < 1 || number > total) return;
      const direction = Math.sign(number - page);
      page = number;
      const fragment = document.createDocumentFragment();
      const start = (page - 1) * perPage;
      photos.slice(start, start + perPage).forEach((photo, offset) => fragment.appendChild(makePhoto(photo, start + offset)));
      window.KyloMedia.release(wall);
      wall.replaceChildren(fragment);
      window.KyloMedia.observe(wall);
      document.getElementById('current-page').textContent = page;
      select.value = page;
      previous.disabled = page === 1;
      next.disabled = page === total;
      window.KyloPageControls?.sync(select);
      if (scroll) {
        if (window.KyloPageControls) window.KyloPageControls.reveal(wall, direction);
        else wall.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }

    function createDialog() {
      dialog = document.createElement('div');
      dialog.id = 'photoLightbox';
      dialog.className = 'ultimate-lightbox';
      dialog.hidden = true;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', '照片预览');
      dialog.innerHTML = '<button type="button" class="lightbox-close" aria-label="关闭照片预览"><i class="fas fa-times" aria-hidden="true"></i></button>' +
        '<img id="lightbox-img" alt="" decoding="async" tabindex="0" role="button" aria-label="放大或还原照片">' +
        '<button type="button" class="lightbox-arrow lightbox-prev" aria-label="上一张照片">❮</button>' +
        '<button type="button" class="lightbox-arrow lightbox-next" aria-label="下一张照片">❯</button>' +
        '<div class="lightbox-info"><div class="lightbox-desc"></div><div class="lightbox-meta">' +
        '<span class="lightbox-location"><i class="fas fa-map-marker-alt"></i> <span></span></span>' +
        '<span class="lightbox-date"><i class="far fa-clock"></i> <span></span></span></div></div>' +
        '<div class="lightbox-index" role="status" aria-live="polite"></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('.lightbox-close').addEventListener('click', closeDialog);
      dialog.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
      dialog.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));
      dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
      const image = dialog.querySelector('img');
      image.addEventListener('click', () => image.classList.toggle('zoomed'));
      image.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          image.classList.toggle('zoomed');
        }
      });
    }

    function openDialog(index) {
      const photo = photos[index];
      if (!photo) return;
      if (!dialog) createDialog();
      const opening = dialog.hidden;
      if (opening) {
        returnFocus = document.activeElement;
        savedOverflow = document.body.style.overflow;
      }
      photoIndex = index;
      const image = dialog.querySelector('img');
      image.classList.remove('zoomed');
      image.src = photo.url;
      image.alt = photo.desc || '照片';
      const description = dialog.querySelector('.lightbox-desc');
      description.textContent = photo.desc;
      description.hidden = !photo.desc;
      for (const field of ['location', 'date']) {
        const node = dialog.querySelector('.lightbox-' + field);
        node.querySelector('span').textContent = photo[field];
        node.hidden = !photo[field];
      }
      dialog.querySelector('.lightbox-meta').hidden = !photo.location && !photo.date;
      dialog.querySelector('.lightbox-info').hidden = !photo.desc && !photo.location && !photo.date;
      dialog.querySelector('.lightbox-index').textContent = (index + 1) + ' / ' + photos.length;
      if (opening) {
        dialog.hidden = false;
        document.body.style.overflow = 'hidden';
        dialog.querySelector('.lightbox-close').focus({ preventScroll: true });
      }
    }

    function closeDialog() {
      if (!dialog || dialog.hidden) return;
      dialog.hidden = true;
      dialog.querySelector('img').removeAttribute('src');
      document.body.style.overflow = savedOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }

    function navigate(step) { openDialog((photoIndex + step + photos.length) % photos.length); }

    if (!photos.length) {
      document.getElementById('no-photos-message').style.display = 'block';
      return;
    }
    const options = document.createDocumentFragment();
    for (let number = 1; number <= total; number++) {
      const option = document.createElement('option');
      option.value = number;
      option.textContent = '第 ' + number + ' 页';
      options.appendChild(option);
    }
    select.appendChild(options);
    pagination.hidden = false;
    document.getElementById('total-pages').textContent = total;
    renderPage(1, false);
    previous.addEventListener('click', () => renderPage(page - 1));
    next.addEventListener('click', () => renderPage(page + 1));
    select.addEventListener('change', () => renderPage(Number(select.value)));
    wall.addEventListener('click', event => {
      const frame = event.target.closest('.photo-frame');
      if (frame) openDialog(Number(frame.dataset.index));
    });
    wall.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.photo-frame')) {
        event.preventDefault();
        openDialog(Number(event.target.dataset.index));
      }
    });
    document.addEventListener('keydown', event => {
      if (!dialog || dialog.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
      if (event.key === 'Tab') {
        const controls = [...dialog.querySelectorAll('button, [tabindex="0"]')];
        const index = controls.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault(); controls[controls.length - 1].focus();
        } else if (!event.shiftKey && index === controls.length - 1) {
          event.preventDefault(); controls[0].focus();
        }
      }
    });
  }

  window.KyloAlbum = { initialize };
})();
