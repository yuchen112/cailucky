import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,reduce} from '../engine.mjs';
import {selectionFeedback} from '../selection.mjs';
import * as R from '../rules.mjs';
function fixture(game,seed=1){
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const p=reduce(createProfile(),{type:'open',id:'feedback-'+game,game},random);
 p.table.turn=0;p.table.rules.c3=false;return p;
}
test('selection preview does not mutate or save state, and uses actual engine validation',()=>{
 const p=fixture('big2'),before=JSON.stringify(p),hand=p.table.players[0].hand;
 assert.equal(selectionFeedback(p,[]).ok,false);
 const f=selectionFeedback(p,[hand[0]]);
 assert.equal(f.ok,true);
 assert.equal(reduce(p,f.action).table.players[0].hand.length,12);
 const different=hand.find(c=>R.card(c).r!==R.card(hand[0]).r);
 assert.equal(selectionFeedback(p,[hand[0],different]).ok,false);
 assert.match(selectionFeedback(p,[hand[0],different]).message,/同點數/);
 assert.equal(JSON.stringify(p),before);
});
test('out-of-turn cards and unsupported games cannot be submitted via preview',()=>{
 const p=fixture('big2');p.table.turn=1;
 assert.equal(selectionFeedback(p,[p.table.players[0].hand[0]]).ok,false);
 assert.equal(selectionFeedback(fixture('blackjack'),[]),null);
});
test('sevens first move must be H7, not just any seven',()=>{
 const p=fixture('sevens');
 for(const c of p.table.players[0].hand){
  assert.equal(selectionFeedback(p,[c]).ok,c==='H7');
 }
});
for(const count of [0,1,2])test(`red point ${count} matching targets: preview and submitted target agree`,()=>{
 let found=false;
 for(let seed=1;seed<=500&&!found;seed++){
  const p=fixture('redpoint',seed);
  for(const c of p.table.players[0].hand){
   const matches=p.table.board.filter(x=>R.redMatch(c,x));
   if((count===2?matches.length>=2:matches.length===count)){
    const before=JSON.stringify(p),f=selectionFeedback(p,[c]);
    assert.equal(f.ok,count<2);
    if(count===1)assert.equal(f.action.target,matches[0]);
    if(count===2){
     const chosen=selectionFeedback(p,[c],matches[1]);
     assert.equal(chosen.ok,true);assert.equal(chosen.action.target,matches[1]);
     assert.doesNotThrow(()=>reduce(p,chosen.action));
    }
    assert.equal(JSON.stringify(p),before);found=true;break;
   }
  }
 }
 assert.ok(found,'deterministic fixture exists');
});
