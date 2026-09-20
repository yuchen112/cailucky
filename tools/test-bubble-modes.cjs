const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const nodes=new Map(),events={},saved={};
function node(){return {style:{},hidden:true,textContent:'',disabled:false,dataset:{},previousElementSibling:{},parentElement:{clientWidth:0},classList:{contains:()=>false},setAttribute(){},append(){},focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:720,height:820})};}
const canvas=node();canvas.width=720;canvas.height=820;canvas.getContext=()=>new Proxy({},{get:()=>()=>{}});nodes.set('#game',canvas);
const context={console,Set,Math,Image:function(){return {}},innerHeight:820,innerWidth:720,setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),addEventListener:(name,fn)=>events[name]=fn,document:{body:node(),querySelector:s=>{if(s==='.game-entry:not([hidden])')return null;if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},createElement:node},BubbleEndless:require('../games/magic-bubble/endless-core.js')};
context.window={CxQSession:{blocked:()=>false}};context.CxQ={configure(){},sound(){},read:(k,f)=>saved[k]??f,write:(k,v)=>saved[k]=v};
let source=fs.readFileSync('games/magic-bubble/game.js','utf8');
source=source.replace('  function fit(){',`  window.test={reset,place,frame,swap,check,result,state:()=>({turns,shots,skill,advanceAt,descending,over,offset,grid}),seed:(g,power=0)=>{grid=g;skill=power;ball=0;next=0;}};
  function fit(){`);
vm.runInNewContext(source,context);const t=context.window.test,empty=()=>Array.from({length:10},()=>Array(9).fill(-1));
events['cxq-start']({detail:{mode:'campaign',difficulty:'classic'}});assert.equal(t.state().shots,32);
events['cxq-start']({detail:{mode:'campaign',difficulty:'relaxed'}});assert.equal(t.state().shots,42);
events['cxq-start']({detail:{mode:'endless'}});let g=empty();g[0][0]=g[0][1]=0;t.seed(g);t.place([0,2]);assert.equal(t.state().over,false,'clearing all bubbles does not finish endless');assert.notEqual(t.state().advanceAt,null);
for(let i=1;i<=40;i++)t.frame(i*40);assert.equal(t.state().turns,1);assert.equal(t.state().offset,1);assert.equal(t.state().grid[0].filter(v=>v>=0).length,5);
t.swap();assert.equal(t.state().turns,1);assert.equal(t.state().advanceAt,null);
g=empty();g[0][0]=g[0][1]=0;t.seed(g,100);nodes.get('#skill').onclick();assert.equal(t.state().skill,0);assert.equal(t.state().turns,1);assert.equal(t.state().advanceAt,null);assert.equal(t.state().over,false);
g=empty();g[9][0]=1;t.seed(g);t.check();assert.equal(t.state().over,true);t.result(false);assert('cxq-bubble-endless-best' in saved);assert(!('cxq-bubble-best' in saved));
t.reset();assert.equal(t.state().turns,0);assert.equal(t.state().offset,0);assert.equal(t.state().over,false);
console.log('Bubble modes: 32/42 shots, clear-board continuation, timed descent, free swap/magic, danger loss, separate records and replay passed');
