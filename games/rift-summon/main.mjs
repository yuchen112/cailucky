import {vaults,validDaily,emptyDaily,dailyStatus,dailyStage,dailyPay,claimDaily} from './daily.mjs';
import {applyAction, cards, createBattle, stages, starter} from './battle.mjs?v=daily-reveal-1';
import {heroes} from './heroes.mjs';
import {unlock, prepare, play, setMusic, toggleMute, updateVolume} from './audio.mjs?v=daily-reveal-1';
import {makeBackup, readBackup} from './backup.mjs?v=daily-reveal-1';
import {startingWallet,validWallet,maxLevel,levelCost,victoryPay,unlockedRunes} from './economy.mjs?v=daily-reveal-1';
import {starterHeroes,rarity,rarityNames,poolFor,pullPrice,openBatch} from './economy.mjs?v=daily-reveal-1';
import {migrateInventory,addInstance,xpNeeded,grantExperience,checkLineup,assignLineupCard} from './inventory.mjs?v=arena-polish-1';

const get = id => document.getElementById(id);
const asset = name => globalThis.riftArtwork?.[name] ?? `art/${name}.webp`;
const key = 'cxq-rift-summon-visual-slice';
const recoveryKey = key + '-recovery';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
let state = saved?.state?.version === 3 && saved.state.phase==='deploy' ? saved.state : null;
let daily=validDaily(saved?.daily)?saved.daily:emptyDaily();
let lastBatch=saved?.lastBatch??null;
const bagSort=saved?.bagSort??{};
const missionFor=battle=>battle.daily?dailyStage(battle.daily):stages[battle.stage];
let log = state ? saved?.log ?? [] : [];
const cleared = new Set(Array.isArray(saved?.cleared) ? saved.cleared.filter(index => stages[index]) : []);
let wallet=validWallet(saved?.wallet)?saved.wallet:startingWallet();
const owned = () => [...new Set([...starter,...stages.filter((_,index)=>cleared.has(index)).map(stage=>stage.reward),...wallet.unlocked])];
let deck = Array.isArray(saved?.deck) && saved.deck.length === 8 && new Set(saved.deck).size === 8 && saved.deck.every(id=>owned().includes(id)) ? saved.deck : [...starter];
let stageIndex = state?.phase==='deploy' ? state.stage : Math.min(cleared.size, stages.length-1);
const chapterNames=['第一章・斷橋哨站','第二章・沉鐘墓園'];
const chapterFor=index=>Math.floor(index/4);
let chosen = state?.hero || 'trust';
let starterHero=starterHeroes.includes(saved?.starterHero)?saved.starterHero:saved?'trust':null;
const heroMilestones=['growth','memory','night','hope'];
if(state&&state.hero!==starterHero&&!wallet.heroCopies?.[state.hero]&&heroes.some(hero=>hero.id===state.hero)) {
  wallet={...wallet,heroCopies:{...wallet.heroCopies,[state.hero]:1}};
}
const ownedHeroes=()=>[...new Set([
  starterHero,...heroMilestones.filter((_,index)=>cleared.has(index)),...(state?[state.hero]:[]),
  ...heroes.filter(hero=>wallet.heroCopies?.[hero.id]>0).map(hero=>hero.id),
].filter(Boolean))];
let selected = null;
let playing = false;
let playback = 0;
let audioScene = null;
let volumes = saved?.volumes ?? {sfx:.65,bgm:.17};
const runes={
  wall:{name:'鐵壁',effect:'開始攻擊時，為正面有敵軍、生命剩一半以下且無盾的友軍加 2 點護盾。'},
  heal:{name:'回春',effect:'開始攻擊時，為生命剩一半以下且至少缺 3 點生命的友軍回復 3 點生命。'},
  frost:{name:'霜縛',effect:'開始攻擊時，使攻擊至少 4 點的最強敵軍攻擊降低 2 點，維持至本場結束。',source:'首通雙塔迴廊'},
  spark:{name:'雷印',effect:'開始攻擊時，對生命與護盾合計不超過 2 點的敵軍造成 2 點傷害。',source:'首通斷橋守將'},
  ward:{name:'共盾',effect:'開始攻擊時，若至少兩張友軍在場，給最前方無盾友軍 1 點護盾。',source:'首通哨站前沿'},
  flame:{name:'熾志',effect:'開始攻擊時，若至少兩張友軍在場，讓最前方半血以下友軍攻擊增加 1，維持到戰鬥結束。',source:'首通斷橋缺口'},
  tide:{name:'潮解',effect:'開始攻擊時，移除護盾最多的敵軍最多 3 點護盾。',source:'收錄 3 張扭蛋卡'},
  root:{name:'生根',effect:'開始攻擊時，若有至少兩張受傷友軍，讓所有受傷友軍各回復 1 點生命。',source:'任一卡牌強化至 Lv.3'},
  mirror:{name:'晶鏡',effect:'開始攻擊時，若我方英雄半血以下且沒有護盾，獲得 1 點護盾。',source:'金幣或鑽石符文池'},
  dawn:{name:'曉光',effect:'開始攻擊時，若我方英雄半血以下，回復 2 點生命。',source:'鑽石符文池'},
  anchor:{name:'沉錨',effect:'開始攻擊時，讓敵方手牌中倒數最短且不高於 2 的卡增加 2 倒數，上限為 4。',source:'鑽石符文池'},
  shelter:{name:'堡壘',effect:'開始攻擊時，若敵方場上至少有三張牌，為我方最前方無盾卡牌加 1 點護盾。',source:'金幣或鑽石符文池'},
  surge:{name:'逆雷',effect:'開始攻擊時，若我方英雄半血以下且敵方至少兩張牌在場，對敵方英雄造成 1 點傷害。',source:'鑽石符文池'},
  echo:{name:'回響',effect:'開始攻擊時，讓我方最左側尚未就緒的手牌倒數減少 1，最低為 0。可在下一次部署時使用。',source:'鑽石符文池'},
  none:{name:'未裝備',effect:'這場戰鬥不會觸發符文。'},
};
const savedRune=saved?.loadout??state?.rune;
let loadout=savedRune==='none'||unlockedRunes(cleared,wallet).includes(savedRune)?savedRune:'wall';
let activeTeam=Number.isInteger(saved?.activeTeam)&&saved.activeTeam>=0&&saved.activeTeam<3?saved.activeTeam:0;
const inventory=migrateInventory(saved,wallet,owned(),ownedHeroes(),unlockedRunes(cleared,wallet));
const instance=uid=>inventory.items.find(item=>item.uid===uid);
const firstInstance=(kind,id)=>inventory.items.find(item=>item.kind===kind&&item.id===id);
function syncFixedInventory() {
  for(const [kind,ids] of [['card',owned()],['hero',ownedHeroes()],['rune',unlockedRunes(cleared,wallet)]]) {
    for(const id of ids) if(!firstInstance(kind,id)) addInstance(inventory,kind,id);
  }
}
function bindInstance(uid,kind,id) {
  const found=instance(uid);
  return (found?.kind===kind&&found.id===id?found:firstInstance(kind,id))?.uid??null;
}
let teamItems;
const teams=Array.from({length:3},(_,i)=>{
  const item=saved?.teams?.[i];
  return {
    deck:Array.isArray(item?.deck)&&item.deck.length===8&&new Set(item.deck).size===8&&item.deck.every(id=>owned().includes(id))?[...item.deck]:[...deck],
    hero:ownedHeroes().includes(item?.hero)?item.hero:(ownedHeroes().includes(chosen)?chosen:starterHero),
    rune:item?.rune==='none'||unlockedRunes(cleared,wallet).includes(item?.rune)?item.rune:loadout,
    items:item?.items,
  };
});
function mapTeamItems(team) {
  return {
    cards:team.deck.map((id,i)=>bindInstance(team.items?.cards?.[i],'card',id)),
    hero:bindInstance(team.items?.hero,'hero',team.hero),
    rune:bindInstance(team.items?.rune,'rune',team.rune),
  };
}
for(const team of teams)team.items=mapTeamItems(team);
function flushTeam() {
  const team={deck:[...deck],hero:chosen,rune:loadout,items:teamItems};
  teamItems=team.items=mapTeamItems(team);
  teams[activeTeam]=team;
}
function selectTeam(index) {
  activeTeam=index;
  const team=teams[index];
  deck=[...team.deck];chosen=team.hero??starterHero??'trust';loadout=team.rune;
  teamItems=structuredClone(team.items);
}
selectTeam(activeTeam);
let runeReturn='camp';
let settingsReturn='camp';
let dailySelection={vault:'gold',floor:undefined};
let albumReturn='camp';
let lowMotion=saved?.lowMotion===true;
updateVolume(volumes);
get('speed').value = saved?.speed ?? '1';

function currentSave() {
  const levels={...wallet.levels};
  for(const item of inventory.items) if(item.kind==='card'&&item.level>1) levels[item.id]=Math.max(levels[item.id]??1,item.level);
  wallet={...wallet,levels};
  syncFixedInventory();
  const ongoing=state?.phase==='deploy';
  flushTeam();
  return {daily,lastBatch,bagSort,state:ongoing?state:null, log:ongoing?log:[], deck, cleared:[...cleared], volumes, loadout, lowMotion, wallet, teams, inventory, activeTeam, starterHero, speed:get('speed').value};
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(currentSave())); return true; }
  catch { get('message').textContent = '此瀏覽器目前無法儲存戰況。'; }
}
function element(tag, value, className) {
  const item = document.createElement(tag);
  if (value) item.textContent = value;
  if (className) item.className = className;
  return item;
}
function artwork(id, type = 'card', className = '') {
  const img = element('img', '', className);
  const prefix = type === 'card' ? 'illustration' : type === 'hero' ? 'hero-portrait' : type;
  img.src = asset(`${prefix}-${id}`);
  img.alt = '';
  img.draggable = false;
  img.decoding = 'async';
  return img;
}
function modal(...children) {
  get('detail-content').replaceChildren(...children);
  const dialog=get('detail');
  if (!dialog.open) {
    dialog.showModal();
    dialog.scrollTop=0;
  }
}
function view(id) {
  for(const page of ['title-screen','starter-select','camp','rune-book','hero-book','inventory-page','team-editor','summon-hall','capsule','campaign','daily','settings-page','collection','lobby','battle','results']) get(page).hidden=page!==id;
}
function teamSelect(id,refresh) {
  const select=id?get(id):element('select');
  select.setAttribute('aria-label','出戰編隊');
  select.replaceChildren(...teams.map((team,index)=>{
    const hero=heroes.find(h=>h.id===team.hero);
    const option=element('option',`編隊 ${index+1}${hero?'・'+hero.name:''}`);
    option.value=String(index);
    return option;
  }));
  select.value=String(activeTeam);
  select.onchange=()=>{flushTeam();selectTeam(Number(select.value));save();refresh();};
  return select;
}
function showStarter() {
  view('starter-select');
  get('starter-options').replaceChildren(...starterHeroes.map(id=>{
    const hero=heroes.find(h=>h.id===id);
    const button=element('button');
    button.append(artwork(id,'hero'),element('strong',hero.name),element('p',hero.skill),element('p',hero.detail));
    button.onclick=()=>{
      modal(artwork(id,'hero'),element('h2',`選擇 ${hero.name}`),element('p',hero.detail),confirmButton('確定出戰',()=>{
        starterHero=id;
        for(const team of teams)team.hero=id;
        selectTeam(activeTeam);
        save();get('detail').close();showCamp();
      }));
    };
    return button;
  }));
}
function confirmButton(label,action) {const button=element('button',label);button.onclick=action;return button;}
function heroDetails(hero) {
  const available=ownedHeroes().includes(hero.id);
  const ownedItems=inventory.items.filter(item=>item.kind==='hero'&&item.id===hero.id);
  const nodes=[artwork(hero.id,'hero'),element('h2',`${hero.name}・${rarity(hero.id)}`),element('strong',hero.skill),element('p',hero.detail),
    element('p',`起始生命 24 → 28（Lv.1–5）・持有 ${ownedItems.length} 份`)];
  if(!available) {
    const stage=stages[heroMilestones.indexOf(hero.id)];
    nodes.push(element('p',stage?`英雄扭蛋或首通「${stage.name}」解鎖。`:'從英雄扭蛋取得。'));
  }
  modal(...nodes);
}
function showHeroes() {
  view('hero-book');
  codexTabs('hero-book','hero');
  const tier=get('hero-rarity').value, status=get('hero-owned').value;
  get('hero-book-grid').replaceChildren(...heroes.filter(hero=>(tier==='all'||rarity(hero.id)===tier)&&
    (status==='all'||ownedHeroes().includes(hero.id)===(status==='owned'))).map(hero=>{
    const button=confirmButton('',()=>heroDetails(hero));
    button.append(artwork(hero.id,'hero'),element('strong',`${hero.name}・${rarity(hero.id)}`),
      element('span',ownedHeroes().includes(hero.id)?'已收錄':'未收錄'));
    return button;
  }));
}
function runeImage(id) {
  return artwork(id==='none'?'empty':id,'rune','rune-image');
}
function runeBadge(id, status, icon=id) {
  const badge=element('span','','rune-badge');
  badge.append(runeImage(icon),element('span',status));
  return badge;
}
function runeDetails(id) {
  const rune=runes[id];
  const inBattle=!get('battle').hidden;
  const count=inventory.items.filter(item=>item.kind==='rune'&&item.id===id).length;
  const panel=element('div','','rune-detail');
  panel.append(runeImage(id),element('h2',rune.name),element('p',rune.effect),
    element('p',id==='none'?'可從符文冊裝備。':`每場 2 次・${rune.source??'初始符文'}`));
  if(id!=='none') panel.append(element('p',`${rarity(id)}・持有 ${count} 份・Lv.1–5 效果增益 +0 → +4`));
  if(inBattle && id!=='none' && state) panel.append(element('p',`Lv.${state.runeLevel??1}・本場剩 ${state.charges} 次`));
  modal(panel);
}
function showRunes(from) {
  runeReturn=from;
  view('rune-book');
  codexTabs('rune-book','rune');
  renderRuneBook();
}
function renderRuneBook() {
  const available=unlockedRunes(cleared,wallet);
  const groups={wall:'guard',ward:'guard',mirror:'guard',shelter:'guard',heal:'heal',root:'heal',dawn:'heal',frost:'control',tide:'control',anchor:'control',echo:'control',spark:'attack',flame:'attack',surge:'attack'};
  const filter=get('rune-filter').value;
  const tier=get('rune-rarity').value;
  const query=get('rune-search').value.trim();
  const status=get('rune-owned').value;
  const ids=Object.keys(groups).filter(id=>(status==='all'||available.includes(id)===(status==='owned'))&&(filter==='all'||groups[id]===filter)&&(tier==='all'||rarity(id)===tier)&&`${runes[id].name} ${runes[id].effect}`.includes(query));
  get('rune-count').textContent=`已收錄 ${available.length} / ${Object.keys(groups).length} 枚・目前顯示 ${ids.length} 枚`;
  const entries=ids.map(id=>{
    const button=element('button','','rune-entry');
    const ownedRune=available.includes(id);
    button.append(runeImage(id),element('strong',`${runes[id].name}・${rarity(id)}`),element('span',ownedRune?'已收錄':runes[id].source));
    button.onclick=()=>runeDetails(id);
    return button;
  });
  get('rune-book-grid').replaceChildren(...(entries.length?entries:[element('p','沒有符合篩選條件的符文。')]));
}
function renderRuneSlots() {
  const active=element('button');
  active.append(runeBadge(loadout,loadout==='none'?runes.none.name:`${runes[loadout].name}・Lv.${instance(teamItems.rune)?.level??1}`));
  active.onclick=()=>openTeamEditor('lobby',instance(teamItems.rune),'rune');
  const locked=element('span');
  locked.append(runeBadge('locked','後續章節'));
  get('rune-slots').replaceChildren(active,locked);
}
function cardFace(card, {lazy=false}={}) {
  const face=element('span','','card-face');
  const art=artwork(card.id,'card','face-art');
  if(lazy) art.loading='lazy';
  const frame=element('img','','face-frame');
  frame.src=asset(`rank-${rarity(card.id)}`);
  frame.alt='';
  const stats=element('span','','face-stats');
  stats.append(element('span',`攻 ${card.attack}`),element('span',`血 ${card.hp}`));
  face.append(art,frame,element('strong',card.name,'face-name'),
    element('span',card.count?`倒數 ${card.count}`:'就緒','face-count'),stats);
  face.append(element('span',`Lv.${card.level??1}`,'face-level'));
  face.append(element('span',rarity(card.id),'face-rarity'));
  if(card.shield) face.append(element('span',`盾 ${card.shield}`,'face-shield'));
  return face;
}
function catalogCard(id,level=firstInstance('card',id)?.level??1) {
  const [name,count,attack,max,skill]=cards[id];
  const bonus=level-1;
  return {id,name,count,attack:attack+bonus,max:max+bonus*2,hp:max+bonus*2,level,skill,shield:skill==='護盾'?2:0};
}
function money(kind,amount) {
  const item=element('span','','money');
  item.append(artwork(kind,'money'),element('span',`${kind==='gold'?'金幣':'鑽石'} ${amount}`));
  return item;
}
function renderWallet(node) {
  if(node.id==='camp-wallet'){
    const parts=['gold','gems'].map(kind=>money(kind,new Intl.NumberFormat('zh-TW',{notation:'compact',maximumFractionDigits:1}).format(wallet[kind])));
    const button=confirmButton('',()=>modal(element('h2','資源餘額'),money('gold',wallet.gold.toLocaleString('zh-TW')),money('gems',wallet.gems.toLocaleString('zh-TW'))));
    button.className='wallet wallet-button';button.append(...parts);node.replaceChildren(button);return;
  }
  node.replaceChildren(money('gold',wallet.gold),money('gems',wallet.gems));
}
function cardDetail(card) {
  const layout=element('div','','card-inspector');
  const info=element('div','','inspector-copy');
  info.append(element('h2',card.name),element('strong',card.skill||'普攻'),
    element('p', descriptions[card.skill] ?? '普攻正對欄位，空位直擊敵方英雄。'),
    element('p',`生命 ${card.hp}/${card.max}・護盾 ${card.shield}・倒數 ${card.count}`,'inspector-stats'));
  layout.append(cardFace(card),info);
  modal(layout);
}
function encyclopediaCard(id) {
  const base=catalogCard(id,1);
  const bonus=base.level-1;
  const slider=element('select');
  slider.setAttribute('aria-label','預覽等級');
  for(let level=1;level<=maxLevel;level++) {
    const option=element('option',`Lv.${level}`);option.value=String(level);slider.append(option);
  }
  slider.value=String(base.level);
  const art=element('div','','encyclopedia-preview');
  const info=element('div');
  const layout=element('div','','card-inspector');
  function preview() {
    const level=Number(slider.value);
    const card={...base,level,attack:base.attack-bonus+level-1,max:base.max-bonus*2+(level-1)*2};
    card.hp=card.max;
    art.replaceChildren(cardFace(card));
  }
  slider.onchange=preview;
  const stage=stages.find(x=>x.reward===id);
  info.append(element('h2',`${base.name}・${rarity(id)}`),element('p',base.skill||'普攻'),
    element('p',descriptions[base.skill]??'普攻正對欄位，空位直擊敵方英雄。'),
    element('p',starter.includes(id)?'初始卡牌':stage?`首通「${stage.name}」取得`:'扭蛋取得'),element('p','預覽等級'),slider);
  layout.append(art,info);
  preview();
  modal(layout);
}
function showCamp() {
  playback++;
  playing=false;
  get('hero-cut-in').hidden=true;
  view('camp');
  requestAnimationFrame(()=>{if(!get('camp').hidden)window.scrollTo(0,0);});
  get('camp-resume').hidden=state?.phase!=='deploy';
  const ongoing=state?.phase==='deploy';
  const mission=ongoing?state.stage:Math.min(cleared.size,stages.length-1);
  const hero=heroes.find(item=>item.id===(ongoing?state.hero:chosen));
  get('camp-sortie').hidden=ongoing;
  get('camp-chapter').textContent=ongoing?'進行中的戰鬥':cleared.size===stages.length?'章節已通關':chapterNames[chapterFor(mission)];
  get('camp-stage').textContent=ongoing?missionFor(state).name:stages[mission].name;
  get('camp-hero-art').src=asset(`hero-portrait-${hero.id}`);
  get('camp-team-name').textContent=ongoing?hero.name:`編隊 ${activeTeam+1}・${hero.name}`;
  get('camp-team-rune').textContent=runes[ongoing?state.rune:loadout].name;
  get('camp-progress').textContent=`編隊 ${activeTeam+1}・${hero.name}`;
  get('camp-profile-art').src=asset(`hero-portrait-${hero.id}`);
  renderWallet(get('camp-wallet'));
}
let drawing=false, revealTimer, revealRun=0;
const summonTypes={card:'卡牌',rune:'符文',hero:'英雄'};
const mechanism=(kind,currency)=>asset('release-summon-'+(['card','rune','hero'].indexOf(kind)*2+Number(currency==='gems')));
function capsuleOptions(){
 const [currency,kind]=document.querySelector('input[name="summon-pool"]:checked').value.split(':');
 return {currency,kind};
}
function openSummon(kind){
 const {currency}=capsuleOptions();
 for(const input of document.querySelectorAll('[name="summon-pool"]')){
   input.closest('label').hidden=!input.value.endsWith(':'+kind);
   if(input.value===currency+':'+kind)input.checked=true;
 }
 view('capsule');renderCapsule();
}
function collectibleName(kind,id){
 return kind==='hero'?heroes.find(hero=>hero.id===id).name:kind==='rune'?runes[id].name:cards[id][0];
}
function renderCapsule(){
 const {kind,currency}=capsuleOptions(), pool=poolFor(kind,currency);
 renderWallet(get('capsule-wallet'));
 get('capsule-title').textContent=summonTypes[kind]+'召喚';
 get('capsule').dataset.currency=currency;
 get('capsule').querySelector('.summon-machine img').src=mechanism(kind,currency);
 for(const button of document.querySelectorAll('[data-summon-type]'))button.setAttribute('aria-pressed',String(button.dataset.summonType===kind));
 for(const [id,count] of [['draw-gems',1],['draw-ten',10]]){
   const price=pullPrice(currency,count), button=get(id);
   button.textContent=(count===1?'單抽':'十連九折')+'・'+price+(currency==='gold'?' 金幣':' 鑽石');
   button.disabled=drawing||wallet[currency]<price||!pool.length;
 }
 const total=pool.reduce((sum,item)=>sum+item.weight,0);
 const tiers=rarityNames.filter(tier=>pool.some(item=>rarity(item.id)===tier));
 const list=element('details');
 list.append(element('summary','最高 '+tiers.at(-1)+'・查看機率'));
 for(const item of pool)list.append(element('p',collectibleName(kind,item.id)+'・'+rarity(item.id)+'・'+(item.weight*100/total).toFixed(2)+'%'));
 get('capsule-rules').replaceChildren(list);
 get('capsule-reveal').replaceChildren(...(validBatch(lastBatch)?[confirmButton('查看上次召喚',()=>showBatch(false))]:[]));
}
function validBatch(batch){
 return batch&&Object.hasOwn(summonTypes,batch.kind)&&['gold','gems'].includes(batch.currency)&&Array.isArray(batch.draws)&&
  [1,10].includes(batch.draws.length)&&batch.draws.every(draw=>draw&&poolFor(batch.kind,batch.currency).some(item=>item.id===draw.id))&&
  Array.isArray(batch.open)&&batch.open.every(index=>Number.isInteger(index)&&index>=0&&index<batch.draws.length);
}
function drawCapsule(count){
 if(drawing)return;
 const {kind,currency}=capsuleOptions();
 const known=kind==='hero'?ownedHeroes():kind==='rune'?unlockedRunes(cleared,wallet):owned();
 const result=openBatch(wallet,kind,currency,count,Math.random,known);
 if(!result)return;
 const previousWallet=wallet, previousInventory=structuredClone(inventory), previousBatch=lastBatch;
 wallet=result.wallet;lastBatch={kind,currency,draws:result.draws,open:[]};
 for(const draw of result.draws)addInstance(inventory,draw.kind,draw.id);
 if(!save()){
   wallet=previousWallet;lastBatch=previousBatch;Object.assign(inventory,previousInventory);
   modal(element('p','無法寫入存檔，請檢查瀏覽器儲存空間。'));return;
 }
 showBatch(true);
}
const reducedReveal=()=>lowMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
const rewardArtwork=(kind,id)=>kind==='card'?cardFace(catalogCard(id,1)):kind==='hero'?artwork(id,'hero'):runeImage(id);
function showBatch(intro){
 if(!validBatch(lastBatch))return;
 const dialog=get('capsule-show'),{kind,currency,draws}=lastBatch;
 dialog.dataset.kind=kind;dialog.dataset.currency=currency;dialog.dataset.motion=reducedReveal()?'off':'on';
 get('capsule-show-title').textContent=(currency==='gold'?'金幣':'鑽石')+'・'+summonTypes[kind]+'召喚';
 if(!dialog.open)dialog.showModal();
 if(!intro){renderBatch();return;}
 drawing=true;renderCapsule();
 const device=element('img','','summon-intro-art');
 device.src=mechanism(kind,currency);device.alt='';
 const body=get('capsule-show-body');
 body.replaceChildren(device);
 if(draws.length===10){
   const wave=element('div','','summon-wave');
   const effect=kind==='card'?'release-rank-R':kind==='hero'?'release-rank-SSR':'release-rank-S';
   for(let i=0;i<10;i++){
     const seal=element('img');seal.src=asset(effect);seal.alt='';seal.style.animationDelay=(i*55)+'ms';wave.append(seal);
   }
   body.append(wave);
 }
 get('draw-open-all').hidden=true;get('capsule-show-close').textContent='跳過';
 void unlock().then(()=>play('summon-'+currency));
 revealTimer=setTimeout(()=>draws.length===1?revealOne(0):renderBatch(),reducedReveal()?50:draws.length===10?1300:950);
}
function renderBatch(){
 drawing=false;
 const {kind,currency,draws,open}=lastBatch;
 const body=get('capsule-show-body'),grid=element('div','','draw-results');
 grid.dataset.count=String(draws.length);
 draws.forEach((draw,index)=>{
   const shown=open.includes(index), tier=rarity(draw.id);
   const tile=confirmButton('',()=>shown?showDrawDetail(draw):revealOne(index));
   tile.className=shown?'draw-item':'draw-item draw-sealed';
   tile.dataset.index=String(index);tile.dataset.rank=tier;
   if(shown)tile.append(rewardArtwork(kind,draw.id),element('strong',collectibleName(kind,draw.id)),element('small',tier+'・'+(draw.duplicate?'已入包':'首次取得')));
   else {
     const seal=element('img');seal.src=mechanism(kind,currency);seal.alt='';
     tile.append(seal);tile.setAttribute('aria-label','揭曉第 '+(index+1)+' 份獎品');
   }
   grid.append(tile);
 });
 body.replaceChildren(grid);
 get('draw-open-all').hidden=open.length===draws.length||draws.length===1;
 get('capsule-show-close').textContent=open.length===draws.length?'收下':'跳過';
 renderCapsule();
}
function showDrawDetail(draw){
 revealRun++;
 const {kind}=lastBatch,body=get('capsule-show-body');
 body.replaceChildren(rewardArtwork(kind,draw.id),element('h3',collectibleName(kind,draw.id)));
 if(kind==='hero')body.append(element('p',heroes.find(hero=>hero.id===draw.id).detail));
 if(kind==='rune')body.append(element('p',runes[draw.id].effect));
 if(kind==='card')body.append(element('p',cards[draw.id][4]||'普通攻擊'));
 get('draw-open-all').hidden=true;get('capsule-show-close').textContent='回結果';
}
function revealOne(index){
 if(lastBatch.open.includes(index))return;
 lastBatch.open.push(index);save();renderBatch();
 const draw=lastBatch.draws[index], tier=rarity(draw.id);
 const tile=get('capsule-show-body').querySelector('[data-index="'+index+'"]');
 if(!reducedReveal()){
   tile.classList.add('draw-opened');
   const light=element('img','','rank-burst');light.src=asset('release-rank-'+tier);light.alt='';tile.append(light);
   light.addEventListener('animationend',()=>light.remove(),{once:true});
   if(rarityNames.indexOf(tier)>=5){
     const focus=element('div','','summon-spotlight');
     focus.dataset.rank=tier;
     focus.append(light.cloneNode(),rewardArtwork(lastBatch.kind,draw.id));
     get('capsule-show-body').append(focus);
     focus.addEventListener('animationend',event=>{if(event.target===focus)focus.remove();});
   }
 }
 play('reveal-'+lastBatch.kind);play('rank-'+tier);
}
async function revealAll(){
 const run=++revealRun;
 for(let index=0;index<lastBatch.draws.length;index++){
   if(run!==revealRun||!get('capsule-show').open)return;
   if(lastBatch.open.includes(index))continue;
   revealOne(index);
   await new Promise(resolve=>setTimeout(resolve,reducedReveal()?25:rarityNames.indexOf(rarity(lastBatch.draws[index].id))>=5?850:165));
 }
}
function closeBatch(){
 clearTimeout(revealTimer);revealRun++;
 if(get('capsule-show-close').textContent==='回結果'){renderBatch();return;}
 if(lastBatch.open.length<lastBatch.draws.length){
   lastBatch.open=lastBatch.draws.map((_,i)=>i);save();renderBatch();return;
 }
 get('capsule-show').close();renderCapsule();
}
get('camp-capsule').onclick=()=>{openSummon('card');changeMusic('capsule');};
get('capsule-back').onclick=()=>{showCamp();changeMusic('lobby');};
get('summon-hall-back').onclick=get('capsule-back').onclick;
for(const button of document.querySelectorAll('[data-summon-type]'))button.onclick=()=>openSummon(button.dataset.summonType);
for(const input of document.querySelectorAll('[name="summon-pool"]'))input.onchange=renderCapsule;
get('draw-gems').onclick=()=>drawCapsule(1);
get('draw-ten').onclick=()=>drawCapsule(10);
get('draw-open-all').onclick=revealAll;
get('capsule-show-close').onclick=closeBatch;
get('capsule-show').addEventListener('cancel',event=>{event.preventDefault();closeBatch();});
get('rune-filter').onchange=renderRuneBook;
get('rune-rarity').onchange=renderRuneBook;
get('rune-search').oninput=renderRuneBook;
function showCollection(from='camp') {
  albumReturn=from;
  albumPage=0;
  get('collection-title').textContent='圖鑑';
  get('collection-back').textContent=from==='results'?'回結算':'回營地';
  view('collection');
  codexTabs('collection','card');
  renderCollection();
}
function codexTabs(section,kind) {
  const page=get(section);
  let nav=page.querySelector('.library-tabs');
  if(!nav){nav=element('nav','','library-tabs');page.querySelector('header').after(nav);}
  nav.replaceChildren(...[['card','卡牌'],['hero','英雄'],['rune','符文']].map(([id,title])=>{
    const button=confirmButton(title,()=>id==='card'?showCollection():id==='hero'?showHeroes():showRunes('camp'));
    button.setAttribute('aria-pressed',String(id===kind));
    return button;
  }));
}
const albumCards=Object.keys(cards).filter(id=>id!=='boss' && id!=='spirit');
function cardGroup(id) {
  const skill=cards[id][4];
  if(skill==='護衛'||skill==='護盾'||skill==='守蔭') return 'guard';
  if(skill==='治療'||skill==='援護') return 'heal';
  if(skill==='自爆'||skill==='亡靈接替') return 'support';
  return 'attack';
}
const perLeaf=6;
const albumWide=matchMedia('(min-width: 700px) and (orientation: landscape) and (pointer: fine)');
let albumPage=0;
function makeAlbumLeaf(page,collection,filtered) {
  const leaf=element('article','','album-leaf');
  const header=element('header');
  const ids=filtered.slice(page*perLeaf,(page+1)*perLeaf);
  header.append(element('h2',`第 ${page+1} 頁`),element('span',`${ids.filter(id=>collection.has(id)).length}/${ids.length}`));
  const grid=element('div','','album-grid');
  for(const id of ids) {
    const [name]=cards[id];
    const available=collection.has(id);
    const slot=element('div','','album-slot');
    const button=element('button','','collectible');
    if(available) {
      button.append(cardFace(catalogCard(id),{lazy:true}));
      button.onclick=()=>encyclopediaCard(id);
    } else {
      const back=element('img','','collectible-art');
      back.src=asset('album-card-back');
      back.alt='';
      button.append(back,element('span','尚未取得'));
      button.onclick=()=>encyclopediaCard(id);
    }
    slot.append(button);
    grid.append(slot);
  }
  for(let i=ids.length;i<perLeaf;i++) grid.append(element('div','','album-slot-placeholder'));
  leaf.append(header,grid);
  return leaf;
}
function renderCollection(direction=0) {
  renderWallet(get('album-wallet'));
  const collection=new Set(owned());
  const filter=get('card-filter').value;
  const tier=get('card-rarity').value;
  const query=get('card-search').value.trim();
  const filtered=albumCards.filter(id=>(filter==='all'||cardGroup(id)===filter)&&(tier==='all'||rarity(id)===tier)&&`${cards[id][0]} ${cards[id][4]}`.includes(query));
  const pages=Math.max(1,Math.ceil(filtered.length/perLeaf));
  albumPage=Math.min(albumPage,pages-1);
  const spread=albumWide.matches?2:1;
  const first=albumPage-albumPage%spread;
  const end=Math.min(pages,first+spread);
  const book=get('album-pages');
  book.replaceChildren(...Array.from({length:end-first},(_,i)=>makeAlbumLeaf(first+i,collection,filtered)));
  if(!filtered.length) book.querySelector('.album-leaf').append(element('p','沒有符合搜尋條件的卡片。'));
  book.classList.toggle('single-leaf',end-first===1);
  get('collection-count').textContent=`已收錄 ${collection.size} / ${albumCards.length} 張・目前顯示 ${filtered.length} 張`;
  get('album-position').textContent=`第 ${first+1===end?end:`${first+1}–${end}`} / ${pages} 頁`;
  get('album-prev').disabled=first===0;
  get('album-next').disabled=end===pages;
  if(direction && !lowMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    book.animate([{opacity:.45,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'translateX(0)'}],220);
  }
}
get('card-filter').onchange=()=>{albumPage=0;renderCollection();};
for(const id of ['card-rarity','rune-rarity'])for(const tier of rarityNames){
  if(id==='rune-rarity'&&tier==='UUR')continue;
  const option=element('option',tier);option.value=tier;get(id).append(option);
}
get('card-rarity').onchange=()=>{albumPage=0;renderCollection();};
get('card-search').oninput=()=>{albumPage=0;renderCollection();};
function turnAlbum(direction) {
  const button=get(direction>0?'album-next':'album-prev');
  if(button.disabled) return;
  albumPage+=direction*(albumWide.matches?2:1);
  renderCollection(direction);
}
const descriptions = {
  援護:'普攻前替一張相鄰且受傷的友軍回復最多 2 點生命，優先選生命較低者。',
  猛進:'普攻正對的敵軍生命高於自己時，本次傷害增加 1。',
  破甲:'普攻前移除正對敵軍最多 2 點護盾。',
  守蔭:'普攻前為一張相鄰且無盾的友軍加 1 點護盾，優先左側。',
  戰吼:'普攻命中敵軍時，額外對敵方英雄造成 1 點傷害。',
  護衛:'左右相鄰友軍受到普攻時，傷害減 1。', 自爆:'陣亡時對敵方正對及兩側角色各造成 2 點傷害。',
  追獵:'普攻瞄準生命最低的敵方角色，同血量時選最左。', 橫掃:'普攻命中本欄，並對敵方左右相鄰角色造成一半傷害。',
  亡靈接替:'陣亡時原地留下 1 攻 2 血靈體。', 治療:'普攻前為一位受傷友軍回復最多 2 點生命。',
  護盾:'部署時帶有 2 點護盾。',
};
function lobby() {
  playback++;
  playing = false;
  get('hero-cut-in').hidden=true;
  view('lobby');
  get('lobby-chapter').textContent=chapterNames[chapterFor(stageIndex)];
  get('lobby-stage').textContent=stages[stageIndex].name;
  teamSelect('lobby-team',lobby);
  get('resume').hidden = !state || state.phase === 'end';
  const roster=get('heroes');
  const scroll=roster.scrollLeft;
  roster.replaceChildren(...heroes.map(hero => {
    const button = element('button');
    const portrait=artwork(hero.id,'hero');
    portrait.loading='lazy';
    button.append(portrait,element('span',hero.name));
    button.setAttribute('aria-pressed',String(chosen === hero.id));
    if(!ownedHeroes().includes(hero.id)) button.append(element('small','未解鎖'));
    button.onclick=()=>ownedHeroes().includes(hero.id)?openTeamEditor('lobby',firstInstance('hero',hero.id),'hero'):heroDetails(hero);
    return button;
  }));
  roster.scrollLeft=scroll;
  showHeroPreview();
  get('battle-plan').textContent=stages[stageIndex].name;
  renderRuneSlots();
}
function showCampaign() {
  view('campaign');
  teamSelect('campaign-team',showCampaign);
  const chapter=chapterFor(stageIndex);
  get('campaign-chapter').textContent=chapterNames[chapter];
  get('chapter-picker').replaceChildren(...chapterNames.map((label,index)=>{
    const open=index===0||cleared.has(index*4-1);
    const button=confirmButton(label+(open?'':'・未解鎖'),()=>{stageIndex=index*4;showCampaign();});
    button.disabled=!open;
    button.setAttribute('aria-pressed',String(chapter===index));
    return button;
  }));
  get('stages').dataset.chapter=String(chapter);
  get('stages').replaceChildren(...stages.slice(chapter*4,chapter*4+4).map((stage,offset)=>{
    const index=chapter*4+offset;
    const open=index===0 || cleared.has(index-1);
    const button=element('button','','stage-flag');
    const flag=element('img');
    flag.src=asset('map-flag');flag.alt='';
    button.append(flag,element('strong',stage.name),element('small',cleared.has(index)?'✓ 已通關':open?'可挑戰':'未解鎖'));
    button.disabled=!open;
    button.setAttribute('aria-pressed',String(stageIndex===index));
    button.onclick=()=>{stageIndex=index;showCampaign();};
    return button;
  }));
  const stage=stages[stageIndex];
  get('stage-name').textContent=stage.name;
  get('stage-detail').textContent=`${stage.goal} 首通取得：${cards[stage.reward][0]}。出戰：${heroes.find(hero=>hero.id===chosen).name}・${runes[loadout].name}`;
  const preview=(label,id)=>{
    const figure=element('figure');
    figure.append(cardFace(catalogCard(id)),element('figcaption',label));
    return figure;
  };
  get('stage-preview').replaceChildren(
    ...stage.opening.map(id=>preview('敵方先鋒',id)),
    preview(cleared.has(stageIndex)?'首通已領取':'首通獎勵',stage.reward)
  );
}
function showHeroPreview() {
  const hero=heroes.find(h=>h.id===chosen);
  get('hero-preview-art').src=asset(`hero-portrait-${hero.id}`);
  get('hero-cut-in-art').src=asset(`hero-cast-${hero.id}`);
  get('hero-preview-art').alt=`${hero.name}的出戰立繪`;
  get('hero-preview-name').textContent=hero.name;
  get('hero-preview-skill').textContent=hero.skill;
  get('hero-detail').textContent=hero.detail;
}
let bagKind='card';
const bagNames={card:'卡片背包',hero:'英雄背包',rune:'符文背包'};
const kindNames={card:'卡片',hero:'英雄',rune:'符文'};
function itemName(item){return collectibleName(item.kind,item.id);}
function itemArt(item) {
  if(item.kind!=='card')return item.kind==='hero'?artwork(item.id,'hero'):runeImage(item.id);
  const piece=element('span','','inventory-card-art');
  const frame=element('img','','inventory-card-frame');
  frame.src=asset(`rank-${rarity(item.id)}`);frame.alt='';
  piece.append(artwork(item.id),frame);
  return piece;
}
function teamsUsing(uid) {
  return teams.flatMap((team,index)=>[...team.items.cards,team.items.hero,team.items.rune].includes(uid)?[index+1]:[]);
}
function itemStats(item) {
  if(item.kind==='card') {
    const card=catalogCard(item.id,item.level);
    return [
      ['攻擊',card.attack],['生命',card.max],['倒數',card.count],['初始護盾',card.shield],
      [card.skill||'普攻',descriptions[card.skill]??'普攻攻擊正對敵軍，沒有敵軍時直擊英雄。'],
    ];
  }
  if(item.kind==='hero') {
    const hero=heroes.find(h=>h.id===item.id);
    return [['起始生命',23+item.level],[hero.skill,hero.detail]];
  }
  return [['每場發動',2],['效果增益','+'+(item.level-1)],[runes[item.id].name,runes[item.id].effect]];
}
function itemDetail(item,allowUpgrade=false) {
  const layout=element('div','','instance-inspector');
  const copy=element('div');
  layout.append(itemArt(item),copy);
  copy.append(element('h2',itemName(item)),element('p',`${rarity(item.id)}・Lv.${item.level}`),
    element('p',item.level===maxLevel?'已滿級':`經驗 ${item.experience} / ${xpNeeded(item.level)}`));
  if(item.level<maxLevel) {
    const bar=element('progress');
    bar.max=xpNeeded(item.level);bar.value=item.experience;
    bar.setAttribute('aria-label','經驗值');
    copy.append(bar);
  }
  const stats=element('dl','','instance-stats');
  for(const [label,value] of itemStats(item))stats.append(element('dt',label),element('dd',String(value)));
  copy.append(stats);
  if(allowUpgrade&&item.level<maxLevel) {
    if(item.kind==='card') {
      const cost=levelCost(item.level);
      const upgrade=confirmButton(`花 ${cost} 金幣・+100 經驗`,()=>{
        if(item.level>=maxLevel||wallet.gold<cost)return;
        wallet={...wallet,gold:wallet.gold-cost};
        grantExperience(item,100);save();renderInventory();modal(itemDetail(item,true));
        void unlock().then(()=>play('upgrade'));
      });
      upgrade.disabled=wallet.gold<cost;
      copy.append(upgrade);
    }
    copy.append(confirmButton('選擇同名材料',()=>chooseMaterial(item)));
  }
  if(allowUpgrade)copy.append(confirmButton('前往編隊',()=>openTeamEditor('inventory-page',item)));
  return layout;
}
function chooseMaterial(target) {
  const candidates=inventory.items.filter(item=>item.uid!==target.uid&&item.kind===target.kind&&item.id===target.id);
  modal(element('h2',`強化 ${itemName(target)}・Lv.${target.level}`),
    element('p','選擇要消耗的個體。已編入任何編隊的個體不能消耗。'),
    ...(candidates.length?candidates.map(item=>{
      const xp=50+(item.level-1)*35+Math.floor(item.experience/2);
      const choose=confirmButton(`${itemName(item)}・Lv.${item.level}・經驗 ${item.experience}`,()=>{
        modal(element('h2','確認消耗材料'),element('p',`消耗所選的 Lv.${item.level} ${itemName(item)}，使目前強化對象獲得 ${xp} 經驗。`),
          confirmButton('確定強化',()=>{
            if(target.level>=maxLevel||!instance(item.uid)||teamsUsing(item.uid).length)return;
            inventory.items=inventory.items.filter(entry=>entry.uid!==item.uid);
            const key=target.kind==='card'?'copies':target.kind==='hero'?'heroCopies':'runeCopies';
            const remaining=inventory.items.filter(entry=>entry.kind===target.kind&&entry.id===target.id).length;
            wallet={...wallet,[key]:{...wallet[key],[target.id]:remaining}};
            grantExperience(target,xp);save();renderInventory();modal(itemDetail(target,true));
            void unlock().then(()=>play('upgrade'));
          }),confirmButton('返回',()=>chooseMaterial(target)));
      });
      choose.disabled=teamsUsing(item.uid).length>0;
      return choose;
    }):[element('p','目前沒有其他同名個體。')]),confirmButton('回個體詳情',()=>modal(itemDetail(target,true))));
}
function renderInventory() {
  const tier=get('inventory-tier').value;
  const query=get('inventory-search').value.trim();
  const list=inventory.items.filter(item=>item.kind===bagKind);
  const order=bagSort[bagKind]??{key:'uid',asc:false};
  get('bag-sort').value=order.key;
  get('bag-direction').textContent=order.asc?'升冪':'降冪';
  const comparisons={
    uid:(a,b)=>Number(a.uid.slice(1))-Number(b.uid.slice(1)), tier:(a,b)=>rarityNames.indexOf(rarity(a.id))-rarityNames.indexOf(rarity(b.id)),
    level:(a,b)=>a.level-b.level, xp:(a,b)=>a.experience/xpNeeded(a.level)-b.experience/xpNeeded(b.level),
    name:(a,b)=>itemName(a).localeCompare(itemName(b),'zh-Hant'),
  };
  const visible=list.filter(item=>(tier==='all'||rarity(item.id)===tier)&&itemName(item).includes(query))
    .sort((a,b)=>(order.asc?1:-1)*(comparisons[order.key]?.(a,b)||0)||Number(b.uid.slice(1))-Number(a.uid.slice(1)));
  get('inventory-heading').textContent=bagNames[bagKind];
  get('inventory-count').textContent=`持有 ${list.length} 份・顯示 ${visible.length} 份`;
  for(const button of document.querySelectorAll('[data-bag]'))button.setAttribute('aria-pressed',String(button.dataset.bag===bagKind));
  get('inventory-grid').replaceChildren(...(visible.length?visible.map(item=>{
    const used=teamsUsing(item.uid);
    const button=confirmButton('',()=>modal(itemDetail(item,true)));
    button.className='instance-tile';
    button.append(itemArt(item),element('strong',itemName(item)),element('small',`${rarity(item.id)}・Lv.${item.level}`));
    if(used.length)button.append(element('small',`編隊 ${used.join('、')}`));
    return button;
  }):[element('p','沒有符合的持有物。')]));
}
function showInventory(kind=bagKind) {
  bagKind=kind;
  syncFixedInventory();
  view('inventory-page');renderInventory();
}
for(const button of document.querySelectorAll('[data-bag]'))button.onclick=()=>{get('inventory-tier').value='all';get('inventory-search').value='';showInventory(button.dataset.bag);};
for(const tier of rarityNames){const option=element('option',tier);option.value=tier;get('inventory-tier').append(option);}
get('inventory-tier').onchange=renderInventory;
get('inventory-search').oninput=renderInventory;
get('inventory-back').onclick=showCamp;
get('bag-sort').onchange=()=>{bagSort[bagKind]={key:get('bag-sort').value,asc:bagSort[bagKind]?.asc??false};save();renderInventory();};
get('bag-direction').onclick=()=>{bagSort[bagKind]={key:get('bag-sort').value,asc:!bagSort[bagKind]?.asc};save();renderInventory();};

let editorReturn='camp', teamDraft, editorSlot='cards', editorPosition=0, editorPreview=null;
function openTeamEditor(from,candidate=null,slot=null) {
  if(get('detail').open)get('detail').close();
  syncFixedInventory();flushTeam();
  editorReturn=from;
  teamDraft=structuredClone(teamItems);
  editorSlot=slot??(candidate?.kind==='card'?'cards':candidate?.kind??'cards');
  editorPosition=0;editorPreview=candidate?.uid??teamDraft.cards[0];
  view('team-editor');
  renderTeamEditor();
}
function teamChanged(){return JSON.stringify(teamDraft)!==JSON.stringify(teamItems);}
function leaveEditor() {
  if(editorReturn==='campaign')showCampaign();
  else if(editorReturn==='lobby')lobby();
  else if(editorReturn==='results')showResults();
  else if(editorReturn==='daily')showDaily(dailySelection.vault,dailySelection.floor);
  else if(editorReturn==='inventory-page')showInventory();
  else showCamp();
}
get('team-exit').onclick=()=>{
  if(!teamChanged()){leaveEditor();return;}
  modal(element('h2','尚未儲存編隊'),confirmButton('放棄並返回',()=>{get('detail').close();leaveEditor();}),confirmButton('繼續編輯',()=>get('detail').close()));
};
function renderTeamEditor() {
  const host=get('team-editor-content');
  get('team-status').textContent=teamChanged()?'尚未儲存':'已儲存';
  const header=element('div','','team-tools');
  const tabs=element('div','','library-tabs');
  for(let i=0;i<3;i++){
    const change=()=>{
      selectTeam(i);save();teamDraft=structuredClone(teamItems);editorPreview=null;renderTeamEditor();
    };
    const button=confirmButton(`編隊 ${i+1}`,()=>{
      if(i===activeTeam)return;
      if(teamChanged()){modal(element('h2','切換前尚未儲存'),confirmButton('放棄並切換',()=>{get('detail').close();change();}));return;}
      change();
    });
    button.setAttribute('aria-pressed',String(i===activeTeam));tabs.append(button);
  }
  const saveTeam=confirmButton('儲存編隊',()=>{
    const problem=checkLineup(teamDraft,instance);
    if(problem){get('team-status').textContent=problem;return;}
    teamItems=structuredClone(teamDraft);
    deck=teamItems.cards.map(uid=>instance(uid).id);
    chosen=instance(teamItems.hero).id;
    loadout=instance(teamItems.rune)?.id??'none';
    save();renderTeamEditor();
  });
  header.append(tabs,saveTeam);
  const slots=element('div','','team-instance-slots');
  function slot(kind,index,uid,label) {
    const item=instance(uid);
    const button=confirmButton('',()=>{editorSlot=kind;editorPosition=index;editorPreview=uid;renderTeamEditor();});
    button.setAttribute('aria-pressed',String(editorSlot===kind&&(kind!=='cards'||editorPosition===index)));
    button.append(element('small',label));
    if(item)button.append(itemArt(item),element('strong',itemName(item)),element('small',`${rarity(item.id)}・Lv.${item.level}`));
    else button.append(element('span','未裝備'));
    slots.append(button);
  }
  slot('hero',0,teamDraft.hero,'英雄');
  teamDraft.cards.forEach((uid,i)=>slot('cards',i,uid,`第 ${i+1} 張`));
  slot('rune',0,teamDraft.rune,'符文');
  const candidate=instance(editorPreview), kind=editorSlot==='cards'?'card':editorSlot;
  const preview=element('section','','team-candidate');
  if(candidate?.kind===kind) {
    preview.append(itemDetail(candidate));
    const occupied=kind==='card'?teamDraft.cards.findIndex((uid,i)=>i!==editorPosition&&instance(uid)?.id===candidate.id):-1;
    const blocked=occupied>=0&&teamDraft.cards[occupied]!==candidate.uid;
    const assign=confirmButton(occupied>=0&&!blocked?'交換兩個牌位':'確認裝入此欄位',()=>{
      if(kind==='card'){
        const next=assignLineupCard(teamDraft.cards,editorPosition,candidate.uid,instance);
        if(!next)return;
        teamDraft.cards=next;
      } else teamDraft[kind]=candidate.uid;
      renderTeamEditor();
    });
    if(blocked)preview.append(element('p',`同名卡已在第 ${occupied+1} 張。請先點該牌位，再換成這一份。`));
    assign.disabled=blocked;
    preview.append(assign);
  }
  if(kind==='rune') preview.append(confirmButton('卸下符文',()=>{teamDraft.rune=null;editorPreview=null;renderTeamEditor();}));
  const candidates=element('div','','team-candidates');
  const search=element('input');
  search.type='search';search.placeholder='卡牌、英雄或符文名稱';search.setAttribute('aria-label','搜尋可裝備個體');
  const fill=()=>{
    const query=search.value.trim();
    const items=inventory.items.filter(item=>item.kind===kind&&itemName(item).includes(query));
    candidates.replaceChildren(...(items.length?items.map(item=>{
      const button=confirmButton('',()=>{
        editorPreview=item.uid;renderTeamEditor();
        get('team-editor-content').querySelector('.team-candidate').scrollIntoView({block:'nearest'});
      });
      button.append(itemArt(item),element('strong',itemName(item)),element('small',`${rarity(item.id)}・Lv.${item.level}`));
      button.setAttribute('aria-pressed',String(item.uid===editorPreview));return button;
    }):[element('p','沒有符合的個體。')]));
  };
  search.oninput=fill;fill();
  host.replaceChildren(header,slots,preview,element('h2',`選擇${kindNames[kind]}`),search,candidates);
}
function renderBoard(frame, event) {
  const [player, enemy] = frame.sides;
  const next = player.board.length;
  const field = get('field');
  const scroll = field.scrollLeft;
  const columns = Math.max(3,next+1,enemy.board.length);
  get('lanes').replaceChildren(...Array.from({length:columns},(_,index)=>{
    const lane = element('div','','lane');
    const slot = side => {
      const card = frame.sides[side].board[index];
      const landing=side===0&&!event&&selected!==null&&index===next;
      const node = element(card||landing ? 'button' : 'div','','slot');
      node.dataset.slot=`${side}:${index}`;
      if (card) {
        node.append(cardFace({...card,count:0}));
        node.onclick=()=>cardDetail(card);
      } else {
        node.classList.add('empty-slot');
        if(landing){
          const socket=element('img','','slot-art');
          socket.src=asset('rune-pulse');socket.alt='';
          node.append(socket);node.classList.add('preview');
          node.setAttribute('aria-label','部署到這裡');node.onclick=()=>act({type:'deploy',uid:selected});
        }
      }
      return node;
    };
    lane.append(slot(1),element('span','','lane-divider'),slot(0));
    if(frame.daily?.vault==='gems'&&index===((frame.round-1)%3))lane.classList.add('hazard-lane');
    return lane;
  }));
  field.scrollLeft = scroll;
  get('hero-hp').value=player.hp;get('hero-hp').max=24+(frame.heroLevel??1)-1;
  get('enemy-hp').value=enemy.hp;get('enemy-hp').max=missionFor(frame).hp;
  get('enemy-portrait').src=asset('illustration-'+missionFor(frame).opening[0]);
  get('health').textContent = `${player.hp}${frame.heroShield ? ' ◆'+frame.heroShield : ''}`;
  get('enemy-health').textContent = `${enemy.hp}`;
  get('round').textContent = `回合 ${frame.round}`;
  const spent=state.rune!=='none' && frame.charges===0;
  get('rune-status').replaceChildren(runeBadge(state.rune,state.rune==='none'?'未裝備':`${runes[state.rune].name} ${frame.charges} 次`,spent?'spent':state.rune));
  const boss=enemy.board.findIndex(card=>card?.id==='boss');
  get('forecast').textContent=boss>=0&&!frame.daily?`斷橋守將在第 ${boss+1} 欄。橫掃會波及兩側。`:missionFor(state).goal;
}
function render() {
  const [player,enemy]=state.sides;
  renderBoard(state);
  const current=heroes.find(hero=>hero.id===state.hero);
  get('portrait').src=asset(`hero-portrait-${current.id}`);
  get('hero-name').textContent=current.name;
  get('hero-name').onclick=()=>modal(artwork(current.id,'hero'),element('h2',current.skill),element('p',current.detail));
  const card=player.hand.find(item=>item.uid===selected);
  const hand=get('hand');
  get('hand-label').textContent=`手牌 ${player.hand.length}`;
  const handScroll=hand.scrollLeft;
  hand.replaceChildren(...player.hand.map(item=>{
    const button=element('button');
    button.append(cardFace(item));
    button.disabled=playing || state.phase==='end';
    button.setAttribute('aria-pressed',String(item.uid===selected));
    button.onclick=()=>{
      if (selected===item.uid || item.count) {cardDetail(item);return;}
      selected=item.uid;
      render();
      get('lanes').querySelector('.preview')?.scrollIntoView({block:'nearest',inline:'nearest'});
    };
    return button;
  }));
  hand.scrollLeft=handScroll;
  get('message').textContent=state.result ?? (card?
    `${card.name}將部署至第 ${player.board.length+1} 欄・${enemy.board[player.board.length]?.name ?? '空位，可直擊英雄'}`:
    '點就緒手牌預覽部署；再點同一張看技能。');
  get('deploy').disabled=playing || !card || Boolean(card.count) || state.phase==='end';
  get('attack').disabled=playing || state.phase==='end';
  get('back').disabled=state.phase==='end';
  get('deploy').hidden=!card;
}
function effect(event) {
  if(event.rune) return 'rune-pulse';
  if (event.kind==='skill') return event.message.includes('自爆')?'fx-bomb':event.message.includes('靈體')?'fx-spirit':/治療|回春|援護/.test(event.message)?'fx-heal':'fx-shield';
  if (event.kind==='attack') return event.message.includes('橫掃')?'fx-ax':event.message.includes('斥候')?'fx-arrow':'fx-ax';
  if (event.kind==='deploy') return 'fx-rune';
  if (event.kind==='death') return 'fx-spirit';
  return 'fx-shield';
}
function duration(kind) {
  const speed=Number(get('speed').value);
  return kind==='hero'?Math.max(560,1150/speed):(kind==='round'?180:380)/speed;
}
function showHeroCast(ms, reducedMotion) {
  const hero=heroes.find(h=>h.id===state.hero);
  const panel=get('hero-cut-in');
  get('hero-cut-in-name').textContent=hero.name;
  get('hero-cut-in-skill').textContent=hero.skill;
  panel.hidden=false;
  if (!reducedMotion) panel.animate([
    {opacity:0,transform:'translateX(-16px)'},
    {opacity:1,transform:'translateX(0)',offset:.16},
    {opacity:1,transform:'translateX(0)',offset:.85},
    {opacity:0,transform:'translateX(8px)'},
  ],{duration:ms,easing:'ease-out'});
}
async function act(action) {
  if (playing) return;
  const update=applyAction(state,action);
  if (!update) return;
  state=update.state;
  const reward=state.result==='勝利' && !state.daily && !cleared.has(state.stage) ? stages[state.stage].reward : null;
  if(reward) {
    const hero=heroMilestones[state.stage];
    if(hero){
      const duplicate=ownedHeroes().includes(hero);
      const count=wallet.heroCopies?.[hero]??(duplicate?1:0);
      wallet={...wallet,heroCopies:{...wallet.heroCopies,[hero]:count+1}};
      addInstance(inventory,'hero',hero);
      state.heroReward={id:hero,duplicate};
    }
    if(wallet.unlocked.includes(reward)) {
      const count=wallet.copies?.[reward]??1;
      wallet={...wallet,copies:{...wallet.copies,[reward]:count+1}};
    }
    state.rewardUid=addInstance(inventory,'card',reward).uid;
    cleared.add(state.stage);
  }
  if(state.result) state.resultReward=reward;
  if(state.result==='勝利') {
    const pay=state.daily?claimReward(state.daily.vault,state.daily.floor):victoryPay(Boolean(reward));
    state.currencyReward=pay;
    wallet={...wallet,gold:wallet.gold+pay.gold,gems:wallet.gems+pay.gems};
  }
  log=[...log,...update.events.map(({message})=>message)].slice(-150);
  selected=null;
  save();
  playing=true;
  const token=++playback;
  for(const button of get('hand').querySelectorAll('button')) button.disabled=true;
  get('attack').disabled=true;
  get('deploy').disabled=true;
  get('back').disabled=Boolean(state.result);
  try { for(const event of update.events) {
    if(token!==playback) return;
    if(document.hidden) break;
    renderBoard(event.frame,event);
    get('message').textContent=event.message;
    play(event.kind==='hit'?(event.message.includes('盾吸收')?'shield':event.lanes?.includes(null)?'impact':'hit'):event.rune?'rune':event.kind,state.hero);
    const ms=duration(event.kind);
    const reducedMotion=lowMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(event.kind==='hero') showHeroCast(ms,reducedMotion);
    const origin=get('lanes').querySelector(`[data-slot="${event.actor}:${event.origin}"]`);
    if(origin && !reducedMotion) origin.animate(
      [{transform:'translateY(0)'},{transform:`translateY(${event.actor===0?-9:9}px)`},{transform:'translateY(0)'}],ms);
    const frameAnimations=[];
    for(const lane of event.lanes??[]) {
      const slot=lane===null?(event.target===0?get('health'):get('enemy-health')):get('lanes').querySelector(`[data-slot="${event.target}:${lane}"]`);
      if(!slot) continue;
      if(lane===null || event.kind==='hero') {
        if(!reducedMotion) slot.animate([{opacity:.45},{opacity:1}],ms);
        continue;
      }
      const img=element('img','','effect');
      const art=effect(event);
      const series=['fx-ax','fx-bomb','fx-spirit'].includes(art) ? art.slice(3) : null;
      img.src=asset(series?`frame-${series}0`:art);
      img.alt='';
      slot.append(img);
      if(series) frameAnimations.push({img,series});
      if(event.kind==='hit') slot.append(element('i',event.message.split('：').at(-1)));
      if(!reducedMotion) img.animate([{opacity:0,transform:'scale(.65)'},{opacity:1},{opacity:0,transform:'scale(1.18)'}],ms);
    }
    for(let step=1;step<=4;step++) {
      await new Promise(resolve=>setTimeout(resolve,ms/4));
      if(step<4 && token===playback) {
        for(const {img,series} of frameAnimations) img.src=asset(`frame-${series}${step}`);
      }
    }
    if(token===playback && event.kind==='hero') get('hero-cut-in').hidden=true;
  } } catch(error) { console.warn('Battle playback interrupted',error); }
  if(token!==playback) return;
  playing=false;
  if(state.result) showResults();
  else render();
}
function showResults() {
  const dialog=get('detail');
  if(dialog.open) dialog.close();
  get('hero-cut-in').hidden=true;
  view('results');
  get('result-title').textContent=state.result;
  get('result-stage').textContent=missionFor(state).name;
  get('result-camp').textContent=state.daily?'回每日秘境':'回營地';
  get('result-next').hidden=Boolean(state.daily) || state.result!=='勝利' || state.stage+1>=stages.length;
  const summary=element('section','','result-summary');
  summary.append(artwork(state.hero,'hero'),element('p',`第 ${state.round} 回合・我方剩餘生命 ${state.sides[0].hp}`),
    runeBadge(state.rune,state.rune==='none'?'未裝備':`${runes[state.rune].name}・觸發 ${2-state.charges} 次`));
  if(state.currencyReward) {
    const rewards=element('div','','wallet');
    rewards.append(money('gold',`+${state.currencyReward.gold}`),money('gems',`+${state.currencyReward.gems}`));
    summary.append(rewards);
  }
  if(rewardRune()) summary.append(runeBadge(rewardRune(),`解鎖 ${runes[rewardRune()].name}`));
  if(state.heroReward) summary.append(element('p',`${collectibleName('hero',state.heroReward.id)}・${state.heroReward.duplicate?'培養材料 +1':'英雄已解鎖'}`));
  const reward=state.resultReward===stages[state.stage].reward?state.resultReward:null;
  if(reward) {
    const card=element('button','','result-reward');
    const copy=instance(state.rewardUid);
    card.append(cardFace(catalogCard(reward,copy?.level??1)));
    card.onclick=()=>copy?modal(itemDetail(copy)):cardDetail(catalogCard(reward,1));
    summary.append(element('h2','首通獎勵已入冊'),card);
  }
  get('result-content').replaceChildren(summary);
  get('result-title').focus();
  changeMusic(state.result==='勝利'?'end':'loss');
}
function rewardRune() { return state.resultReward?['ward','frost','flame','spark'][state.stage]:null; }
get('result-camp').onclick=()=>{if(state.daily)showDaily(state.daily.vault,state.daily.floor);else showCamp();changeMusic('lobby');};
get('result-deck').onclick=()=>{stageIndex=state.stage;changeMusic('lobby');openTeamEditor('results');};
get('result-retry').onclick=()=>{stageIndex=state.stage;enter(true,state.daily??null);};
get('result-next').onclick=()=>{stageIndex=state.stage+1;lobby();changeMusic('lobby');};
get('result-album').onclick=()=>showCollection('results');
async function enter(restart, expedition=null) {
  if(!restart && state?.phase!=='deploy') return;
  if(restart) {
    const problem=checkLineup(teamItems,instance);
    if(problem){modal(element('h2','編隊需要調整'),element('p',problem));return;}
    if(expedition){
      const {vault,floor}=expedition;
      if(!claimDaily(daily,vault,floor)) {showDaily(vault,floor);return;}
    } else if(!stages[stageIndex]||(stageIndex>0&&!cleared.has(stageIndex-1)))return;
    const battleCards=teamItems.cards.map(instance);
    const battleHero=instance(teamItems.hero);
    const battleRune=instance(teamItems.rune);
    const levels=Object.fromEntries(battleCards.map(card=>[card.id,card.level]));
    state=createBattle(battleRune?.id??'none',battleHero.id,stageIndex,battleCards.map(card=>card.id),levels,battleHero.level,battleRune?.level??1,expedition);
    log=[];
    selected=null;
    save();
  }
  view('battle');
  get('hero-cut-in-art').src=asset(`hero-cast-${state.hero}`);
  render();
  await unlock();
  prepare(state.hero);
  changeMusic((state.daily?missionFor(state).head:state.stage%4===3)?'boss':'battle');
}
function changeMusic(scene) { audioScene=scene; setMusic(scene); }
get('start').onclick=()=>enter(true);
get('resume').onclick=()=>enter(false);
get('back').onclick=()=>{if(state.daily)showDaily(state.daily.vault,state.daily.floor);else lobby();changeMusic('lobby');};
get('attack').onclick=()=>act({type:'attack'});
get('deploy').onclick=()=>act({type:'deploy',uid:selected});
get('speed').onchange=save;
get('mute').onclick=()=>{get('mute').textContent=toggleMute()?'開聲音':'靜音';};
get('report').onclick=()=>modal(element('h2','戰報'),...log.slice(-40).reverse().map(line=>element('p',line)));
get('deck').onclick=()=>openTeamEditor('lobby');
function backupPanel() {
  const status=element('div');
  status.setAttribute('aria-live','polite');
  const download=element('button','匯出 JSON');
  download.onclick=()=>{
    const url=URL.createObjectURL(new Blob([makeBackup(currentSave())],{type:'application/json'}));
    const link=element('a');
    link.href=url;
    link.download='CxQ-Rift-Summon-backup.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const picker=element('input');
  picker.type='file';
  picker.accept='.json,application/json';
  picker.setAttribute('aria-label','選擇存檔備份');
  picker.onchange=async()=>{
    if (!picker.files[0]) return;
    try {
      const backup=await readBackup(picker.files[0]);
      if (!get('detail').open || !picker.isConnected) return;
      const imported=backup.save;
      const summary=`已通過 ${imported.cleared.length}/${stages.length} 關・${imported.state?.phase==='deploy'?'含未完戰鬥':'無未完戰鬥'}`;
      const confirm=element('button','確認匯入並重新載入');
      confirm.onclick=()=>{
        try {
          localStorage.setItem(recoveryKey,JSON.stringify(currentSave()));
          localStorage.setItem(key,JSON.stringify(imported));
          location.reload();
        } catch {status.textContent='瀏覽器無法儲存匯入結果。';}
      };
      status.replaceChildren(element('p',backup.createdAt?.toLocaleString('zh-TW') ?? '日期未知'),element('p',summary),confirm);
    } catch (error) {status.textContent=error.message;}
  };
  const restore=element('button','恢復匯入前的存檔');
  restore.onclick=()=>{
    try {
      const recovery=localStorage.getItem(recoveryKey);
      if (!recovery) {status.textContent='目前沒有匯入前的存檔。';return;}
      const confirm=element('button','確認恢復');
      confirm.onclick=()=>{
        try {localStorage.setItem(key,recovery);location.reload();}
        catch {status.textContent='瀏覽器無法儲存復原結果。';}
      };
      status.replaceChildren(element('p','恢復後會回到上一次匯入前的進度。'),confirm);
    } catch {status.textContent='瀏覽器無法讀取匯入前的存檔。';}
  };
  modal(element('h2','存檔備份'),download,element('p','選擇 JSON 可先查看進度，再確認匯入。'),picker,restore,status);
}
get('backup').onclick=backupPanel;
get('camp-campaign').onclick=showCampaign;
get('camp-sortie').onclick=()=>{
  if(state?.phase==='deploy')return;
  stageIndex=Math.min(cleared.size,stages.length-1);
  enter(true);
};
get('campaign-prepare').onclick=()=>openTeamEditor('campaign');
get('campaign-fight').onclick=()=>enter(true);
get('campaign-back').onclick=showCamp;
get('camp-map').onclick=showCampaign;
get('camp-profile').onclick=()=>openTeamEditor('camp');
get('daily-back').onclick=showCampaign;
get('daily-link').onclick=()=>showDaily();
function claimReward(vault,floor,sweep=false) {
  const result=claimDaily(daily,vault,floor,sweep);
  const pay={gold:0,gems:0};
  if(result){daily=result.progress;pay[vault]=result.amount;}
  return pay;
}
function showDaily(vault='gold',floor) {
  view('daily');
  const info=vaults[vault], status=dailyStatus(daily,vault);
  floor??=Math.min(10,status.highest+1);
  dailySelection={vault,floor};
  const tabs=element('nav','','library-tabs');
  for(const [id,entry] of Object.entries(vaults)){
    const button=confirmButton(entry.name,()=>showDaily(id));
    button.setAttribute('aria-pressed',String(id===vault));tabs.append(button);
  }
  const track=element('div','','daily-track');
  for(let n=1;n<=10;n++){
    const label=n<=status.highest?'已通關':n===status.highest+1?'可挑戰':'未解鎖';
    const button=confirmButton('',()=>showDaily(vault,n));
    const flag=element('img');flag.src=asset('map-flag');flag.alt='';
    button.dataset.status=n<=status.highest?'clear':n===status.highest+1?'open':'locked';
    button.append(flag,element('strong',`第 ${n} 層`),element('small',label));
    button.setAttribute('aria-pressed',String(n===floor));track.append(button);
  }
  const details=element('section','','daily-details');
  const stage=dailyStage({vault,floor});
  const unit=vault==='gold'?'金幣':'鑽石';
  const base=dailyPay(vault,floor);
  const sweep=n=>{
    const pay=claimReward(vault,n,true);
    if(!pay[vault]){showDaily(vault,n);return;}
    wallet={...wallet,[vault]:wallet[vault]+pay[vault]};save();showDaily(vault,n);
    modal(element('h2','掃蕩完成'),money(vault,`+${pay[vault]}`));
  };
  details.append(element('h2',stage.name),element('p',`${stage.goal}　首通額外 ${Math.ceil(base/2)} ${unit}・固定 ${base} ${unit}`),
    element('p',`敵軍：${[...stage.opening,...stage.opponents].map(id=>cards[id][0]).join('、')}`));
  const buttons=element('div','','controls');
  const fight=confirmButton('挑戰',()=>enter(true,{vault,floor}));
  fight.disabled=status.used>=info.limit||floor>status.highest+1;
  const skip=confirmButton('掃蕩此層',()=>sweep(floor));skip.disabled=status.used>=info.limit||floor>status.highest;
  const best=confirmButton('掃蕩最高已通關層',()=>sweep(status.highest));best.disabled=status.used>=info.limit||!status.highest;
  buttons.append(fight,skip,best,confirmButton('編隊',()=>openTeamEditor('daily')));
  details.append(buttons);
  get('daily-content').replaceChildren(tabs,element('p',`今日剩餘 ${info.limit-status.used}/${info.limit}・台灣時間 00:00 重置`),track,details);
}
get('title-start').onclick=async()=>{if(starterHero)showCamp();else showStarter();await unlock();changeMusic(starterHero?'lobby':'title');};
get('title-resume').onclick=()=>enter(false);
get('camp-runes').onclick=()=>showRunes('camp');
get('rune-back').onclick=()=>runeReturn==='lobby'?lobby():showCamp();
get('camp-deck').onclick=()=>openTeamEditor('camp');
get('camp-collection').onclick=()=>showCollection();
get('camp-bag').onclick=()=>showInventory('card');
get('camp-heroes').onclick=showHeroes;
get('hero-book-back').onclick=showCamp;
for(const tier of rarityNames){const option=element('option',tier);option.value=tier;get('hero-rarity').append(option);}
get('hero-rarity').onchange=showHeroes;
get('hero-owned').onchange=showHeroes;
get('rune-owned').onchange=renderRuneBook;
get('collection-back').onclick=()=>albumReturn==='results'?showResults():showCamp();
get('album-prev').onclick=()=>turnAlbum(-1);
get('album-next').onclick=()=>turnAlbum(1);
albumWide.addEventListener('change',()=>{if(!get('collection').hidden) renderCollection();});
let swipeStart;
get('album-pages').addEventListener('touchstart',event=>{
  if(event.touches.length===1) swipeStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
get('album-pages').addEventListener('touchend',event=>{
  if(!swipeStart) return;
  const dx=event.changedTouches[0].clientX-swipeStart.x;
  const dy=event.changedTouches[0].clientY-swipeStart.y;
  swipeStart=null;
  if(Math.abs(dx)>52 && Math.abs(dx)>Math.abs(dy)*1.4) turnAlbum(dx<0?1:-1);
},{passive:true});
get('album-pages').addEventListener('touchcancel',()=>{swipeStart=null;},{passive:true});
get('hero-preview-open').onclick=()=>{
  const hero=heroes.find(h=>h.id===chosen);
  modal(artwork(hero.id,'hero'),element('h2',hero.name),element('strong',hero.skill),element('p',hero.detail));
};
get('camp-resume').onclick=()=>enter(false);
get('return-camp').onclick=showCamp;
get('camp-options').onclick=()=>showSettings('camp');
get('options').onclick=()=>showSettings('lobby');
get('settings-back').onclick=()=>settingsReturn==='lobby'?lobby():showCamp();
get('settings-backup').onclick=backupPanel;
function showSettings(from){
  settingsReturn=from;
  view('settings-page');
  const slider=(id,labelText)=>{
    const label=element('label',labelText);
    const input=element('input');
    input.type='range'; input.min='0'; input.max='1'; input.step='.01'; input.value=volumes[id];
    input.oninput=()=>{volumes={...volumes,[id]:Number(input.value)};updateVolume(volumes);save();};
    label.append(input);
    const row=element('p');
    row.append(label);
    return row;
  };
  const motion=element('label','減少動效');
  const checkbox=element('input');
  checkbox.type='checkbox';
  checkbox.checked=lowMotion;
  checkbox.onchange=()=>{lowMotion=checkbox.checked;save();};
  motion.append(checkbox);
  get('settings-controls').replaceChildren(slider('bgm','背景音樂'),slider('sfx','音效'),motion);
}
get('rune-status').onclick=()=>runeDetails(state.rune);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && audioScene && audioScene!=='end' && audioScene!=='loss') setMusic(audioScene);
});
get('title-resume').hidden=state?.phase!=='deploy';
get('title-start').textContent=starterHero?'繼續冒險':'開始冒險';
