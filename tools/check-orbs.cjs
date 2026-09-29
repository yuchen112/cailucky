// All QA takes place in an isolated temporary browser profile.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const browser='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cxq-orbs-')),log=path.join(folder,'command.log');
const session='orbs-verified30';
function run(...args){const fd=fs.openSync(log,'w');try{execFileSync(browser,['--session',session,...args],{stdio:['ignore',fd,fd],timeout:30000});}finally{fs.closeSync(fd);}const text=fs.readFileSync(log,'utf8');console.log(text.trim());return text;}
try{
 run('open','http://127.0.0.1:4173/games/merge/?v=20260930-orbs');run('set','viewport','390','700');run('snapshot','-i');
 run('eval','window.originalRandom=Math.random;Math.random=()=>0');
 run('find','role','button','click','--name','開始合成');run('snapshot','-i');
 run('eval','(async()=>{Math.random=window.originalRandom;await new Promise(r=>setTimeout(r,1200));return orbFiles.map(p=>!!G.images[p]?.naturalWidth)})()');
 run('find','role','button','click','--name','投下收藏球');
 run('eval','new Promise(r=>setTimeout(()=>r(balls().length),1100))');run('snapshot','-i');
 run('find','role','button','click','--name','投下收藏球');
 run('eval','(async()=>{await new Promise(r=>setTimeout(r,1500));if(state.score!==10||balls().length!==1||balls()[0].tier!==1)throw Error("Merge failed");return {score:state.score,tier:balls()[0].tier,y:balls()[0].position.y,scrollY}})()');
 run('screenshot');run('set','viewport','360','640');
 run('eval','(()=>{if(document.documentElement.scrollWidth>innerWidth)throw Error("Overflow");return document.querySelector("#canvas").getBoundingClientRect().toJSON()})()');
 run('screenshot');if(run('errors').trim())throw Error('Merge errors');
 run('open','http://127.0.0.1:4173/games/magic-bubble/?v=20260930-orbs');run('set','viewport','390','700');run('snapshot','-i');
 run('find','role','button','click','--name','開始施展魔法');run('snapshot','-i');run('find','role','button','click','--name','標準難度');run('snapshot','-i');run('screenshot');
 run('eval','(async()=>{const paths=["ruby","aqua","gold","violet","leaf","orange"];await Promise.all(paths.map(p=>new Promise((resolve,reject)=>{const i=new Image;i.onload=resolve;i.onerror=reject;i.src="art-orbs-v2/"+p+".webp"})));if(document.documentElement.scrollWidth>innerWidth)throw Error("Overflow");return "all six bubble images decoded"})()');
 if(run('errors').trim())throw Error('Bubble errors');
 console.log('PASS: both games, all new assets, real merge controls, two portrait sizes');
}finally{try{run('close');}finally{fs.unlinkSync(log);fs.rmdirSync(folder);}}
