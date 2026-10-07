import {CAMPAIGN} from './encounters.mjs?v=20261007-names1';
// IDs survive appended/reordered content; numbers are retained for legacy clients.
export function validateCampaignProgress(raw={unlocked:1,cleared:[]},catalog=CAMPAIGN){
 const count=catalog.length,ids=catalog.map(c=>c.id);
 if(!count||new Set(ids).size!==count||ids.some(id=>typeof id!=='string'||!id.length))throw Error('關卡資料不正確');
 let cleared;
 if(raw.clearedIds!=null){
  if(!Array.isArray(raw.clearedIds)||raw.clearedIds.length>count||new Set(raw.clearedIds).size!==raw.clearedIds.length||raw.clearedIds.some(id=>!ids.includes(id)))throw Error('通關關卡 ID 不正確');
  cleared=raw.clearedIds.map(id=>ids.indexOf(id)+1).sort((a,b)=>a-b);
 }else{
  cleared=raw.cleared;
  if(!Number.isSafeInteger(raw.unlocked)||raw.unlocked<1||raw.unlocked>count||!Array.isArray(cleared)||cleared.length>count||new Set(cleared).size!==cleared.length||cleared.some(n=>!Number.isInteger(n)||n<1||n>count)||Array.from({length:raw.unlocked-1},(_,i)=>i+1).some(n=>!cleared.includes(n))||cleared.some(n=>n>=raw.unlocked&&!(n===count&&raw.unlocked===count)))throw Error('主線進度不正確');
  cleared=[...cleared].sort((a,b)=>a-b);
 }
 const next=catalog.findIndex((_,i)=>!cleared.includes(i+1)),unlocked=next<0?count:next+1;
 return {unlocked,cleared,clearedIds:cleared.map(n=>ids[n-1]),unlockedId:ids[unlocked-1]};
}
