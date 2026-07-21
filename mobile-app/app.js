(function () {
  const RIG = window.DP_PET_RIG;
  const STORAGE_KEY = 'dp-settings';

  const DEFAULTS = {
    enabled: true,
    pet: 'cat',
    size: 'medium',
    positionMode: 'bottom-left',
    walkDirection: 'random',
    posX: null,
    posY: null,
    opacity: 1,
    animationSpeed: 1,
    theme: 'auto',
    soundEnabled: true,
    speechEnabled: true,
    speechFrequency: 'normal'
  };

  const SIZE_WIDTH = { small: 56, medium: 72, large: 96 };
  const SPEED_BASE = 58;
  const STEP_DISTANCE = 30;
  const MAX_FOOTPRINTS = 25;

  const SPEECH_FREQ_MS = {
    rare: [90000, 180000],
    normal: [45000, 90000],
    frequent: [20000, 40000]
  };

  const SPEECH_LINES = [
    'Time for a break! ⏰',
    'Drink water 💧',
    'Great job! 👍',
    'Keep coding! 💻',
    "You're amazing! ✨",
    'One more commit 😄'
  ];

  const BEHAVIOR_WEIGHTS = [
    ['walk', 0.30], ['sleep', 0.15], ['sit', 0.15], ['look', 0.12],
    ['stretch', 0.10], ['jump', 0.08], ['wave', 0.06], ['dance', 0.04]
  ];
  const MOMENTARY_MS = { look: 2400, stretch: 1800, jump: 1800, wave: 1500, dance: 2400 };

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...DEFAULTS, ...raw };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  let cfg = loadSettings();

  let root = null, flipEl = null, motionEl = null, svgEl = null, zzz = null, footprintLayer = null;
  let state = 'idle';
  let posX = 40, posY = 40, targetX = 40, targetY = 40, facing = 1;
  let petWidth = SIZE_WIDTH.medium, petHeight = petWidth * 0.75;
  let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
  let rafId = null, lastTs = null, slotTimer = null, revertTimer = null, speechTimer = null;
  let footprints = [], footprintToggle = false, distSinceStep = 0;
  let audioCtx = null;

  function clampX(x) { return Math.max(0, Math.min(window.innerWidth - petWidth, x)); }
  function clampY(y) { return Math.max(0, Math.min(window.innerHeight - petHeight, y)); }
  function edgeYFor(mode) { return (mode === 'top-left' || mode === 'top-right') ? 0 : window.innerHeight - petHeight; }
  function isEdgeMode(mode) { return mode !== 'free'; }

  function applyPosition() {
    root.style.left = posX + 'px';
    root.style.top = posY + 'px';
  }

  function updateFacing(dir) {
    if (dir === 0 || dir === facing) return;
    facing = dir;
    root.classList.toggle('dp-face-left', facing === -1);
  }

  function setBehaviorClass(name) {
    Array.from(root.classList).filter((c) => c.indexOf('dp-b-') === 0).forEach((c) => root.classList.remove(c));
    root.classList.add('dp-b-' + name);
  }

  function setState(next) {
    state = next;
    setBehaviorClass(next === 'return' ? 'walk' : next);
  }

  function pickWalkTarget() {
    const maxX = window.innerWidth - petWidth;
    const stride = 120 + Math.random() * 260;
    if (cfg.walkDirection === 'ltr') targetX = clampX(posX + stride);
    else if (cfg.walkDirection === 'rtl') targetX = clampX(posX - stride);
    else targetX = clampX(Math.random() * maxX);
    targetY = isEdgeMode(cfg.positionMode) ? edgeYFor(cfg.positionMode) : clampY(Math.random() * window.innerHeight);
  }

  function weightedPick() {
    const total = BEHAVIOR_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [name, w] of BEHAVIOR_WEIGHTS) {
      if (r < w) return name;
      r -= w;
    }
    return 'walk';
  }

  function scheduleNextBehavior() {
    clearTimeout(slotTimer);
    slotTimer = setTimeout(runNextBehavior, 20000 + Math.random() * 40000);
  }

  function runNextBehavior() {
    if (dragging || state === 'return') { scheduleNextBehavior(); return; }
    const pick = weightedPick();
    clearTimeout(revertTimer);

    if (pick === 'walk') {
      setState('walk');
      pickWalkTarget();
    } else if (pick === 'sleep' || pick === 'sit') {
      setState(pick);
    } else {
      setState(pick);
      if (cfg.soundEnabled && (pick === 'jump' || pick === 'dance' || pick === 'wave')) playPetSound();
      revertTimer = setTimeout(() => {
        if (!dragging && state === pick) setState('idle');
      }, MOMENTARY_MS[pick]);
    }
    scheduleNextBehavior();
  }

  function tick(ts) {
    if (lastTs == null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    if (dragging) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (state === 'walk' || state === 'return') {
      const dx = targetX - posX;
      const dy = targetY - posY;
      const dist = Math.hypot(dx, dy);
      const speed = SPEED_BASE * cfg.animationSpeed * (state === 'return' ? 1.6 : 1);
      const moveBy = speed * dt;

      if (dist < 3) {
        if (state === 'return') finishReturn();
        else pickWalkTarget();
      } else {
        const dirX = dx / dist, dirY = dy / dist;
        posX = clampX(posX + dirX * moveBy);
        posY = clampY(posY + dirY * moveBy);
        if (Math.abs(dx) > 4) updateFacing(dx > 0 ? 1 : -1);
        applyPosition();

        distSinceStep += moveBy;
        if (distSinceStep >= STEP_DISTANCE) {
          distSinceStep = 0;
          spawnFootprint();
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function finishReturn() {
    posX = clampX(targetX);
    posY = clampY(targetY);
    applyPosition();
    cfg.posX = posX;
    cfg.posY = posY;
    saveSettings();
    setState('idle');
    scheduleNextBehavior();
  }

  function spawnFootprint() {
    if (!footprintLayer) return;
    const fp = document.createElement('span');
    fp.className = 'dp-footprint';
    fp.textContent = '🐾';
    const side = footprintToggle ? 8 : -8;
    footprintToggle = !footprintToggle;
    fp.style.left = (posX + petWidth / 2 - 7) + 'px';
    fp.style.top = (posY + petHeight - 6) + 'px';
    fp.style.transform = `translateY(${side}px) scaleX(${facing})`;
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
    footprints.forEach((f) => { if (f.parentNode) f.parentNode.removeChild(f); });
    footprints = [];
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function beep(freqStart, freqEnd, duration, type) {
    if (!cfg.soundEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + duration);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playPetSound() {
    if (!cfg.soundEnabled) return;
    switch (cfg.pet) {
      case 'dog': beep(180, 90, 0.18, 'square'); break;
      case 'cat': beep(520, 880, 0.22, 'sine'); break;
      case 'fox': beep(700, 1200, 0.15, 'triangle'); break;
      case 'rabbit': beep(900, 1400, 0.12, 'sine'); break;
      default: beep(220, 180, 0.3, 'sine'); break;
    }
  }

  function scheduleSpeech() {
    clearTimeout(speechTimer);
    if (!cfg.speechEnabled) return;
    const range = SPEECH_FREQ_MS[cfg.speechFrequency] || SPEECH_FREQ_MS.normal;
    const delay = range[0] + Math.random() * (range[1] - range[0]);
    speechTimer = setTimeout(() => {
      showSpeech(SPEECH_LINES[Math.floor(Math.random() * SPEECH_LINES.length)]);
      scheduleSpeech();
    }, delay);
  }

  function showSpeech(text) {
    if (!root) return;
    const bubble = document.createElement('div');
    bubble.className = 'dp-speech';
    if (cfg.theme === 'dark') bubble.classList.add('dp-theme-dark');
    bubble.textContent = text;
    root.appendChild(bubble);
    bubble.addEventListener('animationend', () => { if (bubble.parentNode) bubble.parentNode.removeChild(bubble); });
  }

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'dp-heart';
    heart.textContent = '❤️';
    root.appendChild(heart);
    heart.addEventListener('animationend', () => { if (heart.parentNode) heart.parentNode.removeChild(heart); });
  }

  let tapTimer = null;
  function onTap() {
    if (dragging) return;
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
      triggerDance();
      return;
    }
    tapTimer = setTimeout(() => {
      tapTimer = null;
      spawnHeart();
      if (cfg.soundEnabled) playPetSound();
    }, 240);
  }

  function triggerDance() {
    clearTimeout(revertTimer);
    setState('dance');
    if (cfg.soundEnabled) playPetSound();
    revertTimer = setTimeout(() => { if (!dragging) setState('idle'); }, MOMENTARY_MS.dance);
  }

  function pointFromEvent(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDragStart(e) {
    const p = pointFromEvent(e);
    dragging = true;
    root.classList.add('dp-dragging');
    dragOffsetX = p.x - posX;
    dragOffsetY = p.y - posY;
    clearTimeout(slotTimer);
    clearTimeout(revertTimer);
    setState('idle');
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!dragging) return;
    const p = pointFromEvent(e);
    posX = clampX(p.x - dragOffsetX);
    posY = clampY(p.y - dragOffsetY);
    applyPosition();
    e.preventDefault();
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('dp-dragging');

    if (isEdgeMode(cfg.positionMode)) {
      targetX = posX;
      targetY = edgeYFor(cfg.positionMode);
      setState('return');
    } else {
      cfg.posX = posX;
      cfg.posY = posY;
      saveSettings();
      setState('idle');
      scheduleNextBehavior();
    }
  }

  function buildRig() {
    if (svgEl && svgEl.parentNode) svgEl.parentNode.removeChild(svgEl);
    svgEl = RIG.buildPetSVG(cfg.pet);
    motionEl.appendChild(svgEl);
  }

  function applySize() {
    petWidth = SIZE_WIDTH[cfg.size] || SIZE_WIDTH.medium;
    petHeight = petWidth * 0.75;
    root.style.width = petWidth + 'px';
    root.style.height = petHeight + 'px';
  }

  function applyThemeClass() {
    root.classList.remove('dp-theme-light', 'dp-theme-dark', 'dp-theme-auto');
    root.classList.add('dp-theme-' + (cfg.theme || 'auto'));
  }

  function repositionForMode() {
    if (isEdgeMode(cfg.positionMode)) {
      posY = edgeYFor(cfg.positionMode);
      posX = clampX(cfg.positionMode.indexOf('left') !== -1 ? 24 : window.innerWidth - petWidth - 24);
    } else if (typeof cfg.posX === 'number' && typeof cfg.posY === 'number') {
      posX = clampX(cfg.posX);
      posY = clampY(cfg.posY);
    } else {
      posX = clampX(24);
      posY = window.innerHeight - petHeight;
    }
    applyPosition();
  }

  function applyAllSettings(opts) {
    const initial = !!(opts && opts.initial);
    if (!root) return;
    buildRig();
    applySize();
    root.style.opacity = cfg.opacity;
    root.style.setProperty('--dp-speed', cfg.animationSpeed);
    applyThemeClass();
    repositionForMode();
    scheduleSpeech();
  }

  function createPet() {
    footprintLayer = document.createElement('div');
    footprintLayer.id = 'dp-footprint-layer';
    document.body.appendChild(footprintLayer);

    root = document.createElement('div');
    root.id = 'dp-pet-root';

    flipEl = document.createElement('div');
    flipEl.className = 'dp-flip';
    motionEl = document.createElement('div');
    motionEl.className = 'dp-motion';
    flipEl.appendChild(motionEl);
    root.appendChild(flipEl);

    zzz = document.createElement('span');
    zzz.className = 'dp-zzz';
    zzz.textContent = 'z z z';
    root.appendChild(zzz);

    document.body.appendChild(root);

    root.addEventListener('mousedown', onDragStart);
    root.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);
    root.addEventListener('click', onTap);
    window.addEventListener('resize', () => {
      posX = clampX(posX);
      posY = clampY(posY);
      applyPosition();
    });

    applyAllSettings({ initial: true });
    setState('idle');
    scheduleNextBehavior();
  }

  function destroyPet() {
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(slotTimer);
    clearTimeout(revertTimer);
    clearTimeout(speechTimer);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    clearFootprints();
    if (footprintLayer && footprintLayer.parentNode) footprintLayer.parentNode.removeChild(footprintLayer);
    footprintLayer = null;
  }

  function start() {
    if (!cfg.enabled) return;
    createPet();
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  // ---------------- settings sheet ----------------
  const gearBtn = document.getElementById('dp-gear');
  const sheetBackdrop = document.getElementById('dp-sheet-backdrop');
  const sheetClose = document.getElementById('dp-sheet-close');
  const enabledInput = document.getElementById('enabled');
  const petsContainer = document.getElementById('pets');
  const positionModeSelect = document.getElementById('positionMode');
  const walkDirectionSelect = document.getElementById('walkDirection');
  const sizeContainer = document.getElementById('size');
  const animationSpeedInput = document.getElementById('animationSpeed');
  const animationSpeedValue = document.getElementById('animationSpeedValue');
  const opacityInput = document.getElementById('opacity');
  const opacityValue = document.getElementById('opacityValue');
  const soundInput = document.getElementById('soundEnabled');
  const themeSelect = document.getElementById('theme');
  const speechEnabledInput = document.getElementById('speechEnabled');
  const speechFrequencySelect = document.getElementById('speechFrequency');
  const resetButton = document.getElementById('reset');

  function openSheet() { document.body.classList.add('dp-sheet-open'); }
  function closeSheet() { document.body.classList.remove('dp-sheet-open'); }
  gearBtn.addEventListener('click', openSheet);
  sheetBackdrop.addEventListener('click', closeSheet);
  sheetClose.addEventListener('click', closeSheet);

  function renderSheet() {
    enabledInput.checked = cfg.enabled;

    petsContainer.innerHTML = '';
    Object.keys(RIG.SPECIES).forEach((key) => {
      const btn = document.createElement('button');
      btn.title = RIG.SPECIES[key].label;
      btn.className = key === cfg.pet ? 'dp-selected' : '';
      btn.appendChild(RIG.buildPetSVG(key));
      btn.addEventListener('click', () => update({ pet: key }));
      petsContainer.appendChild(btn);
    });

    positionModeSelect.value = cfg.positionMode;
    walkDirectionSelect.value = cfg.walkDirection;

    Array.from(sizeContainer.children).forEach((btn) => {
      btn.classList.toggle('dp-selected', btn.dataset.value === cfg.size);
    });

    animationSpeedInput.value = cfg.animationSpeed;
    animationSpeedValue.textContent = Number(cfg.animationSpeed).toFixed(1) + 'x';
    opacityInput.value = cfg.opacity;
    opacityValue.textContent = Math.round(cfg.opacity * 100) + '%';
    soundInput.checked = cfg.soundEnabled;
    themeSelect.value = cfg.theme;
    speechEnabledInput.checked = cfg.speechEnabled;
    speechFrequencySelect.value = cfg.speechFrequency;
  }

  function update(patch) {
    const wasEnabled = cfg.enabled;
    cfg = { ...cfg, ...patch };
    saveSettings();
    renderSheet();

    if ('enabled' in patch) {
      if (patch.enabled && !wasEnabled) start();
      else if (!patch.enabled && wasEnabled) destroyPet();
      return;
    }
    if (!root) return;
    applyAllSettings();
  }

  enabledInput.addEventListener('change', () => update({ enabled: enabledInput.checked }));
  positionModeSelect.addEventListener('change', () => update({ positionMode: positionModeSelect.value }));
  walkDirectionSelect.addEventListener('change', () => update({ walkDirection: walkDirectionSelect.value }));
  Array.from(sizeContainer.children).forEach((btn) => {
    btn.addEventListener('click', () => update({ size: btn.dataset.value }));
  });
  animationSpeedInput.addEventListener('input', () => {
    animationSpeedValue.textContent = Number(animationSpeedInput.value).toFixed(1) + 'x';
  });
  animationSpeedInput.addEventListener('change', () => update({ animationSpeed: Number(animationSpeedInput.value) }));
  opacityInput.addEventListener('input', () => {
    opacityValue.textContent = Math.round(Number(opacityInput.value) * 100) + '%';
  });
  opacityInput.addEventListener('change', () => update({ opacity: Number(opacityInput.value) }));
  soundInput.addEventListener('change', () => update({ soundEnabled: soundInput.checked }));
  themeSelect.addEventListener('change', () => update({ theme: themeSelect.value }));
  speechEnabledInput.addEventListener('change', () => update({ speechEnabled: speechEnabledInput.checked }));
  speechFrequencySelect.addEventListener('change', () => update({ speechFrequency: speechFrequencySelect.value }));
  resetButton.addEventListener('click', () => update({ ...DEFAULTS, posX: null, posY: null }));

  document.addEventListener('touchstart', ensureAudio, { once: true, passive: true });
  document.addEventListener('mousedown', ensureAudio, { once: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }

  renderSheet();
  start();
})();
