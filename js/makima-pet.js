(function() {
  const spriteColumns = 8;
  const spriteRows = 9;
  const states = {
    idle: { row: 0, frames: 6, interval: 180 },
    runRight: { row: 1, frames: 8, interval: 90 },
    runLeft: { row: 2, frames: 8, interval: 90 },
    wave: { row: 3, frames: 4, interval: 150 },
    jump: { row: 4, frames: 5, interval: 95 }
  };

  const savedPositionKey = 'makima-pet-position';
  let frame = 0;
  let stateName = 'idle';
  let pointerOffset = { x: 0, y: 0 };
  let isDragging = false;
  let lastX = 0;

  function setFrame(element, state, frameIndex) {
    const x = spriteColumns === 1 ? 0 : (frameIndex / (spriteColumns - 1)) * 100;
    const y = spriteRows === 1 ? 0 : (state.row / (spriteRows - 1)) * 100;
    element.style.backgroundPosition = `${x}% ${y}%`;
  }

  function setState(element, nextState) {
    if (stateName === nextState) return;
    stateName = nextState;
    frame = 0;
    setFrame(element, states[stateName], frame);
  }

  function clampPosition(x, y, element) {
    const margin = 8;
    const rect = element.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - margin;
    const maxY = window.innerHeight - rect.height - margin;
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, maxX)),
      y: Math.min(Math.max(margin, y), Math.max(margin, maxY))
    };
  }

  function savePosition(element) {
    const rect = element.getBoundingClientRect();
    localStorage.setItem(savedPositionKey, JSON.stringify({ x: rect.left, y: rect.top }));
  }

  function restorePosition(element) {
    try {
      const saved = JSON.parse(localStorage.getItem(savedPositionKey) || 'null');
      if (!saved) return;
      const position = clampPosition(saved.x, saved.y, element);
      element.style.left = `${position.x}px`;
      element.style.top = `${position.y}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    } catch {}
  }

  function mount() {
    if (document.getElementById('makima-pet')) return;

    const pet = document.createElement('div');
    pet.id = 'makima-pet';
    pet.setAttribute('role', 'img');
    pet.setAttribute('aria-label', 'Makima pixel pet, draggable');
    pet.title = 'Makima - 可以拖着玩';
    document.body.appendChild(pet);

    restorePosition(pet);
    setFrame(pet, states.idle, 0);

    window.setInterval(() => {
      const state = states[stateName] || states.idle;
      frame = (frame + 1) % state.frames;
      setFrame(pet, state, frame);
      if (!isDragging && stateName !== 'idle' && frame === state.frames - 1) {
        setState(pet, 'idle');
      }
    }, 95);

    pet.addEventListener('pointerdown', event => {
      isDragging = true;
      lastX = event.clientX;
      pet.classList.add('is-dragging');
      const rect = pet.getBoundingClientRect();
      pointerOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      pet.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    pet.addEventListener('pointermove', event => {
      if (!isDragging) return;
      const position = clampPosition(event.clientX - pointerOffset.x, event.clientY - pointerOffset.y, pet);
      pet.style.left = `${position.x}px`;
      pet.style.top = `${position.y}px`;
      pet.style.right = 'auto';
      pet.style.bottom = 'auto';
      setState(pet, event.clientX >= lastX ? 'runRight' : 'runLeft');
      lastX = event.clientX;
      event.preventDefault();
    });

    pet.addEventListener('pointerup', event => {
      if (!isDragging) return;
      isDragging = false;
      pet.classList.remove('is-dragging');
      setState(pet, 'idle');
      savePosition(pet);
      try {
        pet.releasePointerCapture(event.pointerId);
      } catch {}
    });

    pet.addEventListener('pointercancel', () => {
      isDragging = false;
      pet.classList.remove('is-dragging');
      setState(pet, 'idle');
      savePosition(pet);
    });

    pet.addEventListener('dblclick', () => {
      pet.classList.remove('is-jumping');
      void pet.offsetWidth;
      pet.classList.add('is-jumping');
      setState(pet, 'jump');
    });

    pet.addEventListener('mouseenter', () => {
      if (!isDragging) setState(pet, 'wave');
    });

    window.addEventListener('resize', () => {
      const rect = pet.getBoundingClientRect();
      const position = clampPosition(rect.left, rect.top, pet);
      pet.style.left = `${position.x}px`;
      pet.style.top = `${position.y}px`;
      pet.style.right = 'auto';
      pet.style.bottom = 'auto';
      savePosition(pet);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
