// Ordinary troops have their own identities. No IP hero artwork may stand in for these.
export const UNITS=Object.freeze({
 archer:{name:'橡果弩手',cost:70,damage:18,interval:.9,range:145,kind:'bolt'},
 cannon:{name:'蘑菇炮手',cost:130,damage:25,interval:1.9,range:155,splash:48,kind:'spore'},
 frost:{name:'霜露精靈',cost:95,damage:9,interval:1.2,range:140,slow:.6,kind:'frost'},
 crystal:{name:'晶角守衛',cost:110,damage:16,interval:1.1,range:130,shred:.2,kind:'crystal'},
 firefly:{name:'螢光射手',cost:90,damage:24,interval:.95,range:170,air:true,kind:'glow'},
 chime:{name:'風鈴術士',cost:120,damage:18,interval:1.4,range:145,bounces:2,kind:'wind'},
 blossom:{name:'花苞祭司',cost:100,damage:6,interval:1.5,range:125,aura:1.15,kind:'bloom'},
 clockwork:{name:'發條投手',cost:150,damage:58,interval:2.1,range:215,minRange:65,kind:'gear'}
});
export const UNIT_BRANCHES={
 archer:[{id:'rapid',name:'連弩',interval:.72},{id:'heavy',name:'重弩',damage:1.45}],
 cannon:[{id:'wide',name:'孢子擴散',splash:30},{id:'pierce',name:'破甲砲',pierce:true}],
 frost:[{id:'long',name:'綿長霜露',slowDuration:4},{id:'root',name:'凝霜',rootEvery:3,rootDuration:.5}],
 crystal:[{id:'rapid',name:'晶角連擊',interval:.7},{id:'heavy',name:'碎甲重擊',damage:1.5}],
 firefly:[{id:'far',name:'遠空追擊',range:40},{id:'rapid',name:'流螢連射',interval:.75}],
 chime:[{id:'rapid',name:'疾風鈴',interval:.75},{id:'heavy',name:'重奏',damage:1.5}],
 blossom:[{id:'power',name:'繁花祝福',aura:1.3},{id:'haste',name:'春風祝福',haste:.85}],
 clockwork:[{id:'far',name:'遠投機構',range:40},{id:'wide',name:'散射機構',splash:35}]
};
export function validateLoadout(ids){
 if(!Array.isArray(ids)||ids.length!==4||new Set(ids).size!==4||ids.some(id=>!Object.hasOwn(UNITS,id)))throw Error('請選擇四種不同普通部隊');
 return [...ids];
}
export const DEFAULT_LOADOUT=Object.freeze(['archer','cannon','frost','firefly']);
