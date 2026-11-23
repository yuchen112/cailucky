import {dailyEncounters} from './daily-encounters.mjs?v=rift99-2';
export const vaults = {
  gold: {name:'熔金寶庫', limit:5, currency:'gold', opening:['guard','boar','knight','giant','boss'], roster:['guard','knight','boar','beetle','giant','ax','flag','turtle']},
  gems: {name:'星晶裂谷', limit:3, currency:'gems', opening:['wisp','moth','bat','raven','lion'], roster:['wisp','bat','moth','crane','koi','swan','raven','wolf']},
};
vaults.xp={...vaults.gold,name:'星火藏書塔',currency:'xp'};
vaults.tech={...vaults.gems,name:'秘技典藏庫',currency:'tech'};
export const localDay = (now=Date.now()) => new Date(now+8*3600000).toISOString().slice(0,10);
export function validDaily(data) {
  return !!data && Object.keys(vaults).every(key=>{
    const item=data[key];
    return (!item&&['xp','tech'].includes(key)) || item && Number.isInteger(item.highest)&&item.highest>=0&&item.highest<=10 &&
      Number.isInteger(item.used)&&item.used>=0&&item.used<=vaults[key].limit &&
      typeof item.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.day);
  });
}
export const emptyDaily = () => Object.fromEntries(Object.keys(vaults).map(key=>[key,{highest:0,used:0,day:localDay()}]));
export function dailyStatus(data,key,day=localDay()) {
  const item=data[key]??{highest:0,used:0,day};
  return {...item,used:item.day===day?item.used:0,day};
}
export function dailyStage({vault,floor}) {
 if(!Object.hasOwn(vaults,vault)||!Number.isInteger(floor)||floor<1||floor>10)return null;
 const levels=[10,20,30,40,50,60,70,80,90,99],info=vaults[vault],plan=dailyEncounters[vault][floor-1],head=floor===5||floor===10,heroLevel=Math.min(50,Math.ceil(levels[floor-1]/2));
 return {name:info.name+'・第 '+floor+' 層・'+plan.name,tactic:plan.name,hp:60+6*heroLevel,opponents:[...plan.deck],opening:head?[plan.deck[0]]:[],enemyLevel:levels[floor-1],enemyEffect:floor,heroLevel,hero:plan.hero,runeLevel:Math.ceil(floor/2),runes:[...plan.runes],head,goal:plan.goal};
}
export const dailyPay=(vault,floor)=>vault==='gold'?[1000,1500,2200,3000,4000,5200,6600,8200,10000,12000][floor-1]:vault==='gems'?[12,16,20,26,32,40,48,58,70,84][floor-1]:vault==='xp'?floor<=2?2:floor<=5?3:floor<=8?4:6:floor<=3?2:floor<=6?3:floor<=8?4:6;
export function claimDaily(data,vault,floor,sweep=false,day=localDay()) {
  if(!dailyStage({vault,floor}))return null;
  const item=dailyStatus(data,vault,day);
  if(item.used>=vaults[vault].limit||floor>item.highest+(sweep?0:1))return null;
  const first=floor>item.highest;
  const base=dailyPay(vault,floor);
  const amount=base+(first?Math.ceil(base/2):0);
  return {progress:{...data,[vault]:{day,used:item.used+1,highest:Math.max(floor,item.highest)}},amount,first};
}
