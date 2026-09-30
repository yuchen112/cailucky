import {ROLES,UNITS,UNIT_BRANCHES,PADS,pointAt,createBattle,deploy,upgrade,sell,upgradeCost,towerStats,startWave,advance,castHero,moveHero,chooseBlessing,BLESSINGS} from './core.mjs';
import {HERO_SPECIALIZATIONS,HERO_TALENTS,supportRadius} from './hero-rules.mjs';
import {masteryLevel} from './mastery.mjs';
import {newArmySave,decodeArmySave,prepareArmyExpedition,settleArmySave} from './army-save.mjs';
import {restoreCheckpoint} from './checkpoint.mjs';
import {CAMPAIGN} from './encounters.mjs';
import {SPELL_ART,actorMotion,projectilePose} from './motion.mjs';
import {unitArt,branchGuide} from './unit-presentation.mjs';
import {SPRITE_LAYOUT} from './sprite-layout.mjs';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const $=id=>document.getElementById(id),ctx=$('canvas').getContext('2d'),images={},key='cxq.defense.army.v3';
let profile=newArmySave(),battle=createBattle({hero:'growth'}),hero='growth',specialization=null,talents={},last=0,ready=false,failed=false,selectedPad=null,stage=1;
const artPromises=new Map();let transitioning=false;
const loadingStatus=document.createElement('dialog');loadingStatus.id='loading-status';loadingStatus.setAttribute('aria-label','準備戰場美術');loadingStatus.addEventListener('cancel',e=>e.preventDefault());document.body.append(loadingStatus);
function loadArt(id){if(images[id])return Promise.resolve();if(artPromises.has(id))return artPromises.get(id);const promise=(async()=>{const im=new Image();im.src=id in ROLES?`../../../assets/characters/cxq-role-${id}.webp`:`art/${id}.webp`;await im.decode();images[id]=im;})().catch(e=>{artPromises.delete(id);throw e;});artPromises.set(id,promise);return promise;}
function heroArt(id){return [id,id+'-cast',...(id==='growth'?['growth-idle','growth-ready']:[]),SPELL_ART[ROLES[id].kind]];}
function ensureBattleArt(s){const ids=['button','road','pad','seed','impact','target','health-track','health-fill','command-podium','dream-core','walker','runner','armored','boss','range','aura-range','fx-light',...['bolt','spore','frost','glow'].map(id=>'projectile-'+id),...s.loadout.map(id=>'unit-'+id),...s.towers.map(unitArt),...heroArt(s.hero.role),s.stage<=5?'meadow':s.stage<=10?'meadow-moon':'meadow-dawn'];return Promise.all([...new Set(ids)].map(loadArt));}
async function transition(fn){if(transitioning||failed)return;transitioning=true;loadingStatus.textContent='準備戰場美術…';loadingStatus.showModal();syncPause();try{await fn();}catch(e){error(e);}finally{transitioning=false;loadingStatus.close();syncPause();}}
function error(e){failed=true;$('error').hidden=false;$('error').textContent=`已暫停：${e.message}。未覆蓋原始存檔。請先保留備份再重新載入。`;syncPause();}
try{const raw=localStorage.getItem(key);if(raw)profile=decodeArmySave(raw);}catch(e){error(e);}
function persist(next){localStorage.setItem(key,JSON.stringify(next));profile=next;}
function saveBoundary(){persist(settleArmySave(profile,battle,profile.mastery.activeRun.id));}
function syncPause(){battle.paused=failed||document.hidden||innerWidth>innerHeight||!!document.querySelector('dialog[open]');$('rotate').hidden=innerWidth<=innerHeight;}
function show(id){$(id).showModal();if(id==='cover'){$(id).tabIndex=-1;$(id).focus({preventScroll:true});}syncPause();}
function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());syncPause();}
function resize(){const scale=Math.min(innerWidth/390,Math.max(100,$('app').clientHeight-document.querySelector('header').offsetHeight-document.querySelector('footer').offsetHeight)/585);$('field').style.width=390*scale+'px';$('field').style.height=585*scale+'px';syncPause();}
window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;syncPause();});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',syncPause);d.addEventListener('cancel',e=>{if(['cover','camp','blessing','result'].includes(d.id))e.preventDefault();});});
function optionGroup(label,choices,value,locked,onchange){const wrapper=document.createElement('label');wrapper.textContent=label;const select=document.createElement('select');select.disabled=locked;select.add(new Option(locked?'熟練度不足':'不裝備',''));for(const c of choices)select.add(new Option(c.name,c.id));select.value=value||'';const detail=document.createElement('p');const update=()=>{detail.textContent=choices.find(c=>c.id===select.value)?.description||'可在出戰前自由選擇，戰鬥中不能更換。';};select.onchange=()=>{onchange(select.value||null);update();};wrapper.append(select);$('build').append(wrapper,detail);update();}
function renderHero(){for(const b of $('heroes').children)b.setAttribute('aria-pressed',String(b.dataset.hero===hero));const xp=profile.mastery.xp[hero],level=masteryLevel(xp);$('hero-portrait').src=`../../../assets/characters/cxq-role-${hero}.webp`;$('hero-portrait').alt=ROLES[hero].name;$('hero-info').textContent=`${ROLES[hero].name} · 熟練 Lv.${level}`;$('cultivation-info').textContent=`${ROLES[hero].name} · ${xp} XP`;$('hero-summary').textContent=({growth:'培育精銳 · 附近部隊強化',dream:'夢印連動 · 星光清場',luck:'幸運補給 · 次數暴擊',joy:'連擊加速 · 全隊鼓舞',night:'遠距追擊 · 集中重擊',sadness:'細雨緩速 · 防線控場',trust:'職業協同 · 連結支援',memory:'記錄傷害 · 回響爆發',healing:'波次修復 · 生命庇護',hope:'穿甲之光 · 強敵對策'})[hero];$('build').replaceChildren();optionGroup('三級英雄專精',HERO_SPECIALIZATIONS[hero],specialization,level<3,v=>specialization=v);for(const [slot,tier] of Object.entries(HERO_TALENTS))optionGroup(`${tier.level} 級戰術`,tier.choices,talents[slot],level<tier.level,v=>talents[slot]=v);$('resume').hidden=!profile.checkpoint;$('cover-resume').hidden=!profile.checkpoint;}
$('cultivate').onclick=()=>show('cultivation');$('squad-info').onclick=()=>show('squad');
for(const [id,r] of Object.entries(ROLES)){const b=document.createElement('button');b.dataset.hero=id;b.innerHTML=`<img loading="lazy" decoding="async" src="../../../assets/characters/cxq-role-${id}.webp" alt=""><span>${r.name}</span>`;b.onclick=()=>{hero=id;specialization=null;talents={};renderHero();Promise.all(heroArt(id).map(loadArt)).catch(()=>{});};$('heroes').append(b);}
function perform(fn){return transition(async()=>{const draft=structuredClone(battle);draft.paused=false;if(!fn(draft))return;await ensureBattleArt(draft);if(['planning','intermission'].includes(draft.phase))persist(settleArmySave(profile,draft,profile.mastery.activeRun.id));battle=draft;closeAll();});}
function openPad(i){if(!ready||failed||['victory','defeat'].includes(battle.phase))return;selectedPad=i;const t=battle.towers.find(t=>t.pad===i),content=$('troop-content');content.replaceChildren();$('troop-title').textContent=t?`${UNITS[t.role].name} · Lv.${t.level}`:`部署位置 ${i+1}`;
 const button=(text,fn,disabled=false)=>{const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=()=>perform(fn);content.append(b);};
 if(!t){for(const id of battle.loadout){const r=UNITS[id],b=document.createElement('button');b.innerHTML=`<img src="art/unit-${id}.webp" alt=""> ${r.name} · ${r.cost}`;b.disabled=battle.gold<r.cost;b.onclick=()=>perform(s=>deploy(s,i,id));content.append(b);}}
 else{const stats=towerStats(t,battle),portrait=document.createElement('img'),p=document.createElement('p');portrait.className='upgrade-portrait';portrait.src=`art/${unitArt(t)}.webp`;portrait.alt=UNITS[t.role].name;p.textContent=`傷害 ${stats.damage.toFixed(1)} · 射程 ${stats.range} · ${stats.interval.toFixed(2)} 秒／次`;content.append(portrait,p);if(t.branch){const guide=document.createElement('p');guide.textContent=branchGuide(t.role,t.branch);content.append(guide);}
 const offer=(branch=null)=>{const next={...t,level:t.level+1,branch:branch?.id??t.branch},after=towerStats(next,battle),detail=document.createElement('p'),preview=document.createElement('img');preview.className='upgrade-preview';preview.src=`art/${unitArt(next)}.webp`;preview.alt=`${branch?.name||'裝備強化'} ${next.level} 級造型`;detail.className='upgrade-comparison';detail.textContent=`${branch?.name||'裝備強化'}：傷害 ${stats.damage.toFixed(1)} → ${after.damage.toFixed(1)}｜間隔 ${stats.interval.toFixed(2)} → ${after.interval.toFixed(2)} 秒｜射程 ${stats.range} → ${after.range}。${branchGuide(t.role,next.branch)}`;content.append(preview,detail);button(`${branch?.name||'升至 Lv.'+(t.level+1)} · ${upgradeCost(t)} 金幣`,s=>upgrade(s,i,branch?.id),battle.gold<upgradeCost(t));};
 if(t.level===2)for(const branch of UNIT_BRANCHES[t.role])offer(branch);else if(t.level<5)offer();else button('已達最高等級',()=>false,true);button(`撤回 · +${Math.floor(t.spent*.7)}`,s=>sell(s,i));}
 show('troops');}
PADS.forEach((p,i)=>{const b=document.createElement('button');b.className='pad-hit';b.style.left=p.x/390*100+'%';b.style.top=p.y/585*100+'%';b.setAttribute('aria-label',`部署位置 ${i+1}`);b.onclick=()=>openPad(i);$('pads').append(b);});
function start(){return transition(async()=>{const next=prepareArmyExpedition(profile,{hero,specialization,talents,stage},crypto.randomUUID());await ensureBattleArt(next.battle);persist(next.save);battle=next.battle;closeAll();});}
function briefing(){const c=CAMPAIGN[stage-1];$('briefing-title').textContent=`第 ${stage} 關 · ${c.name}`;$('briefing-tip').textContent=c.tip;$('briefing-team').textContent=`指揮英雄：${ROLES[hero].name} · 橡果弩手／蘑菇炮手／霜露精靈／螢光射手`;$('briefing-enemies').replaceChildren();for(const kind of new Set(c.waves.flat())){const f=document.createElement('figure'),im=document.createElement('img'),label=document.createElement('figcaption');im.src=`art/${kind}.webp`;label.textContent=({walker:'步兵',runner:'快腳',armored:'重甲',boss:'頭目'})[kind];f.append(im,label);$('briefing-enemies').append(f);}campaignDialog.close();show('briefing');}
$('briefing-start').onclick=()=>profile.checkpoint?show('replace'):start();
$('briefing').querySelector('[data-close]').onclick=()=>{$('briefing').close();selectStage();};
const commandHit=document.createElement('button');commandHit.className='commander-hit';commandHit.setAttribute('aria-label','英雄指揮區');$('pads').append(commandHit);commandHit.onclick=()=>{if(!ready||failed)return;$('command-zones').replaceChildren();for(const [label,y] of [['前線',130],['中場',258],['後防',386]]){const b=document.createElement('button'),remaining=Math.max(0,Math.ceil((battle.hero.moveReady||0)-battle.time));b.textContent=`${label}支援區${remaining?' · '+remaining+' 秒後可調整':''}`;b.disabled=remaining>0;b.onclick=()=>perform(s=>moveHero(s,195,y));$('command-zones').append(b);}show('command');};
const campaignDialog=document.createElement('dialog');campaignDialog.id='campaign';campaignDialog.innerHTML='<h2>選擇守護地點</h2><div class="scroll-body" id="stages"></div><button id="campaign-back">返回營地</button>';document.body.append(campaignDialog);campaignDialog.addEventListener('close',syncPause);$('campaign-back').onclick=()=>campaignDialog.close();
function selectStage(){const list=$('stages');list.replaceChildren();for(const c of CAMPAIGN){const b=document.createElement('button');b.dataset.stage=c.stage;b.disabled=c.stage>profile.campaign.unlocked;b.textContent=`${c.stage}. ${c.region} · ${c.name}${profile.campaign.cleared.includes(c.stage)?' · 已通關':''}`;const tip=document.createElement('small');tip.textContent=b.disabled?'完成前一關後開放':c.tip;b.append(tip);b.onclick=()=>{stage=c.stage;briefing();};list.append(b);}show('campaign');}
$('start').setAttribute('aria-label','選擇關卡');$('start').onclick=selectStage;$('confirm-start').onclick=start;
$('squad').querySelector('p').textContent='同種可重複部署，占用空地台並消耗金幣。現有四種出戰部隊；主線十五關依序開放。';
const squadDescriptions=['橡果弩手｜連弩／重弩','蘑菇炮手｜擴散／穿甲','霜露精靈｜長效緩速／定身','螢光射手｜遠射／連射'];
$('squad').querySelectorAll('figcaption').forEach((e,i)=>e.textContent=squadDescriptions[i]);
const resultPortrait=document.createElement('img');resultPortrait.className='result-portrait';resultPortrait.alt='';$('result-title').after(resultPortrait);
const nextStage=document.createElement('button');nextStage.id='next-stage';nextStage.textContent='前往下一關';$('result').insertBefore(nextStage,$('result-home'));nextStage.onclick=()=>{if(battle.phase!=='victory'||battle.stage>=15)return;stage=battle.stage+1;hero=battle.hero.role;specialization=battle.hero.specialization;talents={...battle.hero.talents};start();};
$('enter-camp').onclick=()=>{closeAll();renderHero();show('camp');ensureBattleArt(battle).catch(()=>{});};$('camp-cover').onclick=()=>{closeAll();show('cover');};$('cover-settings').onclick=()=>show('cover-help');
$('cover-resume').onclick=()=> $('resume').click();
$('resume').onclick=()=>transition(async()=>{const restored=restoreCheckpoint(profile.checkpoint);await ensureBattleArt(restored);battle=restored;closeAll();});
$('wave').onclick=()=>{try{saveBoundary();startWave(battle);}catch(e){error(e);}};
$('skill').onclick=()=>castHero(battle);$('settings').onclick=()=>show('options');
function home(){closeAll();battle=createBattle({hero});renderHero();show('camp');}
$('home').onclick=()=>battle.phase==='battle'?show('leave'):home();$('confirm-home').onclick=home;$('result-home').onclick=home;
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}));a.href=url;a.download='cxq-defense-army.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
let pendingImport=null;
const backupInput=document.createElement('input');backupInput.type='file';backupInput.accept='.json,application/json';backupInput.id='backup-file';backupInput.hidden=true;document.body.append(backupInput);
const importButton=document.createElement('button');importButton.id='import';importButton.textContent='匯入備份';$('export').after(importButton);
const importDialog=document.createElement('dialog');importDialog.id='import-confirm';importDialog.innerHTML='<h2>還原遊戲備份</h2><p id="import-summary"></p><button id="apply-import">確認取代本機進度</button><button id="cancel-import">取消</button>';document.body.append(importDialog);importDialog.addEventListener('close',syncPause);
importButton.onclick=()=>backupInput.click();
backupInput.onchange=async()=>{const file=backupInput.files[0];backupInput.value='';if(!file)return;pendingImport=null;try{if(file.size>1024*1024)throw Error('備份檔案過大');pendingImport=decodeArmySave(await file.text());$('import-summary').textContent=`此備份已開放第 ${pendingImport.campaign.unlocked} 關。還原會取代目前進度與戰場；建議先匯出目前備份。`;$('apply-import').hidden=false;}catch(e){$('import-summary').textContent=`無法還原：${e.message}。目前進度沒有變更。`;$('apply-import').hidden=true;}show('import-confirm');};
$('cancel-import').onclick=()=>{pendingImport=null;importDialog.close();};
$('apply-import').onclick=()=>{if(!pendingImport)return;try{persist(pendingImport);pendingImport=null;hero=profile.checkpoint?.hero.role||'growth';specialization=null;talents={};home();}catch(e){$('import-summary').textContent=`無法儲存：${e.message}。請保留備份。`;}};
function image(id,x,y,w,h,alpha=1){if(!images[id])return;ctx.globalAlpha=alpha;ctx.drawImage(images[id],x,y,w,h);ctx.globalAlpha=1;}
function centeredImage(id,size,alpha=1){const im=images[id];if(!im)return;const scale=size/Math.max(im.width,im.height),w=im.width*scale,h=im.height*scale;image(id,-w/2,-h/2,w,h,alpha);}
function sprite(id,x,y,h){const im=images[id];if(im){const a=SPRITE_LAYOUT[id]||{anchorX:.5,anchorY:.93,visibleHeight:1},height=h/a.visibleHeight,w=height*im.width/im.height;image(id,x-w*a.anchorX,y-height*a.anchorY,w,height);}}
function actor(id,x,y,h,identity){const m=actorMotion(battle,identity,reducedMotion.matches);let art=id;if(identity.hero){const pre=battle.pending.some(a=>a.hero),release=battle.events.findLast(e=>(e.type==='release'&&e.hero)||e.type==='hero-skill');const age=release?battle.time-release.time:99;art=!reducedMotion.matches&&age<.32?`${id}-cast`:id==='growth'?!reducedMotion.matches&&pre?'growth-ready':'growth-idle':id;}ctx.save();ctx.translate(x+m.offset,y);ctx.rotate(identity.hero&&art.endsWith('-cast')?0:m.angle);sprite(art,0,0,h);ctx.restore();}
function rangeArt(id,p,r,alpha=.35){const ratio=id==='range'?.423242:.406641,size=r/ratio;image(id,p.x-size/2,p.y-size/2,size,size,alpha);}
function health(e,p,height){
 const y=p.y-height-4,track={x:.015625,y:.357143,w:.96875,h:.274725},fill={x:.048828,y:.333333,w:.902344,h:.333333};
 image('health-track',p.x-20-track.x*40/track.w,y-track.y*6/track.h,40/track.w,6/track.h);
 ctx.save();ctx.beginPath();ctx.rect(p.x-18,y+1,36*Math.max(0,e.hp/e.maxHp),4);ctx.clip();image('health-fill',p.x-18-fill.x*36/fill.w,y+1-fill.y*4/fill.h,36/fill.w,4/fill.h);ctx.restore();
}
function draw(){
 const region=battle.stage<=5?'forest':battle.stage<=10?'moon':'dawn';if(document.body.dataset.region!==region)document.body.dataset.region=region;
 ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,390,585);image('road',0,0,390,585);
 for(const p of PADS)image('pad',p.x-40,p.y-24,80,50);
 if($('troops').open&&selectedPad!==null){const t=battle.towers.find(t=>t.pad===selectedPad);if(t)rangeArt('range',PADS[selectedPad],towerStats(t,battle).range);}
 for(const e of battle.enemies){const p=pointAt(e.distance);if(e.castUntil>battle.time)rangeArt('aura-range',p,100,.5);else if(e.wardUntil>battle.time)rangeArt('aura-range',p,36,.4);}
 if($('troops').open&&selectedPad!==null){const p=PADS[selectedPad];image('target',p.x-12,p.y-42,24,24);}
 const objects=battle.towers.map(t=>({y:PADS[t.pad].y,draw:()=>actor(unitArt(t),PADS[t.pad].x,PADS[t.pad].y,72,{pad:t.pad})}));
 image('command-podium',18,509,84,56);
 const coreHit=battle.events.findLast(e=>e.type==='leak'),coreAge=coreHit?battle.time-coreHit.time:99;
 const coreShake=!reducedMotion.matches&&coreAge<.4?Math.sin(coreAge*45)*3:0;
 image('dream-core',161+coreShake,503,78,78,battle.hp>0?1:.4);
 if(coreAge<.5)image('impact',173,521,50,50,1-coreAge/.5);
 ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dc';ctx.strokeStyle='#153d32';ctx.lineWidth=3;
 ctx.strokeText(`夢境核心 ${battle.hp}/${battle.maxHp}`,200,580);ctx.fillText(`夢境核心 ${battle.hp}/${battle.maxHp}`,200,580);
 objects.push({y:545,draw:()=>actor(battle.hero.role,60,535,74,{hero:true})});
 if($('command').open){rangeArt('aura-range',battle.hero,supportRadius(battle.hero),.38);image('target',battle.hero.x-12,battle.hero.y-12,24,24);}
 for(const e of battle.enemies){const p=pointAt(e.distance),height=e.kind==='boss'?80:52;objects.push({y:p.y,draw:()=>{ctx.save();ctx.translate(p.x,p.y);if(pointAt(Math.max(0,e.distance-2)).x>p.x)ctx.scale(-1,1);sprite(e.kind,0,0,height);ctx.restore();health(e,p,height);}});}
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 for(const t of battle.towers){const p=PADS[t.pad];image('button',p.x-18,p.y+4,36,18);ctx.font='bold 11px system-ui';ctx.fillStyle='#fff8dc';ctx.textAlign='center';ctx.fillText(`Lv.${t.level}`,p.x,p.y+17);}
 for(const shot of battle.shots){
  const e=battle.enemies.find(e=>e.id===shot.targetId);if(!e)continue;
  const visual=shot.hero?{...shot,from:{x:60,y:520}}:shot,p=projectilePose(visual,pointAt(e.distance),battle.time,reducedMotion.matches),size=shot.hero?34:shot.kind==='spore'?26:32,id=images[`projectile-${shot.kind}`]?`projectile-${shot.kind}`:SPELL_ART[shot.kind]||'seed';
  if(!reducedMotion.matches){const tail=projectilePose(visual,pointAt(e.distance),battle.time-.035,false);ctx.save();ctx.translate(tail.x,tail.y);ctx.rotate(tail.angle);centeredImage(id,size*.8,.25);ctx.restore();}
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);centeredImage(id,size);ctx.restore();
 }
 for(const e of battle.events){const age=battle.time-e.time;
  if(e.type==='upgrade'&&age<.8){const p=PADS[e.pad],size=reducedMotion.matches?52:42+age*45;image('fx-light',p.x-size/2,p.y-40-size/2,size,size,1-age/.8);ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dc';ctx.strokeStyle='#163c32';ctx.lineWidth=3;const text=`升級 Lv.${e.level}`;ctx.strokeText(text,p.x,p.y-65-age*12);ctx.fillText(text,p.x,p.y-65-age*12);}
  if(e.type==='hit'&&age<.35){const size=reducedMotion.matches?30:22+(e.kind==='spore'?65:30)*age/.35;image(({frost:'projectile-frost',glow:'fx-light'})[e.kind]||SPELL_ART[e.kind]||'impact',e.x-size/2,e.y-size/2,size,size,1-age/.35);}
  if(e.type==='hero-skill'&&age<.8){const size=reducedMotion.matches?72:50+80*age/.8;const p=['growth','trust','joy','luck','healing'].includes(e.role)?battle.hero:e;image(SPELL_ART[ROLES[e.role].kind],p.x-size/2,p.y-size/2,size,size,(1-age/.8)*.85);}
  if(e.type==='boss-warning'&&age<1.2){const size=reducedMotion.matches?44:40+Math.sin(age*12)*6;image('target',e.x-size/2,e.y-size/2,size,size);}
  if(e.type==='defeat-enemy'&&age<.3&&!reducedMotion.matches){ctx.save();ctx.globalAlpha=1-age/.3;const h=e.kind==='boss'?80:52,im=images[e.kind],w=h*im.width/im.height;image(e.kind,e.x-w/2,e.y-h*.93-age*12,w,h,1-age/.3);ctx.restore();}
 }
}
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;syncPause();const before=battle.phase;advance(battle,dt);if(before!==battle.phase&&['intermission','victory','defeat'].includes(battle.phase)){try{saveBoundary();}catch(e){error(e);}}
 draw();const status=`<span class="hud-name">${ROLES[battle.hero.role].name} · 第 ${battle.stage} 關 · ${battle.wave} 波</span><span>生命 ${battle.hp}</span><span>金幣 ${battle.gold}</span>`;if($('status').innerHTML!==status)$('status').innerHTML=status;
 $('wave').disabled=!ready||battle.paused||!['planning','intermission'].includes(battle.phase)||!battle.towers.length||!!battle.blessingChoices.length;setText('wave',battle.phase==='battle'?'守護中':'開始下一波');const remaining=Math.max(0,Math.ceil(battle.hero.skillReady-battle.time));$('skill').disabled=!ready||battle.paused||battle.phase!=='battle'||remaining>0;setText('skill',remaining?`技能 · ${remaining} 秒`:'施放英雄技能');setText('hint',battle.phase==='battle'?'守住道路，把握英雄技能時機':battle.towers.length?'準備完成後，開始下一波':'點選石台，部署你的部隊');
 if(battle.blessingChoices.length&&!document.querySelector('dialog[open]')){$('blessings').replaceChildren();for(const id of battle.blessingChoices){const b=document.createElement('button');b.textContent=BLESSINGS[id].name+'：'+BLESSINGS[id].description;b.onclick=()=>perform(s=>chooseBlessing(s,id));$('blessings').append(b);}show('blessing');}
 if(!failed&&before!==battle.phase&&['victory','defeat'].includes(battle.phase)){
  const won=battle.phase==='victory',c=CAMPAIGN[battle.stage-1];resultPortrait.src=`../../../assets/characters/cxq-role-${battle.hero.role}.webp`;
  $('result-title').textContent=won?(battle.stage===15?'主線守護完成':'守護成功'):'整隊，再出發';
  $('next-stage').hidden=!won||battle.stage>=15;
  $('result-text').textContent=`第 ${battle.stage} 關 · ${c.name}｜擊退 ${battle.kills} 名敵人｜核心 ${battle.hp}/${battle.maxHp}。${ROLES[battle.hero.role].name} 累積熟練度 ${profile.mastery.xp[battle.hero.role]} XP。${won?'前往下一關，迎接新的敵群。':`戰術提醒：${c.tip} 可調整指揮支援區，或在後段補上緩速與火力。未完成的波次不發獎。`}`;
  show('result');
 }requestAnimationFrame(frame);}
function setText(id,value){if($(id).textContent!==value)$(id).textContent=value;}
renderHero();show('cover');resize();
// The cover and camp do not wait for late-game sprites. Battle transitions decode
// exactly the selected hero, region and saved unit levels before showing the field.
ready=true;$('start').disabled=failed;$('enter-camp').disabled=failed;document.body.dataset.ready='true';requestAnimationFrame(frame);
