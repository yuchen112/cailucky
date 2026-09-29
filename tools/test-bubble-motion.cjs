const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../games/magic-bubble/motion-core.js');
for(const fall of [false,true]){
 const e={x:180,y:240,born:100,fall};
 assert.equal(M.sample(e,50).alpha,1,'delayed effects preserve the original ball');
 assert.equal(M.sample(e,50).y,240);
 assert.equal(M.sample(e,100+M.lifetime(e)).done,true);
 for(let clock=0;clock<1200;clock+=10){const s=M.sample(e,clock);assert(s.alpha>=0&&s.alpha<=1);assert(s.burst>=0&&s.burst<=1);assert(Number.isFinite(s.x+s.y+s.scale));}
 assert.equal(M.sample(e,150,true).y,240,'reduced motion has no falling displacement');
}
assert.equal(M.popDelay({x:0,y:0},{x:0,y:0}),100);
assert.equal(M.popDelay({x:0,y:0},{x:9999,y:9999}),240);
assert.equal(M.popDelay({x:0,y:0},{x:9999,y:9999},true),0);
const from={x:5,y:8},to={x:56,y:107};
assert.equal(M.dock(from,to,0).x,5);assert.equal(M.dock(from,to,160).y,107);
assert.equal(M.dock(from,to,0,true).done,true);
let paused=false,reduced=false;
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{style:{},dataset:{},hidden:true,previousElementSibling:{},append(){},setAttribute(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:720,height:820})});return elements.get(id);}
const ctx=new Proxy({},{get:()=>()=>{}}),canvas=el('#game');canvas.width=720;canvas.height=820;canvas.getContext=()=>ctx;canvas.parentElement={clientWidth:720,clientHeight:820};
const context={BubbleMotion:M,BubbleEndless:require('../games/magic-bubble/endless-core.js'),Image:class{naturalWidth=100},Set,Math,Number,Array,Object,console,innerHeight:360,innerWidth:800,requestAnimationFrame(){},addEventListener(){},setTimeout(){},clearTimeout(){},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),CxQ:{read:(k,v)=>v,write(){},configure(){},sound(){}},document:{querySelector:s=>s==='.game-entry:not([hidden])'?null:el(s),createElement:()=>el('button'),body:{classList:{contains:()=>reduced}}},window:{CxQSession:{blocked:()=>paused}}};
let source=fs.readFileSync('games/magic-bubble/game.js','utf8');
source=source.replace('fit();reset();requestAnimationFrame(frame);',`fit();reset();globalThis.qa={place,frame,draw,reset,locked,check,setMode:v=>mode=v,state:()=>({clock,settleUntil,advanceAt,descending,score,shots,turns,effects,grid,pending,over}),seed(){reset();grid=Array.from({length:10},()=>Array(9).fill(-1));grid[0][0]=0;grid[1][0]=0;grid[2][1]=1;grid[0][8]=2;ball=0;flight={x:55,y:160};}};`);
context.CxQOrbArt=require('../games/shared/orb-art.js');
vm.runInNewContext(fs.readFileSync('games/magic-bubble/art-orbs-v2/geometry.js','utf8'),context);
vm.runInNewContext(source,context);const Q=context.qa;
Q.seed();Q.place([2,0]);let s=Q.state();
assert.equal(s.score,600,'three matched balls plus one unsupported ball');assert.equal(s.effects.length,4);assert(Q.locked());
const fall=s.effects.find(e=>e.fall),pops=s.effects.filter(e=>!e.fall);
assert(fall.born>Math.max(...pops.map(e=>e.born)),'unsupported balls fall only after the removal wave');
assert(s.settleUntil>=fall.born+680);
canvas.onpointerdown({preventDefault(){},pointerId:1,clientX:360,clientY:300});canvas.onpointerup({clientX:360,clientY:300});assert.equal(Q.state().shots,s.shots,'repeated input cannot shoot into an unresolved turn');
Q.frame(100);const frozen=Q.state().clock;paused=true;Q.frame(1000);assert.equal(Q.state().clock,frozen);paused=false;
for(let t=1040;t<2300;t+=40)Q.frame(t);assert(!Q.locked());assert.equal(Q.state().effects.length,0);
Q.setMode('endless');Q.seed();Q.place([2,0]);s=Q.state();assert(s.advanceAt>=s.settleUntil,'new rows cannot overlap falling balls');
const finish=s.advanceAt;for(let t=2400;Q.state().clock<finish-40;t+=40)Q.frame(t);assert.equal(Q.state().turns,0);
for(let t=10000;t<11500;t+=40)Q.frame(t);assert.equal(Q.state().turns,1,'one and only one row is added per shot');
Q.reset();assert.equal(Q.state().effects.length,0);assert.equal(Q.state().settleUntil,0);assert(!Q.locked());
Q.seed();Q.place([2,0]);context.window.CxQGame.home();assert.equal(Q.state().effects.length,0);assert(!Q.locked());
reduced=true;Q.setMode('classic');Q.seed();Q.place([2,0]);assert.equal(Q.state().settleUntil,100,'reduced mode resolves promptly');
console.log('Bubble motion: projection, docking, staged clear/drop, score, input lock, pause, endless order, reset/home and reduced motion passed');
