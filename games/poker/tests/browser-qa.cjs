const { execFileSync } = require("node:child_process");
const path = require("node:path");
const bin =
  "C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe";
const session = "pokerqa";
function run(...args) {
  return execFileSync(bin, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 60000,
  });
}
function evaluate(s) {
  return run("eval", s);
}
const game = process.argv[2] || "big2";
console.log(
  evaluate(
    `(async()=>{const E=await import('./engine.mjs');const p=E.createProfile();p.acknowledged=true;p.settings.fast=true;p.settings.music='off';localStorage.setItem('cxq.poker.v1',JSON.stringify(p));return 'isolated QA profile';})()`,
  ),
);
console.log(run("open", "http://127.0.0.1:4173/games/poker/?qa=" + game));
console.log(run("snapshot", "-i"));
console.log(
  evaluate(`document.querySelector('[data-action="lobby"]').click()`),
);
console.log(run("snapshot", "-i"));
console.log(
  evaluate(`document.querySelector('[data-game="${game}"]').click()`),
);
console.log(run("snapshot", "-i"));
console.log(
  run(
    "screenshot",
    path.resolve(__dirname, "../../../preview/poker-" + game + "-setup.png"),
  ),
);
console.log(evaluate(`document.querySelector('[data-action="open"]').click()`));
console.log(run("wait", ".table-screen"));
console.log(run("snapshot", "-i"));
console.log(
  run(
    "screenshot",
    path.resolve(__dirname, "../../../preview/poker-" + game + "-play.png"),
  ),
);
for (let chunk = 0; chunk < 8; chunk++) {
  const result = evaluate(
    `(async()=>{const E=await import('./engine.mjs');const start=Date.now();let actions=0;const click=a=>{const b=document.querySelector('[data-action="'+a+'"]');if(b&&!b.disabled){b.click();actions++;}};while(Date.now()-start<18000){const p=JSON.parse(localStorage.getItem('cxq.poker.v1')),t=p.table;if(['roundEnd','tableEnd'].includes(t.phase))return {finished:true,game:t.type,actions,result:t.result};if(t.type==='thirteen'){if(document.querySelector('.message')?.textContent.includes('正在理牌')){await new Promise(r=>setTimeout(r,100));continue;}if(document.querySelectorAll('[data-action="unplace"]').length===13)click('arrange-submit');else click('arrange-auto');}else if(t.turn===0){if(t.phase==='betting')click('bet');else{const a=E.autoAction(t);if(a.cards){for(const c of a.cards){const b=document.querySelector('[data-card="'+c+'"][data-action="select"]');if(b&&!b.classList.contains('selected'))b.click();}if(a.target)document.querySelector('[data-card="'+a.target+'"][data-action="target"]')?.click();click('play');}else if(a.type==='draw')document.querySelector('[data-action="draw"][data-index="'+a.index+'"]')?.click();else click(a.type);}}await new Promise(r=>setTimeout(r,100));}return {finished:false,actions,toast:document.querySelector('#toast').textContent};})()`,
  );
  console.log(result);
  if (result.includes('"finished": true')) break;
  if (chunk === 7) throw Error("UI round did not finish");
}
console.log(evaluate('(async()=>{while(document.querySelector("#app").getAttribute("aria-busy")==="true")await new Promise(r=>setTimeout(r,50));await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));return "animations settled";})()'));
console.log(run("snapshot", "-i"));
console.log(
  run(
    "screenshot",
    path.resolve(__dirname, "../../../preview/poker-" + game + "-result.png"),
  ),
);
console.log(
  evaluate(
    `(()=>{const bad=[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);if(bad.length)throw Error("Broken images: "+bad.join(","));if(document.documentElement.scrollWidth>innerWidth)throw Error("Horizontal overflow");return {brokenImages:bad,overflow:false};})()`,
  ),
);
console.log(
  evaluate(`document.querySelector('[data-action="leave"]').click()`),
);
console.log(
  evaluate(`JSON.parse(localStorage.getItem('cxq.poker.v1')).table===null`),
);
console.log(run("errors"));
