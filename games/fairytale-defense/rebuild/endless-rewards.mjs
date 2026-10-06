export const ENDLESS_LIMIT=99;
export function taiwanDay(time=Date.now()){
 if(!Number.isFinite(time))throw Error('日期不正確');
 return new Date(time+8*3600000).toISOString().slice(0,10);
}
export const TOWER_IDS=Object.freeze(['forest','moon','dawn','ruins']);
export function validateRewardLedger(raw,legacyTower='forest'){
 const v=raw??{day:'',daily:[],first99:false};
 if(!TOWER_IDS.includes(legacyTower)||!v||typeof v.day!=='string'||(v.day!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(v.day))||typeof v.first99!=='boolean')throw Error('守塔獎勵紀錄不正確');
 const valid=rows=>Array.isArray(rows)&&new Set(rows).size===rows.length&&rows.every(n=>Number.isInteger(n)&&n>=1&&n<=99);
 let towers=v.byTower;
 if(towers===undefined){if(!valid(v.daily))throw Error('守塔獎勵紀錄不正確');towers=Object.fromEntries(TOWER_IDS.map(id=>[id,id===legacyTower?v.daily:[]]));}
 if(!towers||typeof towers!=='object'||Array.isArray(towers)||Object.keys(towers).some(id=>!TOWER_IDS.includes(id))||TOWER_IDS.some(id=>!valid(towers[id]??[])))throw Error('守塔獎勵紀錄不正確');
 return {day:v.day,byTower:Object.fromEntries(TOWER_IDS.map(id=>[id,[...(towers[id]??[])].sort((a,b)=>a-b)])),first99:v.first99};
}
export function towerDaily(value,tower,time=Date.now()){
 if(!TOWER_IDS.includes(tower))throw Error('守塔種類不正確');
 const ledger=validateRewardLedger(value),claimed=ledger.day===taiwanDay(time)?ledger.byTower[tower]:[];
 return {claimed:[...claimed],highest:Math.max(0,...claimed),next:Array.from({length:99},(_,i)=>i+1).find(n=>!claimed.includes(n))??null};
}
export function floorReward(floor){
 if(!Number.isInteger(floor)||floor<1||floor>99)throw Error('層數不正確');
 return {coins:10+Math.floor(floor/10)*3+(floor%5===0?20:0),books:10+Math.floor(floor/10)*2+(floor%5===0?20:0),dailyCoins:20+Math.floor(floor/10)*5,dailyBooks:floor%10===0?100:5};
}
export function awardEndless(value,from,to,time=Date.now(),tower='forest'){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>99)throw Error('守城結算層數不正確');
 if(!TOWER_IDS.includes(tower))throw Error('守塔種類不正確');
 const old=validateRewardLedger(value,tower),day=taiwanDay(time),ledger={...old,day,byTower:Object.fromEntries(TOWER_IDS.map(id=>[id,old.day===day?[...old.byTower[id]]:[]]))},daily=ledger.byTower[tower];
 const reward={coins:0,books:0,basicCoins:0,dailyCoins:0,firstCoins:0};
 for(let floor=from+1;floor<=to;floor++){
  const r=floorReward(floor);reward.basicCoins+=r.coins;reward.books+=r.books;
  if(!daily.includes(floor)){daily.push(floor);reward.dailyCoins+=r.dailyCoins;reward.books+=r.dailyBooks;}
  if(floor===99&&!ledger.first99){ledger.first99=true;reward.firstCoins+=1000;reward.books+=1000;}
 }
 daily.sort((a,b)=>a-b);reward.coins=reward.basicCoins+reward.dailyCoins+reward.firstCoins;
 return {ledger,reward};
}
