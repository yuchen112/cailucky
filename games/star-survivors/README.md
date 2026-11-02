# CxQ 星願割草冒險 · 旅團遠征 / 基礎試玩版

The playable expedition prototype includes all ten original characters, thirty monster species, five illustrated bounded arenas, thirty equipment items and a map-material workshop loop. Entry expedition.html; the public hub remains open and labelled 基礎試玩版.

## Play

Choose any character and any destination. Each role has a dedicated main weapon, distinct innate and active skill, four eligible support choices, two support slots and four blessing slots. All equipment chooses a route at level three and evolves at five. Each run has three rerolls, two skips and one exclusion.

Desktop: WASD/arrows, Space dash, E/Q character skill, Escape pause. Touch: press anywhere on the battlefield to steer toward that point, drag to change direction, release to stop. The camera follows the character; steering updates in screen space. Skill buttons use separate pointers. Pointer cancellation, leaving the app, pause and choices clear movement. Fixed joystick is hidden. The game prevents accidental text selection and double-tap/pinch zoom; camp and dialog content retain vertical scrolling.

The five destinations have different enemy families, bosses, materials and environmental mechanics. Cave: crystal eruption warnings and crystal fragments. Forest: cleansing flower buds, spores and seed cores. Coast: rectangular tide sweeps, burrowing enemies and moon pearls. Clock courtyard: time fields, echoes and gears. Sky garden: lightning warnings, beneficial wind fields and dawn feathers. Gather three objective beacons and survive 4:00–5:00 depending on map, then defeat its boss. Completing the clock alone is not victory. Arenas have shared model bounds; the illustrated scene is centered once, not mirrored under the character.

Thirty species use chase, orbit, range, shield, split, charge, heal, summon, zone, burrow, echo, zigzag and boss behavior families. Boss freeze resistance prevents permanent locking. Gentle difficulty reduces all hostile contact, projectile and environmental damage and adjusts enemy/boss patterns; reward rules stay equal.

## Materials and growth

Pick up map-specific materials and settle earned loot at the end of a run, including a defeat. The workshop shows required materials, their destination, cost, current level and next benefit. Equipment upgrades have five permanent ranks of +8% source effect (damage, healing or shielding as applicable). Character traits have five ranks improving the role innate by 10% per rank. Changes apply to the next expedition. All roles and maps are selectable without unlock grinding. Role mastery and map clear counts persist separately.

## Save compatibility

New profile/run keys are cxq-star-survivors-v4 and cxq-star-survivors-v4-run. Existing starlight and permanent growth migrate without changing the old profile; its original JSON is backed up. The old in-progress game is accessible through the explicit legacy link and retains old equipment rules. Runs autosave every five seconds, at upgrades and pause. Settlement uses run IDs to prevent duplicate rewards. Storage is browser-local, not cloud sync; failure is reported and workshop changes roll back if persistence fails.

## Art

Ten reference-derived original combat character sheets (twelve frames each), five independent environment paintings, five enemy atlases (four frames per species), thirty equipment icons, five material icons and twelve companion animation frames were created with built-in imagegen. Original identity/species retained, including bear guardian, puppy healer and fox character. Runtime uses WebP alpha atlases (about 8.7MB total) and JPG terrain; source masters remain in the canonical workspace. expedition-art.json records prompts, references, frame layout and hashes. Main light beams render the same endpoint and width used for collision; high-speed projectiles use swept segments. Damage feedback, skill/evolution/boss presentations, warnings, role animation, shadows and ambient map effects use the original painted style.

## Verification

node tests/expedition.test.mjs: 25 focused checks across all roles, all equipment routes, species behaviors, full beam length, damage, objectives, material upgrades, migration and idempotent settlement.
node tests/expedition-balance.mjs: ten complete standard-difficulty role simulations, all five maps covered twice, with actual objective collection and victory assertions. The bot steers away from arena edges and dangerous attacks; no invincibility override.
node tests/touch.test.mjs: direct touch steering, speed normalization, second-pointer isolation, release/cancel/pause and overlay guards.
node tests/arena.test.mjs: bounded movement, accessible objectives and enemy approach margins.

Browser verification covers desktop/mobile layout, character/map selection, skills, upgrades/branches, material settlement, equipment/trait purchases and reload persistence, all thirty bestiary cards and error logs. Local simulation snapshots used for late-game checks are outside the shipped game and are never published. Physical Android/iPhone multitouch, sustained performance and audio latency remain unverified. Simulation victory does not establish human balance or artistic acceptance.
