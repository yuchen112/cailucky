import assert from 'node:assert/strict';
import {ROLES,SPECIALIZATIONS,createBattle,deploy,upgrade,sell,towerStats,startWave,advance,setPriority,chooseBlessing,wavePreview,newProfile,PATH_LENGTH} from '../games/fairytale-defense/rebuild/core.mjs';
import {captureCheckpoint,restoreCheckpoint,decodeSave} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
for(const role of Object.keys(ROLES))for(const branch of SPECIALIZATIONS[role]){
 const s=createBattle();s.gold=10000;assert(deploy(s,0,role));assert(upgrade(s,0));const before=JSON.stringify(s);assert(!upgrade(s,0));assert(!upgrade(s,0,'invalid'));assert.equal(JSON.stringify(s),before,'invalid branch consumes nothing');assert(upgrade(s,0,branch.id));assert.equal(s.towers[0].branch,branch.id);
 assert(upgrade(s,0));assert(upgrade(s,0));assert(!upgrade(s,0));const r=towerStats(s.towers[0],s);assert(r.damage>0&&r.interval>0&&r.range>0&&Number.isFinite(r.damage));
 const c=captureCheckpoint(s),restored=restoreCheckpoint(JSON.parse(JSON.stringify(c)));assert.deepEqual(captureCheckpoint(restored),c);assert.deepEqual(towerStats(restored.towers[0],restored),r);
 const gold=s.gold;assert(sell(s,0));assert.equal(s.gold-gold,Math.floor((ROLES[role].cost+800)*70/100));
}
const s=createBattle();deploy(s,0,'growth');const cp=captureCheckpoint(s);startWave(s);assert.equal(captureCheckpoint(s),null,'cannot capture transient combat');assert.equal(restoreCheckpoint(cp).phase,'planning');
const legacy=decodeSave(newProfile());assert.equal(legacy.version,2);assert.equal(legacy.checkpoint,null);assert.deepEqual(decodeSave({version:2,profile:newProfile(),checkpoint:cp}).checkpoint,cp);
for(const patch of [{gold:Infinity},{hp:0},{stage:0},{wave:6},{towers:[{...cp.towers[0],level:3,branch:null}]},{towers:[{...cp.towers[0],spent:1}]},{blessingChoices:['__proto__']},{towers:[cp.towers[0],cp.towers[0]]}])assert.throws(()=>restoreCheckpoint({...cp,...patch}));
assert.throws(()=>decodeSave({version:2,profile:newProfile(),checkpoint:{...cp,stage:2}}));
const b=createBattle();deploy(b,0,'growth');b.phase='intermission';b.wave=2;b.blessingChoices=['power','reach','supplies'];assert(!startWave(b));assert(!chooseBlessing(b,'x'));assert(chooseBlessing(b,'power'));assert(!chooseBlessing(b,'power'));assert.equal(towerStats(b.towers[0],b).damage,24*1.08);assert(startWave(b));assert.deepEqual(b.queue.reduce((o,q)=>(o[q.kind]=(o[q.kind]||0)+1,o),{}),wavePreview({...b,wave:2}));
const p=createBattle();deploy(p,0,'growth');startWave(p);p.queue=[{at:999,kind:'walker'}];p.enemies=[{id:90,hp:10,distance:50,speed:0,slow:1,armor:0},{id:91,hp:100,distance:45,speed:0,slow:1,armor:.6}];assert(setPriority(p,0,'strong'));advance(p,.25);assert.equal(p.pending[0].targetId,91);assert(!setPriority(p,0,'unknown'));
const shield=createBattle();shield.gold=1000;deploy(shield,0,'healing');upgrade(shield,0);upgrade(shield,0,'protect');startWave(shield);assert.equal(shield.shield,2);shield.queue=[{at:999,kind:'walker'}];shield.enemies=[{id:80,hp:20,distance:PATH_LENGTH-1,speed:100,slow:1,leak:3}];advance(shield,.1);assert.equal(shield.hp,19);assert.equal(shield.shield,0);
console.log('PASS: 20 specialization branches through Lv5, validated boundary saves, old-save migration, corrupted saves, non-repeatable blessings, wave preview, targeting and shield absorption.');
