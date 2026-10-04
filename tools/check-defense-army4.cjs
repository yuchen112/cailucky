// Isolated QA profile. Do not inspect or replace the user's active browser saves.
const {execFileSync}=require('node:child_process'),fs=require('node:fs');
const bin='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',session='defense-army4',results=[];
function run(...args){return execFileSync(bin,['--session',session,...args],{encoding:'utf8',timeout:90000}).trim();}
function check(js,label){if(!run('eval',js).includes('true'))throw Error(label);results.push(label);}
function click(selector){run('scrollintoview',selector);run('click',selector);run('snapshot','-i');}
try{
 run('set','viewport','390','700');run('open',process.env.DEFENSE_QA_URL||'http://127.0.0.1:4173/games/fairytale-defense/rebuild/army.html');run('wait','[data-ready=true]');run('snapshot','-i');
 run('eval',"const module=await import(new URL('army-save.mjs?v=20261004-army3',location.href));const profile=module.newArmySave();profile.mastery.xp.growth=2000;profile.mastery.xp.hope=2000;localStorage.setItem('cxq.defense.army.v3',JSON.stringify(profile));true");run('reload');run('wait','[data-ready=true]');run('snapshot','-i');
 click('#enter-camp');click('#cultivate');click('[data-tab=build]');check("getComputedStyle(document.querySelector('#build>section')).display==='none'","guide hidden in configuration tab");
 run('select','#build label:first-of-type select','grove');run('snapshot','-i');check("JSON.parse(localStorage.getItem('cxq.defense.army.v3')).commanders.growth.specialization==='grove'","configuration persisted immediately");
 click('#cultivation [data-close]');click('[data-hero=hope]');click('#cultivate');click('[data-tab=build]');run('select','#build label:first-of-type select','breaker');run('snapshot','-i');click('#cultivation [data-close]');click('[data-hero=growth]');click('#cultivate');
 check("document.querySelector('#build select').value==='grove'","each hero restores own configuration");
 for(const [w,h] of [[320,568],[360,560],[390,700],[412,915],[768,1024]]){run('set','viewport',String(w),String(h));check("(()=>{const d=document.querySelector('#cultivation'),b=document.querySelector('#build'),r=d.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&b.clientHeight>60})()","commander bounds "+w+'x'+h);run('screenshot',process.cwd()+'/preview/army4-commander-'+w+'.png');}
 click('#cultivation [data-close]');click('#start');check("document.querySelectorAll('[data-chapter]').length===4","four campaign chapters");click('[data-chapter=forest]');check("document.querySelectorAll('#stages [data-stage]').length===5&&document.querySelectorAll('#stages button:disabled').length===4","first chapter stage gating");click('#campaign-back');check("document.querySelectorAll('[data-chapter]').length===4","back returns to chapter list");click('#campaign-back');click('#start-dungeons');check("document.querySelectorAll('[data-dungeon]').length===6","six dungeon buttons");
 run('eval',"await Promise.all([...document.querySelectorAll('#dungeons img')].map(i=>i.decode()));true");run('screenshot',process.cwd()+'/preview/army4-dungeons.png');
 click('[data-dungeon=mastery][data-difficulty="2"]');check("document.querySelector('#briefing-title').textContent.includes('指揮試煉')","dungeon briefing");click('#briefing-start');run('wait','body:not(:has(#loading-status[open]))');run('snapshot','-i');
 check("(()=>{const p=JSON.parse(localStorage.getItem('cxq.defense.army.v3'));return p.checkpoint.dungeon.type==='mastery'&&p.checkpoint.dungeon.difficulty===2&&p.commanders.growth.specialization==='grove'})()","dungeon checkpoint and saved build");
 check("(()=>{const r=document.querySelector('#field').getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})()","battle remains inside viewport");
 const errors=run('errors');if(errors)throw Error(errors);console.log('PASS '+results.length+' army4 browser checks');
}finally{fs.writeFileSync('preview/defense-army4-qa.json',JSON.stringify({results},null,2));run('close');}
