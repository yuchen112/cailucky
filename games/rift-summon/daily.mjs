export const vaults = {
  gold: {name:'熔金寶庫', limit:2, currency:'gold', opening:['guard','boar','knight','giant','boss'], roster:['guard','knight','boar','beetle','giant','ax','flag','turtle']},
  gems: {name:'星晶裂谷', limit:1, currency:'gems', opening:['wisp','moth','bat','raven','lion'], roster:['wisp','bat','moth','crane','koi','swan','raven','wolf']},
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
  const info=vaults[vault];
  const head=floor%5===0;
  const shift=(floor-1)%info.roster.length;
  const opponents=[...info.roster.slice(shift),...info.roster.slice(0,shift)].slice(0,4+Math.ceil(floor/3));
  return {name:`${info.name}・第 ${floor} 層`,hp:8+floor+Number(head)*3,opponents,
    opening:[info.opening[head?4:Math.floor((floor-1)/3)],...(floor>=7?[opponents[1]]:[])],head,
    goal:['gold','xp'].includes(vault)?'打破守軍護盾可使其攻擊降低 1 點。':'發亮的欄位將在下一次進攻時爆裂。'};
}
export const dailyPay = (vault,floor) => vault==='gold'?180+70*floor:vault==='gems'?8+2*floor:1+Math.floor((floor-1)/3);
export function claimDaily(data,vault,floor,sweep=false,day=localDay()) {
  if(!dailyStage({vault,floor}))return null;
  const item=dailyStatus(data,vault,day);
  if(item.used>=vaults[vault].limit||floor>item.highest+(sweep?0:1))return null;
  const first=floor>item.highest;
  const base=dailyPay(vault,floor);
  const amount=base+(first?Math.ceil(base/2):0);
  return {progress:{...data,[vault]:{day,used:item.used+1,highest:Math.max(floor,item.highest)}},amount,first};
}
