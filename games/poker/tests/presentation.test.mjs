import test from 'node:test';
import assert from 'node:assert/strict';
import {handLayout,cardFlight,animateTable,playPosePath,warmPlayPose} from '../presentation.mjs';
test('pose preloader reuses decoded images and allows failed requests to retry',async()=>{
 const saved=Object.getOwnPropertyDescriptor(globalThis,'Image');let attempts=0;
 try{
  globalThis.Image=class{set src(value){attempts++;queueMicrotask(()=>value==='test-failure'?this.onerror():this.onload());}};
  const first=warmPlayPose('test-success');
  assert.equal(first,warmPlayPose('test-success'));
  assert.equal(await first,true);assert.equal(attempts,1);
  assert.equal(await warmPlayPose('test-failure'),false);
  assert.equal(await warmPlayPose('test-failure'),false);
  assert.equal(attempts,3);
 }finally{if(saved)Object.defineProperty(globalThis,'Image',saved);else delete globalThis.Image;}
});
test('only individually produced role poses are used; unsupported roles keep their original art',()=>{
 for(const role of ['luck','dream','growth','joy'])assert.equal(playPosePath(`art/seat-${role}.webp`),`art/seat-${role}-play-v1.webp`);
 assert.equal(playPosePath('art/seat-night.webp'),null);
 assert.equal(playPosePath('art/seat-luck-win.webp'),null);
 assert.equal(playPosePath(''),null);
});
test('all hand cards stay within mobile widths, including 26-card stress case',()=>{
 for(const width of [220,320,420,520,690,1000])for(let count=1;count<=26;count++){
  const l=handLayout(width,count,72,108);
  assert.equal(l.positions.length,count);
  for(const p of l.positions){
   assert.ok(p.x>=0);assert.ok(p.x+p.width<=width+0.001);
   assert.ok(p.y>=16);assert.ok(p.y+108<=l.height);
  }
 }
});
test('normal 13-card phone hand is a single readable row',()=>{
 const l=handLayout(500,13,60,90);
 assert.ok(l.positions.every(p=>p.y===20));
 assert.ok(l.positions[1].x-l.positions[0].x>=28);
 assert.equal(l.positions[12].width,60);
});
test('card flights start at the source centre and settle exactly on the target',()=>{
 for(const origin of [{x:0,y:0,width:40,height:60},{x:750,y:200,width:30,height:45}]){
  const target={x:300,y:180,width:60,height:90};
  const frames=cardFlight(origin,target);
  assert.equal(frames[0].translate,`${origin.x+origin.width/2-330}px ${origin.y+origin.height/2-225}px`);
  assert.equal(frames.at(-1).translate,'0 0');
  assert.equal(frames.at(-1).scale,1);
  assert.ok(frames.every(f=>!JSON.stringify(f).includes('NaN')));
 }
});
test('stationary cards do not take an unnecessary arc; reveal settles face-up',()=>{
 const rect={x:10,y:20,width:40,height:60};
 const frames=cardFlight(rect,rect,{flip:true});
 assert.equal(frames[1].translate,'0px 0px');
 assert.match(frames[0].transform,/85deg/);
 assert.match(frames.at(-1).transform,/0deg/);
});
test('next round re-deals an identical visible card instead of treating it as stationary',async()=>{
 const saved=Object.fromEntries(['Image','document','innerWidth','innerHeight'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const flights=[];
 const rect={x:120,y:120,width:60,height:90};
 class Sprite{
  style={};remove(){}
  animate(frames){flights.push({el:this,frames});return {finished:Promise.resolve(),cancel(){},playState:'finished'};}
 }
 try{
  globalThis.Image=Sprite;
  globalThis.document={body:{append(){}}};
  globalThis.innerWidth=800;globalThis.innerHeight=360;
  const card=new Sprite();card.dataset={face:'H3'};card.getBoundingClientRect=()=>rect;card.closest=()=>true;
  const root={querySelector:()=>null,querySelectorAll:s=>s==='.hand .card,.play-area .card'?[card]:[]};
  const before={cards:[{key:'H3',rect,zone:'hand'}],seats:[]};
  await animateTable(root,before,{type:'next'},{fast:false,reduced:false});
  assert.equal(flights.filter(f=>f.el===card).length,1);
  assert.notEqual(flights.find(f=>f.el===card).frames[0].translate,'0 0');
  flights.length=0;
  await animateTable(root,before,{type:'next'},{reduced:true});
  assert.equal(flights.length,0,'reduced motion bypasses all effects');
 }finally{
  for(const [key,descriptor] of Object.entries(saved))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
 }
});
