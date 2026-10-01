import assert from 'node:assert/strict';
import {newCollection,recruit,recruitBatch} from '../games/fairytale-defense/rebuild/recruitment.mjs';
import {createBattleClock} from '../games/fairytale-defense/rebuild/battle-clock.mjs';
import {createBattle,deploy,startWave,advance} from '../games/fairytale-defense/rebuild/core.mjs';
const source={...newCollection(),coins:2000,total:29,sincePrism:29,sinceGold:9},before=JSON.stringify(source);
const batch=recruitBatch(source,10,()=>0);let sequential=source;for(let i=0;i<10;i++)sequential=recruit(sequential,()=>0).collection;
assert.deepEqual({...batch.collection,lastBatch:null},sequential);assert.deepEqual(batch.collection.lastBatch,{first:30,count:10});assert.equal(batch.results.length,10);assert.equal(batch.results[0].grade,'prism');assert.equal(JSON.stringify(source),before);
assert.throws(()=>recruitBatch({...source,coins:999},10),/星露不足/);assert.throws(()=>recruitBatch(source,2));
let calls=0;assert.throws(()=>recruitBatch(source,10,()=>{if(++calls===7)throw Error('rng');return 0;}));assert.equal(JSON.stringify(source),before);
const outcomes=[];for(const speed of [1,2,3]){const c=createBattleClock(),s=createBattle({hero:'growth'});deploy(s,0,'archer');startWave(s);c.setSpeed(speed);for(let i=0;i<1800/speed;i++)c.tick(1/60,false,dt=>advance(s,dt));outcomes.push(s);const t=s.time;c.tick(4,false,dt=>advance(s,dt));c.tick(.1,true,dt=>advance(s,dt));assert.equal(s.time,t);c.reset();assert.equal(c.speed,1);}
assert.deepEqual(outcomes[0],outcomes[1]);assert.deepEqual(outcomes[1],outcomes[2]);
console.log('PASS atomic batch, pity sequence, insufficient balance, failed batch immutability, 1x/2x/3x deterministic battle and hidden-tab gap.');
