const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const calls=[],added=[];let reduced=false;
function element(x=0,y=0){return {style:{},children:[],getBoundingClientRect:()=>({x,y,width:40,height:40}),animate(frames,options){calls.push({el:this,frames,options});return {finished:Promise.resolve(),cancel(){}}},append(el){this.children.push(el);added.push(el)},remove(){this.removed=true},cloneNode(){return element(x,y)},querySelectorAll(){return this.pieces||[]},querySelector(){return this.pieces?.[0]}};}
const targets=[element(20,20),element(80,20),element(140,20)];
const context={window:{},Image:function(){return element()},Promise,Set,Object,Math,parseFloat,getComputedStyle:()=>({gap:'7px'}),matchMedia:()=>({matches:false,addEventListener(){}}),MutationObserver:class{observe(){}},document:{body:Object.assign(element(),{classList:{contains:()=>reduced}}),querySelectorAll:()=>targets}};
vm.runInNewContext(fs.readFileSync('games/dream-match/motion.js','utf8'),context);
const M=context.window.DreamMotion,board={clientWidth:343,children:Array.from({length:49},(_,i)=>{const c=element(i%7*50,Math.floor(i/7)*50);c.pieces=[element(i%7*50,Math.floor(i/7)*50)];if(i===0)c.pieces.push(element());return c})};
(async()=>{
 await M.swap(board,0,1);assert.equal(calls.length,3,'gem and special marker both travel');assert.equal(calls[0].frames[1].translate,'50px 0px');assert.equal(board.children[0].style.zIndex,'');
 calls.length=0;await M.fall(board,{0:3,1:0,7:1});assert.equal(calls.length,3);assert.equal(calls[0].frames[0].translate,'0 -150px');assert.equal(calls[0].frames.at(-1).translate,'0 0');
 assert(calls.every(c=>c.frames.length===2&&c.frames.every(f=>f.opacity===1)),'fall never fades survivors or bounces past destination');
 assert(calls.every(c=>c.options.duration===calls[0].options.duration&&!c.options.delay),'pieces settle together without staggered snaps');
 calls.length=0;await M.clear(board,new Set([0,1,7]),{2:'prism'},{0:'row'},Array(49).fill(0),[{color:0,got:0,need:12}]);assert(calls.some(c=>c.options.delay===168),'row sweep reaches last column');assert(added.every(e=>e.removed),'temporary artwork cleaned');
 calls.length=0;await M.shuffle(board,true);assert.equal(calls.length,50);await M.shuffle(board,false);assert.equal(calls.length,100);
 calls.length=0;reduced=true;await M.swap(board,0,1);await M.fall(board,{0:4});await M.clear(board,new Set([0]),{},{},[],[]);await M.shuffle(board,true);await M.feedback(element());M.hint(board,[0,1]);assert.equal(calls.length,0,'reduced motion skips all effects');
 console.log('Dream motion: swap, marker alignment, gravity distance, special sweep, cleanup, shuffle and reduced-motion checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
