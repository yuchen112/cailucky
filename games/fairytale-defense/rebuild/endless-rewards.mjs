export const ENDLESS_LIMIT=99;
export function taiwanDay(time=Date.now()){
 if(!Number.isFinite(time))throw Error('日期不正確');
 return new Date(time+8*3600000).toISOString().slice(0,10);
}
export function validateRewardLedger(raw){
 const v=raw??{day:'',daily:[],first99:false};
 if(!v||typeof v.day!=='string'||(v.day!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(v.day))||!Array.isArray(v.daily)||new Set(v.daily).size!==v.daily.length||v.daily.some(n=>!Number.isInteger(n)||n<1||n>99)||typeof v.first99!=='boolean')throw Error('守城獎勵紀錄不正確');
 return {day:v.day,daily:[...v.daily].sort((a,b)=>a-b),first99:v.first99};
}
export function floorReward(floor){
 if(!Number.isInteger(floor)||floor<1||floor>99)throw Error('層數不正確');
 return {coins:10+Math.floor(floor/10)*3+(floor%5===0?20:0),books:10+Math.floor(floor/10)*2+(floor%5===0?20:0),dailyCoins:20+Math.floor(floor/10)*5,dailyBooks:floor%10===0?100:5};
}
export function awardEndless(value,from,to,time=Date.now()){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>99)throw Error('守城結算層數不正確');
 const old=validateRewardLedger(value),day=taiwanDay(time),ledger={...old,day,daily:old.day===day?[...old.daily]:[]};
 const reward={coins:0,books:0,basicCoins:0,dailyCoins:0,firstCoins:0};
 for(let floor=from+1;floor<=to;floor++){
  const r=floorReward(floor);reward.basicCoins+=r.coins;reward.books+=r.books;
  if(!ledger.daily.includes(floor)){ledger.daily.push(floor);reward.dailyCoins+=r.dailyCoins;reward.books+=r.dailyBooks;}
  if(floor===99&&!ledger.first99){ledger.first99=true;reward.firstCoins+=1000;reward.books+=1000;}
 }
 ledger.daily.sort((a,b)=>a-b);reward.coins=reward.basicCoins+reward.dailyCoins+reward.firstCoins;
 return {ledger,reward};
}
