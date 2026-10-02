// Ordinary troops have their own identities. No IP hero artwork may stand in for these.
export const UNITS=Object.freeze({
 archer:{name:'橡果弩手',cost:70,damage:18,interval:.9,range:145,kind:'bolt'},
 cannon:{name:'蘑菇炮手',cost:130,damage:25,interval:1.9,range:155,splash:48,kind:'spore'},
 frost:{name:'霜露精靈',cost:95,damage:9,interval:1.2,range:140,slow:.6,kind:'frost'},
 crystal:{name:'晶角守衛',cost:110,damage:16,interval:1.1,range:130,shred:.2,kind:'crystal'},
 firefly:{name:'螢光射手',cost:90,damage:24,interval:.95,range:170,air:true,kind:'glow'},
 chime:{name:'風鈴術士',cost:120,damage:18,interval:1.4,range:145,bounces:2,kind:'wind'},
 blossom:{name:'花苞祭司',cost:100,damage:6,interval:1.5,range:125,aura:1.15,kind:'bloom'},
 clockwork:{name:'發條投手',cost:150,damage:58,interval:2.1,range:215,minRange:65,kind:'gear'},
 alchemist:{name:'琥珀藥師',cost:125,damage:10,interval:1.6,range:145,splash:36,poison:8,kind:'spore'},
 vine:{name:'藤蔓園丁',cost:115,damage:12,interval:1.7,range:145,rootEvery:3,rootDuration:.7,kind:'seed'},
 oracle:{name:'星砂預言師',cost:190,damage:38,interval:1.8,range:165,pierce:true,mark:1.15,kind:'light'},
 dragon:{name:'燈火幼龍',cost:210,damage:34,interval:1.8,range:150,splash:55,poison:5,kind:'spark'}
});
export const UNIT_BRANCHES={
 archer:[{id:'rapid',name:'連弩',interval:.72},{id:'heavy',name:'重弩',damage:1.45}],
 cannon:[{id:'wide',name:'孢子擴散',splash:30},{id:'pierce',name:'破甲砲',pierce:true}],
 frost:[{id:'long',name:'綿長霜露',slowDuration:4},{id:'root',name:'凝霜',rootEvery:3,rootDuration:.5}],
 crystal:[{id:'rapid',name:'晶角連擊',interval:.7},{id:'heavy',name:'碎甲重擊',damage:1.5}],
 firefly:[{id:'far',name:'遠空追擊',range:40},{id:'rapid',name:'流螢連射',interval:.75}],
 chime:[{id:'rapid',name:'疾風鈴',interval:.75},{id:'heavy',name:'重奏',damage:1.5}],
 blossom:[{id:'power',name:'繁花祝福',aura:1.3},{id:'haste',name:'春風祝福',haste:.85}],
 clockwork:[{id:'far',name:'遠投機構',range:40},{id:'wide',name:'散射機構',splash:35}],
 alchemist:[{id:'wide',name:'琥珀霧',splash:25},{id:'heavy',name:'濃縮配方',damage:1.5}],
 vine:[{id:'root',name:'深根纏繞',rootEvery:2,rootDuration:1},{id:'rapid',name:'疾生蔓',interval:.72}],
 oracle:[{id:'heavy',name:'星辰裁決',damage:1.5},{id:'wide',name:'星砂漣漪',splash:35}],
 dragon:[{id:'wide',name:'燈火燎原',splash:30},{id:'rapid',name:'飛焰吐息',interval:.75}]
};
export function validateLoadout(ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>5||new Set(ids).size!==ids.length||ids.some(id=>!Object.hasOwn(UNITS,id)))throw Error('請選擇一至五種不同兵種');
 return [...ids];
}
export const DEFAULT_LOADOUT=Object.freeze(['archer','cannon','frost','firefly']);
export const STARTER_UNITS=Object.freeze(['archer','cannon','frost']);
export const UNIT_RARITY=Object.freeze({archer:'common',cannon:'common',frost:'common',firefly:'rare',crystal:'rare',vine:'rare',chime:'epic',blossom:'epic',alchemist:'epic',clockwork:'legendary',oracle:'legendary',dragon:'legendary'});
export const UNIT_GUIDES=Object.freeze({archer:['單體連射','低費用、穩定火力；重甲敵人需搭配破甲。'],cannon:['範圍清場','清理聚集敵人；攻速慢，需搭配控制。'],frost:['緩速控制','延長火力覆蓋時間；不能單獨承擔主力輸出。'],firefly:['遠程射擊','遠距離補刀，彌補防線空隙。'],crystal:['破甲支援','命中削弱護甲，幫助其他部隊打重甲。'],chime:['連鎖法術','攻擊跳向附近敵人，越密集越有效。'],blossom:['鼓舞支援','附近友軍傷害加成；同類光環不累乘。'],clockwork:['重型狙擊','高傷、長射程；近距離有無法攻擊的死角。'],alchemist:['持續傷害','琥珀毒霧持續傷害，同類毒素取較強值、不無限疊加。'],vine:['定身控場','每三擊短暫纏住敵人；頭目抗性與免控間隔防止永久定身。'],oracle:['穿甲標記','穿甲命中並標記，讓後續攻擊造成額外傷害。'],dragon:['範圍灼燒','吐息波及敵群並持續灼燒，部署費用較高。']});
