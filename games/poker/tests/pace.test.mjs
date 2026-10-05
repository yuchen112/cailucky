import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,reduce,autoAction,validateProfile} from '../engine.mjs';
const open=()=>reduce(createProfile(),{type:'open',game:'dragon',id:'pace-table'});
test('dragon: five complete rounds give the player five turns, no computer-only results',()=>{
 let p=open();for(let round=1;round<=5;round++){
  assert.equal(p.table.turn,0);assert.equal(p.table.round,round);
  for(let seat=0;seat<4;seat++){
   assert.equal(p.table.turn,seat);p=reduce(p,{type:'pass',seat});
   p=validateProfile(JSON.parse(JSON.stringify(p)));
   if(seat<3){assert.equal(p.table.result,null);assert.equal(p.table.phase,'playing');assert.equal(p.stats.dragon?.rounds||0,round-1);p=reduce(p,autoAction(p.table));assert.equal(p.table.phase,'betting');}
  }
  assert.equal(p.table.dragonTurns.length,4);assert.equal(p.stats.dragon.rounds,round);
  assert.equal(p.table.phase,round===5?'tableEnd':'roundEnd');
  assert.equal(p.table.result.deltas[0],0);if(round<5)p=reduce(p,{type:'next'});
 }
});
test('dragon: human reveal retained, bank balances settled once, resumable between turns',()=>{
 let p=open();const before=p.table.players[0].chips;
 p=reduce(p,{type:'bet',seat:0,amount:10});const shot=structuredClone(p.table.dragonTurns[0]);
 assert.equal(shot.cards.length,3);assert.equal(p.table.players[0].chips-before,shot.delta);
 for(let seat=1;seat<4;seat++){p=reduce(p,autoAction(p.table));p=validateProfile(JSON.parse(JSON.stringify(p)));p=reduce(p,{type:'pass',seat});}
 assert.deepEqual(p.table.dragonTurns[0],shot);assert.equal(p.table.result.deltas[0],shot.delta);
 assert.throws(()=>reduce(p,{type:'pass',seat:3}));assert.equal(p.stats.dragon.rounds,1);
});
test('dragon: legacy active computer seat reaches player before whole-round result',()=>{
 let p=open();delete p.table.dragonTurns;p.table.turn=2;
 for(const seat of [2,3,0,1]){p=reduce(p,{type:'pass',seat});if(seat!==1){assert.equal(p.table.result,null);p=reduce(p,autoAction(p.table));}}
 assert.equal(p.table.phase,'roundEnd');assert(p.table.dragonTurns.some(x=>x.seat===0));
 assert.throws(()=>{const q=structuredClone(p);q.table.dragonTurns.push(q.table.dragonTurns[0]);validateProfile(q);});
});
