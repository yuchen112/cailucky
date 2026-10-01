import {masteryLevel,HERO_IDS} from './mastery.mjs?v=20261001-complete2';

// Shared by gameplay and the future hero screen. First specialization tier only.
export const HERO_SPECIALIZATIONS=Object.freeze({
 growth:[{id:'elite',name:'精銳培育',description:'三級以上部隊被動傷害加成提高。'},{id:'grove',name:'森林共生',description:'主動祝福範圍由 155 增至 210。'}],
 dream:[{id:'wide',name:'繁星擴散',description:'主動星雨波及範圍由 85 增至 115。'},{id:'mark',name:'夢境刻印',description:'夢印追加傷害由 12 增至 20。'}],
 luck:[{id:'fortune',name:'補給祝福',description:'每五次擊敗敵人的額外金幣由 8 增至 12。'},{id:'critical',name:'幸運延續',description:'主動技能給予每個附近單位四次暴擊，而非三次。'}],
 joy:[{id:'rhythm',name:'節奏加速',description:'連擊被動最多縮短 20% 攻擊間隔，而非 15%。'},{id:'festival',name:'歡樂延續',description:'主動加速持續由 6 秒增至 9 秒。'}],
 night:[{id:'focus',name:'凝月',description:'連續追擊同一敵人，每次傷害提升由 10% 增至 15%，最多三層。'},{id:'hunt',name:'月夜追擊',description:'主動重擊傷害由四倍增至五倍。'}],
 sadness:[{id:'rain',name:'綿長細雨',description:'主動減速持續由 4 秒增至 6 秒。'},{id:'still',name:'凝結瞬間',description:'主動命中額外定身 0.6 秒；頭目效果縮短。'}],
 trust:[{id:'bond',name:'堅定羈絆',description:'不同職業被動加成由每種 4% 增至 6%，最多三種。'},{id:'shelter',name:'守護連結',description:'主動技能的基地護盾由 2 增至 4。'}],
 memory:[{id:'deep',name:'深刻回憶',description:'回響傷害儲存上限由 180 增至 260。'},{id:'spread',name:'回聲漣漪',description:'回響重現波及目標附近 45 範圍。'}],
 healing:[{id:'restore',name:'花語修復',description:'每波通關恢復生命由 1 增至 2。'},{id:'protect',name:'生命庇護',description:'主動護盾由 3 增至 5。'}],
 hope:[{id:'breaker',name:'破曉',description:'對重甲與頭目的被動傷害加成由 20% 增至 35%。'},{id:'dawn',name:'曙光擴散',description:'主動穿甲攻擊的波及範圍由 40 增至 65。'}]
});
// Shared tactical slots complement, rather than replace, each hero's unique skill.
export const HERO_TALENTS=Object.freeze({
 passive:{level:5,choices:[{id:'reach',name:'戰場洞察',description:'英雄普攻與附近部隊支援的判定距離增加 35。'},{id:'focus',name:'專注修練',description:'英雄普攻傷害增加 15%，不影響部隊傷害。'}]},
 active:{level:7,choices:[{id:'swift',name:'迅捷施法',description:'主動冷卻縮短為 16 秒，直接傷害降低 20%；增益效果不變。'},{id:'lasting',name:'從容施法',description:'主動冷卻延長為 24 秒，直接傷害提高 20%，限時增益或減速延長 2 秒。'}]},
 ultimate:{level:10,choices:[{id:'guardian',name:'最後守護',description:'每波一次，致命漏怪時保留 1 點生命。無敵人傷害。'},{id:'resolve',name:'破陣決心',description:'英雄對頭目的普攻與主動直接傷害增加 25%。'}]}
});
export function heroBuild(role,xp=0,specialization=null,talents={}){
 if(!HERO_IDS.includes(role)||!Number.isSafeInteger(xp)||xp<0||xp>10000000)throw Error('英雄培養資料不正確');
 if(specialization!==null&&(masteryLevel(xp)<3||!HERO_SPECIALIZATIONS[role].some(p=>p.id===specialization)))throw Error('尚未解鎖或無效的英雄專精');
 if(!talents||typeof talents!=='object'||Array.isArray(talents)||Object.keys(talents).some(k=>!Object.hasOwn(HERO_TALENTS,k)))throw Error('英雄天賦欄位不正確');
 const selected={};for(const [slot,config] of Object.entries(HERO_TALENTS)){const id=talents[slot]??null;if(id!==null&&(masteryLevel(xp)<config.level||!config.choices.some(c=>c.id===id)))throw Error('尚未解鎖或無效的英雄天賦');selected[slot]=id;}
 return {masteryXp:xp,specialization,talents:selected};
}
export const supportRadius=h=>155+(h?.talents?.passive==='reach'?35:0);
export const heroRange=(h,base)=>base+(h?.talents?.passive==='reach'?35:0);
export function activeModifiers(h){const id=h?.talents?.active;return {cooldown:id==='swift'?16:id==='lasting'?24:20,damage:id==='swift'?.8:id==='lasting'?1.2:1,duration:id==='lasting'?2:0};}
export function supportFor(s,t,pads){
 const h=s.hero,result={damage:1,interval:1};if(!h)return result;
 const pos=pads[t.pad],near=Math.hypot(pos.x-h.x,pos.y-h.y)<=supportRadius(h);
 if(h.role==='joy'&&near)result.interval*=1-Math.min(h.specialization==='rhythm'?.2:.15,t.attacks*.01);
 if(h.role==='growth'&&near)result.damage+=Math.min(.2,t.level*.04)+(h.specialization==='elite'&&t.level>=3?.1:0);
 if(h.role==='trust'&&near){const kinds=new Set(s.towers.filter(o=>o.id!==t.id&&Math.hypot(pads[o.pad].x-pos.x,pads[o.pad].y-pos.y)<=155).map(o=>o.role));result.damage+=Math.min(3,kinds.size)*(h.specialization==='bond'?.06:.04);}
 if(t.heroPowerUntil>s.time)result.damage*=1.3;
 if(h.hasteUntil>s.time)result.interval*=.7;
 if(t.trustUntil>s.time)result.interval*=.8;
 return result;
}
