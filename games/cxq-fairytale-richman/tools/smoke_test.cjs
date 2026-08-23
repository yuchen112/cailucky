const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const swContext = vm.createContext({
  self: { addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
  caches: {}, fetch() {}
});
vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8') + ';this.precache=PRECACHE;this.cacheName=CACHE', swContext);
for (const item of swContext.precache) {
  const target = item === './' ? path.join(root, 'index.html') : path.resolve(root, item);
  if (!fs.existsSync(target)) throw new Error(`service worker precache missing: ${item}`);
}
if (!swContext.cacheName.includes('20260825-0215')) throw new Error('service worker cache revision is stale');
const storage = new Map();
const timers = [];
const draw = new Proxy({}, {
  get(target, key) {
    if (key === 'measureText') return value => ({ width: String(value).length * 13 });
    if (key === 'canvas') return canvas;
    if (!(key in target)) target[key] = () => {};
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; }
});
const canvas = { width: 1600, height: 900, style: {}, getContext: () => draw, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }), addEventListener() {} };
class MockImage {
  constructor() { this.complete = true; this.naturalWidth = 1254; this.naturalHeight = 1254; }
  set src(value) { this._src = value; if (this.onload) this.onload(); }
  get src() { return this._src; }
}
const sandbox = {
  console, Image: MockImage, performance: { now: () => 1000 }, devicePixelRatio: 1,
  innerWidth: 1600, innerHeight: 900, requestAnimationFrame() {}, setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
  setInterval: () => 1, clearInterval() {}, addEventListener() {},
  navigator: { vibrate() {} }, screen: {},
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  document: { getElementById: () => canvas, addEventListener() {}, body: { dataset: {} }, documentElement: {} },
  window: null
};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const file of ['core.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
vm.runInContext(`
  home(); setup(); mapSelect(); rulesSetup();
  makeBoard();
  S.board.tiles.filter(t=>t.type==='land').slice(0,4).forEach((t,i)=>{t.owner=0;t.level=Math.min(3,i)});
  game(); hud(); openPopup('roster'); popup(); openPopup('playerDetail',{player:S.board.players[0]}); popup();
  openPopup('event',{name:'王國節慶',desc:'獲得 $6,000'});popup();
  openPopup('npc',{name:'財神',desc:'獲得 $8,000'});popup();
  for(let kind=0;kind<3;kind++){S.board.mini={kind,pos:.5,name:['星光接接樂','月港氣球祭','雲端寶箱'][kind],winningChest:1};openPopup('mini',{name:S.board.mini.name});popup()}
  openPopup('tileInspect',{tile:S.board.tiles.find(t=>t.type==='land')});popup();
  S.scene='result'; S.board.winner=S.board.players[0]; result();
`, context);
function buttonsFor(code) {
  vm.runInContext(`S.buttons=[];${code}`, context);
  return JSON.parse(vm.runInContext('JSON.stringify(S.buttons)', context));
}
function overlap(a, b) { return Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y); }
function allowedNested(a,b){const pair=[a.id,b.id].join('|');return /^seat\d\|(?:seatType|diff)\d$/.test(pair)||/^(?:seatType|diff)\d\|seat\d$/.test(pair)}
for (const [scene, code] of [
  ['setup','S.scene="setup";setup()'],['map','S.scene="mapSelect";mapSelect()'],['rules','S.scene="rules";rulesSetup()'],
  ['game','S.scene="game";S.board.popup=null;game()'],['roster','S.scene="game";openPopup("roster");game()'],
  ['event','S.scene="game";openPopup("event",{name:"王國節慶",desc:"獲得獎勵"});game()'],
  ['npc','S.scene="game";openPopup("npc",{name:"財神",desc:"獲得獎勵"});game()'],
  ['miniStar','S.scene="game";S.board.mini={kind:0,pos:.5,name:"星光接接樂"};openPopup("mini",{name:S.board.mini.name});game()'],
  ['miniBalloon','S.scene="game";S.board.mini={kind:1,pos:.5,name:"月港氣球祭"};openPopup("mini",{name:S.board.mini.name});game()'],
  ['miniTreasure','S.scene="game";S.board.mini={kind:2,pos:.5,name:"雲端寶箱",winningChest:1};openPopup("mini",{name:S.board.mini.name});game()'],
  ['inspect','S.scene="game";openPopup("tileInspect",{tile:S.board.tiles.find(t=>t.type==="land")});game()'],['result','S.scene="result";result()']
]) {
  const buttons=buttonsFor(code);
  for(const b of buttons){if(b.x<0||b.y<0||b.x+b.w>1600||b.y+b.h>900)throw new Error(`${scene}: ${b.id} outside safe area`)}
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)if(overlap(buttons[i],buttons[j])&&!allowedNested(buttons[i],buttons[j]))throw new Error(`${scene}: ${buttons[i].id} overlaps ${buttons[j].id}`)
}
for(const [w,h] of [[932,430],[1247,787],[1366,768],[1920,720],[2560,1080]]){const scale=Math.min(w/1600,h/900),safeW=1600*scale,safeH=900*scale;if(Math.abs(safeW/safeH-16/9)>.0001)throw new Error('safe area distorted')}
vm.runInContext(`
  for(let mi=0;mi<MAPS.length;mi++){
    S.mapIndex=mi; makeBoard();
    for(let ri=0;ri<4;ri++)if(REGION_NAMES[ri]!==MAPS[mi].regions[ri])throw new Error('map region label mismatch');
    const lands=S.board.tiles.filter(t=>t.type==='land'&&t.region===0);
    lands.forEach(t=>{t.owner=0;t.level=3});
    if(buildingImage(lands[0])!==IM['building'+mi+'_landmark'])throw new Error('completed region did not use its map landmark');
    lands[0].owner=1;
    if(buildingImage(lands[1])!==IM['building'+mi+'_3'])throw new Error('incomplete region incorrectly used landmark');
  }
  S.mapIndex=0;makeBoard();
  const owner=S.board.players[0], land=S.board.tiles.find(t=>t.type==='land');
  land.owner=owner.id;land.level=1;owner.rentBoost=1;rentEstimate(land,S.board.players[1]);
  if(owner.rentBoost!==1)throw new Error('rent preview consumed the rent boost');
  rentFor(land,S.board.players[1]);
  if(owner.rentBoost!==0)throw new Error('rent boost was not consumed by an actual rent calculation');
`, context);
function drainTimers(limit = 20) {
  let count = 0;
  while (timers.length && count++ < limit) timers.shift()();
  if (timers.length) throw new Error('timer queue did not settle');
}
for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
  vm.runInContext(`
    S.scene='game';S.mapIndex=${mapIndex};S.money=200000;S.rounds=30;
    S.seats.forEach((s,i)=>{s.type=i<2?'human':'off'});makeBoard();
  `, context);
  for (let turn = 0; turn < 90; turn++) {
    vm.runInContext(`(()=>{
      const simP=cp();
      simP.type='human';
      simP.pos=(simP.pos+1+(S.board.round%6))%S.board.tiles.length;
      resolveTile();
      const simQ=S.board.popup;
      if(simQ?.kind==='tile'){
        const simT=simQ.tile;
        if(simT.type==='land'){
          if(simT.owner<0&&simP.cash>=buyCost(simP,simT))action('buy');
          else if(simT.owner===simP.id&&simT.level<3&&simP.cash>=Math.round(simT.price*.65))action('upgrade');
          else if(simT.owner>=0&&simT.owner!==simP.id)action('pay');
          else action('skip');
        }else if(['event','card','shop','minigame','npc'].includes(simT.type))action('special');
        else action('ok');
      }
      if(S.board.popup?.kind==='event')action('eventOk');
      else if(S.board.popup?.kind==='npc')action('npcOk');
      else if(S.board.popup?.kind==='carddraw')action('cardOk');
      else if(S.board.popup?.kind==='shop')action('shopBuy');
      else if(S.board.popup?.kind==='mini')action('miniStop');
    })()`, context);
    drainTimers();
  }
  const outcome = JSON.parse(vm.runInContext(`JSON.stringify({round:S.board.round,logs:S.board.log.length,owned:S.board.tiles.filter(t=>t.owner>=0).length,players:S.board.players.length})`, context));
  if (outcome.round < 20 || outcome.logs < 4 || outcome.owned < 1 || outcome.players !== 2) throw new Error(`map ${mapIndex} match simulation incomplete: ${JSON.stringify(outcome)}`);
}
console.log('CxQ smoke/layout test passed: scenes, HUD, buildings, map regions, rent rules, three complete simulated matches, roster, results, button bounds, overlap rules and five landscape aspect ratios.');
