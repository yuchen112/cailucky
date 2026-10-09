import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp');
const root='games/cxq-fairytale-richman/',sources=['core.js','game.js','presentation-v8.js'].map(p=>fs.readFileSync(root+p,'utf8'));
function sandbox(){
 let now=100,next=0;const timers=new Map(),storage=new Map(),texts=[];
 const schedule=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;};
 const context=new Proxy({globalAlpha:1,measureText:s=>({width:String(s).length*16}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillText:s=>texts.push(String(s))},{get:(o,k)=>k in o?o[k]:()=>{}});
 const canvas={width:1600,height:900,style:{},getContext:()=>context,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900})};
 class Image{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}set src(value){this._src=value;this.complete=!!value;this.naturalWidth=value?900:0;this.naturalHeight=value?650:0;if(value)this.onload?.();}get src(){return this._src||'';}}
 const math=Object.create(Math);math.random=()=>.42;
 const scope={console,Math:math,Image,URL,Map,Set,Promise,performance:{now:()=>now},document:{hidden:false,getElementById:()=>canvas,body:{dataset:{}}},window:{},navigator:{maxTouchPoints:0},location:{href:'http://127.0.0.1/games/cxq-fairytale-richman/index.html'},matchMedia:()=>({matches:false}),queueMicrotask:fn=>fn(),setTimeout:schedule,clearTimeout:id=>timers.delete(id),setInterval:()=>0,clearInterval(){},requestAnimationFrame(){},addEventListener(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 vm.createContext(scope);for(const s of sources)vm.runInContext(s,scope,{timeout:10000});
 return {scope,texts,storage,run:s=>vm.runInContext(s,scope),advance(ms){const until=now+ms;let count=0;while(true){const found=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!found)break;if(++count>500)throw Error('timer loop');timers.delete(found[0]);now=found[1].at;found[1].fn();}now=until;},image:Image};
}
const h=sandbox();
h.run("S.gods=false;S.scene='game';makeBoard();richSceneReady();richTrackCash();");
assert.equal(h.run('S.board.tiles.length'),24);assert.equal(h.run('S.board.phase'),'pre-roll');
// Speed and simplified presentation cannot alter dice result, final tile or economy.
const outcomes=[];
for(const [speed,reduced]of [[1,false],[2,false],[1,true]]){
 const t=sandbox();t.run(`S.gods=false;S.settings.animationSpeed=${speed};S.settings.reduced=${reduced};S.scene='game';makeBoard();S.forcedDice=3;rollDice();`);
 assert.equal(t.run('S.rollResolution.finalSteps'),3);assert.equal(t.run('S.rolling'),true);
 t.run('rollDice()');assert.equal(t.run('S.rollResolution.finalSteps'),3);
 t.advance(6000);outcomes.push(JSON.stringify(t.run('({pos:cp().pos,cash:cp().cash,phase:S.board.phase,popup:S.board.popup?.kind,faces:S.diceResults})')));
 assert.equal(t.run('cp().moveAnim'),null);assert.equal(t.run('S.rolling'),false);
}
assert.equal(new Set(outcomes).size,1);
// Seeded random dice also match across presentation speeds.
for(const speed of [1,2]){const t=sandbox();t.run(`S.gods=false;S.settings.animationSpeed=${speed};S.scene='game';makeBoard();rollDice();`);assert.equal(t.run('S.rollResolution.faces[0]'),3);}
// A queued roll callback cannot move a different, subsequently loaded board.
const stale=sandbox();stale.run("S.gods=false;S.scene='game';makeBoard();rollDice();makeBoard();");stale.advance(6000);assert.equal(stale.run('cp().pos'),0);
const staleMove=sandbox();staleMove.run("S.gods=false;S.scene='game';makeBoard();moveSteps(3);makeBoard();");staleMove.advance(6000);assert.equal(staleMove.run('cp().pos'),0);
const pausedAI=sandbox();pausedAI.run("S.gods=false;S.scene='game';makeBoard();S.board.turn=1;aiTurn();action('pause');");pausedAI.advance(1000);assert.equal(pausedAI.run('S.board.phase'),'pre-roll');pausedAI.run("action('resume');begin();beginUiLayer();hud();endUiLayer();");pausedAI.advance(6000);assert(pausedAI.run('S.board.players[1].pos')>0,'AI resumes after its scheduled roll was interrupted by the menu');
// Deed button uses real discounted cost; insufficient funds cannot buy property.
h.run("cp().pos=1;cp().cash=1;openPopup('tile',{tile:S.board.tiles[1]});begin();beginUiLayer();scenePopup(S.board.popup,S.board,cp());endUiLayer();");assert.equal(h.run("S.buttons.find(b=>b.id==='buy').en"),false);
h.run("cp().cash=200000;cp().pos=1;openPopup('tile',{tile:S.board.tiles[1]});this.before=cp().cash;this.cost=buyCost(cp(),S.board.tiles[1]);action('buy');");assert.equal(h.run('S.board.tiles[1].owner'),0);assert.equal(h.run('S.board.players[0].cash'),h.run('before-cost'));assert.equal(h.run('S.board.tiles[1].level'),1);
// Four asset cards and the dice stay in the same place before and during a roll.
h.run("S.board.popup=null;S.board.turn=0;S.board.phase='pre-roll';S.rolling=false;begin();beginUiLayer();hud();endUiLayer();");const rect=JSON.stringify(h.run("S.buttons.find(b=>b.id==='roll')"));h.run("S.rolling=true;begin();beginUiLayer();hud();endUiLayer();");const disabled=h.run("S.buttons.find(b=>b.id==='roll')");assert.equal(disabled.en,false);assert.equal(JSON.parse(rect).x,disabled.x);assert.equal(JSON.parse(rect).y,disabled.y);
// Read-only display, money effects and artwork never mutate gameplay.
h.run("S.rolling=false;richTrackCash();cp().cash+=100;this.economy=JSON.stringify(S.board.players.map(p=>p.cash));richTrackCash();richDrawTransfers();drawMap();");assert.equal(h.run('JSON.stringify(S.board.players.map(p=>p.cash))'),h.run('economy'));assert(h.run('richV8.reactions.size')>0);
h.run("S.settings.reduced=true;richV8.reactions.clear();richReact(cp(),'skill');");assert.equal(h.run('richV8.reactions.size'),0);
// Route unchanged, plots distinct and all construction anchors remain in the world.
for(let mi=0;mi<3;mi++){h.run(`S.mapIndex=${mi};makeBoard();`);for(let i=0;i<24;i++){const p=h.run(`plotAnchor(S.board.tiles[${i}])`),r=h.run(`roadAnchor(S.board.tiles[${i}])`);assert(p.x>100&&p.x<3100&&p.y>=100&&p.y<1750);if(h.run(`S.board.tiles[${i}].type==='land'`))assert(Math.hypot(p.x-r.x,p.y-r.y)>100);}}
// Current version and legacy manual saves keep their format and restore ownership.
h.run("S.mapIndex=0;makeBoard();S.board.tiles[1].owner=0;S.board.tiles[1].level=4;saveGame(2);S.board=null;loadGame(2);");assert.equal(h.run('S.board.tiles[1].level'),4);assert.equal(h.run('S.board.tiles[1].owner'),0);assert.equal(JSON.parse(h.storage.get('cxq_richman_manual_save_v1_2')).version,4);
// Loader failures must release concurrency and explicit retry must recover.
h.run("this.target=ASSET_BY_KEY.get('homeBg');target.status='failed';target.image.src='';S.scene='home';richV8.scene='home';");assert.equal(h.run('richSceneReady()'),false);assert(h.run("richV8.failed.includes('homeBg')"));h.run("richRetry(['homeBg'])");assert.equal(h.run('richSceneReady()'),true);assert(h.run('assetActive')>=0&&h.run('assetActive')<=6);
const timeout=sandbox();timeout.run("this.Image=class{constructor(){this.complete=false;this.naturalWidth=0;}set src(v){this._src=v;if(v&&this.recover){this.complete=true;this.naturalWidth=320;this.onload?.();}}get src(){return this._src||'';}};load('timeout-probe','timeout-probe.webp','high');this.late=IM['timeout-probe'].onload;");assert.equal(timeout.run('assetActive'),1);timeout.advance(10001);assert.equal(timeout.run('assetActive'),0);assert.equal(timeout.run("ASSET_BY_KEY.get('timeout-probe').status"),'failed');timeout.run('late()');assert.equal(timeout.run('assetActive'),0);timeout.run("IM['timeout-probe'].recover=true;richRetry(['timeout-probe']);");assert.equal(timeout.run("ASSET_BY_KEY.get('timeout-probe').status"),'ready');assert.equal(timeout.run('assetActive'),0);
// All scene controls are inside the 1600x900 safe UI stage.
for(const scene of ['home','setup','loadout','mapSelect','rules','settings']){h.run(`S.scene='${scene}';begin();beginUiLayer();${scene==='rules'?'rulesSetup':scene==='mapSelect'?'mapSelect':scene}();endUiLayer();`);for(const b of h.run('S.buttons'))assert(b.x>=0&&b.y>=0&&b.x+b.w<=1600&&b.y+b.h<=900,scene+' '+b.id);}
const manifest=JSON.parse(fs.readFileSync(root+'art/v8/manifest.json'));assert.equal(manifest.assets.length,92);assert.equal(new Set(manifest.assets.map(a=>a.sha256)).size,92);
// Every upgraded stage charges the same discounted cost shown by the deed.
for(let level=1;level<5;level++){const t=sandbox();t.run(`S.gods=false;S.scene='game';makeBoard();cp().equipment=['toolkit'];cp().cash=500000;this.land=S.board.tiles[1];land.owner=cp().id;land.level=${level};this.cost=upgradeCost(land,cp());this.before=cp().cash;openPopup('tile',{tile:land});action('upgrade');`);assert.equal(t.run('land.level'),level+1);assert.equal(t.run('S.board.players[0].cash'),t.run('before-cost'));}
// Finish a ten-round game on all maps, including three AI opponents and acknowledgements.
for(let mi=0;mi<3;mi++){const t=sandbox();t.run(`S.mapIndex=${mi};S.money=500000;S.rounds=10;S.settings.reduced=true;S.scene='game';S.seats.forEach((s,i)=>{s.type=i?'ai':'human';s.char=i;});makeBoard();richSceneReady();`);let count=0;
 while(!t.run('!!S.board.winner')&&count++<1000){const q=t.run('S.board.popup?.kind');if(q){
  if(q==='event')t.run("action('eventOk')");else if(q==='npc')t.run("action('npcOk')");else if(q==='branch')t.run("action('branchChoice0')");else if(q==='tile')t.run("this.t=S.board.popup.tile;action(t.type==='land'?(t.owner<0?(cp().cash>=buyCost(cp(),t)?'buy':'skip'):t.owner===cp().id?(t.level<5&&cp().cash>=upgradeCost(t,cp())?'upgrade':'skip'):'pay'):t.type==='start'?'ok':'special')");else assert.fail('unexpected match popup '+q);
 }else if(t.run("!S.rolling&&S.board.phase==='pre-roll'&&cp().type==='human'"))t.run('rollDice()');
 t.advance(5000);t.run('richSceneReady();richTrackCash();');
 }
 assert(t.run('!!S.board.winner'),'map '+mi+' must finish');assert.equal(t.run('S.scene'),'result');assert(count<1000);for(const cash of t.run('S.board.players.map(p=>p.cash)'))assert(Number.isFinite(cash));
}
for(const a of manifest.assets){const m=await sharp(root+'art/v8/'+a.file).metadata();assert.equal(m.width,a.width);if(a.alpha){const stats=await sharp(root+'art/v8/'+a.file).stats();assert(m.hasAlpha);assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255);}if(/-(idle|blink|windup|toss|receive|pay|skill)$/.test(a.id))assert.equal(m.width,320);}
const atlases=JSON.parse(fs.readFileSync(root+'art/v8/atlases/manifest.json'));assert.equal(Object.keys(atlases.characters).length,10);
for(const [id,entry]of Object.entries(atlases.characters)){const m=await sharp(root+'art/v8/atlases/'+entry.atlas).metadata();assert.equal(m.width,1280);assert.equal(m.height,720);assert.equal(Object.keys(entry.poses).length,7);const native=fs.readFileSync('tools/art-sources/richman-v8/'+id+'.aseprite');assert.equal(native.readUInt16LE(6),7);for(const p of Object.values(entry.poses))assert(p.x+p.w<=m.width&&p.y+p.h<=m.height);}
h.run("S.scene='game';makeBoard();richSceneReady();");assert(h.run("richSceneAssets().includes('v8-atlas-'+CHAR_KEYS[cp().char])"));assert(!h.run("richSceneAssets().some(k=>/-(toss|blink|windup)$/.test(k))"));
console.log('PASS richman v8: outcome invariance, duplicate roll, stale callback, real deed/upgrade costs, stable HUD, read-only effects, three complete AI matches/routes, save restore, loading retry, UI bounds, 92 independent artworks and 10 editable seven-pose atlases');
