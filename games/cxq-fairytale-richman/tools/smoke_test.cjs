const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
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
console.log('CxQ canvas smoke test passed: scenes, HUD, property buildings, roster and result rendered without exceptions.');
