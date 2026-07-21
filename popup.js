const PETS = {
  bear: '🐻',
  bunny: '🐰',
  dino: '🦖',
  fox: '🦊',
  monkey: '🐒'
};

const DEFAULTS = { enabled: true, pet: 'bear', speed: 60 };

const enabledInput = document.getElementById('enabled');
const petsContainer = document.getElementById('pets');

function render(settings) {
  enabledInput.checked = settings.enabled;
  petsContainer.innerHTML = '';
  Object.entries(PETS).forEach(([key, emoji]) => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.className = key === settings.pet ? 'dp-selected' : '';
    btn.addEventListener('click', () => {
      chrome.storage.sync.set({ pet: key });
    });
    petsContainer.appendChild(btn);
  });
}

chrome.storage.sync.get(DEFAULTS, render);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  chrome.storage.sync.get(DEFAULTS, render);
});

enabledInput.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabledInput.checked });
});
