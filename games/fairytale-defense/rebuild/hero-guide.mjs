import {ROLES} from './core.mjs?v=20261004-animation1';
import {MASTERY_THRESHOLDS} from './mastery.mjs?v=20261004-animation1';
import {skillSpec} from './skill-spec.mjs?v=20261004-animation1';
import {heroRange,passiveDescription} from './hero-rules.mjs?v=20261004-animation1';
const abilities={
 growth:['精銳培育','全場部隊依等級獲得傷害加成。','森林祝福','短時間強化全場部隊，適合在敵群進入集中火力區時使用。'],
 dream:['夢境刻印','命中留下夢印，部隊後續攻擊可消耗夢印追加傷害。','星雨','對最接近終點的敵人施放範圍星光，適合密集敵群。'],
 luck:['幸運補給','每擊退五名敵人，額外補充戰場金幣。','幸運祝福','給予全場部隊有限次數的暴擊機會，適合搭配高傷害單位。'],
 joy:['連擊節奏','全場部隊連續攻擊後逐漸加快攻速。','歡樂鼓舞','短時間提高全隊部隊攻擊頻率，適合持續接敵的防線。'],
 night:['凝月追擊','連續追擊同一目標可疊加普攻傷害。','月夜重擊','對最接近終點的敵人施放單體重擊，適合重甲與頭目。'],
 sadness:['細雨緩速','普攻命中減慢敵人，爭取更多輸出時間。','雨幕','對目標附近敵群施加較強緩速，搭配火力部隊效果更好。'],
 trust:['職業羈絆','全場部隊搭配不同職業時獲得傷害加成。','守護連結','短時間強化全場部隊，並補充核心護盾。'],
 memory:['回響記錄','記錄部隊實際造成的傷害，累積至回響上限。','回憶重現','消耗回響造成穿甲傷害；累積後使用比立刻施放更有效。'],
 healing:['花語修復','完成一波後恢復少量核心生命。','生命庇護','立即回復 3 點生命並補充護盾，不會超過生命上限。'],
 hope:['破曉穿甲','普攻穿甲，對重甲與頭目有額外傷害。','曙光','施放小範圍穿甲攻擊，適合集中突破強敵。']
};
export function renderHeroGuide(container,id,xp,level,build={}){const r=ROLES[id],a=abilities[id],hero={role:id,talents:{},...build},spec=skillSpec(hero,r),section=document.createElement('section');section.className='hero-guide';const image=document.createElement('img');image.loading='lazy';image.src=`art/${id}-cast.webp`;image.alt=r.name;const info=document.createElement('p');info.textContent=`普攻：基礎傷害 ${r.damage}｜全場支援｜${r.interval} 秒／次。固定指揮席，自動攻擊全場最接近終點的敵人，不需移動。${r.splash?`命中後波及半徑 ${r.splash}。`:''}${r.pierce?'無視護甲。':''}`;const progress=document.createElement('p');progress.textContent=level<10?`下一級還需 ${MASTERY_THRESHOLDS[level]-xp} XP；每完成一波取得 10 XP。`:'熟練度已達最高等級，仍可自由更換已開放戰術。';section.append(image,info);for(const [name,description] of [[a[0],passiveDescription(hero)],[spec.name,spec.description],[`冷卻 ${spec.cooldown} 秒`,spec.geometry+' '+spec.use]]){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=name;p.textContent=description;const card=document.createElement('div');card.className='ability-card';card.append(h,p);section.append(card);}section.append(progress);container.append(section);}
