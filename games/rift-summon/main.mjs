import {migrateCombatSave} from './save-migration.mjs?v=combat-4';
import {cardStats,cardDescription,profiles} from './combat-rules.mjs?v=combat-4';
import {runeProfile,runeAdvancement} from './runes.mjs?v=combat-4';
import {effectPoints,effectNeeded,grantEffect} from './inventory.mjs?v=combat-4';
import {exclusiveInfo,exclusiveGroups} from './exclusive-cards.mjs?v=combat-4';
import {runes,runeBonus,runeDescription} from './runes.mjs?v=combat-4';
import {signatureDescription} from './combat-effects.mjs?v=combat-4';
import {pityTier,pityRemaining} from './economy.mjs?v=combat-4';
import {fragmentValue,exchangeCost,protectedItems,dismantle,exchangeCard} from './recycle.mjs?v=combat-4';
import {heroSkillProfile} from './hero-skills.mjs?v=combat-4';
import {heroHealth,heroCapacity,heroLimits,nextHeroCapacity,migrateHeroProgression} from './progression.mjs?v=combat-4';
import {createDialoguePicker} from './home-dialogue.mjs?v=combat-4';
import {materials,bookFor} from './materials.mjs?v=combat-4';
import {vaults,validDaily,emptyDaily,dailyStatus,dailyStage,dailyPay,claimDaily} from './daily.mjs?v=combat-4';
import {applyAction, cards, createBattle, stages, starter, chapterNames} from './battle.mjs?v=combat-4';
import {heroes} from './heroes.mjs?v=combat-4';
import {unlock, prepare, play, setMusic, toggleMute, updateVolume} from './audio.mjs?v=combat-4';
import {makeBackup, readBackup} from './backup.mjs?v=combat-4';
import {startingWallet,validWallet,levelCost,victoryPay,unlockedRunes} from './economy.mjs?v=combat-4';
import {starterHeroes,rarity,rarityNames,poolFor,pullPrice,openBatch,capsuleCards,walletCardIds} from './economy.mjs?v=combat-4';
import {migrateInventory,addInstance,xpNeeded,grantExperience,checkLineup,assignLineupCard,levelLimit,limits,cardBonus,cardHealthBonus,effectsMax} from './inventory.mjs?v=combat-4';

const get = id => document.getElementById(id);
const asset = name => globalThis.riftArtwork?.[name] ?? `art/${name}.webp`;
const key = 'cxq-rift-summon-visual-slice';
const recoveryKey = key + '-recovery';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
let heroMigrationPending=Boolean(saved&&saved.heroProgressionVersion!==2);
saved=migrateCombatSave(migrateHeroProgression(saved));
let state = saved?.state?.version === 3 && saved.state.phase==='deploy' ? saved.state : null;
let daily=validDaily(saved?.daily)?saved.daily:emptyDaily();
const consumed=new Set(Array.isArray(saved?.consumed)?saved.consumed:[]);
let displayHero=saved?.displayHero;
let lastBatch=saved?.lastBatch??null;
let townRead=saved?.townRead??null;
const bagSort=saved?.bagSort??{};
const listSort=saved?.listSort??{};
const lineupSort=saved?.lineupSort??{};
const missionFor=battle=>battle.daily?dailyStage(battle.daily):stages[battle.stage];
let log = state ? saved?.log ?? [] : [];
const cleared = new Set(Array.isArray(saved?.cleared) ? saved.cleared.filter(index => stages[index]) : []);
let wallet=validWallet(saved?.wallet)?saved.wallet:startingWallet();
const owned = () => [...new Set([...starter,...stages.filter((_,index)=>cleared.has(index)).map(stage=>stage.reward),...wallet.unlocked,...(wallet.exclusiveUnlocked??[])])];
let deck = Array.isArray(saved?.deck) && saved.deck.length >= 8 && saved.deck.length <= 12 && saved.deck.every(id=>owned().includes(id)) ? saved.deck : [...starter];
let stageIndex = state?.phase==='deploy' ? state.stage : Math.min(cleared.size, stages.length-1);
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
const savedRune=saved?.loadout??state?.rune;
let loadout=savedRune==='none'||unlockedRunes(cleared,wallet).includes(savedRune)?savedRune:'wall';
let activeTeam=Number.isInteger(saved?.activeTeam)&&saved.activeTeam>=0&&saved.activeTeam<3?saved.activeTeam:0;
const inventory=migrateInventory(saved,wallet,owned(),ownedHeroes(),unlockedRunes(cleared,wallet));
const instance=uid=>inventory.items.find(item=>item.uid===uid);
const firstInstance=(kind,id)=>inventory.items.find(item=>item.kind===kind&&item.id===id);
function syncFixedInventory() {
  for(const [kind,ids] of [['card',owned()],['hero',ownedHeroes()],['rune',unlockedRunes(cleared,wallet)]]) {
    for(const id of ids) if(!firstInstance(kind,id)&&!consumed.has(kind+":"+id)) addInstance(inventory,kind,id);
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
    deck:Array.isArray(item?.deck)&&item.deck.length>=8&&item.deck.length<=12&&item.deck.every(id=>owned().includes(id))?[...item.deck]:[...deck],
    hero:ownedHeroes().includes(item?.hero)?item.hero:(ownedHeroes().includes(chosen)?chosen:starterHero),
    rune:item?.rune==='none'||unlockedRunes(cleared,wallet).includes(item?.rune)?item.rune:loadout,
    items:item?.items,
  };
});
function mapTeamItems(team) {
  const used=new Set();
  const cards=team.deck.map((id,i)=>{
    const linked=instance(team.items?.cards?.[i]);
    const item=linked?.kind==='card'&&linked.id===id&&!used.has(linked.uid)?linked:
      inventory.items.find(item=>item.kind==='card'&&item.id===id&&!used.has(item.uid));
    if(item)used.add(item.uid);
    return item?.uid??null;
  });
  return {cards,
    hero:bindInstance(team.items?.hero,'hero',team.hero),
    rune:bindInstance(team.items?.rune,'rune',team.rune),
    rune2:instance(team.items?.rune2)?.kind==='rune'&&team.items.rune2!==team.items.rune?team.items.rune2:null,
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
  for(const item of inventory.items) if(item.kind==='card'&&item.level>1) levels[item.id]=Math.max(levels[item.id]??1,Math.min(5,item.level));
  wallet={...wallet,levels};
  syncFixedInventory();
  const ongoing=state?.phase==='deploy';
  flushTeam();
  return {combatRulesVersion:2,heroProgressionVersion:2,consumed:[...consumed],displayHero,daily,lastBatch,townRead,bagSort,lineupSort,listSort,state:ongoing?state:null, log:ongoing?log:[], deck, cleared:[...cleared], volumes, loadout, lowMotion, wallet, teams, inventory, activeTeam, starterHero, speed:get('speed').value};
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(currentSave())); return true; }
  catch { notify('儲存失敗，請檢查瀏覽器的儲存空間。',true); return false; }
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
const noticeTimers=new WeakMap();
function notify(message,error=false){
  const host=get('detail').open?get('detail-notice'):get('game-notice');
  clearTimeout(noticeTimers.get(host));
  host.textContent=message;
  host.classList.toggle('notice-error',error);
  if(!error)noticeTimers.set(host,setTimeout(()=>{host.textContent='';},5500));
}
function featuredHeroId(){
  return ownedHeroes().includes(displayHero)?displayHero:state?.phase==='deploy'?state.hero:chosen;
}
function modal(...children) {
  get('detail-notice').textContent='';
  get('detail-content').replaceChildren(...children);
  const dialog=get('detail');
  const anchor=get('detail-content').querySelector('h1,h2,h3')??get('detail-content');
  anchor.tabIndex=-1;anchor.setAttribute('autofocus','');
  if(!dialog.open)dialog.showModal();
  anchor.focus({preventScroll:true});anchor.removeAttribute('autofocus');dialog.scrollTop=0;
}
function view(id) {
  if(id!=='camp')hideHomeDialogue();
  for(const page of ['title-screen','starter-select','camp','rune-book','hero-book','inventory-page','team-editor','summon-hall','capsule','campaign','daily','settings-page','collection','lobby','battle','results']) get(page).hidden=page!==id;
}
function reviewLineup(){
  const title=element('h2',`出戰編隊 ${activeTeam+1}`);
  const grid=element('div','','lineup-review');
  for(const [index,uid] of [...teamItems.cards,teamItems.hero,teamItems.rune,teamItems.rune2].entries()){
    const item=instance(uid);if(!item)continue;
    const button=confirmButton('',()=>modal(itemDetail(item)));
    button.append(itemArt(item),element('strong',itemName(item)),element('small',`${index<teamItems.cards.length?'第 '+(index+1)+' 張':item.kind==='hero'?'英雄':'符文'}・Lv.${item.level}・效果 ${item.effect??1}`));grid.append(button);
  }
  modal(title,grid);
}
function lineupSignature(){return JSON.stringify([activeTeam,...[...teamItems.cards,teamItems.hero,teamItems.rune,teamItems.rune2].map(uid=>{const item=instance(uid);return item?[item.uid,item.level,item.effect??1,item.breakthrough??0]:null;})]);}
function canResumeCampaign(){return state?.phase==='deploy'&&!state.daily&&state.stage===stageIndex&&state.lineupSignature===lineupSignature();}
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
function heroDetails(hero){
 const ownedItems=inventory.items.filter(item=>item.kind==='hero'&&item.id===hero.id),current=ownedItems[0];
 const level=element('select'),skill=element('select');level.setAttribute('aria-label','英雄預覽等級');skill.setAttribute('aria-label','英雄預覽技能');
 for(let n=1;n<=50;n++){const option=element('option',`Lv.${n}`);option.value=n;level.append(option);}
 for(let n=1;n<=10;n++){const option=element('option',`技能 Lv.${n}`);option.value=n;skill.append(option);}
 level.value=current?.level??1;skill.value=current?.effect??1;
 const controls=element('div','','controls');controls.append(level,skill);
 const stats=element('p'),detail=element('p');
 const update=()=>{const n=Number(level.value);stats.textContent=`生命 ${heroHealth(n)}・出戰上限 ${heroCapacity(n)} 張・持有 ${ownedItems.length} 份`;detail.textContent=heroSkillProfile(hero.id,Number(skill.value)).detail;};level.onchange=skill.onchange=update;update();
 const layout=element('div','','hero-catalog-inspector'),copy=element('div');copy.append(element('h2',`${hero.name}・${rarity(hero.id)}`),element('strong',hero.skill),controls,stats,detail,element('p','Lv.10／20／35 以同名英雄突破，消耗依序為 1／2／3 份。'),element('small','這是圖鑑預覽，不影響實際英雄。'));
 if(!ownedItems.length)copy.append(element('p','從英雄扭蛋或英雄首通獎勵取得。'));
 layout.append(artwork(hero.id,'hero'),copy);modal(layout);
}
const rankIndex=id=>rarityNames.indexOf(rarity(id));
const materialXP=item=>materials[item.id]?.xp??[40,50,65,80,100,125,150,200][rankIndex(item.id)]??50;
function orderList(items,key,comparators){
  const order=listSort[key]??{key:'tier',asc:false};
  return items.sort((a,b)=>(order.asc?1:-1)*(comparators[order.key]??comparators.tier)(a,b));
}
function listToolbar(key,fields,refresh) {
  const order=listSort[key]??{key:'tier',asc:false};
  const bar=element('div','','collectible-sort');
  const select=element('select');select.setAttribute('aria-label','排序方式');
  for(const [id,label] of Object.entries(fields)){
    const option=element('option',label);option.value=id;select.append(option);
  }
  select.value=Object.hasOwn(fields,order.key)?order.key:'tier';
  const direction=confirmButton('',()=>{order.asc=!order.asc;change();});
  function update(){
    direction.textContent=order.asc?'↑':'↓';
    direction.setAttribute('aria-label',select.selectedOptions[0].textContent+(order.asc?'由低到高':'由高到低'));
  }
  function change(){order.key=select.value;listSort[key]=order;update();save();refresh();}
  select.onchange=change;update();bar.append(select,direction);return bar;
}
function catalogSort(kind,ids,type){
  return orderList(ids,'codex-'+kind,{
    tier:(a,b)=>rankIndex(a)-rankIndex(b),
    name:(a,b)=>collectibleName(kind,a).localeCompare(collectibleName(kind,b),'zh-Hant'),
    type:(a,b)=>type(a).localeCompare(type(b),'zh-Hant'),
  });
}
function mountCatalogSort(section,kind,refresh){
  const bar=get(section).querySelector('.codex-filters');
  if(bar&&!bar.querySelector('.collectible-sort'))bar.append(listToolbar('codex-'+kind,{tier:'品階',name:'名稱',type:'類型'},refresh));
}
function showHeroes() {
  view('hero-book');
  codexTabs('hero-book','hero');
  const tier=get('hero-rarity').value, status=get('hero-owned').value, query=get('hero-search').value.trim();
  mountCatalogSort('hero-book','hero',showHeroes);
  const filtered=heroes.filter(hero=>hero.name.includes(query)&&(tier==='all'||rarity(hero.id)===tier)&&
    (status==='all'||ownedHeroes().includes(hero.id)===(status==='owned')));
  const byId=new Map(filtered.map(hero=>[hero.id,hero]));
  const entries=catalogSort('hero',[...byId.keys()],id=>byId.get(id).effect).map(id=>{
    const hero=byId.get(id);
    const button=confirmButton('',()=>heroDetails(hero));
    button.append(artwork(hero.id,'hero'),element('strong',`${hero.name}・${rarity(hero.id)}`),
      element('span',ownedHeroes().includes(hero.id)?'已收錄':'未收錄'));
    return button;
  });
  paginateCodex('hero-book','hero-book-grid',entries,'hero');
}
const codexPosition={};
function paginateCodex(section,hostId,entries,kind){
  const host=get(hostId);host.classList.add('codex-spread');
  const page=get(section),signature=[...page.querySelectorAll('.codex-filters input,.codex-filters select')].map(e=>e.value).join('|');
  const old=codexPosition[kind];
  const count=Math.max(1,Math.ceil(entries.length/12));
  const index=old?.signature===signature?Math.min(old.index,count-1):0;
  codexPosition[kind]={signature,index};
  const draw=()=>{
    const current=codexPosition[kind].index;
    const leaves=Array.from({length:2},(_,side)=>{
      const leaf=element('article','','album-leaf');
      const heading=element('header');heading.append(element('small',kind==='hero'?'英雄圖鑑':'符文圖鑑'),element('small',String(current*2+side+1)));
      const grid=element('div','','album-grid');
      const items=entries.slice(current*12+side*6,current*12+side*6+6);
      for(const item of items){const slot=element('div','','album-slot');slot.append(item);grid.append(slot);}
      for(let i=items.length;i<6;i++)grid.append(element('div','','album-slot-placeholder'));
      leaf.append(heading,grid);return leaf;
    });
    host.replaceChildren(...leaves);
    previous.disabled=current===0;next.disabled=current===count-1;
    position.textContent=`第 ${current+1} / ${count} 組雙頁・${entries.length} 項`;
  };
  let controls=page.querySelector('.codex-pagination');
  if(!controls){controls=element('nav','','codex-pagination');host.after(controls);}
  const previous=confirmButton('‹ 上一頁',()=>{codexPosition[kind].index--;draw();flipBook(host,-1);});
  const next=confirmButton('下一頁 ›',()=>{codexPosition[kind].index++;draw();flipBook(host,1);});
  const position=element('span');position.setAttribute('aria-live','polite');controls.replaceChildren(previous,position,next);draw();
}
function flipBook(book,direction){
  if(!lowMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)book.animate([{transform:`perspective(900px) rotateY(${direction*7}deg)`,opacity:.7},{transform:'perspective(900px) rotateY(0deg)',opacity:1}],{duration:200,easing:'ease-out'});
}
function runeImage(id) {
  return artwork(id==='none'?'empty':id,'rune','rune-image');
}
function runeBadge(id, status, icon=id) {
  const badge=element('span','','rune-badge');
  badge.append(runeImage(icon),element('span',status));
  return badge;
}
function runeDetails(id,second=false){
 const battleVisible=!get('battle').hidden,item=battleVisible?(second?state.rune2:{id:state.rune,level:state.runeLevel,effect:state.runeEffect}):instance(second?teamItems.rune2:teamItems.rune),level=item?.id===id?item.level:1,effect=item?.id===id?item.effect??1:1;
 const panel=element('div','','rune-detail');panel.append(runeImage(id),element('h2',runes[id].name),element('p',runeDescription(id,level,effect)),element('p',id==='none'?'未裝備':`經驗 Lv.${level}/5・能力 Lv.${effect}/10`));modal(panel);
}
function showRunes(from) {
  runeReturn=from;
  view('rune-book');
  codexTabs('rune-book','rune');
  renderRuneBook();
}
function renderRuneBook() {
  const available=unlockedRunes(cleared,wallet);
  const groups=Object.fromEntries(Object.entries(runes).filter(([id])=>id!=='none').map(([id,rune])=>[id,rune.group]));
  const filter=get('rune-filter').value;
  const tier=get('rune-rarity').value;
  const query=get('rune-search').value.trim();
  const status=get('rune-owned').value;
  const ids=Object.keys(groups).filter(id=>(status==='all'||available.includes(id)===(status==='owned'))&&(filter==='all'||groups[id]===filter)&&(tier==='all'||rarity(id)===tier)&&`${runes[id].name} ${runes[id].effect}`.includes(query));
  get('rune-count').textContent=`已收錄 ${available.length} / ${Object.keys(groups).length} 枚・目前顯示 ${ids.length} 枚`;
  mountCatalogSort('rune-book','rune',renderRuneBook);
  const entries=catalogSort('rune',ids,id=>groups[id]).map(id=>{
    const button=element('button','','rune-entry');
    const ownedRune=available.includes(id);
    button.append(runeImage(id),element('strong',`${runes[id].name}・${rarity(id)}`),element('span',ownedRune?'已收錄':runes[id].source));
    button.onclick=()=>runeDetails(id);
    return button;
  });
  paginateCodex('rune-book','rune-book-grid',entries,'rune');
}
function renderRuneSlots() {
  get('rune-slots').replaceChildren(...[teamItems.rune,teamItems.rune2].map((uid,index)=>{
    const item=instance(uid);
    const button=confirmButton('',()=>openTeamEditor('lobby',item,'rune',index));
    button.append(runeBadge(item?.id??'none',`符文 ${index+1}・${item?runes[item.id].name:'未裝備'}`));return button;
  }));
}

function cardFace(card, {lazy=false}={}) {
  const face=element('span','','card-face');
  const art=artwork(card.artId??card.id,'card','face-art');
  face.dataset.tier=rarity(card.sourceId??card.id);
  if(lazy) art.loading='lazy';
  const frame=element('img','','face-frame');
  frame.src=asset(`rank-${rarity(card.sourceId??card.id)}`);
  frame.alt='';
  const stats=element('span','','face-stats');
  stats.append(element('span',`攻 ${card.attack}`),element('span',`血 ${card.hp}`));
  face.append(art,frame,element('strong',card.name,'face-name'),
    element('span',card.count?`倒數 ${card.count}`:'就緒','face-count'),stats);
  face.append(element('span',`Lv.${card.level??1}`,'face-level'));
  face.append(element('span',rarity(card.sourceId??card.id),'face-rarity'));
  if(card.shield) face.append(element('span',`盾 ${card.shield}`,'face-shield'));
  const statusText=[card.burn?.turns?'燃 '+card.burn.turns:'',card.poison?.turns?'毒 '+card.poison.stacks:'',card.stun?'凍結':'',card.silence?'沉默':'',card.summonKind==='egg'?'孵化 '+card.incubate:'',card.summonKind&&card.summonKind!=='egg'?'召喚物':''].filter(Boolean).join('・');
  if(statusText)face.append(element('span',statusText,'face-states'));
  return face;
}
function catalogCard(id,level=firstInstance('card',id)?.level??1,effect=1) {
 const [name,,, ,skill]=cards[id],stats=cardStats(id,level,effect);return {id,name,...stats,hp:stats.max,level,effect,skill};
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
  info.append(element('h2',card.name),element('strong',(card.skill||'普攻')+'・效果 Lv.'+(card.effect??1)),
    element('p',card.summonKind?`繼承等級 Lv.${card.level}・攻擊 ${card.attack}・生命 ${card.hp}/${card.max}。${card.summonKind==='egg'?'距重生 '+card.incubate+' 次己方回合開始；卵被擊破即無法重生。':'召喚物不能再次接替或復活。'}`:cardDescription(card.id,card.level,card.effect)),
    element('p',`生命 ${card.hp}/${card.max}・護盾 ${card.shield}・倒數 ${card.count}`,'inspector-stats'));
  layout.append(cardFace(card),info);
  modal(layout);
}
function encyclopediaCard(id) {
  const base=catalogCard(id,1),bonus=cardBonus(base.level),levels=[1,5,...limits];let previewIndex=0;
  const art=element('div','','encyclopedia-preview'),info=element('div'),signature=element('p'),layout=element('div','','card-inspector');
  const label=element('strong','Lv.1');label.setAttribute('aria-live','polite');
  const previous=confirmButton('‹',()=>{previewIndex--;preview();}),next=confirmButton('›',()=>{previewIndex++;preview();});
  previous.setAttribute('aria-label','預覽較低等級');next.setAttribute('aria-label','預覽較高等級');
  const stepper=element('div','','level-preview-stepper');stepper.append(previous,label,next);
  function preview(){
    const level=levels[previewIndex],card=catalogCard(id,level,1);
    art.replaceChildren(cardFace(card));signature.textContent=cardDescription(id,level,1);label.textContent='Lv.'+level;
    previous.disabled=previewIndex===0;next.disabled=previewIndex===levels.length-1;
  }
  const stage=stages.find(x=>x.reward===id),special=exclusiveInfo[id];
  info.append(element('h2',`${base.name}・${rarity(id)}${special?'・'+special.code:''}`),stepper,element('p',base.skill||'普攻'),signature,
    element('p',special?`${special.category}系列 ${special.code}・${special.inspiration}・僅限碎片兌換 ${special.cost.toLocaleString()} 碎片`:starter.includes(id)?'初始卡牌':stage?`首通「${stage.name}」取得`:'扭蛋取得'),element('small','預設顯示 Lv.1，點箭頭才切換預覽。'));
  if(special)info.append(confirmButton('前往碎片兌換',()=>openRecycle('exchange',special.group)));
  layout.append(art,info);preview();modal(layout);
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
  const featured=heroes.find(item=>item.id===featuredHeroId())??hero;
  get('camp-profile-art').src=asset(`hero-portrait-${featured.id}`);
  get('camp-progress').textContent=featured.name;
  showHomeHero(featured);
  get('camp-campaign').classList.toggle('town-available',Object.entries(vaults).some(([id,vault])=>dailyStatus(daily,id).used<vault.limit));
  get('camp-deck').title='出戰編隊 '+(activeTeam+1);
  townRead??={bag:inventory.next,collection:new Set(inventory.items.filter(item=>item.kind!=='material').map(item=>item.id)).size};
  get('town-team').textContent=String(activeTeam+1);
  get('camp-bag').classList.toggle('town-unread',inventory.next>townRead.bag);
  get('camp-collection').classList.toggle('town-unread',new Set(inventory.items.filter(item=>item.kind!=='material').map(item=>item.id)).size>townRead.collection);
  renderWallet(get('camp-wallet'));
  if(saved?.combatMigrationNotice){saved.combatMigrationNotice=false;save();notify('戰鬥規則已更新：養成與主線進度保留；金幣等比換算，秘境保留舊通關紀錄並開啟新版樓層認證。');}
  if(heroMigrationPending&&save()){heroMigrationPending=false;notify('英雄養成已更新：原有等級對應至新階段，出戰卡數與培養進度已保留。');}
}
const pickHomeDialogue=createDialoguePicker();
let dialogueTimer,dialogueCooldown=0;
function hideHomeDialogue(){
  clearTimeout(dialogueTimer);
  get('home-dialogue').hidden=true;
}
function showHomeHero(hero){
  hideHomeDialogue();
  const button=get('camp-featured-button'), image=get('camp-featured');
  button.dataset.hero=hero.id;
  button.setAttribute('aria-label','與'+hero.name+'對話');
  image.src=asset('hero-home-'+hero.id);
  image.alt=hero.name;
  button.onclick=()=>{
    if(get('camp').hidden||performance.now()<dialogueCooldown)return;
    dialogueCooldown=performance.now()+500;
    const actor=get('camp-hero-motion');
    if(!lowMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)actor.animate([{scale:'1'},{scale:'1.035',offset:.4},{scale:'1'}],{duration:420,easing:'ease-out'});
    get('home-dialogue-name').textContent=hero.name;
    get('home-dialogue-text').textContent=pickHomeDialogue(hero.id);
    get('home-dialogue').hidden=false;
    clearTimeout(dialogueTimer);
    dialogueTimer=setTimeout(hideHomeDialogue,5500);
  };
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)hideHomeDialogue();
});
// Prevent image dragging, selection and long-press menus without blocking forms or scrolling.
document.addEventListener('dragstart',event=>{if(event.target.closest('img'))event.preventDefault();});
document.addEventListener('contextmenu',event=>{if(!event.target.closest('input,textarea,select'))event.preventDefault();});
let drawing=false, revealTimer, revealRun=0;
const summonTypes={card:'卡牌',rune:'符文',hero:'英雄'};
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
 return materials[id]?.name??(kind==='hero'?heroes.find(hero=>hero.id===id).name:kind==='rune'?runes[id].name:cards[id][0]);
}
function renderCapsule(){
 const {kind,currency}=capsuleOptions(), pool=poolFor(kind,currency);
 renderWallet(get('capsule-wallet'));
 get('capsule-title').textContent=summonTypes[kind]+'召喚';
 get('capsule').dataset.currency=currency;get('capsule').dataset.type=kind;
 get('capsule').style.setProperty('--machine-scene', 'url('+asset('machine-'+currency+'-'+kind)+')');

 for(const button of document.querySelectorAll('[data-summon-type]'))button.setAttribute('aria-pressed',String(button.dataset.summonType===kind));
 for(const [id,count] of [['draw-gems',1],['draw-ten',10]]){
   const price=pullPrice(currency,count), button=get(id);
   button.textContent=(count===1?'單抽':'十連九折')+'・'+price+(currency==='gold'?' 金幣':' 鑽石');
   button.disabled=drawing||wallet[currency]<price||!pool.length;
 }
 const total=pool.reduce((sum,item)=>sum+item.weight,0);
 const tiers=rarityNames.filter(tier=>pool.some(item=>rarity(item.id)===tier));
 const list=element('details');
 list.append(element('summary','單項抽取機率'));
 const rows=element('div');
 const poolKey='pool-'+kind;
 const refill=()=>rows.replaceChildren(...orderList([...pool],poolKey,{
   tier:(a,b)=>rankIndex(a.id)-rankIndex(b.id),
   name:(a,b)=>collectibleName(kind,a.id).localeCompare(collectibleName(kind,b.id),'zh-Hant'),
   chance:(a,b)=>a.weight-b.weight,
   type:(a,b)=>Number(Boolean(materials[a.id]))-Number(Boolean(materials[b.id])),
 }).map(item=>element('p',collectibleName(kind,item.id)+'・'+rarity(item.id)+'・'+(item.weight*100/total).toFixed(2)+'%')));
 refill();list.append(listToolbar(poolKey,{tier:'品階',name:'名稱',type:'類型',chance:'機率'},refill),rows);
 get('capsule-rules').replaceChildren(element('strong',`至多 ${pityRemaining(wallet,kind,currency)} 抽必得 ${rarityNames[pityTier(kind,currency)]} 以上`),confirmButton('卡池說明',()=>modal(
   element('h2',get('capsule-title').textContent),element('p','最高 '+tiers.at(-1)),element('p',`每 ${pityRemaining(wallet,kind,currency)} 抽內至少取得 ${rarityNames[pityTier(kind,currency)]} 以上的${summonTypes[kind]}。單抽與十連共用進度；取得保底品階以上即重置。六種卡池獨立計算，素材不計入保底。`),
   element('p',tiers.map(tier=>tier+' '+(pool.filter(item=>rarity(item.id)===tier).reduce((sum,item)=>sum+item.weight,0)*100/total).toFixed(2)+'%').join('・')),
   ...(kind==='card'?[element('p','同品階個別權重：經驗之書 50%，秘技之書 25%（以普通卡為基準）。')]:[]),list)));
 get('capsule-reveal').replaceChildren(...(validBatch(lastBatch)?[confirmButton('查看上次召喚',()=>showBatch(false))]:[]));
}
function validBatch(batch){
 return batch&&Object.hasOwn(summonTypes,batch.kind)&&['gold','gems'].includes(batch.currency)&&Array.isArray(batch.draws)&&
  [1,10].includes(batch.draws.length)&&batch.draws.every(draw=>draw&&poolFor(batch.kind,batch.currency).some(item=>item.id===draw.id))&&
  Array.isArray(batch.open)&&batch.open.every(index=>Number.isInteger(index)&&index>=0&&index<batch.draws.length);
}
function drawCapsule(count){
 if(drawing)return;
 if(inventory.items.length+count>5000){notify('背包空間不足，請先分解或使用素材（上限 5,000 份）。');return;}
 const {kind,currency}=capsuleOptions();
 const known=kind==='hero'?ownedHeroes():kind==='rune'?unlockedRunes(cleared,wallet): [...owned(),...inventory.items.filter(item=>item.kind==='material').map(item=>item.id)];
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
const sealArt=kind=>asset(kind==='card'?'album-card-back':kind==='rune'?'nav-rune-book':'nav-heroes');
const rewardArtwork=(kind,id)=>materials[id]?artwork(materials[id].kind?'tech':'xp','material'):kind==='card'?cardFace(catalogCard(id,1)):kind==='hero'?artwork(id,'hero'):runeImage(id);
function showBatch(intro){
 if(!validBatch(lastBatch))return;
 const dialog=get('capsule-show'),{kind,currency,draws}=lastBatch;
 dialog.dataset.kind=kind;dialog.dataset.currency=currency;dialog.style.setProperty('--machine-scene','url('+asset('machine-'+currency+'-'+kind)+')');dialog.dataset.motion=reducedReveal()?'off':'on';
 get('capsule-show-title').textContent=(currency==='gold'?'金幣':'鑽石')+'・'+summonTypes[kind]+'召喚';
 if(!dialog.open)dialog.showModal();
 if(!intro){renderBatch();return;}
 drawing=true;renderCapsule();
 const body=get('capsule-show-body');
 const introScene=element('div','','summon-intro-scene');
 introScene.dataset.count=String(draws.length);
 const rail=element('div','','summon-delivery');
 for(let i=0;i<draws.length;i++){
   const slot=element('span','','summon-delivery-slot');
   const seal=element('img');seal.src=sealArt(kind);seal.alt='';
   slot.style.setProperty('--delay',`${360+i*96}ms`);
   slot.style.setProperty('--route-x',`${-35-(i%5)*15}px`);
   slot.style.setProperty('--route-y',i>=5?'-45px':'20px');
   slot.append(seal);rail.append(slot);
 }
 introScene.append(rail,element('strong',draws.length===10?'十連召喚':'單次召喚'));
 body.replaceChildren(introScene);
 get('draw-open-all').hidden=true;get('capsule-show-close').textContent='跳過';
 void unlock().then(()=>{
   if(!drawing)return;
   play('crank');play('summon-'+currency);
   setTimeout(()=>{if(drawing)play('draw-'+kind);},420);
 });
 revealTimer=setTimeout(()=>draws.length===1?revealOne(0):renderBatch(),reducedReveal()?50:draws.length===10?2170:1150);
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
   tile.dataset.index=String(index);tile.dataset.rank=tier;tile.dataset.shown=String(shown);
   const face=element('span','','draw-face');
   if(shown){
     face.append(rewardArtwork(kind,draw.id));
     tile.append(face,element('strong',collectibleName(kind,draw.id)),element('small',tier+'・'+(draw.duplicate?'已入包':'首次取得')));
   }
   else {
     const seal=element('img');seal.src=sealArt(kind);seal.alt='';
     face.append(seal);tile.append(face);tile.setAttribute('aria-label','揭曉第 '+(index+1)+' 份獎品');
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
 if(materials[draw.id])body.append(element('p',materials[draw.id].kind?'效果強化素材':('經驗 +'+materials[draw.id].xp)));
 else if(kind==='card')body.append(element('p',cards[draw.id][4]||'普通攻擊'));
 get('draw-open-all').hidden=true;get('capsule-show-close').textContent='回結果';
}
function revealOne(index){
 if(lastBatch.open.includes(index))return;
 lastBatch.open.push(index);save();renderBatch();
 const draw=lastBatch.draws[index], tier=rarity(draw.id);
 const tile=get('capsule-show-body').querySelector('[data-index="'+index+'"]');
 if(!reducedReveal()){
   tile.classList.add('draw-opened');

   if(rarityNames.indexOf(tier)>=5){
     const focus=element('div','','summon-spotlight');
     focus.dataset.rank=tier;
     const face=element('span','','draw-face');face.append(rewardArtwork(lastBatch.kind,draw.id));focus.append(face);
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
  if(!page.querySelector('.codex-filters')){
    const controls=[...page.querySelectorAll(':scope > label.catalog-filter,:scope > label:has(#hero-rarity),:scope > label:has(#hero-owned),:scope > label:has(#album-filter)')];
    if(controls.length){
      const bar=element('div','','codex-filters');controls[0].before(bar);bar.append(...controls);
    }
  }
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
const albumWide=matchMedia('(orientation: landscape)');
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
  const status=get('card-owned').value;
  const filtered=albumCards.filter(id=>(status==='all'||collection.has(id)===(status==='owned'))&&(filter==='all'||cardGroup(id)===filter||exclusiveInfo[id]?.group===filter)&&(tier==='all'||rarity(id)===tier)&&`${cards[id][0]} ${cards[id][4]} ${exclusiveInfo[id]?.code??''} ${exclusiveInfo[id]?.category??''} ${exclusiveInfo[id]?.inspiration??''}`.includes(query));
  mountCatalogSort('collection','card',()=>{albumPage=0;renderCollection();});
  catalogSort('card',filtered,cardGroup);
  const pages=Math.max(1,Math.ceil(filtered.length/perLeaf));
  albumPage=Math.min(albumPage,pages-1);
  const spread=albumWide.matches?2:1;
  const first=albumPage-albumPage%spread;
  const end=Math.min(pages,first+spread);
  const book=get('album-pages');
  book.replaceChildren(...Array.from({length:2},(_,i)=>makeAlbumLeaf(first+i,collection,filtered)));
  if(!filtered.length) book.querySelector('.album-leaf').append(element('p','沒有符合搜尋條件的卡片。'));
  book.classList.remove('single-leaf');
  get('collection-count').textContent=`已收錄 ${collection.size} / ${albumCards.length} 張・目前顯示 ${filtered.length} 張`;
  get('album-position').textContent=`第 ${first+1===end?end:`${first+1}–${end}`} / ${pages} 頁`;
  get('album-prev').disabled=first===0;
  get('album-next').disabled=end===pages;
  if(direction && !lowMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    flipBook(book,direction);
  }
}
get('card-owned').onchange=get('card-filter').onchange=()=>{albumPage=0;renderCollection();};
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
  get('campaign-fight').textContent=canResumeCampaign()?'繼續戰鬥':'開始戰鬥';
  teamSelect('campaign-team',showCampaign);
  get('campaign-review').textContent=`編隊 ${activeTeam+1}・${heroes.find(h=>h.id===chosen).name}`;
  const chapter=chapterFor(stageIndex);
  get('campaign-chapter').textContent=chapterNames[chapter];
  const chapterSelect=element('select');
  chapterSelect.setAttribute('aria-label','選擇章節');
  for(const [index,label] of chapterNames.entries()){
    const open=index===0||cleared.has(index*4-1);
    const option=element('option',label+(open?'':'・未解鎖'));
    option.value=String(index);option.disabled=!open;chapterSelect.append(option);
  }
  chapterSelect.value=String(chapter);
  chapterSelect.onchange=()=>{stageIndex=Number(chapterSelect.value)*4;showCampaign();};
  const previous=confirmButton('‹',()=>{stageIndex=(chapter-1)*4;showCampaign();});
  previous.setAttribute('aria-label','上一章');previous.disabled=chapter===0;
  const next=confirmButton('›',()=>{stageIndex=(chapter+1)*4;showCampaign();});
  next.setAttribute('aria-label','下一章');next.disabled=chapter===chapterNames.length-1||!cleared.has((chapter+1)*4-1);
  get('chapter-picker').replaceChildren(previous,chapterSelect,next);
  get('stages').dataset.chapter=String(chapter);
  get('stages').style.backgroundImage=`url("${asset('chapter-map-'+String(chapter+1).padStart(2,'0'))}")`;
  get('stages').setAttribute('aria-label',chapterNames[chapter]+'・章節地圖');
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
  get('stage-detail').textContent=`牌組 ${stage.opponents.length} 張（含開局守軍）。敵軍 Lv.${stage.enemyLevel??1}・技能 Lv.${stage.enemyEffect??1}。${stage.goal} 首通取得：${cards[stage.reward][0]}。出戰：${heroes.find(hero=>hero.id===chosen).name}・${runes[loadout].name}`;
  const preview=(label,id,level=1,effect=1)=>{
    const figure=element('figure');
    const card=catalogCard(id,level,effect);
    const inspect=confirmButton('',()=>cardDetail(card));inspect.append(cardFace(card));
    inspect.setAttribute('aria-label','查看'+card.name);
    figure.append(inspect,element('figcaption',label));
    return figure;
  };
  get('stage-preview').replaceChildren(
    ...stage.opening.map(id=>preview('敵方先鋒',id,stage.enemyLevel??1,stage.enemyEffect??1)),
    preview(cleared.has(stageIndex)?'首通已領取':'首通獎勵',stage.reward),
    confirmButton('查看敵方配置',()=>encounterDetails(stage))
  );
}
function encounterDetails(stage){
 const hero=heroes.find(h=>h.id===stage.hero),grid=element('div','','encounter-roster');
 for(const id of stage.opponents){const card=catalogCard(id,stage.enemyLevel,stage.enemyEffect),button=confirmButton('',()=>cardDetail(card));button.append(cardFace(card));grid.append(button);}
 const content=[element('h2',stage.name+'・敵方配置'),element('p',`${hero.name} Lv.${stage.heroLevel}・生命 ${stage.hp}・技能 Lv.${stage.enemyEffect}。牌組 ${stage.opponents.length} 張，開局守軍已包含在內；每次出牌順序隨機。`),element('p',heroSkillProfile(hero.id,stage.enemyEffect).detail),grid];
 for(const id of stage.runes??[])content.push(element('h3',runes[id].name+` Lv.${stage.runeLevel}／能力 Lv.${stage.enemyEffect}`),element('p',runeDescription(id,stage.runeLevel,stage.enemyEffect)));
 modal(...content);
}
function showHeroPreview() {
  const hero=heroes.find(h=>h.id===chosen);
  get('hero-preview-art').src=asset(`hero-portrait-${hero.id}`);
  get('hero-cut-in-art').src=asset(`hero-cast-${hero.id}`);
  get('hero-preview-art').alt=`${hero.name}的出戰立繪`;
  get('hero-preview-name').textContent=hero.name;
  get('hero-preview-skill').textContent=hero.skill;
  get('hero-detail').textContent=heroSkillProfile(hero.id,instance(teamItems.hero)?.effect??1).detail;
}
let bagKind='card';
const bagPages={};
const bagNames={card:'卡片背包',hero:'英雄背包',rune:'符文背包',material:'強化素材'};
const kindNames={card:'卡片',hero:'英雄',rune:'符文'};
function itemName(item){return materials[item.id]?.name??collectibleName(item.kind,item.id);}
function itemSearch(item){return `${itemName(item)} ${exclusiveInfo[item.id]?.code??''} ${exclusiveInfo[item.id]?.category??''} ${exclusiveInfo[item.id]?.inspiration??''}`;}
function itemArt(item) {
  if(item.kind==='material')return artwork(materials[item.id].kind?'tech':'xp','material');
  if(item.kind!=='card')return item.kind==='hero'?artwork(item.id,'hero'):runeImage(item.id);
  const piece=element('span','','inventory-card-art');
  const frame=element('img','','inventory-card-frame');
  frame.src=asset(`rank-${rarity(item.id)}`);frame.alt='';
  piece.dataset.tier=rarity(item.id);piece.append(artwork(item.id,'card','inventory-illustration'),frame);
  return piece;
}
function teamsUsing(uid) {
  return teams.flatMap((team,index)=>[...team.items.cards,team.items.hero,team.items.rune,team.items.rune2].includes(uid)?[index+1]:[]);
}
function effectGrowth(item){if(item.kind==='rune')return runeAdvancement(item.id,item.level,item.effect??1);if(item.kind==='hero')return heroSkillProfile(item.id,Math.min(10,(item.effect??1)+1)).detail;return cardDescription(item.id,item.level,Math.min(10,(item.effect??1)+1));}
function itemStats(item){
 if(item.kind==='card'){const c=catalogCard(item.id,item.level,item.effect??1);return [['攻擊',c.attack],['生命',c.max],['倒數',c.count],['部署護盾',c.shield],['技能',cardDescription(item.id,item.level,item.effect??1)]];}
 if(item.kind==='hero')return [['起始生命',heroHealth(item.level)],['出戰卡牌上限',heroCapacity(item.level)]];
 const r=runeProfile(item.id,item.level,item.effect??1);return [['冷卻',r.cooldown+' 回合'],['目標上限',r.targets],['發動次數',r.limit?r.limit+' 次':'符合條件可再次發動'],['完整效果',runeDescription(item.id,item.level,item.effect??1)]];
}
function itemDetail(item,allowUpgrade=false) {
  const layout=element('div','','instance-inspector'), copy=element('div');
  layout.append(itemArt(item),copy);
  copy.append(element('h2',itemName(item)));
  if(exclusiveInfo[item.id])copy.append(element('strong',exclusiveInfo[item.id].code+'・'+exclusiveInfo[item.id].category+'・'+exclusiveInfo[item.id].inspiration+'・碎片限定'));
  if(item.kind==='material'){
    const book=materials[item.id];
    copy.append(element('p',book.kind?'對應類別的效果強化素材':'經驗 +'+book.xp));return layout;
  }
  const cap=levelLimit(item), effect=item.effect??1;
  copy.append(element('p',rarity(item.id)+'・Lv.'+item.level+' / '+cap+'・效果 Lv.'+effect+' / 10'));
  copy.append(element('p',item.level===cap?'已達目前上限':'經驗 '+item.experience+' / '+xpNeeded(item.level,item)));
  const stats=element('dl','','instance-stats');
  for(const [label,value] of itemStats(item))stats.append(element('dt',label),element('dd',String(value)));
  if(item.kind!=='hero')copy.append(stats);
  if(item.kind==='hero'){
    const next=Math.min(50,item.level+1),unlock=nextHeroCapacity(item.level);
    const comparison=element('div','','hero-growth-comparison');
    comparison.append(element('p',`Lv.${item.level} → ${next}：生命 ${heroHealth(item.level)} → ${heroHealth(next)}・卡數上限 ${heroCapacity(item.level)} → ${heroCapacity(next)}`),element('p',unlock?`下次卡數解鎖：Lv.${unlock}，上限 ${heroCapacity(unlock)} 張`:'已解鎖 12 張出戰上限'));
    if(item.reserveExperience)comparison.append(element('p',`已保留舊制經驗 ${item.reserveExperience}，突破後自動補入。`));
    const skillCompare=element('details');skillCompare.append(element('summary',heroes.find(h=>h.id===item.id).skill+'・'+(effect<10?`技能 Lv.${effect} → ${effect+1}`:'技能已滿級 Lv.10')),element('p','目前：'+heroSkillProfile(item.id,effect).detail));
    if(effect<10)skillCompare.append(element('p','升級後：'+heroSkillProfile(item.id,effect+1).detail));
    skillCompare.append(element('small','百分比依實際數值取整數；符合條件且冷卻完成後再次發動，特殊限次能力另行標示。'));comparison.append(skillCompare);
    copy.append(comparison);
  }
  if(!allowUpgrade)return layout;
  if(item.kind==='hero'){
    const featured=featuredHeroId()===item.id;
    const setHome=confirmButton(featured?'目前的首頁英雄':'設為首頁英雄',()=>{
      const previous=displayHero;
      displayHero=item.id;
      if(!save()){displayHero=previous;return;}
      renderInventory();modal(itemDetail(item,true));
      notify(`已設為首頁英雄：${itemName(item)}。返回城鎮即可看到。`);
    });
    setHome.disabled=featured;
    if(featured)copy.append(element('strong','首頁展示中','featured-badge'));
    copy.append(setHome,confirmButton('技能比較',()=>{const detail=layout.querySelector('.hero-growth-comparison details');detail.open=true;const info=layout.querySelector('.hero-info-scroll');if(info)info.scrollTop+=detail.getBoundingClientRect().top-info.getBoundingClientRect().top;}));
  }
  if(item.level<cap){
    const cost=levelCost(item.level);
    if(item.kind==='card'){
      const gold=confirmButton('花 '+cost+' 金幣・+100 經驗',()=>{
        if(wallet.gold<cost||item.level>=levelLimit(item))return;
        wallet={...wallet,gold:wallet.gold-cost};grantExperience(item,100);finishGrowth(item,`已強化 ${itemName(item)}，目前 Lv.${item.level}。`);
      });
      gold.disabled=wallet.gold<cost;copy.append(gold);
    }
    copy.append(confirmButton('經驗強化',()=>chooseMaterial(item,'xp')));
  }
  if(['card','hero'].includes(item.kind)&&item.level===cap&&cap<(item.kind==='hero'?50:99)){const steps=item.kind==='hero'?heroLimits:limits;copy.append(confirmButton('突破至 Lv.'+steps[(item.breakthrough??0)+1]+'・同名 × '+((item.breakthrough??0)+1),()=>chooseMaterial(item,'break')));}
  if(effect<effectsMax)copy.append(confirmButton('效果強化',()=>chooseMaterial(item,'effect')));
  copy.append(confirmButton(item.locked?'解除素材鎖定':'鎖定個體',()=>{
    const previous=item.locked;item.locked=!previous;
    if(!save()){item.locked=previous;return;}
    renderInventory();modal(itemDetail(item,true));notify(item.locked?'已鎖定，這個個體不能用作素材。':'已解除素材鎖定。');
  }),
    confirmButton('前往編隊',()=>openTeamEditor('inventory-page',item)));
  if(item.kind==='hero'){
    layout.classList.add('hero-instance-inspector');
    const info=element('div','','hero-info-scroll'),actions=element('div','','hero-instance-actions');
    for(const child of [...copy.children])(child.tagName==='BUTTON'?actions:info).append(child);
    copy.replaceChildren(info,actions);
  }
  return layout;
}
function finishGrowth(item,message){
  if(!save())return;
  renderInventory();modal(itemDetail(item,true));notify(message);void unlock().then(()=>play('upgrade'));
}
function chooseMaterial(target,mode) {
  const required=mode==='break'?(target.breakthrough??0)+1:null;
  const powerOf=effectPoints;
  const safe=item=>item.uid!==target.uid&&!item.locked&&!teamsUsing(item.uid).length&&(item.kind==='material'||item.level===1&&!item.experience&&(item.effect??1)===1);
  const matches=item=>mode==='xp'?item.kind===target.kind||item.kind==='material'&&!materials[item.id]?.kind:
    item.kind===target.kind&&item.id===target.id||mode==='effect'&&materials[item.id]?.kind===target.kind;
  const candidates=inventory.items.filter(item=>safe(item)&&matches(item));
  const xpOf=materialXP;
  const available=()=>mode==='xp'?target.level<levelLimit(target):mode==='effect'?(target.effect??1)<effectsMax:target.level===levelLimit(target)&&levelLimit(target)<(target.kind==='hero'?50:99);
  const enough=count=>count>0&&(required===null||count===required);
  const selected=new Set(), preview=element('p'), title={xp:'經驗強化',break:'同名突破',effect:'效果強化'}[mode];
  const apply=confirmButton('確定強化',()=>{
    const chosen=[...selected].map(instance);
    if(!available()||!enough(chosen.length)||chosen.some(item=>!item||!safe(item)||!matches(item)))return;
    const goldCost=mode==='xp'?Math.ceil(chosen.reduce((n,i)=>n+xpOf(i),0)/10):mode==='effect'?chosen.reduce((n,i)=>n+powerOf(i),0)*40:0;
    if(wallet.gold<goldCost){notify('金幣不足。');return;}
    if(mode==='xp'&&!grantExperience(target,chosen.reduce((sum,item)=>sum+xpOf(item),0)))return;
    if(mode==='break'){target.breakthrough=(target.breakthrough??0)+1;if(target.reserveExperience){grantExperience(target,target.reserveExperience);target.reserveExperience=0;}}
    if(mode==='effect')grantEffect(target,chosen.reduce((n,i)=>n+powerOf(i),0));
    wallet={...wallet,gold:wallet.gold-goldCost};
    inventory.items=inventory.items.filter(item=>!selected.has(item.uid));
    for(const item of chosen){
      if(item.kind==='material')continue;
      const key=item.kind==='card'?'copies':item.kind==='hero'?'heroCopies':'runeCopies';
      const record={...wallet[key]};
      const count=inventory.items.filter(entry=>entry.kind===item.kind&&entry.id===item.id).length;
      if(count&&(item.kind!=='card'||walletCardIds.includes(item.id)))record[item.id]=count;else {delete record[item.id];if(!count)consumed.add(item.kind+':'+item.id);}
      wallet={...wallet,[key]:record};
      if(item.kind==='card'&&!count){wallet.unlocked=wallet.unlocked.filter(id=>id!==item.id);wallet.exclusiveUnlocked=(wallet.exclusiveUnlocked??[]).filter(id=>id!==item.id);}
    }
    const summary=mode==='break'?`突破成功，等級上限 Lv.${levelLimit(target)}。`:mode==='effect'?`效果強化完成，目前效果 Lv.${target.effect}。`:`已強化 ${itemName(target)}，目前 Lv.${target.level}。`;
    finishGrowth(target,summary);
  });
  const project=()=>{
    const chosen=[...selected].map(instance).filter(Boolean);
    const xp=chosen.reduce((sum,item)=>sum+xpOf(item),0);
    const result=structuredClone(target);
    if(mode==='xp'&&xp)grantExperience(result,xp);
    if(mode==='effect')grantEffect(result,chosen.reduce((n,i)=>n+powerOf(i),0));
    if(mode==='break'&&enough(chosen.length)){result.breakthrough=(target.breakthrough??0)+1;if(result.reserveExperience){grantExperience(result,result.reserveExperience);result.reserveExperience=0;}}
    return {result,xp};
  };
  const columns=element('div','','growth-preview');
  const counter=element('strong');
  const update=()=>{
    const {result,xp}=project();
    counter.textContent=`已選 ${selected.size}${required===null?'':' / '+required} 張`;
    columns.replaceChildren(...[['目前',target],['強化後',result]].map(([label,item])=>{
      const panel=element('section');panel.append(element('strong',label),itemArt(item),
        element('small',`Lv.${item.level} / ${levelLimit(item)}・效果 Lv.${item.effect??1}`));
      for(const [name,value] of itemStats(item).slice(0,2))panel.append(element('small',`${name} ${value}`));
      return panel;
    }));
    preview.textContent=mode==='xp'?`投入 ${xp.toLocaleString('zh-TW')} 經驗・剩餘經驗 ${result.experience}`:
      mode==='effect'?`能力 Lv.${target.effect??1} → ${result.effect}・剩餘培養值 ${result.effectExperience??0} / ${effectNeeded(result)}`:`等級上限 Lv.${levelLimit(target)} → ${levelLimit(result)}`;
    if(mode==='xp'&&selected.size&&result.level===levelLimit(target))preview.textContent+='・上限外經驗不保留';
    const chosen=[...selected].map(instance).filter(Boolean),cost=mode==='xp'?Math.ceil(xp/10):mode==='effect'?chosen.reduce((n,i)=>n+powerOf(i),0)*40:0;
    preview.textContent+='・消耗金幣 '+cost.toLocaleString();
    if(target.kind==='rune')preview.textContent+='。'+runeDescription(target.id,result.level,result.effect??1);
    apply.disabled=!enough(selected.size)||wallet.gold<cost;
  };
  const panel=element('div','','growth-picker');
  const grid=element('div','','team-candidates growth-materials');
  const search=element('input');search.type='search';search.placeholder='搜尋素材';search.setAttribute('aria-label','搜尋素材');
  const rarityFilter=element('select');
  rarityFilter.setAttribute('aria-label','素材品階');
  for(const id of ['all',...rarityNames]){
    const option=element('option',id==='all'?'全部品階':id);option.value=id;rarityFilter.append(option);
  }
  const targetLevel=element('input');targetLevel.type='number';targetLevel.min=target.level+1;targetLevel.max=levelLimit(target);
  targetLevel.value=levelLimit(target);targetLevel.setAttribute('aria-label','目標等級');
  const targetLabel=element('label','目標 Lv. ');targetLabel.append(targetLevel);targetLabel.hidden=mode!=='xp';
  const sortKey='growth-'+mode;
  const visible=()=>orderList(candidates.filter(item=>itemSearch(item).includes(search.value.trim())&&
    (rarityFilter.value==='all'||rarity(item.id)===rarityFilter.value)),sortKey,{...comparisons,value:(a,b)=>xpOf(a)-xpOf(b)});
  function selectMany(items,goal){
    let remaining=0;
    if(mode==='xp'){
      for(let level=target.level;level<goal;level++)remaining+=xpNeeded(level,target);
      remaining-=target.experience+project().xp;
    }else if(mode==='break')remaining=required-selected.size;else {const current=project().result;remaining=0;for(let n=current.effect??1;n<10;n++)remaining+=[1,2,3,5,8,12,18,26,36][n-1];remaining-=current.effectExperience??0;}
    const ordered=[...items].sort((a,b)=>Number(a.kind!=='material')-Number(b.kind!=='material'));
    for(const item of ordered){
      if(remaining<=0)break;
      if(mode==='xp'&&item.kind===target.kind&&item.id===target.id)continue;
      if(selected.has(item.uid))continue;
      selected.add(item.uid);
      remaining-=mode==='xp'?xpOf(item):mode==='effect'?powerOf(item):1;
    }
    fill();update();
  }
  const limitGoal=()=>Math.min(levelLimit(target),Math.max(target.level+1,Math.trunc(Number(targetLevel.value))||levelLimit(target)));
  const actions=element('div','','growth-actions');
  const gradePicker=element('section','','grade-picker');gradePicker.hidden=true;
  gradePicker.setAttribute('aria-label','選擇批次素材品階');
  if(mode==='xp'){
    gradePicker.append(element('strong','選擇要投入的品階（可複選）'));
    const options=element('div','','grade-options');
    for(const tier of rarityNames){
      const count=candidates.filter(item=>rarity(item.id)===tier).length;
      const label=element('label');const box=element('input');box.type='checkbox';box.value=tier;box.checked=count>0&&['N','R'].includes(tier);box.disabled=!count;
      label.append(box,element('span',`${tier} (${count})`));options.append(label);
    }
    const pick=confirmButton('選取這些品階',()=>{
      const tiers=new Set([...options.querySelectorAll('input:checked')].map(input=>input.value));
      selected.clear();
      selectMany(candidates.filter(item=>tiers.has(rarity(item.id))).sort((a,b)=>xpOf(a)-xpOf(b)),limitGoal());
      gradePicker.hidden=true;
    });
    gradePicker.append(options,element('small','優先經驗書，保留同名個體供突破；確認強化後才消耗。'),pick,confirmButton('取消',()=>{gradePicker.hidden=true;}));
    actions.append(confirmButton('一鍵選階',()=>{gradePicker.hidden=!gradePicker.hidden;}));
  }
  actions.append(confirmButton(mode==='break'?'一鍵補足':'補足目標',()=>selectMany(visible(),limitGoal())),
    confirmButton('全選篩選',()=>{for(const item of visible()){if(selected.size>=(mode==='break'?required:100))break;selected.add(item.uid);}fill();update();}),
    confirmButton('清除選取',()=>{selected.clear();fill();update();}));
  const fill=()=>{
    grid.replaceChildren(...visible().map(item=>{
      const button=confirmButton('',()=>{
        const {result}=project();
        if(selected.has(item.uid))selected.delete(item.uid);
        else if(mode==='break'?selected.size<required:mode==='effect'?(result.effect??1)<effectsMax:selected.size<100)selected.add(item.uid);
        button.setAttribute('aria-pressed',String(selected.has(item.uid)));update();
      });
      button.append(itemArt(item),element('strong',itemName(item)),element('small',mode==='xp'?rarity(item.id)+'・+ '+xpOf(item).toLocaleString('zh-TW')+' 經驗':mode==='effect'?rarity(item.id)+'・'+powerOf(item)+' 培養值':`Lv.${item.level}・${rarity(item.id)}`));
      button.setAttribute('aria-pressed',String(selected.has(item.uid)));
      button.dataset.tier=rarity(item.id);button.dataset.uid=item.uid;
      for(const image of button.querySelectorAll('img')){image.loading='lazy';image.decoding='async';}
      return button;
    }));
    if(!grid.children.length)grid.append(element('p','沒有符合的可用素材。'));
  };
  search.oninput=fill;rarityFilter.onchange=fill;fill();update();
  const summary=element('aside','','growth-summary');summary.append(element('h2',title),columns,counter,preview,apply,confirmButton('返回',()=>modal(itemDetail(target,true))));
  const listing=element('div','','growth-listing');listing.append(search,rarityFilter,listToolbar(sortKey,{tier:'品階',name:'名稱',uid:'取得順序',...(mode==='xp'?{value:'提供經驗'}:{})},fill),targetLabel,actions,grid,gradePicker);
  panel.append(listing,summary);modal(panel);get('detail').scrollTop=0;
}

const comparisons={
    uid:(a,b)=>Number(a.uid.slice(1))-Number(b.uid.slice(1)), tier:(a,b)=>rarityNames.indexOf(rarity(a.id))-rarityNames.indexOf(rarity(b.id)),
    level:(a,b)=>a.level-b.level, effect:(a,b)=>(a.effect??1)-(b.effect??1), xp:(a,b)=>a.experience/xpNeeded(a.level,a)-b.experience/xpNeeded(b.level,b),
    name:(a,b)=>itemName(a).localeCompare(itemName(b),'zh-Hant'),
  };
function sortCollectibles(items,order){
  const direction=order.asc?1:-1;
  return items.sort((a,b)=>direction*(comparisons[order.key]?.(a,b)||0)||comparisons.uid(b,a));
}
function renderInventory() {
  const tier=get('inventory-tier').value;
  const query=get('inventory-search').value.trim();
  const list=inventory.items.filter(item=>item.kind===bagKind);
  const order=bagSort[bagKind]??{key:'uid',asc:false};
  get('bag-sort').value=order.key;
  get('bag-direction').textContent=order.asc?'↑':'↓';
  get('bag-direction').setAttribute('aria-label',get('bag-sort').selectedOptions[0].textContent+(order.asc?'由低到高':'由高到低'));
  const visible=list.filter(item=>(tier==='all'||rarity(item.id)===tier)&&itemSearch(item).includes(query));
  sortCollectibles(visible,order);
  get('inventory-heading').textContent=bagNames[bagKind];
  get('inventory-count').textContent=`持有 ${list.length} 份・顯示 ${visible.length} 份`;
  for(const button of document.querySelectorAll('[data-bag]'))button.setAttribute('aria-pressed',String(button.dataset.bag===bagKind));
  const signature=[tier,query,order.key,order.asc].join('|');
  const pageSize=innerHeight<=440?6:12;
  const pageCount=Math.max(1,Math.ceil(visible.length/pageSize));
  const previous=bagPages[bagKind];
  const pageIndex=previous?.signature===signature?Math.min(previous.index,pageCount-1):0;
  bagPages[bagKind]={signature,index:pageIndex};
  get('inventory-grid').replaceChildren(...(visible.length?visible.slice(pageIndex*pageSize,pageIndex*pageSize+pageSize).map(item=>{
    const used=teamsUsing(item.uid);
    const button=confirmButton('',()=>modal(itemDetail(item,true)));
    button.className='instance-tile';button.dataset.uid=item.uid;
    button.append(itemArt(item),element('strong',itemName(item)),element('small',`${exclusiveInfo[item.id]?.code??rarity(item.id)}・Lv.${item.level}`));
    if(item.kind==='hero'&&item.id===featuredHeroId())button.append(element('small','首頁展示中','featured-badge'));
    if(item.locked)button.append(element('small','素材已鎖定','featured-badge'));
    if(used.length)button.append(element('small',`編隊 ${used.join('、')}`));
    return button;
  }):[element('p','沒有符合的持有物。')]));
  renderBagPager(pageCount);
}
function renderBagPager(pageCount){
  let pager=get('inventory-page').querySelector('.bag-pagination');
  if(!pager){pager=element('nav','','bag-pagination');pager.setAttribute('aria-label','背包翻頁');get('inventory-grid').after(pager);}
  const index=bagPages[bagKind].index;
  const previous=confirmButton('‹ 上一頁',()=>{bagPages[bagKind].index--;renderInventory();});previous.disabled=index===0;
  const next=confirmButton('下一頁 ›',()=>{bagPages[bagKind].index++;renderInventory();});next.disabled=index===pageCount-1;
  const select=element('select');select.setAttribute('aria-label','背包頁碼');
  for(let i=0;i<pageCount;i++){const option=element('option',`${i+1} / ${pageCount}`);option.value=String(i);select.append(option);}
  select.value=String(index);select.onchange=()=>{bagPages[bagKind].index=Number(select.value);renderInventory();};
  pager.replaceChildren(previous,select,next);
}
function showInventory(kind=bagKind) {
  bagKind=kind;
  const page=get('inventory-page');
  if(!page.querySelector('.bag-filters')){const bar=element('div','','bag-filters');const controls=[...page.querySelectorAll(':scope > label,:scope > #bag-direction')];controls[0].before(bar);bar.append(...controls);}
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
const editorQueries={},editorTiers={};
function openTeamEditor(from,candidate=null,slot=null,position=0) {
  if(get('detail').open)get('detail').close();
  syncFixedInventory();flushTeam();
  editorReturn=from;
  teamDraft=structuredClone(teamItems);
  editorSlot=slot??(candidate?.kind==='card'?'cards':candidate?.kind??'cards');
  editorPosition=position;editorPreview=candidate?.uid??teamDraft.cards[0];
  view('team-editor');
  renderTeamEditor();
}
function teamChanged(){return JSON.stringify(teamDraft)!==JSON.stringify(teamItems);}
function commitTeamDraft(){
  const problem=checkLineup(teamDraft,instance);
  if(problem){get('team-status').textContent=problem;notify(problem,true);return false;}
  const previous={items:teamItems,deck,chosen,loadout};
  teamItems=structuredClone(teamDraft);
  deck=teamItems.cards.map(uid=>instance(uid).id);
  chosen=instance(teamItems.hero).id;loadout=instance(teamItems.rune)?.id??'none';
  if(!save()){
    teamItems=previous.items;deck=previous.deck;chosen=previous.chosen;loadout=previous.loadout;flushTeam();return false;
  }
  return true;
}
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
  modal(element('h2','尚未儲存編隊'),confirmButton('儲存並返回',()=>{if(commitTeamDraft()){get('detail').close();leaveEditor();notify(`編隊 ${activeTeam+1} 已儲存。`);}}),confirmButton('放棄並返回',()=>{get('detail').close();leaveEditor();}),confirmButton('繼續編輯',()=>get('detail').close()));
};
function renderTeamEditor() {
  const host=get('team-editor-content');
  const oldList=host.querySelector('.team-candidates');
  const listScroll=oldList?.scrollTop??0;
  const capacity=heroCapacity(instance(teamDraft.hero)?.level??1);
  get('team-status').textContent=(teamChanged()?'尚未儲存':'已儲存')+`・${teamDraft.cards.length}/${capacity} 張`;
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
    if(commitTeamDraft()){renderTeamEditor();notify(`編隊 ${activeTeam+1} 已儲存。`);}
  });
  header.append(tabs,saveTeam);
  const slots=element('div','','team-instance-slots');
  slots.style.setProperty('--team-rows',Math.ceil((Math.max(capacity,teamDraft.cards.length)+3)/4));
  function slot(kind,index,uid,label) {
    const item=instance(uid);
    const button=confirmButton('',()=>{editorSlot=kind;editorPosition=index;editorPreview=uid;renderTeamEditor();});
    if(kind==='cards'&&index>teamDraft.cards.length)button.disabled=true;
    button.setAttribute('aria-pressed',String(editorSlot===kind&&(kind==='hero'||editorPosition===index)));
    button.append(element('small',label));
    if(item)button.append(itemArt(item),element('strong',itemName(item)),element('small',`${exclusiveInfo[item.id]?.code??rarity(item.id)}・Lv.${item.level}`));
    else button.append(element('span','未裝備'));
    slots.append(button);
  }
  slot('hero',0,teamDraft.hero,'英雄');
  for(let i=0;i<Math.max(capacity,teamDraft.cards.length);i++)slot('cards',i,teamDraft.cards[i]??null,`第 ${i+1} 張`);
  slot('rune',0,teamDraft.rune,'符文 1');
  slot('rune',1,teamDraft.rune2,'符文 2');
  const runeSlot=editorPosition===0?'rune':'rune2';
  const candidate=instance(editorPreview), kind=editorSlot==='cards'?'card':editorSlot;
  const preview=element('section','','team-candidate');
  if(candidate?.kind===kind) {
    const info=element('div','','team-candidate-info');
    info.append(element('strong',itemName(candidate)),element('small',`Lv.${candidate.level}・效果 ${candidate.effect??1}/10`));
    const equipped=instance(kind==='card'?teamDraft.cards[editorPosition]:kind==='rune'?teamDraft[runeSlot]:teamDraft.hero);
    const values=itemStats(candidate).slice(0,2).map(([label,value])=>label+' '+value).join('・');
    info.append(element('small',values));
    if(equipped&&equipped.uid!==candidate.uid)info.append(element('small',`替換：${itemName(equipped)} Lv.${equipped.level} → Lv.${candidate.level}`));
    preview.append(info,confirmButton('詳細屬性',()=>modal(itemDetail(candidate))));
    const occupied=kind==='card'?teamDraft.cards.findIndex((uid,i)=>i!==editorPosition&&uid===candidate.uid):-1;
    const duplicateRune=kind==='rune'&&candidate.uid===teamDraft[editorPosition===0?'rune2':'rune'];
    const blocked=duplicateRune||kind==='card'&&editorPosition===teamDraft.cards.length&&occupied>=0;
    const assign=confirmButton(occupied>=0&&!blocked?'交換兩個牌位':'確認裝入此欄位',()=>{
      if(kind==='card'){
        const next=assignLineupCard(teamDraft.cards,editorPosition,candidate.uid,instance);
        if(!next||next.length>capacity)return;
        teamDraft.cards=next;
      } else if(kind==='rune')teamDraft[runeSlot]=candidate.uid;
      else teamDraft[kind]=candidate.uid;
      renderTeamEditor();notify('已裝入草稿，請儲存編隊。');
    });
    if(duplicateRune)preview.append(element('p','此個體已裝備在另一格。'));
    else if(occupied>=0)preview.append(element('small',editorPosition===teamDraft.cards.length?'此個體已出戰，請選擇另一份卡牌。':`此張已在第 ${occupied+1} 格，裝入時交換位置。`));
    assign.disabled=blocked;
    preview.append(assign);
  }
  if(kind==='card'&&editorPosition<teamDraft.cards.length&&teamDraft.cards.length>8)preview.append(confirmButton('移除此卡',()=>{teamDraft.cards.splice(editorPosition,1);editorPosition=Math.min(editorPosition,teamDraft.cards.length-1);editorPreview=teamDraft.cards[editorPosition];renderTeamEditor();}));
  if(kind==='rune') preview.append(confirmButton('卸下符文',()=>{teamDraft[runeSlot]=null;editorPreview=null;renderTeamEditor();}));
  const candidates=element('div','','team-candidates');
  const search=element('input');
  search.type='search';search.placeholder='卡牌、英雄或符文名稱';search.setAttribute('aria-label','搜尋可裝備個體');
  search.value=editorQueries[kind]??'';
  const order=lineupSort[kind]??{key:'tier',asc:false};
  const sort=element('select');sort.setAttribute('aria-label','編隊排序方式');
  for(const [key,label] of [['tier','品階'],['level','等級'],['effect','效果等級'],['xp','經驗進度'],['name','名稱'],['uid','取得順序']]){
    const option=element('option',label);option.value=key;sort.append(option);
  }
  sort.value=order.key;
  const direction=confirmButton('',()=>{order.asc=!order.asc;saveOrder();});
  const tier=element('select');tier.setAttribute('aria-label','編隊品階篩選');
  for(const value of ['all',...rarityNames]){const option=element('option',value==='all'?'全品階':value);option.value=value;tier.append(option);}
  tier.value=editorTiers[kind]??'all';
  const tools=element('div','','lineup-filters');tools.append(search,tier,sort,direction);
  function saveOrder(){lineupSort[kind]=order;save();fill();}
  sort.onchange=()=>{order.key=sort.value;saveOrder();};
  const fill=()=>{
    direction.textContent=order.asc?'↑':'↓';
    direction.setAttribute('aria-label',sort.selectedOptions[0].textContent+(order.asc?'由低到高':'由高到低'));
    const query=search.value.trim();
    const items=sortCollectibles(inventory.items.filter(item=>item.kind===kind&&itemSearch(item).includes(query)&&(tier.value==='all'||rarity(item.id)===tier.value)),order);
    candidates.replaceChildren(...(items.length?items.map(item=>{
      const button=confirmButton('',()=>{
        editorPreview=item.uid;renderTeamEditor();
      });
      button.append(itemArt(item),element('strong',itemName(item)),element('small',`${exclusiveInfo[item.id]?.code??rarity(item.id)}・Lv.${item.level}`));
      for(const image of button.querySelectorAll('img')){image.loading='lazy';image.decoding='async';}
      const equipped=kind==='card'?teamDraft.cards.indexOf(item.uid):-1;
      if(equipped>=0)button.append(element('small',`已編入 ${equipped+1}`,'equipped-tag'));
      if(kind==='hero'&&teamDraft.hero===item.uid||kind==='rune'&&[teamDraft.rune,teamDraft.rune2].includes(item.uid))button.append(element('small','已裝備','equipped-tag'));
      button.setAttribute('aria-pressed',String(item.uid===editorPreview));return button;
    }):[element('p','沒有符合的個體。')]));
  };
  tier.onchange=()=>{editorTiers[kind]=tier.value;fill();};
  search.oninput=()=>{editorQueries[kind]=search.value;fill();};fill();
  search.placeholder=`搜尋${kindNames[kind]}個體`;
  host.replaceChildren(header,slots,tools,candidates,preview);
  candidates.scrollTop=listScroll;
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

    return lane;
  }));
  field.scrollLeft = scroll;
  get('hero-hp').value=player.hp;get('hero-hp').max=state.heroMax??heroHealth(state.heroLevel??1);
  get('enemy-hp').value=enemy.hp;get('enemy-hp').max=missionFor(state).hp;
  get('enemy-portrait').src=asset('hero-portrait-'+state.enemyHero);
  get('health').textContent = `${player.hp}${frame.heroShield ? ' ◆'+frame.heroShield : ''}`;
  get('enemy-health').textContent = `${enemy.hp}${enemy.heroShield?' ◆'+enemy.heroShield:''}`;
  get('round').textContent = `回合 ${frame.round}`;
  for(const [index,id,charges] of [[1,state.rune,frame.charges],[2,state.rune2?.id??'none',frame.rune2Charges??frame.rune2?.charges??0]]){
    const button=get(index===1?'rune-status':'rune-status-2');
    const wait=Math.max(0,((frame.runeActivity??state.runeStates?.[0])?.[index===1?'first':'second']?.next??0)-frame.round);
    const status=id==='none'?'未裝備':runes[id].name+'\n'+(!charges?'已耗盡':wait?'冷卻 '+wait:'待觸發');
    button.replaceChildren(runeBadge(id,status,id!=='none'&&!charges?'spent':id));
    button.setAttribute('aria-label','符文 '+index+'・'+button.textContent);
  }
  const boss=enemy.board.findIndex(card=>card?.id==='boss');
  get('forecast').textContent=boss>=0&&!state.daily?`斷橋守將在第 ${boss+1} 欄。橫掃會波及兩側。`:missionFor(state).goal;
}
function render() {
  const [player,enemy]=state.sides;
  renderBoard(state);
  const current=heroes.find(hero=>hero.id===state.hero);
  get('portrait').src=asset(`hero-portrait-${current.id}`);
  get('hero-name').textContent=current.name;
  get('hero-name').onclick=()=>modal(artwork(current.id,'hero'),element('h2',current.skill),element('p',heroSkillProfile(current.id,state.heroEffect??1).detail));
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
  if(event.effectArt)return event.effectArt;
  if(event.rune) return 'rune-pulse';
  if(event.kind==='skill'&&/燃燒|中毒|寒霜|沉默|標記/.test(event.message))return 'fx-rune';
  if (event.kind==='skill') return event.message.includes('自爆')?'fx-bomb':event.message.includes('靈體')?'fx-spirit':/治療|回春|援護|回復/.test(event.message)?'fx-heal':'fx-shield';
  if (event.kind==='attack') return event.message.includes('橫掃')?'fx-ax':event.message.includes('斥候')?'fx-arrow':'fx-ax';
  if (event.kind==='deploy') return 'fx-rune';
  if (event.kind==='death') return 'fx-spirit';
  return 'fx-shield';
}
function duration(kind) {
  const speed=Number(get('speed').value);
  return kind==='hero'?Math.max(560,1150/speed):(kind==='round'?180:380)/speed;
}
function showHeroCast(ms, reducedMotion,actor=0) {
  const hero=heroes.find(h=>h.id===(actor===1?state.enemyHero:state.hero));
  get('hero-cut-in-art').src=asset('hero-cast-'+hero.id);
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
    const pay=state.daily?claimReward(state.daily.vault,state.daily.floor):victoryPay(Boolean(reward),chapterFor(state.stage)+1);
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
  get('back').disabled=true;
  try { for(const event of update.events) {
    if(token!==playback) return;
    if(document.hidden) break;
    renderBoard(event.frame,event);
    get('message').textContent=event.message;
    play(event.kind==='hit'?(event.message.includes('盾吸收')?'shield':event.lanes?.includes(null)?'impact':'hit'):event.rune?'rune':event.kind,state.hero);
    const ms=duration(event.kind);
    const reducedMotion=lowMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(event.kind==='hero') showHeroCast(ms,reducedMotion,event.actor);
    const origin=get('lanes').querySelector(`[data-slot="${event.actor}:${event.origin}"]`);
    if(origin && !reducedMotion) origin.animate(
      [{transform:'translateY(0)'},{transform:`translateY(${event.actor===0?-9:9}px)`},{transform:'translateY(0)'}],ms);
    const frameAnimations=[];
    for(const lane of event.lanes??[]) {
      const slot=lane===null?(event.target===0?get('health'):get('enemy-health')):get('lanes').querySelector(`[data-slot="${event.target}:${lane}"]`);
      if(!slot) continue;
      if(lane===null || event.kind==='hero') {
        if(!reducedMotion)slot.animate([{opacity:.45,transform:'scale(1.12)'},{opacity:1,transform:'none'}],ms);
        if(lane===null&&event.kind==='hit'){
          const flash=element('img','','direct-hit-effect');flash.src=asset('fx-shield');flash.alt='';
          const badge=slot.closest('.hero-hud,.enemy-hud');badge?.append(flash);
          setTimeout(()=>flash.remove(),ms);
        }
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
      if(!reducedMotion) img.animate([{opacity:0,transform:'scale(.68)'},{opacity:1,offset:.28},{opacity:.65,offset:.72},{opacity:0,transform:'scale(1.13)'}],{duration:ms,fill:'both'});
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
    runeBadge(state.rune,state.rune==='none'?'未裝備':`${runes[state.rune].name}・發動 ${state.runeStates?.[0]?.first?.uses??0} 次`));
  if(state.currencyReward) {
    const rewards=element('div','','wallet');
    rewards.append(money('gold',`+${state.currencyReward.gold}`),money('gems',`+${state.currencyReward.gems}`));
    if(state.currencyReward.material)rewards.append(element('p',materials[state.currencyReward.material].name+' × '+state.currencyReward.count));
    summary.append(rewards);
  }
  if(state.rune2)summary.append(runeBadge(state.rune2.id,`${runes[state.rune2.id].name}・發動 ${state.runeStates?.[0]?.second?.uses??0} 次`));
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
get('result-next').onclick=()=>{stageIndex=state.stage+1;showCampaign();changeMusic('lobby');};
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
    const spareRune=instance(teamItems.rune2);
    const levels={}; // Exact instance values are supplied in battleCards, preserving duplicate names.
    state=createBattle(battleRune?.id??'none',battleHero.id,stageIndex,battleCards.map(card=>card.id),levels,battleHero.level,battleRune?.level??1,expedition,{},battleHero.effect??1,battleRune?.effect??1,spareRune?{id:spareRune.id,level:spareRune.level,effect:spareRune.effect??1,charges:2}:null,battleCards);
    state.lineupSignature=lineupSignature();
    state.teamIndex=activeTeam;
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
get('back').onclick=()=>{if(state.daily)showDaily(state.daily.vault,state.daily.floor);else {stageIndex=state.stage;showCampaign();}changeMusic('lobby');};
get('attack').onclick=()=>act({type:'attack'});
get('deploy').onclick=()=>act({type:'deploy',uid:selected});
get('speed').onchange=save;
get('mute').onclick=()=>{get('mute').textContent=toggleMute()?'開聲音':'靜音';};
get('report').onclick=()=>{
 const showLog=()=>modal(element('h2','戰報'),confirmButton('查看雙方退場單位',showGraves),...log.slice(-60).reverse().map(line=>element('p',line)));
 function showGraves(){
  const content=[element('h2','雙方退場單位'),confirmButton('返回戰報',showLog)];
  for(const [index,side] of state.sides.entries()){
   content.push(element('h3',(index===0?'我方':'敵方')+'・'+side.graveyard.length+' 張'));
   const grid=element('div','','graveyard-grid');
   for(const card of side.graveyard){const button=confirmButton('',()=>cardDetail(card));button.append(cardFace(card));grid.append(button);}
   content.push(side.graveyard.length?grid:element('p','尚無退場單位。'));
  }
  content.push(element('small','已復活的單位移出退場區；召喚物不列為可復活卡牌。每方最多兩次復活。'));modal(...content);
 }
 showLog();
};
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
get('campaign-review').onclick=reviewLineup;
get('campaign-prepare').onclick=()=>openTeamEditor('campaign');
get('campaign-fight').onclick=()=>enter(!canResumeCampaign());
get('campaign-back').onclick=showCamp;
get('camp-map').onclick=showCampaign;
get('camp-profile').onclick=()=>showInventory('hero');
get('daily-back').onclick=showCampaign;
get('daily-link').onclick=()=>showDaily();
function claimReward(vault,floor,sweep=false) {
  const result=claimDaily(daily,vault,floor,sweep);
  const pay={gold:0,gems:0};
  if(result){
    daily=result.progress;
    if(['xp','tech'].includes(vault)){
      const id=bookFor(vault,floor);
      for(let i=0;i<result.amount;i++)addInstance(inventory,'material',id);
      pay.material=id;pay.count=result.amount;
    }else pay[vault]=result.amount;
  }
  return pay;
}
function showDaily(vault='gold',floor) {
  view('daily');
  const info=vaults[vault], status=dailyStatus(daily,vault);
  floor??=Math.min(10,status.highest+1);
  dailySelection={vault,floor};
  const tabs=element('nav','','daily-destinations');
  tabs.setAttribute('aria-label','秘境目的地');
  for(const [id,entry] of Object.entries(vaults)){
    const progress=dailyStatus(daily,id);
    const button=confirmButton('',()=>showDaily(id));
    button.style.setProperty('--vault-art',`url("${asset('vault-'+id)}")`);
    button.append(element('strong',entry.name),element('small',`${progress.highest}/10 層・剩 ${entry.limit-progress.used} 次`));
    button.setAttribute('aria-pressed',String(id===vault));tabs.append(button);
  }
  const track=element('div','','daily-track');
  track.style.setProperty('--vault-art',`url("${asset('vault-'+vault)}")`);
  track.setAttribute('aria-label',info.name+'樓層地圖');
  for(let n=1;n<=10;n++){
    const label=n<=status.highest?'已通關':n===status.highest+1?'可挑戰':'未解鎖';
    const button=confirmButton('',()=>showDaily(vault,n));
    button.style.setProperty('--marker-row',n>5?1:2);
    button.style.setProperty('--marker-col',n>5?11-n:n);
    button.style.setProperty('--marker-jitter',[-5,9,-13,4,12,0,-8,14,-11,3][n-1]+'px');
    button.dataset.status=n<=status.highest?'clear':n===status.highest+1?'open':'locked';
    button.dataset.boss=String(n%5===0);
    const flag=element('img');flag.src=asset('map-flag');flag.alt='';
    button.append(flag,element('strong',String(n)));
    button.setAttribute('aria-label',`第 ${n} 層・${label}`);
    button.title=label;button.setAttribute('aria-pressed',String(n===floor));track.append(button);
  }
  const details=element('section','','daily-details');
  const stage=dailyStage({vault,floor});
  const base=dailyPay(vault,floor);
  const sweep=n=>{
    const pay=claimReward(vault,n,true);
    if(!pay[vault]&&!pay.material){showDaily(vault,n);return;}
    if(pay[vault])wallet={...wallet,[vault]:wallet[vault]+pay[vault]};save();showDaily(vault,n);
    modal(element('h2','掃蕩完成'),pay.material?element('p',materials[pay.material].name+' × '+pay.count):money(vault,`+${pay[vault]}`));
  };
  const heading=element('div','','daily-encounter-heading');
  if(status.legacyHighest)details.append(element('small',`舊制通關 ${status.legacyHighest} 層；新版需重新挑戰認證後解鎖掃蕩。`));
  heading.append(element('h2',`第 ${floor} 層${stage.head?'・頭目':''}`),element('small',`敵軍 Lv.${stage.enemyLevel}・技能 Lv.${stage.enemyEffect}`),
    element('small',floor<=status.highest?'已通關':floor===status.highest+1?'可挑戰':'未解鎖'));
  const rewards=element('div','','daily-loot');
  const rewardIcon=()=>vault==='gold'||vault==='gems'?artwork(vault,'money'):artwork(vault,'material');
  for(const [label,amount] of [['通關',base],['首通加成',Math.ceil(base/2)]]){
    const chip=element('div');chip.append(rewardIcon(),element('strong',`+${amount}`),element('small',label));rewards.append(chip);
  }
  const enemies=element('div','','daily-enemies');
  enemies.setAttribute('aria-label','敵方先鋒');
  for(const id of [...new Set([...stage.opening,...stage.opponents])].slice(0,4)){
    const card=confirmButton('',()=>cardDetail(catalogCard(id,stage.enemyLevel,stage.enemyEffect)));
    card.append(artwork(id));card.setAttribute('aria-label',cards[id][0]);enemies.append(card);
  }
  const guide=element('details','','daily-guide');
  guide.append(element('summary','關卡機制'),element('p',stage.goal),confirmButton('查看完整敵方配置',()=>encounterDetails(stage)));
  details.append(heading,rewards,enemies,guide);
  const buttons=element('div','','controls');
  const resume=state?.phase==='deploy'&&state.daily?.vault===vault&&state.daily.floor===floor&&state.lineupSignature===lineupSignature();
  const fight=confirmButton(resume?'繼續戰鬥':'挑戰',()=>enter(!resume,{vault,floor}));
  fight.disabled=status.used>=info.limit||floor>status.highest+1;
  const skip=confirmButton('掃蕩此層',()=>sweep(floor));skip.disabled=status.used>=info.limit||floor>status.highest;
  const best=confirmButton('掃蕩最高已通關層',()=>sweep(status.highest));best.disabled=status.used>=info.limit||!status.highest;
  buttons.append(fight,skip,best,confirmButton('編隊',()=>openTeamEditor('daily')));
  details.append(buttons);
  const scene=element('div','','daily-scene');scene.append(track,details);
  const reset=element('small','台灣時間 00:00 重置','daily-reset');
  get('daily-content').replaceChildren(tabs,scene,reset);
}
get('title-start').onclick=async()=>{if(starterHero)showCamp();else showStarter();await unlock();changeMusic(starterHero?'lobby':'title');};
get('title-resume').onclick=()=>enter(false);
get('camp-runes').onclick=()=>showRunes('camp');
get('rune-back').onclick=()=>runeReturn==='lobby'?lobby():showCamp();
get('camp-deck').onclick=()=>openTeamEditor('camp');
get('camp-collection').onclick=()=>{
  townRead.collection=new Set(inventory.items.filter(item=>item.kind!=='material').map(item=>item.id)).size;
  save();showCollection();
};
get('camp-bag').onclick=()=>{townRead.bag=inventory.next;save();showInventory('card');};
get('camp-heroes').onclick=showHeroes;
get('hero-book-back').onclick=showCamp;
for(const tier of rarityNames){const option=element('option',tier);option.value=tier;get('hero-rarity').append(option);}
get('hero-rarity').onchange=showHeroes;
get('hero-search').oninput=showHeroes;
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
  modal(artwork(hero.id,'hero'),element('h2',hero.name),element('strong',hero.skill),element('p',heroSkillProfile(hero.id,instance(teamItems.hero)?.effect??1).detail));
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
get('rune-status-2').onclick=()=>runeDetails(state.rune2?.id??'none',Boolean(state.rune2));
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && audioScene && audioScene!=='end' && audioScene!=='loss') setMusic(audioScene);
});
get('title-resume').hidden=state?.phase!=='deploy';
get('title-start').textContent=starterHero?'繼續冒險':'開始冒險';

get('rotate-fullscreen').onclick=async()=>{
  try{await document.documentElement.requestFullscreen?.();await screen.orientation?.lock?.('landscape');}
  catch{get('rotate-note').textContent='請將手機橫拿；若畫面未旋轉，請關閉手機的直向鎖定。';}
};

for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,event=>event.preventDefault(),{passive:false});
document.addEventListener('touchmove',event=>{if(event.touches.length>1)event.preventDefault();},{passive:false});

document.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});

for(const id of ['card-filter','rune-filter'])get(id).options[0].textContent='全類別';
for(const id of ['card-rarity','hero-rarity','rune-rarity'])get(id).options[0].textContent='全品階';
for(const id of ['card-owned','hero-owned','rune-owned'])get(id).options[0].textContent='全收錄';

// Recycling operates on independent instances. Team and display protection is
// checked both when listing candidates and immediately before committing.
function commitRecycle(result){
  if(!result)return false;
  const before={inventory:structuredClone(inventory),wallet,consumed:[...consumed]};
  Object.assign(inventory,result.inventory);wallet=result.wallet;
  for(const id of result.consumed??[])consumed.add(id);
  if(!save()){Object.assign(inventory,before.inventory);wallet=before.wallet;consumed.clear();for(const id of before.consumed)consumed.add(id);notify('儲存失敗，交易已取消。');return false;}
  renderInventory();return true;
}
function openRecycle(mode='dismantle',initialGroup='card'){
  const panel=element('div','','recycle-panel'),header=element('header'),controls=element('div','','recycle-controls');
  header.append(element('h2',mode==='dismantle'?'分解工坊':'碎片兌換'),element('strong',`持有碎片 ${(wallet.fragments??0).toLocaleString()}`),confirmButton(mode==='dismantle'?'前往兌換':'返回分解',()=>openRecycle(mode==='dismantle'?'exchange':'dismantle')),confirmButton('返回背包',()=>{get('detail').close();showInventory('card');}));
  const kind=element('select'),tier=element('select'),search=element('input');
  kind.setAttribute('aria-label','分解類別');tier.setAttribute('aria-label','分解品階');search.type='search';search.placeholder='搜尋名稱';search.setAttribute('aria-label','工坊搜尋');
  for(const [id,label] of mode==='exchange'?[['card','全部卡牌'],...Object.entries(exclusiveGroups).map(([id,name])=>[id,id+'・'+name])]:[['card','卡牌'],['rune','符文'],['hero','英雄']]){const o=element('option',label);o.value=id;kind.append(o);}
  kind.value=initialGroup;
  for(const id of ['all',...rarityNames]){const o=element('option',id==='all'?'全品階':id);o.value=id;tier.append(o);}
  const grid=element('div','','team-candidates recycle-grid'),footer=element('footer','','recycle-footer'),pager=element('nav','','recycle-pager');
  const selected=new Set();let page=0;
  const blocked=()=>protectedItems(teams,inventory,featuredHeroId());
  const visible=()=>{
    const entries=mode==='exchange'?Object.keys(cards).filter(id=>!['boss','spirit'].includes(id)).map((id,i)=>({id,kind:'card',uid:'i'+i,level:1,experience:0})):inventory.items.filter(i=>i.kind===kind.value&&!blocked().has(i.uid));
    return orderList(entries.filter(i=>(tier.value==='all'||rarity(i.id)===tier.value)&&`${itemName(i)} ${exclusiveInfo[i.id]?.code??''}`.includes(search.value.trim())&&(mode!=='exchange'||kind.value==='card'||exclusiveInfo[i.id]?.group===kind.value)),'recycle-'+mode,comparisons);
  };
  function update(){
    if(mode==='exchange'){footer.replaceChildren(element('small','XUR 四系列各 10 張，僅限碎片兌換；取得新的 Lv.1 個體。'));return;}
    const entries=[...selected].map(instance).filter(Boolean),gain=entries.reduce((n,i)=>n+fragmentValue(i),0);
    const action=confirmButton('確認分解',()=>{
      const plan=dismantle(inventory,wallet,[...selected],blocked());if(!plan){notify('選取物件已變更或受到保護，請重新選取。');return;}
      const review=element('div','','recycle-review');
      review.append(element('h2',`分解 ${entries.length} 份 → ${plan.gain} 碎片`),element('p','分解後無法取回個體、經驗與強化成果。'),element('p',rarityNames.map(t=>{const n=entries.filter(i=>rarity(i.id)===t).length;return n?`${t} × ${n}`:'';}).filter(Boolean).join('・')));
      if(entries.some(i=>i.level>1||i.experience||(i.effect??1)>1))review.append(element('strong','包含已培養個體；培養投入不額外返還。'));
      const names=element('div','','recycle-review-list');for(const i of entries)names.append(element('p',`${itemName(i)}・${rarity(i.id)}・Lv.${i.level}・效果 ${i.effect??1}・經驗 ${i.experience}`));
      review.append(names,confirmButton('確定消耗並分解',()=>{const current=dismantle(inventory,wallet,[...selected],blocked());if(commitRecycle(current)){notify(`分解完成，獲得 ${current.gain} 碎片。`);void unlock().then(()=>play('upgrade'));openRecycle();}}),confirmButton('取消',()=>openRecycle()));modal(review);
    });action.disabled=!entries.length;
    footer.replaceChildren(element('strong',`已選 ${entries.length} / 100 份・可得 ${gain} 碎片`),action,confirmButton('全選篩選',()=>{for(const i of visible()){if(selected.size>=100)break;selected.add(i.uid);}render();}),confirmButton('一鍵選未培養 N／R',()=>{for(const i of visible()){if(selected.size>=100)break;if(['N','R'].includes(rarity(i.id))&&i.level===1&&!i.experience&&(i.effect??1)===1)selected.add(i.uid);}render();}),confirmButton('清除',()=>{selected.clear();render();}));
  }
  function render(){
    const all=visible(),pageSize=innerHeight<=500?6:12,pages=Math.max(1,Math.ceil(all.length/pageSize));page=Math.min(page,pages-1);
    grid.replaceChildren(...all.slice(page*pageSize,page*pageSize+pageSize).map(item=>{
      const b=confirmButton('',()=>{
        if(mode==='exchange'){
          const cost=exchangeCost(item.id);const detail=itemDetail(item);
          const buy=confirmButton(`消耗 ${cost} 碎片兌換`,()=>{const result=exchangeCard(inventory,wallet,item.id);if(commitRecycle(result)){notify(`已兌換 ${itemName(item)}，Lv.1 新個體已放入背包。`);openRecycle('exchange');}});buy.disabled=(wallet.fragments??0)<cost;
          modal(detail,buy,confirmButton('返回兌換',()=>openRecycle('exchange')));return;
        }
        if(selected.has(item.uid))selected.delete(item.uid);else if(selected.size<100)selected.add(item.uid);render();
      });
      b.append(itemArt(item),element('strong',(exclusiveInfo[item.id]?.code?exclusiveInfo[item.id].code+' ':'')+itemName(item)),element('small',`${rarity(item.id)}・${mode==='exchange'?exchangeCost(item.id)+' 碎片':`Lv.${item.level} → ${fragmentValue(item)} 碎片`}`));b.dataset.tier=rarity(item.id);b.dataset.uid=item.uid;
      if(mode==='dismantle'){b.setAttribute('aria-pressed',String(selected.has(item.uid)));b.append(element('small',selected.has(item.uid)?'✓ 已選':'點選加入'));}return b;
    }));
    if(!all.length)grid.append(element('p','沒有符合的可分解物件；鎖定、編隊中及首頁英雄不會列出。'));
    const prev=confirmButton('‹',()=>{page--;render();}),next=confirmButton('›',()=>{page++;render();});prev.disabled=page===0;next.disabled=page===pages-1;pager.replaceChildren(prev,element('span',`${page+1} / ${pages}`),next);update();
  }
  kind.onchange=tier.onchange=search.oninput=()=>{page=0;render();};
  controls.append(kind,tier,search,listToolbar('recycle-'+mode,{tier:'品階',name:'名稱',level:'等級',uid:'取得順序'},()=>{page=0;render();}));
  panel.append(header,controls,grid,pager,footer);render();modal(panel);
}
get('recycle-open').onclick=()=>openRecycle();
get('title-start').disabled=false;

let bagResizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(bagResizeFrame);bagResizeFrame=requestAnimationFrame(()=>{if(!get('inventory-page').hidden)renderInventory();});});
