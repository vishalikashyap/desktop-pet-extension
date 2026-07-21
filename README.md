# Desktop Pet Extension

A small animated pet that lives on whatever web page you're viewing. Each pet (cat, dog, panda, rabbit, fox) is built as a layered SVG "rig" (body/head/ears/tail/legs/arm) defined in [pet-rig.js](pet-rig.js), animated entirely with CSS — no image assets required.

## Load it in Chrome/Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `desktop-pet-extension` folder.
4. Open any web page — the pet appears and starts living its life.
5. Click the extension icon to open the settings popup.

## Behavior

- Randomly cycles through walking, sleeping, sitting, looking around, stretching, jumping, waving and dancing (roughly every 20-60s), each with its own articulated CSS animation.
- Leaves a fading paw-print trail behind it while it walks or runs back home.
- Hover to see it smile, single-click for a heart pop, double-click (or click while a heart is pending) to trigger a dance, drag it anywhere and let go — in a corner-anchored position mode it runs back to its edge; in free mode it stays wherever you drop it.
- Synthesizes its own short sound effects per species via the Web Audio API (no audio files).
- Speech bubbles pop up periodically with little messages if enabled.

## Settings (popup)

Pet species, position mode (4 corners or free-drag-anywhere), size, animation speed, opacity, sound on/off, always-on-top, theme, speech bubbles + frequency, and a reset-to-defaults button. All settings sync via `chrome.storage.sync`.

## Files

- `pet-rig.js` — shared species config + SVG builder, loaded by both the content script and the popup.
- `content-script.js` — behavior state machine, drag/interaction handling, footprints, speech, sound.
- `content-style.css` — all CSS keyframe animations for the rig parts, footprints, speech bubble.
- `popup.html/.css/.js` — settings UI.

## Notes

- No icons are declared in `manifest.json`; Chrome will show a generic default icon.
- The content script runs on all `http(s)` pages (`manifest.json` matches). Narrow the `matches` array if you only want it on specific sites.
- Settings changes apply live via `chrome.storage.onChanged`, but reload open tabs if you don't see an update.
