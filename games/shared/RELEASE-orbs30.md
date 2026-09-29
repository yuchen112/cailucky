# Individual ball artwork refresh

18 individually generated images using built-in image_gen:
- Magic Bubble: six glass orbs, original color/symbol mapping preserved.
- Merge: twelve collectible enamel/crystal marbles, original tier/name order.

Exact prompts, generated PNG sources and installed WebP paths are recorded in
orbs-v2-manifest.json. Each image was generated in a separate call. No atlas,
cropping, compositing or CSS illustration. All 18 images visually inspected.
Whole-image proportional WebP conversion: 256px bubble, 384px merge,
quality 88 with preserved alpha. Combined payload 737446 bytes.

Per-image alpha bounds calibrate visual centers/radii to game coordinates;
the renderer always draws the entire image. Gameplay, next-ball previews and
the merge collection use the same new assets. Existing backgrounds, IP roles
and physics rules are unchanged. Corrected the merge score popup for the final
tier to show the actual award rather than the capped display tier's value.

Checks passed: orb geometry/whole-image draw tests, bubble motion/endless tests,
merge physics regression (support removal, duplicate merges, wall/floor limits).
tools/check-orbs.cjs uses isolated browser state: all 18 images decode;
real merge buttons drop two tier-0 balls, producing one tier-1 ball and 10 points;
390x700 and 360x640 screenshots inspected, no horizontal overflow or scroll
shift, no JavaScript errors. Separate short-lived browser calls intermittently
returned daemon EOF; a continuous file-backed harness completed and closed.
This is browser simulation, not physical Android verification.

Old shared assets are retained because other games may still reference them.
Richman/tower defense and unrelated cover edits are untouched. The broader
all-game animation plan, including poker acting frames, remains unfinished.
