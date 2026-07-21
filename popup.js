const RIG = window.DP_PET_RIG;

const DEFAULTS = {
  enabled: true,
  pet: 'cat',
  size: 'medium',
  positionMode: 'bottom-left',
  posX: null,
  posY: null,
  opacity: 1,
  alwaysOnTop: true,
  animationSpeed: 1,
  theme: 'auto',
  soundEnabled: true,
  speechEnabled: true,
  speechFrequency: 'normal'
};

const enabledInput = document.getElementById('enabled');
const petsContainer = document.getElementById('pets');
const positionModeSelect = document.getElementById('positionMode');
const sizeContainer = document.getElementById('size');
const animationSpeedInput = document.getElementById('animationSpeed');
const animationSpeedValue = document.getElementById('animationSpeedValue');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const soundInput = document.getElementById('soundEnabled');
const alwaysOnTopInput = document.getElementById('alwaysOnTop');
const themeSelect = document.getElementById('theme');
const speechEnabledInput = document.getElementById('speechEnabled');
const speechFrequencySelect = document.getElementById('speechFrequency');
const resetButton = document.getElementById('reset');

function set(patch) {
  chrome.storage.sync.set(patch);
}

function render(settings) {
  enabledInput.checked = settings.enabled;

  petsContainer.innerHTML = '';
  Object.keys(RIG.SPECIES).forEach((key) => {
    const btn = document.createElement('button');
    btn.title = RIG.SPECIES[key].label;
    btn.className = key === settings.pet ? 'dp-selected' : '';
    btn.appendChild(RIG.buildPetSVG(key));
    btn.addEventListener('click', () => set({ pet: key }));
    petsContainer.appendChild(btn);
  });

  positionModeSelect.value = settings.positionMode;

  Array.from(sizeContainer.children).forEach((btn) => {
    btn.classList.toggle('dp-selected', btn.dataset.value === settings.size);
  });

  animationSpeedInput.value = settings.animationSpeed;
  animationSpeedValue.textContent = Number(settings.animationSpeed).toFixed(1) + 'x';

  opacityInput.value = settings.opacity;
  opacityValue.textContent = Math.round(settings.opacity * 100) + '%';

  soundInput.checked = settings.soundEnabled;
  alwaysOnTopInput.checked = settings.alwaysOnTop;
  themeSelect.value = settings.theme;
  speechEnabledInput.checked = settings.speechEnabled;
  speechFrequencySelect.value = settings.speechFrequency;
}

chrome.storage.sync.get(DEFAULTS, render);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  chrome.storage.sync.get(DEFAULTS, render);
});

enabledInput.addEventListener('change', () => set({ enabled: enabledInput.checked }));
positionModeSelect.addEventListener('change', () => set({ positionMode: positionModeSelect.value }));

Array.from(sizeContainer.children).forEach((btn) => {
  btn.addEventListener('click', () => set({ size: btn.dataset.value }));
});

animationSpeedInput.addEventListener('input', () => {
  animationSpeedValue.textContent = Number(animationSpeedInput.value).toFixed(1) + 'x';
});
animationSpeedInput.addEventListener('change', () => set({ animationSpeed: Number(animationSpeedInput.value) }));

opacityInput.addEventListener('input', () => {
  opacityValue.textContent = Math.round(Number(opacityInput.value) * 100) + '%';
});
opacityInput.addEventListener('change', () => set({ opacity: Number(opacityInput.value) }));

soundInput.addEventListener('change', () => set({ soundEnabled: soundInput.checked }));
alwaysOnTopInput.addEventListener('change', () => set({ alwaysOnTop: alwaysOnTopInput.checked }));
themeSelect.addEventListener('change', () => set({ theme: themeSelect.value }));
speechEnabledInput.addEventListener('change', () => set({ speechEnabled: speechEnabledInput.checked }));
speechFrequencySelect.addEventListener('change', () => set({ speechFrequency: speechFrequencySelect.value }));

resetButton.addEventListener('click', () => {
  set({ ...DEFAULTS, posX: null, posY: null });
});
