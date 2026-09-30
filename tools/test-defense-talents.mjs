import assert from 'node:assert/strict';
import {heroBuild,HERO_TALENTS,activeModifiers,heroRange} from '../games/fairytale-defense/rebuild/hero-rules.mjs';
import {HERO_IDS,MASTERY_THRESHOLDS} from '../games/fairytale-defense/rebuild/mastery.mjs';
import {createBattle,advance,castHero,PATH_LENGTH} from '../games/fairytale-defense/rebuild/core.mjs';
import {captureCheckpoint,restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
for(const role of HERO_IDS)for(const [slot,tier] of Object.entries(HERO_TALENTS))for(const choice of tier.choices){const xp=MASTERY_THRESHOLDS[tier.level-1];assert.throws(()=>heroBuild(role,xp-1,null,{[slot]:choice.id}));const s=createBattle({hero:role,masteryXp:xp,talents:{[slot]:choice.id}});assert.equal(s.hero.talents[slot],choice.id);assert.deepEqual(captureCheckpoint(restoreCheckpoint(captureCheckpoint(s))),captureCheckpoint(s));}
for(const talents of [{unknown:'x'},{passive:'bad'},[],null])assert.throws(()=>heroBuild('growth',2000,null,talents));
const old=captureCheckpoint(createBattle({hero:'growth'}));delete old.hero.talents;assert.deepEqual(restoreCheckpoint(old).hero.talents,{passive:null,active:null,ultimate:null});
assert.equal(heroRange(heroBuild('growth',480,null,{passive:'reach'}),145),180);
function battle(talents){const s=createBattle({hero:'dream',masteryXp:2000,talents});s.phase='battle';s.hero.ready=999;s.queue=[{at:999,kind:'walker'}];s.enemies=[{id:77,kind:'walker',hp:1000,maxHp:1000,speed:0,slow:1,distance:100,armor:0}];return s;}
for(const active of ['swift','lasting']){const s=battle({active});assert(castHero(s));assert.equal(s.hero.skillReady,activeModifiers(s.hero).cooldown);assert.equal(s.shots[0].damage,76*activeModifiers(s.hero).damage);}
const rescue=battle({ultimate:'guardian'});rescue.hp=1;rescue.enemies[0].distance=PATH_LENGTH;rescue.enemies[0].leak=2;advance(rescue,1/60);assert.equal(rescue.hp,1);assert(rescue.hero.guardianUsed);rescue.enemies=[{id:78,kind:'walker',hp:100,speed:0,slow:1,distance:PATH_LENGTH,leak:1}];advance(rescue,1/60);assert.equal(rescue.phase,'defeat');assert.equal(rescue.events.filter(e=>e.type==='hero-rescue').length,1);
const boss=battle({ultimate:'resolve'});boss.enemies[0].kind='boss';boss.shots=[{hero:true,targetId:77,damage:100,arriveAt:0,kind:'star'}];advance(boss,1/60);assert.equal(boss.enemies[0].hp,875);
console.log('PASS: all 60 hero/talent unlock boundaries and save roundtrips, invalid selections, old checkpoint defaults, range, active tradeoffs, once-per-wave rescue and boss damage.');
