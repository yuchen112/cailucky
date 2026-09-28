import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,reduce,validateProfile} from '../engine.mjs';
import {GAMES} from '../rules.mjs';
import * as Store from '../storage.mjs';

for(const game of Object.keys(GAMES))test(`${game}: confirmed exit unlocks another game without inventing a result`,()=>{
 const original=reduce(createProfile(),{type:'open',id:`switch-${game}`,game});
 const stats=structuredClone(original.stats);
 const p=reduce(original,{type:'closeTable',tableId:original.table.id});
 assert.equal(p.table,null);
 assert.equal(p.wallet,original.wallet+original.table.players[0].chips);
 assert.deepEqual(p.stats,stats);
 assert.ok(original.table,'input state is not mutated');
 assert.throws(()=>reduce(p,{type:'closeTable',tableId:original.table.id}));
 const next=reduce(p,{type:'open',id:`new-${game}-table`,game:game==='big2'?'sevens':'big2'});
 assert.equal(next.wallet,p.wallet-500);
 validateProfile(JSON.parse(JSON.stringify(next)));
 assert.throws(()=>reduce(next,{type:'closeTable',tableId:original.table.id}),'stale confirmation cannot close new table');
});

test('exit returns actual post-settlement chips once, not the original buy-in',()=>{
 let p=reduce(createProfile(),{type:'open',id:'settled-switch',game:'highlow'});
 p=reduce(p,{type:'bet',seat:0,amount:10});
 const chips=p.table.players[0].chips,stats=structuredClone(p.stats);
 const out=reduce(p,{type:'closeTable',tableId:p.table.id});
 assert.equal(out.wallet,p.wallet+chips);
 assert.deepEqual(out.stats,stats);
 assert.equal(out.ledger.filter(x=>x.id==='settled-switch:exit').length,1);
});

test('confirmed exit persists, keeps a backup of the previous table, and survives reload',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const p=Store.commit(createProfile(),{type:'open',id:'persistent-switch',game:'blackjack'},storage);
 const out=Store.commit(p,{type:'closeTable',tableId:p.table.id},storage);
 assert.deepEqual(Store.readProfile(storage),out);
 assert.equal(JSON.parse(storage.getItem(Store.KEY+'.previous')).table.id,p.table.id);
 assert.throws(()=>Store.commit(p,{type:'closeTable',tableId:p.table.id},storage),'stale tab cannot duplicate the return');
 const failed={getItem:k=>storage.getItem(k),setItem:()=>{throw Error('quota');}};
 const active=Store.commit(out,{type:'open',id:'failed-switch-table',game:'sevens'},storage);
 assert.throws(()=>Store.commit(active,{type:'closeTable',tableId:active.table.id},failed));
 assert.equal(Store.readProfile(storage).table.id,active.table.id);
});
