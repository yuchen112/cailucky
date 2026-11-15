import {cards, stages, starter} from './battle.mjs';
import {heroes} from './heroes.mjs';

const format = 'cxq-rift-summon';
const limit = 256 * 1024;
const integer = (n,min,max) => Number.isInteger(n) && n >= min && n <= max;
const fraction = n => typeof n === 'number' && n >= 0 && n <= 1;
const cardValid = card => card && Object.hasOwn(cards, card.id) &&
  integer(card.uid,0,500) && card.name === cards[card.id][0] && card.skill === cards[card.id][4] &&
  integer(card.max,1,20) && integer(card.hp,1,card.max) && integer(card.attack,0,20) &&
  integer(card.shield,0,20) && integer(card.count,0,4);
const sideValid = side => side && integer(side.hp,0,24) &&
  ['deck','hand','board'].every(key=>Array.isArray(side[key]) && side[key].length <= 20 && side[key].every(cardValid));

export function makeBackup(save) {
  return JSON.stringify({format,version:1,createdAt:new Date().toISOString(),save},null,2);
}
export async function readBackup(file) {
  if (file.size > limit) throw new Error('備份檔超過 256 KB。');
  let data;
  try { data=JSON.parse(await file.text()); }
  catch { throw new Error('這個檔案無法讀取為 JSON 備份。'); }
  if (data?.format !== format) throw new Error('這不是《CxQ 裂界召喚》的備份。');
  if (data.version !== 1) throw new Error('這個備份版本目前無法匯入。');
  const save=data.save;
  const state=save?.state;
  const cleared=save?.cleared;
  const validClears=Array.isArray(cleared) && cleared.length <= stages.length &&
    new Set(cleared).size === cleared.length &&
    cleared.every(index=>integer(index,0,cleared.length-1));
  const owned=validClears ? [...starter,...cleared.map(index=>stages[index].reward)] : [];
  const validDeck=Array.isArray(save?.deck) && save.deck.length === 8 &&
    new Set(save.deck).size === 8 && save.deck.every(id=>owned.includes(id));
  const validState=state === null || (state?.version === 3 &&
    integer(state.stage,0,Math.min(owned.length-starter.length,stages.length-1)) &&
    integer(state.round,1,40) && integer(state.charges,0,2) && integer(state.heroShield,0,3) &&
    integer(state.nextUid,24,500) && integer(state.sequence,0,10000) &&
    heroes.some(h=>h.id===state.hero) && ['wall','heal'].includes(state.rune) &&
    typeof state.heroUsed === 'boolean' && Array.isArray(state.sides) &&
    state.sides.length === 2 && state.sides.every(sideValid) &&
    (state.phase === 'deploy' && state.result === null || state.phase === 'end' && ['勝利','敗北','平局'].includes(state.result)));
  if (!validClears || !validDeck || !validState || !Array.isArray(save.log) ||
    save.log.length>150 || !save.log.every(line=>typeof line==='string' && line.length<=180) ||
    !['1','2','3'].includes(save.speed) || !fraction(save.volumes?.bgm) || !fraction(save.volumes?.sfx)) {
    throw new Error('備份中的牌組、關卡或戰況有無效欄位。');
  }
  return {save,createdAt:Number.isFinite(Date.parse(data.createdAt)) ? new Date(data.createdAt) : null};
}
