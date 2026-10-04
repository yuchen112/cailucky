import assert from 'node:assert/strict';
import {createBattle,deploy,upgrade,advance,startWave,castHero,moveHero,ROLES,UNITS,UNIT_BRANCHES,towerStats} from '../games/fairytale-defense/rebuild/core.mjs';
import {captureCheckpoint,restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
import {newMastery,beginMasteryRun,awardCompletedWaves,masteryLevel,unlockedMastery,validateMastery} from '../games/fairytale-defense/rebuild/mastery.mjs';
import {newArmySave,beginArmySave,settleArmySave,decodeArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
for(const hero of Object.keys(ROLES)){
 const s=createBattle({hero});assert.equal(s.hero.role,hero);assert(!deploy(s,0,hero));assert(deploy(s,0,'archer'));assert(deploy(s,1,'archer'));assert(!deploy(s,0,'archer'));assert(!deploy(s,2,'clockwork'));
 assert.deepEqual(captureCheckpoint(restoreCheckpoint(captureCheckpoint(s))),captureCheckpoint(s));
 assert(!moveHero(s,100,200));assert(!moveHero(s,NaN,200));assert(!moveHero(s,150,200));s.time+=20;assert(!moveHero(s,150,200));assert(!moveHero(s,200,200));
 assert(startWave(s));advance(s,.1);assert(castHero(s));assert(!castHero(s));const before=JSON.stringify(s);s.paused=true;advance(s,.25);assert(!castHero(s));s.paused=false;assert.equal(JSON.stringify(s),before);
}
for(const [unit,branches] of Object.entries(UNIT_BRANCHES))for(const branch of branches){
 const loadout=[unit,...Object.keys(UNITS).filter(x=>x!==unit).slice(0,3)],s=createBattle({hero:'growth',loadout});s.gold=5000;assert(deploy(s,0,unit));assert(upgrade(s,0));assert(!upgrade(s,0,'invalid'));assert(upgrade(s,0,branch.id));assert(upgrade(s,0));assert(upgrade(s,0));assert(towerStats(s.towers[0],s).damage>0||towerStats(s.towers[0],s).income>0);assert.deepEqual(captureCheckpoint(restoreCheckpoint(captureCheckpoint(s))),captureCheckpoint(s));
}
assert.throws(()=>createBattle({hero:'unknown'}));assert.throws(()=>createBattle({hero:'growth',loadout:['archer','archer','frost','cannon']}));
const s=createBattle({hero:'growth'});deploy(s,0,'archer');const c=captureCheckpoint(s);assert.throws(()=>restoreCheckpoint({...c,hero:{role:'growth',x:Infinity,y:100}}));assert.throws(()=>restoreCheckpoint({...c,towers:[c.towers[0],c.towers[0]]}));
let m=beginMasteryRun(newMastery(),'run-1','healing');m=awardCompletedWaves(m,'run-1',2);assert.equal(m.xp.healing,20);assert.deepEqual(awardCompletedWaves(m,'run-1',2),m);assert.deepEqual(awardCompletedWaves(m,'run-1',1),m);assert.deepEqual(awardCompletedWaves(m,'run-1',3,{practice:true}),m);assert.throws(()=>awardCompletedWaves(m,'old-run',3));m=awardCompletedWaves(m,'run-1',6);assert.equal(m.xp.healing,60);assert.equal(masteryLevel(60),2);assert(unlockedMastery(160).specialization);assert(!unlockedMastery(0).specialization);assert(unlockedMastery(0).base);assert.equal(unlockedMastery(2000).level,10);assert.throws(()=>validateMastery({...m,xp:{...m.xp,healing:NaN}}));
// Stage strength does not consume profile/mastery data; fresh heroes see the same enemies.
const a=createBattle({hero:'growth',stage:3}),b=createBattle({hero:'hope',stage:3});deploy(a,0,'archer');deploy(b,0,'archer');startWave(a);startWave(b);advance(a,1/60);advance(b,1/60);assert.equal(a.enemies[0].maxHp,b.enemies[0].maxHp);
let envelope=beginArmySave(newArmySave(),s,'one');s.phase='intermission';s.wave=2;envelope=settleArmySave(envelope,s,'one');assert.equal(envelope.mastery.xp.growth,20);assert.deepEqual(decodeArmySave(JSON.stringify(envelope)),envelope);assert.deepEqual(settleArmySave(envelope,s,'one'),envelope);s.phase='defeat';s.wave=3;const lost=settleArmySave(envelope,s,'one');assert.equal(lost.mastery.xp.growth,20);assert.equal(lost.checkpoint,null);assert.throws(()=>decodeArmySave({...envelope,checkpoint:{...envelope.checkpoint,hero:{role:'hope',x:100,y:100}}}));
const combat=createBattle({hero:'growth'});combat.phase='battle';combat.hero.ready=999;combat.queue=[{at:999,kind:'walker'}];combat.enemies=[100,115,130,900].map((distance,i)=>({id:100+i,kind:'walker',distance,hp:1000,maxHp:1000,speed:0,slow:1,armor:.5}));
combat.shots=[{targetId:100,damage:100,bounces:2,arriveAt:0,kind:'wind'}];advance(combat,1/60);assert.deepEqual(combat.enemies.map(e=>e.hp),[950,960,968,1000]);
combat.shots=[{targetId:100,damage:0,shred:.2,arriveAt:0,kind:'crystal'}];advance(combat,1/60);combat.shots=[{targetId:100,damage:100,arriveAt:0,kind:'bolt'}];advance(combat,1/60);assert.equal(combat.enemies[0].hp,880,'armor shred affects follow-up damage');
console.log('PASS: ten open heroes, one hero slot, repeated troops, loadout limits, sixteen unit branches, boundary roundtrip, skill cooldown/pause, mastery anti-duplicate, atomic save envelope, fixed stage strength, chain falloff and armor shred.');
