# Desktop Pet Extension

A small animated pet that wanders around whatever web page you're viewing. Ships with emoji placeholders for five pets (bear, bunny, dino, fox, monkey) — swap these for real sprite art whenever you have it.

## Load it in Chrome/Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `desktop-pet-extension` folder.
4. Open any web page — the pet appears bottom-left and starts wandering.
5. Click the extension icon to toggle it on/off or switch pets.

## Behavior

- Wanders left/right, idles, and occasionally "sleeps" (Zzz).
- Drag it anywhere on the page with the mouse.
- Click it to make it bounce.
- Pet choice and enabled state are synced via `chrome.storage.sync`, so they persist across tabs/devices signed into the same browser profile.

## Swapping in real sprite art

Replace the emoji lookup in [content-script.js](content-script.js) (`PETS` object) and [popup.js](popup.js) with `<img>`/sprite-sheet based rendering:

1. Add PNG sprite sheets under an `assets/` folder and list them in `manifest.json` under `web_accessible_resources`.
2. In `content-script.js`, replace `root.textContent = PETS[petKey]` with setting a `background-image` sprite sheet on `#dp-pet-root` and step through frames on an interval for walk/idle/sleep animations instead of relying on the emoji + CSS bob.
3. Update `content-style.css` sizing to match your sprite's frame dimensions.

## Notes

- No icons are declared in `manifest.json`; Chrome will show a generic default icon. Add `icons` in the manifest once you have real artwork.
- The content script runs on all `http(s)` pages (`manifest.json` matches). Narrow the `matches` array if you only want it on specific sites.
