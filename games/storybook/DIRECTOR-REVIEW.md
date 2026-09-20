# Eight-game director pass — 2026-09-20
Version: `20260920-director2`

## Scope
- Only merge, magic-bubble, dream-match, fairytale-defense, whack, flappy, dino, mines and their shared presentation.
- Richman game files and the pre-existing modified game-cover PNGs were not changed by this pass.
- Original CxQ character references retained. 40 individually generated full-image assets: 8 home environments, 30 integrated rider/vehicle illustrations, 2 burrow occlusion layers. No atlas slicing.
- Character/vehicle files load on selection. Total new WebP footprint approximately 9.4 MB, not all downloaded on first play. Flight loads only the selected rider and route; unused legacy background preloads removed. Original role-picker images are lazy-loaded; shared loader no longer fetches ten unused character images for each call.

## Implemented
- Five portrait-only games; tower defense, dino and mines landscape-only. Direction gate applies to home and gameplay.
- Full viewport layouts, no blurred extension. Tower battlefield adapts to its available rectangle; canvas pointer coordinates account for scaling.
- Each game has a new composed home scene. Bubble/dream chapter selectors removed; dino exposes normal play with easy/normal/hard.
- Unified in-game settings with restart/return-to-this-game-home and illustrated confirmation, placed before audio controls.
- Merge one-use companion abilities, stable drop layout, proportional board input mapping.
- Flappy four freely selectable vehicles with ten original IP riders; same collision rules for every vehicle.
- Tower demolition confirmation with 70% investment refund, rebuildable empty pads.
- Whack independently illustrated front/back hole layers and clipped emergence; no objects sliding visibly below their holes.
- Dino uses a consistent source-image scale for run/jump/crouch instead of shrinking the whole crouched character.
- Mines readable illustrated numerals, minimum 38 px cells and scrollable large boards; stronger detonation artwork.
- Readable HUD/skill descriptions, larger touch controls, dynamic skill charge and shuffle counts.

## Verified
- `node tools/verify-director.cjs`: 226 assertions; eight game scripts compile; 40 distinct art sources; deleted asset list checked.
- `node tools/test-dream-core.cjs`: 106 rule assertions.
- Browser emulation: 390×844 / 844×390 and small 320×568 / 667×375.
- Eight homes loaded without visible broken images or horizontal document overflow; all eight reject the opposite orientation and make the play surface inert.
- All eight settings-to-home transitions exercised.
- Merge: measured canvas/drop/ability rectangles before and after drop; unchanged. Healing ability consumed once and disabled afterward.
- Dream: a visible adjacent swap yielded 300 points and reduced moves from 26 to 25.
- Tower: build for 80, dismantle for 56, balance 280 → 200 → 256; confirmation exercised.
- Dino: difficulty selection, HUD, live crouch pose and orientation gate checked.
- Flappy: paper-envelope and leaf-glider selections match home and play illustration; all four options present.
- Whack: live emergence/occlusion and score readability inspected.
- Mines: safe first reveal, illustrated numbers, detonation and loss/result flow exercised.

## Cleanup / recovery
55 unused historical atlases and sliced exports removed only after checking no runtime JS/CSS/HTML references and confirming every file exists in backup `backup/pre-20260920-director-pass` (f7558b497a1c7c62bdfeea0bb03be549462b45cd).
Exact list: `tools/director-obsolete-assets.json`.
Original uncommitted artwork sources and unrelated preview files were preserved.

## Verification limits
Checks were in desktop Chromium at mobile viewport sizes, not physical iOS/Android devices. This is not a claim of exhaustive device coverage or a playthrough of every difficulty, tower map, or all 40 rider/vehicle combinations. Browser full-screen availability remains platform-dependent; the game fills the available viewport regardless.
