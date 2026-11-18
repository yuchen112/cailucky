import {cardSignatures} from './content-expansion.mjs?v=expansion-2';
const timeText={deploy:'部署時',attack:'出手前',hurt:'受到傷害且存活時',death:'陣亡時'};
const targetText={self:'自身（已退場則改為前方友軍）',weakest:'生命最低的單位',front:'最前方友軍',opposite:'正對敵軍（空位改為前方敵軍）',rear:'最後方敵軍',first:'最前方手牌',slowest:'倒數最長的手牌',two:'前兩張手牌'};
export function effectAmount(spec,level=1,effect=1){return Math.min(9,spec.base+Math.floor((effect-1)/3)+Math.floor((level-1)/25));}
const opText={shield:'獲得護盾',heal:'回復生命',damage:'受到額外傷害',power:'提升攻擊',vitality:'提升最大生命並回復等量生命',haste:'減少部署倒數',burn:'附加燃燒（2 次出手前結算）',poison:'附加中毒（3 次出手前結算）',stun:'凍結，略過下一次出手',drain:'受到汲取傷害，己方英雄回復等量實際生命傷害',draw:'從牌庫抽 1 張，並減少其倒數',dispel:'移除護盾'};
export function signatureDescription(id,level=1,effect=1){
 const s=cardSignatures[id];if(!s)return '';
 const describe=x=>`${targetText[x.target]??targetText.first}：${opText[x.op]}${x.op==='stun'?'':` ${effectAmount(x,level,effect)} 點`}`;
 return `${s.name}｜${timeText[s.timing]}，${describe(s)}${s.secondary?'；'+describe(s.secondary):''}。每場最多 ${s.limit} 次。`;
}
// Shared execution keeps log frames, damage, death chains and rendering in sync.
export function performEffect(state,events,actor,source,lane,spec,deaths,api){
 const own=state.sides[actor],foe=state.sides[1-actor],amount=effectAmount(spec,source.level??1,source.effect??1);
 const living=board=>board.flatMap((card,index)=>card? [{card,index}]:[]);
 const friendly=['shield','heal','power','vitality'].includes(spec.op);
 if(['haste','draw'].includes(spec.op)){
  let targets;
  if(spec.op==='draw'){if(!own.deck.length)return false;const card=own.deck.shift();own.hand.push(card);targets=[card];}
  else {targets=own.hand.filter(c=>c.count>0);if(spec.target==='slowest')targets.sort((a,b)=>b.count-a.count);targets=targets.slice(0,spec.target==='two'?2:1);}
  if(!targets.length)return false;for(const c of targets)c.count=Math.max(0,c.count-amount);
  api.record(state,events,'skill',`${source.name}：抽牌／加速 ${targets.map(c=>c.name).join('、')}`,{actor,target:actor,lanes:[null]});return true;
 }
 let targets=living(friendly?own.board:foe.board);
 if(friendly&&spec.target==='self'&&targets.some(x=>x.card===source))targets=targets.filter(x=>x.card===source);
 else if(spec.target==='weakest')targets.sort((a,b)=>a.card.hp-b.card.hp||a.index-b.index);
 else if(spec.target==='rear')targets.reverse();
 else if(spec.target==='opposite'&&foe.board[lane])targets=targets.filter(x=>x.index===lane);
 if(spec.op==='heal')targets=targets.filter(x=>x.card.hp<x.card.max);
 if(spec.op==='dispel')targets=targets.filter(x=>x.card.shield>0);
 const hit=targets[0];if(!hit)return false;
 const c=hit.card,target=friendly?actor:1-actor;
 if(spec.op==='shield')c.shield=Math.min(80,c.shield+amount);
 if(spec.op==='heal')c.hp=Math.min(c.max,c.hp+amount);
 if(spec.op==='power')c.attack=Math.min(80,c.attack+amount);
 if(spec.op==='vitality'){const increase=Math.min(amount,240-c.max);c.max+=increase;c.hp+=increase;}
 if(spec.op==='dispel')c.shield=Math.max(0,c.shield-amount);
 if(['burn','poison'].includes(spec.op)){c[spec.op]={amount:Math.min(6,amount),turns:spec.op==='burn'?2:3};}
 if(spec.op==='stun')c.stun=1;
 api.record(state,events,'skill',`${source.name}・${opText[spec.op]} → ${c.name}${spec.op==='stun'?'':` ${amount}`}`,{actor,target,lanes:[hit.index]});
 if(['damage','drain'].includes(spec.op)){
  const before=c.hp;api.hitBatch(state,events,actor,source,[{target,lane:hit.index,amount}],deaths);
  if(spec.op==='drain'){const gain=before-c.hp;own.hp=Math.min(actor===0?state.heroMax:state.enemyMax??73,own.hp+gain);api.record(state,events,'skill',`${source.name}・汲取回復 ${gain}`,{actor,target:actor,lanes:[null]});}
 }
 return true;
}
export function runSignature(state,events,actor,card,lane,timing,deaths,api){
 const spec=cardSignatures[card.id];if(!spec||spec.timing!==timing||(card.signatureUses??0)>=spec.limit)return;
 card.signatureUses=(card.signatureUses??0)+1;
 const primary=performEffect(state,events,actor,card,lane,spec,deaths,api);
 const secondary=spec.secondary&&performEffect(state,events,actor,card,lane,spec.secondary,deaths,api);
 if(!primary&&!secondary)card.signatureUses--;
}
