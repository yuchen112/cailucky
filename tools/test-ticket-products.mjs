import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TICKET_CATALOG,makeProductTicket,productReward,validateProductTicket,productLayout} from '../games/lucky-town/ticket-catalog.mjs';
import {fresh,pack,unpack} from '../games/lucky-town/store.mjs';
import {makeTicket,buyTicket,saveScratch,settleTicket,ticketName,ticketLayout} from '../games/lucky-town/scratch.mjs';
let seed=1729;const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
assert.equal(TICKET_CATALOG.length,10);assert.equal(new Set(TICKET_CATALOG.map(t=>t.mode)).size,10);
for(const p of TICKET_CATALOG){assert(fs.existsSync(new URL('../games/lucky-town/'+p.art,import.meta.url)));assert.throws(()=>makeProductTicket(p.id,p.cost+1,rng));for(let i=0;i<1000;i++){const t=makeTicket(p.id,p.cost,rng);validateProductTicket(t);const s=fresh();s.scratch=t;assert.deepEqual(unpack(pack(s)).scratch,t);assert.equal(productReward(t),t.win);assert.equal(ticketName(t),p.name);assert.equal(ticketLayout(t).length,t.values.length);const layout=productLayout(t);for(const r of layout)assert(r.x>=.05&&r.y>=.2&&r.x+r.w<=.95&&r.y+r.h<=.95);for(let a=0;a<layout.length;a++)for(let b=a+1;b<layout.length;b++){const x=layout[a],y=layout[b];assert(!(x.x<y.x+y.w&&x.x+x.w>y.x&&x.y<y.y+y.h&&x.y+x.h>y.y),'overlapping scratch zones');}const bad=structuredClone(t);bad.win++;assert.throws(()=>validateProductTicket(bad));}}
function example(id,values,prizes=[],lucky=[]){const p=TICKET_CATALOG.find(t=>t.id===id),t=makeProductTicket(id,p.cost,rng);t.values=values;t.prizes=prizes.length?prizes:Array(values.length).fill(0);t.lucky=lucky;return productReward(t);}
assert.equal(example('trio20',[0,0,0,1,1,2]),200);
assert.equal(example('trio20',[2,2,2,5,5,5]),80);
assert.equal(example('coins20',[1,0,1,0,0,0],[10,50,20,50,50,50]),30);
assert.equal(example('numbers50',[1,2,3,4,5,6,7,8],[25,50,100,100,100,100,100,500],[2,8]),550);
assert.equal(example('keys50',[1,1,0,2,1,1,1,2],[0,0,0,500,0,0,0,50]),50);
assert.equal(example('garden100',[1,1,1,1,1,0,0,0,0,0,0,0]),200);
assert.equal(example('bags100',[0,0,0,0,0,3],[0,10,20,50,100,0]),540);
assert.equal(example('bingo200',Array.from({length:16},(_,i)=>i+1),[],[1,2,3,4,5,6,7,8,19,20]),800);
assert.equal(example('trail200',[1,1,0,1,1,1,1,1,1,1]),1100);
assert.equal(example('vault500',[4,4,0,7,3,0,2,8,0],[0,0,5000,0,0,200,0,0,5000]),200);
assert.equal(example('stars500',[1,2,1,3,1,0,0,0,0,2,4,4,4,4,4]),7000);
const maximumCases=[
 ['trio20',Array(6).fill(0),[],[]],['coins20',Array(6).fill(1),Array(6).fill(50),[]],
 ['numbers50',[1,2,3,4,5,6,7,8],Array(8).fill(500),[1,2]],['keys50',[1,1,1,2,1,1,1,2],[0,0,0,500,0,0,0,500],[]],
 ['garden100',Array(12).fill(1),[],[]],['bags100',[0,0,0,0,0,5],[100,100,100,100,100,0],[]],
 ['bingo200',Array.from({length:16},(_,i)=>i+1),[],[1,2,3,4,13,14,15,16,6,11]],['trail200',Array(10).fill(1),[],[]],
 ['vault500',[9,1,0,9,1,0,9,1,0],[0,0,5000,0,0,5000,0,0,5000],[]],['stars500',Array(15).fill(0),[],[]]
];for(const [id,values,prizes,lucky] of maximumCases)assert.equal(example(id,values,prizes,lucky),TICKET_CATALOG.find(p=>p.id===id).max,'advertised maximum must be reachable');
// Purchase, partial scratch, reload, premature collection, complete and collect once.
let state=fresh();const store={get:()=>state,async change(fn){const draft=structuredClone(state);fn(draft);unpack(pack(draft));state=draft;}};
await buyTicket(store,'numbers50',50);assert.equal(state.coins,950);await assert.rejects(()=>buyTicket(store,'coins20',20));const id=state.scratch.id,win=state.scratch.win;
await saveScratch(store,id,[Array.from({length:100},(_,i)=>i),...Array.from({length:7},()=>[])]);state=unpack(pack(state));assert.equal(state.scratch.marks[0].length,100);await assert.rejects(()=>settleTicket(store,id));await saveScratch(store,id,state.scratch.marks,true);await settleTicket(store,id);assert.equal(state.coins,950+win);assert.equal(state.scratch,null);await assert.rejects(()=>settleTicket(store,id));
// Legacy purchased tickets retain their original representation and winnings.
for(const kind of ['match','number','home','treasure','coinlines','flowers','multiplier','bingo'])for(const cost of [20,100,500]){const s=fresh();s.scratch=makeTicket(kind,cost,rng);assert.deepEqual(unpack(pack(s)).scratch,s.scratch);}
// Older tabs may continue writing v4 with higher revisions. New protected data wins.
const oldStorage=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const protectedStore=await import('../games/lucky-town/store.mjs?product-save-test');const old=fresh();old.revision=42;old.coins=12345;old.scratch=makeTicket('number',100,rng);storage.set(protectedStore.KEY+'-collection-v4',pack(old));await protectedStore.init();assert.equal(protectedStore.get().coins,12345);assert.deepEqual(protectedStore.get().scratch,old.scratch);assert(storage.has(protectedStore.CANONICAL));
await protectedStore.change(s=>{s.scratch=makeTicket('vault500',500,rng);});const current=protectedStore.get();old.revision=999999;old.coins=1;storage.set(protectedStore.KEY+'-collection-v4',pack(old));storage.set(protectedStore.KEY,pack(old));await protectedStore.sync();assert.deepEqual(protectedStore.get().scratch,current.scratch);const reopened=await import('../games/lucky-town/store.mjs?product-save-reopen');await reopened.init();assert.equal(reopened.get().coins,12345);assert.deepEqual(reopened.get().scratch,current.scratch);globalThis.localStorage=oldStorage;
console.log('PASS: 10 distinct products, 10000 ticket/save checks, hand-calculated award cases, non-overlapping layouts, purchase/scratch/reload/collection, 24 legacy tickets');
