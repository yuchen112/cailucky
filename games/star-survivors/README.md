# CxQ 星願割草冒險 · 基礎試玩版 · v3

One original character, Luti (露緹). Choose a starting style: 星芒法師, 月影守衛, or 晶靈使者. The game-hub card remains open and labelled 基礎試玩版. Entry: play.html.

## Play and build

Move with WASD/arrows or the bottom-left joystick. Space/the dash button grants brief invulnerability, with a four-second cooldown. Attacks fire automatically. Collect crystals to level up. Survive eight minutes, then defeat the Crystal Core Golem to win. Eight minutes is the boss arrival time, not an automatic victory.

Eight weapons: star projectiles, orbital blades, frost rain, shockwave, meteor, chain lightning, crystal summons, and beam. New runs have three weapon slots and four distinct passive slots. Each weapon chooses one of two permanent routes at level three and evolves along that route at level five. The choice screen includes animated attack previews, concrete tradeoffs, three rerolls, two skips and one exclusion per run. Excluding an owned item keeps its current level but removes later upgrades from the pool. Early levels guarantee a fresh weapon option while a slot is free. A slot is committed when its first upgrade is selected.

Nine passives include general power, cooldown, health and collection upgrades, plus distance damage, crowd defense, frozen-death explosions, a summon/other-weapons damage tradeoff, and damaging dash trails. Crystal pact is offered when summons are equipped; frost shatter is offered when frost rain is equipped. Heavy enemies resist most attacks but meteor/beam ignore that resistance; ranged casters stop approaching and telegraph aimed shots. The boss changes patterns below 45% health.

Gentle mode has 22% less enemy health, 14% less movement speed, and 35% less damage from all enemy attacks, including boss/caster projectiles. Boss shots travel 20% slower and use fewer ring/fan bullets. Reward rules are identical in both difficulties.

## Save compatibility

Permanent growth uses the existing localStorage profile key and data. Saves occur every five seconds, at choices and on pause. Branch choice also persists. Schema-one runs migrate to schema two; a local copy of the old raw run is retained under the run key plus -v1-backup before the first overwrite. An old run already owning four weapons keeps those four for that run; new runs always have three slots. Old level-three/five weapons receive their original/default branch. Starting a new run asks before replacing an ongoing adventure. All storage is browser-local.

## Rendering

Canvas 2D, independent painted raster art, HTML text on painted button/card frames. v3 adds an eight-icon atlas, two four-frame friendly summon animations and a four-frame ranged caster atlas. Moon orbit collision and rendering share body center/radius/speed geometry. Fast projectiles use swept collision. Rain, pulse zones, burn, dash trails, meteor warnings, lightning links and beams render their actual combat coordinates. Weapon branches change simulation behavior. Weapon previews use the original hero and enemy assets.

## Validation

Run node tests/core.test.mjs for 18 focused regression checks and node tests/balance.test.mjs for three complete standard-difficulty simulations with different three-weapon builds and victory assertions. These cover all eight weapons and sixteen routes, slot limits, branch persistence, reroll/skip/exclusion budgets, projectile/orbit hit geometry, both difficulty damage paths, distinct attack entities, passives, schema-one migration, terminal states and XP preservation. Simulated victories establish reachability, not human balance acceptance.

Browser QA covers desktop and a 390x844 viewport, starter/difficulty selection, choice preview rendering, reroll/exclusion counters, branch resume/selection, summons/new attacks, movement/dash, and save/reload. Late-game fixtures are local-only and are not deployed. Physical Android/iPhone touch, audio and sustained performance remain unverified.
