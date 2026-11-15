import {applyAction, cards, createBattle, stages, starter} from './battle.mjs';
import {heroes} from './heroes.mjs';
import {unlock, prepare, play, setMusic, toggleMute, updateVolume} from './audio.mjs';
import {makeBackup, readBackup} from './backup.mjs';

const get = id => document.getElementById(id);
const asset = name => globalThis.riftArtwork?.[name] ?? `art/${name}.webp`;
const key = 'cxq-rift-summon-visual-slice';
const recoveryKey = key + '-recovery';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
let state = saved?.state?.version === 3 ? saved.state : null;
let log = state ? saved?.log ?? [] : [];
const cleared = new Set(Array.isArray(saved?.cleared) ? saved.cleared.filter(index => stages[index]) : []);
const owned = () => [...starter,...stages.filter((_,index)=>cleared.has(index)).map(stage=>stage.reward)];
let deck = Array.isArray(saved?.deck) && saved.deck.length === 8 && new Set(saved.deck).size === 8 && saved.deck.every(id=>owned().includes(id)) ? saved.deck : [...starter];
let stageIndex = state?.stage ?? Math.min(cleared.size, stages.length-1);
let chosen = state?.hero || 'trust';
let selected = null;
let playing = false;
let playback = 0;
let audioScene = null;
let volumes = saved?.volumes ?? {sfx:.65,bgm:.17};
updateVolume(volumes);
get('speed').value = saved?.speed ?? '1';

function currentSave() { return {state, log, deck, cleared:[...cleared], volumes, speed:get('speed').value}; }
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
  img.src = asset(`${type}-${id}`);
  img.alt = '';
  img.draggable = false;
  return img;
}
function modal(...children) {
  get('detail-content').replaceChildren(...children);
  if (!get('detail').open) get('detail').showModal();
}
function cardDetail(card) {
  modal(artwork(card.id),element('h2',card.name),element('p',`${card.attack} 攻擊 · ${card.hp}/${card.max} 生命 · ${card.shield} 護盾`),
    element('p', descriptions[card.skill] ?? '普攻正對欄位，空位直擊敵方英雄。'));
}
function showCamp() {
  playback++;
  playing=false;
  get('battle').hidden=true;
  get('lobby').hidden=true;
  get('camp').hidden=false;
  get('camp-resume').hidden=!state || state.phase==='end';
  get('camp-progress').textContent=`裂界營地・戰役 ${cleared.size}/${stages.length}・收藏 ${owned().length} 張`;
}
function showCollection() {
  const grid=element('div','','deck-grid');
  for(const [id,[name,count,attack,max,skill]] of Object.entries(cards)) {
    if (id==='boss' || id==='spirit') continue;
    const available=owned().includes(id);
    const button=element('button');
    button.append(artwork(id),element('span',available?name:`${name}・未取得`));
    button.onclick=()=>cardDetail({id,name,attack,hp:max,max,shield:skill==='護盾'?2:0,count,skill});
    grid.append(button);
  }
  modal(element('h2',`角色收藏 ${owned().length}/${Object.keys(cards).length-2}`),grid);
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
  get('battle').hidden = true;
  get('camp').hidden = true;
  get('lobby').hidden = false;
  get('resume').hidden = !state || state.phase === 'end';
  get('heroes').replaceChildren(...heroes.map(hero => {
    const button = element('button');
    button.append(artwork(hero.id,'hero'),element('span',hero.name));
    button.setAttribute('aria-pressed',String(chosen === hero.id));
    button.onclick = async () => {
      chosen = hero.id;
      lobby();
      await unlock();
      play('deploy');
    };
    return button;
  }));
  const hero=heroes.find(h=>h.id===chosen);
  get('hero-detail').textContent=`${hero.name}｜${hero.skill}｜${hero.detail}`;
  get('stages').replaceChildren(...stages.map((stage,index)=>{
    const open=index===0 || cleared.has(index-1);
    const button=element('button',`${stage.name}${cleared.has(index)?' ✓':open?'':'・未解鎖'}`);
    button.disabled=!open;
    button.setAttribute('aria-pressed',String(stageIndex===index));
    button.onclick=()=>{stageIndex=index;lobby();};
    return button;
  }));
  const stage=stages[stageIndex];
  get('stage-detail').textContent=`${stage.goal} 首通取得：${cards[stage.reward][0]}。`;
}
function editDeck(draft=[...deck]) {
  const grid=element('div','','deck-grid');
  for(const id of owned()) {
    const position=draft.indexOf(id);
    const button=element('button');
    button.append(artwork(id),element('span',`${position>=0?(position+1)+'・':''}${cards[id][0]}`));
    button.setAttribute('aria-pressed',String(position>=0));
    button.disabled=position<0 && draft.length>=8;
    button.onclick=()=>editDeck(position>=0?draft.filter(card=>card!==id):[...draft,id]);
    grid.append(button);
  }
  const apply=element('button','儲存編隊');
  apply.disabled=draft.length!==8;
  apply.onclick=()=>{deck=[...draft];save();get('detail').close();};
  modal(element('h2',`編隊 ${draft.length}/8`),element('p','點一下移除，再點收藏中的牌加入。前三張是本章的練習起手。'),grid,apply);
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
        node.append(artwork(card.id,'card','card-art'),element('b',`${card.name} ${card.attack}/${card.hp}${card.shield ? ' ◆'+card.shield : ''}`));
        node.onclick=()=>cardDetail(card);
      } else node.append(element('b','空位'));
      if (!event && selected !== null && index===next) node.classList.add('preview');
      return node;
    };
    lane.append(slot(1),element('span',`第 ${index+1} 欄`),slot(0));
    return lane;
  }));
  field.scrollLeft = scroll;
  get('health').textContent = `${player.hp} 生命${frame.heroShield ? ' ◆'+frame.heroShield : ''}`;
  get('enemy-health').textContent = `敵方英雄 ${enemy.hp}`;
  get('round').textContent = `第 ${frame.round} 回合`;
  get('rune-status').textContent = `${state.rune==='wall'?'鐵壁':'回春'} ${frame.charges} 次`;
  const boss=enemy.board.findIndex(card=>card?.id==='boss');
  get('forecast').textContent=boss>=0?`斷橋守將在第 ${boss+1} 欄。橫掃會波及兩側。`:stages[state.stage].goal;
}
function render() {
  const [player,enemy]=state.sides;
  renderBoard(state);
  const current=heroes.find(hero=>hero.id===state.hero);
  get('portrait').src=asset(`hero-${current.id}`);
  get('hero-name').textContent=current.name;
  get('hero-name').onclick=()=>modal(artwork(current.id,'hero'),element('h2',current.skill),element('p',current.detail));
  const card=player.hand.find(item=>item.uid===selected);
  get('hand').replaceChildren(...player.hand.map(item=>{
    const button=element('button');
    button.append(artwork(item.id),element('span',`${item.name}｜${item.count?`倒數 ${item.count}`:'就緒'}`));
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
  get('message').textContent=state.result ?? (card?
    `${card.name}將部署至第 ${player.board.length+1} 欄・${enemy.board[player.board.length]?.name ?? '空位，可直擊英雄'}`:
    '點就緒手牌預覽部署；再點同一張看技能。');
  get('deploy').disabled=playing || !card || Boolean(card.count) || state.phase==='end';
  get('attack').disabled=playing || state.phase==='end';
}
function effect(event) {
  if (event.kind==='hero') return `hero-${state.hero}`;
  if (event.kind==='skill') return event.message.includes('自爆')?'fx-bomb':event.message.includes('靈體')?'fx-spirit':event.message.includes('治療')||event.message.includes('回春')?'fx-heal':'fx-shield';
  if (event.kind==='attack') return event.message.includes('橫掃')?'fx-ax':event.message.includes('斥候')?'fx-arrow':'fx-ax';
  if (event.kind==='deploy') return 'fx-rune';
  if (event.kind==='death') return 'fx-spirit';
  return 'fx-shield';
}
const duration = kind => (kind==='hero'?680:kind==='round'?180:380)/Number(get('speed').value);
async function act(action) {
  if (playing) return;
  const update=applyAction(state,action);
  if (!update) return;
  state=update.state;
  const reward=state.result==='勝利' && !cleared.has(state.stage) ? stages[state.stage].reward : null;
  if(reward) cleared.add(state.stage);
  log=[...log,...update.events.map(({message})=>message)].slice(-150);
  selected=null;
  save();
  playing=true;
  const token=++playback;
  for(const button of get('hand').querySelectorAll('button')) button.disabled=true;
  get('attack').disabled=true;
  get('deploy').disabled=true;
  for(const event of update.events) {
    if(token!==playback) return;
    if(document.hidden) break;
    renderBoard(event.frame,event);
    get('message').textContent=event.message;
    play(event.kind);
    const ms=duration(event.kind);
    let cutIn;
    if(event.kind==='hero') {
      cutIn=artwork(state.hero,'cast','cut-in');
      get('battle').append(cutIn);
      cutIn.animate([{opacity:0},{opacity:1,offset:.22},{opacity:1,offset:.8},{opacity:0}],ms);
    }
    const origin=get('lanes').querySelector(`[data-slot="${event.actor}:${event.origin}"]`);
    if(origin && !matchMedia('(prefers-reduced-motion: reduce)').matches) origin.animate(
      [{transform:'translateY(0)'},{transform:`translateY(${event.actor===0?-9:9}px)`},{transform:'translateY(0)'}],ms);
    const frameAnimations=[];
    for(const lane of event.lanes??[]) {
      const slot=lane===null?(event.target===0?get('health'):get('enemy-health')):get('lanes').querySelector(`[data-slot="${event.target}:${lane}"]`);
      if(!slot) continue;
      if(lane===null) {slot.animate([{opacity:.45},{opacity:1}],ms);continue;}
      const img=element('img','','effect');
      const art=effect(event);
      const series=['fx-ax','fx-bomb','fx-spirit'].includes(art) ? art.slice(3) : null;
      img.src=asset(series?`frame-${series}0`:art);
      img.alt='';
      slot.append(img);
      if(series) frameAnimations.push({img,series});
      if(event.kind==='hit') slot.append(element('i',event.message.split('：').at(-1)));
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches) img.animate([{opacity:0,transform:'scale(.65)'},{opacity:1},{opacity:0,transform:'scale(1.18)'}],ms);
    }
    for(let step=1;step<=4;step++) {
      await new Promise(resolve=>setTimeout(resolve,ms/4));
      if(step<4 && token===playback) {
        for(const {img,series} of frameAnimations) img.src=asset(`frame-${series}${step}`);
      }
    }
    cutIn?.remove();
  }
  if(token!==playback) return;
  playing=false;
  render();
  if(state.result) {
    changeMusic(state.result==='勝利'?'end':'loss');
    const current=heroes.find(h=>h.id===state.hero);
    const ending=artwork(current.id,'hero');
    ending.src=asset(`${state.result==='勝利'?'win':state.result==='敗北'?'loss':'hero'}-${current.id}`);
    const message=reward?`首通獲得 ${cards[reward][0]}。可回編隊把它加入牌組。`:'可回編隊，換英雄或符文再挑戰。';
    if(reward) {
      stageIndex=Math.min(state.stage+1,stages.length-1);
      modal(ending,element('h2',state.result),artwork(reward),element('p',message));
    } else modal(ending,element('h2',state.result),element('p',message));
  }
}
async function enter(restart) {
  if(restart) {
    state=createBattle(get('rune').value,chosen,stageIndex,deck);
    log=[];
    selected=null;
    save();
  }
  get('lobby').hidden=true;
  get('camp').hidden=true;
  get('battle').hidden=false;
  render();
  await unlock();
  prepare();
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
get('camp-campaign').onclick=async()=>{lobby();await unlock();changeMusic('lobby');};
get('camp-deck').onclick=()=>editDeck();
get('camp-collection').onclick=showCollection;
get('camp-resume').onclick=()=>enter(false);
get('return-camp').onclick=showCamp;
get('camp-options').onclick=()=>get('options').click();
get('camp-backup').onclick=backupPanel;
get('options').onclick=()=>{
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
  modal(element('h2','聲音設定'),slider('bgm','背景音樂'),slider('sfx','音效'));
};
get('rune-status').onclick=()=>modal(element('h2',get('rune-status').textContent),element('p',state.rune==='wall'?'開始攻擊時，替正面有敵軍、半血以下且無盾的角色加 2 盾。':'開始攻擊時，替半血以下且至少缺 3 血的角色回復 3 血。'));
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && audioScene && audioScene!=='end' && audioScene!=='loss') setMusic(audioScene);
});
showCamp();
