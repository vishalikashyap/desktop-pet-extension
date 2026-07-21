const PET_EMOJI = {
  cat: '🐱',
  dog: '🐶',
  panda: '🐼',
  rabbit: '🐰',
  fox: '🦊'
};

const SIZES = [16, 32, 48, 128];

function buildIconImageData(emoji) {
  const imageData = {};
  SIZES.forEach((size) => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.font = `${Math.floor(size * 0.82)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);
    imageData[size] = ctx.getImageData(0, 0, size, size);
  });
  return imageData;
}

function updateIcon(pet) {
  const emoji = PET_EMOJI[pet] || PET_EMOJI.cat;
  chrome.action.setIcon({ imageData: buildIconImageData(emoji) });
}

chrome.storage.sync.get({ pet: 'cat' }, (settings) => updateIcon(settings.pet));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.pet) updateIcon(changes.pet.newValue);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get({ pet: 'cat' }, (settings) => updateIcon(settings.pet));
});
