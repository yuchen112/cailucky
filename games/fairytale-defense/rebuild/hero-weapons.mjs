import {HERO_IDS,MASTERY_THRESHOLDS} from './mastery.mjs?v=20261005-complete1';
export const HERO_CAP=MASTERY_THRESHOLDS.at(-1),WEAPON_CAP=10,WEAPON_DROP_CHANCE=.1,WEAPON_DROP_XP=100;
export const WEAPONS=Object.freeze({
 growth:{name:'翠芽指揮杖',effect:'全隊傷害',kind:'armyDamage'},
 dream:{name:'星夢法杖',effect:'技能波及範圍',kind:'splash'},
 luck:{name:'幸運四葉權杖',effect:'技能暴擊次數',kind:'charges'},
 joy:{name:'歡樂節拍鈴',effect:'鼓舞持續時間',kind:'duration'},
 night:{name:'凝月長弓',effect:'技能直接傷害',kind:'damage'},
 sadness:{name:'細雨晶杖',effect:'技能減速持續時間',kind:'slowDuration'},
 trust:{name:'羈絆守護盾',effect:'技能核心護盾',kind:'shield'},
 memory:{name:'回聲記錄之書',effect:'回響儲存上限',kind:'echo'},
 healing:{name:'花語療癒杖',effect:'技能恢復生命',kind:'heal'},
 hope:{name:'破曉星槍',effect:'技能直接傷害',kind:'damage'}
});
export const weaponThreshold=l=>50*l*(l-1);
export function weaponLevel(xp){let l=1;while(l<WEAPON_CAP&&xp>=weaponThreshold(l+1))l++;return l;}
export function validateWeapons(value){
 if(value==null)value={};
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(id=>!HERO_IDS.includes(id)))throw Error('專武存檔不正確');
 return Object.fromEntries(HERO_IDS.map(id=>{const w=value[id]??{unlocked:false,xp:0,pending:0,drops:0};if(typeof w.unlocked!=='boolean'||['xp','pending','drops'].some(k=>!Number.isSafeInteger(w[k])||w[k]<0||w[k]>10000000)||w.xp>weaponThreshold(WEAPON_CAP)||(!w.unlocked&&w.xp>0)||(w.unlocked&&w.pending>0))throw Error('專武進度不正確');return [id,{unlocked:w.unlocked,xp:w.xp,pending:w.pending,drops:w.drops}];}));
}
export function awardWeapon(value,hero,{overflow=0,drop=false}={}){
 const weapons=validateWeapons(value);if(!HERO_IDS.includes(hero)||!Number.isSafeInteger(overflow)||overflow<0||typeof drop!=='boolean')throw Error('專武獎勵不正確');
 const w=weapons[hero],before=w.xp,wasUnlocked=w.unlocked;
 if(drop){w.drops=Math.min(10000000,w.drops+1);w.unlocked=true;}
 if(w.unlocked){w.xp=Math.min(weaponThreshold(WEAPON_CAP),w.xp+w.pending+overflow+(drop&&wasUnlocked?WEAPON_DROP_XP:0));w.pending=0;}
 else w.pending=Math.min(10000000,w.pending+overflow);
 return {weapons,receipt:{drop,opened:drop&&!wasUnlocked,xp:w.xp-before,pending:w.pending,level:w.unlocked?weaponLevel(w.xp):0}};
}
export function weaponBonus(hero,level=0){
 if(!HERO_IDS.includes(hero)||!Number.isInteger(level)||level<0||level>10)throw Error('專武等級不正確');
 return {level,armyDamage:hero==='growth'?level*.015:0,splash:hero==='dream'?level*3:0,charges:hero==='luck'?Math.floor(level/3):0,duration:hero==='joy'?level*.3:0,damage:['night','hope'].includes(hero)?1+level*.03:1,slowDuration:hero==='sadness'?level*.3:0,shield:hero==='trust'?Math.ceil(level/3):0,echo:hero==='memory'?level*12:0,heal:hero==='healing'?Math.ceil(level/4):0};
}
export function weaponEffectText(hero,level){const b=weaponBonus(hero,level),key=WEAPONS[hero].kind;return key==='armyDamage'?'全隊傷害 +'+(b.armyDamage*100).toFixed(1)+'%':key==='damage'?'技能直接傷害 +'+Math.round((b.damage-1)*100)+'%':WEAPONS[hero].effect+' +'+b[key]+(['duration','slowDuration'].includes(key)?' 秒':'');}
export function weaponSummary(hero,w){
 const l=w.unlocked?weaponLevel(w.xp):0,b=weaponBonus(hero,l),key=WEAPONS[hero].kind;
 const effect=key==='armyDamage'?'全隊傷害 +'+(b.armyDamage*100).toFixed(1)+'%':key==='damage'?'技能直接傷害 +'+Math.round((b.damage-1)*100)+'%':WEAPONS[hero].effect+' +'+b[key]+(['duration','slowDuration'].includes(key)?' 秒':'');
 return {level:l,effect,nextEffect:l<10?weaponEffectText(hero,l+1):null,next:l<10?weaponBonus(hero,l+1):null,remaining:w.unlocked?Math.max(0,weaponThreshold(Math.min(10,l+1))-w.xp):0};
}
export function validateWeaponReceipt(v){if(v==null)return null;if(typeof v!=='object'||Array.isArray(v)||typeof v.drop!=='boolean'||typeof v.opened!=='boolean'||v.opened&&!v.drop||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>weaponThreshold(WEAPON_CAP)||!Number.isSafeInteger(v.pending)||v.pending<0||v.pending>10000000||!Number.isInteger(v.level)||v.level<0||v.level>WEAPON_CAP)throw Error('專武結算紀錄不正確');return {drop:v.drop,opened:v.opened,xp:v.xp,pending:v.pending,level:v.level};}

