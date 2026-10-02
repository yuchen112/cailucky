import {UNIT_BRANCHES,DEFAULT_LOADOUT} from './army.mjs?v=20261003-collection1';
export function unitArt(t){
 if(!['archer','cannon','frost','firefly'].includes(t.role))return `unit-${t.role}${t.level>=3&&t.branch?'-'+t.branch:''}`;
 if(t.level>=3&&UNIT_BRANCHES[t.role]?.some(b=>b.id===t.branch))return `unit-${t.role}-${t.branch}-${t.level}`;
 return `unit-${t.role}${t.level>=2?'-veteran':''}`;
}
export const EVOLUTION_ART=DEFAULT_LOADOUT.flatMap(role=>UNIT_BRANCHES[role].flatMap(b=>[3,4,5].map(level=>unitArt({role,branch:b.id,level}))));
export const BRANCH_GUIDES={
 archer:{rapid:'攻擊間隔縮短 28%，快速處理一般敵人。',heavy:'單發傷害增加 45%，適合集中打擊強敵。'},
 cannon:{wide:'爆炸半徑增加 30；五級再增加 10，對付密集敵群。',pierce:'攻擊無視護甲，保留原本範圍爆炸。'},
 frost:{long:'緩速延長至 4 秒，維持道路控制。',root:'每三次攻擊附加 0.5 秒定身；頭目定身時間較短。'},
 firefly:{far:'射程增加 40，更早攔截及追擊敵人。',rapid:'攻擊間隔縮短 25%，強化連續輸出。'}
};
export function branchGuide(role,branch){const p=UNIT_BRANCHES[role]?.find(b=>b.id===branch);return BRANCH_GUIDES[role]?.[branch]||(p?`${p.name}：${p.damage?'傷害 ×'+p.damage+'。':''}${p.interval?'攻擊間隔 ×'+p.interval+'。':''}${p.range?'射程 +'+p.range+'。':''}${p.splash?'波及半徑 +'+p.splash+'。':''}${p.rootEvery?'每 '+p.rootEvery+' 擊定身 '+p.rootDuration+' 秒。':''}${p.aura?'友軍傷害 ×'+p.aura+'。':''}${p.haste?'友軍間隔 ×'+p.haste+'。':''}`:'');}
