import {UNITS,kindsFor,towerStats} from './core.mjs';
import {ENEMY_CATALOG} from './enemy-catalog.mjs';
export function reviewDeployment(s){
 const wave=Math.min(s.mode==='endless'?99:s.maxWaves,s.phase==='battle'?s.wave:Math.max(1,s.wave+1));
 const threats=kindsFor(s,wave).map(id=>ENEMY_CATALOG[id]),placed=s.towers.filter(t=>UNITS[t.role]).map(t=>({...UNITS[t.role],...towerStats(t,s)})),available=s.loadout.map(id=>({id,...UNITS[id]}));
 const notes=[];const need=(condition,predicate,problem)=>{if(!condition)return;const matches=placed.filter(predicate);if(matches.length){notes.push(problem+'：已部署 '+matches.map(t=>t.name).join('、')+'，仍需留意射程覆蓋。');return;}const candidates=available.filter(predicate);notes.push(problem+'：目前尚未部署對應部隊。'+(candidates.length?'編隊可用 '+candidates.map(t=>t.name).join('、')+'。':'可利用英雄技能應對，或在出戰前調整編隊。'));};
 if(!placed.some(t=>t.damage>0))notes.push('目前沒有可攻擊部隊；補給部隊無法單獨守住核心。');
 need(threats.some(e=>e.air),t=>t.air,'飛行敵人');
 need(threats.some(e=>e.armor>=.2),t=>t.shred||t.pierce,'護甲敵人');
 need(threats.some(e=>e.speed>=50),t=>t.slow||t.rootEvery||t.zoneSlow||t.blockCapacity,'高速敵人');
 if(!notes.length)notes.push('本波沒有明顯兵種缺口；檢查道路覆蓋、升級與技能時機。');
 return {wave,notes};
}
export function waveTimeline(s){const start=Math.max(1,s.phase==='battle'?s.wave:s.wave+1),end=Math.min(s.mode==='endless'?99:s.maxWaves,start+2);return Array.from({length:Math.max(0,end-start+1)},(_,i)=>{const wave=start+i,kinds=kindsFor(s,wave),counts={};for(const id of kinds)counts[id]=(counts[id]||0)+1;return {wave,counts};});}
