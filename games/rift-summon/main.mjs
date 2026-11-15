import {applyAction, cards, createBattle, stages, starter} from './battle.mjs?v=capsule-1';
import {heroes} from './heroes.mjs';
import {unlock, prepare, play, setMusic, toggleMute, updateVolume} from './audio.mjs?v=capsule-1';
import {makeBackup, readBackup} from './backup.mjs?v=capsule-1';
import {startingWallet,validWallet,prices,cardLevel,maxLevel,levelCost,victoryPay,unlockedRunes,openCapsule,improveCard} from './economy.mjs';

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
  none:{name:'未裝備',effect:'這場戰鬥不會觸發符文。'},
};
const savedRune=saved?.loadout??state?.rune;
let loadout=savedRune==='none'||unlockedRunes(cleared).includes(savedRune)?savedRune:'wall';
let runeReturn='camp';
let settingsReturn='camp';
let albumReturn='camp';
let lowMotion=saved?.lowMotion===true;
updateVolume(volumes);
get('speed').value = saved?.speed ?? '1';

function currentSave() {
  const ongoing=state?.phase==='deploy';
  return {state:ongoing?state:null, log:ongoing?log:[], deck, cleared:[...cleared], volumes, loadout, lowMotion, wallet, speed:get('speed').value};
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
  for(const page of ['title-screen','camp','rune-book','capsule','campaign','settings-page','collection','lobby','battle','results']) get(page).hidden=page!==id;
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
  const panel=element('div','','rune-detail');
  panel.append(runeImage(id),element('h2',rune.name),element('p',rune.effect),
    element('p',id==='none'?'可從符文冊裝備。':`每場 2 次・${rune.source??'初始符文'}`));
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
  }
  modal(panel);
}
function showRunes(from) {
  runeReturn=from;
  view('rune-book');
  renderRuneBook();
}
function renderRuneBook() {
  const available=unlockedRunes(cleared);
  get('rune-count').textContent=`已收錄 ${available.length} / 4 枚`;
  const entries=['wall','heal','frost','spark'].map(id=>{
    const button=element('button','','rune-entry');
    const ownedRune=available.includes(id);
    button.append(runeImage(ownedRune?id:'locked'),element('strong',runes[id].name),element('span',ownedRune?(loadout===id?'已裝備・2 次':'可裝備・2 次'):runes[id].source));
    button.onclick=()=>runeDetails(id,ownedRune);
    return button;
  });
  get('rune-book-grid').replaceChildren(...entries);
}
function renderRuneSlots() {
  const active=element('button');
  active.append(runeBadge(loadout,runes[loadout].name));
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
  }
  layout.append(cardFace(card),info);
  modal(layout);
}
function showCamp() {
  playback++;
  playing=false;
  get('hero-cut-in').hidden=true;
  view('camp');
  get('camp-resume').hidden=state?.phase!=='deploy';
  get('camp-progress').textContent=`裂界營地・戰役 ${cleared.size}/${stages.length}・收藏 ${owned().length} 張`;
  renderWallet(get('camp-wallet'));
}
let drawing=false;
let lastDraw=null;
function renderCapsule() {
  renderWallet(get('capsule-wallet'));
  for(const kind of Object.keys(prices)) {
    const button=get('draw-'+kind);
    button.textContent=`${kind==='gold'?'金幣':'鑽石'}抽卡・${prices[kind]}`;
    button.disabled=drawing || wallet[kind]<prices[kind];
  }
  const reveal=get('capsule-reveal');
  if(drawing) {
    const back=element('img','','capsule-back');
    back.src=asset('capsule-orb');
    back.alt='召喚中';
    reveal.replaceChildren(back,element('p','召喚中…'));
    if(!lowMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) back.animate?.([{transform:'translateY(14px) scale(.7) rotate(-18deg)'},{transform:'translateY(-10px) scale(1) rotate(22deg)'},{transform:'translateY(0) scale(1.13)',opacity:.3}],780);
  } else if(lastDraw) {
    const card=catalogCard(lastDraw.id);
    const button=element('button','','capsule-card');
    button.append(cardFace(card));
    button.onclick=()=>cardDetail(card);
    reveal.replaceChildren(button,element('p',lastDraw.duplicate?`重複卡・轉為 ${lastDraw.refund} 金幣`:'新卡已入冊'));
  } else reveal.replaceChildren(element('p','選擇貨幣開始召喚'));
}
async function drawCapsule(kind) {
  if(drawing) return;
  const result=openCapsule(wallet,kind);
  if(!result) return;
  void unlock().then(()=>{if(drawing&&!get('capsule').hidden) play('capsule');});
  drawing=true;
  wallet=result.wallet;
  lastDraw=result;
  save();
  renderCapsule();
  await new Promise(resolve=>setTimeout(resolve,lowMotion||matchMedia('(prefers-reduced-motion: reduce)').matches?120:820));
  drawing=false;
  renderCapsule();
  if(!get('capsule').hidden) play(result.duplicate?'coin':'reveal');
}
get('camp-capsule').onclick=()=>{view('capsule');renderCapsule();changeMusic('capsule');};
get('capsule-back').onclick=()=>{showCamp();changeMusic('lobby');};
get('draw-gold').onclick=()=>drawCapsule('gold');
get('draw-gems').onclick=()=>drawCapsule('gems');
function showCollection(from='camp') {
  albumReturn=from;
  get('collection-back').textContent=from==='results'?'回結算':'回營地';
  view('collection');
  renderCollection();
}
const albumCards=Object.keys(cards).filter(id=>id!=='boss' && id!=='spirit');
const perLeaf=6;
const albumWide=matchMedia('(min-width: 700px) and (orientation: landscape) and (pointer: fine)');
let albumPage=0;
function makeAlbumLeaf(page,collection) {
  const leaf=element('article','','album-leaf');
  const header=element('header');
  const ids=albumCards.slice(page*perLeaf,(page+1)*perLeaf);
  header.append(element('h2',`第 ${page+1} 頁`),element('span',`${ids.filter(id=>collection.has(id)).length}/${ids.length}`));
  const grid=element('div','','album-grid');
  for(const [offset,id] of ids.entries()) {
    const [name]=cards[id];
    const available=collection.has(id);
    const slot=element('div','','album-slot');
    const button=element('button','','collectible');
    if(available) {
      button.append(cardFace(catalogCard(id),{lazy:true}));
      button.onclick=()=>cardDetail(catalogCard(id),true);
    } else {
      const back=element('img','','collectible-art');
      back.src=asset('album-card-back');
      back.alt='';
      button.append(back,element('span','尚未取得'));
      const stage=stages.find(level=>level.reward===id);
      button.onclick=()=>modal(element('h2',name),element('p',stage?`首通「${stage.name}」後取得。`:'可從金幣或鑽石扭蛋取得。'));
    }
    const number=String(page*perLeaf+offset+1).padStart(3,'0');
    slot.append(button,element('small',`No. ${number}`));
    grid.append(slot);
  }
  leaf.append(header,grid);
  return leaf;
}
function renderCollection(direction=0) {
  renderWallet(get('album-wallet'));
  const collection=new Set(owned());
  const pages=Math.ceil(albumCards.length/perLeaf);
  const spread=albumWide.matches?2:1;
  const first=albumPage-albumPage%spread;
  const end=Math.min(pages,first+spread);
  const book=get('album-pages');
  book.replaceChildren(...Array.from({length:end-first},(_,i)=>makeAlbumLeaf(first+i,collection)));
  get('collection-count').textContent=`已收錄 ${collection.size} / ${albumCards.length} 張`;
  get('album-position').textContent=`第 ${first+1===end?end:`${first+1}–${end}`} / ${pages} 頁`;
  get('album-prev').disabled=first===0;
  get('album-next').disabled=end===pages;
  if(direction && !lowMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    book.animate([{opacity:.45,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'translateX(0)'}],220);
  }
}
function turnAlbum(direction) {
  const button=get(direction>0?'album-next':'album-prev');
  if(button.disabled) return;
  albumPage+=direction*(albumWide.matches?2:1);
  renderCollection(direction);
}
const descriptions = {
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
  get('resume').hidden = !state || state.phase === 'end';
  const roster=get('heroes');
  const scroll=roster.scrollLeft;
  roster.replaceChildren(...heroes.map(hero => {
    const button = element('button');
    const portrait=artwork(hero.id,'hero');
    portrait.loading='lazy';
    button.append(portrait,element('span',hero.name));
    button.setAttribute('aria-pressed',String(chosen === hero.id));
    button.onclick = async () => {
      chosen = hero.id;
      for(const child of roster.children) child.setAttribute('aria-pressed',String(child===button));
      showHeroPreview();
      await unlock();
      play('deploy');
    };
    return button;
  }));
  roster.scrollLeft=scroll;
  showHeroPreview();
  get('battle-plan').textContent=stages[stageIndex].name;
  renderRuneSlots();
}
function showCampaign() {
  view('campaign');
  get('stages').replaceChildren(...stages.map((stage,index)=>{
    const open=index===0 || cleared.has(index-1);
    const button=element('button',`${stage.name}${cleared.has(index)?' ✓':open?'':'・未解鎖'}`);
    button.disabled=!open;
    button.setAttribute('aria-pressed',String(stageIndex===index));
    button.onclick=()=>{stageIndex=index;showCampaign();};
    return button;
  }));
  const stage=stages[stageIndex];
  get('stage-detail').textContent=`${stage.goal} 首通取得：${cards[stage.reward][0]}。`;
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
function editDeck(draft=[...deck], active=0, preview=draft[active]) {
  const grid=element('div','','deck-grid');
  for(const id of owned()) {
    const position=draft.indexOf(id);
    const button=element('button');
    button.append(cardFace(catalogCard(id)));
    button.setAttribute('aria-pressed',String(preview===id));
    if(position>=0) button.append(element('small',`在隊中・第 ${position+1} 張`));
    button.onclick=()=>{
      editDeck(draft,active,id);
      get('detail').querySelector('.deck-card-preview').scrollIntoView({block:'nearest'});
    };
    grid.append(button);
  }
  const slots=element('div','','deck-order');
  for(const [index,id] of draft.entries()) {
    const slot=element('button');
    slot.append(cardFace(catalogCard(id)),element('small',index<3?`起手 ${index+1}`:`第 ${index+1} 張`));
    slot.setAttribute('aria-pressed',String(index===active));
    slot.onclick=()=>editDeck(draft,index);
    slots.append(slot);
  }
  const apply=element('button','儲存編隊');
  apply.onclick=()=>{deck=[...draft];save();get('detail').close();};
  const layout=element('div','','deck-workbench');
  const summary=element('aside','','deck-summary');
  const hero=heroes.find(h=>h.id===chosen);
  const totals=draft.map(catalogCard).reduce((sum,card)=>[sum[0]+card.attack,sum[1]+card.hp],[0,0]);
  summary.append(artwork(hero.id,'hero'),element('h2',hero.name),
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
    editDeck(next,active);
  };
  copy.append(element('h3',candidate.name),element('p',`攻擊 ${candidate.attack}・生命 ${candidate.max}・初始護盾 ${candidate.shield}・倒數 ${candidate.count}`),
    element('p',`${candidate.skill||'普攻'}｜${descriptions[candidate.skill]??'普攻正對欄位，空位直擊敵方英雄。'}`),
    element('p',`第 ${active+1} 張現用 ${current.name}：攻擊 ${current.attack}・生命 ${current.max}・倒數 ${current.count}`),change);
  info.append(cardFace(candidate),copy);
  body.append(element('h2','出戰卡組 8 / 8'),slots,info,element('h3','可用卡牌'),grid);
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
  if(reward) cleared.add(state.stage);
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
function rewardRune() {
  return !state.resultReward?null:state.stage===1?'frost':state.stage===3?'spark':null;
}
get('result-camp').onclick=()=>{showCamp();changeMusic('lobby');};
get('result-deck').onclick=()=>{stageIndex=state.stage;lobby();changeMusic('lobby');editDeck();};
get('result-retry').onclick=()=>{stageIndex=state.stage;enter(true);};
get('result-next').onclick=()=>{stageIndex=state.stage+1;lobby();changeMusic('lobby');};
get('result-album').onclick=()=>showCollection('results');
async function enter(restart) {
  if(!restart && state?.phase!=='deploy') return;
  if(restart) {
    state=createBattle(loadout,chosen,stageIndex,deck,wallet.levels);
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
get('campaign-back').onclick=showCamp;
get('title-start').onclick=async()=>{showCamp();await unlock();changeMusic('lobby');};
get('title-resume').onclick=()=>enter(false);
get('camp-runes').onclick=()=>showRunes('camp');
get('rune-back').onclick=()=>runeReturn==='lobby'?lobby():showCamp();
get('camp-deck').onclick=()=>editDeck();
get('camp-collection').onclick=()=>showCollection();
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
