import {playOutcomeMotion} from './outcome-motion.mjs?v=6.12';
import {rolePerformance} from './expedition-stats.mjs?v=6.12';
import {traitEffect} from './expedition-data.mjs?v=6.12';
import {loadAnimationManifest,ensureRoleAnimation,ensureMapAnimations,ensureMonsterAnimation,actorFrame} from './animation-assets.mjs?v=5.5';
import{bindBattleTouch}from'./battle-touch.mjs?v=6.9';
import{ROLES,MAPS,MONSTERS,EQUIPMENT,PASSIVES,DIFFICULTY_ORDER,DIFFICULTY,getRole,getMap,weaponName,branchOf,upgradeInfo}from'./expedition-data.mjs?v=6.12';
import{createExpedition,step,choose,reroll,skip,ban,dash,active,restore,serialize,summary,defaultProfile,validateProfile,upgradeCost,upgradeEquipment,upgradeTrait,settle,canEnterDifficulty,ensureChoices}from'./expedition-core.mjs?v=6.12';
import{Renderer,preview}from'./expedition-renderer.mjs?v=6.12';
import{Sound}from'./audio-v5.mjs?v=20261108-buffered1';
const $=id=>document.getElementById(id),KEY='cxq-star-survivors-v4',RUN=KEY+'-run',OLD='cxq-star-survivors-v1';
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const portrait=id=>'../../assets/characters/cxq-role-'+id+'.webp';
const mapMechanic={cave:'晶簇共鳴',forest:'花苞淨化',coast:'潮汐與沙洲',clock:'回聲與時域',sky:'風場與雷光'};
const roleStyle={joy:'跟著節拍移動，以音波與煙花清出前進的路。',dream:'星彈、隕星與光束交織，讓每次施法都有不同可能。',night:'維持射擊距離，將追擊而來的怪群引入月箭路徑。',sadness:'以細雨累積寒霜，掌握敵群步伐，再集中擊破。',trust:'持盾走向戰場，利用抵擋與反擊創造突圍空間。',memory:'記錄攻擊的落點，把敵人引回即將重現的回聲。',growth:'與森林夥伴並肩前進，以召喚與荊棘守護旅途。',healing:'用花瓣與柔軟庇護穩住步伐，讓續戰成為力量。',luck:'累積幸運、把握四葉時刻，以彈跳與連鎖迎向怪群。',hope:'拉出清楚的貫刺路徑，以破曉星槍擊破重甲與首領。'};
const materialName=id=>MAPS.find(m=>m.material.id===id)?.material.name||id;
let storage=true,storageMessage='',profile=defaultProfile(),saved=null,roleId='dream',mapId='cave',difficulty='normal',tab='journey',codexTab='monsters';
try{const raw=localStorage.getItem(KEY),old=localStorage.getItem(OLD);profile=raw?validateProfile(raw):defaultProfile(old?JSON.parse(old):undefined);if(!raw&&old&&!localStorage.getItem(KEY+'-legacy-profile-backup'))localStorage.setItem(KEY+'-legacy-profile-backup',old);if(!raw)localStorage.setItem(KEY,JSON.stringify(profile));const run=localStorage.getItem(RUN);if(run){saved=restore(run);if(!saved)storageMessage='這份遠征存檔無法讀取；角色與素材仍已保留。'}if(localStorage.getItem(OLD+'-run'))$('legacy-link').hidden=false}catch{storage=false;storageMessage='目前無法儲存，關閉頁面後可能遺失本次進度。'}
if(!profile)profile=defaultProfile();
if(saved){roleId=saved.roleId;mapId=saved.mapId;difficulty=saved.difficulty||'normal'}
let game=null,mode='home',ready=false,last=0,acc=0,hudAt=0,autosave=0,toastTimer=0,banMode=false,settled=false,lastLoadout='',cinema=null,cinemaQueue=[],hitStop=0,resultAt=0,loadFailed=false,orientationBlocked=false;
const images={},renderer=new Renderer(images),sound=new Sound(profile.audio||{musicEnabled:!profile.muted,sfxEnabled:!profile.muted,musicVolume:.55,sfxVolume:.75}),keys=new Set(),joy={x:0,y:0};let stickPointer=null,renderCost=0,renderFrames=0,renderMark=0;
const weaponCount=g=>Object.values(g.weapons||{}).filter(n=>n>0).length;
const passiveCount=g=>Object.values(g.passives||{}).filter(n=>n>0).length;
const format=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const equipOrder=['starfall','prism','colorRing','fireworks','quiver','moonblade','rainbell','tide','chains','ward','mirror','hourglass','seed','thorns','plush','incense','dice','clover','wings','lightning'];
const familyIcon={star:'star',orbit:'orbit',rain:'rain',pulse:'pulse',meteor:'meteor',chain:'chain',summon:'summon',beam:'beam',arrow:'star',shield:'near',echo:'beam',rhythm:'pulse',healing:'vitality',luck:'far',spear:'beam'};
function icon(id,extra=''){if(id.startsWith('main-')){const n=ROLES.findIndex(r=>r.main===id);return`<i class="item-icon equipment-icon ${extra}" aria-hidden="true" style="background-image:url('art/v4/main-weapons.webp');background-size:500% 200%;background-position:${n%5*25}% ${Math.floor(n/5)*100}%"></i>`}if(equipOrder.includes(id)){const n=equipOrder.indexOf(id);return`<i class="item-icon equipment-icon ${extra}" aria-hidden="true" style="background-image:url('art/v4/equipment.webp');background-size:500% 400%;background-position:${n%5*25}% ${Math.floor(n/5)*100/3}%"></i>`}const equip=EQUIPMENT[id];return`<i class="item-icon icon-${equip?familyIcon[equip.family]||'star':id} ${extra}" aria-hidden="true"></i>`}
function store(key,value){try{localStorage.setItem(key,value);return true}catch{storage=false;storageMessage='目前無法儲存，請保持頁面開啟。';$('storage-note').textContent=storageMessage;return false}}
const saveProfile=()=>store(KEY,JSON.stringify(profile));
function persist(){if(game&&['playing','upgrade','branch'].includes(game.status)){saved=structuredClone(game);store(RUN,serialize(game))}}
function refreshWallet(){$('wallet').textContent=Math.floor(profile.coins||0).toLocaleString()+' 星光';$('sound').textContent='聲音設定';$('storage-note').textContent=storageMessage||'進度儲存在此瀏覽器。';$('resume').hidden=!saved;$('resume').textContent=['won','lost'].includes(saved?.status)?'查看遠征結算':'繼續遠征';$('resume').disabled=!ready;$('mission-summary').textContent=getRole(roleId).name+' · '+getMap(mapId).name}
function renderRoster(){$('roster').innerHTML=ROLES.map(r=>`<button data-role="${r.id}" aria-pressed="${r.id===roleId}" aria-label="選擇${r.name}，${r.title}"><img src="${portrait(r.id)}" alt=""><b>${r.name}</b></button>`).join('');$('roster').querySelectorAll('button').forEach(b=>b.onclick=()=>{roleId=b.dataset.role;renderLobby();sound.play('click')})}
function renderRole(){const r=getRole(roleId);$('role-name').textContent=r.name;$('role-title').textContent=r.title;$('role-weapon').textContent=EQUIPMENT[r.main]?.name||'專屬主武器';$('role-description').textContent=roleStyle[r.id]||r.desc;$('role-abilities').innerHTML=`<div class="ability-summary"><b>天賦 · ${r.innate.name}</b>${r.innate.desc}</div><div class="ability-summary"><b>主動 · ${r.active.name}</b>${r.active.desc}</div>`;const art=$('role-preview');if(art.getAttribute('src')!==portrait(r.id)){art.src=portrait(r.id);art.alt=r.name+'角色立繪'}document.documentElement.style.setProperty('--accent',r.color||'#c9afff')}
function renderMaps(){$('map-grid').innerHTML=MAPS.map((m,i)=>`<button class="map-card" data-map="${m.id}" aria-pressed="${m.id===mapId}"><img src="art/v4/map-${m.id}.jpg" alt=""><span class="map-number">EXPEDITION ${String(i+1).padStart(2,'0')}</span><b>${m.name}</b><small>${m.material.name} · ${Math.ceil(m.duration/60)} 分鐘 + 地圖目標</small></button>`).join('');$('map-grid').querySelectorAll('button').forEach(b=>b.onclick=()=>{mapId=b.dataset.map;renderMapDetail();renderMaps();refreshWallet();sound.play('click')})}
function renderDifficulties(){
  if(!canEnterDifficulty(profile,mapId,difficulty)) difficulty='normal';
  $('difficulty-options').innerHTML=DIFFICULTY_ORDER.map(id=>{
    const available=canEnterDifficulty(profile,mapId,id);
    return `<button data-difficulty="${id}" aria-pressed="${difficulty===id}" ${available?'':'disabled'}>${DIFFICULTY[id].name}${available?'':' 🔒'}</button>`;
  }).join('');
  $('difficulty-copy').textContent=DIFFICULTY[difficulty].desc;
  $('difficulty-unlock').textContent='在同一張地圖通過普通、困難、地獄，即可依序解鎖下一階。';
}
function renderMapDetail(){if(!canEnterDifficulty(profile,mapId,difficulty))difficulty='normal';const m=getMap(mapId),boss=MONSTERS.find(e=>e.mapId===mapId&&e.boss)||MONSTERS[m.enemies.at(-1)];$('lobby-scene').style.backgroundImage=`url('art/v4/map-${m.id}.jpg')`;$('map-detail').innerHTML=`<header><b>${m.name}</b><span class="material-chip">${materialIcon(m.material.id)}主要素材 · ${m.material.name}</span></header><p>${m.desc}<br>${m.mechanicDesc||''}</p><div class="map-tags"><span class="tag">${mapMechanic[m.id]||'地圖機制'}</span><span class="tag">${m.objective}</span>${boss?`<span class="tag">首領 · ${boss.name}</span>`:''}<span class="tag">通關 ${profile.clears?.[m.id]||0} 次</span></div>`;renderDifficulties()}
function materialIcon(id){const n=Math.max(0,MAPS.findIndex(m=>m.material.id===id));return`<i class="item-icon material-icon" aria-hidden="true" style="background-image:url('art/v4/materials.webp');background-size:500% 100%;background-position:${n*25}% 0"></i>`}
function materialsHTML(){return`<div class="inventory-strip">${MAPS.map(m=>`<span class="material-token">${materialIcon(m.material.id)}${m.material.name}<b>${Math.floor(profile.materials?.[m.material.id]||0)}</b></span>`).join('')}</div>`}
function costHTML(cost){if(!cost||cost.level>=cost.max)return'已達最高等級';return`${Math.floor(cost.coins||0)} 星光${Object.entries(cost.materials||{}).map(([id,n])=>' · '+materialName(id)+' '+n).join('')}`}
function canAfford(cost){return !!cost&&(profile.coins||0)>=(cost.coins||0)&&Object.entries(cost.materials||{}).every(([id,n])=>(profile.materials?.[id]||0)>=n)&&cost.level<cost.max}
function renderWorkshop(){const r=getRole(roleId),ids=[r.main,...(r.allowedSupports||r.allowed||[])];$('workshop-panel').innerHTML=`<div class="panel-heading"><div><span class="eyebrow">EQUIPMENT WORKSHOP</span><h2>${r.name}的裝備工坊</h2></div><span class="count-pill">專武 + 適用副裝備</span></div><p class="section-copy">在對應地圖收集素材，每級提高裝備主要效力 8%，最高 +40%。攻擊裝備提升傷害，防禦裝備提升回復或護盾；下次出征生效。</p>${materialsHTML()}<div class="equipment-grid">${ids.map(id=>{const e=EQUIPMENT[id],level=profile.equipment?.[id]||0,cost=upgradeCost(profile,id,'equipment');return`<article class="equipment-card">${icon(id)}<span class="enhance-level">強化 +${level} / 5</span><h3>${e.name}</h3><small>${id===r.main?'角色專屬主武器':'可選副裝備 · 佔一個副裝備欄'}</small><p>${e.desc}</p><small>每級${cost?.statLabel||'主要效力'} +8% · 下一級：+${Math.min(5,level+1)*8}%</small><div class="cost">${costHTML(cost)}${cost?.mapId?'<br>素材出處：'+getMap(cost.mapId).name:''}</div><button data-enhance="${id}" ${canAfford(cost)?'':'disabled'}>${level>=5?'已達最高強化':'強化裝備'}</button></article>`}).join('')}</div><p class="resource-note">主武器隨角色出場。副裝備在局內升級時取得，每局最多兩件；強化不會預先佔用局內欄位。</p>`;$('workshop-panel').querySelectorAll('[data-enhance]').forEach(b=>b.onclick=()=>{const before=structuredClone(profile);if(upgradeEquipment(profile,b.dataset.enhance)){const savedUpgrade=saveProfile();if(!savedUpgrade)profile=before;else sound.play('upgrade');refreshWallet();renderWorkshop();toast(savedUpgrade?'裝備強化完成 · 下次出征生效':'無法儲存，本次強化未套用')}})}
function renderTraits(){const r=getRole(roleId),level=profile.traits?.[roleId]||0,cost=upgradeCost(profile,roleId,'trait'),mastery=profile.mastery?.[roleId]||0;$('traits-panel').innerHTML=`<div class="panel-heading"><div><span class="eyebrow">CHARACTER LEGACY</span><h2>${r.name}的角色特性</h2></div><span class="count-pill">個別培養 · 持續保存</span></div><p class="section-copy">冒險累積角色熟練，地圖素材用於特性培育。每位角色獨立成長。</p>${materialsHTML()}<article class="trait-feature"><span class="trait-level">特性培育 Lv.${level} / 5</span><h3>${r.innate.name}</h3><p>${r.innate.desc}</p><p>${traitEffect(roleId,level)}</p><p class="trait-next">${level<5?'下一級 · '+traitEffect(roleId,level+1):'特性已達最高等級'}</p><div class="progress-track"><i style="width:${level/5*100}%"></i></div><div class="inventory-strip"><span class="material-token">角色熟練<b>${mastery}</b></span><span class="material-token">${r.active.name}<b>${r.active.cooldown} 秒</b></span></div><p>${r.active.desc}</p><div class="cost">${costHTML(cost)}${cost?.mapId?'<br>素材出處：'+getMap(cost.mapId).name:''}</div><button id="upgrade-trait" ${canAfford(cost)?'':'disabled'}>${level>=5?'特性已完成培育':'培育角色特性'}</button></article><p class="resource-note">角色與地圖均可直接選擇。你可以為想培育的裝備與特性，前往對應地圖收集素材。</p>`;$('upgrade-trait').onclick=()=>{const before=structuredClone(profile);if(upgradeTrait(profile,roleId)){const savedUpgrade=saveProfile();if(!savedUpgrade)profile=before;refreshWallet();renderTraits();if(savedUpgrade)sound.play('upgrade');toast(savedUpgrade?'角色特性已提升 · 下次出征生效':'無法儲存，本次培育未套用')}}}
const behaviorLabel={bossCrystal:'共鳴首領',bossRoots:'森林首領',bossTide:'潮汐首領',bossClock:'時序首領',bossSky:'蒼穹首領',summoner:'召喚援軍',zigzag:'交錯追擊',echo:'延遲回響',chase:'追擊',ranged:'遠距施法',range:'遠距攻擊',charge:'蓄力衝鋒',shield:'正面防禦',summon:'召喚援軍',zone:'地面控制',split:'分裂',burrow:'潛行突襲',healer:'治療同伴',orbit:'環繞追擊',boss:'首領',heavy:'重裝',fast:'快速追擊',explode:'爆炸預告',sniper:'瞄準射擊',dash:'突進',turret:'定點射擊'};
function renderCodex(){$('codex-panel').innerHTML=`<div class="panel-heading"><div><span class="eyebrow">EXPEDITION ARCHIVE</span><h2>冒險圖鑑</h2></div></div><div class="codex-tabs"><button data-codex="monsters" aria-pressed="${codexTab==='monsters'}">怪物圖鑑</button><button data-codex="equipment" aria-pressed="${codexTab==='equipment'}">裝備圖鑑</button></div>${codexTab==='monsters'?MAPS.map(m=>`<h3 class="codex-map-group">${m.name} · ${m.material.name}</h3><div class="codex-grid">${MONSTERS.filter(e=>e.mapId===m.id).map(e=>`<article class="codex-card"><canvas width="180" height="150" data-species="${e.id}" aria-label="${e.name}動作預覽"></canvas><b>${e.name}${e.boss?' · 首領':''}</b><p>${e.desc||behaviorLabel[e.behavior]||e.behavior}</p><span class="tag">${behaviorLabel[e.behavior]||e.behavior}</span></article>`).join('')}</div>`).join(''):`<p class="section-copy">每位角色固定攜帶專屬主武器，從適用副裝備中選擇兩件。以下顯示目前角色可使用的裝備。</p><div class="equipment-grid">${[getRole(roleId).main,...(getRole(roleId).allowedSupports||getRole(roleId).allowed||[])].map(id=>{const e=EQUIPMENT[id],users=ROLES.filter(r=>r.main===id||(r.allowedSupports||r.allowed||[]).includes(id));return`<article class="equipment-card">${icon(id)}<h3>${e.name}</h3><small>${e.kind==='main'?'專屬主武器':'副裝備'}</small><p>${e.desc}</p><p class="equip-compatible">適用：${users.map(r=>r.name).join('、')}</p>${Object.values(e.branches||{}).map(b=>`<p><b>${b.name}</b>：${b.desc}<br>第五級 → ${b.evolved}</p>`).join('')}</article>`}).join('')}</div>`}`;$('codex-panel').querySelectorAll('[data-codex]').forEach(b=>b.onclick=()=>{codexTab=b.dataset.codex;renderCodex()})}
function renderLobby(){$('lobby').dataset.tab=tab;renderRoster();renderRole();renderMaps();renderMapDetail();refreshWallet();for(const name of['journey','workshop','traits','codex'])$(name+'-panel').hidden=name!==tab;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));if(tab==='workshop')renderWorkshop();if(tab==='traits')renderTraits();if(tab==='codex')renderCodex()}
function resetJoy(){battleTouch.reset();aimTouch.reset();joy.x=joy.y=0}
function lock(value){value=value||orientationBlocked;$('lobby').inert=value;$('hud').inert=value;$('touch').inert=value}
function hideModal(){$('modal').hidden=true;lock(false)}
function modal(title,copy,tag='EXPEDITION',kind=''){clearTimeout(toastTimer);$('toast').classList.remove('visible');$('modal-title').textContent=title;$('modal-copy').textContent=copy;$('modal-eyebrow').textContent=tag;$('modal-body').replaceChildren();$('modal-actions').replaceChildren();$('modal').querySelector('.dialog').className='dialog art-frame '+kind;$('modal').hidden=false;keys.clear();resetJoy();lock(true)}
function action(text,fn,primary=false){const b=document.createElement('button');b.textContent=text;if(primary)b.className='primary';b.onclick=fn;$('modal-actions').append(b);return b}
function focusDialog(){requestAnimationFrame(()=>$('modal').querySelector('button:not(:disabled)')?.focus())}
function toast(text){if(!$('modal').hidden||cinema)return;$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400)}
function input(){const touch=game?battleTouch.vector():{x:0,y:0};const aim=mouseDirection()||aimTouch.vector();return{aimX:aim.x,aimY:aim.y,x:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x+touch.x,y:(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.y+touch.y}}
function enqueueCinema(type,title,copy,id='pulse'){cinemaQueue.push({type,title,copy,id,ttl:type==='boss'?1.7:1.1})}
function startCinema(){clearTimeout(toastTimer);$('toast').classList.remove('visible');cinema=cinemaQueue.shift();if(!cinema)return;mode='cinematic';keys.clear();resetJoy();lock(true);$('cinematic').className=cinema.type==='boss'?'boss-cinema':'';$('cinema-tag').textContent=cinema.type==='boss'?'BOSS ENCOUNTER':cinema.type==='evolve'?'WEAPON EVOLUTION':'EXPEDITION TREASURE';$('cinema-title').textContent=cinema.title;$('cinema-copy').textContent=cinema.copy;const iconHolder=document.createElement('span');iconHolder.innerHTML=icon(cinema.id);const cinemaIcon=iconHolder.firstElementChild;cinemaIcon.id='cinema-icon';$('cinema-icon').replaceWith(cinemaIcon);if(cinema.type==='boss'){
  const boss=MONSTERS.find(enemy=>enemy.mapId===game.mapId&&enemy.boss);
  const frame=actorFrame(images,'monsters',boss?.id,'idle');
  if(frame){
    cinemaIcon.style.backgroundImage='url('+frame.src+')';
    cinemaIcon.style.backgroundSize='contain';
    cinemaIcon.style.backgroundPosition='center';
  }
}$('cinematic').hidden=false;renderer.cinematic?.(cinema.type);sound.play(cinema.type==='boss'?'boss':cinema.type==='evolve'?'evolve':'chest')}
function endCinema(){cinema=null;$('cinematic').hidden=true;lock(false);if(mode==='cinematic')mode='playing'}
function attemptPortraitLock(){
  if(matchMedia('(pointer: coarse)').matches) screen.orientation?.lock?.('portrait')?.catch(()=>{});
}
function updateOrientation(){
  orientationBlocked=matchMedia('(pointer: coarse) and (orientation: landscape)').matches;
  $('orientation-overlay').hidden=!orientationBlocked;
  if(orientationBlocked){endSkillPress();if(mode==='playing')pause()}
  lock(!$('modal').hidden);
}
window.addEventListener('resize',updateOrientation);
$('portrait-fullscreen').onclick=async()=>{
  try{await document.documentElement.requestFullscreen?.();attemptPortraitLock()}catch{}
};
async function begin(resume=false){if(!ready||orientationBlocked)return;if(!resume&&!canEnterDifficulty(profile,mapId,difficulty)){toast('請先完成此地圖的前一級難度');return}sound.unlock();attemptPortraitLock();if(begin.loading)return;begin.loading=true;try{await Promise.all([ensureRoleAnimation(images,resume&&saved?saved.roleId:roleId),ensureMapAnimations(images,resume&&saved?saved.mapId:mapId)])}catch(error){toast(error.message);return}finally{begin.loading=false}if(orientationBlocked)return;game=resume&&saved?structuredClone(saved):createExpedition({roleId,mapId,difficulty,profile});ensureChoices(game);roleId=game.roleId;mapId=game.mapId;settled=false;cinemaQueue=[];endCinema();keys.clear();resetJoy();renderer.reset(game.player,game.roleId,game.mapId);$('move-hint').hidden=false;acc=0;autosave=0;last=performance.now();lastLoadout='';$('lobby').hidden=true;$('hud').hidden=false;$('touch').hidden=false;$('skill').querySelector('i').outerHTML=icon(getRole(roleId).main);$('hud-name').textContent=getRole(roleId).name;$('hud-portrait').src=portrait(roleId);$('hud-portrait').alt=getRole(roleId).name;$('hud-map').textContent=getMap(mapId).name;$('wave-track').innerHTML=Array.from({length:Math.ceil(getMap(mapId).duration/60)},()=>'<i></i>').join('');hideModal();mode='playing';persist();if(['won','lost'].includes(game.status))finish();else if(['upgrade','branch'].includes(game.status))upgrade();else toast(resume?'遠征進度已恢復':getRole(roleId).name+' · '+getMap(mapId).name)}
function upgrade(){mode='upgrade';banMode=false;persist();showChoices();sound.play('upgrade')}
function showChoices(){const branching=game.status==='branch';modal(branching?'選擇裝備分支':`星光覺醒 · Lv.${game.player.level}`,branching?'裝備升至第五級時，選擇本局的進化路線。':banMode?'點選一張卡，將其從本局後續選項排除；目前持有的能力會保留。':`攻擊裝備 ${weaponCount(game)} / 3 · 祝福 ${passiveCount(game)} / 4。副裝備最多兩件。`,branching?'CHOOSE YOUR PATH':'BUILD YOUR ADVENTURE','upgrades');game.choices.forEach((c,i)=>{const w=EQUIPMENT[c.id],spec=c.kind==='branch'?w?.branches[c.branch]:c.kind==='weapon'?w:c.kind==='passive'?PASSIVES[c.id]:{name:'暖心回復',desc:'立即恢復生命。'},level=c.kind==='weapon'?game.weapons[c.id]:c.kind==='passive'?game.passives[c.id]:0,evo=c.kind==='weapon'&&level===4,b=document.createElement('button');b.className='choice'+(evo?' evolution':'')+(banMode?' ban-choice':'');b.innerHTML=`<span class="choice-number">${i+1}</span>${icon(c.id)}<span class="choice-type">${branching?'裝備分支':evo?'裝備進化':c.kind==='weapon'?level?'裝備強化':w?.kind==='main'?'專屬主武器':'新副裝備':'星光祝福'}</span><b>${evo?'選擇進化路線':spec?.name||c.id}</b>${w?'<canvas class="weapon-preview" width="280" height="90" aria-label="攻擊方式預覽"></canvas>':''}<p>${spec?.desc||''}</p><span class="next-stats">${branching?'第五級 → '+spec.evolved:c.kind==='weapon'?(level===4?'下一步：選擇第五級進化路線':upgradeInfo(game,c.id)):''}</span><small>${branching?'確定後本局無法改線':c.kind==='weapon'?level?`Lv.${level} → ${evo?'進化路線':level+1}`:'佔用一個副裝備欄':c.kind==='passive'?`${level+1} / ${spec?.max||5}`:'立即生效'}</small>`;const canvas=b.querySelector('canvas');if(canvas){canvas.dataset.weapon=c.id;canvas.dataset.branch=c.branch||game.branches[c.id]||''}b.onclick=()=>{if(banMode){if(ban(game,i)){persist();banMode=false;showChoices()}return}if(!choose(game,i))return;persist();if(game.status==='branch'){showChoices();return}hideModal();mode='playing';sound.play('upgrade');if(evo||branching)enqueueCinema('evolve',weaponName(game,c.id),'分支力量覺醒 · 裝備已進化',c.id);else toast((spec?.name||'能力')+' · 已獲得')};$('modal-body').append(b)});if(!branching){const r=action('重抽 '+game.budget.reroll,()=>{if(reroll(game)){persist();showChoices()}});r.disabled=!game.budget.reroll;const sk=action('略過 '+game.budget.skip,()=>{if(skip(game)){persist();hideModal();mode='playing'}});sk.disabled=!game.budget.skip;const ba=action(banMode?'取消排除':'排除 '+game.budget.ban,()=>{banMode=!banMode;showChoices()});ba.disabled=!game.budget.ban||game.choices.every(c=>c.kind==='heal')}focusDialog()}
function pause(){if(!['playing','cinematic'].includes(mode))return;endCinema();mode='paused';persist();const r=getRole(game.roleId);modal('遠征稍歇',storage?'進度已保存。整理配裝，再繼續前進。':'目前無法儲存，請保持頁面開啟。','PAUSED');const build=document.createElement('div');build.className='pause-build';build.innerHTML=Object.entries(game.weapons).filter(([,n])=>n).map(([id,n])=>`<span>${icon(id)}<b>${weaponName(game,id)} · ${n===5?'★':'Lv.'+n}</b><small>${game.branches[id]?EQUIPMENT[id].branches[game.branches[id]]?.name:'第五級選擇進化路線'}</small></span>`).join('')+Object.entries(game.passives).filter(([,n])=>n).map(([id,n])=>`<span>${icon(id)}<b>${PASSIVES[id].name} · Lv.${n}</b><small>${PASSIVES[id].desc}</small></span>`).join('')+`<span>${icon('star')}<b>${r.active.name}</b><small>${r.active.desc}</small></span>`;$('modal-body').append(build);action('繼續遠征',()=>{hideModal();mode='playing';sound.unlock()},true);action('冒險筆記',()=>guide(true));action('聲音設定',()=>soundSettings(true));action('儲存並回營地',home);action('撤退並結算',()=>{modal('撤退並結算？','本局將結束，並開啟已拾取的寶箱。','EXPEDITION');action('繼續遠征',()=>{hideModal();mode='playing'},true);action('確認撤退',()=>{game.status='lost';finish()});focusDialog()});focusDialog()}
function home(){persist();mode='home';cinemaQueue=[];endCinema();$('lobby').hidden=false;$('hud').hidden=true;$('touch').hidden=true;$('bossbar').hidden=true;hideModal();keys.clear();resetJoy();renderLobby()}
function soundSettings(fromPause=false){
  modal('聲音設定','可分別調整音樂和音效。','AUDIO');
  for(const [bus,label] of [['music','背景音樂'],['sfx','遊戲音效']]){
    const row=document.createElement('label');
    const enabled=document.createElement('input');
    const volume=document.createElement('input');
    enabled.type='checkbox'; enabled.checked=profile.audio[bus+'Enabled'];
    volume.type='range'; volume.min='0'; volume.max='1'; volume.step='.05'; volume.value=profile.audio[bus+'Volume'];
    volume.setAttribute('aria-label',label+'音量');
    row.append(enabled,label,volume);
    const update=()=>{profile.audio[bus+'Enabled']=enabled.checked;profile.audio[bus+'Volume']=Number(volume.value);sound.setPreferences(profile.audio);saveProfile()};
    enabled.onchange=update;volume.oninput=update;
    $('modal-body').append(row);
  }
  action('返回',()=>{hideModal();if(fromPause){mode='playing';pause()}},true);
  focusDialog();
}
function guide(fromPause=false){modal('旅團的冒險筆記','選擇適合自己的角色，再為想培育的裝備前往對應地圖。','FIELD GUIDE');$('modal-body').innerHTML=`<div class="help-grid"><div class="help-block"><b>移動與兩種主動操作</b>WASD／方向鍵移動，空白鍵星閃衝刺，E／Q 使用角色主動技能，Esc 暫停。手機在戰場空白處按下後會出現浮動搖桿；由初次按下的位置拖曳控制方向與速度，放開停止。右下拖曳瞄準。電腦預設朝滑鼠游標攻擊，按右上瞄準模式切換自動索敵。右上短按角色技能施放、長按查看說明，星閃用來閃避。一般攻擊自動施放。</div><div class="help-block"><b>角色與局內裝備</b>每位角色攜帶一把專屬主武器，最多再選兩件適用副裝備與四項祝福。第一至第四級提升基礎能力，第五級才選擇進化路線。每局重抽三次、略過兩次、排除一次。</div><div class="help-block"><b>地圖與遠征目標</b>不同地圖有各自的敵群、環境機制與素材。收集三個地圖信標，並生存到地圖預定時間後，首領現身；擊敗首領才算通關。注意戰場邊緣的信標指引。簡單與普通可直接挑戰；更高難度需在同一地圖依序通關，並提供更高獎勵。</div><div class="help-block"><b>素材與永久培育</b>在遠征中收集素材，結算帶回營地。裝備工坊提升傷害，角色特性培育天賦。查看工坊需求，便能知道下一次要去哪座地圖。</div><div class="help-block"><b>排除與保存</b>排除會讓該能力不再出現在本局後續選項中，已取得的效果保留。進度每五秒、升級與暫停時儲存。舊版進度保留在「繼續舊版冒險」入口。</div><div class="help-block"><b>暫停與聲音</b>切到其他分頁會自動暫停。首次操作後才會播放聲音。存檔只在目前瀏覽器，清除網站資料會移除進度。</div></div>`;action(fromPause?'返回暫停選單':'返回營地',()=>{if(fromPause){mode='playing';pause()}else hideModal()},true);focusDialog()}
function finish(){
  if(settled)return;
  settled=true;
  mode='result';
  cinemaQueue=[];
  endCinema();
  $('touch').hidden=true;
  saved=structuredClone(game);
  store(RUN,serialize(game));
  settle(profile,game);
  const recorded=saveProfile();
  const result=summary(game);
  hideModal();
  setTimeout(()=>showOutcome(result,recorded),900);
}
function showOutcome(result,recorded){
  const role=getRole(game.roleId),map=getMap(game.mapId);
  const won=result.win;
  const label=won?'遠征勝利':'遠征失敗';
  modal(label,won?'首領討伐完成 · '+map.name:'旅途暫時止步 · '+map.name,won?'VICTORY':'DEFEAT','outcome '+(won?'victory':'defeat'));
  const scene=document.createElement('div');
  scene.className='outcome-scene';
  const art=document.createElement('img');
  art.src=portrait(role.id);art.alt=role.name;
  scene.append(art);
  playOutcomeMotion(art,game.roleId,won,images);
  const text=document.createElement('p');
  text.textContent=won?role.name+'完成了這場遠征。':role.name+'在戰鬥中倒下了。';
  const detail=document.createElement('small');
  detail.textContent='存活 '+format(result.seconds)+' · 擊敗 '+result.kills+' · 寶箱 '+result.chests;
  scene.append(text,detail);
  $('modal-body').append(scene);
  action(won?'領取戰利品':'整理戰利品',()=>{
    if(result.chests)revealChests(result,recorded);
    else showResult(result,recorded);
  },true);
  const button=$('modal-actions').lastElementChild;
  button.disabled=true;
  setTimeout(()=>{if(button.isConnected){button.disabled=false;button.focus()}},won?2400:2000);
  sound.play(won?'win':'lose');
  if(won)renderer.cinematic?.('win');
}
function revealChests(result,recorded){
  let index=0,timer;
  const finishReveal=()=>{clearTimeout(timer);showResult(result,recorded)};
  function reveal(){
    index++;
    modal('遠征寶箱 · '+index+' / '+result.chests,'','CHEST REWARDS','chest-reveal');
    const card=document.createElement('div');
    card.className='chest-reveal-card';
    card.innerHTML=icon('chest')+'<p>星光 +4　'+materialName(result.chestMaterial)+' +2</p>';
    $('modal-body').append(card);
    action('略過動畫',finishReveal);
    focusDialog();
    sound.play('chest');
    timer=setTimeout(index<result.chests?reveal:finishReveal,1050);
  }
  reveal();
}
function showResult(r,recorded){
  const role=getRole(game.roleId),map=getMap(game.mapId);modal(r.win?'遠征凱旋':'星光仍會再次出發',r.win?`${role.name}完成了${map.name}的遠征。帶著收集到的素材，準備下一場冒險。`:'遠征結束。下方列出本局的戰利品。',r.win?'EXPEDITION COMPLETE':'EXPEDITION RESULTS','results');const medal=document.createElement('div');medal.className='result-medal';medal.innerHTML=`${icon(r.win?'chest':'gem')}<div><b>${map.name}</b><p>${role.name} · ${r.win?'首領討伐成功':'本次遠征結束'}</p></div>`;$('modal-body').append(medal);for(const[value,label]of[[format(r.seconds),'遠征時間'],[r.kills,'擊敗怪物'],[r.level,'角色等級'],[r.coins,'獲得星光'],[r.damage,'造成傷害'],[r.mastery||0,'角色熟練']]){const d=document.createElement('div');d.className='stat';d.innerHTML=`<b${typeof value==='number'?` data-target="${value}"`:''}>${typeof value==='number'?0:value}</b><span>${label}</span>`;$('modal-body').append(d)}const loot=document.createElement('div');loot.className='result-loot';loot.innerHTML=Object.entries(r.materials||{}).filter(([,n])=>n>0).map(([id,n])=>`<span>${materialIcon(id)}${materialName(id)}<b>+${n}</b></span>`).join('')||'<span>本次未取得素材</span>';$('modal-body').append(loot);const breakdown=document.createElement('p');breakdown.className='result-breakdown';const list=items=>Object.entries(items).filter(([,n])=>n>0).map(([id,n])=>materialName(id)+' +'+n).join('、')||'無';breakdown.innerText=['戰場拾取 · 星光 +'+(r.coins-r.chestCoins-(r.win?65:0))+' · '+list(r.fieldMaterials)+'（難度素材倍率 ×'+r.rewardMultiplier+'）','寶箱 ×'+r.chests+' · 星光 +'+r.chestCoins+' · '+list({[r.chestMaterial]:r.chestMaterials}),...(r.win?['通關獎勵 · 星光 +65 · '+list(r.clearMaterials)]:[]),...(recorded?[]:['目前無法寫入存檔，獎勵仍保留在本頁。'])].join('\n');$('modal-body').append(breakdown);const trait=document.createElement('p');trait.className='result-breakdown';trait.textContent='本局特性 Lv.'+game.traitLevel+' · '+traitEffect(game.roleId,game.traitLevel)+(Number.isFinite(game.roleState.mainDamage)?'\n專屬武器與主動技能有效傷害 '+Math.round(game.roleState.mainDamage).toLocaleString():'');$('modal-body').append(trait);
const performancePanel=document.createElement('section');
performancePanel.className='performance-panel';
const performanceStats=rolePerformance(game);
const heading=document.createElement('h3');heading.textContent=getRole(game.roleId).innate.name+' · 本局表現';
performancePanel.append(heading);
if(performanceStats.partial){const note=document.createElement('p');note.textContent='此舊進度僅包含更新後記錄的表現。';performancePanel.append(note)}
for(const entry of performanceStats.rows){
 const row=document.createElement('div');row.className='performance-row';
 const label=document.createElement('span');label.textContent=entry.label;
 const amount=document.createElement('b');amount.textContent=entry.value.toLocaleString('zh-TW',{maximumFractionDigits:1})+entry.unit;
 row.append(label,amount);performancePanel.append(row);
}
$('modal-body').append(performancePanel);
const build=document.createElement('div');build.className='result-build';build.innerHTML=Object.entries(game.weapons).filter(([,n])=>n).map(([id,n])=>`<span title="${weaponName(game,id)}">${icon(id)}<small>${n===5?'★':n}</small></span>`).join('');$('modal-body').append(build);resultAt=performance.now();action('再次遠征',()=>begin(),true);action('回營地強化',()=>{if(recorded){try{localStorage.removeItem(RUN)}catch{}saved=null}tab='workshop';home()});focusDialog()}
function doDash(){if(mode!=='playing'||!game)return;const v=input(),p=game.player;dash(game,Math.hypot(v.x,v.y)>.1?v.x:p.dirX,Math.hypot(v.x,v.y)>.1?v.y:p.dirY)}
function doActive(){if(mode!=='playing'||!game)return;if(active(game)){toast(getRole(game.roleId).active.name)}}
function processEvents(){for(const e of game.events.splice(0)){renderer.event(e,game);if(e.type==='magnet'){sound.play('material');toast('全場掉落已收取')}if(e.type==='hit')sound.play('hit');if(e.type==='shoot')sound.play('shoot');if(e.type==='dash')sound.play('dash');if(e.type==='hurt'){sound.play('hurt');hitStop=.025}if(['pulse','meteor','chain','beam','shatter','summon'].includes(e.type))sound.play(e.type);if(e.type==='pickup'&&Math.random()<.25)sound.play('pickup');if(e.type==='objective'){sound.play('upgrade');toast('地圖信標 · '+game.objective.completed+' / '+game.objective.target)}if(e.type==='material')toast('取得素材 · '+materialName(e.materialId||e.id));if(e.type==='heal')sound.play('pickup');if(e.type==='chest'){sound.play('chest');toast('寶箱已收好 · 遠征結束後開啟')}if(e.type==='boss'){const boss=game.enemies.find(n=>MONSTERS[n.species]?.boss);enqueueCinema('boss',boss?MONSTERS[boss.species].name:'地圖首領',getMap(game.mapId).objective,'pulse')}}}
function hud(){const p=game.player,r=getRole(game.roleId),m=getMap(game.mapId);$('timer').textContent=format(game.time);$('level').textContent='Lv.'+p.level;$('hpbar').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';$('hptext').textContent=Math.ceil(p.hp)+' / '+p.maxHp;$('xpbar').style.width=Math.min(100,p.xp/p.next*100)+'%';$('kills').textContent='擊敗 '+game.kills;$('objective').textContent=game.bossSpawned?'擊敗首領，完成遠征':`${m.objective} · ${game.objective?.completed||0} / ${game.objective?.target||3}${game.time>=m.duration?' · 尋找地圖信標':''}`;document.querySelectorAll('.wave-track i').forEach((n,i)=>n.classList.toggle('active',game.time>=i*60));const load=Object.entries(game.weapons).filter(([,n])=>n).concat(Array.from({length:Math.max(0,3-weaponCount(game))},()=>['empty',0])).map(([id,n])=>`<div class="weapon-slot ${n?'':'empty'} ${n===5?'evolved':''}" ${n?`title="${weaponName(game,id)} Lv.${n}"`:''}>${n?icon(id)+`<small>${n===5?'★':Array.from({length:n},()=> '·').join(' ')}</small>`:''}</div>`).join('')+`<div class="blessing-count"><span>祝福</span><small>${passiveCount(game)} / 4</small></div>`;if(load!==lastLoadout){$('loadout').innerHTML=load;lastLoadout=load}for(const[id,cd,max]of[['dash',p.dashCd,4],['skill',game.activeCd||0,r.active.cooldown]]){$(id).style.setProperty('--cooldown',Math.max(0,Math.min(1,cd/max)));$(id).classList.toggle('cooling',cd>0);$(id).classList.toggle('ready-pulse',cd<=0);$(id).querySelector('.key-shade').style.transform=`scaleY(${Math.max(0,Math.min(1,cd/max))})`;$(id+'-label').textContent=cd>0?cd.toFixed(1):id==='dash'?'星閃':r.active.name;$(id+'-note').textContent=cd>0?'冷卻中':id==='dash'?'閃避':desktopPointer.matches?'E':'長按查看'}const boss=game.enemies.find(e=>MONSTERS[e.species]?.boss||e.type===3);$('bossbar').hidden=!boss;if(boss){$('boss-name').textContent=MONSTERS[boss.species]?.name||'地圖首領';$('bossbar').querySelector('i').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%'}const held=game.materials||game.loot||{};$('material-counter').textContent=Object.entries(held).filter(([,n])=>n>0).map(([id,n])=>materialName(id)+' '+Math.floor(n)).join(' · ');const c=$('game');c.dataset.state=mode;c.dataset.role=game.roleId;c.dataset.map=game.mapId;c.dataset.x=p.x.toFixed(2);c.dataset.y=p.y.toFixed(2);c.dataset.enemies=String(game.enemies.length)}
function renderCodexAnimations(now){
  for(const canvas of document.querySelectorAll('[data-species]')){
    const frame=actorFrame(images,'monsters',canvas.dataset.species,'run',now*1.5,true);
    if(!frame){
      if(!canvas.dataset.loading){
        canvas.dataset.loading='true';
        ensureMonsterAnimation(images,canvas.dataset.species).catch(error=>console.warn(error));
      }
      continue;
    }
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const size=Math.min(canvas.width,canvas.height);
    ctx.drawImage(frame,(canvas.width-size)/2,0,size,size);
  }
}
$('start').onclick=()=>{if(loadFailed){location.reload();return}if(!ready)return;if(saved){modal('開始新的遠征？','目前仍有未完成的遠征。開始新局會取代這份中途進度，永久成長與素材會保留。','NEW EXPEDITION');action('返回',hideModal);action('開始遠征',()=>begin(),true);focusDialog()}else begin()};$('resume').onclick=()=>begin(true);$('pause').onclick=pause;$('help').onclick=()=>guide();$('sound').onclick=()=>soundSettings();
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderLobby()});$('difficulty-options').onclick=e=>{const b=e.target.closest('[data-difficulty]');if(!b||b.disabled)return;difficulty=b.dataset.difficulty;renderMapDetail();refreshWallet()};
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;sound.unlock();sound.play('click');const r=b.getBoundingClientRect();renderer.uiBurst?.(e.clientX||r.x+r.width/2,e.clientY||r.y+r.height/2)},true);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&mode==='playing')e.preventDefault();if(k==='escape'){if(['playing','cinematic'].includes(mode))pause();else if(mode==='paused'){hideModal();mode='playing'}else if(mode==='home')hideModal()}if(k==='tab'&&!$('modal').hidden){const buttons=[...$('modal').querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}if(mode==='playing'){keys.add(k);if(k===' '&&!e.repeat)doDash();if(['e','q'].includes(k)&&!e.repeat)doActive()}if(mode==='upgrade'&&!orientationBlocked&&!e.repeat&&['1','2','3'].includes(k))$('modal-body').children[Number(k)-1]?.click()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const battlefield=$('game');
const desktopPointer=matchMedia('(hover:hover) and (pointer:fine)');
const autoAimButton=$('auto-aim');
let mouseAim=null,autoAim=false;
try{autoAim=localStorage.getItem(KEY+'-auto-aim')==='true'}catch{}
function syncAutoAim(){
  autoAimButton.setAttribute('aria-pressed',String(autoAim));
  autoAimButton.textContent=autoAim?'自動索敵':'滑鼠瞄準';
}
autoAimButton.onclick=()=>{
  autoAim=!autoAim;
  syncAutoAim();
  try{localStorage.setItem(KEY+'-auto-aim',String(autoAim))}catch{}
};
syncAutoAim();
function mouseDirection(){
  if(!desktopPointer.matches||autoAim||!game||mode!=='playing'||orientationBlocked)return null;
  const fallback={x:game.player.dirX,y:game.player.dirY};
  if(!mouseAim)return fallback;
  const bounds=battlefield.getBoundingClientRect();
  const x=mouseAim.x-bounds.left-renderer.w/2-(game.player.x-renderer.camera.x)*renderer.scale;
  const y=mouseAim.y-bounds.top-renderer.h*.52-(game.player.y-24-renderer.camera.y)*renderer.scale;
  const distance=Math.hypot(x,y);
  return distance>5?{x:x/distance,y:y/distance}:fallback;
}
battlefield.addEventListener('pointermove',event=>{
  if(event.pointerType==='mouse')mouseAim={x:event.clientX,y:event.clientY};
});
const battleTouch=bindBattleTouch(battlefield,{isPlaying:()=>mode==='playing'&&!!game&&!orientationBlocked,base:$('stick'),radius:40,deadzone:5,onFirstMove:()=>$('move-hint').hidden=true});
$('dash').onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();doDash()};
$('dash').onclick=e=>{if(e.detail===0)doDash()};
const aimTouch=bindBattleTouch($('aim-zone'),{isPlaying:()=>mode==='playing'&&!!game&&!orientationBlocked,base:$('aim-stick'),fixedOrigin:true,radius:36,deadzone:5});
let skillPress=null;
const skillButton=$('skill'),skillInspect=$('skill-inspect');
skillButton.addEventListener('pointerenter',event=>{
  if(event.pointerType!=='mouse'||!game)return;
  const skill=getRole(game.roleId).active;
  skillButton.title=skill.name+'｜'+skill.desc+'｜冷卻 '+skill.cooldown+' 秒';
});
function endSkillPress(event,cast=false){
  if(!skillPress||(event&&event.pointerId!==skillPress.id))return;
  clearTimeout(skillPress.timer);
  const inspecting=skillPress.inspecting;
  skillPress=null;
  skillInspect.hidden=true;
  if(inspecting&&mode==='skill-inspect')mode='playing';
  if(cast&&!inspecting&&!orientationBlocked)doActive();
}
skillButton.onpointerdown=event=>{
  if(mode!=='playing'||orientationBlocked||skillPress||event.button!==0)return;
  event.preventDefault();
  skillButton.setPointerCapture(event.pointerId);
  skillPress={id:event.pointerId,inspecting:false,timer:setTimeout(()=>{
    if(!skillPress||mode!=='playing')return;
    const skill=getRole(game.roleId).active;
    skillPress.inspecting=true;
    mode='skill-inspect';
    keys.clear();resetJoy();
    skillInspect.replaceChildren();
    const name=document.createElement('strong');
    name.textContent=skill.name;
    const desc=document.createElement('p');
    desc.textContent=skill.desc;
    const cooldown=document.createElement('small');
    cooldown.textContent=game.activeCd>0?'剩餘冷卻 '+game.activeCd.toFixed(1)+' 秒':'冷卻 '+skill.cooldown+' 秒 · 可使用';
    skillInspect.append(name,desc,cooldown);
    skillInspect.hidden=false;
  },420)};
};
skillButton.onpointerup=event=>endSkillPress(event,true);
skillButton.onpointercancel=skillButton.onlostpointercapture=event=>endSkillPress(event);
skillButton.onclick=event=>{if(event.detail===0)doActive()};
addEventListener('blur',()=>endSkillPress());
document.addEventListener('visibilitychange',()=>{if(document.hidden)endSkillPress()});
addEventListener('blur',()=>{keys.clear();resetJoy();pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();resetJoy();pause()}});addEventListener('pagehide',persist);
let previewAt=0;
function frame(now){requestAnimationFrame(frame);const startCPU=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;if(mode==='playing'&&game){if(hitStop>0)hitStop-=dt;else{acc+=dt;let loops=0;while(acc>=1/60&&loops++<4){step(game,1/60,input());acc-=1/60;if(game.status!=='playing')break}}processEvents();if(['upgrade','branch'].includes(game.status))upgrade();else if(['won','lost'].includes(game.status))finish();else if(cinemaQueue.length)startCinema();autosave+=dt;if(autosave>5){autosave=0;persist()}}else if(mode==='cinematic'&&cinema){cinema.ttl-=dt;if(cinema.ttl<=0)endCinema()}if(game&&now-hudAt>100){hud();hudAt=now}if(mode==='result'){const t=Math.min(1,(now-resultAt)/900),f=1-(1-t)**3;$('modal-body').querySelectorAll('[data-target]').forEach(n=>n.textContent=Math.round(Number(n.dataset.target)*f).toLocaleString())}sound.music(mode,game?.bossSpawned,game?.mapId||mapId);renderer.render(game,mode,input(),dt,now/1000);if(mode==='home'){if(tab==='codex'&&codexTab==='monsters')renderCodexAnimations(now/1000)}if(!$('modal').hidden&&now-previewAt>=80){
  previewAt=now;
  for(const canvas of document.querySelectorAll('.weapon-preview:not([hidden])')){
    try{preview(canvas,canvas.dataset.weapon,canvas.dataset.branch,now/1000,images,game?.roleId||roleId)}
    catch(error){canvas.hidden=true;console.warn('Weapon preview unavailable',error)}
  }
}
renderCost+=performance.now()-startCPU;renderFrames++;if(now-renderMark>1000){$('game').dataset.renderMs=(renderCost/renderFrames).toFixed(2);renderCost=0;renderFrames=0;renderMark=now}}
for(const type of['gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>e.preventDefault(),{passive:false});document.addEventListener('dblclick',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());document.addEventListener('contextmenu',e=>{if(e.target.closest('#game,#touch,button'))e.preventDefault()});
renderLobby();requestAnimationFrame(frame);
async function load(){try{await loadAnimationManifest(images);await Promise.all([...ROLES.map(role=>ensureRoleAnimation(images,role.id)),ensureMonsterAnimation(images,0)])}catch(error){loadFailed=true;$('start').disabled=false;$('start').textContent='重新載入冒險素材';return}const files={vfx:'art/v2/fx.png',icons:'art/v2/icons.png',icons3:'art/v3/icons.png',allies:'art/v3/allies.png',props:'art/v2/props.png',equipment:'art/v4/equipment.webp',mainWeapons:'art/v4/main-weapons.webp',materials:'art/v4/materials.webp',companions:'art/v4/companions.webp',ground:'art/ground.jpg',run:'art/luti-run.png',cast:'art/luti-cast.png',boss:'art/v2/boss.png',walk:'art/v2/walk.png'};for(const r of ROLES)files['role-'+r.id]='art/v4/role-'+r.id+'.webp';for(const m of MAPS){files['map-'+m.id]='art/v4/map-'+m.id+'.jpg';for(let i=0;i<5;i++)files['scenery-'+m.id+'-'+i]='art/v7/'+m.id+'/'+i+'.webp'}let count=0;const failures=[];await Promise.all(Object.entries(files).map(([key,file])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[key]=im;$('start').textContent=`準備冒險 ${Math.round(++count/Object.keys(files).length*100)}%`;resolve()};im.onerror=()=>{failures.push(file);resolve()};im.src=file})));if(failures.length){loadFailed=true;$('start').disabled=false;$('start').textContent='重新載入冒險素材';storageMessage='部分素材尚未載入，請確認連線並重新載入。';refreshWallet();console.error('Adventure assets failed:',failures.join(', '));return}ready=true;$('start').disabled=false;$('start').textContent='啟程遠征';refreshWallet()}
load();

updateOrientation();
