# Desktop Pet — Project Overview

A small animated pet (cat, dog, panda, rabbit, or fox) that lives on your screen. The same animation rig ([pet-rig.js](pet-rig.js)) is reused across three separate surfaces that ship from this one repo.

## Surfaces

| Surface | Location | What it is |
|---|---|---|
| Browser extension | repo root (`manifest.json`, `background.js`, `content-script.js`, `popup.*`) | Chrome/Edge Manifest V3 extension |
| Landing page | [landing/](landing/) | Static marketing page with a live iframe demo |
| Mobile app | [mobile-app/](mobile-app/) | Installable PWA (same pet, touch-driven) |

## Stack

No framework, no bundler, no npm, no build step anywhere in the repo — everything is hand-written HTML, CSS, and vanilla JS. The pet itself is an SVG "rig" (body/head/ears/tail/legs) assembled at runtime and animated purely with CSS keyframes — no image or sprite assets.

### Browser extension (Manifest V3)

- `manifest.json` — MV3 manifest, `storage` permission only.
- `background.js` — service worker; draws the emoji-based toolbar icon on an `OffscreenCanvas` per selected species.
- `content-script.js` + `pet-rig.js` — injected into every `http(s)` page; behavior state machine (walk/sleep/sit/look/stretch/jump/wave/dance), drag handling, footprint trail, speech bubbles, and sound.
- `content-style.css` — all CSS keyframe animations for the rig, footprints, and speech bubble.
- `popup.html/.css/.js` — the settings UI opened from the toolbar icon.
- **Storage**: `chrome.storage.sync` for all settings (species, size, position mode, speed, opacity, theme, sound, speech), synced live via `chrome.storage.onChanged` so open tabs and the popup stay in sync without a reload.
- **Audio**: Web Audio API, synthesized per-species on the fly (no audio files).

### Landing page

- [landing/index.html](landing/index.html) + [landing/style.css](landing/style.css) — plain static HTML/CSS.
- Embeds the mobile app live via `<iframe src="app/index.html">` as an interactive demo, and links to a generated `desktop-pet-extension.zip` for direct download.

### Mobile app (PWA)

- [mobile-app/index.html](mobile-app/index.html) + [app.css](mobile-app/app.css) + [app.js](mobile-app/app.js) — same settings sheet UI pattern as the extension popup, touch-adapted.
- [pet-rig.js](mobile-app/pet-rig.js) — identical copy of the extension's rig/animation code.
- [manifest.webmanifest](mobile-app/manifest.webmanifest) — installable app metadata (icons, standalone display, theme color).
- [service-worker.js](mobile-app/service-worker.js) — cache-first service worker; precaches the app shell on install and falls back to cache when offline.
- No `chrome.storage` available here — settings persistence is local to the page (see `app.js`).

## Deployment

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) runs on every push to `main` that touches the extension, landing, or mobile-app files:

1. Copies `landing/` to the site root and `mobile-app/` to `app/` inside it.
2. Zips the extension source files (`manifest.json`, `background.js`, `content-script.js`, `content-style.css`, `pet-rig.js`, `popup.*`, `README.md`) into `desktop-pet-extension.zip` for the landing page's download button.
3. Publishes the assembled `dist/` to GitHub Pages.

The extension itself isn't "deployed" anywhere runnable — it's either loaded unpacked in Developer mode (via the zip) or would need a Chrome Web Store listing to be installed normally.

## Repo layout

```
manifest.json, background.js, content-script.js,   Chrome/Edge extension
content-style.css, popup.html/.css/.js, pet-rig.js
landing/                                            Static marketing site
mobile-app/                                         Installable PWA
.github/workflows/deploy-pages.yml                  Build + GitHub Pages deploy
```
