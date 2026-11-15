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
  boss: ['斷橋守將', 0, 2, 6, '橫掃'],
  spirit: ['靈體', 0, 1, 2, ''],
};
export const starter = ['guard', 'bomb', 'archer', 'ax', 'ghost', 'healer', 'knight', 'giant'];
const sentries = ['guard', 'bomb', 'knight', 'ax', 'ghost', 'giant'];
export const stages = [
  {name:'哨站前沿', goal:'倒數歸零就能部署。先用護衛或斥候接住第一波。', hp:8, opponents:['guard','archer','healer','knight'], opening:['archer'], reward:'bow'},
  {name:'雙塔迴廊', goal:'同回合可以連下多張。留意每張牌的部署順序。', hp:10, opponents:['bomb','knight','archer','ghost','ax'], opening:['guard','bomb'], reward:'fang'},
  {name:'斷橋缺口', goal:'正對空位可直攻英雄。對手擅長護盾與追獵。', hp:9, opponents:['archer','knight','ghost','fang','bow'], opening:['knight'], reward:'flag'},
  {name:'斷橋守將', goal:'頭目橫掃正對欄與兩側。利用護衛、自爆和接替改寫對位。', hp:10, opponents:sentries, opening:['boss'], reward:'moon'},
];

function unit(id, uid) {
  const [name, count, attack, max, skill] = cards[id];
  return {id, uid, name, count, attack, max, hp: max, shield: skill === '護盾' ? 2 : 0, skill};
}
function side(deck, hp) {
  return {hp, deck: deck.slice(3), hand: deck.slice(0, 3), board: []};
}
export function createBattle(rune = 'wall', hero = '', stage = 3, deck = starter) {
  const level = stages[stage];
  const player = side(deck.map((id, i) => unit(id, i)), 24);
  const enemy = side(level.opponents.map((id, i) => unit(id, i + 8)), level.hp);
  enemy.board.push(...level.opening.map((id,i)=>unit(id,20+i)));
  const state = {version: 3, phase: 'deploy', stage, round: 1, result: null, sides: [player, enemy], hero, heroUsed: false, heroShield: 0, rune, charges: rune === 'none' ? 0 : 2, nextUid: 24, sequence: 0};
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
    charges: state.charges, heroShield: state.heroShield, round: state.round,
  }});
}
function trigger(state, events, timing, lane) {
  const hero = heroes.find(h => h.id === state.hero);
  if (!hero || state.heroUsed || hero.trigger !== timing) return;
  const [team, foe] = state.sides;
  const eligible = test => team.board.map((card, index) => ({card, index})).filter(({card}) => card && test(card)).sort((a, b) => a.card.hp - b.card.hp);
  let name = hero.name;
  let target = 0;
  if (hero.effect === 'shield' || hero.effect === 'recover') {
    if (team.hp > 12 || team.hp === 0) return;
    if (hero.effect === 'shield') state.heroShield += 3;
    else team.hp += 3;
    lane = null;
  } else if (hero.effect === 'haste' || hero.effect === 'draw') {
    if (hero.effect === 'draw') {
      if (!team.deck.length) return;
      team.hand.push(team.deck.shift());
    } else {
      const card = team.hand.filter(c => c.count > 0).sort((a,b) => a.count - b.count)[0];
      if (!card) return;
      card.count--;
      name = card.name;
    }
  } else if (hero.effect === 'summon') {
    if (team.board[lane]) return;
    team.board[lane] = unit('spirit', state.nextUid++);
  } else if (hero.effect === 'strike') {
    lane = foe.board.findIndex(c => c && c.hp + c.shield <= 2);
    if (lane < 0) return;
    target = 1;
    name = foe.board[lane].name;
  } else {
    const pick = timing === 'deploy' ? {card: team.board[lane], index: lane}
      : eligible(c => hero.effect === 'heal' ? c.hp < c.max : c.hp * 2 <= c.max)[0];
    if (!pick || (hero.effect === 'power' && team.board.length < 3)) return;
    lane = pick.index;
    name = pick.card.name;
    if (hero.effect === 'heal') pick.card.hp = Math.min(pick.card.max, pick.card.hp + 3);
    else if (hero.effect === 'power') pick.card.attack++;
    else pick.card.shield += 2;
  }
  state.heroUsed = true;
  record(state, events, 'hero', `${hero.name}・${hero.skill} → ${name}`, {actor: 0, target, lanes: [lane ?? null]});
  if (hero.effect === 'strike') {
    const deaths = [];
    hitBatch(state, events, 0, hero, [{target: 1, lane, amount: 2}], deaths);
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
    const support = lane !== null && normal && [board[lane - 1], board[lane + 1]].some(c => c?.hp > 0 && c.skill === '護衛');
    return {target, lane, damage: Math.max(0, amount - Number(Boolean(support)))};
  });
  for (const {target, lane, damage} of batch) {
    const side = state.sides[target];
    const card = lane === null ? null : side.board[lane];
    if (lane !== null && !card) continue;
    const absorbed = Math.min(card?.shield ?? (target === 0 ? state.heroShield : 0), damage);
    const dealt = damage - absorbed;
    if (card) {
      card.shield -= absorbed;
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
      hitBatch(state, events, actor, card, lanes.map(index => ({target: 1 - actor, lane: index, amount: 2})), next);
    }
    if (card.skill === '亡靈接替' && !state.sides[actor].board[lane]) {
      state.sides[actor].board[lane] = unit('spirit', state.nextUid++);
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
function runRune(state, events) {
  if (!state.charges) return;
  const board = state.sides[0].board;
  const eligible = board.flatMap((card, lane) => {
    if (!card || card.hp * 2 > card.max) return [];
    const wall = state.rune === 'wall';
    if (wall && (card.shield || !state.sides[1].board[lane])) return [];
    if (!wall && card.max - card.hp < 3) return [];
    return [{card, lane}];
  }).sort((a, b) => a.card.hp - b.card.hp || a.lane - b.lane);
  const target = eligible[0];
  if (!target) return;
  state.charges--;
  if (state.rune === 'wall') target.card.shield += 2;
  else target.card.hp += 3;
  record(state, events, 'skill', `${state.rune === 'wall' ? '鐵壁' : '回春'} → ${target.card.name}（剩 ${state.charges} 次）`, {actor: 0, target: 0, lanes: [target.lane], rune:state.rune});
}
function attack(state, events, actor) {
  const board = state.sides[actor].board;
  const rival = state.sides[1 - actor].board;
  const order = board.slice();
  for (const [lane, card] of order.entries()) {
    if (!card || board[lane] !== card) continue;
    if (card.skill === '治療') {
      const allies = board.flatMap((ally, index) => ally && ally.hp < ally.max ? [{ally, index}] : []);
      allies.sort((a, b) => a.ally.hp - b.ally.hp || a.index - b.index);
      const target = allies[0];
      if (target) {
        target.ally.hp = Math.min(target.ally.max, target.ally.hp + 2);
        record(state, events, 'skill', `${card.name} 治療 ${target.ally.name}`, {actor, target: actor, lanes: [target.index]});
      }
    }
    const prey = card.skill === '追獵' ? rival.flatMap((enemy, index) => enemy ? [{enemy, index}] : []).sort((a, b) => a.enemy.hp - b.enemy.hp || a.index - b.index)[0] : null;
    const primary = prey?.index ?? (rival[lane] ? lane : null);
    const hits = [{target: 1 - actor, lane: primary, amount: card.attack}];
    if (card.skill === '橫掃') {
      for (const index of [lane - 1, lane + 1]) {
        if (rival[index]) hits.push({target: 1 - actor, lane: index, amount: Math.floor(card.attack / 2)});
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
    runRune(state, events);
    trigger(state, events, 'attack');
    attack(state, events, 0);
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
