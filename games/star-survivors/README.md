# CxQ 星願割草冒險 · 露緹 / 星晶洞窟

Single-character, complete-run browser release, 2026-11-01. The game-hub card remains locked. Trial entry is `play.html`; `index.html` is a locked holding page.

## Play

Move with WASD / arrow keys, or the bottom-left virtual joystick. Space or the Star Dash button grants a brief invulnerable dash with a four-second cooldown. Attacks aim automatically. Collect experience, choose upgrades, evolve four weapons at level five, defeat elite monsters and collect their chests. At eight minutes, the Crystal Core Golem arrives. Defeat it to win; reaching eight minutes alone is not victory.

The boss changes bullet patterns below 45% health. A ring signals its next volley, and a screen-edge pointer shows its direction when offscreen. Normal and gentle difficulties are available. Returning from a backgrounded tab pauses play.

Runs save every five seconds, at upgrades and on pause. The home screen restores a saved run. Results award starlight for permanent health, power, speed and pickup upgrades. Starting a new run asks before replacing an existing run. All storage is browser-local; the game continues with a notice if storage is unavailable. No login, server or external runtime dependency is needed.

## Art and rendering

Canvas 2D game rendering; HTML/CSS for the surrounding menus and meters. New Luti battle outfit, a four-frame run cycle and a four-frame standing/cast cycle preserve the original character identity. Sprite sheets are purpose-made animation frames, not a cropped promotional illustration. Three small enemies and one boss share a purpose-made four-cell atlas. Ground, cover and portrait are raster art. Effects use Canvas particles and shapes. Audio is synthesized locally with Web Audio after the first interaction. `art-manifest.json` records the shipped assets and hashes.

## Validation

Run `node tests/core.test.mjs`: nine focused checks and three deterministic full-run moving-player simulations with victory assertions. Browser QA checked desktop and a 390×844 viewport, upgrade selection, keyboard movement and dash, virtual joystick input, save/reload/resume, victory and defeat results, and permanent-upgrade spending taking effect on the next run. Late-game browser checks use local-only simulation snapshots, never a production cheat route.

Physical Android/iPhone playback and sustained performance have not been tested. The four-frame run cycle is an economical animation; enemies use animated transforms rather than independent walk-frame sequences. Human balance feedback is still needed; simulation victories do not prove subjective difficulty or animation acceptance.
