import assert from 'node:assert/strict';
import {UNITS,UNIT_BRANCHES} from '../games/fairytale-defense/rebuild/army.mjs';
import {createPractice,beginPractice,tickPractice} from '../games/fairytale-defense/rebuild/practice-model.mjs';
import {advancedMotionAssets} from '../games/fairytale-defense/rebuild/advanced-motion.mjs';
import {unitArt} from '../games/fairytale-defense/rebuild/unit-presentation.mjs';
for(const id of Object.keys(UNITS))for(const level of [1,3,5,7,10])for(const b of UNIT_BRANCHES[id]){
 const config={id,level,branch:b.id},before=JSON.stringify(config),s=createPractice(config);assert.equal(JSON.stringify(config),before);assert.equal(s.hero,null);assert.equal(s.towers[0].level,level);assert.equal(advancedMotionAssets(unitArt(s.towers[0])).length,2);assert.equal(beginPractice(s),true);assert.equal(beginPractice(s),false);
 for(let i=0;i<1500;i++)tickPractice(s,1/60);assert.equal(s.practice.ended,true);assert.equal(s.paused,true);assert.ok(Number.isFinite(s.time));if(id!=='artisan')assert.ok(s.towers[0].attacks>0,id+' '+level+' never attacks');else assert.ok(s.events.some(e=>e.type==='supply'),'artisan never supplies');
}
for(const target of ['single','group','armor','air']){const s=createPractice({id:'firefly',target});beginPractice(s);assert.equal(s.queue.length,target==='group'?8:1);tickPractice(s,1/60);assert.equal(s.enemies[0].maxHp,600);assert.equal(s.enemies[0].air,target==='air');}
const paused=createPractice({id:'archer'});beginPractice(paused);paused.paused=true;tickPractice(paused,1);assert.equal(paused.time,0);
assert.throws(()=>createPractice({id:'archer',level:3}));assert.throws(()=>createPractice({id:'archer',level:11}));
console.log('PASS all 17 troops, two branches and five evolution tiers in isolated practice; real attacks, supply, four targets, pause and validated configuration.');
