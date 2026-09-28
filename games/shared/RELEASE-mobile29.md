# 2026-09-29 mobile improvement — first delivery

This is a partial delivery of the all-game improvement plan, not completion of all artwork/animation work.

## Implemented
- Mines beginner board sizes itself to viewport (800x360: 33px cells, 321px board within 336px viewport). Larger boards retain readable sizes and scrolling; existing 500ms flag gesture retained.
- Link: dedicated home, minimum 44px cards, short-screen 4x16 / 5x16 dense layouts with scrolling, drag/click suppression, own-home action.
- 2048: in-game new-round dialog, non-overlapping short portrait controls, single settings entry, directional slide animation, input lock and pointer cancellation.
- Dream Match: adjacent swipe exchange, invalid-edge guard, suppression of following synthetic click.
- Tetris: one individually AI-generated full-screen background, no blurred title-page filler, official character labels, Chinese next/hold labels. Existing gameplay controls retained.
- Memory: larger high-contrast HUD on existing individual artwork.
- Click Core: home/continue entry, local-save warning, official role labels.
- Storybook settings/help: sticky close action. Shared music dialog: close at top, bounded scrolling.
- Only changed code/style cache keys updated, rather than invalidating all images.

## Evidence
- Local browser: 393x780, 360x540, 800x360, 640x320, plus 14 affected entry-page smoke checks without reported JS errors or completed broken img requests.
- Mines 800x360: board 321px, viewport 336px.
- Link 640x320: cells 44px; dense board intentionally horizontally scrollable.
- 2048 seeded [2,2,2,2] -> [4,4,0,0], score 8; short portrait controls inside viewport.
- Dream swipe: moves 28 -> 27, aria-busy false after animation.
- Settings close button observed within frame.
- test-mobile29.cjs passes HTML boundary, script syntax, five merge invariants, role-label checks.
- Existing tests passed: mobile24 (8), gameplay-repair (19), dream-core (106 assertions), dream-motion, merge-physics, bubble-endless, art-loader, poker (37).
- No physical Android device testing.

## Remaining from approved plan
- Poker seated acting/hand gestures beyond current card travel animation.
- Per-role runner/flight visual sizing and contact animation refinement.
- Whack character acting and deeper individual UI art review.
- Bubble progression/impact art polish; deeper Dream special effects.
- Brick-breaker, Fortune, and remaining settings/result artwork refinements.
- Broader slow-network, device/browser-bar, all-character/all-stage testing.
- Legacy CSS illustration replacement and full asset provenance review.

Richman files and closed Tower Defense were not changed. User's pre-existing cover PNG changes and untracked originals were not staged or deleted.

New art: ../tetris/assets/ui/title-workshop-v2.webp; exact built-in image generation prompt alongside in title-workshop-v2.prompt.txt. Whole-image WebP conversion, no sprite-sheet slicing.
