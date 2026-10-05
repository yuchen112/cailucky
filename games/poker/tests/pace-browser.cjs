const {execFileSync}=require('node:child_process');
const bin='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const url=process.env.POKER_QA_URL||'http://127.0.0.1:4182/games/poker/?v=20261006-pace1';
function run(...args){return execFileSync(bin,['--session','poker-pace',...args],{encoding:'utf8',timeout:45000}).trim();}
function read(js){return JSON.parse(run('eval',js));}
function wait(js,label){const end=Date.now()+20000;while(Date.now()<end){if(read(js))return;run('wait','200');}throw Error(label);}
function click(action){run('click','[data-action="'+action+'"]');}
const table='JSON.parse(localStorage.getItem("cxq.poker.v1")).table';
run('set','viewport','915','412');run('open',url);
if(url.startsWith('http://127.0.0.1')){run('eval','localStorage.removeItem("cxq.poker.v1")');run('reload');}
click('lobby');run('click','[data-game=dragon]');click('open');
if(read('!!document.querySelector("#modal[open]")')){run('find','role','button','click','--name','我了解，返回開桌');click('open');}
run('eval','window.paceErrors=[];new MutationObserver(()=>{const p=JSON.parse(localStorage.getItem("cxq.poker.v1"));if(document.querySelector(".result-panel")&&p.table.type==="dragon"&&p.table.dragonTurns.length!==4)window.paceErrors.push("partial settlement");}).observe(document.querySelector("#app"),{childList:true,subtree:true});true');
for(let round=1;round<=5;round++){
 wait('!!document.querySelector("[data-action=pass]:not([disabled])")','player turn');
 wait('!document.querySelector("#app").hasAttribute("aria-busy")','player animation readiness');
 click(round===1?'bet':'pass');
 wait(table+'.phase==="roundEnd"||'+table+'.phase==="tableEnd"','automatic computer turns');
 wait('!document.querySelector("#app").hasAttribute("aria-busy")','animation recovery');
 if(!read(table+'.dragonTurns.length===4'))throw Error('incomplete round');
 if(round===1){run('screenshot','preview/poker-pace-result.png');if(!read('JSON.stringify([...document.querySelectorAll(".result-reveal [data-face]")].map(x=>x.dataset.face))===JSON.stringify('+table+'.dragonTurns[0].cards)'))throw Error('wrong player reveal');}
 if(round<5)click('next');
}
if(!read('window.paceErrors.length===0'))throw Error('computer-only settlement');
if(!read('JSON.parse(localStorage.getItem("cxq.poker.v1")).stats.dragon.rounds===5'))throw Error('wrong rounds');
click('leave');run('click','[data-game=blackjack]');click('open');wait('!!document.querySelector("[data-action=bet]")&&!document.querySelector("#app").hasAttribute("aria-busy")','blackjack ready');click('bet');
if(read(table+'.phase!=="roundEnd"&&'+table+'.phase!=="tableEnd"&&'+table+'.turn===0')){wait('!document.querySelector("#app").hasAttribute("aria-busy")','deal animation');click('stand');}
wait(table+'.phase==="roundEnd"||'+table+'.phase==="tableEnd"','blackjack computer continuation');
if(run('errors'))throw Error('browser errors');
for(const [w,h] of [[740,360],[844,390],[915,412]]){run('set','viewport',String(w),String(h));if(!read('document.documentElement.scrollWidth<=innerWidth'))throw Error('horizontal overflow');}
run('screenshot','preview/poker-pace-blackjack.png');
console.log('PASS five player turns/five complete rounds, automatic computer actions, player reveal, blackjack completion and three landscape sizes.');
