import assert from 'node:assert/strict';
import {fresh,validate,pack,unpack} from '../games/lucky-town/store.mjs';
import {roll,toyReroll} from '../games/lucky-town/slots.mjs';
import {MACHINES,ROLES} from '../games/lucky-town/data.mjs';
import {canPlace,move} from '../games/lucky-town/room.mjs';
const s=fresh();assert.equal(validate(s),true);assert.equal(ROLES.length,10);assert.equal(Object.keys(s.rooms).length,10);assert.deepEqual(unpack(pack(s)),s);
for(const change of [s=>s.coins=-1,s=>s.rooms.joy.items.push({...s.rooms.joy.items[0]}),s=>s.rooms.joy.items[0].x=6,s=>s.outfits.joy.suit='outfit-dream',s=>s.owned.fake=1]){const b=structuredClone(s);change(b);assert.throws(()=>validate(b))}
const envelope=JSON.parse(pack(s));envelope.payload=envelope.payload.replace('1000','9999');assert.throws(()=>unpack(JSON.stringify(envelope)));
const decorated=structuredClone(s);decorated.owned.table=1;decorated.owned.tea=1;const table={uid:'table-1',item:'table',x:3,y:4,flip:false},tea={uid:'tea-1',item:'tea',x:3,y:4,flip:false,onTop:'table-1'};decorated.rooms.joy.items.push(table,tea);assert.equal(validate(decorated),true);assert.equal(canPlace(decorated.rooms.joy,tea),true);move(decorated.rooms.joy,table,{x:2,y:4});assert.equal(tea.x,2);assert.equal(validate(decorated),true);const badTable=structuredClone(decorated);badTable.rooms.joy.items.find(p=>p.uid==='tea-1').onTop='absent';assert.throws(()=>validate(badTable));
for(const m of MACHINES){const p=roll(m.id,s.progress,()=>0);assert.equal(p.grid.length,m.rows);assert.equal(p.grid[0].length,m.cols);assert.equal(p.phase,m.id==='toy'?'choice':'ready');const test=structuredClone(s);test.pending=p;assert.equal(validate(test),true)}
const classic=roll('classic',s.progress,()=>0);assert.equal(classic.win,200);
const moon=roll('moon',s.progress,()=>1.1/6);assert.equal(moon.frames.length,3);assert.equal(moon.win,90);
const garden=roll('garden',{garden:17,photo:0},()=>3.1/6);assert.equal(garden.garden,11);assert.ok(garden.win>=45);
const photo=roll('photo',{garden:0,photo:11},()=>4.1/6);assert.equal(photo.photo,4);assert.ok(photo.win>=50);
const toy=roll('toy',s.progress,()=>0),rerolled=toyReroll(toy,1,()=>.9);assert.equal(rerolled.grid[0][1],0);assert.equal(rerolled.phase,'ready');assert.throws(()=>toyReroll(rerolled,1));assert.throws(()=>toyReroll(toy,8));
let seed=87;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const balance=[];
for(const m of MACHINES){let progress={garden:0,photo:0},won=0;for(let i=0;i<30000;i++){let p=roll(m.id,progress,rng);if(m.id==='toy'){const row=p.grid[0],k=row.findIndex(v=>row.filter(x=>x===v).length===2);p=toyReroll(p,k<0?0:k,rng)}won+=p.win;progress={garden:p.garden,photo:p.photo}}balance.push({machine:m.id,returnRate:+(won/(30000*m.cost)).toFixed(3)})}
console.log('Core save validation, integrity, 10 independent roles, 6 slot rules, progress and toy choice passed.');console.log(JSON.stringify(balance));
