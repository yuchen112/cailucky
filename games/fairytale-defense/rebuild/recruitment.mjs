// Offline, non-monetized collection. All four combat units are available from the start.
export const RECRUIT_UNITS=['archer','cannon','frost','firefly'];
export const DRAW_COST=100;
export const GRADES=[{id:'silver',name:'銀葉',chance:70,training:1,refund:20},{id:'gold',name:'金枝',chance:25,training:3,refund:35},{id:'prism',name:'虹晶',chance:5,training:8,refund:60}];
export function newCollection(){return {version:1,coins:300,total:0,sinceGold:0,sincePrism:0,owned:[],training:Object.fromEntries(RECRUIT_UNITS.map(id=>[id,0])),history:[]};}
const integer=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
export function validateCollection(raw){
 const v=raw??newCollection();
 if(v.version!==1||!integer(v.coins,100000000)||!integer(v.total,10000000)||!integer(v.sinceGold,9)||!integer(v.sincePrism,29)||v.sinceGold>v.total||v.sincePrism>v.total||!Array.isArray(v.owned)||v.owned.length>12||new Set(v.owned).size!==v.owned.length||v.owned.some(id=>!RECRUIT_UNITS.some(u=>GRADES.some(g=>id===u+':'+g.id)))||!v.training||RECRUIT_UNITS.some(id=>!integer(v.training[id],100000000))||!Array.isArray(v.history)||v.history.length>20)throw Error('收藏進度格式不正確');
 if(v.history.some(h=>!integer(h.number,v.total)||h.number<1||!RECRUIT_UNITS.includes(h.unit)||!GRADES.some(g=>g.id===h.grade)||typeof h.duplicate!=='boolean')||new Set(v.history.map(h=>h.number)).size!==v.history.length)throw Error('招募紀錄格式不正確');
 return {version:1,coins:v.coins,total:v.total,sinceGold:v.sinceGold,sincePrism:v.sincePrism,owned:[...v.owned],training:Object.fromEntries(RECRUIT_UNITS.map(id=>[id,v.training[id]])),history:v.history.map(h=>({...h}))};
}
export function drawOdds(value){const v=validateCollection(value);return v.sincePrism===29?[0,0,100]:v.sinceGold===9?[0,95,5]:[70,25,5];}
export function secureInt(max){if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Invalid random bound');const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
export function recruit(value,random=secureInt){
 const v=validateCollection(value);if(v.coins<DRAW_COST)throw Error(`星露不足，還差 ${DRAW_COST-v.coins}`);
 const roll=random(100),unitRoll=random(4);if(!integer(roll,99)||!integer(unitRoll,3))throw Error('Invalid random result');
 const odds=drawOdds(v),grade=roll<odds[0]?GRADES[0]:roll<odds[0]+odds[1]?GRADES[1]:GRADES[2],unit=RECRUIT_UNITS[unitRoll],id=unit+':'+grade.id,duplicate=v.owned.includes(id);
 v.coins-=DRAW_COST;if(duplicate)v.coins+=grade.refund;else v.owned.push(id);
 v.total++;v.sinceGold=grade.id==='silver'?v.sinceGold+1:0;v.sincePrism=grade.id==='prism'?0:v.sincePrism+1;v.training[unit]=Math.min(100000000,v.training[unit]+grade.training);
 const result={number:v.total,unit,grade:grade.id,duplicate};v.history=[result,...v.history].slice(0,20);
 return {collection:validateCollection(v),result:{...result,training:grade.training,refund:duplicate?grade.refund:0}};
}
export function trainingRanks(value){const v=validateCollection(value);return Object.fromEntries(RECRUIT_UNITS.map(id=>[id,Math.min(8,Math.floor(v.training[id]/10))]));}
export function rewardCollection(value,{waves=0,firstClearStage=0}={}){const v=validateCollection(value);if(!integer(waves,100000)||!integer(firstClearStage,15))throw Error('Invalid reward');v.coins=Math.min(100000000,v.coins+waves*5+(firstClearStage?80+firstClearStage*10:0));return v;}
