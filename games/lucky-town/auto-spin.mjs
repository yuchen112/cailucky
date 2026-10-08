import {MACHINES,validBet} from './data.mjs';
import {roll} from './slots.mjs';
export const AUTO_INTERVAL=3000;
export function validateAuto(a){if(a==null)return;if(typeof a!=='object'||typeof a.active!=='boolean'||typeof a.limited!=='boolean'||!MACHINES.some(m=>m.id===a.machine)||!validBet(a.bet)||!Number.isSafeInteger(a.nextAt)||a.nextAt<0||!Number.isSafeInteger(a.remaining)||a.remaining<0||a.remaining>1000||!Number.isSafeInteger(a.completed)||a.completed<0||a.completed>1e9||typeof a.owner!=='string'||a.owner.length>80||typeof a.reason!=='string'||a.reason.length>120)throw Error('自動旋轉紀錄不正確')}
export function startAuto(s,machine,count,owner,now=Date.now()){if(s.pending||s.scratch)throw Error('請先完成目前遊戲');if(![0,10,50,100,500,1000].includes(count))throw Error('自動次數不正確');const m=MACHINES.find(x=>x.id===machine),bet=s.bets[machine];if(!m||s.coins<m.cost*bet)throw Error('金幣不足');s.auto={active:true,machine,bet,remaining:count,limited:count>0,completed:0,nextAt:now,owner,reason:'',last:null};validateAuto(s.auto)}
export function stopAuto(s,reason='已手動停止'){if(s.auto){s.auto.active=false;s.auto.reason=reason}}
export function advanceAuto(s,now=Date.now(),limit=100,rng){const a=s.auto;validateAuto(a);if(!a?.active||s.pending||s.scratch||now<a.nextAt)return 0;const m=MACHINES.find(m=>m.id===a.machine);let n=0;
while(a.active&&a.nextAt<=now&&n<limit){if(s.coins<m.cost*a.bet){stopAuto(s,'金幣不足，已停止');break}if(s.coins-m.cost*a.bet>1e9-10000000){stopAuto(s,'金幣接近儲存上限，已停止');break}
const p=roll(a.machine,s.progressByBet[a.bet]||s.progress,rng);p.bet=a.bet;p.win*=a.bet;p.awards.forEach(x=>x.coins*=a.bet);p.phase='ready';
s.coins+=p.win-m.cost*a.bet;s.stats.spins++;s.stats.won+=p.win;s.stats.biggest=Math.max(s.stats.biggest,p.win);if(!s.stats.visited.includes(m.id))s.stats.visited.push(m.id);s.progress={garden:p.garden,photo:p.photo};s.progressByBet[a.bet]={...s.progress};a.last=p;a.completed++;a.nextAt+=AUTO_INTERVAL;n++;if(a.limited&&--a.remaining===0)stopAuto(s,'指定次數已完成');}
return n}
