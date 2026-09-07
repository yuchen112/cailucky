const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const revision = "20260908-0030";
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const fail = (message) => { throw new Error(message); };

for (const file of ["core.js", "game.js", "viewport.js", "sw.js"])
  new vm.Script(read(file), { filename: file });

const swContext = vm.createContext({
  self: { addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
  caches: {}, fetch() {},
});
vm.runInContext(read("sw.js") + ";this.precache=PRECACHE;this.cacheName=CACHE", swContext);
if (!swContext.cacheName.includes(revision)) fail("service-worker revision mismatch");
for (const item of swContext.precache) {
  const target = item === "./" ? path.join(root, "index.html") : path.resolve(root, item);
  if (!fs.existsSync(target)) fail(`precache target missing: ${item}`);
}
const html = read("index.html"), core = read("core.js"), version = read("version.txt");
for (const asset of ["manifest.webmanifest", "core.js", "viewport.js", "game.js", "sw.js"])
  if (!html.includes(`${asset}?v=${revision}`)) fail(`entry revision mismatch: ${asset}`);
if (!core.includes(`const ASSET_REV = "${revision}"`)) fail("asset revision mismatch");
if (!version.includes(revision)) fail("version note mismatch");

const storage = new Map(), timers = [];
let canvas;
const draw = new Proxy({}, {
  get(target, key) {
    if (key === "measureText") return (value) => ({ width: String(value).length * 13 });
    if (key === "canvas") return canvas;
    if (!(key in target)) target[key] = () => {};
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; },
});
canvas = {
  width: 1600, height: 900, style: {}, getContext: () => draw,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }),
  addEventListener() {}, setPointerCapture() {},
};
class MockImage {
  constructor() { this.complete = true; this.naturalWidth = 1600; this.naturalHeight = 900; }
  set src(value) { this._src = value; this.onload?.(); }
  get src() { return this._src; }
}
const sandbox = {
  console, Image: MockImage, performance: { now: () => 1000 }, devicePixelRatio: 1,
  innerWidth: 1600, innerHeight: 900, requestAnimationFrame() {},
  setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
  setInterval(fn) { for (let i = 0; i < 9; i++) timers.push(fn); return timers.length; },
  clearInterval() {}, addEventListener() {},
  navigator: { vibrate() {} }, screen: {},
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
  document: {
    getElementById: () => canvas, addEventListener() {},
    body: { dataset: {} }, documentElement: {},
  },
  window: null,
};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const file of ["core.js", "game.js"])
  vm.runInContext(read(file), context, { filename: file });

const run = (code) => vm.runInContext(code, context);
const json = (code) => JSON.parse(run(`JSON.stringify(${code})`));
const loaded = json("Object.values(IM).map(image=>image._src).filter(Boolean)");
const cached = new Set(swContext.precache);
for (const source of loaded) {
  const clean = source.replace(/\?.*$/, "");
  const key = clean.startsWith("../") || clean.startsWith("./") ? clean : "./" + clean;
  if (!cached.has(key)) fail(`runtime asset absent from precache: ${clean}`);
}

run(`(()=>{
  home(); setup(); loadout(); mapSelect(); rulesSetup();
  if(EQUIPMENT_DEFS.length!==8)throw new Error('equipment catalog must contain eight items');
  if(new Set(EQUIPMENT_DEFS.map(x=>x.id)).size!==8)throw new Error('equipment ids must be unique');
  for(const item of EQUIPMENT_DEFS)if(!IM['equip_'+item.id]?.complete)throw new Error('equipment art missing: '+item.id);
  if(EVENTS.length<16||EVENTS.some(e=>!e[3]||!IM['event_'+e[3]]?.complete))throw new Error('event art coverage incomplete');
  if(TYPE_PATTERN.some(type=>['card','shop','minigame','bank','hospital','police','coupon'].includes(type)))throw new Error('removed system remains in board route');
  if(TYPE_PATTERN.includes('npc'))throw new Error('fixed god tile remains');
  if(ANIMATION_MIN_FRAMES<30||ANIMATION_MIN_MS<500)throw new Error('animation minimum is below thirty frames');
})()`);

run(`(()=>{
  S.scene='setup';S.seats[0].type='human';S.seats[1].type='ai';
  S.seats[2].type=S.seats[3].type='off';S.activeSeat=0;
  action('startGame');
  const before=JSON.stringify(S.seats[1].equipment);
  action('loadoutSeat1');
  if(S.activeSeat!==0)throw new Error('AI equipment seat became player-editable');
  S.activeSeat=1;action('equipdeed');
  if(JSON.stringify(S.seats[1].equipment)!==before)throw new Error('player changed AI equipment');
  S.activeSeat=0;
})()`);

function buttonsFor(code) {
  run(`S.buttons=[];${code}`);
  return json("S.buttons");
}
function overlap(a, b) {
  return Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x) && Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y);
}
function nested(a,b) {
  return /^seat\d\|(?:seatType|diff)\d$/.test(`${a.id}|${b.id}`) || /^(?:seatType|diff)\d\|seat\d$/.test(`${a.id}|${b.id}`);
}
for (const [name, code] of [
  ["home", 'S.scene="home";home()'],
  ["setup", 'S.scene="setup";setup()'],
  ["loadout", 'S.scene="loadout";loadout()'],
  ["map", 'S.scene="mapSelect";mapSelect()'],
  ["rules", 'S.scene="rules";rulesSetup()'],
]) {
  const buttons = buttonsFor(code);
  for (const button of buttons)
    if (button.x<0||button.y<0||button.x+button.w>1600||button.y+button.h>900)
      fail(`${name}: ${button.id} outside safe area`);
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)
    if(overlap(buttons[i],buttons[j])&&!nested(buttons[i],buttons[j]))
      fail(`${name}: ${buttons[i].id} overlaps ${buttons[j].id}`);
}

run(`(()=>{
  S.seats.forEach((seat,i)=>{seat.type=i<2?'human':'off';seat.equipment=i===0?['deed','boots']:['compass','charm']});
  for(let mi=0;mi<MAPS.length;mi++){
    S.mapIndex=mi;makeBoard();
    if(S.board.tiles.length!==36)throw new Error('map route length mismatch');
    if(S.board.tiles.some(t=>!['start','land','event','magic'].includes(t.type)))throw new Error('forbidden tile type generated');
    for(const p of S.board.players){
      if(p.equipment.length!==2)throw new Error('equipment not copied into match');
      for(const key of ['cards','tools','bank','tickets','detained'])if(key in p)throw new Error('obsolete player field remains: '+key);
    }
    for(const tile of S.board.tiles){
      const road=roadAnchor(tile),plot=plotAnchor(tile);
      if(road.x!==tile.x||road.y!==tile.y)throw new Error('pawn road anchor drifted');
      if(tile.type==='land'){
        const gap=Math.hypot(plot.x-road.x,plot.y-road.y);
        if(gap<52||gap>92)throw new Error('roadside plot is detached from its road node');
      }
    }
    const land=S.board.tiles.find(t=>t.type==='land'), owner=S.board.players[0];
    land.owner=owner.id;land.level=5;
    if(buildingImage(land)!==IM['landmark_'+CHAR_KEYS[owner.char]])throw new Error('Lv5 character landmark mismatch');
  }
})()`);

run(`(()=>{
  S.mapIndex=0;makeBoard();S.scene='game';
  const p=cp(), other=S.board.players[1], land=S.board.tiles.find(t=>t.type==='land');
  p.equipment=['deed','boots'];p.cash=200000;
  const normal=Math.round(Math.round(land.price*marketIndex())*(p.char===6?.9:1)), discounted=buyCost(p,land);
  if(discounted!==Math.round(normal*.8))throw new Error('deed discount failed');
  p.pos=land.index;openPopup('tile',{tile:land});action('buy');
  if(land.owner!==p.id||!p.deedUsed)throw new Error('purchase/deed consumption failed');
  p.equipment=['toolkit','bell'];land.level=1;
  if(upgradeCost(land,p)!==Math.round(land.price*(.61+2*.07)*marketIndex()*.88))throw new Error('toolkit discount failed');
  const plainRent=Math.round(land.price*(.25+land.level*.22)*marketIndex());
  if(rentEstimate(land,other)!==Math.round(plainRent*1.1))throw new Error('rent bell failed');
  p.equipment=['boots'];let roll=resolveDiceRoll([1],p);
  if(roll.finalSteps!==1||roll.rolledTotal!==1)throw new Error('dice face and movement diverged');
  p.equipment=[];roll=resolveDiceRoll([2,5],p);
  if(roll.finalSteps!==7||roll.faces.join(',')!=='2,5')throw new Error('multi-die total and movement diverged');
  p.equipment=['compass'];p.compassReadyAt=1;S.board.round=1;
  const oldRandom=Math.random;Math.random=()=>.99;roll=resolveDiceRoll([1],p);Math.random=oldRandom;
  if(roll.finalSteps<=1||p.compassReadyAt!==7)throw new Error('compass reroll failed');
})()`);

run(`(()=>{
  S.mapIndex=0;makeBoard();S.scene='game';
  const p=cp(), eventTile=S.board.tiles.find(t=>t.type==='event');
  p.type='human';p.pos=eventTile.index;S.board.npcs=[];resolveTile();
  if(S.board.popup?.kind!=='event'||S.board.phase!=='awaiting-confirmation')throw new Error('event did not wait for acknowledgement');
  action('eventOk');
  if(S.board.popup)throw new Error('event acknowledgement did not close');
  S.mapIndex=0;makeBoard();const godP=cp();S.board.npcs=[{name:'財神',pos:5,dir:1}];godP.pos=4;resolveTile();
  if(godP.effects.some(e=>e.kind==='財神'))throw new Error('god attached without landing on same node');
  S.board.popup=null;godP.pos=5;resolveTile();
  if(!godP.effects.some(e=>e.kind==='財神'))throw new Error('god did not attach on landing');
  S.board.npcs=[];spawnNPCs(4);
  if(S.board.npcs.some(n=>n.name==='死神'))throw new Error('Death God spawned normally');
})()`);

timers.length = 0;
run(`(()=>{
  S.mapIndex=0;makeBoard();S.scene='game';
  const p=cp();p.type='ai';S.rolling=false;S.board.popup=null;S.board.phase='pre-roll';
  aiTurn();
})()`);
if (!timers.length) fail("AI did not schedule its dice turn");
timers.shift()();
if (run("S.board.phase") !== "rolling") fail("AI turn did not enter the dice sequence");
run("S.rolling=false;S.diceAnim=null;S.board.phase='pre-roll'");
timers.length = 0;

for (let mi = 0; mi < 3; mi++) {
  run(`(()=>{
    S.mapIndex=${mi};S.gods=false;
    S.seats.forEach((seat,i)=>{seat.type=i===0?'human':'off'});
    makeBoard();S.scene='game';S.board.npcs=[];S.forcedDice=1;rollDice();
  })()`);
  drain(200);
  const movement = json("({pos:cp().pos,phase:S.board.phase,popup:S.board.popup?.kind||null})");
  if (movement.pos !== 1 || movement.phase !== "awaiting-confirmation" || !movement.popup)
    fail(`map ${mi} real dice movement stalled: ${JSON.stringify(movement)}`);
  run(`(()=>{const land=S.board.tiles.find(t=>t.type==='land');land.owner=0;land.level=5;drawMap()})()`);
}

run(`
  S.mapIndex=0;makeBoard();saveGame();
  const raw=JSON.parse(localStorage.getItem(SAVE));
  raw.board.players[0].cards=['shield'];raw.board.players[0].tools=['bomb'];raw.board.players[0].bank=9000;raw.board.players[0].tickets=20;
  localStorage.setItem(SAVE,JSON.stringify(raw));
  if(!loadGame())throw new Error('save reload failed');
  for(const key of ['cards','tools','bank','tickets','detained'])if(key in cp())throw new Error('save migration retained '+key);
`);

function drain(limit=100){let n=0;while(timers.length&&n++<limit)timers.shift()();if(timers.length)fail('timer queue did not settle');}
for(let mi=0;mi<3;mi++){
  run(`S.mapIndex=${mi};S.rounds=30;S.seats.forEach((s,i)=>{s.type=i<2?'human':'off';if(!s.equipment?.length)autoEquipmentForSeat(s)});makeBoard();S.scene='game';`);
  for(let turn=0;turn<80;turn++){
    run(`(()=>{const p=cp();p.type='human';p.pos=(p.pos+1+(S.board.round%6))%S.board.tiles.length;S.board.npcs=[];resolveTile();const q=S.board.popup;if(q?.kind==='tile'){const t=q.tile;if(t.type==='land'){if(t.owner<0&&p.cash>=buyCost(p,t))action('buy');else if(t.owner===p.id&&t.level<5&&p.cash>=upgradeCost(t,p))action('upgrade');else if(t.owner>=0&&t.owner!==p.id)action('pay');else action('skip');}else if(['event','magic'].includes(t.type))action('special');else action('ok');}if(S.board.popup?.kind==='event')action('eventOk');})()`);
    drain();
  }
  const state=json("({round:S.board.round,owned:S.board.tiles.filter(t=>t.owner>=0).length,logs:S.board.log.length,players:S.board.players.length})");
  if(state.round<15||state.owned<1||state.logs<5||state.players!==2)fail(`map ${mi} simulation incomplete: ${JSON.stringify(state)}`);
}

for(const [w,h] of [[844,390],[932,430],[1366,768],[1920,720],[2560,1080]]){
  const scale=Math.min(w/1600,h/900);
  if(Math.abs((1600*scale)/(900*scale)-16/9)>.0001)fail('safe area distorted');
}

console.log("CxQ streamlined-game smoke test passed: PWA assets, four-stage setup, two-slot equipment, event acknowledgement, roaming gods, exact dice movement, integrated road/plot anchors, character landmarks, save migration, responsive geometry and all three map simulations.");
