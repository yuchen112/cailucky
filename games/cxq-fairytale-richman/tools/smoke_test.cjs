const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const swContext = vm.createContext({
  self: { addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
  caches: {},
  fetch() {},
});
vm.runInContext(
  fs.readFileSync(path.join(root, "sw.js"), "utf8") +
    ";this.precache=PRECACHE;this.cacheName=CACHE",
  swContext,
);
for (const item of swContext.precache) {
  const target =
    item === "./" ? path.join(root, "index.html") : path.resolve(root, item);
  if (!fs.existsSync(target))
    throw new Error(`service worker precache missing: ${item}`);
}
const projectAssets = [];
function collectAssets(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collectAssets(full);
    else if (/\.(?:webp|png)$/i.test(entry.name)) projectAssets.push(full);
  }
}
collectAssets(path.join(root, "assets"));
for (const file of projectAssets) {
  const cachePath = "./" + path.relative(root, file).replaceAll("\\", "/");
  if (!swContext.precache.includes(cachePath))
    throw new Error(`unused or uncached project asset remains: ${cachePath}`);
}
const expectedRevision = "20260825-2015";
if (!swContext.cacheName.includes(expectedRevision))
  throw new Error("service worker cache revision is stale");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8"),
  coreSource = fs.readFileSync(path.join(root, "core.js"), "utf8"),
  versionSource = fs.readFileSync(path.join(root, "version.txt"), "utf8");
for (const asset of ["manifest.webmanifest", "core.js", "viewport.js", "game.js", "sw.js"])
  if (!htmlSource.includes(`${asset}?v=${expectedRevision}`))
    throw new Error(`entry version mismatch: ${asset}`);
if (!coreSource.includes(`const ASSET_REV = "${expectedRevision}"`))
  throw new Error("runtime asset revision is stale");
if (coreSource.includes("function resize()"))
  throw new Error("legacy viewport scaler still competes with viewport.js");
if (!versionSource.includes(expectedRevision))
  throw new Error("version file is stale");
if (!fs.readFileSync(path.join(root, "sw.js"), "utf8").includes("ignoreSearch:true"))
  throw new Error("versioned asset requests have no offline precache fallback");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"),
);
for (const size of ["192x192", "512x512"])
  if (!manifest.icons?.some((icon) => icon.sizes === size))
    throw new Error(`PWA manifest missing ${size} icon`);
const storage = new Map();
const timers = [];
const draw = new Proxy(
  {},
  {
    get(target, key) {
      if (key === "measureText")
        return (value) => ({ width: String(value).length * 13 });
      if (key === "canvas") return canvas;
      if (!(key in target)) target[key] = () => {};
      return target[key];
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  },
);
const canvas = {
  width: 1600,
  height: 900,
  style: {},
  getContext: () => draw,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }),
  addEventListener() {},
};
class MockImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 1254;
    this.naturalHeight = 1254;
  }
  set src(value) {
    this._src = value;
    if (this.onload) this.onload();
  }
  get src() {
    return this._src;
  }
}
const sandbox = {
  console,
  Image: MockImage,
  performance: { now: () => 1000 },
  devicePixelRatio: 1,
  innerWidth: 1600,
  innerHeight: 900,
  requestAnimationFrame() {},
  setTimeout(fn) {
    timers.push(fn);
    return timers.length;
  },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  addEventListener() {},
  navigator: { vibrate() {} },
  screen: {},
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
  document: {
    getElementById: () => canvas,
    addEventListener() {},
    body: { dataset: {} },
    documentElement: {},
  },
  window: null,
};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const file of ["core.js", "game.js"])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
const loadedAssets = JSON.parse(
  vm.runInContext("JSON.stringify(Object.values(IM).map(image=>image._src).filter(Boolean))", context),
);
const precacheSet = new Set(swContext.precache);
for (const source of loadedAssets) {
  const clean = source.replace(/\?.*$/, ""),
    cachePath = clean.startsWith("../") || clean.startsWith("./") ? clean : "./" + clean;
  if (!precacheSet.has(cachePath))
    throw new Error(`runtime asset is absent from Safari/PWA precache: ${clean}`);
}
vm.runInContext(
  `
  home(); setup(); mapSelect(); rulesSetup();
  makeBoard();
  S.board.tiles.filter(t=>t.type==='land').slice(0,4).forEach((t,i)=>{t.owner=0;t.level=Math.min(3,i)});
  game(); hud(); openPopup('roster'); popup(); openPopup('playerDetail',{player:S.board.players[0]}); popup();
  openPopup('event',{name:'王國節慶',desc:'獲得 $6,000'});popup();
  openPopup('npc',{name:'財神',desc:'獲得 $8,000'});popup();
  for(let kind=0;kind<3;kind++){S.board.mini={kind,pos:.5,name:['星光接接樂','月港氣球祭','雲端寶箱'][kind],winningChest:1};openPopup('mini',{name:S.board.mini.name});popup()}
  openPopup('tileInspect',{tile:S.board.tiles.find(t=>t.type==='land')});popup();
  S.scene='result'; S.board.winner=S.board.players[0]; result();
`,
  context,
);
function buttonsFor(code) {
  vm.runInContext(`S.buttons=[];${code}`, context);
  return JSON.parse(vm.runInContext("JSON.stringify(S.buttons)", context));
}
function overlap(a, b) {
  return (
    Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y)
  );
}
function allowedNested(a, b) {
  const pair = [a.id, b.id].join("|");
  return (
    /^seat\d\|(?:seatType|diff)\d$/.test(pair) ||
    /^(?:seatType|diff)\d\|seat\d$/.test(pair)
  );
}
for (const [scene, code] of [
  ["setup", 'S.scene="setup";setup()'],
  ["map", 'S.scene="mapSelect";mapSelect()'],
  ["rules", 'S.scene="rules";rulesSetup()'],
  ["game", 'S.scene="game";S.board.popup=null;game()'],
  ["branch", 'S.scene="game";openPopup("branch",{choices:[9,13]});game()'],
  ["cardTileTarget", 'S.scene="game";cp().cards=["teleport"];openPopup("cardTileTarget",{cardIndex:0,targets:[1,2,3,4,5,6]});game()'],
  ["tools", 'S.scene="game";cp().tools=["speed","car","roadblock","bomb"];openPopup("tools");game()'],
  ["toolTileTarget", 'S.scene="game";cp().tools=["roadblock"];openPopup("toolTileTarget",{toolIndex:0,targets:[1,2,3,4,5,6]});game()'],
  ["toolTarget", 'S.scene="game";cp().tools=["bomb"];openPopup("toolTarget",{toolIndex:0});game()'],
  ["roster", 'S.scene="game";openPopup("roster");game()'],
  [
    "playerOverview",
    'S.scene="game";openPopup("playerDetail",{player:cp(),tab:"overview"});game()',
  ],
  [
    "playerLands",
    'S.scene="game";openPopup("playerDetail",{player:cp(),tab:"lands"});game()',
  ],
  [
    "playerCards",
    'S.scene="game";openPopup("playerDetail",{player:cp(),tab:"cards"});game()',
  ],
  [
    "playerTools",
    'S.scene="game";cp().tools=["speed","car","roadblock","bomb"];openPopup("playerDetail",{player:cp(),tab:"tools"});game()',
  ],
  [
    "playerEffects",
    'S.scene="game";openPopup("playerDetail",{player:cp(),tab:"effects"});game()',
  ],
  [
    "shop",
    'S.scene="game";S.board.shopStock=CARD_POOL.slice(0,6);openPopup("shop");game()',
  ],
  [
    "shopTools",
    'S.scene="game";S.board.toolStock=TOOL_POOL.slice(0,4);openPopup("shop",{tab:"tools"});game()',
  ],
  [
    "event",
    'S.scene="game";openPopup("event",{name:"王國節慶",desc:"獲得獎勵"});game()',
  ],
  [
    "detainedEvent",
    'S.scene="game";cp().cards=["bail"];openPopup("event",{name:"警察局停留",desc:"尚需停留",detainedTurn:true,facility:"jail",releaseIndex:0});game()',
  ],
  [
    "npc",
    'S.scene="game";openPopup("npc",{name:"財神",desc:"獲得獎勵"});game()',
  ],
  [
    "miniStar",
    'S.scene="game";S.board.mini={kind:0,pos:.5,name:"星光接接樂"};openPopup("mini",{name:S.board.mini.name});game()',
  ],
  [
    "miniBalloon",
    'S.scene="game";S.board.mini={kind:1,pos:.5,name:"月港氣球祭"};openPopup("mini",{name:S.board.mini.name});game()',
  ],
  [
    "miniTreasure",
    'S.scene="game";S.board.mini={kind:2,pos:.5,name:"雲端寶箱",winningChest:1};openPopup("mini",{name:S.board.mini.name});game()',
  ],
  [
    "inspect",
    'S.scene="game";openPopup("tileInspect",{tile:S.board.tiles.find(t=>t.type==="land")});game()',
  ],
  ["result", 'S.scene="result";result()'],
]) {
  const buttons = buttonsFor(code);
  for (const b of buttons) {
    if (b.x < 0 || b.y < 0 || b.x + b.w > 1600 || b.y + b.h > 900)
      throw new Error(`${scene}: ${b.id} outside safe area`);
  }
  for (let i = 0; i < buttons.length; i++)
    for (let j = i + 1; j < buttons.length; j++)
      if (
        overlap(buttons[i], buttons[j]) &&
        !allowedNested(buttons[i], buttons[j])
      )
        throw new Error(`${scene}: ${buttons[i].id} overlaps ${buttons[j].id}`);
}
for (const [w, h] of [
  [932, 430],
  [1247, 787],
  [1366, 768],
  [1920, 720],
  [2560, 1080],
]) {
  const scale = Math.min(w / 1600, h / 900),
    safeW = 1600 * scale,
    safeH = 900 * scale;
  if (Math.abs(safeW / safeH - 16 / 9) > 0.0001)
    throw new Error("safe area distorted");
}
vm.runInContext(
  `
  if(new Set(CARD_DEFS.map(c=>c.cover)).size!==CARD_DEFS.length)throw new Error('card covers are not unique');
  if(new Set(EVENTS.map(e=>e[3])).size!==EVENTS.length||EVENTS.some(e=>!e[3]||!IM['event_'+e[3]]?.complete))throw new Error('every event must have unique dedicated art');
  if(!TURN_PHASES.has('awaiting-confirmation')||!TURN_PHASES.has('branch-choice'))throw new Error('turn state machine phases are incomplete');
  S.scene='game';S.mapIndex=0;makeBoard();
  if(S.board.phase!=='pre-roll')throw new Error('new match does not enter pre-roll state');
  cp().type='ai';action('roll');
  if(S.rolling||S.board.phase!=='pre-roll')throw new Error('human input rolled during an AI turn');
  cp().type='human';setTurnPhase('awaiting-confirmation');rollDice();
  if(S.rolling||S.board.phase!=='awaiting-confirmation')throw new Error('dice started outside pre-roll state');
  S.board.popup=null;S.board.npcs=[];const phaseEvent=S.board.tiles.find(t=>t.type==='event');cp().pos=phaseEvent.index;resolveTile();
  if(S.board.phase!=='awaiting-confirmation'||!S.board.popup)throw new Error('arrival result did not wait for player confirmation');
  action('special');
  if(S.board.phase!=='awaiting-confirmation'||S.board.popup?.kind!=='event')throw new Error('event result did not remain paused for acknowledgement');
  action('eventOk');
  if(S.board.popup||S.board.phase!=='pre-roll')throw new Error('confirmed result did not advance to the next pre-roll state: '+JSON.stringify({phase:S.board.phase,popup:S.board.popup,turn:S.board.turn,round:S.board.round}));
  if(IM.homeBg.fetchPriority!=='high'||IM.homeMenuNew.fetchPriority!=='high')throw new Error('home-critical art is not prioritized');
  if(!IM.actionConsole?.complete)throw new Error('image-backed action console missing');
  if(!IM.tile_land?._src?.includes('land_parcel_v1.webp'))throw new Error('roadside land parcel art is not active');
  for(let i=1;i<=6;i++)if(!IM['diceThrow'+i]?._src?.includes('_v2.webp'))throw new Error('physical throw die missing for face '+i);
  for(const key of ['speed','car','roadblock','bomb'])if(!IM['tool_'+key]?.complete)throw new Error('tool art missing: '+key);
  for(const key of ['npcWealth','npcFortune','npcPoverty','npcMisfortune','npcLand','npcAngel','npcDemon','npcDeath'])if(!IM[key]?.complete)throw new Error('independent roaming-god art missing: '+key);
  if(CARD_POOL.some(id=>cardDef(id).kind==='tool')||TOOL_POOL.some(id=>cardDef(id).kind!=='tool'))throw new Error('cards and tools are mixed in their pools');
  for(const key of ['buildingSpecialHotel','buildingSpecialMall','buildingSpecialPark'])if(!IM[key]?.complete)throw new Error('special building art missing: '+key);
  for(const key of CHAR_KEYS)if(!IM['landmark_'+key]?.complete)throw new Error('character landmark art missing: '+key);
  for(const key of CHAR_KEYS)if(!IM[key+'WalkRightContact']?.complete||!IM[key+'WalkRightPassing']?.complete)throw new Error('character walk animation missing for '+key);
  S.scene='setup';S.activeSeat=0;S.pickAnim=null;SETUP_VIEW.char=1;chooseChar(1);
  if(!S.pickAnim)throw new Error('selection did not start character walk-in');drawPickAnim();S.pickAnim=null;
  if(TYPE_PATTERN.includes('npc'))throw new Error('fixed god tile still exists');
  for(const required of ['bank','news','coupon','magic','hospital','police','shop','card','minigame'])if(!TYPE_PATTERN.includes(required))throw new Error('missing board facility '+required);
  for(const [key,route] of Object.entries(MAP_ROUTES)){
    const xs=route.map(p=>p[0]),ys=route.map(p=>p[1]);
    if(route.length!==36||Math.max(...xs)-Math.min(...xs)<2150||Math.max(...ys)-Math.min(...ys)<1100)throw new Error(key+' route does not span its authored oval road');
    if(route.some(([x,y])=>x<350||x>2850||y<270||y>1530))throw new Error(key+' route falls outside the visible road band');
  }
  const routeFingerprints=Object.values(MAP_ROUTES).map(route=>route.map(p=>p.join(',')).join('|'));
  if(new Set(routeFingerprints).size!==MAPS.length)throw new Error('maps must not share generated route coordinates');
  for(const map of MAPS)if(!map.road||MAP_ROUTES[map.key][0][1]!==Math.round(map.road.cy+map.road.ry))throw new Error(map.key+' route is not derived from its own authored road geometry');
  for(const map of MAPS){S.mapIndex=MAPS.indexOf(map);makeBoard();for(const tile of S.board.tiles){const road=roadAnchor(tile),plot=plotAnchor(tile);if(road.x!==tile.x||road.y!==tile.y)throw new Error('road anchor drifted from movement tile');if(tile.type==='land'&&Math.hypot(plot.x-road.x,plot.y-road.y)<100)throw new Error('land plot overlaps pawn road anchor');}}
  S.mapIndex=0;makeBoard();S.board.players[0].pos=4;S.board.players[1].pos=4;drawPlayers();
  if(S.board.players.some(p=>!Number.isFinite(p.pos)))throw new Error('same-tile player layout corrupted pawn positions');
  S.mapIndex=0;makeBoard();S.scene='game';
  const roadsideLand=S.board.tiles.find(t=>t.type==='land'), roadsidePos=tileVisualPosition(roadsideLand);
  if(roadsidePos.x===roadsideLand.x&&roadsidePos.y===roadsideLand.y)throw new Error('land parcel still overlaps its road movement coordinate');
  if(roadsidePos.x<0||roadsidePos.y<0||roadsidePos.x>MW||roadsidePos.y>MH)throw new Error('roadside land parcel is outside the board');
  S.board.round=1;if(marketIndex()!==1)throw new Error('opening price index is invalid');
  S.board.round=21;if(marketIndex()!==1.2)throw new Error('round-driven price index did not advance');
  const economyLand=S.board.tiles.find(t=>t.type==='land');
  economyLand.level=2;
  if(upgradeCost(economyLand)!==Math.round(economyLand.price*(.61+3*.07)*marketIndex()))throw new Error('canonical upgrade cost is inconsistent');
  S.board.round=1;
  const startCash=cp().cash;cp().pos=0;resolveTile();
  if(cp().cash!==startCash)throw new Error('landing on start duplicated the passing allowance');
  S.board.popup=null;
  if(S.board.turnBanner?.player!==0)throw new Error('opening turn banner missing');turnBannerHud();
  if(Object.keys(MAP_BRANCHES).length)throw new Error('oval maps expose an invisible route fork');
  S.board.npcs=[{name:'財神',pos:5,dir:1}];spawnNPCs(3);
  if(S.board.npcs.length!==3||S.board.npcs.filter(n=>n.name==='財神').length!==1)throw new Error('roaming gods were replaced or duplicated while replenishing');
  const godP=cp();godP.effects=[{kind:'財神',turns:4}];S.board.npcs=S.board.npcs.filter(n=>n.name!=='財神');spawnNPCs(3);
  if(S.board.npcs.some(n=>n.name==='財神'))throw new Error('attached god respawned on the map');
  S.board.npcs=[{name:'窮神',pos:godP.pos,dir:1}];applyNPCByName('窮神',godP);
  if(!godP.effects.some(e=>e.kind==='窮神')||godP.effects.some(e=>e.kind==='財神')||!S.board.npcs.some(n=>n.name==='財神'))throw new Error('god replacement did not release the former companion');
  godP.effects=[{kind:'窮神',turns:1}];S.board.npcs=[];tickEffects(godP);
  if(godP.effects.length||!S.board.npcs.some(n=>n.name==='財神'))throw new Error('expired god did not transform and return to roaming state');
  S.board.popup=null;godP.effects=[];S.board.npcs=[{name:'乞丐',pos:godP.pos,dir:1}];const beforeBeggar=godP.cash;applyNPCByName('乞丐',godP);
  if(godP.cash!==beforeBeggar-1000||godP.effects.some(e=>e.kind==='乞丐'))throw new Error('transient NPC was incorrectly attached as a multi-turn god');
  S.board.popup=null;S.board.npcs=[];spawnNPCs(3);
  const cardP=cp(), cardOpponent=S.board.players[1];S.board.phase='pre-roll';
  cardP.cards=['shield'];S.board.phase='arrival';useCard(0);if(cardP.cards.length!==1||cardP.shield)throw new Error('card was consumed outside pre-roll phase');S.board.phase='pre-roll';
  cardP.cards=['shield'];useCard(0);if(cardP.shield!==1||cardP.cards.length)throw new Error('shield card flow failed');
  const negativeTile=S.board.tiles.find(t=>t.type==='event'),negativeIndex=EVENTS.findIndex(e=>e[0]==='突發修繕'),cashBeforeShield=cardP.cash,oldRandom=Math.random;Math.random=()=>((negativeIndex+.1)/EVENTS.length);applySpecial(negativeTile,cardP);Math.random=oldRandom;
  if(cardP.cash!==cashBeforeShield||cardP.shield!==0)throw new Error('shield did not cancel a negative event');S.board.popup=null;
  cardP.cards=['remote'];useCard(0);useChosenDice(4);if(S.forcedDice!==4||cardP.cards.length)throw new Error('chosen-dice card flow failed');
  cardP.cards=['stop'];useCard(0);useTargetCard(cardOpponent.id);if(cardOpponent.skip!==1||cardP.cards.length)throw new Error('target stop-card flow failed');
  const teleportTarget=S.board.tiles.find(t=>t.type==='event');cardP.cards=['teleport'];useCard(0);action('cardTile'+teleportTarget.index);
  if(cardP.pos!==teleportTarget.index||cardP.cards.length)throw new Error('teleport target flow failed');
  const purchaseTarget=S.board.tiles.find(t=>t.type==='land'&&t.owner<0);cardP.pos=purchaseTarget.index;cardP.cards=['buyland'];cardP.cash=500000;useCard(0);action('cardTile'+purchaseTarget.index);
  if(purchaseTarget.owner!==cardP.id||cardP.cards.length)throw new Error('land-purchase target flow failed');
  purchaseTarget.level=0;cardP.cards=['upgrade'];useCard(0);action('cardTile'+purchaseTarget.index);if(purchaseTarget.level!==1||cardP.cards.length)throw new Error('free-upgrade card flow failed');
  purchaseTarget.level=4;purchaseTarget.special=null;cardP.cards=['upgrade'];const cashBeforeFreeBuild=cardP.cash;useCard(0);action('cardTile'+purchaseTarget.index);
  if(S.board.popup?.kind!=='specialBuild'||cardP.cards.length!==1)throw new Error('level-four upgrade card skipped large-building selection');action('buildHotel');
  if(purchaseTarget.level!==5||purchaseTarget.special!=='hotel'||cardP.cards.length||cardP.cash!==cashBeforeFreeBuild||S.board.phase!=='pre-roll')throw new Error('free large-building upgrade flow failed');
  cardP.cards=['discount','rent'];useCard(0);useCard(0);if(cardP.discount!==1||cardP.rentBoost!==1||cardP.cards.length)throw new Error('property effect-card flow failed');
  cardP.cards=['hospitalpass'];useCard(0);admitPlayer(cardP,'hospital',2,'test');if(cardP.detained||cardP.hospitalPass!==0)throw new Error('hospital pass did not prevent admission');S.board.popup=null;
  cardP.cards=['bail'];useCard(0);admitPlayer(cardP,'jail',2,'test');if(cardP.detained||cardP.bailPass!==0)throw new Error('bail card did not prevent detention');S.board.popup=null;
  cardP.cards=[];cardP.pos=0;admitPlayer(cardP,'hospital',2,'test');if(cardP.pos!==S.board.tiles.find(t=>t.type==='hospital').index||cardP.detained?.facility!=='hospital')throw new Error('hospital admission did not move the player to the facility');cardP.detained=null;cardP.skip=0;S.board.popup=null;
  cardP.pos=S.board.tiles.find(t=>t.type==='police').index;applySpecial(S.board.tiles[cardP.pos],cardP);if(cardP.detained)throw new Error('ordinary police-station landing incorrectly detained the player');S.board.popup=null;
  cardP.cards=['bail'];cardP.detained={facility:'jail',turns:2};cardP.skip=2;openPopup('event',{name:'拘留',desc:'test',detainedTurn:true,facility:'jail',releaseIndex:0});action('releaseDetained');if(cardP.detained||cardP.skip||cardP.cards.length)throw new Error('detention release action failed');
  S.board.turn=0;const testP=cp(); testP.tools=['speed'];S.board.phase='pre-roll';useTool(0);
  if(testP.diceCount!==2||testP.vehicleTurns!==5)throw new Error('vehicle card did not enable multi-dice turns');
  testP.tools=['car'];S.board.phase='pre-roll';useTool(0);
  if(testP.diceCount!==3||testP.vehicle!=='car')throw new Error('car tool did not enable three-dice turns');
  testP.tools=['roadblock'];S.board.phase='pre-roll';useTool(0);
  const roadTarget=S.board.popup.targets[0];action('toolTile'+roadTarget);
  if(!S.board.roadblocks.includes(roadTarget)||testP.tools.length)throw new Error('roadblock tool was not placed on a selected road node');
  testP.tools=['roadblock'];S.board.roadblocks=Array.from({length:6},(_,n)=>(testP.pos+n+1)%S.board.tiles.length);useTool(0);
  if(S.board.popup?.kind!=='tools'||!S.board.popup.error||testP.tools.length!==1)throw new Error('roadblock was consumed without a valid target');S.board.popup=null;
  testP.tools=['bomb'];S.board.phase='pre-roll';useTool(0);
  const bombTarget=S.board.players[1];action('toolTarget'+bombTarget.id);
  if(bombTarget.bombSteps!==12||testP.tools.length)throw new Error('timed bomb was not attached to the selected player');
  testP.tools=['bomb'];useTool(0);if(S.board.popup?.kind!=='tools'||!S.board.popup.error||testP.tools.length!==1)throw new Error('bomb was consumed when every opponent already carried one');S.board.popup=null;
  const miniTurn=S.board.turn,miniCash=testP.cash;setTurnPhase('awaiting-confirmation');S.board.mini={kind:0,pos:.42,target:.42,dir:1,last:performance.now(),speed:.72,name:'星光接接樂'};openPopup('mini',{name:'星光接接樂'});action('miniStop');
  if(S.board.popup?.kind!=='miniResult'||testP.cash<=miniCash||S.board.turn!==miniTurn)throw new Error('minigame result did not pause for acknowledgement');action('miniResultOk');
  if(S.board.popup||S.board.turn===miniTurn)throw new Error('acknowledged minigame result did not end the turn');
  cp().cards=Array(20).fill('shield'); saveGame();
  if(!loadGame()||cp().cards.length!==15)throw new Error('save migration did not enforce 15-card capacity');
  cp().cards=['speed','roadblock','shield'];cp().tools=[];saveGame();
  if(!loadGame()||!cp().tools.includes('speed')||!cp().tools.includes('roadblock')||cp().cards.join(',')!=='shield')throw new Error('legacy tool cards were not migrated out of the card book');
  for(let mi=0;mi<MAPS.length;mi++){
    S.mapIndex=mi; makeBoard();
    for(let ri=0;ri<4;ri++)if(REGION_NAMES[ri]!==MAPS[mi].regions[ri])throw new Error('map region label mismatch');
    const lands=S.board.tiles.filter(t=>t.type==='land'&&t.region===0);
    lands.forEach(t=>{t.owner=0;t.level=5});
    if(buildingImage(lands[0])!==IM['landmark_'+CHAR_KEYS[S.board.players[0].char]])throw new Error('completed region did not use its owner character landmark');
    lands[0].owner=1;
    if(buildingImage(lands[1])!==IM['building'+mi+'_5'])throw new Error('incomplete region did not use its level-five art');
    lands[1].level=4;
    if(buildingImage(lands[1])!==IM['building'+mi+'_4'])throw new Error('level-four art is not distinct');
    lands[1].level=5;lands[1].special='hotel';
    if(buildingImage(lands[1])!==IM.buildingSpecialHotel)throw new Error('hotel did not use dedicated art');
    lands[1].special='mall';if(buildingImage(lands[1])!==IM.buildingSpecialMall)throw new Error('mall did not use dedicated art');
    lands[1].special='park';if(buildingImage(lands[1])!==IM.buildingSpecialPark)throw new Error('park did not use dedicated art');
  }
  S.mapIndex=0;makeBoard();
  const owner=S.board.players[0], land=S.board.tiles.find(t=>t.type==='land');
  land.owner=owner.id;land.level=1;owner.rentBoost=1;rentEstimate(land,S.board.players[1]);
  if(owner.rentBoost!==1)throw new Error('rent preview consumed the rent boost');
  rentFor(land,S.board.players[1]);
  if(owner.rentBoost!==0)throw new Error('rent boost was not consumed by an actual rent calculation');
  land.level=5;land.special='hotel';
  const hotelRent=rentEstimate(land,S.board.players[1]);land.special='park';
  if(hotelRent<=rentEstimate(land,S.board.players[1]))throw new Error('large-building rent identities are not distinct');
`,
  context,
);
function drainTimers(limit = 20) {
  let count = 0;
  while (timers.length && count++ < limit) timers.shift()();
  if (timers.length) throw new Error("timer queue did not settle");
}
for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
  vm.runInContext(
    `
    S.scene='game';S.mapIndex=${mapIndex};S.money=200000;S.rounds=30;
    S.seats.forEach((s,i)=>{s.type=i<2?'human':'off'});makeBoard();
  `,
    context,
  );
  for (let turn = 0; turn < 90; turn++) {
    vm.runInContext(
      `(()=>{
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
      if(S.board.popup?.kind==='miniResult')action('miniResultOk');
    })()`,
      context,
    );
    drainTimers();
  }
  const outcome = JSON.parse(
    vm.runInContext(
      `JSON.stringify({round:S.board.round,logs:S.board.log.length,owned:S.board.tiles.filter(t=>t.owner>=0).length,players:S.board.players.length})`,
      context,
    ),
  );
  if (
    outcome.round < 20 ||
    outcome.logs < 4 ||
    outcome.owned < 1 ||
    outcome.players !== 2
  )
    throw new Error(
      `map ${mapIndex} match simulation incomplete: ${JSON.stringify(outcome)}`,
    );
}
console.log(
  "CxQ smoke/layout test passed: scenes, HUD, player-data views, separate card/tool inventories, unique art, coupon shop, facilities, roaming-god rules, independent map routes, multi-dice vehicles, save migration, buildings, rent rules, three complete simulated matches, button bounds, overlap rules and five landscape aspect ratios.",
);
