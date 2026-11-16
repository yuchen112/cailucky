export const cards = {
  guard: ['壁壘衛士', 1, 2, 7, '護衛'],
  bomb: ['爆燈兵', 1, 2, 3, '自爆'],
  archer: ['荒牙斥候', 1, 2, 4, '追獵'],
  ax: ['重斧兵', 2, 4, 6, '橫掃'],
  ghost: ['守墓人', 2, 2, 5, '亡靈接替'],
  healer: ['提燈祭司', 2, 2, 5, '治療'],
  knight: ['守關騎士', 2, 3, 6, '護盾'],
  giant: ['鐵鑄巨像', 4, 6, 10, ''],
  bow: ['盾弓手', 1, 2, 5, '護盾'],
  fang: ['裂爪獸', 1, 3, 3, '追獵'],
  flag: ['軍旗手', 2, 2, 6, '護衛'],
  moon: ['夜燈醫者', 2, 3, 4, '治療'],
  ember: ['燼尾劍客', 1, 3, 4, '追獵'],
  wisp: ['星燈羽術師', 2, 3, 5, '治療'],
  turtle: ['苔殼盾衛', 2, 2, 8, '護衛'],
  raven: ['月刃夜鴉', 2, 4, 4, '橫掃'],
  stag: ['苔角靈鹿', 2, 2, 7, '護盾'],
  lynx: ['銀刃夜猞', 1, 3, 4, '追獵'],
  moth: ['微光蛾巫', 2, 2, 6, '治療'],
  drake: ['銅焰幼龍', 3, 5, 6, '橫掃'],
  ibis: ['赤羽弓衛', 1, 4, 3, '追獵'],
  hare: ['花籃兔醫', 1, 1, 5, '治療'],
  otter: ['藍溪盾獺', 2, 3, 6, '護盾'],
  ram: ['崖角斧羊', 3, 5, 7, '橫掃'],
  bat: ['紫翼引魂者', 1, 1, 4, '亡靈接替'],
  beetle: ['琥珀爆甲', 2, 3, 5, '自爆'],
  crane: ['玉燈白鶴', 3, 3, 8, '治療'],
  yak: ['岩盾犛牛', 3, 3, 9, '護衛'],
  seal: ['霜紋海豹', 1, 2, 4, '追獵'],
  boar: ['鐵鬃守衛', 2, 2, 7, '護盾'],
  swan: ['銀翼司祭', 2, 3, 6, '治療'],
  crab: ['熔殼焰蟹', 1, 2, 3, '自爆'],
  gecko: ['壁行引魂者', 1, 1, 3, '亡靈接替'],
  wolf: ['月斧狼騎', 3, 5, 6, '破甲'],
  panda: ['竹葉藥師', 1, 1, 4, '治療'],
  hedgehog: ['橡果刺衛', 1, 1, 5, '守蔭'],
  koi: ['碧波鯉術師', 2, 3, 6, '亡靈接替'],
  falcon: ['白隼追獵者', 1, 4, 3, '追獵'],
  mole: ['地穴爆破手', 2, 3, 4, '自爆'],
  lion: ['曜鬃獅統領', 3, 5, 7, '戰吼'],
  badger: ['岩弩獾兵', 2, 3, 5, '破甲'],
  lynxguard: ['霧銀猞衛', 2, 2, 8, '護衛'],
  robin: ['紅翎醫使', 1, 1, 4, '援護'],
  frog: ['翠沼藥師', 2, 2, 6, '治療'],
  yakfire: ['赤角火騎', 3, 5, 7, '猛進'],
  stork: ['雲梭白鸛', 2, 3, 5, '追獵'],
  ferret: ['沙刃鼬客', 1, 2, 3, '猛進'],
  beaver: ['堤工河狸', 2, 2, 7, '守蔭'],
  rabbit: ['月棲引魂兔', 2, 3, 6, '亡靈接替'],
  eagle: ['金羽御衛', 3, 5, 8, '戰吼'],
  boss: ['斷橋守將', 0, 2, 6, '橫掃'],
  spirit: ['靈體', 0, 1, 2, ''],
};
export const starter = ['guard', 'bomb', 'archer', 'ax', 'ghost', 'healer', 'knight', 'giant'];
const sentries = ['guard', 'bomb', 'knight', 'ax', 'ghost', 'giant'];
import {cardBonus} from './inventory.mjs?v=dual-rune-1';
import {dailyStage} from './daily.mjs?v=dual-rune-1';
export const stages = [
  {name:'哨站前沿', goal:'倒數歸零就能部署。先用護衛或斥候接住第一波。', hp:8, opponents:['guard','archer','healer','knight'], opening:['archer'], reward:'bow'},
  {name:'雙塔迴廊', goal:'同回合可以連下多張。留意每張牌的部署順序。', hp:10, opponents:['bomb','knight','archer','ghost','ax'], opening:['guard','bomb'], reward:'fang'},
  {name:'斷橋缺口', goal:'正對空位可直攻英雄。對手擅長護盾與追獵。', hp:9, opponents:['archer','knight','ghost','fang','bow'], opening:['knight'], reward:'flag'},
  {name:'斷橋守將', goal:'頭目橫掃正對欄與兩側。利用護衛、自爆和接替改寫對位。', hp:10, opponents:sentries, opening:['boss'], reward:'moon'},
  {name:'沉鐘入口', goal:'盾兵會保護正對的位置。用破甲或追獵拆開前線。',hp:11,opponents:['boar','seal','hare','archer','ax'],opening:['boar'],reward:'seal'},
  {name:'幽潮祭壇', goal:'留意亡靈接替，擊退本體後該欄仍可能被靈體佔據。',hp:12,opponents:['bat','ghost','koi','healer','ram'],opening:['bat'],reward:'koi'},
  {name:'水門斷層', goal:'爆甲和自爆會傷及相鄰欄位，調整下牌順序再進攻。',hp:13,opponents:['beetle','crab','bow','panda','wolf'],opening:['mole'],reward:'wolf'},
  {name:'沉鐘獅王', goal:'曜鬃獅統領的戰吼能隔著守軍傷害英雄。先壓力最大的欄位。',hp:14,opponents:['otter','hedgehog','fang','swan','giant'],opening:['lion'],reward:'swan'},
];

function unit(id, uid, level=1,effect=1) {
  const [name, count, attack, max, skill] = cards[id];
  const bonus=cardBonus(level);
  return {id, uid, name, count, level, effect, attack:attack+bonus, max:max+bonus*2, hp:max+bonus*2, shield: skill === '護盾' ? 1+effect : 0, skill};
}
function side(deck, hp) {
  return {hp, deck: deck.slice(3), hand: deck.slice(0, 3), board: []};
}
export function createBattle(rune = 'wall', hero = '', stage = 3, deck = starter, levels = {}, heroLevel=1, runeLevel=1, daily=null,effects={},heroEffect=1,runeEffect=1,rune2=null) {
  const level = daily?dailyStage(daily):stages[stage];
  const player = side(deck.map((id, i) => unit(id, i, levels[id]??1,effects[id]??1)), 24+heroLevel-1);
  const enemy = side(level.opponents.map((id, i) => unit(id, i + 8)), level.hp);
  enemy.board.push(...level.opening.map((id,i)=>unit(id,20+i)));
  const state = {version: 3, phase: 'deploy', stage, round: 1, result: null, sides: [player, enemy], hero, heroUsed: false, heroShield: 0, rune, charges: rune === 'none' ? 0 : 2, nextUid: 24, sequence: 0};
  if(daily) {
    state.daily=daily;
    if(['gold','xp'].includes(daily.vault)) for(const card of enemy.board)card.shield=Math.max(card.shield,2);
  }
  state.heroLevel=heroLevel;state.heroEffect=heroEffect;state.runeEffect=runeEffect;
  state.runeLevel=runeLevel;
  if(rune2)state.rune2={...rune2};
  begin(player, false);
  return state;
}
function begin(team, draw = true) {
  for (const card of team.hand) card.count = Math.max(0, card.count - 1);
  if (draw && team.deck.length) team.hand.push(team.deck.shift());
}
function record(state, events, kind, message, details = {}) {
  events.push({sequence: ++state.sequence, kind, message, ...details, frame: {
    sides: state.sides.map(({hp, board}) => ({hp, board: structuredClone(board)})),
    charges: state.charges, rune2Charges:state.rune2?.charges??0, heroShield: state.heroShield, round: state.round,
  }});
}
function trigger(state, events, timing, lane) {
  const hero = heroes.find(h => h.id === state.hero);
  if (!hero || state.heroUsed || hero.trigger !== timing) return;
  const [team, foe] = state.sides;
  const boost=(state.heroEffect??1)-1;
  const eligible = test => team.board.map((card, index) => ({card, index})).filter(({card}) => card && test(card)).sort((a, b) => a.card.hp - b.card.hp);
  let name = hero.name;
  let target = 0;
  if (hero.effect === 'shield' || hero.effect === 'recover') {
    if (team.hp * 2 > 23+(state.heroLevel??1) || team.hp === 0) return;
    if (hero.effect === 'shield') state.heroShield += 3+boost;
    else team.hp = Math.min(23+(state.heroLevel??1),team.hp+3+boost);
    lane = null;
  } else if (hero.effect === 'haste' || hero.effect === 'draw') {
    if (hero.effect === 'draw') {
      if (!team.deck.length) return;
      team.hand.push(...team.deck.splice(0,1+boost));
    } else {
      const card = team.hand.filter(c => c.count > 0).sort((a,b) => a.count - b.count)[0];
      if (!card) return;
      card.count=Math.max(0,card.count-1-boost);
      name = card.name;
    }
  } else if (hero.effect === 'summon') {
    if (team.board[lane]) return;
    team.board[lane] = unit('spirit', state.nextUid++,1+boost);
  } else if (hero.effect === 'strike') {
    lane = foe.board.findIndex(c => c && c.hp + c.shield <= 2+boost);
    if (lane < 0) return;
    target = 1;
    name = foe.board[lane].name;
  } else {
    const pick = timing === 'deploy' ? {card: team.board[lane], index: lane}
      : eligible(c => hero.effect === 'heal' ? c.hp < c.max : c.hp * 2 <= c.max)[0];
    if (!pick || (hero.effect === 'power' && team.board.length < 3)) return;
    lane = pick.index;
    name = pick.card.name;
    if (hero.effect === 'heal') pick.card.hp = Math.min(pick.card.max, pick.card.hp + 3+boost);
    else if (hero.effect === 'power') pick.card.attack+=1+boost;
    else pick.card.shield += 2+boost;
  }
  state.heroUsed = true;
  record(state, events, 'hero', `${hero.name}・${hero.skill} → ${name}`, {actor: 0, target, lanes: [lane ?? null]});
  if (hero.effect === 'strike') {
    const deaths = [];
    hitBatch(state, events, 0, hero, [{target: 1, lane, amount: 2+boost}], deaths);
    settle(state, events, 0, deaths);
  }
}
function deploy(state, events, actor, uid) {
  const {hand, board} = state.sides[actor];
  const slot = hand.findIndex(card => card.uid === uid && card.count === 0);
  if (slot < 0) return false;
  const [card] = hand.splice(slot, 1);
  board.push(card);
  record(state, events, 'deploy', `${card.name} 部署到第 ${board.length} 欄`, {actor, target: actor, lanes: [board.length - 1]});
  if (actor === 0) trigger(state, events, 'deploy', board.length - 1);
  return true;
}
function hitBatch(state, events, actor, source, hits, deaths, normal = false) {
  const batch = hits.map(({target, lane, amount}) => {
    const board = state.sides[target].board;
    const support = lane !== null && normal ? Math.max(0,...[board[lane - 1],board[lane + 1]].filter(c=>c?.hp>0&&c.skill==='護衛').map(c=>c.effect??1)) : 0;
    return {target, lane, damage: Math.max(0, amount - support)};
  });
  for (const {target, lane, damage} of batch) {
    const side = state.sides[target];
    const card = lane === null ? null : side.board[lane];
    if (lane !== null && !card) continue;
    const absorbed = Math.min(card?.shield ?? (target === 0 ? state.heroShield : 0), damage);
    const dealt = damage - absorbed;
    if (card) {
      card.shield -= absorbed;
      if(['gold','xp'].includes(state.daily?.vault)&&target===1&&absorbed&&!card.shield)card.attack=Math.max(0,card.attack-1);
      card.hp = Math.max(0, card.hp - dealt);
      if (!card.hp) {
        side.board[lane] = null;
        deaths.push({actor: target, lane, card});
      }
    } else {
      side.hp = Math.max(0, side.hp - dealt);
      if (target === 0) state.heroShield -= absorbed;
    }
    record(state, events, 'hit', `${source.name} → ${card?.name ?? '英雄'}：${dealt} 傷害${absorbed ? `，盾吸收 ${absorbed}` : ''}`, {actor, target, lanes: [lane], hp: card?.hp ?? side.hp});
  }
  if (batch.some(hit => hit.target === 0 && hit.lane === null)) trigger(state, events, 'danger');
}
function settle(state, events, active, deaths) {
  const sort = (a, b) => (a.actor !== active) - (b.actor !== active) || a.lane - b.lane;
  deaths.sort(sort);
  for (let i = 0; i < deaths.length; i++) {
    const {actor, lane, card} = deaths[i];
    record(state, events, 'death', `${card.name} 陣亡`, {actor, target: actor, lanes: [lane]});
    const next = [];
    if (card.skill === '自爆') {
      const lanes = [lane - 1, lane, lane + 1].filter(index => state.sides[1 - actor].board[index]);
      record(state, events, 'skill', `${card.name} 自爆`, {actor, target: 1 - actor, lanes});
      hitBatch(state, events, actor, card, lanes.map(index => ({target: 1 - actor, lane: index, amount: 1+(card.effect??1)})), next);
    }
    if (card.skill === '亡靈接替' && !state.sides[actor].board[lane]) {
      state.sides[actor].board[lane] = unit('spirit', state.nextUid++,1,card.effect??1);
      state.sides[actor].board[lane].hp+=((card.effect??1)-1);state.sides[actor].board[lane].max=state.sides[actor].board[lane].hp;
      record(state, events, 'skill', `靈體接替第 ${lane + 1} 欄`, {actor, target: actor, lanes: [lane]});
    }
    if (actor === 0) trigger(state, events, 'death', lane);
    deaths.push(...next.sort(sort));
  }
}
function result(state) {
  const lost = state.sides.map(side => side.hp <= 0 || (!side.deck.length && !side.hand.length && !side.board.some(Boolean)));
  if (lost[0] && lost[1]) return '平局';
  if (lost[0]) return '敗北';
  if (lost[1]) return '勝利';
  return null;
}
function runRune(state, events, second=false) {
  const id=second?state.rune2?.id:state.rune;
  const slot=second?state.rune2:state;
  if(!slot?.charges)return;
  const bonus=second?(slot.level??1)+(slot.effect??1)-2:(state.runeLevel??1)+(state.runeEffect??1)-2;
  if(id==='shelter'||id==='surge'||id==='echo') {
    const [player,enemy]=state.sides;
    const enemies=enemy.board.filter(Boolean).length;
    let target=0,lanes=[null], message;
    if(id==='shelter'){
      if(enemies<3)return;
      const lane=player.board.findIndex(card=>card&&!card.shield);
      if(lane===-1)return;
      player.board[lane].shield+=1+bonus;
      lanes=[lane];message=`堡壘 → ${player.board[lane].name}・護盾 +${1+bonus}`;
    } else if(id==='surge'){
      if(enemies<2||player.hp*2>23+(state.heroLevel??1))return;
      target=1;message='逆雷 → 敵方英雄';
    } else {
      const card=player.hand.find(item=>item.count>0);
      if(!card)return;
      card.count=Math.max(0,card.count-1-bonus);
      message=`回響 → ${card.name}・倒數 ${card.count}`;
    }
    slot.charges--;
    record(state,events,'skill',`${message}（剩 ${slot.charges} 次）`,{actor:0,target,lanes,rune:id});
    if(id==='surge')hitBatch(state,events,0,{name:'逆雷'},[{target,lane:null,amount:1+bonus}],[]);
    return;
  }
  if(id==='mirror'||id==='dawn') {
    const hero=state.sides[0];
    const maxHealth=23+(state.heroLevel??1);
    const mirror=id==='mirror';
    if(hero.hp*2>maxHealth || (mirror&&state.heroShield>0))return;
    if(mirror) state.heroShield+=1+bonus;
    else hero.hp=Math.min(maxHealth,hero.hp+2+bonus);
    slot.charges--;
    record(state,events,'skill',`${mirror?'晶鏡':'曉光'} → 我方英雄（剩 ${slot.charges} 次）`,
      {actor:0,target:0,lanes:[null],rune:id});
    return;
  }
  if(id==='anchor') {
    const eligible=state.sides[1].hand.filter(card=>card.count<=2).sort((a,b)=>a.count-b.count);
    const card=eligible[0];
    if(!card)return;
    card.count=Math.min(4,card.count+2+bonus);
    slot.charges--;
    record(state,events,'skill',`沉錨 → ${card.name}・倒數 ${card.count}（剩 ${slot.charges} 次）`,
      {actor:0,target:1,lanes:[null],rune:id});
    return;
  }
  if(id==='tide'||id==='root') {
    const tide=id==='tide';
    const target=tide?1:0;
    const board=state.sides[target].board;
    const lanes=board.flatMap((card,lane)=>card&&(tide?card.shield>0:card.hp<card.max)?[lane]:[]);
    if(tide) {
      if(!lanes.length) return;
      lanes.sort((a,b)=>board[b].shield-board[a].shield);
      lanes.length=1;
      board[lanes[0]].shield=Math.max(0,board[lanes[0]].shield-3-bonus);
    } else {
      if(lanes.length<2) return;
      for(const lane of lanes) board[lane].hp=Math.min(board[lane].max,board[lane].hp+1+bonus);
    }
    slot.charges--;
    record(state,events,'skill',`${tide?'潮解':'生根'}（剩 ${slot.charges} 次）`,{actor:0,target,lanes,rune:id});
    return;
  }
  if(id==='ward'||id==='flame') {
    const team=state.sides[0].board;
    const ward=id==='ward';
    const lane=ward?team.findIndex(card=>card&&!card.shield):team.findIndex(card=>card&&card.hp*2<=card.max);
    if(team.filter(Boolean).length<2||lane<0) return;
    const card=team[lane];
    slot.charges--;
    if(ward) card.shield+=1+bonus;
    else card.attack+=1+bonus;
    record(state,events,'skill',`${ward?'共盾':'熾志'} → ${card.name}（剩 ${slot.charges} 次）`,{actor:0,target:0,lanes:[lane],rune:id});
    return;
  }
  if(id==='frost' || id==='spark') {
    const frost=id==='frost';
    const enemies=state.sides[1].board.map((card,lane)=>({card,lane})).filter(({card})=>card && (frost?card.attack>=4:card.hp+card.shield<=2+bonus));
    enemies.sort((a,b)=>frost?b.card.attack-a.card.attack:a.card.hp-b.card.hp);
    const target=enemies[0];
    if(!target) return;
    slot.charges--;
    const name=frost?'霜縛':'雷印';
    if(frost) target.card.attack=Math.max(1,target.card.attack-2-bonus);
    record(state,events,'skill',`${name} → ${target.card.name}（剩 ${slot.charges} 次）`,{actor:0,target:1,lanes:[target.lane],rune:id});
    if(!frost) {
      const deaths=[];
      hitBatch(state,events,0,{name},[{target:1,lane:target.lane,amount:2+bonus}],deaths);
      settle(state,events,0,deaths);
    }
    return;
  }
  const board = state.sides[0].board;
  const eligible = board.flatMap((card, lane) => {
    if (!card || card.hp * 2 > card.max) return [];
    const wall = id === 'wall';
    if (wall && (card.shield || !state.sides[1].board[lane])) return [];
    if (!wall && card.max - card.hp < 3) return [];
    return [{card, lane}];
  }).sort((a, b) => a.card.hp - b.card.hp || a.lane - b.lane);
  const target = eligible[0];
  if (!target) return;
  slot.charges--;
  if (id === 'wall') target.card.shield += 2+bonus;
  else target.card.hp = Math.min(target.card.max,target.card.hp+3+bonus);
  record(state, events, 'skill', `${id === 'wall' ? '鐵壁' : '回春'} → ${target.card.name}（剩 ${slot.charges} 次）`, {actor: 0, target: 0, lanes: [target.lane], rune:id});
}
function attack(state, events, actor) {
  const board = state.sides[actor].board;
  const rival = state.sides[1 - actor].board;
  const order = board.slice();
  for (const [lane, card] of order.entries()) {
    if (!card || board[lane] !== card) continue;
    const skillBonus=(card.effect??1)-1;
    if (card.skill === '治療') {
      const allies = board.flatMap((ally, index) => ally && ally.hp < ally.max ? [{ally, index}] : []);
      allies.sort((a, b) => a.ally.hp - b.ally.hp || a.index - b.index);
      const target = allies[0];
      if (target) {
        target.ally.hp = Math.min(target.ally.max, target.ally.hp + 2+skillBonus);
        record(state, events, 'skill', `${card.name} 治療 ${target.ally.name}`, {actor, target: actor, lanes: [target.index]});
      }
    }
    const prey = card.skill === '追獵' ? rival.flatMap((enemy, index) => enemy ? [{enemy, index}] : []).sort((a, b) => a.enemy.hp - b.enemy.hp || a.index - b.index)[0] : null;
    const primary = prey?.index ?? (rival[lane] ? lane : null);
    if(card.skill==='援護') {
      const adjacent=[lane-1,lane+1].filter(index=>board[index]&&board[index].hp<board[index].max);
      adjacent.sort((a,b)=>board[a].hp-board[b].hp);
      const target=adjacent[0];
      if(target!==undefined){
        board[target].hp=Math.min(board[target].max,board[target].hp+2+skillBonus);
        record(state,events,'skill',`${card.name} 援護 → ${board[target].name}`,{actor,target:actor,lanes:[target]});
      }
    }
    if(card.skill==='破甲' && primary!==null && rival[primary].shield>0) {
      const removed=Math.min(2+skillBonus,rival[primary].shield);
      rival[primary].shield-=removed;
      record(state,events,'skill',`${card.name} 破甲・移除 ${removed} 點護盾`,{actor,target:1-actor,lanes:[primary]});
    }
    if(card.skill==='守蔭') {
      const target=[lane-1,lane+1].find(index=>board[index]&&!board[index].shield);
      if(target!==undefined) {
        board[target].shield+=1+skillBonus;
        record(state,events,'skill',`${card.name} 守蔭・${board[target].name} 獲得 ${1+skillBonus} 點護盾`,{actor,target:actor,lanes:[target]});
      }
    }
    const advance=card.skill==='猛進'&&primary!==null&&rival[primary].hp>card.hp?1+skillBonus:0;
    const hits = [{target: 1 - actor, lane: primary, amount: card.attack+advance+(prey||!card.skill?skillBonus:0)}];
    if(card.skill==='戰吼' && primary!==null) hits.push({target:1-actor,lane:null,amount:1+skillBonus});
    if (card.skill === '橫掃') {
      for (const index of [lane - 1, lane + 1]) {
        if (rival[index]) hits.push({target: 1 - actor, lane: index, amount: Math.floor(card.attack / 2)+skillBonus});
      }
    }
    record(state, events, 'attack', `${card.name} ${card.skill === '橫掃' ? '橫掃' : '出手'}`, {actor, origin: lane, target: 1 - actor, lanes: hits.map(hit => hit.lane)});
    const deaths = [];
    hitBatch(state, events, actor, card, hits, deaths, true);
    settle(state, events, actor, deaths);
    const ending = result(state);
    if (ending) {
      state.result = ending;
      break;
    }
  }
  for (const side of state.sides) side.board = side.board.filter(Boolean);
}
export function applyAction(previous, action) {
  if (previous.phase !== 'deploy') return null;
  const state = structuredClone(previous);
  const events = [];
  if (action.type === 'deploy') {
    if (!deploy(state, events, 0, action.uid)) return null;
  } else if (action.type === 'attack') {
    if(['gems','tech'].includes(state.daily?.vault)){
      const lane=(state.round-1)%3;
      const deaths=[];
      hitBatch(state,events,1,{name:'星晶爆裂'},[{target:0,lane,amount:1+Number(state.daily.floor>=6)}],deaths);
      settle(state,events,1,deaths);
    }
    if(!result(state))runRune(state, events);
    if(!result(state))runRune(state, events,true);
    state.result=result(state)??null;
    if(!state.result) {
      trigger(state, events, 'attack');
      state.result=result(state)??null;
    }
    if(!state.result) attack(state, events, 0);
    if (!state.result) {
      const enemy = state.sides[1];
      begin(enemy);
      for (const card of [...enemy.hand]) deploy(state, events, 1, card.uid);
      attack(state, events, 1);
    }
    if (!state.result && state.round >= 40) state.result = '平局';
    if (state.result) {
      state.phase = 'end';
      record(state, events, 'end', state.result);
    } else {
      state.round++;
      begin(state.sides[0]);
      trigger(state, events, 'round');
      record(state, events, 'round', `第 ${state.round} 回合`);
    }
  } else return null;
  return {state, events};
}
import {heroes} from './heroes.mjs';
