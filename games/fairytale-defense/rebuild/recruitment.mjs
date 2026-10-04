import {UNITS,STARTER_UNITS,UNIT_RARITY} from './army.mjs?v=20261005-story1';
export const RECRUIT_UNITS=Object.keys(UNITS),DRAW_COST=100,MAX_LEVEL=30;
export const GRADES=[{id:'common',name:'一般',chance:70},{id:'rare',name:'稀有',chance:23},{id:'epic',name:'史詩',chance:6},{id:'legendary',name:'傳說',chance:1}];
const integer=(n,max=100000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
export const xpForLevel=level=>level*(level-1)/2;
export function unitLevel(xp=0){let level=1;while(level<MAX_LEVEL&&xp>=xpForLevel(level+1))level++;return level;}
export function newCollection(){return {version:2,coins:300,total:0,sinceRare:0,sinceEpic:0,sinceLegendary:0,owned:[...STARTER_UNITS],training:Object.fromEntries(RECRUIT_UNITS.map(id=>[id,0])),points:0,history:[],lastBatch:null};}
export function validateCollection(raw){
 let v=raw??newCollection();
 if(v.version===1){
  if(!integer(v.coins)||!integer(v.total,10000000)||!v.training||!Array.isArray(v.owned)||!Array.isArray(v.history))throw Error('舊招募紀錄不正確');
  // Preserve access to the original four units and at least their prior bonus.
  const next=newCollection();next.coins=v.coins;next.total=v.total;next.owned=['archer','cannon','frost','firefly'];
  for(const id of next.owned){if(!integer(v.training[id]))throw Error('舊訓練進度不正確');next.training[id]=Math.max(xpForLevel(1+Math.ceil(Math.min(8,Math.floor(v.training[id]/10))/3)),Math.floor(v.training[id]/10));}
  next.sinceRare=Math.min(9,v.sinceGold||0);next.sinceEpic=Math.min(29,v.sincePrism||0);next.sinceLegendary=Math.min(79,v.sincePrism||0);
  next.history=v.history.map(h=>({...h,grade:UNIT_RARITY[h.unit],training:0,refund:0,levelBefore:unitLevel(next.training[h.unit]),levelAfter:unitLevel(next.training[h.unit]),legacy:true}));next.lastBatch=v.lastBatch??null;v=next;
 }
 // Older version-2 saves gain only the newly introduced zero-XP fields.
 if(v.version===2&&v.training&&typeof v.training==='object'){v={...v,training:{...v.training}};for(const id of ['scout','warden','storm','bramble','artisan'])if(!Object.hasOwn(v.training,id))v.training[id]=0;}
 if(v.version!==2||!integer(v.coins)||!integer(v.total,10000000)||!integer(v.points)||!integer(v.sinceRare,9)||!integer(v.sinceEpic,29)||!integer(v.sinceLegendary,79)||!Array.isArray(v.owned)||v.owned.length>RECRUIT_UNITS.length||new Set(v.owned).size!==v.owned.length||v.owned.some(id=>!RECRUIT_UNITS.includes(id))||STARTER_UNITS.some(id=>!v.owned.includes(id))||!v.training||RECRUIT_UNITS.some(id=>!integer(v.training[id]))||!Array.isArray(v.history)||v.history.length>20)throw Error('兵種收藏格式不正確');
 if(v.history.some(h=>!integer(h.number,v.total)||h.number<1||!RECRUIT_UNITS.includes(h.unit)||h.grade!==UNIT_RARITY[h.unit]||typeof h.duplicate!=='boolean')||new Set(v.history.map(h=>h.number)).size!==v.history.length)throw Error('招募歷史不正確');
 const batch=v.lastBatch??null;if(batch&&(![1,10].includes(batch.count)||!integer(batch.first,v.total)||batch.first<1||batch.first+batch.count-1!==v.total||v.history.filter(h=>h.number>=batch.first).length!==batch.count))throw Error('招募批次紀錄不正確');
 return {version:2,coins:v.coins,total:v.total,points:v.points,sinceRare:v.sinceRare,sinceEpic:v.sinceEpic,sinceLegendary:v.sinceLegendary,owned:[...v.owned],training:Object.fromEntries(RECRUIT_UNITS.map(id=>[id,v.training[id]])),history:v.history.map(h=>({number:h.number,unit:h.unit,grade:h.grade,duplicate:h.duplicate,training:integer(h.training,1)?h.training:0,refund:0,points:integer(h.points,10)?h.points:0,levelBefore:integer(h.levelBefore,MAX_LEVEL)&&h.levelBefore>0?h.levelBefore:1,levelAfter:integer(h.levelAfter,MAX_LEVEL)&&h.levelAfter>0?h.levelAfter:1,...(h.legacy===true?{legacy:true}:{})})),lastBatch:batch?{...batch}:null};
}
export function drawOdds(value){const v=validateCollection(value);return v.sinceLegendary===79?[0,0,0,100]:v.sinceEpic===29?[0,0,99,1]:v.sinceRare===9?[0,93,6,1]:[70,23,6,1];}
export function secureInt(max){if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Invalid random bound');const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
export function grantUnit(v,unit){const duplicate=v.owned.includes(unit),levelBefore=unitLevel(v.training[unit]);let points=0;if(!duplicate)v.owned.push(unit);else if(levelBefore===MAX_LEVEL){points=10;v.points=Math.min(100000000,v.points+points);}else v.training[unit]++;return {unit,grade:UNIT_RARITY[unit],duplicate,training:duplicate&&levelBefore<MAX_LEVEL?1:0,refund:0,points,levelBefore,levelAfter:unitLevel(v.training[unit])};}
export function recruit(value,random=secureInt){
 const v=validateCollection(value);if(v.coins<DRAW_COST)throw Error('星露不足，還差 '+(DRAW_COST-v.coins));
 const roll=random(100);if(!integer(roll,99))throw Error('Invalid random result');let sum=0;const odds=drawOdds(v),index=odds.findIndex(n=>(sum+=n)>roll),grade=GRADES[index],pool=RECRUIT_UNITS.filter(id=>UNIT_RARITY[id]===grade.id),pick=random(pool.length);if(!integer(pick,pool.length-1))throw Error('Invalid random result');
 v.coins-=DRAW_COST;v.total++;v.sinceRare=index>=1?0:v.sinceRare+1;v.sinceEpic=index>=2?0:v.sinceEpic+1;v.sinceLegendary=index===3?0:v.sinceLegendary+1;
 const result={number:v.total,...grantUnit(v,pool[pick])};v.history=[result,...v.history].slice(0,20);v.lastBatch=null;return {collection:validateCollection(v),result};
}
export function trainingRanks(value){const v=validateCollection(value);return Object.fromEntries(RECRUIT_UNITS.map(id=>[id,(unitLevel(v.training[id])-1)*3]));}
export function recruitBatch(value,count=1,random=secureInt){if(![1,10].includes(count))throw Error('只支援單抽或十連抽');let collection=validateCollection(value);const cost=DRAW_COST*count;if(collection.coins<cost)throw Error('星露不足，還差 '+(cost-collection.coins));const results=[];for(let i=0;i<count;i++){const next=recruit(collection,random);collection=next.collection;results.push(next.result);}collection.lastBatch={first:results[0].number,count};return {collection,results,cost,refund:0};}
export const exchangeCost=id=>({common:10,rare:20,epic:40,legendary:80})[UNIT_RARITY[id]];
export function exchangeUnit(value,id){const v=validateCollection(value),cost=exchangeCost(id);if(!cost||v.points<cost)throw Error('招募點數不足');if(v.owned.includes(id)&&unitLevel(v.training[id])===MAX_LEVEL)throw Error('此兵種已滿級');v.points-=cost;const result=grantUnit(v,id);return {collection:validateCollection(v),result};}
export function rewardCollection(value,{waves=0,firstClearStage=0}={}){const v=validateCollection(value);if(!integer(waves,100000)||!integer(firstClearStage,15))throw Error('Invalid reward');v.coins=Math.min(100000000,v.coins+waves*10+(firstClearStage?150+firstClearStage*10:0));return v;}
