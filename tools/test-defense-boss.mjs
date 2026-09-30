import assert from 'node:assert/strict';
import {createBattle,advance,pointAt} from '../games/fairytale-defense/rebuild/core.mjs';
const s=createBattle();s.phase='battle';s.queue=[{at:999,kind:'walker'}];
s.enemies=[{id:1,kind:'boss',hp:1000,maxHp:1000,speed:21,distance:100,slow:1,armor:.2,nextSkill:0},
{id:2,kind:'walker',hp:100,maxHp:100,speed:0,distance:110,slow:1,armor:0},
{id:3,kind:'walker',hp:100,maxHp:100,speed:0,distance:650,slow:1,armor:0}];
advance(s,.1);assert(s.events.some(e=>e.type==='boss-warning'));assert.equal(s.enemies[0].distance,100);
const before=JSON.stringify(s);s.paused=true;advance(s,.25);s.paused=false;assert.equal(JSON.stringify(s),before);
for(let i=0;i<5;i++)advance(s,.25);
assert(s.events.some(e=>e.type==='boss-ward'));assert(s.enemies[1].wardUntil>s.time);assert(!s.enemies[2].wardUntil);
function impact(pierce){s.shots=[{targetId:2,damage:20,pierce,kind:'seed',arriveAt:s.time}];advance(s,1/60);}
impact(false);assert.equal(s.enemies[1].hp,85);impact(true);assert.equal(s.enemies[1].hp,65);
for(let i=0;i<13;i++)advance(s,.25);impact(false);assert.equal(s.enemies[1].hp,45,'ward expires');
assert(s.enemies[0].distance>100);assert(Number.isFinite(pointAt(s.enemies[0].distance).x));
console.log('PASS: boss telegraph stops movement, pause freezes cast, local ward, pierce bypass and timed expiration.');
