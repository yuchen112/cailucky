# CxQ character animation source

Each `.aseprite` file contains 12 individually authored full-body frames: a six-frame walk and a six-frame finisher. The new poses were generated independently with character references. Atlas packing combines finished frames for delivery; it does not crop a generated montage or invent poses by deforming one image.

Editable Aseprite sources are retained here. Browser assets are optimized WebP files in `games/shared/character-motion/`. Runtime loading fetches only the selected character. Reduced-motion and hidden-page states restore the static artwork.

Install the pinned tooling with `npm --prefix tools/refresh-tooling install`. Run `node tools/export-character-motion.mjs` with Aseprite installed; `ASEPRITE_BIN` can override the executable path. Run `node tools/test-character-motion-20261009.mjs` to verify alpha, native frame counts, atlas bounds and visibility cleanup. Generation prompts and reference filenames are retained in the art manifests.
