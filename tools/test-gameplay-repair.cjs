const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
function section(source,start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const tower=read('games/fairytale-defense/game.js');
const t=vm.createContext({Math,console});
vm.runInContext(`let clock=0,running=false,spawnLeft=0,spawnAt=0,enemies=[],shots=[],effects=[],towers=[],pads=[[0,0]],coins=0,life=20,kills=0,wave=1,mode='classic';
const enemyTypes=[{armor:1}],CxQ={sound(){}};let finished=null;
function route(p){return [p,0]}function total(){return 1000}function sync(){}function finish(win){finished=win}function spawn(){}
function stats(t){return {range:200,damage:20,rate:1,splash:0,...t.stats}}
${section(tower,'function damage(','  function sprite(')}
function seed(stats={}){clock=0;running=false;spawnLeft=0;finished=null;coins=0;kills=0;effects=[];shots=[];life=20;wave=1;towers=[{kind:'growth',level:1,ready:0,dealt:0,stats}];enemies=[{p:100,hp:100,max:100,speed:0,slow:1,slowUntil:0,type:0,reward:14,flash:0}];}
`,t);
check('projectile launch does not apply immediate damage',()=>{vm.runInContext('seed();update(.1)',t);assert.equal(vm.runInContext('enemies[0].hp',t),100);assert.equal(vm.runInContext('shots.length',t),1)});
check('damage occurs once at visible arrival',()=>{vm.runInContext('clock=.25;update(.15)',t);assert.equal(vm.runInContext('enemies[0].hp',t),80);vm.runInContext('update(.1)',t);assert.equal(vm.runInContext('enemies[0].hp',t),80)});
check('slow starts at impact, not at launch',()=>{vm.runInContext('seed({slow:.5});update(.1)',t);assert.equal(vm.runInContext('enemies[0].slow',t),1);vm.runInContext('clock=.25;update(.15)',t);assert.equal(vm.runInContext('enemies[0].slow',t),.5)});
check('escaped target is not damaged or rewarded',()=>{vm.runInContext('seed();update(.1);enemies[0].p=1001;clock=.25;update(.15)',t);assert.equal(vm.runInContext('life',t),19);assert.equal(vm.runInContext('coins',t),0);assert.equal(vm.runInContext('towers[0].dealt',t),0)});
check('splash kills grant reward only once',()=>{vm.runInContext('seed({splash:80,damage:110});update(.1);clock=.25;update(.15);update(.1)',t);assert.equal(vm.runInContext('coins',t),14);assert.equal(vm.runInContext('kills',t),1)});
check('wave eight resolves after projectile kill',()=>{vm.runInContext('seed({damage:110});running=true;wave=8;update(.1);clock=.25;update(.15)',t);assert.equal(vm.runInContext('finished',t),true)});
check('tower resize preserves fixed world geometry',()=>{assert.ok(tower.includes('c.width=1100;c.height=650'));assert.ok(!tower.includes('e.p*=ratio'));assert.ok(!tower.includes('py*c.height/650'))});
const whack=read('games/whack/game.js'),w=vm.createContext({Math,console});
vm.runInContext(`const window={},CxQ={sound(){}},SPEED={normal:[760,1000]},elements=new Map(),$=s=>{if(!elements.has(s))elements.set(s,{});return elements.get(s)};let difficulty='normal',mode='timed',state;function draw(){}function finish(){}
${section(whack,'function spawn()','function draw()')}
function seed(){state={running:true,paused:false,countdown:0,elapsed:0,next:999999,holes:Array(9).fill(null),combo:0,bestCombo:0,hits:0,misses:0,lives:3,score:0,reactions:[]};spawn();const i=state.holes.findIndex(Boolean);state.holes[i].kind='normal';return i;}
let index=seed();`,w);
check('whack appearance cannot be hit before rise completes',()=>{vm.runInContext('state.elapsed=200;hit(index)',w);assert.equal(vm.runInContext('state.score',w),0)});
check('whack fully emerged target scores once',()=>{vm.runInContext('state.elapsed=360;hit(index);hit(index)',w);assert.equal(vm.runInContext('state.score',w),10)});
check('retreating target rejects late hits',()=>{vm.runInContext('index=seed();state.elapsed=state.holes[index].expires;hit(index)',w);assert.equal(vm.runInContext('state.score',w),0)});
check('miss waits until retreat animation finishes',()=>{vm.runInContext('index=seed();state.elapsed=state.holes[index].expires;update(1)',w);assert.equal(vm.runInContext('state.misses',w),0);vm.runInContext('update(180)',w);assert.equal(vm.runInContext('state.misses',w),1)});
const dino=read('games/dino/game.js'),d=vm.createContext({Math});
vm.runInContext(`let state={slide:0,y:260};function runnerPose(){return {width:100,height:112}}
${section(dino,'function playerHitbox()','function start()')}`,d);
check('runner collision excludes decorative silhouette edges',()=>{const box=vm.runInContext('playerHitbox()',d);assert.ok(box.left>110&&box.right<210);assert.equal(box.bottom,255)});
check('runner slide clears low branch without shrinking standing hitbox',()=>{const standing=vm.runInContext('playerHitbox().top',d);vm.runInContext('state.slide=.7',d);assert.ok(vm.runInContext('playerHitbox().top',d)>standing);assert.ok(vm.runInContext('playerHitbox().top',d)>202)});

const full=vm.createContext({Math,console});
vm.runInContext(section(tower,'const defs=','  let map=')+`
let map=0,mode='classic',towers=[],enemies=[],shots=[],effects=[],coins=0,life=20,wave=0,running=false,clock=0,spawnLeft=0,spawnAt=0,kills=0,path,pads,lengths,finished=null;
const CxQ={sound(){}};function sync(){}function finish(win){finished=win;running=false}
`+section(tower,'function layoutMap()','  function sync()')+section(tower,'function spawn()','  function sprite(')+`
function simulate(index,defend){
 map=index;layoutMap();mode='classic';enemies=[];shots=[];effects=[];coins=0;life=20;clock=0;wave=0;kills=0;finished=null;
 towers=pads.map((_,i)=>defend?{kind:['growth','dream','luck','trust'][i%4],level:3,branch:'power',ready:0,fired:0,dealt:0}:null);
 for(wave=1;wave<=8&&finished===null;wave++){
  running=true;spawnLeft=5+wave*2;spawnAt=clock;
  for(let steps=0;running&&finished===null&&steps<20000;steps++){clock+=.04;update(.04);}
  if(running)throw Error('wave did not terminate');
 }
 return {finished,life,kills,coins,invalid:enemies.some(e=>!Number.isFinite(e.hp)||!Number.isFinite(e.p))};
}`,full);
for(let map=0;map<3;map++){
 check('map '+(map+1)+' empty defense reaches loss',()=>{const result=vm.runInContext('simulate('+map+',false)',full);assert.equal(result.finished,false);assert.equal(result.invalid,false)});
 check('map '+(map+1)+' upgraded defense completes eight waves',()=>{const result=vm.runInContext('simulate('+map+',true)',full);assert.equal(result.finished,true);assert.ok(result.kills>0);assert.equal(result.invalid,false)});
}
console.log(`${checks} gameplay regression checks passed.`);
