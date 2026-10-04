// Isolated QA fixtures only; never reads or changes the user's active browser saves.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const bin='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',tmp=fs.mkdtempSync(path.join(os.tmpdir(),'army3-')),log=path.join(tmp,'log'),session='defense-army3',report=[];
function run(...args){const fd=fs.openSync(log,'w');try{execFileSync(bin,['--session',session,...args],{stdio:['ignore',fd,fd],timeout:90000});}catch(e){console.error(fs.readFileSync(log,'utf8'));throw e;}finally{fs.closeSync(fd);}return fs.readFileSync(log,'utf8').trim();}
function parse(s){let r=JSON.parse(s);return typeof r==='string'?JSON.parse(r):r;}
function check(js,label){if(!run('eval',js).includes('true'))throw Error(label);}
function click(s){run('scrollintoview',s);run('click',s);run('wait','body:not(:has(#loading-status[open]))');run('snapshot','-i');}
function reload(){run('reload');run('wait','[data-ready=true]');run('snapshot','-i');}
const diag="(await import(document.querySelector('script[type=module]').src)).diagnostics()";
try{
 run('set','viewport','390','700');run('open',process.env.DEFENSE_QA_URL||'http://127.0.0.1:4173/games/fairytale-defense/rebuild/army.html');run('wait','[data-ready=true]');
 run('eval',"(async()=>{const {newArmySave}=await import('./army-save.mjs'),p=newArmySave();p.collection.coins=4321;p.collection.training.archer=22;for(const id of ['scout','warden','storm','bramble','artisan'])delete p.collection.training[id];localStorage.setItem('cxq.defense.army.v3',JSON.stringify(p));localStorage.removeItem('cxq.defense.preferences.v1');})()");reload();click('#enter-camp');click('#squad-info');click('[data-unit=cannon]');
 check("(()=>{const p=JSON.parse(localStorage.getItem('cxq.defense.army.v3'));return p.collection.coins===4321&&p.collection.training.archer===22&&p.collection.training.scout===0&&!p.collection.owned.includes('scout');})()",'legacy persisted without XP/currency/ownership loss');
 click('#squad [data-close]');
 run('eval',"(async()=>{const {newArmySave}=await import('./army-save.mjs'),{UNITS}=await import('./army.mjs'),p=newArmySave();p.collection.owned=Object.keys(UNITS);localStorage.setItem('cxq.defense.army.v3',JSON.stringify(p));})()");reload();click('#enter-camp');click('#squad-info');
 check("document.querySelectorAll('[data-troop] section').length===0&&document.querySelectorAll('#squad [data-troop]').length===17&&document.querySelectorAll('.formation-slot').length===5",'seventeen cards and five pinned slots');
 run('select','#squad-role','control');check("document.querySelectorAll('#squad [data-troop]').length===4",'control filter');run('select','#squad-rarity','epic');check("document.querySelectorAll('#squad [data-troop]').length===1&&document.querySelector('#squad [data-troop]').dataset.troop==='bramble'",'combined rarity filter');
 run('select','#squad-role','all');run('select','#squad-rarity','all');click('[data-unit=scout]');click('[data-unit=storm]');
 check("document.querySelector('#loadout-summary').textContent.includes('5 / 5')&&document.querySelector('[data-unit=artisan]').disabled",'five unit limit');
 run('scrollintoview','[data-unit=storm]');run('eval',"window.__qaScroll=document.querySelector('#squad .dialog-content').scrollTop");click('[data-unit=storm]');
 check("Math.abs(document.querySelector('#squad .dialog-content').scrollTop-window.__qaScroll)<1&&scrollX===0&&scrollY===0",'toggle preserves scroll');
 check("(()=>{const b=document.querySelector('[data-unit=storm]'),before=localStorage.getItem('cxq.defense.army.v3');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:20,clientY:20}));b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:20,clientY:70}));b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));return localStorage.getItem('cxq.defense.army.v3')===before;})()",'drag does not select');
 run('eval',"document.querySelector('[data-unit=storm]').focus({preventScroll:true})");run('press','Enter');check("JSON.parse(localStorage.getItem('cxq.defense.army.v3')).loadout.includes('storm')",'keyboard still works after drag');
 run('screenshot',path.resolve('preview/army3-formation.png'));click('#squad [data-close]');
 for(const id of ['scout','warden','storm','bramble','artisan']){
  click('#open-collection');click('[data-unit-guide="'+id+'"]');
  for(const branch of [2,3]){click('#unit-guide .unit-variants button:nth-child('+branch+')');check("(()=>{const im=document.querySelector('#unit-guide .guide-unit');return im.complete&&im.naturalWidth>0;})()",'branch image '+id);}
  click('#unit-trial');click('.pad-hit:nth-child(1)');click('#confirm-deploy');
  if(id==='artisan'){check("document.querySelector('#wave').disabled&&document.querySelector('#hint').textContent.includes('不攻擊')",'support-only wave warning');click('#troop-dock [data-troop=archer]');click('.pad-hit:nth-child(2)');click('#confirm-deploy');}
  while(!run('eval',"document.querySelector('#battle-speed').textContent==='1×'").includes('true'))click('#battle-speed');
  click('#wave');
  if(id==='artisan'){click('#battle-speed');click('#battle-speed');}
  const sample=parse(run('eval',"(async()=>{const m=await import(document.querySelector('script[type=module]').src),seen=new Set(),types=new Set(),gaps=[],start=performance.now();let last=start;while(performance.now()-start<6500){await new Promise(requestAnimationFrame);const now=performance.now();gaps.push(now-last);last=now;const d=m.diagnostics();d.animation.actors.forEach(a=>seen.add(a));d.battle.events.forEach(e=>types.add(e.type));}gaps.sort((a,b)=>a-b);return JSON.stringify({id:"+JSON.stringify(id)+",actors:[...seen],events:[...types],frames:gaps.length,p95:gaps[Math.floor(gaps.length*.95)],maxGap:gaps.at(-1),failed:m.diagnostics().failed});})()"));
  if(sample.failed||!sample.actors.includes('unit-'+id+'-release')||(id!=='artisan'&&!sample.actors.includes('unit-'+id+'-ready'))||!sample.events.includes(id==='artisan'?'supply':'hit'))throw Error('Actual action missing '+id);report.push(sample);console.log('PASS rendered new troop '+id);
  run('screenshot',path.resolve('preview/army3-'+id+'-battle.png'));click('#settings');click('#home');if(run('eval',"document.querySelector('#leave').open").includes('true'))click('#confirm-home');
 }
 for(const map of ['forest','moon','dawn','ruins']){
  run('eval',"(async()=>{const a=await import('./army-save.mjs'),c=await import('./core.mjs'),p=a.newArmySave(),f=a.prepareArmyExpedition(p,{hero:'hope',mode:'endless',map:"+JSON.stringify(map)+"},'army3-map-fixture');c.deploy(f.battle,0,'archer');localStorage.setItem('cxq.defense.army.v3',JSON.stringify(a.settleArmySave(f.save,f.battle,'army3-map-fixture')));})()");reload();click('#cover-resume');
  check("(async()=>{const d="+diag+";return d.animation.actors.includes('hope')&&d.art.includes('hero-dais')&&!d.failed;})()",'hero present '+map);
  check("(()=>{for(const e of document.querySelectorAll('.pad-hit,.battle-hero-hit')){const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(r.width<44||r.height<44||r.left<-.5||r.right>innerWidth+.5||r.top<0||r.bottom>innerHeight||!(e===hit||e.contains(hit)))return false;}return true;})()",'hero and all pads reachable '+map);
  run('screenshot',path.resolve('preview/army3-map-'+map+'.png'));click('#battle-hero');check("document.querySelector('#command').open",'battlefield hero opens command');click('#command [data-close]');
 }
 if(run('errors'))throw Error('Browser errors');console.log('PASS legacy migration, formation filters/scroll/drag/keyboard/limit, ten branch portraits, five real actions and four visible/reachable map commanders.');
}finally{fs.writeFileSync('preview/defense-army3-qa.json',JSON.stringify(report,null,2));run('close');fs.unlinkSync(log);fs.rmdirSync(tmp);}
