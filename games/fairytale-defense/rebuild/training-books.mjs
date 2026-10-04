import {validateCollection,unitLevel,xpForLevel,MAX_LEVEL} from './recruitment.mjs?v=20261005-story1';
export const BOOK_XP=1;
export function validateBooks(value=0){if(!Number.isSafeInteger(value)||value<0||value>100000000)throw Error('訓練書數量不正確');return value;}
export function trainingPreview(profile,id,count=1){
 const collection=validateCollection(profile.collection),books=validateBooks(profile.books);
 if(!collection.owned.includes(id)||!Number.isSafeInteger(count)||count<1||count>books)throw Error('兵種未取得或訓練書不足');
 const before=unitLevel(collection.training[id]),remaining=Math.max(0,xpForLevel(MAX_LEVEL)-collection.training[id]);
 if(!remaining)throw Error('兵種已達養成上限');
 const consumed=Math.min(count,Math.ceil(remaining/BOOK_XP)),xp=Math.min(remaining,consumed*BOOK_XP),after=unitLevel(collection.training[id]+xp);
 return {consumed,xp,before,after,damageBefore:(before-1)*3,damageAfter:(after-1)*3};
}
export function useTrainingBooks(profile,id,count=1){const preview=trainingPreview(profile,id,count),collection=validateCollection(profile.collection);collection.training[id]+=preview.xp;return {profile:{...profile,collection,books:profile.books-preview.consumed},preview};}
