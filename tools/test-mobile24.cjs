const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const campaign=require('../games/dream-match/campaign.js');let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name)}
check('twelve distinct campaign levels',()=>{assert.equal(campaign.levels.length,12);assert.equal(new Set(campaign.levels.map(l=>l.name)).size,12);campaign.levels.forEach(l=>{assert(l.moves>=24);assert.equal(l.targets.length,3)})});
check('invalid saved progress is bounded',()=>{assert.equal(campaign.clamp(NaN),0);assert.equal(campaign.clamp(999),11);assert.equal(campaign.cleared(-1),0);assert.equal(campaign.cleared(999),12)});
const source=fs.readFileSync('games/dream-match/game.js','utf8');
const sandbox=vm.createContext({console});
vm.runInContext(`const levels=${JSON.stringify(campaign.levels)};let mode='classic',chapter=0,goals=[{got:10,need:8}],bestChain=1,score=1000,moves=5,ended=false;const chapters=levels.map(l=>l.name),nodes={},$=s=>nodes[s]||(nodes[s]={});const stored={},campaignKey='campaign',cleared=()=>stored.campaign||0,CxQ={read:(k,d)=>stored[k]??d,write:(k,v)=>stored[k]=v,sound(){}};function fresh(){ended=false;}const R={move:()=>true};const a=[],special={};function toast(){}async function animateReshuffle(){};${source.slice(source.indexOf('async function check()'),source.indexOf('  let toastTimer'))};`,sandbox);
async function run(){
 await vm.runInContext('check()',sandbox);
 check('classic win saves progress and next-level action',()=>{assert.equal(vm.runInContext('stored.campaign',sandbox),1);assert.match(vm.runInContext("nodes['#again'].textContent",sandbox),/第 2 關/);vm.runInContext("nodes['#again'].onclick()",sandbox);assert.equal(vm.runInContext('chapter',sandbox),1)});
 await vm.runInContext("mode='relaxed';chapter=0;stored.campaign=4;check()",sandbox);
 check('relaxed win preserves campaign and replays same round',()=>{assert.equal(vm.runInContext('stored.campaign',sandbox),4);assert.equal(vm.runInContext("nodes['#again'].textContent",sandbox),'再玩一局')});
 await vm.runInContext("mode='classic';chapter=2;bestChain=1;ended=false;check()",sandbox);
 check('chain objective prevents premature win',()=>assert.equal(vm.runInContext('ended',sandbox),false));
 await vm.runInContext('bestChain=2;check()',sandbox);
 check('chain objective completes when both requirements met',()=>assert.equal(vm.runInContext('ended',sandbox),true));
 check('all new roles have four individual files',()=>{for(const role of ['memory','joy','trust','dream','sadness','hope'])for(const pose of ['run-0','run-1','jump','slide'])assert(fs.statSync(`games/storybook/art-mobile24/${role}-${pose}.webp`).size>1000)});
 check('tower old URL no longer loads game code',()=>{const html=fs.readFileSync('games/fairytale-defense/index.html','utf8');assert(html.includes('暫未開放'));assert(!html.includes('<script'));assert(!fs.existsSync('games/fairytale-defense/index-before-pause.html'))});
 console.log(count+' mobile release checks passed');
}
run().catch(e=>{console.error(e);process.exit(1)});
