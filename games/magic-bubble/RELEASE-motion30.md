# Bubble animation sequence

- Unmatched shots settle from their collision point into the actual grid cell.
- Matched bubbles remain visible during anticipation, then pulse and burst in
  a bounded wave spreading from the contact cell.
- Unsupported bubbles wait for the removal wave, accelerate downward, rotate
  slightly and fade near the end. Existing individual WebP artwork is reused.
- The game clock drives every effect; help/pause freezes the motion.
- Input stays locked through resolution. Endless mode adds exactly one row
  after the effects finish; results wait for the same completion boundary.
- Reset/home clear pending effects and docking. Reduced motion uses a short
  stationary fade. No new artwork, sprite-sheet cutting or CSS drawings added.

Tests: tools/test-bubble-motion.cjs covers projections, delay, docking, score,
repeat-input lock, pause, endless ordering, reset/home and reduced motion.
tools/test-bubble-endless.cjs and 19 gameplay repair checks also pass.

Local browser: 390x700 and 360x640, screenshots inspected and no horizontal
overflow. Deterministic all-ruby classic test: 5520 points, 31 remaining shots,
win result; help froze canvas pixels in flight and closing resumed to the same
result. Endless test: 3360 points, exactly one completed turn, input unlocked,
no result modal or console errors. Isolated test browser only; no real-player
save edits. Physical Android device not tested.

This is the bubble pass, not completion of the full multi-game animation plan.
Poker, Richman, tower defense and unrelated cover files are unchanged.
