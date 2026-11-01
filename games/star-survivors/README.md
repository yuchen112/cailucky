# CxQ 星願割草冒險 · 露緹 / 星晶洞窟 · v2

Single-character, complete-run browser release with a complete visual/interface revision, 2026-11-02. The game-hub card remains locked. Trial entry is `play.html`; `index.html` is a branded locked holding page. Existing v1 runs and permanent upgrades are preserved; the storage schema and combat values are unchanged.

## Play

Move with WASD / arrow keys, or the bottom-left virtual joystick. Space or the Star Dash button grants a brief invulnerable dash with a four-second cooldown. Attacks aim automatically. Collect experience, choose upgrades, evolve four weapons at level five, defeat elite monsters and collect their chests. At eight minutes, the Crystal Core Golem arrives. Defeat it to win; reaching eight minutes alone is not victory.

The boss changes bullet patterns below 45% health. A ring signals its next volley, and a screen-edge pointer shows its direction when offscreen. Normal and gentle difficulties are available. Returning from a backgrounded tab pauses play.

Runs save every five seconds, at upgrades and on pause. The home screen restores a saved run. Results award starlight for permanent health, power, speed and pickup upgrades. Starting a new run asks before replacing an existing run. All storage is browser-local; the game continues with a notice if storage is unavailable. No login, server or external runtime dependency is needed.

## Art and rendering

Canvas 2D game rendering with separate renderer and audio modules; HTML/CSS lays out live text over painted raster interface assets. The v2 art directory adds ten purpose-made assets: normal/pressed buttons, a nine-slice crystal frame, eight item icons, a Traditional Chinese title mark, eight magic-impact frames, four environment props, twelve enemy movement/flap/hop frames, four boss attack frames, a cavern menu backdrop and two circular touch controls. Original Luti four-frame run and cast sheets retain her identity. These atlases contain purpose-made game frames/items, not pieces cropped from promotional key art. Large bursts render beneath the player to preserve her silhouette. Nearby foreground props fade, while offscreen drops and projectiles are culled. Glow textures are cached.

The menu has an animated Luti presentation and ambient light. Painted controls provide hover, press, disabled and focus feedback, with click sparks and sound. The HUD uses item slots, a wave track and a circular dash cooldown. Upgrade cards show item art and the next upgrade's base effect. Weapon evolution, treasure and boss arrival briefly pause combat for their respective presentations; victory includes a medal and counting rewards. Sound uses locally synthesized chord/arpeggio music and distinct UI/combat cues after the first interaction. A reduced-motion preference disables decorative CSS transitions. `art-manifest.json` records all sixteen retained/shipped image files and hashes.

## Validation

Run `node tests/core.test.mjs`: ten focused checks, including the new visual event contracts, and three deterministic full-run moving-player simulations with victory assertions. Browser QA checked desktop and a 390×844 viewport, upgrade selection, keyboard movement and dash, circular virtual joystick movement and cooldown, save/reload/resume, evolution, treasure, boss arrival, victory/defeat results, and permanent upgrades. Late-game checks use local-only simulation snapshots, never a production cheat route. Render CPU timing is exposed in the canvas dataset for local inspection; it is not a physical-phone GPU benchmark.

Physical Android/iPhone sustained performance and multi-touch have not been tested. Animation uses economical four-frame cycles, including the new independent monster and boss frames. Human balance and visual acceptance still require user play; simulation victories do not establish either.
