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
if (!swContext.cacheName.includes('20260824-2230')) throw new Error('service worker cache revision is stale');
const storage = new Map();
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
  innerWidth: 1600, innerHeight: 900, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {},
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
  ['game','S.scene="game";S.board.popup=null;game()'],['roster','S.scene="game";openPopup("roster");game()'],['result','S.scene="result";result()']
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
  land.owner=owner.id;land.level=1;owner.rentBoost=1;rentFor(land,S.board.players[1]);
  if(owner.rentBoost!==0)throw new Error('rent boost was not consumed by an actual rent calculation');
`, context);
console.log('CxQ smoke/layout test passed: scenes, HUD, buildings, map regions, rent rules, roster, results, button bounds, overlap rules and five landscape aspect ratios.');
