import {WORLD,PADS,ROLES,createBattle,pointAt,deploy,upgrade,sell,startWave,advance,newProfile,recordResult,upgradeCost,towerStats,SPECIALIZATIONS,BLESSINGS,chooseBlessing,setPriority,wavePreview} from './core.mjs?v=20261004-army3';
import {ROLE_GUIDES} from './progression.mjs?v=20261004-army3';
import {captureCheckpoint,restoreCheckpoint,decodeSave} from './checkpoint.mjs?v=20261004-army3';
const $=id=>document.getElementById(id),ctx=$('canvas').getContext('2d'),images={},key='cxq.defense.rebuild.v2';
let battle=createBattle(),profile=newProfile(),checkpoint=null,selectedPad=0,selectedRole=null,ready=false,resultShown=false,last=0,mode='campaign';
try{const raw=localStorage.getItem(key)||localStorage.getItem('cxq.defense.rebuild.v1');if(raw)({profile,checkpoint}=decodeSave(raw));}catch{$('hint').textContent='讀取存檔失敗，未刪除原始資料。';}
const save=()=>{try{localStorage.setItem(key,JSON.stringify({version:2,profile,checkpoint}));return true;}catch{$('save-message').textContent='無法寫入存檔，請匯出備份。';return false;}};
function saveBoundary(){const c=captureCheckpoint(battle);if(c){checkpoint=c;save();}updateHome();}
function updateHome(){$('resume').hidden=!checkpoint;$('progress-label').textContent=`闖關進度 ${profile.unlockedStage} · 無盡最佳 ${profile.bestEndless} 波${checkpoint?'｜開始新局會取代準備存檔':''}`;}
const act=fn=>{const paused=battle.paused;battle.paused=false;const result=fn();battle.paused=paused;return result;};
function show(id){$(id).showModal();syncPause();}
function syncPause(){battle.paused=document.hidden||innerWidth>innerHeight||!!document.querySelector('dialog[open]');}
function resize(){
 const available=Math.max(100,$('app').clientHeight-document.querySelector('header').offsetHeight-document.querySelector('footer').offsetHeight);
 const scale=Math.min(innerWidth/WORLD.width,available/WORLD.height);$('field').style.width=`${WORLD.width*scale}px`;$('field').style.height=`${WORLD.height*scale}px`;
 $('rotate').hidden=innerWidth<=innerHeight;syncPause();
}
window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;syncPause();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',syncPause));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{if(['menu','result','blessing'].includes(d.id))e.preventDefault();}));
PADS.forEach((p,i)=>{const b=document.createElement('button');b.className='pad-hit';b.style.left=`${p.x/WORLD.width*100}%`;b.style.top=`${p.y/WORLD.height*100}%`;b.setAttribute('aria-label',`部署位置 ${i+1}`);b.onclick=()=>openPad(i);$('pads').append(b);});
for(const [id,r] of Object.entries(ROLES)){
 const b=document.createElement('button');b.dataset.role=id;b.innerHTML=`<img src="../../../assets/characters/cxq-role-${id}.webp" alt=""><span>${r.name} · ${r.cost}</span>`;
 b.onclick=()=>{selectedRole=id;renderRole();};$('roles').append(b);
}
function statText(t){const r=towerStats(t,battle);return `傷害 ${r.damage.toFixed(1)}｜間隔 ${r.interval.toFixed(2)} 秒｜射程 ${r.range}${r.splash?`｜波及 ${r.splash}`:''}${r.aura?`｜支援 ${r.auraRange}`:''}${r.pierce?'｜穿甲':''}`;}
function renderRole(){
 const t=selectedPad===null?null:battle.towers.find(t=>t.pad===selectedPad),id=t?.role||selectedRole;
 $('roster').classList.toggle('specializing',t?.level===2);
 $('tower-actions').hidden=!t;$('priority').hidden=!t;$('confirm-deploy').hidden=!id||!!t||selectedPad===null;$('branches').replaceChildren();
 for(const b of $('roles').children){b.disabled=false;b.setAttribute('aria-pressed',String(b.dataset.role===id));}
 if(!id){$('detail').textContent=`金幣 ${battle.gold} · 選伙伴查看能力與射程`;$('role-stats').textContent='';$('role-guide').textContent='';return;}
 const role=ROLES[id],guide=ROLE_GUIDES[id],tower=t||{role:id,level:1,branch:null};
 $('detail').textContent=`${role.name} · ${guide.tag}｜${role.description}`;$('role-stats').textContent=statText(tower);
 $('role-guide').textContent=`擅長：${guide.strength}。注意：${guide.weakness}。${guide.partner}。數值不含其他伙伴的即時支援。`;
 if(t){$('roster-title').textContent=`${role.name} · Lv.${t.level}${t.branch?' · '+SPECIALIZATIONS[id].find(p=>p.id===t.branch).name:''}`;$('upgrade').hidden=t.level===2;$('upgrade').disabled=t.level>=5||battle.gold<upgradeCost(t);$('upgrade').textContent=t.level<5?`升級 · ${upgradeCost(t)}`:'已達最高等級';$('sell').textContent=`撤回 · +${Math.floor(t.spent*70/100)}`;$('priority').textContent='目標：'+({first:'最接近終點',strong:'最高生命',armor:'最高護甲'}[t.priority]);
  if(t.level<5&&t.level!==2)$('role-stats').textContent+=' → 下一級：'+statText({...t,level:t.level+1});
  if(t.level===2)$('role-stats').textContent+=`｜三級專精費用 ${upgradeCost(t)} 金幣，二選一`;
 }
 const used=battle.towers.some(t=>t.role===id);$('confirm-deploy').disabled=used||battle.gold<role.cost;$('confirm-deploy').textContent=used?'此伙伴已上場':battle.gold<role.cost?`金幣不足 · 需要 ${role.cost}`:`確認部署 · ${role.cost}`;
 for(const p of SPECIALIZATIONS[id]){const canChoose=!!t&&t.level===2;const b=document.createElement(canChoose?'button':'p');b.textContent=`${p.name}：${p.description}${canChoose?'｜'+statText({...t,level:3,branch:p.id}):''}`;if(canChoose){b.disabled=battle.gold<upgradeCost(t);b.onclick=()=>{if(act(()=>upgrade(battle,selectedPad,p.id))){saveBoundary();$('roster').close();}};}$('branches').append(b);}
}
function openPad(i){
 if(!ready||['victory','defeat'].includes(battle.phase))return;selectedPad=i;selectedRole=battle.towers.find(t=>t.pad===i)?.role||'growth';$('roster').classList.remove('library');$('roster-title').textContent=`部署位置 ${i+1}`;$('roles').hidden=!!battle.towers.find(t=>t.pad===i);renderRole();show('roster');
}
$('library').onclick=()=>{selectedPad=null;selectedRole='growth';$('roster').classList.add('library');$('roster-title').textContent='守護伙伴 · 全部開放';$('roles').hidden=false;renderRole();show('roster');};
$('confirm-deploy').onclick=()=>{if(act(()=>deploy(battle,selectedPad,selectedRole))){saveBoundary();$('roster').close();$('hint').textContent=`${ROLES[selectedRole].name}已就位`;}else renderRole();};
$('priority').onclick=()=>{const t=battle.towers.find(t=>t.pad===selectedPad),modes=['first','strong','armor'];act(()=>setPriority(battle,selectedPad,modes[(modes.indexOf(t.priority)+1)%3]));saveBoundary();renderRole();};
for(const [id,action] of [['upgrade',upgrade],['sell',sell]])$(id).onclick=()=>{act(()=>action(battle,selectedPad));saveBoundary();$('roster').close();syncPause();};
function enterBattle(){mode=battle.mode;resultShown=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('hint').textContent='點選石台，部署你的守護伙伴。';syncPause();}
function begin(nextMode){battle=createBattle({mode:nextMode,stage:nextMode==='campaign'?profile.unlockedStage:1});saveBoundary();enterBattle();}
$('resume').onclick=()=>{if(checkpoint){battle=restoreCheckpoint(checkpoint);enterBattle();}};
$('campaign').onclick=()=>begin('campaign');$('endless').onclick=()=>begin('endless');$('again').onclick=()=>begin(mode);
$('wave').onclick=()=>{saveBoundary();if(startWave(battle))$('hint').textContent=`第 ${battle.wave} 波來襲`;};
$('settings').onclick=()=>show('options');$('help').onclick=()=>show('help-dialog');$('help-home').onclick=()=>show('help-dialog');
function home(){profile=recordResult(profile,battle);saveBoundary();save();battle=createBattle();document.querySelectorAll('dialog[open]').forEach(d=>d.close());updateHome();show('menu');}
$('home').onclick=()=>battle.phase==='battle'?show('leave'):home();$('confirm-home').onclick=home;$('result-home').onclick=home;
$('motion').onclick=()=>{profile.settings.reducedMotion=!profile.settings.reducedMotion;save();updateMotion();};
function updateMotion(){$('motion').textContent=`動畫：${profile.settings.reducedMotion?'減少動態':'完整'}`;}updateMotion();
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:2,profile,checkpoint},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cxq-defense-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>30000)throw Error('檔案過大');const candidate=decodeSave(await f.text());({profile,checkpoint}=candidate);save();battle=createBattle();document.querySelectorAll('dialog[open]').forEach(d=>d.close());updateMotion();updateHome();show('menu');}catch(e){$('save-message').textContent=`匯入失敗：${e.message}`;}finally{$('file').value='';}};
function drawImage(id,x,y,w,h,alpha=1){const image=images[id];if(!image)return;ctx.globalAlpha=alpha;ctx.drawImage(image,x,y,w,h);ctx.globalAlpha=1;}
function barImage(id,x,y,w,h){const box=id==='health-track'?{x:.015625,y:.357143,w:.96875,h:.274725}:{x:.048828,y:.333333,w:.902344,h:.333333};drawImage(id,x-box.x*w/box.w,y-box.y*h/box.h,w/box.w,h/box.h);}
// Foot anchors measured on whole individual images; no crop rectangles or atlas coordinates.
function sprite(id,x,y,height,alpha=1){const image=images[id];if(!image)return;const anchors={walker:.941,'walker-step':.941,'growth-cast':.93,'growth-ready':.93,'growth-idle':.948};const foot=anchors[id]||.933;const w=height*image.width/image.height;drawImage(id,x-w/2,y-height*foot,w,height,alpha);}
function draw(){
 ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,390,585);drawImage('meadow',0,0,390,585);drawImage('road',0,0,390,585);
 const selected=$('roster').open&&selectedPad!==null&&selectedRole?(battle.towers.find(t=>t.pad===selectedPad)||{role:selectedRole,level:1,branch:null}):null;
 if(selected){const r=towerStats(selected,battle),p=PADS[selectedPad];rangeArt('range',p,r.range);if(r.aura||r.haste<1)rangeArt('aura-range',p,r.auraRange,.5);const attack=battle.pending.find(a=>a.towerId===selected.id)||battle.shots.find(a=>a.towerId===selected.id),target=battle.enemies.find(e=>e.id===attack?.targetId);if(target){const p=pointAt(target.distance);drawImage('target',p.x-10,p.y-64,20,20);if(r.splash)rangeArt('range',p,r.splash,.5);}}
 for(const p of PADS)drawImage('pad',p.x-40,p.y-24,80,50);
 const objects=[];
 for(const t of battle.towers){const p=PADS[t.pad],release=battle.events.findLast(e=>e.type==='release'&&e.pad===t.pad),pre=battle.pending.some(a=>a.towerId===t.id);let art=t.role;
   if(t.role==='growth')art=!profile.settings.reducedMotion&&pre?'growth-ready':!profile.settings.reducedMotion&&release&&battle.time-release.time<.28?'growth-cast':'growth-idle';
   objects.push({y:p.y,draw:()=>sprite(art,p.x,p.y-4,86)});
 }
 for(const e of battle.enemies){
   const p=pointAt(e.distance),stepping=!profile.settings.reducedMotion&&Math.floor(battle.time*6+e.id)%2;
   const art=e.kind==='walker'?(stepping?'walker-step':'walker'):e.kind;
   const height=e.kind==='boss'?76:e.kind==='armored'?54:48;
   if(e.castUntil)rangeArt('aura-range',p,100,.65);
   if(e.wardUntil>battle.time)rangeArt('aura-range',p,height*.45,.6);
   objects.push({y:p.y,draw:()=>{
     const previous=pointAt(Math.max(0,e.distance-2)),left=p.x<previous.x;
     ctx.save();ctx.translate(p.x,p.y);if(left)ctx.scale(-1,1);
     sprite(art,0,0,height);ctx.restore();
     const y=p.y-height-3;barImage('health-track',p.x-20,y,40,6);ctx.save();ctx.beginPath();ctx.rect(p.x-18,y+1,36*Math.max(0,e.hp/e.maxHp),4);ctx.clip();barImage('health-fill',p.x-18,y+1,36,4);ctx.restore();
     if(e.castUntil)drawImage('target',p.x-10,y-24,20,20);
   }});
 }
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 for(const shot of battle.shots){const e=battle.enemies.find(e=>e.id===shot.targetId);if(!e)continue;const p=pointAt(e.distance),t=Math.min(1,(battle.time-shot.born)/.28),x=shot.from.x+(p.x-shot.from.x)*t,y=shot.from.y-30+(p.y-(shot.from.y-30))*t;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(p.y-(shot.from.y-30),p.x-shot.from.x));drawImage('seed',-15,-15,30,30);ctx.restore();}
 for(const e of battle.events){const age=battle.time-e.time;if(e.type==='hit'&&age<.28){const size=profile.settings.reducedMotion?26:26+age*70;drawImage('impact',e.x-size/2,e.y-size/2,size,size,1-age/.28);}if(e.type==='defeat-enemy'&&age<.35)sprite(e.kind,e.x,e.y+age*18,e.kind==='boss'?76:e.kind==='armored'?54:48,1-age/.35);}
}
function rangeArt(id,p,r,alpha=.38){const meta=id==='range'?{x:.499023,y:.497070,r:.423242}:{x:.499023,y:.499023,r:.406641};const size=r/meta.r;drawImage(id,p.x-size*meta.x,p.y-size*meta.y,size,size,alpha);}
function showBlessing(){if(!$('blessing').open&&!document.querySelector('dialog[open]')){const container=$('blessing-choices');container.replaceChildren();for(const id of battle.blessingChoices){const b=document.createElement('button');b.textContent=`${BLESSINGS[id].name}：${BLESSINGS[id].description}`;b.onclick=()=>{if(act(()=>chooseBlessing(battle,id))){saveBoundary();$('blessing').close();}};container.append(b);}show('blessing');}}
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;syncPause();const previous=battle.phase;advance(battle,dt);if(previous!==battle.phase&&battle.phase==='intermission')saveBoundary();draw();$('status').textContent=`生命 ${battle.hp}${battle.shield?'＋盾'+battle.shield:''} · 金幣 ${battle.gold} · ${battle.wave} 波`;
 $('wave').disabled=!ready||battle.paused||!['planning','intermission'].includes(battle.phase)||!battle.towers.length||!!battle.blessingChoices.length;$('wave').textContent=battle.phase==='battle'?'守護中…':battle.phase==='intermission'?'迎接下一波':'開始守護';
 if(['planning','intermission'].includes(battle.phase))$('hint').textContent='下一波：'+Object.entries(wavePreview(battle)).map(([id,n])=>({walker:'普通',runner:'快速',armored:'護甲',boss:'頭目'}[id])+` ×${n}`).join(' · ');
 if(battle.phase==='battle')$('hint').textContent=battle.enemies.some(e=>e.castUntil)?'頭目蓄力：即將替周圍敵人施加護甲！':battle.enemies.some(e=>e.wardUntil>battle.time)?'護甲加持中：回憶、希望的穿甲仍有效。':`第 ${battle.wave} 波守護中`;
 if(battle.blessingChoices.length)showBlessing();
 if(!resultShown&&['victory','defeat'].includes(battle.phase)){resultShown=true;profile=recordResult(profile,battle);checkpoint=null;save();updateHome();$('result-title').textContent=battle.phase==='victory'?'守護成功':'再試一次';$('result-text').textContent=`完成 ${battle.phase==='victory'?battle.wave:Math.max(0,battle.wave-1)} 波，擊退 ${battle.kills} 位敵人。`;show('result');}requestAnimationFrame(frame);
}
updateHome();show('menu');resize();
try{
 const entries=[...['meadow','road','pad','button','panel','growth-idle','growth-cast','growth-ready','walker','walker-step','runner','armored','boss','seed','impact','title','campaign-button','endless-button','range','aura-range','health-track','health-fill','target'].map(id=>[id,`art/${id}.webp`]),...Object.keys(ROLES).map(id=>[id,`../../../assets/characters/cxq-role-${id}.webp`])];
 await Promise.all(entries.map(async([id,src])=>{const im=new Image();im.src=src;await im.decode();images[id]=im;}));
 ready=true;$('campaign').disabled=false;$('endless').disabled=false;document.body.dataset.ready='true';
}catch(e){$('hint').textContent='素材未完整載入，尚不能開始。';console.error('Defense art load failed',e);}
requestAnimationFrame(frame);
