(function () {
  const PETS = {
    bear: '🐻',
    bunny: '🐰',
    dino: '🦖',
    fox: '🦊',
    monkey: '🐒'
  };

  const DEFAULTS = { enabled: true, pet: 'bear', speed: 60 };

  const MAX_FOOTPRINTS = 25;
  const STEP_DISTANCE = 32;

  let root = null;
  let zzz = null;
  let state = 'idle';
  let posX = 40;
  let targetX = 40;
  let facing = 1;
  let dragging = false;
  let dragOffsetX = 0;
  let rafId = null;
  let lastTs = null;
  let stateTimer = null;

  let footprintLayer = null;
  let footprints = [];
  let footprintToggle = false;
  let distSinceStep = 0;
  let walkPhase = 0;

  function clampX(x) {
    const max = window.innerWidth - 56;
    return Math.max(0, Math.min(max, x));
  }

  function pickNewTarget() {
    targetX = clampX(Math.random() * window.innerWidth);
  }

  function setState(next) {
    if (!root) return;
    state = next;
    root.classList.remove('dp-walk', 'dp-idle', 'dp-sleep');
    root.classList.add('dp-' + next);
    clearTimeout(stateTimer);

    if (next === 'idle') {
      stateTimer = setTimeout(() => {
        setState(Math.random() < 0.3 ? 'sleep' : 'walk');
        if (state === 'walk') pickNewTarget();
      }, 1500 + Math.random() * 2500);
    } else if (next === 'sleep') {
      stateTimer = setTimeout(() => setState('idle'), 4000 + Math.random() * 4000);
    } else if (next === 'walk') {
      pickNewTarget();
    }
  }

  function tick(ts, speed) {
    if (dragging) {
      lastTs = ts;
      rafId = requestAnimationFrame((t) => tick(t, speed));
      return;
    }
    if (lastTs == null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (state === 'walk') {
      const dx = targetX - posX;
      if (Math.abs(dx) < 2) {
        setState(Math.random() < 0.5 ? 'idle' : 'walk');
      } else {
        const dir = dx > 0 ? 1 : -1;
        facing = dir;
        const step = dir * speed * dt;
        posX = clampX(posX + step);
        walkPhase += dt * speed * 0.3;
        applyTransform();

        distSinceStep += Math.abs(step);
        if (distSinceStep >= STEP_DISTANCE) {
          distSinceStep = 0;
          spawnFootprint(posX, facing);
        }
      }
    } else {
      walkPhase = 0;
      applyTransform();
    }

    rafId = requestAnimationFrame((t) => tick(t, speed));
  }

  function spawnFootprint(x, dir) {
    if (!footprintLayer) return;
    const fp = document.createElement('span');
    fp.className = 'dp-footprint';
    fp.textContent = '🐾';
    const side = footprintToggle ? 8 : -8;
    footprintToggle = !footprintToggle;
    fp.style.left = (x + 26) + 'px';
    fp.style.transform = `translateY(${side}px) scaleX(${dir})`;
    footprintLayer.appendChild(fp);
    footprints.push(fp);

    while (footprints.length > MAX_FOOTPRINTS) {
      const old = footprints.shift();
      if (old.parentNode) old.parentNode.removeChild(old);
    }

    fp.addEventListener('animationend', () => {
      if (fp.parentNode) fp.parentNode.removeChild(fp);
      footprints = footprints.filter((f) => f !== fp);
    });
  }

  function clearFootprints() {
    footprints.forEach((f) => {
      if (f.parentNode) f.parentNode.removeChild(f);
    });
    footprints = [];
  }

  function applyTransform() {
    const tilt = state === 'walk' ? Math.sin(walkPhase) * 5 : 0;
    root.style.transform = `translateX(${posX}px) scaleX(${facing}) rotate(${tilt * facing}deg)`;
  }

  function bounce() {
    if (!root) return;
    root.animate(
      [
        { transform: root.style.transform + ' translateY(0)' },
        { transform: root.style.transform + ' translateY(-22px)' },
        { transform: root.style.transform + ' translateY(0)' }
      ],
      { duration: 350, easing: 'ease-out' }
    );
  }

  function onMouseDown(e) {
    dragging = true;
    root.classList.add('dp-dragging');
    dragOffsetX = e.clientX - posX;
    clearTimeout(stateTimer);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragging) return;
    posX = clampX(e.clientX - dragOffsetX);
    applyTransform();
  }

  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('dp-dragging');
    setState('idle');
  }

  function onClick() {
    if (dragging) return;
    bounce();
  }

  function createPet(petKey) {
    footprintLayer = document.createElement('div');
    footprintLayer.id = 'dp-footprint-layer';
    document.body.appendChild(footprintLayer);

    root = document.createElement('div');
    root.id = 'dp-pet-root';
    root.textContent = PETS[petKey] || PETS.bear;
    root.title = 'Your desktop pet — drag me around!';

    zzz = document.createElement('span');
    zzz.className = 'dp-zzz';
    zzz.textContent = 'z z z';
    root.appendChild(zzz);

    document.body.appendChild(root);

    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', () => {
      posX = clampX(posX);
      applyTransform();
    });

    applyTransform();
    setState('idle');
  }

  function destroyPet() {
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(stateTimer);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    clearFootprints();
    if (footprintLayer && footprintLayer.parentNode) footprintLayer.parentNode.removeChild(footprintLayer);
    footprintLayer = null;
  }

  function start(settings) {
    if (!settings.enabled) return;
    createPet(settings.pet);
    rafId = requestAnimationFrame((t) => tick(t, settings.speed));
  }

  chrome.storage.sync.get(DEFAULTS, (settings) => {
    start(settings);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.enabled) {
      if (changes.enabled.newValue) {
        chrome.storage.sync.get(DEFAULTS, (settings) => {
          if (!root) start(settings);
        });
      } else {
        destroyPet();
      }
    }
    if (changes.pet && root) {
      root.textContent = PETS[changes.pet.newValue] || PETS.bear;
      root.appendChild(zzz);
    }
  });
})();
