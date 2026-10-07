import {validateCollection,unitLevel,xpForLevel,MAX_LEVEL} from './recruitment.mjs?v=20261007-names1';
import {UNIT_RARITY} from './army.mjs?v=20261007-names1';
export const BOOK_XP=1;
export const BOOK_GRADES=Object.freeze(['common','rare','epic','legendary']);
export const BOOK_NAMES=Object.freeze({common:'一般',rare:'稀有',epic:'史詩',legendary:'傳說'});
export function validateBooks(value=0){if(!Number.isSafeInteger(value)||value<0||value>100000000)throw Error('訓練書數量不正確');return value;}
export function validateBookInventory(value,legacy=0){
 if(value==null)return {common:validateBooks(legacy),rare:0,epic:0,legendary:0};
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!BOOK_GRADES.includes(k)))throw Error('訓練書背包不正確');
 return Object.fromEntries(BOOK_GRADES.map(k=>[k,validateBooks(value[k]??0)]));
}
export function bookInventory(profile){return validateBookInventory(profile.bookInventory,profile.books);}
export function trainingInfo(profile,id){
 const c=validateCollection(profile.collection),xp=c.training[id];if(xp==null)throw Error('兵種不正確');
 const level=unitLevel(xp),floor=xpForLevel(level),next=level===MAX_LEVEL?floor:xpForLevel(level+1);
 return {effectLabel:id==='artisan'?'補給收益':'傷害',grade:UNIT_RARITY[id],owned:c.owned.includes(id),level,xp,progress:Math.max(0,xp-floor),required:next-floor,remaining:Math.max(0,next-xp),max:level===MAX_LEVEL,damage:(level-1)*3,nextDamage:Math.min(MAX_LEVEL-1,level)*3,available:bookInventory(profile)[UNIT_RARITY[id]]};
}
export function trainingPreview(profile,id,count=1){
 const collection=validateCollection(profile.collection),info=trainingInfo(profile,id);
 if(!info.owned||!Number.isSafeInteger(count)||count<1||count>info.available)throw Error('兵種未取得或對應稀有度訓練書不足');
 const remaining=Math.max(0,xpForLevel(MAX_LEVEL)-collection.training[id]);if(!remaining)throw Error('兵種已達養成上限');
 const consumed=Math.min(count,remaining),after=unitLevel(collection.training[id]+consumed);
 return {grade:info.grade,consumed,xp:consumed,before:info.level,after,damageBefore:info.damage,damageAfter:(after-1)*3};
}
export function useTrainingBooks(profile,id,count=1){
 const preview=trainingPreview(profile,id,count),collection=validateCollection(profile.collection),inventory=bookInventory(profile);
 collection.training[id]+=preview.xp;inventory[preview.grade]-=preview.consumed;
 return {profile:{...profile,collection,bookInventory:inventory,books:inventory.common},preview};
}
export function synthesizeBooks(profile,grade,count=1){
 const index=BOOK_GRADES.indexOf(grade),inventory=bookInventory(profile);
 if(index<0||index===3||!Number.isSafeInteger(count)||count<1||count>Math.floor(inventory[grade]/10))throw Error('合成數量不正確或材料不足');
 const target=BOOK_GRADES[index+1];if(inventory[target]+count>100000000)throw Error('持有量超過上限');
 inventory[grade]-=count*10;inventory[target]+=count;
 return {...profile,books:inventory.common,bookInventory:inventory};
}
