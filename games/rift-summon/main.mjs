import {applyAction, cards, createBattle, stages, starter} from './battle.mjs?v=catalog-5';
import {heroes} from './heroes.mjs';
import {unlock, prepare, play, setMusic, toggleMute, updateVolume} from './audio.mjs?v=catalog-5';
import {makeBackup, readBackup} from './backup.mjs?v=catalog-5';
import {startingWallet,validWallet,cardLevel,maxLevel,levelCost,victoryPay,unlockedRunes,improveCard} from './economy.mjs?v=catalog-5';
import {starterHeroes,rarity,rarityNames,poolFor,pullPrice,openBatch,improveCollectible} from './economy.mjs?v=catalog-5';

const get = id => document.getElementById(id);
const asset = name => globalThis.riftArtwork?.[name] ?? `art/${name}.webp`;
const key = 'cxq-rift-summon-visual-slice';
const recoveryKey = key + '-recovery';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
let state = saved?.state?.version === 3 && saved.state.phase==='deploy' ? saved.state : null;
let log = state ? saved?.log ?? [] : [];
const cleared = new Set(Array.isArray(saved?.cleared) ? saved.cleared.filter(index => stages[index]) : []);
let wallet=validWallet(saved?.wallet)?saved.wallet:startingWallet();
const owned = () => [...starter,...stages.filter((_,index)=>cleared.has(index)).map(stage=>stage.reward),...wallet.unlocked];
let deck = Array.isArray(saved?.deck) && saved.deck.length === 8 && new Set(saved.deck).size === 8 && saved.deck.every(id=>owned().includes(id)) ? saved.deck : [...starter];
let stageIndex = state?.phase==='deploy' ? state.stage : Math.min(cleared.size, stages.length-1);
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
  none:{name:'未裝備',effect:'這場戰鬥不會觸發符文。'},
};
const savedRune=saved?.loadout??state?.rune;
let loadout=savedRune==='none'||unlockedRunes(cleared,wallet).includes(savedRune)?savedRune:'wall';
let activeTeam=Number.isInteger(saved?.activeTeam)&&saved.activeTeam>=0&&saved.activeTeam<3?saved.activeTeam:0;
const teams=Array.from({length:3},(_,i)=>{
  const item=saved?.teams?.[i];
  return {
    deck:Array.isArray(item?.deck)&&item.deck.length===8&&new Set(item.deck).size===8&&item.deck.every(id=>owned().includes(id))?[...item.deck]:[...deck],
    hero:ownedHeroes().includes(item?.hero)?item.hero:(ownedHeroes().includes(chosen)?chosen:starterHero),
    rune:item?.rune==='none'||unlockedRunes(cleared,wallet).includes(item?.rune)?item.rune:loadout,
  };
});
function flushTeam() {teams[activeTeam]={deck:[...deck],hero:chosen,rune:loadout};}
function selectTeam(index) {
  activeTeam=index;
  const team=teams[index];
  deck=[...team.deck];chosen=team.hero??starterHero??'trust';loadout=team.rune;
}
selectTeam(activeTeam);
let runeReturn='camp';
let settingsReturn='camp';
let albumReturn='camp';
let bagOnly=false;
let lowMotion=saved?.lowMotion===true;
updateVolume(volumes);
get('speed').value = saved?.speed ?? '1';

function currentSave() {
  const ongoing=state?.phase==='deploy';
  flushTeam();
  return {state:ongoing?state:null, log:ongoing?log:[], deck, cleared:[...cleared], volumes, loadout, lowMotion, wallet, teams, activeTeam, starterHero, speed:get('speed').value};
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(currentSave())); }
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
  for(const page of ['title-screen','starter-select','camp','rune-book','hero-book','capsule','campaign','settings-page','collection','lobby','battle','results']) get(page).hidden=page!==id;
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
function heroDetails(hero,select=false) {
  const available=ownedHeroes().includes(hero.id);
  const level=wallet.heroLevels?.[hero.id]??1;
  const count=wallet.heroCopies?.[hero.id]??(available?1:0);
  const nodes=[artwork(hero.id,'hero'),element('h2',`${hero.name}・${rarity(hero.id)}`),element('strong',hero.skill),element('p',hero.detail),
    element('p',`Lv.${level}・起始生命 ${23+level}・持有 ×${count}`)];
  if(!available) {
    const stage=stages[heroMilestones.indexOf(hero.id)];
    nodes.push(element('p',stage?`英雄扭蛋或首通「${stage.name}」解鎖。`:'從英雄扭蛋取得。'));
  }
  if(available&&select) nodes.push(confirmButton('設為此組出戰英雄',()=>{chosen=hero.id;save();get('detail').close();lobby();}));
  if(available&&level<maxLevel) {
    const improve=confirmButton(`消耗 1 份同名材料・生命 ${23+level} → ${24+level}`,()=>{
      const next=improveCollectible(wallet,'hero',hero.id,available);
      if(next){wallet=next;save();heroDetails(hero,select);}
    });
    improve.disabled=count<2;
    nodes.push(improve);
  }
  modal(...nodes);
}
function showHeroes() {
  view('hero-book');
  get('hero-book-grid').replaceChildren(...heroes.map(hero=>{
    const button=confirmButton('',()=>heroDetails(hero));
    button.append(artwork(hero.id,'hero'),element('strong',`${hero.name}・${rarity(hero.id)}`),
      element('span',ownedHeroes().includes(hero.id)?`Lv.${wallet.heroLevels?.[hero.id]??1}`:'未解鎖'));
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
function runeDetails(id, editable=false) {
  const rune=runes[id];
  const level=wallet.runeLevels?.[id]??1;
  const count=wallet.runeCopies?.[id]??(unlockedRunes(cleared,wallet).includes(id)?1:0);
  const panel=element('div','','rune-detail');
  panel.append(runeImage(id),element('h2',rune.name),element('p',rune.effect),
    element('p',id==='none'?'可從符文冊裝備。':`每場 2 次・${rune.source??'初始符文'}`));
  if(id!=='none') panel.append(element('p',`${rarity(id)}・Lv.${level}・持有 ×${count}・效果額外 +${level-1}`));
  if(!editable && id!=='none' && state) panel.append(element('p',`本場剩 ${state.charges} 次`));
  if(editable) {
    const apply=element('button',loadout===id?'卸下':'裝備');
    apply.onclick=()=>{
      loadout=loadout===id?'none':id;
      save();
      get('detail').close();
      renderRuneBook();
    };
    panel.append(apply);
    if(level<maxLevel) {
      const upgrade=confirmButton('消耗 1 枚同名符文強化',()=>{
        const next=improveCollectible(wallet,'rune',id,true);
        if(next){wallet=next;save();renderRuneBook();runeDetails(id,true);}
      });
      upgrade.disabled=count<2;
      panel.append(upgrade);
    }
  }
  modal(panel);
}
function showRunes(from) {
  runeReturn=from;
  view('rune-book');
  renderRuneBook();
}
function renderRuneBook() {
  const available=unlockedRunes(cleared,wallet);
  const groups={wall:'guard',ward:'guard',mirror:'guard',heal:'heal',root:'heal',dawn:'heal',frost:'control',tide:'control',anchor:'control',spark:'attack',flame:'attack'};
  const filter=get('rune-filter').value;
  const tier=get('rune-rarity').value;
  const ids=Object.keys(groups).filter(id=>(filter==='all'||groups[id]===filter)&&(tier==='all'||rarity(id)===tier));
  get('rune-count').textContent=`已收錄 ${available.length} / ${Object.keys(groups).length} 枚・目前顯示 ${ids.length} 枚`;
  const entries=ids.map(id=>{
    const button=element('button','','rune-entry');
    const ownedRune=available.includes(id);
    button.append(runeImage(ownedRune?id:'locked'),element('strong',`${runes[id].name}・${rarity(id)}`),element('span',ownedRune?`Lv.${wallet.runeLevels?.[id]??1}・${loadout===id?'已裝備':'可裝備'}`:runes[id].source));
    button.onclick=()=>runeDetails(id,ownedRune);
    return button;
  });
  get('rune-book-grid').replaceChildren(...(entries.length?entries:[element('p','沒有符合篩選條件的符文。')]));
}
function renderRuneSlots() {
  const active=element('button');
  active.append(runeBadge(loadout,loadout==='none'?runes.none.name:`${runes[loadout].name}・Lv.${wallet.runeLevels?.[loadout]??1}`));
  active.onclick=()=>showRunes('lobby');
  const locked=element('span');
  locked.append(runeBadge('locked','後續章節'));
  get('rune-slots').replaceChildren(active,locked);
}
function cardFace(card, {lazy=false}={}) {
  const face=element('span','','card-face');
  const art=artwork(card.id,'card','face-art');
  if(lazy) art.loading='lazy';
  const frame=element('img','','face-frame');
  frame.src=asset('combat-card-frame');
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
function catalogCard(id) {
  const [name,count,attack,max,skill]=cards[id];
  const level=cardLevel(wallet,id);
  const bonus=level-1;
  return {id,name,count,attack:attack+bonus,max:max+bonus*2,hp:max+bonus*2,level,skill,shield:skill==='護盾'?2:0};
}
function money(kind,amount) {
  const item=element('span','','money');
  item.append(artwork(kind,'money'),element('span',`${kind==='gold'?'金幣':'鑽石'} ${amount}`));
  return item;
}
function renderWallet(node) {
  node.replaceChildren(money('gold',wallet.gold),money('gems',wallet.gems));
}
function cardDetail(card, canUpgrade=false) {
  const layout=element('div','','card-inspector');
  const info=element('div','','inspector-copy');
  info.append(element('h2',card.name),element('strong',card.skill||'普攻'),
    element('p', descriptions[card.skill] ?? '普攻正對欄位，空位直擊敵方英雄。'),
    element('p',`生命 ${card.hp}/${card.max}・護盾 ${card.shield}・倒數 ${card.count}`,'inspector-stats'));
  if(canUpgrade && owned().includes(card.id)) {
    const level=cardLevel(wallet,card.id);
    info.append(element('p',`等級 ${level} / ${maxLevel}・持有 ${wallet.gold} 金幣`));
    if(level<maxLevel) {
      const cost=levelCost(level);
      info.append(element('p',`升級後：攻擊 ${card.attack} → ${card.attack+1}・生命 ${card.max} → ${card.max+2}`));
      const button=element('button',`花 ${cost} 金幣強化`);
      button.disabled=wallet.gold<cost;
      button.onclick=()=>{
        const next=improveCard(wallet,card.id);
        if(!next) return;
        wallet=next;save();void unlock().then(()=>play('upgrade'));
        renderCollection();
        cardDetail(catalogCard(card.id),true);
        const upgraded=get('detail-content').querySelector('.card-face');
        if(!lowMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) upgraded.animate?.([{opacity:.65,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],300);
      };
      info.append(button);
    }
    info.append(confirmButton('加入編隊',()=>editDeck([...deck],0,card.id)));
  }
  layout.append(cardFace(card),info);
  modal(layout);
}
function encyclopediaCard(id) {
  const base=catalogCard(id);
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
  get('camp-resume').hidden=state?.phase!=='deploy';
  get('camp-progress').textContent=`第一章 ${cleared.size}/${stages.length}・收藏 ${owned().length} 張`;
  renderWallet(get('camp-wallet'));
}
let drawing=false;
let lastDraw=null;
let finishReveal;
function capsuleOptions() {
  const [currency,kind]=document.querySelector('input[name="summon-pool"]:checked').value.split(':');
  return {kind,currency};
}
function collectibleName(kind,id) {
  return kind==='hero'?heroes.find(hero=>hero.id===id).name:kind==='rune'?runes[id].name:cards[id][0];
}
function renderCapsule() {
  renderWallet(get('capsule-wallet'));
  const {kind,currency}=capsuleOptions();
  const pool=poolFor(kind,currency);
  const unit=currency==='gold'?'金幣':'鑽石';
  for(const [id,count] of [['draw-gems',1],['draw-ten',10]]) {
    const button=get(id);
    const cost=pullPrice(currency,count);
    button.textContent=`${count===10?'十連九折':'單抽'}・${cost} ${unit}`;
    button.disabled=drawing||!pool.length||wallet[currency]<cost;
  }
  const total=pool.reduce((sum,item)=>sum+item.weight,0);
  const odds=rarityNames.flatMap(tier=>{
    const weight=pool.filter(item=>rarity(item.id)===tier).reduce((sum,item)=>sum+item.weight,0);
    return weight?[`${tier} ${(weight*100/total).toFixed(2)}%`]:[];
  }).join('・');
  get('capsule-rules').textContent=pool.length?`每抽獨立機率　${odds}`:'英雄扭蛋只使用鑽石。';
  const list=document.createElement('details');
  list.append(element('summary','查看池內名單與個別機率'));
  for(const item of pool)list.append(element('p',`${collectibleName(kind,item.id)}・${rarity(item.id)}・${(item.weight*100/total).toFixed(2)}%`));
  get('capsule-rules').append(list);
  get('capsule-reveal').replaceChildren(element('p',drawing?'召喚中…':lastDraw?`上次召喚 ${lastDraw.length} 份，已入庫`:'選擇卡池後開始召喚'));
}
async function drawCapsule(count) {
  if(drawing)return;
  const {kind,currency}=capsuleOptions();
  const known=kind==='hero'?ownedHeroes():kind==='rune'?unlockedRunes(cleared,wallet):owned();
  const result=openBatch(wallet,kind,currency,count,Math.random,known);
  if(!result)return;
  const reduced=lowMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  drawing=true;wallet=result.wallet;lastDraw=result.draws;save();renderCapsule();
  void unlock().then(()=>{if(drawing)play('capsule');});
  const dialog=get('capsule-show'),body=get('capsule-show-body'),close=get('capsule-show-close');
  dialog.style.backgroundImage=`url("${asset('draw-'+(kind==='hero'?'hero':(currency==='gold'?'gold':'gem')+kind)+count)}")`;
  const intro=element('div','','draw-intro');
  const orbs=count===10?10:1;
  for(let i=0;i<orbs;i++) {
    const orb=element('img');
    orb.src=asset('capsule-orb');orb.alt='';
    intro.append(orb);
  }
  intro.dataset.count=String(count);
  body.replaceChildren(intro);
  close.textContent='跳過演出';
  dialog.showModal();
  if(!reduced) [...intro.children].forEach((orb,i)=>orb.animate?.([
    {opacity:0,transform:'translateY(24px) scale(.55)'},{opacity:1,transform:'translateY(-6px) scale(1)'},{opacity:.76,transform:'scale(1.08)'}
  ],{duration:850,delay:i*55,fill:'both'}));
  await new Promise(resolve=>{
    const timer=setTimeout(done,reduced?150:count===10?1600:1200);
    function done(){clearTimeout(timer);finishReveal=null;resolve();}
    finishReveal=done;
  });
  const grid=element('div','','draw-results');
  grid.dataset.count=String(count);
  const sorted=[...result.draws].sort((a,b)=>rarityNames.indexOf(rarity(b.id))-rarityNames.indexOf(rarity(a.id)));
  sorted.forEach(({id,duplicate},i)=>{
    const item=element('div','','draw-item');
    item.append(kind==='card'?cardFace(catalogCard(id)):kind==='rune'?runeImage(id):artwork(id,'hero'),
      element('strong',`${collectibleName(kind,id)}・${rarity(id)}`),element('small',duplicate?'同名 +1':'新取得'));
    grid.append(item);
    if(!reduced) item.animate?.([{opacity:0,transform:'rotateY(-65deg) scale(.82)'},{opacity:1,transform:'none'}],{duration:420,delay:i*55,fill:'both'});
  });
  body.replaceChildren(grid);
  close.textContent='收下';close.focus();
  drawing=false;renderCapsule();play('reveal');
}
get('camp-capsule').onclick=()=>{view('capsule');renderCapsule();changeMusic('capsule');};
get('capsule-back').onclick=()=>{showCamp();changeMusic('lobby');};
for(const input of document.querySelectorAll('input[name="summon-pool"]')) input.onchange=renderCapsule;
get('draw-gems').onclick=()=>drawCapsule(1);
get('draw-ten').onclick=()=>drawCapsule(10);
get('capsule-show-close').onclick=()=>finishReveal?finishReveal():get('capsule-show').close();
get('capsule-show').addEventListener('cancel',event=>{if(drawing){event.preventDefault();finishReveal?.();}});
get('rune-filter').onchange=renderRuneBook;
get('rune-rarity').onchange=renderRuneBook;
function showCollection(from='camp',bag=false) {
  albumReturn=from;
  bagOnly=bag;albumPage=0;
  get('collection-title').textContent=bag?'我的卡包':'卡牌圖鑑';
  get('collection-back').textContent=from==='results'?'回結算':'回營地';
  view('collection');
  renderCollection();
}
const albumCards=Object.keys(cards).filter(id=>id!=='boss' && id!=='spirit');
function cardGroup(id) {
  const skill=cards[id][4];
  if(skill==='護衛'||skill==='護盾'||skill==='守蔭') return 'guard';
  if(skill==='治療') return 'heal';
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
      button.onclick=()=>bagOnly?cardDetail(catalogCard(id),true):encyclopediaCard(id);
    } else {
      const back=element('img','','collectible-art');
      back.src=asset('album-card-back');
      back.alt='';
      button.append(back,element('span','尚未取得'));
      button.onclick=()=>encyclopediaCard(id);
    }
    const number=String(albumCards.indexOf(id)+1).padStart(3,'0');
    slot.append(button,element('small',bagOnly?`持有 ×${wallet.copies?.[id]??1}`:`No. ${number}`));
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
  const filtered=albumCards.filter(id=>(!bagOnly||collection.has(id))&&(filter==='all'||cardGroup(id)===filter)&&(tier==='all'||rarity(id)===tier));
  const pages=Math.max(1,Math.ceil(filtered.length/perLeaf));
  albumPage=Math.min(albumPage,pages-1);
  const spread=albumWide.matches?2:1;
  const first=albumPage-albumPage%spread;
  const end=Math.min(pages,first+spread);
  const book=get('album-pages');
  book.replaceChildren(...Array.from({length:end-first},(_,i)=>makeAlbumLeaf(first+i,collection,filtered)));
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
function turnAlbum(direction) {
  const button=get(direction>0?'album-next':'album-prev');
  if(button.disabled) return;
  albumPage+=direction*(albumWide.matches?2:1);
  renderCollection(direction);
}
const descriptions = {
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
    button.onclick=()=>heroDetails(hero,true);
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
  get('stages').replaceChildren(...stages.map((stage,index)=>{
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
function editDeck(draft=[...deck], active=0, preview=draft[active], category='all') {
  const grid=element('div','','deck-grid');
  const filter=element('select');
  filter.id='deck-card-category';
  for(const [value,name] of [['all','全部'],['attack','攻擊'],['guard','防護'],['heal','治療'],['support','支援']]) {
    const option=element('option',name);
    option.value=value;
    filter.append(option);
  }
  filter.value=category;
  filter.onchange=()=>editDeck(draft,active,preview,filter.value);
  const label=element('label','牌庫類別','catalog-filter');
  label.append(filter);
  for(const id of owned().filter(id=>category==='all'||cardGroup(id)===category)) {
    const position=draft.indexOf(id);
    const button=element('button');
    button.append(cardFace(catalogCard(id)));
    button.setAttribute('aria-pressed',String(preview===id));
    if(position>=0) button.append(element('small',`在隊中・第 ${position+1} 張`));
    button.onclick=()=>{
      editDeck(draft,active,id,category);
      get('detail').querySelector('.deck-card-preview').scrollIntoView({block:'nearest'});
    };
    grid.append(button);
  }
  const slots=element('div','','deck-order');
  for(const [index,id] of draft.entries()) {
    const slot=element('button');
    slot.append(cardFace(catalogCard(id)),element('small',index<3?`起手 ${index+1}`:`第 ${index+1} 張`));
    slot.setAttribute('aria-pressed',String(index===active));
    slot.onclick=()=>editDeck(draft,index,draft[index],category);
    slots.append(slot);
  }
  const apply=element('button','儲存編隊');
  apply.onclick=()=>{deck=[...draft];save();get('detail').close();};
  const layout=element('div','','deck-workbench');
  const summary=element('aside','','deck-summary');
  const hero=heroes.find(h=>h.id===chosen);
  const totals=draft.map(catalogCard).reduce((sum,card)=>[sum[0]+card.attack,sum[1]+card.hp],[0,0]);
  summary.append(teamSelect(null,()=>editDeck()),artwork(hero.id,'hero'),element('h2',hero.name),
    element('p',`總攻擊 ${totals[0]}・總生命 ${totals[1]}`),
    runeBadge(loadout,runes[loadout].name),apply);
  const body=element('section');
  const candidate=catalogCard(preview);
  const current=catalogCard(draft[active]);
  const info=element('section','','deck-card-preview');
  const copy=element('div');
  const position=draft.indexOf(preview);
  const change=element('button',position>=0?`交換第 ${active+1}、${position+1} 張`:`換入第 ${active+1} 張`);
  change.disabled=preview===draft[active];
  change.onclick=()=>{
    const next=[...draft];
    next[active]=preview;
    if(position>=0) next[position]=draft[active];
    editDeck(next,active,next[active],category);
  };
  copy.append(element('h3',candidate.name),element('p',`攻擊 ${candidate.attack}・生命 ${candidate.max}・初始護盾 ${candidate.shield}・倒數 ${candidate.count}`),
    element('p',`${candidate.skill||'普攻'}｜${descriptions[candidate.skill]??'普攻正對欄位，空位直擊敵方英雄。'}`),
    element('p',`第 ${active+1} 張現用 ${current.name}：攻擊 ${current.attack}・生命 ${current.max}・倒數 ${current.count}`),change);
  info.append(cardFace(candidate),copy);
  body.append(element('h2','出戰卡組 8 / 8'),slots,info,label,grid);
  layout.append(summary,body);
  modal(layout);
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
      const node = element(card ? 'button' : 'div','','slot');
      node.dataset.slot=`${side}:${index}`;
      if (card) {
        node.append(cardFace({...card,count:0}));
        node.onclick=()=>cardDetail(card);
      } else {
        node.classList.add('empty-slot');
        const socket=element('img','','slot-art');
        socket.src=asset('table-slot');
        socket.alt='';
        node.append(socket,element('b',side===0 && selected!==null && index===next?'部署位置':'空位'));
      }
      if (!event && selected !== null && index===next) node.classList.add('preview');
      return node;
    };
    lane.append(slot(1),element('span',`第 ${index+1} 欄`),slot(0));
    return lane;
  }));
  field.scrollLeft = scroll;
  get('health').textContent = `${player.hp} 生命${frame.heroShield ? ' ◆'+frame.heroShield : ''}`;
  get('enemy-health').textContent = `${enemy.hp} 生命`;
  get('round').textContent = `第 ${frame.round} 回合`;
  const spent=state.rune!=='none' && frame.charges===0;
  get('rune-status').replaceChildren(runeBadge(state.rune,state.rune==='none'?'未裝備':`${runes[state.rune].name} ${frame.charges} 次`,spent?'spent':state.rune));
  const boss=enemy.board.findIndex(card=>card?.id==='boss');
  get('forecast').textContent=boss>=0?`斷橋守將在第 ${boss+1} 欄。橫掃會波及兩側。`:stages[state.stage].goal;
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
}
function effect(event) {
  if(event.rune) return 'rune-pulse';
  if (event.kind==='skill') return event.message.includes('自爆')?'fx-bomb':event.message.includes('靈體')?'fx-spirit':event.message.includes('治療')||event.message.includes('回春')?'fx-heal':'fx-shield';
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
  const reward=state.result==='勝利' && !cleared.has(state.stage) ? stages[state.stage].reward : null;
  if(reward) {
    const hero=heroMilestones[state.stage];
    const duplicate=ownedHeroes().includes(hero);
    const count=wallet.heroCopies?.[hero]??(duplicate?1:0);
    wallet={...wallet,heroCopies:{...wallet.heroCopies,[hero]:count+1}};
    state.heroReward={id:hero,duplicate};
    cleared.add(state.stage);
  }
  if(state.result) state.resultReward=reward;
  if(state.result==='勝利') {
    const pay=victoryPay(Boolean(reward));
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
    play(event.kind,state.hero);
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
  get('result-stage').textContent=stages[state.stage].name;
  get('result-next').hidden=state.result!=='勝利' || state.stage+1>=stages.length;
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
    card.append(cardFace(catalogCard(reward)));
    card.onclick=()=>cardDetail(catalogCard(reward));
    summary.append(element('h2','首通獎勵已入冊'),card);
  }
  get('result-content').replaceChildren(summary);
  get('result-title').focus();
  changeMusic(state.result==='勝利'?'end':'loss');
}
function rewardRune() { return state.resultReward?['ward','frost','flame','spark'][state.stage]:null; }
get('result-camp').onclick=()=>{showCamp();changeMusic('lobby');};
get('result-deck').onclick=()=>{stageIndex=state.stage;lobby();changeMusic('lobby');editDeck();};
get('result-retry').onclick=()=>{stageIndex=state.stage;enter(true);};
get('result-next').onclick=()=>{stageIndex=state.stage+1;lobby();changeMusic('lobby');};
get('result-album').onclick=()=>showCollection('results');
async function enter(restart) {
  if(!restart && state?.phase!=='deploy') return;
  if(restart) {
    state=createBattle(loadout,chosen,stageIndex,deck,wallet.levels,wallet.heroLevels?.[chosen]??1,wallet.runeLevels?.[loadout]??1);
    log=[];
    selected=null;
    save();
  }
  view('battle');
  get('hero-cut-in-art').src=asset(`hero-cast-${state.hero}`);
  render();
  await unlock();
  prepare(state.hero);
  changeMusic(state.stage===3?'boss':'battle');
}
function changeMusic(scene) { audioScene=scene; setMusic(scene); }
get('start').onclick=()=>enter(true);
get('resume').onclick=()=>enter(false);
get('back').onclick=()=>{lobby();changeMusic('lobby');};
get('attack').onclick=()=>act({type:'attack'});
get('deploy').onclick=()=>act({type:'deploy',uid:selected});
get('speed').onchange=save;
get('mute').onclick=()=>{get('mute').textContent=toggleMute()?'開聲音':'靜音';};
get('report').onclick=()=>modal(element('h2','戰報'),...log.slice(-40).reverse().map(line=>element('p',line)));
get('deck').onclick=()=>editDeck();
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
      const summary=`第一章已通過 ${imported.cleared.length}/4 關・收藏 ${8+imported.cleared.length} 張・${imported.state?.phase==='deploy'?'含未完戰鬥':'無未完戰鬥'}`;
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
get('campaign-prepare').onclick=lobby;
get('campaign-fight').onclick=()=>enter(true);
get('campaign-back').onclick=showCamp;
get('title-start').onclick=async()=>{if(starterHero)showCamp();else showStarter();await unlock();changeMusic('lobby');};
get('title-resume').onclick=()=>enter(false);
get('camp-runes').onclick=()=>showRunes('camp');
get('rune-back').onclick=()=>runeReturn==='lobby'?lobby():showCamp();
get('camp-deck').onclick=()=>editDeck();
get('camp-collection').onclick=()=>showCollection();
get('camp-bag').onclick=()=>showCollection('camp',true);
get('camp-heroes').onclick=showHeroes;
get('hero-book-back').onclick=showCamp;
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
get('camp-backup').onclick=backupPanel;
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
