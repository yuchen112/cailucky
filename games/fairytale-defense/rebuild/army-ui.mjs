import {ARMY3_LAYOUT} from './army3-layout.mjs?v=20261004-army3';
import {drawAttackFootprint,drawArmyMechanics} from './army3-effects.mjs?v=20261004-army3';
import {shapeDescription} from './attack-shapes.mjs?v=20261004-army3';
import {ANIMATION_LAYOUT} from './animation-layout.mjs?v=20261004-army3';
import {installMenuMotion} from './menu-motion.mjs?v=20261004-army3';
import {EFFECT_ART,troopPose,enemyPose,heroPose} from './animation-state.mjs?v=20261004-army3';
import {drawCombatEffects} from './combat-effects.mjs?v=20261004-army3';
import {installInterface} from './interface-ui.mjs?v=20261004-army3';
import {installExpedition} from './expedition-ui.mjs?v=20261004-army3';
import {MAPS,storyFor,storyMap} from './expedition.mjs?v=20261004-army3';
import {renderHeroGuide} from './hero-guide.mjs?v=20261004-army3';
import {createBattleClock} from './battle-clock.mjs?v=20261004-army3';
import {installTactics} from './tactical-ui.mjs?v=20261004-army3';
import {ROLES,UNITS,UNIT_BRANCHES,PADS,pointAt,createBattle,deploy,upgrade,sell,setPriority,upgradeCost,towerStats,startWave,advance,chooseBlessing,BLESSINGS} from './core.mjs?v=20261004-army3';
import {HERO_SPECIALIZATIONS,HERO_TALENTS,supportFor} from './hero-rules.mjs?v=20261004-army3';
import {masteryLevel} from './mastery.mjs?v=20261004-army3';
import {newArmySave,decodeArmySave,prepareArmyExpedition,settleArmySave} from './army-save.mjs?v=20261004-army3';
import {restoreCheckpoint} from './checkpoint.mjs?v=20261004-army3';
import {CAMPAIGN} from './encounters.mjs?v=20261004-army3';
import {SPELL_ART,projectilePose} from './motion.mjs?v=20261004-army3';
import {unitArt,branchGuide} from './unit-presentation.mjs?v=20261004-army3';
import {SPRITE_LAYOUT} from './sprite-layout.mjs?v=20261004-army3';
import {routePads,regionFor,alignCommander} from './routes.mjs?v=20261004-army3';
import {createAudio} from './audio.mjs?v=20261004-army3';
import {installJourney} from './journey-ui.mjs?v=20261004-army3';
const audio=createAudio(),systemMotion=matchMedia('(prefers-reduced-motion: reduce)'),reducedMotion={get matches(){return systemMotion.matches||audio.preferences.reducedMotion;}};
audio.hold(true);
let interfaceUI=null;
let lastSettlement={coins:0,xp:0};let practice=false,autoNextAt=0;let expedition=null,mode='campaign',map=null,chosenUnit=null;let journey=null,tactics=null,storedRaw=null;const battleClock=createBattleClock();
function motionPreference(){document.body.dataset.motion=reducedMotion.matches?'reduced':'full';}
systemMotion.addEventListener('change',motionPreference);motionPreference();
const $=id=>document.getElementById(id),ctx=$('canvas').getContext('2d'),images={},key='cxq.defense.army.v3';
let profile=newArmySave(),battle=createBattle({hero:'growth'}),hero='growth',specialization=null,talents={},last=0,ready=false,failed=false,selectedPad=null,stage=1,unitPreview=null;
const artPromises=new Map(),artQueue=[];let transitioning=false,activeImages=0;
function pumpImages(){while(activeImages<4&&artQueue.length){activeImages++;const task=artQueue.shift();task().finally(()=>{activeImages--;pumpImages();if(!activeImages&&!artQueue.length)audio.hold(false);});}}
const loadingStatus=document.createElement('dialog');loadingStatus.id='loading-status';loadingStatus.setAttribute('aria-label','準備戰場美術');loadingStatus.addEventListener('cancel',e=>e.preventDefault());document.body.append(loadingStatus);
function loadArt(id){if(images[id])return Promise.resolve();if(artPromises.has(id))return artPromises.get(id);audio.hold(true);const promise=new Promise((resolve,reject)=>{artQueue.push(async()=>{const src=id in ROLES?`../../../assets/characters/cxq-role-${id}.webp`:`art/${id}.webp`;for(let attempt=0;attempt<3;attempt++){const im=new Image();im.fetchPriority=id.startsWith('road')?'high':'auto';im.src=src+'?v=20261004-army3'+(attempt?'&retry='+attempt:'');let timer;try{await Promise.race([im.decode(),new Promise((_,fail)=>timer=setTimeout(()=>fail(Error('載入逾時')),15000))]);images[id]=im;resolve();return;}catch(e){im.src='';if(attempt===2){artPromises.delete(id);reject(Error('美術載入失敗：'+id));}}finally{clearTimeout(timer);}}});});artPromises.set(id,promise);pumpImages();return promise;}
function heroArt(id){return [id,id+'-cast',id+'-ready',id+'-victory',...(id==='growth'?['growth-idle']:[]),SPELL_ART[ROLES[id].kind]];}
function ensureBattleArt(s){const ids=['hero-dais','thorn-zone','flame-cone','moth',...EFFECT_ART,...s.loadout.map(id=>'unit-'+id+'-release'),'fx-clover',...Object.values(SPELL_ART),'button',regionFor(s)==='forest'?'road':'road-'+regionFor(s),'walker-step','runner-step','armored-step','boss-ready','boss-cast',...s.loadout.map(id=>'unit-'+id+'-ready'),'pad','seed','impact','target','health-track','health-fill','command-podium','dream-core','walker','runner','armored','boss','range','aura-range','support-range','fx-light','fx-spark',...['bolt','spore','frost','glow'].map(id=>'projectile-'+id),...s.loadout.map(id=>'unit-'+id),...s.towers.map(unitArt),...heroArt(s.hero.role),regionFor(s)==='forest'?'meadow':regionFor(s)==='moon'?'meadow-moon':regionFor(s)==='ruins'?'meadow-ruins-ui':'meadow-dawn'];const unique=[...new Set(ids)];let count=0;return Promise.all(unique.map(async id=>{await loadArt(id);if(transitioning)loadingStatus.textContent='準備戰場美術… '+(++count)+' / '+unique.length;}));}
async function transition(fn){if(transitioning||failed)return;transitioning=true;loadingStatus.textContent='準備戰場美術…';loadingStatus.showModal();syncPause();try{await fn(); }catch(e){loadingStatus.replaceChildren();const message=document.createElement('p');message.textContent=e.message+'。原進度保留，請重試。';const retry=document.createElement('button');retry.textContent='重新載入';retry.onclick=()=>{loadingStatus.close();transition(fn);};const cancel=document.createElement('button');cancel.textContent='返回';cancel.onclick=()=>loadingStatus.close();loadingStatus.append(message,retry,cancel);return;}finally{transitioning=false;if(!loadingStatus.querySelector('button'))loadingStatus.close();syncPause();}}
function error(e){failed=true;$('error').hidden=false;$('error').textContent=`已暫停：${e.message}。未覆蓋原始存檔。請先保留備份再重新載入。`;syncPause();}
try{const raw=localStorage.getItem(key);storedRaw=raw;if(raw)profile=decodeArmySave(raw);const savedHero=localStorage.getItem('cxq.defense.camp-hero')||profile.checkpoint?.hero.role;if(savedHero&&Object.hasOwn(ROLES,savedHero))hero=savedHero;}catch(e){error(e);}
function persist(next){if(localStorage.getItem(key)!==storedRaw)throw Error('另一個分頁更新了進度，請重新載入後再操作');const canonical=decodeArmySave(next),raw=JSON.stringify(canonical);if(storedRaw&&JSON.parse(storedRaw).collection?.version===1&&!localStorage.getItem(key+'.before-collection2'))localStorage.setItem(key+'.before-collection2',storedRaw);localStorage.setItem(key,raw);storedRaw=raw;profile=canonical;journey?.updateWallet();interfaceUI?.refresh();}
function saveBoundary(){if(practice)return;const coins=profile.collection.coins,xp=profile.mastery.xp[battle.hero.role];persist(settleArmySave(profile,battle,profile.mastery.activeRun.id));lastSettlement={coins:profile.collection.coins-coins,xp:profile.mastery.xp[battle.hero.role]-xp};}
function syncPause(){const rotate=$('rotate'),landscape=innerWidth>innerHeight;rotate.hidden=!landscape;if(landscape){if(rotate.open&&document.activeElement.closest('dialog')!==rotate)rotate.close();if(!rotate.open)rotate.showModal();}else if(rotate.open)rotate.close();battle.paused=failed||document.hidden||landscape||!!document.querySelector('dialog[open]:not(#troops)');}
function show(id){if(id==='options'){$('home').hidden=$('cover').open||$('camp').open;$('options').querySelector('[data-close]').textContent=$('home').hidden?'返回':'繼續戰鬥';}if(id==='troops'){if(!$(id).open)$(id).show();}else $(id).showModal();if(id==='cover'){$(id).tabIndex=-1;$(id).focus({preventScroll:true});}syncPause();}
function closeAll(){document.querySelectorAll('dialog[open]:not(#rotate)').forEach(d=>d.close());syncPause();}
function resize(){const app=$('app'),style=getComputedStyle(app),available=app.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-document.querySelector('header').getBoundingClientRect().height-document.querySelector('footer').getBoundingClientRect().height;const scale=Math.min(app.clientWidth/390,Math.max(0,available)/585);$('field').style.width=390*scale+'px';$('field').style.height=585*scale+'px';syncPause();}
window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;syncPause();});
// HUD text and the tactical toolbar can change height after the first layout.
// Refit the board whenever chrome changes, not only when the viewport rotates.
const chromeObserver=new ResizeObserver(resize);for(const el of [document.querySelector('header'),document.querySelector('footer')])chromeObserver.observe(el);
window.visualViewport?.addEventListener('resize',resize);
$('rotate').addEventListener('cancel',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&['rotate','cover','camp','blessing','result','loading-status'].includes(document.activeElement.closest('dialog')?.id)){e.preventDefault();e.stopImmediatePropagation();}},true);
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',syncPause);d.addEventListener('cancel',e=>{if(['cover','camp','blessing','result'].includes(d.id))e.preventDefault();});});
function optionGroup(label,choices,value,locked,onchange){const wrapper=document.createElement('label');wrapper.textContent=label;const select=document.createElement('select');select.disabled=locked;select.add(new Option(locked?'熟練度不足':'不裝備',''));for(const c of choices)select.add(new Option(c.name,c.id));select.value=value||'';const detail=document.createElement('p');const update=()=>{detail.textContent=choices.find(c=>c.id===select.value)?.description||'可在出戰前自由選擇，戰鬥中不能更換。';};select.onchange=()=>{onchange(select.value||null);renderHero();};wrapper.append(select);$('build').append(wrapper,detail);update();}
function renderHero(){for(const b of $('heroes').children)b.setAttribute('aria-pressed',String(b.dataset.hero===hero));const xp=profile.mastery.xp[hero],level=masteryLevel(xp);$('hero-portrait').src=`../../../assets/characters/cxq-role-${hero}.webp`;$('hero-portrait').alt=ROLES[hero].name;$('hero-info').textContent=`${ROLES[hero].name} · 熟練 Lv.${level}`;$('cultivation-info').textContent=`${ROLES[hero].name} · ${xp} XP`;$('hero-summary').textContent=({growth:'培育精銳 · 全場部隊強化',dream:'夢印連動 · 星光清場',luck:'幸運補給 · 次數暴擊',joy:'連擊加速 · 全隊鼓舞',night:'遠距追擊 · 集中重擊',sadness:'細雨緩速 · 防線控場',trust:'職業協同 · 連結支援',memory:'記錄傷害 · 回響爆發',healing:'波次修復 · 生命庇護',hope:'穿甲之光 · 強敵對策'})[hero];$('build').replaceChildren();renderHeroGuide($('build'),hero,xp,level,{specialization,talents});optionGroup('三級英雄專精',HERO_SPECIALIZATIONS[hero],specialization,level<3,v=>specialization=v);for(const [slot,tier] of Object.entries(HERO_TALENTS))optionGroup(`${tier.level} 級戰術`,tier.choices,talents[slot],level<tier.level,v=>talents[slot]=v);$('resume').hidden=!profile.checkpoint;$('cover-resume').hidden=!profile.checkpoint;}
$('cultivate').onclick=()=>show('cultivation');$('squad-info').onclick=()=>show('squad');
for(const [id,r] of Object.entries(ROLES)){const b=document.createElement('button');b.dataset.hero=id;b.innerHTML=`<img loading="lazy" decoding="async" src="../../../assets/characters/cxq-role-${id}.webp" alt=""><span>${r.name}</span>`;b.onclick=()=>{hero=id;try{localStorage.setItem('cxq.defense.camp-hero',id);}catch{}specialization=null;talents={};renderHero();Promise.all(heroArt(id).map(loadArt)).catch(()=>{});};$('heroes').append(b);}
function perform(fn){return transition(async()=>{const draft=structuredClone(battle);draft.paused=false;if(!fn(draft))return;await ensureBattleArt(draft);if(!practice&&['planning','intermission'].includes(draft.phase))persist(settleArmySave(profile,draft,profile.mastery.activeRun.id));battle=draft;closeAll();});}
function openPad(i){
 if(!ready||failed||['victory','defeat'].includes(battle.phase))return;
 selectedPad=i;unitPreview=null;const t=battle.towers.find(t=>t.pad===i),content=$('troop-content');content.replaceChildren();$('troops').querySelector('.troop-confirm-actions')?.remove();$('troop-title').textContent=t?`${UNITS[t.role].name} · Lv.${t.level}`:`部署位置 ${i+1}`;
 if(!t&&chosenUnit){show('troops');previewDeployment(i,chosenUnit);return;}
 if(!t){const grid=document.createElement('div');grid.className='deploy-grid';for(const id of battle.loadout){const r=UNITS[id],b=document.createElement('button');b.innerHTML=`<img src="art/unit-${id}.webp" alt=""><span>${r.name}</span><small>${r.cost} 金幣</small>`;b.disabled=battle.gold<r.cost;b.onclick=()=>previewDeployment(i,id);grid.append(b);}content.append(grid);}
 else {
 const stats=towerStats(t,battle),head=document.createElement('div');head.className='unit-panel-head';head.innerHTML=`<img src="art/${unitArt(t)}.webp" alt="${UNITS[t.role].name}"><p>${stats.income?'每波補給 '+stats.income+' 金幣（全隊上限 36）':'傷害 '+stats.damage.toFixed(1)+' · 射程 '+stats.range+'<br>每 '+stats.interval.toFixed(2)+' 秒攻擊'}<br>${shapeDescription(stats)}</p>`;content.append(head);
 const grid=document.createElement('div');grid.className='unit-upgrades';content.append(grid);
 const offer=(branch=null)=>{const next={...t,level:t.level+1,branch:branch?.id??t.branch},after=towerStats(next,battle),button=document.createElement('button');button.innerHTML=`<img src="art/${unitArt(next)}.webp" alt=""><span>${branch?.name||'升至 Lv.'+next.level}</span><small>${stats.income?'補給 '+stats.income+'→'+after.income:stats.damage.toFixed(0)+'→'+after.damage.toFixed(0)} · ${upgradeCost(t)} 金幣</small>`;button.dataset.cost=upgradeCost(t);button.disabled=battle.gold<upgradeCost(t);button.onclick=()=>previewUpgrade(i,next);grid.append(button);};
 if(t.level===2)UNIT_BRANCHES[t.role].forEach(offer);else if(t.level<5)offer();else{const p=document.createElement('p');p.textContent='已達最高等級';grid.append(p);}
 const tools=document.createElement('div');tools.className='unit-panel-tools';const priority=document.createElement('select');priority.setAttribute('aria-label','攻擊優先順序');for(const [v,label] of [['first','接近終點'],['strong','最高生命'],['armor','重甲優先']])priority.add(new Option(label,v));priority.value=t.priority||'first';priority.onchange=()=>perform(s=>setPriority(s,i,priority.value));const detail=document.createElement('button');detail.textContent='介紹';detail.onclick=()=>journey.openUnit(t.role);const sellButton=document.createElement('button');sellButton.textContent=`撤回 +${Math.floor(t.spent*.7)}`;sellButton.onclick=()=>{content.replaceChildren();const p=document.createElement('p');p.textContent=`撤回 ${UNITS[t.role].name}？退還 ${Math.floor(t.spent*.7)} 金幣（投入的 70%）。`;content.append(p);const yes=document.createElement('button');yes.id='confirm-sell';yes.textContent='確認撤回';yes.onclick=()=>perform(s=>sell(s,i));const no=document.createElement('button');no.textContent='保留部隊';no.onclick=()=>openPad(i);troopConfirm(yes,no);};tools.append(priority,detail,sellButton);content.append(tools);
 }
 show('troops');content.scrollTop=0;
}
function troopConfirm(yes,back){$('troops').querySelector('.troop-confirm-actions')?.remove();const actions=document.createElement('div');actions.className='troop-confirm-actions';actions.append(yes,back);$('troop-content').after(actions);$('troop-content').scrollTop=0;}
function previewDeployment(pad,role){
 const stats=towerStats({role,level:1,branch:null},battle);unitPreview={pad,stats};const content=$('troop-content');content.innerHTML=`<div class="unit-panel-head"><img src="art/unit-${role}.webp" alt=""><p>${UNITS[role].name}<br>${stats.income?'每波補給 '+stats.income+' 金幣（全隊上限 36）':'傷害 '+stats.damage.toFixed(1)+' · 射程 '+stats.range+'<br>每 '+stats.interval.toFixed(2)+' 秒攻擊'}<br>${shapeDescription(stats)}</p></div>`;
 const yes=document.createElement('button');yes.id='confirm-deploy';yes.textContent=`部署 · ${UNITS[role].cost} 金幣`;yes.dataset.cost=UNITS[role].cost;yes.disabled=battle.gold<UNITS[role].cost;yes.onclick=()=>perform(s=>deploy(s,pad,role));const back=document.createElement('button');back.textContent='更換兵種';back.onclick=()=>{chosenUnit=null;openPad(pad);};troopConfirm(yes,back);
}
function previewUpgrade(pad,next){
 const old=battle.towers.find(t=>t.pad===pad),before=towerStats(old,battle),after=towerStats(next,battle);unitPreview={pad,stats:after,oldStats:before};const content=$('troop-content');content.innerHTML=`<div class="unit-panel-head"><img src="art/${unitArt(next)}.webp" alt="${UNITS[next.role].name} 升級造型"><p>Lv.${old.level} → Lv.${next.level}<br>${before.income?'每波補給 '+before.income+' → '+after.income+' 金幣<br>恢復 '+before.heal+' → '+after.heal+' 點生命':'傷害 '+before.damage.toFixed(1)+' → '+after.damage.toFixed(1)}<br>射程 ${before.range} → ${after.range}</p></div><p class="branch-effect">${branchGuide(next.role,next.branch)}${next.level===3?'分支確定後，此次部署不能更換。':''}</p>`;
 const yes=document.createElement('button');yes.id='confirm-upgrade';yes.textContent=`升級 · ${upgradeCost(old)} 金幣`;yes.dataset.cost=upgradeCost(old);yes.disabled=battle.gold<upgradeCost(old);yes.onclick=()=>perform(s=>upgrade(s,pad,next.branch));const back=document.createElement('button');back.textContent='返回比較';back.onclick=()=>openPad(pad);troopConfirm(yes,back);
}
PADS.forEach((p,i)=>{const b=document.createElement('button');b.className='pad-hit';b.style.left=p.x/390*100+'%';b.style.top=p.y/585*100+'%';b.setAttribute('aria-label',`部署位置 ${i+1}`);b.onclick=()=>openPad(i);$('pads').append(b);});
function start(){practice=false;return transition(async()=>{const next=prepareArmyExpedition(profile,{hero,specialization,talents,stage,mode,map:mode==='campaign'?storyMap(stage):map,loadout:profile.loadout},crypto.randomUUID());await ensureBattleArt(next.battle);persist(next.save);battle=next.battle;chosenUnit=null;renderDock();tactics?.reset();closeAll();});}
function briefing(){const c=CAMPAIGN[stage-1];$('briefing-title').textContent=mode==='endless'?`無盡守城 · ${MAPS[map].name}`:`第 ${stage} 關 · ${c.name}`;$('briefing-tip').textContent=mode==='endless'?MAPS[map].intro+' 無盡模式：每兩波選擇祝福、每五波可撤離。':storyFor(stage).text+' 戰術：'+c.tip;$('briefing-team').textContent=`指揮英雄：${ROLES[hero].name} · ${profile.loadout.map(id=>UNITS[id].name).join('／')}`;$('briefing-enemies').replaceChildren();for(const kind of new Set(c.waves.flat())){const f=document.createElement('figure'),im=document.createElement('img'),label=document.createElement('figcaption');im.src=`art/${kind}.webp`;label.textContent=({walker:'步兵',runner:'快腳',armored:'重甲',boss:'頭目',moth:'夜羽飛蛾（空中）'})[kind];f.append(im,label);$('briefing-enemies').append(f);}campaignDialog.close();show('briefing');}
$('briefing-start').onclick=()=>profile.checkpoint?show('replace'):start();
$('briefing').querySelector('[data-close]').onclick=()=>{$('briefing').close();if(mode==='endless')$('start-endless').click();else selectStage();};
const battlefieldHero=document.createElement('button');battlefieldHero.id='battle-hero';battlefieldHero.className='battle-hero-hit';battlefieldHero.setAttribute('aria-label','英雄技能與全場支援說明');battlefieldHero.onclick=()=>commandHit.click();$('pads').append(battlefieldHero);
const commandHit=document.createElement('button');commandHit.className='commander-hit';commandHit.setAttribute('aria-label','英雄指揮區');commandHit.innerHTML='<img alt="指揮英雄"><span>指揮官</span>';document.querySelector('header').prepend(commandHit);
const campaignDialog=document.createElement('dialog');campaignDialog.id='campaign';campaignDialog.innerHTML='<h2>選擇守護地點</h2><div class="scroll-body" id="stages"></div><button id="campaign-back">返回營地</button>';document.body.append(campaignDialog);campaignDialog.addEventListener('close',syncPause);$('campaign-back').onclick=()=>campaignDialog.close();
function selectStage(){mode='campaign';map=null;const list=$('stages');list.replaceChildren();for(const c of CAMPAIGN){const b=document.createElement('button');b.dataset.stage=c.stage;b.disabled=c.stage>profile.campaign.unlocked;b.textContent=`${c.stage}. ${storyFor(c.stage).name} · ${c.name}${profile.campaign.cleared.includes(c.stage)?' · 已通關':''}`;const tip=document.createElement('small');tip.textContent=b.disabled?'完成前一關後開放':c.tip;b.append(tip);b.onclick=()=>{stage=c.stage;briefing();};list.append(b);}show('campaign');}
$('start').setAttribute('aria-label','選擇關卡');$('start').onclick=selectStage;$('confirm-start').onclick=start;
$('squad').querySelector('p').textContent='同種可重複部署，占用空地台並消耗金幣。現有四種出戰部隊；主線十五關依序開放。';
const squadDescriptions=['橡果弩手｜連弩／重弩','蘑菇炮手｜擴散／穿甲','霜露精靈｜長效緩速／定身','螢光射手｜遠射／連射'];
$('squad').querySelectorAll('figcaption').forEach((e,i)=>e.textContent=squadDescriptions[i]);
const resultPortrait=document.createElement('img');resultPortrait.className='result-portrait';resultPortrait.alt='';$('result-title').after(resultPortrait);
for(const id of ['squad','briefing','result']){const d=$(id),body=document.createElement('div');body.className='dialog-content';for(const e of [...d.children])if(e.tagName!=='H2'&&e.tagName!=='BUTTON')body.append(e);d.querySelector('h2').after(body);}
const nextStage=document.createElement('button');nextStage.id='next-stage';nextStage.textContent='前往下一關';$('result').insertBefore(nextStage,$('result-home'));nextStage.onclick=()=>{if(battle.mode!=='campaign'||battle.phase!=='victory'||battle.stage>=15)return;mode='campaign';stage=battle.stage+1;hero=battle.hero.role;specialization=battle.hero.specialization;talents={...battle.hero.talents};start();};
$('enter-camp').onclick=()=>{closeAll();renderHero();show('camp');ensureBattleArt(battle).catch(()=>{});};$('camp-cover').onclick=()=>{closeAll();show('cover');};$('cover-settings').onclick=()=>show('cover-help');
$('cover-resume').onclick=()=> $('resume').click();
$('resume').onclick=()=>transition(async()=>{const restored=restoreCheckpoint(profile.checkpoint);alignCommander(restored);await ensureBattleArt(restored);battle=restored;practice=false;chosenUnit=null;renderDock();tactics?.reset();closeAll();});
$('wave').onclick=()=>{try{saveBoundary();startWave(battle);}catch(e){error(e);}};
$('skill').onclick=()=>castHero(battle);$('settings').onclick=()=>show('options');
function home(){practice=false;closeAll();battle=createBattle({hero});alignCommander(battle);renderHero();show('camp');}
$('home').onclick=()=>battle.phase==='battle'?show('leave'):home();$('confirm-home').onclick=home;$('result-home').onclick=home;
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([failed&&storedRaw?storedRaw:JSON.stringify(profile,null,2)],{type:'application/json'}));a.href=url;a.download='cxq-defense-army.json';a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);};
let pendingImport=null;
const backupInput=document.createElement('input');backupInput.type='file';backupInput.accept='.json,application/json';backupInput.id='backup-file';backupInput.hidden=true;document.body.append(backupInput);
const importButton=document.createElement('button');importButton.id='import';importButton.textContent='匯入備份';$('export').after(importButton);
const importDialog=document.createElement('dialog');importDialog.id='import-confirm';importDialog.innerHTML='<h2>還原遊戲備份</h2><p id="import-summary"></p><button id="apply-import">確認取代本機進度</button><button id="cancel-import">取消</button>';document.body.append(importDialog);importDialog.addEventListener('close',syncPause);
importButton.onclick=()=>backupInput.click();
backupInput.onchange=async()=>{const file=backupInput.files[0];backupInput.value='';if(!file)return;pendingImport=null;try{if(file.size>1024*1024)throw Error('備份檔案過大');pendingImport=decodeArmySave(await file.text());$('import-summary').textContent=`此備份已開放第 ${pendingImport.campaign.unlocked} 關。還原會取代目前進度與戰場；建議先匯出目前備份。`;$('apply-import').hidden=false;}catch(e){$('import-summary').textContent=`無法還原：${e.message}。目前進度沒有變更。`;$('apply-import').hidden=true;}show('import-confirm');};
$('cancel-import').onclick=()=>{pendingImport=null;importDialog.close();};
$('apply-import').onclick=()=>{if(!pendingImport)return;try{persist(pendingImport);failed=false;$('error').hidden=true;$('start').disabled=false;$('enter-camp').disabled=false;pendingImport=null;hero=profile.checkpoint?.hero.role||'growth';specialization=null;talents={};home();}catch(e){$('import-summary').textContent=`無法儲存：${e.message}。請保留備份。`;}};
function image(id,x,y,w,h,alpha=1){if(!images[id])return;ctx.globalAlpha=alpha;ctx.drawImage(images[id],x,y,w,h);ctx.globalAlpha=1;}
function centeredImage(id,size,alpha=1){const im=images[id];if(!im)return;const scale=size/Math.max(im.width,im.height),w=im.width*scale,h=im.height*scale;image(id,-w/2,-h/2,w,h,alpha);}
function sprite(id,x,y,h,alpha=1){if(alpha>0)renderedActors.push(id);const im=images[id];if(im){const a=ARMY3_LAYOUT[id]||ANIMATION_LAYOUT[id]||SPRITE_LAYOUT[id]||{anchorX:.5,anchorY:.93,visibleHeight:1},height=h/a.visibleHeight,w=height*im.width/im.height;image(id,x-w*a.anchorX,y-height*a.anchorY,w,height,alpha);}}
let renderedActors=[];
const facingByActor=new Map();let facingBattle=null;
function actor(id,x,y,h,identity){
 if(facingBattle!==battle){facingByActor.clear();facingBattle=battle;}
 const t=battle.towers.find(t=>t.pad===identity.pad),event=battle.events.findLast(e=>['anticipate','release'].includes(e.type)&&!e.hero&&e.pad===identity.pad),target=battle.enemies.find(e=>e.id===event?.targetId);
 if(target)facingByActor.set(identity.pad,pointAt(target.distance,battle,target.route).x<x?-1:1);
 const direction=facingByActor.get(identity.pad)||1,m=troopPose(battle,t,reducedMotion.matches);let art=id;const supply=battle.events.findLast(e=>e.type==='supply');if(t.role==='artisan'&&supply&&battle.time-supply.time<.34)m.phase='release';
 // Never swap a developed branch back to the base character during an attack.
 if(!reducedMotion.matches&&id==='unit-'+t.role){if(m.phase==='windup'&&images[id+'-ready'])art=id+'-ready';else if(m.phase==='release')art=id+'-release';}
 const upgradeEvent=battle.events.findLast(e=>e.type==='upgrade'&&e.pad===t.pad&&battle.time-e.time<.28);
 ctx.save();ctx.translate(x+m.x*direction,y+m.y);ctx.scale(direction*m.sx,m.sy);ctx.rotate(m.angle);
 if(upgradeEvent?.before&&!reducedMotion.matches){const k=(battle.time-upgradeEvent.time)/.28;sprite(unitArt(upgradeEvent.before),0,0,h,1-k);sprite(art,0,0,h,k);}else sprite(art,0,0,h);
 ctx.restore();
}
function rangeArt(id,p,r,alpha=.7){const support=id==='aura-range',ratio=support?.4228515625:.423242,size=r/ratio,cx=support?.4990234375:.5,cy=support?.494140625:.5;image(support?'support-range':id,p.x-size*cx,p.y-size*cy,size,size,alpha);}
function health(e,p,height){
 const y=p.y-height-4,track={x:.015625,y:.357143,w:.96875,h:.274725},fill={x:.048828,y:.333333,w:.902344,h:.333333};
 image('health-track',p.x-20-track.x*40/track.w,y-track.y*6/track.h,40/track.w,6/track.h);
 ctx.save();ctx.beginPath();ctx.rect(p.x-18,y+1,36*Math.max(0,e.hp/e.maxHp),4);ctx.clip();image('health-fill',p.x-18-fill.x*36/fill.w,y+1-fill.y*4/fill.h,36/fill.w,4/fill.h);ctx.restore();
}
let lastLayout='';
function draw(){
 renderedActors=[];
 const region=regionFor(battle),pads=routePads(battle);audio.region(region);const layout=[region,battle.hero.x,battle.hero.y].join(':');if(layout!==lastLayout){lastLayout=layout;for(const [i,b] of [...$('pads').querySelectorAll('.pad-hit')].entries()){b.style.left=pads[i].x/390*100+'%';b.style.top=pads[i].y/585*100+'%';}commandHit.querySelector('img').src=`../../../assets/characters/cxq-role-${battle.hero.role}.webp`;}if(document.body.dataset.region!==region)document.body.dataset.region=region;
 ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,390,585);image(region==='forest'?'road':'road-'+region,0,0,390,585);
 for(const p of pads)image('pad',p.x-40,p.y-24,80,50);
 for(const o of tactics?.overlays()||[]){rangeArt(o.id,o.p,o.r,tactics.coverage?.45:.9);image('button',Math.max(2,Math.min(278,o.p.x-55)),Math.max(2,o.p.y-o.r),110,24);ctx.font='bold 12px system-ui';ctx.fillStyle='#fff8dc';ctx.textAlign='center';ctx.fillText(o.label,Math.max(57,Math.min(333,o.p.x)),Math.max(2,o.p.y-o.r)+17);}
 if($('troops').open&&selectedPad!==null){const t=battle.towers.find(t=>t.pad===selectedPad),r=unitPreview?.stats|| (t?towerStats(t,battle):null);if(r){if(unitPreview?.oldStats&&unitPreview.oldStats.range!==r.range)rangeArt('range',pads[selectedPad],unitPreview.oldStats.range,.8);if(!r.income)rangeArt(unitPreview?.oldStats?'aura-range':'range',pads[selectedPad],r.range,.5);drawAttackFootprint({s:battle,p:pads[selectedPad],r,image,rangeArt,ctx,selectedPad});if(r.minRange)rangeArt('aura-range',pads[selectedPad],r.minRange,.5);}}
 for(const e of battle.enemies){const p=pointAt(e.distance,battle,e.route);if(e.castUntil>battle.time)rangeArt('aura-range',p,100,.5);else if(e.wardUntil>battle.time)rangeArt('aura-range',p,36,.4);}
 if($('troops').open&&selectedPad!==null){const p=pads[selectedPad];image('target',p.x-12,p.y-42,24,24);}
 drawArmyMechanics({s:battle,image,rangeArt,ctx,reduced:reducedMotion.matches,simple:document.body.dataset.effects==='simple'});
 const hp=heroPose(battle,reducedMotion.matches);image('hero-dais',battle.hero.x-32,battle.hero.y-12,64,30);const heroHot=$('battle-hero');heroHot.style.left=battle.hero.x/390*100+'%';heroHot.style.top=battle.hero.y/585*100+'%';
 const objects=battle.towers.map(t=>({y:pads[t.pad].y,draw:()=>actor(unitArt(t),pads[t.pad].x,pads[t.pad].y,72,{pad:t.pad})}));
 objects.push({y:battle.hero.y,draw:()=>{ctx.save();ctx.translate(battle.hero.x,battle.hero.y);ctx.scale(hp.scale,hp.scale);sprite(hp.art,0,0,78);ctx.restore();}});

 const coreHit=battle.events.findLast(e=>e.type==='leak'),coreAge=coreHit?battle.time-coreHit.time:99;
 const coreShake=!reducedMotion.matches&&coreAge<.4?Math.sin(coreAge*45)*3:0;
 const corePoint=pointAt(1e9,battle);image('dream-core',corePoint.x-39+coreShake,503,78,78,battle.hp>0?1:.4);
 if(coreAge<.5)image('impact',corePoint.x-25,521,50,50,1-coreAge/.5);
 ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dc';ctx.strokeStyle='#153d32';ctx.lineWidth=3;
 const coreLabel=`核心 ${battle.hp}/${battle.maxHp}${battle.shield?' · 護盾 '+battle.shield:''}`;ctx.strokeText(coreLabel,corePoint.x,580);ctx.fillText(coreLabel,corePoint.x,580);


 for(const e of battle.enemies){const p=pointAt(e.distance,battle,e.route),height=e.kind==='boss'?80:52;objects.push({y:p.y,draw:()=>{ctx.save();ctx.translate(p.x,p.y);if(pointAt(Math.max(0,e.distance-2),battle,e.route).x>p.x)ctx.scale(-1,1);const motion=enemyPose(battle,e,reducedMotion.matches);ctx.translate(motion.x,motion.y);ctx.rotate(motion.angle);const stepping=motion.step,art=e.kind==='boss'&&e.castUntil>battle.time?'boss-ready':e.kind==='boss'&&battle.events.some(v=>v.type==='boss-ward'&&v.enemyId===e.id&&battle.time-v.time<.5)?'boss-cast':stepping&&images[e.kind+'-step']?e.kind+'-step':e.kind;sprite(art,0,0,height);if(e.slowUntil>battle.time)image('projectile-frost',-16,-12,32,32,.5);ctx.restore();health(e,p,height);const status=[];if(e.blockedUntil>battle.time)status.push('anim-shatter');if(e.air)status.push('moth');if(e.poisonUntil>battle.time)status.push(e.poisonKind==='spark'?'fx-spark':'projectile-spore');if(e.shredUntil>battle.time)status.push('target');if(e.markUntil>battle.time)status.push('fx-light');for(const [i,icon] of status.slice(0,2).entries())image(icon,p.x+18+i*18,p.y-height,20,20);}});}
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());for(const t of battle.towers){const p=pads[t.pad],remaining=Math.ceil(Math.max(t.heroPowerUntil||0,t.trustUntil||0,battle.hero.hasteUntil||0)-battle.time),charges=t.luckyCharges||0;if(remaining>0||charges>0){image('button',p.x-30,p.y-76,60,22);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dc';ctx.fillText(remaining>0?`增益 ${remaining}秒`:`暴擊 ${charges}次`,p.x,p.y-60);}}
 for(const t of battle.towers){const p=pads[t.pad];image('button',p.x-24,p.y+3,48,22);ctx.font='bold 14px system-ui';ctx.fillStyle='#fff8dc';ctx.textAlign='center';ctx.fillText(`Lv.${t.level}`,p.x,p.y+19);}
 for(const shot of battle.shots){
  const e=battle.enemies.find(e=>e.id===shot.targetId);if(!e)continue;
  const visual=shot,p=projectilePose(visual,pointAt(e.distance,battle,e.route),battle.time,reducedMotion.matches),size=shot.hero?34:shot.kind==='spore'?26:32,id=images[`projectile-${shot.kind}`]?`projectile-${shot.kind}`:({crystal:'fx-light',wind:'fx-rune',bloom:'fx-petal',gear:'projectile-spore'})[shot.kind]||SPELL_ART[shot.kind]||'seed';
  if(!reducedMotion.matches&&document.body.dataset.effects!=='simple'){const tail=projectilePose(visual,pointAt(e.distance,battle,e.route),battle.time-.035,false);ctx.save();ctx.translate(tail.x,tail.y);ctx.rotate(tail.angle);centeredImage(id,size*.8,.25);ctx.restore();}
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);centeredImage(id,size);ctx.restore();
 }
 drawCombatEffects({s:battle,pads,corePoint:{x:corePoint.x,y:550},image,sprite,ctx,roles:ROLES,reduced:reducedMotion.matches,simple:document.body.dataset.effects==='simple'});
}
function frame(now){const dt=last?(now-last)/1000:0;last=now;syncPause();const before=battle.phase;battleClock.tick(dt,battle.paused,step=>{advance(battle,step);return battle.phase===before;});if(before!==battle.phase&&['intermission','victory','defeat'].includes(battle.phase)){try{saveBoundary();}catch(e){error(e);}}
 audio.consume(battle);const pose=heroPose(battle,reducedMotion.matches),portrait=commandHit.querySelector('img'),src=pose.art===battle.hero.role?'../../../assets/characters/cxq-role-'+pose.art+'.webp':'art/'+pose.art+'.webp';if(portrait.getAttribute('src')!==src)portrait.src=src;portrait.style.transform='scale('+pose.scale+')';commandHit.dataset.phase=pose.phase;draw();const status=`<span class="hud-name">${practice?'試用 · ':''}${ROLES[battle.hero.role].name} · ${battle.mode==='endless'?'無盡':`第 ${battle.stage} 關`} · ${battle.wave} 波</span><span>生命 ${battle.hp}</span><span>金幣 ${battle.gold}</span>`;if($('status').innerHTML!==status)$('status').innerHTML=status;
 $('wave').disabled=!ready||battle.paused||!['planning','intermission'].includes(battle.phase)||!battle.towers.some(t=>towerStats(t,battle).damage>0)||!!battle.blessingChoices.length;setText('wave',battle.phase==='battle'?'守護中':'開始下一波');const remaining=Math.max(0,Math.ceil(battle.hero.skillReady-battle.time));$('skill').disabled=!ready||battle.paused||battle.phase!=='battle'||remaining>0;setText('hint',battle.phase!=='battle'&&battle.towers.length&&!battle.towers.some(t=>towerStats(t,battle).damage>0)?'補給兵不攻擊，請再部署一名輸出部隊':chosenUnit&&battle.phase!=='battle'?`已選 ${UNITS[chosenUnit].name}，點空地台部署`:battle.phase==='battle'?'守住道路，把握英雄技能時機':battle.towers.length?(battle.towers.some(t=>towerStats(t,battle).damage>0)?'準備完成後，開始下一波':'補給兵不攻擊，請再部署一名輸出部隊'):'點選石台，部署你的部隊');
 if(battle.blessingChoices.length&&!document.querySelector('dialog[open]')){$('blessings').replaceChildren();for(const id of battle.blessingChoices){const b=document.createElement('button');b.textContent=BLESSINGS[id].name+'：'+BLESSINGS[id].description;b.onclick=()=>perform(s=>chooseBlessing(s,id));$('blessings').append(b);}show('blessing');}
 if(!failed&&before!==battle.phase&&['victory','defeat'].includes(battle.phase)){
  const won=battle.phase==='victory',c=CAMPAIGN[battle.stage-1];resultPortrait.src=won?`art/${battle.hero.role}-victory.webp`:`../../../assets/characters/cxq-role-${battle.hero.role}.webp`;
  $('result-title').textContent=won?(battle.stage===15?'主線守護完成':'守護成功'):'整隊，再出發';
  $('next-stage').hidden=!won||battle.stage>=15||battle.mode==='endless';
  $('result-text').textContent=`第 ${battle.stage} 關 · ${c.name}｜擊退 ${battle.kills} 名敵人｜核心 ${battle.hp}/${battle.maxHp}。${ROLES[battle.hero.role].name} 累積熟練度 ${profile.mastery.xp[battle.hero.role]} XP。${won?'前往下一關，迎接新的敵群。':`戰術提醒：${c.tip} 可調整編隊，或在後段補上緩速與火力。未完成的波次不發獎。`}`;
  if(battle.mode==='endless')$('result-text').textContent=`${MAPS[battle.map||'forest'].name} · 完成 ${Math.max(0,battle.wave-1)} 波 · 擊退 ${battle.kills} 名敵人。已取得獎勵保留；本地紀錄 ${profile.endless[battle.map||'forest']} 波。`;
  else if(won)$('result-text').textContent+=' '+(battle.stage===15||storyMap(battle.stage+1)!==storyMap(battle.stage)?storyFor(battle.stage).end:'伙伴們整理防線，帶著新的線索繼續前進。');
  if(!won&&battle.leaks){const most=Object.entries(battle.leaks).sort((a,b)=>b[1]-a[1])[0];if(most)$('result-text').textContent+=' 本局漏怪最多：'+({runner:'快速敵人，建議加強緩速。',armored:'重甲敵人，建議增加破甲或穿甲。',boss:'頭目，建議集中高傷與英雄大招。',walker:'普通敵人，建議補足火力覆蓋。'})[most[0]];}
  $('result').querySelector('.reward-receipt')?.remove();if(!practice){const receipt=document.createElement('p');receipt.className='reward-receipt';receipt.textContent=`本波已入帳：星露 +${lastSettlement.coins} · 熟練度 +${lastSettlement.xp} XP`; $('result-text').after(receipt);}
  show('result');
 }if(practice&&['victory','defeat'].includes(battle.phase)){$('result-title').textContent='試用結束';$('result-text').textContent='本次試用不消耗資源、不取得獎勵；正式戰場存檔保留。';$('next-stage').hidden=true;}
 if(autoWaves.checked&&!practice&&!battle.paused&&battle.phase==='intermission'&&!battle.blessingChoices.length){autoNextAt||=now+4000;setText('hint',`自動接波 · ${Math.max(0,Math.ceil((autoNextAt-now)/1000))} 秒`);if(now>=autoNextAt){try{saveBoundary();startWave(battle);}catch(e){error(e);}autoNextAt=0;}}else autoNextAt=0;
 retreat.hidden=!(!practice&&battle.mode==='endless'&&battle.phase==='intermission'&&battle.wave>0&&battle.wave%5===0);tactics?.update();interfaceUI?.update(battle,selectedPad);requestAnimationFrame(frame);}
function setText(id,value){if($(id).textContent!==value)$(id).textContent=value;}

async function startTrial(id){return transition(async()=>{const demo=createBattle({hero,loadout:UNITS[id].income?[id,'archer']:[id],mode:'endless',map:'forest',masteryXp:profile.mastery.xp[hero],specialization,talents});demo.gold=2500;alignCommander(demo);await ensureBattleArt(demo);practice=true;battle=demo;chosenUnit=id;renderDock();tactics?.reset();closeAll();});}
const autoLabel=document.createElement('label');autoLabel.innerHTML='<input type="checkbox" id="auto-waves"> 波次間自動接波（四秒準備）';$('options').append(autoLabel);const autoWaves=autoLabel.querySelector('input');
const dock=document.createElement('div');dock.id='troop-dock';$('hint').before(dock);
function renderDock(){dock.replaceChildren();for(const id of battle.loadout){const b=document.createElement('button');b.dataset.troop=id;b.setAttribute('aria-pressed',String(chosenUnit===id));b.innerHTML=`<img src="art/unit-${id}.webp" alt="${UNITS[id].name}"><span>${UNITS[id].cost}</span>`;b.onclick=()=>{chosenUnit=chosenUnit===id?null:id;renderDock();};dock.append(b);}interfaceUI?.dockTools();}
const retreat=document.createElement('button');retreat.id='retreat';retreat.textContent='安全撤離 · 結算';retreat.hidden=true;$('wave').after(retreat);
retreat.onclick=()=>{try{saveBoundary();persist({...profile,checkpoint:null});$('result-title').textContent='無盡守護 · 安全撤離';$('result-text').textContent=`完成 ${battle.wave} 波，已取得的星露與熟練度保留。最高紀錄 ${profile.endless[battle.map||'forest']} 波。`;$('next-stage').hidden=true;show('result');}catch(e){error(e);}};

// Read-only diagnostics for release acceptance; callers receive a detached snapshot.
export function diagnostics(){return {battle:structuredClone(battle),art:Object.keys(images),audio:audio.debug(),animation:{actors:[...renderedActors],heroPhase:commandHit.dataset.phase,effects:document.body.dataset.effects},failed,transitioning};}
journey=installJourney({getProfile:()=>profile,commit:persist,show,syncPause,audio,onMotion:motionPreference,onTrial:id=>startTrial(id)});
expedition=installExpedition({getProfile:()=>profile,commit:persist,show,syncPause,openUnit:id=>journey.openUnit(id),startEndless:id=>{mode='endless';map=id;stage=1;briefing();}});
tactics=installTactics({getBattle:()=>battle,clock:battleClock,show,syncPause,audio,perform});

for(const [i,position] of [[0,[12,58]],[1,[83,39]],[2,[62,70]]]){const w=document.createElement('img');w.src='art/fx-light.webp';w.alt='';w.className='cover-wisp';w.style.left=position[0]+'%';w.style.top=position[1]+'%';w.style.animationDelay=(-i*1.2)+'s';$('cover').append(w);}
interfaceUI=installInterface({getProfile:()=>profile,getHero:()=>hero,getBattle:()=>battle,show,syncPause,refreshHero:renderHero,audio,reducedMotion,openUnit:id=>journey.openUnit(id)});
installMenuMotion({reducedMotion});
alignCommander(battle);renderHero();show('cover');resize();
// The cover and camp do not wait for late-game sprites. Battle transitions decode
// exactly the selected hero, region and saved unit levels before showing the field.
ready=true;$('start').disabled=failed;$('enter-camp').disabled=failed;document.body.dataset.ready='true';requestAnimationFrame(frame);
