# Mobile controls and poker presentation — 20260924-controls3

## Scope
Mines: only three difficulties exposed; gesture ownership, drag/multi-touch cancellation and 500ms long press; instructions updated; no flag/reveal toolbar; larger board viewport; settings help.
Tetris: responsive two-zone controls, top HOLD/pause, visible-viewport height budgeting, cancelable held movement.
Poker: bounded overlapping hands and drag preview, independent seated art for all ten existing IP characters, ten separate victory sprites, individual chip-stack art, measured card travel, stock/discard layering, pass feedback, public-only draw reveal, settlement motion, animation locks and interruption cleanup.

## Art
21 independent built-in imagegen assets, no sprite-sheet cropping.
Source prompts/references: art/seated-manifest.json and art/chip-manifest.json.
Master PNGs retained locally (ignored); WebP delivery assets included. Twenty character WebPs total 914,340 bytes.
No third-party character artwork copied. Existing names/identities retained.

## Verification
- 37 Node tests passed (rules, full rounds, saves, restore/settlement, hand geometry).
- Eight browser UI rounds completed through settlement and leaving table, image loading and document containment passed.
- Mines synthetic pointer tests: hold, release suppression, repeat hold removal, drag cancel, pointer cancel, second pointer cancel.
- Tetris observed at 393×780, 360×780, and 360×540: action controls inside viewport.
- Poker hand containment checked at 800×360 and 640×320; pause freezes saved revision and clears animation ghosts.
- Browser emulation and synthetic input, NOT physical Android device certification.
- Existing unrelated working-tree artwork changes preserved.
