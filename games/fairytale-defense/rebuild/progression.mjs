// Data shared by combat and descriptions. No duplicated display-only upgrade values.
import {UNIT_BRANCHES} from './army.mjs?v=20261003-interface1';
export const SPECIALIZATIONS = {
 growth:[{id:'rapid',name:'萌芽連射',description:'攻擊間隔縮短 28%。',interval:.72},{id:'pierce',name:'古木重擊',description:'傷害提高 35%，無視護甲。',damage:1.35,pierce:true}],
 dream:[{id:'wide',name:'繁星擴散',description:'星光波及半徑增加 30。',splash:30},{id:'burst',name:'聚夢星核',description:'傷害提高 70%，波及半徑減少 20。',damage:1.7,splash:-20}],
 luck:[{id:'fortune',name:'幸運節拍',description:'每兩次攻擊觸發一次雙倍傷害。',crit:2},{id:'steady',name:'祝福之力',description:'每次攻擊傷害提高 45%。',damage:1.45}],
 joy:[{id:'quick',name:'雀躍節奏',description:'攻擊間隔縮短 30%。',interval:.7},{id:'party',name:'歡樂四散',description:'命中波及半徑 38 內的敵人。',splash:38}],
 night:[{id:'heavy',name:'深夜守望',description:'傷害提高 60%，攻擊間隔延長 15%。',damage:1.6,interval:1.15},{id:'far',name:'月光遠眺',description:'射程增加 45，攻擊間隔縮短 15%。',range:45,interval:.85}],
 sadness:[{id:'rain',name:'綿綿細雨',description:'減速延長至 3.5 秒。',slowDuration:3.5},{id:'still',name:'凝雨時刻',description:'每三次命中附加 0.5 秒定身。',rootEvery:3,rootDuration:.5}],
 trust:[{id:'bond',name:'堅定羈絆',description:'附近伙伴傷害加成提升至 35%。',aura:1.35},{id:'rhythm',name:'同心節奏',description:'保留傷害支援，另使附近伙伴攻擊間隔縮短 15%。',haste:.85}],
 memory:[{id:'echo',name:'回聲漣漪',description:'穿甲攻擊波及半徑 35 內的敵人。',splash:35},{id:'recall',name:'瞬間回憶',description:'攻擊間隔縮短 30%，射程增加 15。',interval:.7,range:15}],
 healing:[{id:'restore',name:'溫柔療癒',description:'每波結束恢復 3 點生命。',heal:3},{id:'protect',name:'安心庇護',description:'每波開始給予 2 點守護護盾；護盾不累積。',shield:2}],
 hope:[{id:'dawn',name:'曙光綻放',description:'波及半徑增加 30，射程增加 15。',splash:30,range:15},{id:'beacon',name:'希望燈塔',description:'傷害提高 60%，保留穿甲與小範圍波及。',damage:1.6}]
};
export const ROLE_GUIDES = {
 growth:{tag:'單體輸出',strength:'穩定處理一般敵人',weakness:'未選穿甲專精前較怕護甲',partner:'搭配悲傷延長輸出時間'},
 dream:{tag:'範圍清場',strength:'聚集的小群敵人',weakness:'攻擊間隔較長',partner:'搭配悲傷聚集敵人'},
 luck:{tag:'節奏爆發',strength:'固定次數觸發雙倍傷害',weakness:'不是每次攻擊都有爆發',partner:'搭配信任強化傷害'},
 joy:{tag:'快速輸出',strength:'快速補刀',weakness:'單發傷害較低且射程較短',partner:'搭配夜晚陪伴處理殘血'},
 night:{tag:'長程重擊',strength:'長距離追擊強敵',weakness:'攻擊較慢，怕大量小怪',partner:'搭配夢想負責群體敵人'},
 sadness:{tag:'控制減速',strength:'延長伙伴可攻擊時間',weakness:'自身傷害較低',partner:'搭配成長或夢想'},
 trust:{tag:'伙伴支援',strength:'增強 155 範圍內其他伙伴',weakness:'獨自部署收益較小',partner:'放在兩位以上輸出伙伴附近'},
 memory:{tag:'穿甲輸出',strength:'無視敵人護甲',weakness:'初期沒有範圍傷害',partner:'搭配快樂清小怪'},
 healing:{tag:'守護恢復',strength:'波次間恢復守護目標生命',weakness:'不能取代主力輸出',partner:'搭配希望或夜晚陪伴'},
 hope:{tag:'穿甲範圍',strength:'護甲敵人與小群敵人',weakness:'部署成本與攻擊間隔較高',partner:'搭配信任提升範圍收益'}
};
export const BLESSINGS={
 shatter:{name:'碎冰協奏',description:'攻擊被緩速敵人時，直接傷害增加 12%，可累加。'},
 command:{name:'指揮節拍',description:'英雄自動支援攻擊間隔縮短 6%，最多八次；不影響主動冷卻。'},
 repair:{name:'核心修補',description:'立即修復最多 4 點核心生命，不超過上限。'},
 supplies:{name:'林間補給',description:'立即獲得 100 金幣。'},
 power:{name:'伙伴共鳴',description:'本場全隊基礎傷害增加 8%，可累加。'},
 reach:{name:'遠望祝福',description:'本場全隊射程增加 8，可累加。'}
};
export function statsFor(base,tower,buffs={power:0,reach:0}){
 const p=(SPECIALIZATIONS[tower.role]||UNIT_BRANCHES[tower.role])?.find(p=>p.id===tower.branch)||{};
 return {...base,damage:base.damage*(1+.45*(tower.level-1))*(p.damage||1)*(1+(buffs.power||0)*.08),interval:base.interval*(tower.level>=2?.94:1)*(p.interval||1)*(tower.level>=4?.9:1),range:base.range+(p.range||0)+(buffs.reach||0)*8,
 splash:Math.max(0,(base.splash||0)+(p.splash||0)+(tower.level===5&&p.splash>0?10:0)),pierce:p.pierce||base.pierce||false,crit:p.crit||base.crit||0,slowDuration:p.slowDuration||2,rootEvery:p.rootEvery||base.rootEvery||0,rootDuration:p.rootDuration||base.rootDuration||0,aura:p.aura||base.aura||0,haste:p.haste||1,auraRange:155,heal:p.heal||base.heal||0,shield:p.shield||0};
}
