const {execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const bin='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',session='defense-collection-qa',tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cxq-collection-')),log=path.join(tmp,'log');
function run(...args){if(args[0]==='screenshot')args[1]=path.resolve(args[1]);const fd=fs.openSync(log,'w');try{execFileSync(bin,['--session',session,...args],{stdio:['ignore',fd,fd],timeout:90000});}catch(e){console.error(fs.readFileSync(log,'utf8'));throw e;}finally{fs.closeSync(fd);}return fs.readFileSync(log,'utf8').trim();}
function click(s){run('scrollintoview',s);run('click',s);run('wait','body:not(:has(#loading-status[open]))');run('snapshot','-i');}
function check(js,label){if(!run('eval',js).includes('true'))throw Error(label);}
const url=process.env.DEFENSE_QA_URL||'http://127.0.0.1:4173/games/fairytale-defense/rebuild/army.html';
try{
 run('set','viewport','390','700');run('open',url);run('wait','[data-ready=true]');
 run('eval',`(async()=>{const {newArmySave}=await import('./army-save.mjs');const {UNITS}=await import('./army.mjs');const s=newArmySave();s.collection.coins=5000;s.collection.owned=Object.keys(UNITS);localStorage.setItem('cxq.defense.army.v3',JSON.stringify(s));})()`);run('reload');run('wait','[data-ready=true]');click('#enter-camp');click('#squad-info');
 for(const id of ['firefly','crystal'])click('[data-unit="'+id+'"]');check('document.querySelector("#loadout-summary").textContent.includes("5 / 5")','five slots');check('document.querySelector("[data-unit=dragon]").disabled','sixth unit blocked');click('#squad [data-close]');
 click('#open-collection');click('#recruit-ten');click('#recruit-confirm-yes');if(run('eval','!!document.querySelector("#recruit-skip")').includes('true'))click('#recruit-skip');check('JSON.parse(localStorage.getItem("cxq.defense.army.v3")).collection.total===10','ten results saved');run('screenshot','preview/collection-ten.png');click('#collection .journey-close');
 for(const map of ['forest','moon','dawn','ruins']){
  click('#start-endless');click('[data-map="'+map+'"]');click('#briefing-start');if(run('eval','document.querySelector("#replace").open').includes('true'))click('#confirm-start');
  check('JSON.parse(localStorage.getItem("cxq.defense.army.v3")).checkpoint.map==="'+map+'"','map persisted');check('document.querySelectorAll("#troop-dock button").length===5','five battlefield slots');click('[data-troop=archer]');click('.pad-hit:nth-child(4)');click('#confirm-deploy');run('screenshot','preview/collection-map-'+map+'.png');click('#wave');click('#skill');check('!document.querySelector("#skill-preview").open','one tap default');click('#settings');click('#home');click('#confirm-home');
 }
 click('#squad-info');click('#squad .loadout-grid section:first-child button:last-child');click('#unit-trial');check('!document.querySelector("#camp").open','trial enters battle');click('.pad-hit:nth-child(4)');click('#confirm-deploy');click('#settings');click('#home');check('JSON.parse(localStorage.getItem("cxq.defense.army.v3")).checkpoint.map==="ruins"','trial preserves real checkpoint');
 if(run('errors'))throw Error('browser errors');console.log('PASS five-slot selection, atomic ten UI, all four endless maps, one-tap commander, free trial and existing checkpoint preservation.');
}finally{run('close');fs.unlinkSync(log);fs.rmdirSync(tmp);}
