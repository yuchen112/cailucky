# CxQ integrated polish — 20261008-polish2

- Divination removed from the 18-game catalogue and added to the box menu. Dedicated generated return art leads to website homepage.
- Ten characters plus box: 34 independently generated new blink/greeting/reaction frames; 44 transparent aligned WebP display frames total. Only the selected character's four frames preload. Reduced-motion and visibility cleanup supported.
- Shared gesture-unlocked audio service: immediate volume changes, playlist alternation, failed-track fallback, retry, bounded SFX polyphony, three cue variants, pause/background/page-cache recovery. Wired all 19 experiences including divination. Nineteen original alternate themes and 33 original cues added; existing scene music preserved.
- Loading: main catalogue bypasses unrelated data wait; app.json retains its path and revalidation; Richman loads home first and queues other assets on demand; bounded image decoding and retry in storybook games; town galleries lazy-load; defense prepares current battle before background chapter preload.
- 99 verified optimized interface images: 22,991,773 -> 15,118,868 bytes (34% smaller). Original source art retained. This measures asset bytes, not real-device load seconds.

Validation:
- 24 regression suites pass (regression-results.json), including physics, controllers, game modes, save/reload and defense.
- New audio lifecycle test passes: gesture, mute recovery, hold, visibility, playlist, failed source fallback, variant cycling and disposal.
- 168 production audio files decode with nonzero signal (offline report). This does not establish speaker output on a physical phone.
- All 44 mascot display images decode at 384x384 with alpha. Generated contact sheet inspected; website return artwork inspected.
- Browser QA: all 18 game entries opened in 390x844 or 844x390 as appropriate. Start/menu/primary controls checked: dino jump/pause/settings/preview/mute; flappy takeoff/pause; merge drop/pause; mines safe first reveal; whack start/pause; 2048 new-game confirmation; memory setup/flip; tetris rotate/move/drop/pause; clicker tap/companion; link setup/hint; brick character/start/pause; dream shuffle; bubble fire/swap; poker mode/open-table reminder; Richman home/character/equipment; town scratch selector/multiplier/no-cost demo; arcade selection/training controls/tools; defense camp/chapter/briefing. Divination website return and box shortcut checked. Ten character selections and box restored with correct loaded 384px images.
- Arcade browser training displayed 75 FPS in tested viewport. No claim of physical-phone FPS.

Limits: desktop browser viewport QA is not Android/iPhone hardware acceptance. Complete campaign progression and every poker rules variant were covered by existing logic tests where present, not played exhaustively in this release. Physical audio listening remains user/device acceptance.

Final defense browser check: battle loaded without console errors; deployment confirmed, coins 360 -> 290 and next-wave button enabled.
