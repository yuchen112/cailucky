# CxQ complete game refresh — 2026-10-08

Authorized scope: complete integrated production release, with no partial deployment.

## Required delivery

- Lucky Town: smaller scene assets and bundled entry code; responsive input feedback without losing atomic save/mirror protection; stable spin controls.
- Scratch collection: ten individually illustrated ticket faces, independent foil art, asset-based result symbols; preserve the ten denomination-specific games, saved outcomes and single-claim settlement.
- Arcade: prevent double-tap/pinch zoom inside game; larger home mode controls; 120 NEW independent drawn frames for ten characters across launcher, sweep, aerial and finisher sequences, not transformations of existing poses; distinct routes per character, training demonstrations, combo escape and input buffer.
- Arcade audio: five original multi-instrument music arrangements, layered recorded/rendered combat cues and character timbres; settings, voice limits and background pause.
- Every public game: individually designed return art, appropriate position per home layout, CxQ-prefixed title and concise description.
- Preserve existing saves, data formats and unrelated workspace changes.

## Release gates

- All required artwork present, decoded, inspected for identity/pose/text/alpha and retained prompt provenance.
- Scratch purchase/reveal/reload/settlement and duplicate-claim protection pass.
- Arcade motion frame selection and new move rules/cancels tested for all ten fighters; no infinite chains.
- Home and play UI checked in browser, short landscape and portrait entry conditions; physical devices reported separately.
- First/return loads measured separately, downloaded-byte totals recorded; target >=40 FPS during actual battle.
- Scoped commit only; GitHub Pages success AND live new version verified before declaring publication complete.

## Current status

Integrated implementation and local release validation complete. All 164 independent artworks are present and decoded, including 120 new character motion drawings and 19 game-specific return artworks; source prompts are retained in asset-jobs.json and manifest.json. New ticket illustrations, foil and symbols replace the former new-ticket CSS/SVG presentation while legacy purchased tickets retain compatibility.

The full arcade package contains 291 independently encoded images (7,777,238 bytes versus 22,236,550 original bytes), with a 419,933-byte menu package. Lucky Town uses 876 delivery images totaling 38,612,016 bytes versus 87,092,476 originals; these totals cover the full collection, not a single startup download. Entry code is bundled, and only current arcade participants and stage load before battle.

Current checks passed: 22 existing arcade integration checks; 60 new combat/restore/route checks; 291-image pack decode/alpha/aspect/index/retry checks; five music and 27 unique cue decodes without full-scale clipping; 164-art transparency/provenance checks; ten new ticket products with 10,000 rule/save/claim cases; existing 120,000 slot and 48,000 legacy-ticket simulations.

Browser checks covered all 19 home return paths, the game-center names/descriptions, portrait entries and short landscape controls. At 667×375, the slot main control remained at x455.67/y227, 186×44 through spin/choice/respin/settlement; desktop control remained x905/y433.5, 323.81×48. A 1.2-second multiplier hold moved ×2 to ×12. Actual scratch dragging, reveal, reload and single claim were exercised locally.

Fresh local arcade entry with 曦羽 versus 糯糯 in 星願工坊 reported 178ms menu, 55ms selection and 157ms match preparation, approximately 75 FPS, a three-hit 212-damage character route and an 88-damage new launcher. These are local browser observations, not production-network or physical-device guarantees. Android/iPhone and physical gamepad acceptance remain unverified.

Publication must still be confirmed against the matching GitHub Pages run and the live complete1 URLs. Live measurements and screenshots are retained separately under outputs/refresh-20261008 after deployment; local success alone does not establish production success.

To rebuild on another machine: npm --prefix tools/refresh-tooling install; node tools/build-arcade-packs.mjs; node tools/build-complete-refresh.mjs. Never publish a pack built with --allow-incomplete-dev. The generated record files under records/ are local generation evidence; generated.json and manifest.json retain the portable source filenames and complete prompts.
