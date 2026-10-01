const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const browser='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',session='defense-acceptance',tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cxq-complete-')),log=path.join(tmp,'log');
function run(...args){const fd=fs.openSync(log,'w');try{execFileSync(browser,['--session',session,...args],{stdio:['ignore',fd,fd],timeout:60000});}catch(e){console.error(fs.readFileSync(log,'utf8'));throw e;}finally{fs.closeSync(fd);}const text=fs.readFileSync(log,'utf8');console.log(text.trim());return text;}
function check(js){return run('eval',`(async()=>{${js};return 'PASS'})()`);}
function click(selector){run('click',selector);run('wait','body:not(:has(#loading-status[open]))');check(`if(!document.querySelector('#error').hidden)throw Error(document.querySelector('#error').textContent)`);run('snapshot','-i');}
function fit(selector){check(`const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)throw Error('clipped '+${JSON.stringify(selector)})`);}
const diagnostic=`const m=await import(document.querySelector('script[type=module]').src),d=m.diagnostics()`;
(async()=>{try{
 run('set','viewport','390','844');run('open',process.env.DEFENSE_QA_URL||'http://127.0.0.1:4173/games/fairytale-defense/rebuild/army.html');run('wait','[data-ready=true]');run('snapshot','-i');fit('#enter-camp');
 click('#cover-options');fit('#options [data-close]');check(`const o=document.querySelector('#options');if(!o.querySelector('#home').hidden)throw Error('home visible on cover');if(!o.querySelector('.options-body'))throw Error('no scroll container')`);click('#options [data-close]');click('#enter-camp');
 run('wait','1000');run('screenshot','preview/defense-complete-camp390.png');check(`if(document.querySelectorAll('#heroes button').length!==10)throw Error('missing IP hero')`);
 click('#open-collection');check(`window.beforeDraw=JSON.parse(localStorage.getItem('cxq.defense.army.v3')||'null')?.collection?.total||0`);click('#recruit-once');check(`const p=JSON.parse(localStorage.getItem('cxq.defense.army.v3'));if(p.collection.total!==window.beforeDraw+1||!document.querySelector('#recruit-result img'))throw Error('recruit not committed')`);run('screenshot','preview/defense-complete-recruit.png');click('#collection .journey-close');
 click('#squad-info');click('#squad .unit-detail');fit('#unit-guide .journey-close');run('screenshot','preview/defense-complete-unit-guide.png');click('#unit-guide .journey-close');click('#squad [data-close]');
 for(const [w,h] of [[360,640],[412,915],[390,844]]){run('set','viewport',String(w),String(h));fit('#start');fit('#open-collection');click('#camp-settings');fit('#options [data-close]');run('screenshot',`preview/defense-complete-options${w}.png`);click('#options [data-close]');}
 click('#start');click('[data-stage="1"]');click('#briefing-start');
 if(run('eval','document.querySelector("#replace").open').includes('true'))click('#confirm-start');
 click('.pad-hit:nth-child(1)');click('#troop-content button:first-child');check(`${diagnostic};if(d.battle.towers.length!==1)throw Error('deploy failed')`);
 click('.commander-hit');click('#command-zones button:first-child');check(`${diagnostic};const h=d.battle.hero,r=document.querySelector('.commander-hit').style;if(h.x!==355||h.y!==145||!r.left)throw Error('commander visual/logical mismatch')`);
 click('.pad-hit:nth-child(1)');click('#troop-content button:first-of-type');check(`${diagnostic};if(d.battle.towers[0].level!==2)throw Error('upgrade failed')`);
 click('#wave');run('wait','1500');run('screenshot','preview/defense-complete-battle.png');check(`${diagnostic};if(d.battle.phase!=='battle'||d.battle.time<=0||!d.art.includes('unit-archer-ready'))throw Error('battle inactive');window.t=d.battle.time`);
 click('#settings');check(`${diagnostic};if(!d.battle.paused)throw Error('settings did not pause');window.pausedTime=d.battle.time`);run('wait','500');check(`${diagnostic};if(d.battle.time!==window.pausedTime)throw Error('paused time changed');if(d.audio.readyState<2)throw Error('music not decoded')`);click('#options [data-close]');
 run('set','viewport','844','390');check(`${diagnostic};if(!d.battle.paused||document.querySelector('#rotate').hidden)throw Error('landscape not blocked')`);run('set','viewport','390','844');
 click('#settings');click('#home');click('#confirm-home');check(`if(!document.querySelector('#camp').open)throw Error('not back at camp')`);
 run('reload');run('wait','[data-ready=true]');click('#cover-resume');check(`${diagnostic};if(d.battle.phase!=='planning'||d.battle.towers[0].level!==2||d.battle.hero.x!==355)throw Error('resume boundary incorrect')`);
 if(run('errors').trim())throw Error('browser errors');console.log('PASS complete UI: cover,10 heroes,recruit commit,guide,3 sizes,deploy,upgrade,commander,battle,pause,audio,landscape,home,reload.');
 }finally{run('close');fs.unlinkSync(log);fs.rmdirSync(tmp);}})().catch(e=>{console.error(e);process.exitCode=1});
