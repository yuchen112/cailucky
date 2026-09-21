const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const Matter=require('../games/merge/matter.min.js');
function game(source){
 const nodes=new Map(),data={highTier:0,role:0,collection:[]};
 const node=()=>({style:{},options:[{},{}],value:'5',checked:false,hidden:false,textContent:'',classList:{toggle(){}},getContext:()=>new Proxy({},{get:()=>()=>{}}),focus(){}});
 const $=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const G={$,init:()=>data,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),rolePicker(){},sprite:()=>'',roles:['幸運'],images:{},load:()=>Promise.resolve(),save(){},sound(){},playing(){},frame(){},settings(){},records(){},dialog(){},toast(){}};
 const context={Matter,G,console,Math,Set,window:{},document:{body:node(),querySelector:()=>null},addEventListener(){}};
 vm.runInNewContext(source+'\nglobalThis.test={start,make,balls,mergePairs,step:()=>{Engine.update(engine,1000/60);mergePairs()},pair:(a,b)=>queue.push([a,b]),engine:()=>engine,data};',context);
 const t=context.test;t.start();return {t,nodes,data};
}
function unsupported(source){
 const {t}=game(source),a=t.make(0,120,472),b=t.make(0,150,472),upper=t.make(3,110,472-Math.sqrt(43**2-10**2));
 for(const body of [a,b,upper])Matter.Sleeping.set(body,true);
 const y=upper.position.y;t.pair(a,b);t.mergePairs();for(let n=0;n<180;n++)t.step();return {drop:upper.position.y-y,sleeping:upper.isSleeping};
}
const old=cp.execFileSync('git',['show','c631877:games/merge/game.js'],{encoding:'utf8'}),source=fs.readFileSync('games/merge/game.js','utf8');
const before=unsupported(old),after=unsupported(source);assert.equal(before.drop,0,'reproduce old suspended sleeping ball');assert(after.drop>4,'upper ball must fall after support merges');
{
 const {t}=game(source),a=t.make(0,120,472),b=t.make(0,149,472),c=t.make(0,178,472),d=t.make(0,207,472);
 t.pair(a,b);t.pair(b,c);t.pair(c,d);t.mergePairs();assert.equal(t.balls().length,2,'each source merges at most once per step');assert(t.balls().every(b=>b.tier===1));
 for(let n=0;n<300;n++)t.step();assert(t.balls().every(b=>Number.isFinite(b.position.y)&&b.position.y+b.circleRadius<488));
}
{
 const {t}=game(source),a=t.make(0,57,490),b=t.make(0,60,490);t.pair(a,b);t.mergePairs();const merged=t.balls()[0];assert(merged.position.x-merged.circleRadius>=56);assert(merged.position.y+merged.circleRadius<=487);
}
{
 const {t,nodes,data}=game(source),support=t.make(0,120,472),upper=t.make(3,120,429);Matter.Sleeping.set(support,true);Matter.Sleeping.set(upper,true);data.role=1;nodes.get('#ability').onclick();assert.equal(upper.isSleeping,false);const y=upper.position.y;for(let n=0;n<150;n++)t.step();assert(upper.position.y>y+10);
}
console.log('Merge physics passed: old suspended-ball reproduced; corrected drop '+after.drop.toFixed(2)+'px; duplicate pairs, boundaries, support removal and settling verified.');
