import assert from'node:assert/strict';
import{ARENA_BOUNDS,createExpedition,step,spawnMonster}from'../expedition-core.mjs';
for(const sign of[-1,1]){const g=createExpedition();g.spawn=999;g.hazardAt=999;g.player.x=sign*ARENA_BOUNDS.x;g.player.y=sign*ARENA_BOUNDS.y;g.time=20;step(g,.05,{x:sign,y:sign},()=>sign>0?0:.5);assert.equal(g.player.x,sign*ARENA_BOUNDS.x);assert.equal(g.player.y,sign*ARENA_BOUNDS.y);assert.ok(g.gems.filter(x=>x.kind==='objective').every(x=>Math.abs(x.x)<=940&&Math.abs(x.y)<=540));const e=spawnMonster(g,0,()=>.1,{x:9000,y:-9000});assert.ok(Math.abs(e.x)<=ARENA_BOUNDS.spawnX&&Math.abs(e.y)<=ARENA_BOUNDS.spawnY)}
console.log('PASS arena movement boundaries, accessible objectives and enemy approach margins');
