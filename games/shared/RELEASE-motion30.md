# Animation upgrade — first timing pass

Implemented:
- Poker: shared anticipation/release/recovery timeline. Played cards and hand
  rearrangement wait until the character pose appears; hand-to-discard cards
  use the same release beat. Deal/hit/pass timing remains unchanged.
- Dream match: line-special effects expand from their actual origin in both
  directions, with clearing and standalone burst artwork on the same beat.
  Crossing effects use the earliest arrival. Delayed bursts remain invisible
  until their turn, and cleared gems remain hidden until the board is rebuilt.

Verification:
- 60 poker tests passed.
- Browser pose harness passed all ten roles at 640x320, including cancellation,
  bounds and reduced motion. Intermediate screenshots inspected.
- Dream rules: 106 assertions; motion tests cover origin, symmetry, columns,
  intersections, cleanup and reduced motion.
- Dream browser at 390x700: a valid exchange scored 300 and used one move
  (28 to 27), no residual effect elements or horizontal document overflow;
  no browser errors. This is simulation, not physical Android verification.

This is NOT the full animation overhaul. No new artwork was generated in this
pass. Existing individual character/burst images are reused, not cropped.
Remaining: poker intermediate acting frames and table choreography; bubble,
merge, whack, flappy, runner, mines, tetris and other game-specific motion
passes, followed by cross-game mobile verification. Richman remains unchanged;
tower defense remains closed. Existing unrelated cover edits are preserved.
