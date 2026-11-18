import {heroCapacity,migrateHeroProgression} from './progression.mjs?v=hero-50-1';
import {cards, stages, starter} from './battle.mjs?v=hero-50-1';
import {heroes} from './heroes.mjs?v=hero-50-1';
import {validWallet,validRunes,unlockedRunes,starterHeroes,heroIds} from './economy.mjs?v=hero-50-1';
import {validInventory} from './inventory.mjs?v=hero-50-1';

import {validDaily,dailyStage} from './daily.mjs?v=hero-50-1';
import {materials} from './materials.mjs?v=hero-50-1';
const format = 'cxq-rift-summon';
const limit = 1024 * 1024;
const integer = (n,min,max) => Number.isInteger(n) && n >= min && n <= max;
const fraction = n => typeof n === 'number' && n >= 0 && n <= 1;
const cardValid = card => card && Object.hasOwn(cards, card.id) &&
  integer(card.uid,0,500) && card.name === cards[card.id][0] && card.skill === cards[card.id][4] &&
  integer(card.max,1,160) && integer(card.hp,1,card.max) && integer(card.attack,0,80) &&
  integer(card.shield,0,80) && integer(card.count,0,4) && (card.heroBreakHeal===undefined||integer(card.heroBreakHeal,0,2));
const sideValid = side => side && integer(side.hp,0,73) &&
  ['deck','hand','board'].every(key=>Array.isArray(side[key]) && side[key].length <= 20 && side[key].every(card=>key==='board'&&card===null||cardValid(card)));

export function makeBackup(save) {
  return JSON.stringify({format,version:1,createdAt:new Date().toISOString(),save},null,2);
}
export async function readBackup(file) {
  if (file.size > limit) throw new Error('備份檔超過 1 MB。');
  let data;
  try { data=JSON.parse(await file.text()); }
  catch { throw new Error('這個檔案無法讀取為 JSON 備份。'); }
  if (data?.format !== format) throw new Error('這不是《CxQ 裂界召喚》的備份。');
  if (data.version !== 1) throw new Error('這個備份版本目前無法匯入。');
  const save=migrateHeroProgression(data.save);
  const state=save?.state;
  const cleared=save?.cleared;
  const validClears=Array.isArray(cleared) && cleared.length <= stages.length &&
    new Set(cleared).size === cleared.length &&
    cleared.every(index=>integer(index,0,cleared.length-1));
  const walletOk=save?.wallet===undefined || validWallet(save.wallet);
  const owned=validClears ? [...starter,...cleared.map(index=>stages[index].reward),...(walletOk?save.wallet?.unlocked??[]:[])] : [];
  const runeOwnership=validClears?unlockedRunes(new Set(cleared),walletOk?save.wallet:undefined):[];
  const validDeck=Array.isArray(save?.deck) && save.deck.length >= 8 && save.deck.length <= 12 &&
    save.deck.every(id=>owned.includes(id));
  const teamsOk=save?.teams===undefined||(Array.isArray(save.teams)&&save.teams.length===3&&save.teams.every(team=>
    team&&Array.isArray(team.deck)&&team.deck.length>=8&&team.deck.length<=12&&team.deck.every(id=>owned.includes(id))&&
    heroIds.includes(team.hero)&&(team.rune==='none'||runeOwnership.includes(team.rune)))&&integer(save.activeTeam,0,2));
  const inventoryOk=save?.inventory===undefined||validInventory(save.inventory,{card:owned,hero:heroIds,rune:runeOwnership,material:Object.keys(materials)});
  const linksOk=save?.inventory===undefined||inventoryOk&&teamsOk&&Array.isArray(save.teams)&&save.teams.every(team=>{
    const byUid=new Map(save.inventory.items.map(item=>[item.uid,item]));
    const matches=(uid,kind,id)=>byUid.get(uid)?.kind===kind&&byUid.get(uid).id===id;
    return team?.items&&Array.isArray(team.items.cards)&&team.items.cards.length===team.deck.length&&team.items.cards.length<=heroCapacity(byUid.get(team.items.hero)?.level??1)&&new Set(team.items.cards).size===team.items.cards.length&&
      team.items.cards.every((uid,i)=>matches(uid,'card',team.deck[i]))&&matches(team.items.hero,'hero',team.hero)&&
      (team.rune==='none'?team.items.rune===null:matches(team.items.rune,'rune',team.rune))&&
      (team.items.rune2==null||team.items.rune2!==team.items.rune&&byUid.get(team.items.rune2)?.kind==='rune');
  });
  const validState=state === null || (state?.version === 3 &&
    (state.heroLevel===undefined||integer(state.heroLevel,1,50))&&
    (state.heroEffect===undefined||integer(state.heroEffect,1,10))&&
    (state.heroMax===undefined||integer(state.heroMax,24,73))&&
    (state.heroNextShield===undefined||state.heroNextShield&&integer(state.heroNextShield.base,0,5)&&integer(state.heroNextShield.ratio,0,10))&&
    (state.daily?Boolean(dailyStage(state.daily)):integer(state.stage,0,Math.min(cleared?.length??-1,stages.length-1))) &&
    integer(state.round,1,40) && integer(state.charges,0,2) && integer(state.heroShield,0,80) &&
    integer(state.nextUid,24,500) && integer(state.sequence,0,10000) &&
    heroes.some(h=>h.id===state.hero) && validRunes.includes(state.rune) && (state.rune==='none'||runeOwnership.includes(state.rune)) &&
    (state.rune2==null||(runeOwnership.includes(state.rune2.id)&&integer(state.rune2.charges,0,2)&&integer(state.rune2.level,1,5)&&integer(state.rune2.effect,1,10))) &&
    typeof state.heroUsed === 'boolean' && Array.isArray(state.sides) &&
    state.sides.length === 2 && state.sides.every(sideValid) &&
    (state.phase === 'deploy' && state.result === null || state.phase === 'end' && ['勝利','敗北','平局'].includes(state.result)));
  if ((save?.daily!==undefined&&!validDaily(save.daily)) || !validClears || !validDeck || !validState || !walletOk || !teamsOk || !inventoryOk || !linksOk ||
    (save.starterHero!==undefined&&!starterHeroes.includes(save.starterHero)) ||
    (save.wallet && Object.keys(save.wallet.levels).some(id=>!owned.includes(id))) || !Array.isArray(save.log) ||
    save.log.length>150 || !save.log.every(line=>typeof line==='string' && line.length<=180) ||
    !['1','2','3'].includes(save.speed) || !fraction(save.volumes?.bgm) || !fraction(save.volumes?.sfx) ||
    (save.loadout!==undefined && save.loadout!=='none' && !runeOwnership.includes(save.loadout)) ||
    (save.lowMotion!==undefined && typeof save.lowMotion!=='boolean')) {
    throw new Error('備份中的牌組、關卡或戰況有無效欄位。');
  }
  return {save,createdAt:Number.isFinite(Date.parse(data.createdAt)) ? new Date(data.createdAt) : null};
}
