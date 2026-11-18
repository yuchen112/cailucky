import {rarity} from './economy.mjs?v=bag18-1';
import {materials} from './materials.mjs?v=bag18-1';
import {xpNeeded,levelLimit,effectPoints} from './inventory.mjs?v=bag18-1';
import {effectCosts} from './runes.mjs?v=bag18-1';
export const recoveryRate=.8;
export function investedExperience(item){if(item.kind==='material')return 0;let n=item.experience??0;for(let lv=1;lv<item.level;lv++)n+=xpNeeded(lv,item);return n+(item.reserveExperience??0);}
export function investedEffect(item){let n=item.effectExperience??0;for(let lv=1;lv<(item.effect??1);lv++)n+=effectCosts[lv-1];return n;}
export const isTrained=item=>item.kind!=='material'&&(item.level>1||!!item.experience||(item.effect??1)>1||!!item.effectExperience||!!item.breakthrough||!!item.reserveExperience);
export function feedingValue(item){const baseXP=materials[item.id]?.xp??({N:40,R:50,SR:65,S:80,SS:100,SSR:125,UUR:150,XUR:200}[rarity(item.id)]??50),xp=investedExperience(item),effect=investedEffect(item);return {baseXP,investedXP:xp,recoveredXP:Math.floor(xp*recoveryRate),xp:baseXP+Math.floor(xp*recoveryRate),effect:effectPoints(item)+Math.floor(effect*recoveryRate),investedEffect:effect,recoveredEffect:Math.floor(effect*recoveryRate)};}
export const materialExperience=item=>feedingValue(item).xp;
export const materialEffect=item=>feedingValue(item).effect;
export function experienceRoom(item){let n=-(item.experience??0);for(let lv=item.level;lv<levelLimit(item);lv++)n+=xpNeeded(lv,item);return Math.max(0,n);}
export function lineupAdvice(items,cards,profiles){const counts={protection:0,healing:0,control:0,damage:0};let countdown=0;for(const item of items){const p=profiles[item.id];if(!p)continue;countdown+=cards[item.id][1];if(['tank','barrier','support'].includes(p.role))counts.protection++;if(['healer','medic'].includes(p.role)||['mend','regen','leech'].includes(p.trait))counts.healing++;if(['frost','poison','burn'].includes(p.trait)||['my04','an05','an09','al06','al07'].includes(item.id))counts.control++;if(['hunter','sweeper','breaker','charger','fighter','bomber','leader'].includes(p.role))counts.damage++;}const average=items.length?countdown/items.length:0,notes=[];if(!counts.protection)notes.push('缺少護衛／護盾');if(!counts.healing)notes.push('缺少治療／吸血續航');if(average>2.5)notes.push('部署較慢，建議搭配加速或低倒數卡');return {counts,average,notes};}
