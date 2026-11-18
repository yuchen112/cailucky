import {extraRunes} from './content-expansion.mjs?v=expansion-2';
export const runeBonus=(level=1,effect=1)=>Math.floor((level-1)/2)+Math.floor((effect-1)/3);
const definitions={
 wall:['鐵壁','guard','為正面有敵軍、半血以下的無盾友軍施加 2+B 護盾。'],
 heal:['回春','heal','為半血以下、至少缺 3 生命的最弱友軍回復 3+B 生命。'],
 frost:['霜縛','control','使攻擊至少 4 的最強敵軍永久降低 2+B 攻擊（最低 1）。'],
 spark:['雷印','attack','對生命與護盾合計不超過 2+B 的敵軍造成 2+B 傷害。'],
 ward:['共盾','guard','至少兩名友軍時，為最前方兩名無盾友軍各施加 1+⌊B/2⌋ 護盾。'],
 flame:['熾志','attack','至少兩名友軍時，為前方半血以下的友軍永久增加 1+B 攻擊。'],
 tide:['潮解','control','移除護盾最多的兩名敵軍各 3+B 護盾。'],
 root:['生根','heal','至少兩名受傷友軍時，為所有受傷友軍回復 1+⌊B/2⌋ 生命。'],
 mirror:['晶鏡','guard','英雄半血以下且無盾時，獲得 1+B 英雄護盾。'],
 dawn:['曉光','heal','英雄半血以下時，回復 2+B 英雄生命。'],
 anchor:['沉錨','control','使倒數最短且不超過 2 的敵方手牌增加 2+B 倒數（上限 4）。'],
 shelter:['堡壘','guard','敵軍至少三名時，為所有無盾友軍施加 1+⌊B/2⌋ 護盾。'],
 surge:['逆雷','attack','英雄半血以下且敵軍至少兩名時，對敵方英雄造成 1+B 傷害。'],
 echo:['回響','control','使最前方未就緒的手牌減少 1+B 倒數。'],
 cinder:['燃痕','attack','為最前方未燃燒的敵軍附加燃燒，接下來兩次出手前各受 1+⌊B/2⌋ 傷害。'],
 venom:['毒棘','attack','為生命最高的未中毒敵軍附加中毒，接下來三次出手前各受 1+⌊B/2⌋ 傷害。'],
 renewal:['甦泉','heal','英雄受傷且有受傷友軍時，英雄回復 2+B，最弱友軍回復 2+B 生命。'],
 valor:['英勇','attack','友軍至少三名時，使攻擊最高友軍永久增加 1+B 攻擊。'],
 aegis:['聖垣','guard','敵軍至少兩名且英雄護盾低於 2+B 時，施加 2+B 英雄護盾。'],
 blizzard:['寒潮','control','凍結攻擊最高且未凍結的敵軍，使其略過下一次出手。'],
 cleanse:['淨化','heal','清除最弱友軍的燃燒、中毒與凍結，並回復 2+B 生命。'],
 leech:['血契','attack','英雄受傷時，對最弱敵軍造成 2+B 傷害，並回復等量實際生命傷害。'],
 harvest:['歸魂','support','有友軍陣亡後，從牌庫抽一張牌並減少 1+B 倒數；每次需新的陣亡。'],
 comet:['彗星','attack','敵軍至少兩名時，對生命最低的兩名各造成 1+⌊B/2⌋ 傷害。'],
 fortify:['鑄魂','guard','為最大生命最低友軍增加 2+B 最大生命並回復等量生命。'],
 reckoning:['逆境','guard','敵軍多於友軍時，為最弱友軍施加 3+B 護盾。'],
 mend:['復甦','heal','為受傷最多的友軍回復 2+B 生命並施加 1+⌊B/2⌋ 護盾。'],
 siphon:['封魔','control','使攻擊最高敵軍降低 1+B 攻擊（最低 1），英雄獲得 1 護盾。'],
 oath:['連攜','guard','場上友軍至少有三種不同基礎技能時，為前兩名友軍各施加 2+⌊B/2⌋ 護盾。'],
 nova:['星爆','attack','敵軍至少四名時，對全部敵軍造成 1+⌊B/2⌋ 傷害。'],
 shadow:['影襲','attack','對最後方敵軍造成 2+B 技能傷害，不受相鄰護衛減傷。'],
 chronos:['時砂','control','至少三張未就緒手牌時，全部未就緒手牌倒數減少 1+⌊B/2⌋。'],
 sanctuary:['聖域','heal','英雄半血以下且有友軍受傷或燃燒時，全體友軍清除燃燒並回復 1+⌊B/2⌋ 生命。'],
 echoBlade:['回刃','attack','連續兩次對當下生命最低敵軍造成 1+⌊B/2⌋ 傷害，每次重新選擇目標。'],
 none:['未裝備','support','不觸發符文。'],
};
export const runes=Object.fromEntries(Object.entries(definitions).map(([id,[name,group,effect]])=>[id,{name,group,effect:effect+' 每場最多兩次；B＝等級與效果等級增益（0–5）。',source:id==='none'?'':extraRunes[id]?'符文召喚池':'初始、關卡或符文召喚池'}]));
export function runeDescription(id,level=1,effect=1){return runes[id].effect.replaceAll('⌊B/2⌋',String(Math.floor(runeBonus(level,effect)/2))).replaceAll('B＝等級與效果等級增益（0–5）',`本個體增益＝${runeBonus(level,effect)}`).replaceAll('B',String(runeBonus(level,effect)));}
export function runExpandedRune(state,events,second,api){
 const id=second?state.rune2?.id:state.rune,slot=second?state.rune2:state;
 if(!slot?.charges||id==='none'||!runes[id])return;
 const b=runeBonus(second?slot.level:state.runeLevel,second?slot.effect:state.runeEffect),a=Math.floor(b/2);
 const [own,foe]=state.sides,ownMax=state.heroMax??73;
 const alive=board=>board.flatMap((card,lane)=>card?[{card,lane}]:[]);
 const allies=alive(own.board),enemies=alive(foe.board),hurt=allies.filter(x=>x.card.hp<x.card.max).sort((x,y)=>x.card.hp-y.card.hp);
 const weakest=[...enemies].sort((x,y)=>x.card.hp-y.card.hp),strongest=[...enemies].sort((x,y)=>y.card.attack-x.card.attack);
 let acted=false;const deaths=[];const name=runes[id].name;
 const log=(target,lanes,message=name)=>api.record(state,events,'skill',message,{actor:0,target,lanes,rune:id});
 const shield=(targets,n)=>{for(const x of targets){x.card.shield=Math.min(80,x.card.shield+n);acted=true;}if(targets.length)log(0,targets.map(x=>x.lane));};
 const heal=(targets,n)=>{for(const x of targets){if(x.card.hp<x.card.max){x.card.hp=Math.min(x.card.max,x.card.hp+n);acted=true;}}if(acted)log(0,targets.map(x=>x.lane));};
 const hit=(targets,n)=>{if(!targets.length)return;acted=true;log(1,targets.map(x=>x.lane));api.hitBatch(state,events,0,{name},targets.map(x=>({target:1,lane:x.lane,amount:n})),deaths);};
 const haste=(targets,n)=>{for(const card of targets){card.count=Math.max(0,card.count-n);acted=true;}if(acted)log(0,[null]);};
 const power=(targets,n)=>{for(const x of targets){x.card.attack=Math.min(80,x.card.attack+n);acted=true;}if(acted)log(0,targets.map(x=>x.lane));};
 const heroHeal=n=>{if(own.hp<ownMax){own.hp=Math.min(ownMax,own.hp+n);acted=true;log(0,[null]);}};
 const half=own.hp*2<=ownMax;
 if(id==='wall')shield(hurt.filter(x=>x.card.hp*2<=x.card.max&&!x.card.shield&&foe.board[x.lane]).slice(0,1),2+b);
 if(id==='heal')heal(hurt.filter(x=>x.card.hp*2<=x.card.max&&x.card.max-x.card.hp>=3).slice(0,1),3+b);
 if(id==='frost'&&strongest[0]?.card.attack>=4)powerEnemy(strongest[0],2+b);
 function powerEnemy(x,n){x.card.attack=Math.max(1,x.card.attack-n);acted=true;log(1,[x.lane]);}
 if(id==='spark')hit(weakest.filter(x=>x.card.hp+x.card.shield<=2+b).slice(0,1),2+b);
 if(id==='ward'&&allies.length>=2)shield(allies.filter(x=>!x.card.shield).slice(0,2),1+a);
 if(id==='flame'&&allies.length>=2)power(hurt.filter(x=>x.card.hp*2<=x.card.max).sort((x,y)=>x.lane-y.lane).slice(0,1),1+b);
 if(id==='tide'){const list=enemies.filter(x=>x.card.shield).sort((x,y)=>y.card.shield-x.card.shield).slice(0,2);for(const x of list)x.card.shield=Math.max(0,x.card.shield-3-b);if(list.length){acted=true;log(1,list.map(x=>x.lane));}}
 if(id==='root'&&hurt.length>=2)heal(hurt,1+a);
 if(id==='mirror'&&half&&!state.heroShield){state.heroShield=1+b;acted=true;log(0,[null]);}
 if(id==='dawn'&&half)heroHeal(2+b);
 if(id==='anchor'){const c=foe.hand.filter(c=>c.count<=2).sort((x,y)=>x.count-y.count)[0];if(c){c.count=Math.min(4,c.count+2+b);acted=true;log(1,[null]);}}
 if(id==='shelter'&&enemies.length>=3)shield(allies.filter(x=>!x.card.shield),1+a);
 if(id==='surge'&&half&&enemies.length>=2){acted=true;log(1,[null]);api.hitBatch(state,events,0,{name},[{target:1,lane:null,amount:1+b}],deaths);}
 if(id==='echo')haste(own.hand.filter(c=>c.count>0).slice(0,1),1+b);
 if(['cinder','venom'].includes(id)){
  const status=id==='cinder'?'burn':'poison';const list=enemies.filter(x=>!x.card[status]?.turns);if(id==='venom')list.sort((x,y)=>y.card.hp-x.card.hp);
  const x=list[0];if(x){x.card[status]={amount:1+a,turns:id==='cinder'?2:3};acted=true;log(1,[x.lane]);}
 }
 if(id==='renewal'&&own.hp<ownMax&&hurt.length){heroHeal(2+b);heal(hurt.slice(0,1),2+b);}
 if(id==='valor'&&allies.length>=3)power([...allies].sort((x,y)=>y.card.attack-x.card.attack).slice(0,1),1+b);
 if(id==='aegis'&&enemies.length>=2&&state.heroShield<2+b){state.heroShield=Math.min(80,state.heroShield+2+b);acted=true;log(0,[null]);}
 if(id==='blizzard'){const x=strongest.find(x=>!x.card.stun);if(x){x.card.stun=1;acted=true;log(1,[x.lane]);}}
 if(id==='cleanse'){const x=[...allies].sort((x,y)=>x.card.hp-y.card.hp).find(x=>x.card.burn?.turns||x.card.poison?.turns||x.card.stun);if(x){delete x.card.burn;delete x.card.poison;delete x.card.stun;acted=true;heal([x],2+b);log(0,[x.lane]);}}
 if(id==='leech'&&own.hp<ownMax&&weakest.length){const x=weakest[0],before=x.card.hp;hit([x],2+b);heroHeal(before-x.card.hp);}
 if(id==='harvest'&&(state.losses?.[0]??0)>(slot.harvestLosses??0)&&own.deck.length){const c=own.deck.shift();own.hand.push(c);haste([c],1+b);slot.harvestLosses=state.losses[0];}
 if(id==='comet'&&enemies.length>=2)hit(weakest.slice(0,2),1+a);
 if(id==='fortify'&&allies.length){const x=[...allies].sort((x,y)=>x.card.max-y.card.max)[0];const n=Math.min(2+b,240-x.card.max);if(n>0){x.card.max+=n;x.card.hp+=n;acted=true;log(0,[x.lane]);}}
 if(id==='reckoning'&&enemies.length>allies.length)shield([...allies].sort((x,y)=>x.card.hp-y.card.hp).slice(0,1),3+b);
 if(id==='mend'&&hurt.length){const x=[...hurt].sort((x,y)=>(y.card.max-y.card.hp)-(x.card.max-x.card.hp))[0];heal([x],2+b);shield([x],1+a);}
 if(id==='siphon'&&strongest.length){powerEnemy(strongest[0],1+b);state.heroShield=Math.min(80,state.heroShield+1);log(0,[null]);}
 if(id==='oath'&&new Set(allies.map(x=>x.card.skill)).size>=3)shield(allies.slice(0,2),2+a);
 if(id==='nova'&&enemies.length>=4)hit(enemies,1+a);
 if(id==='shadow')hit(enemies.slice(-1),2+b);
 if(id==='chronos'&&own.hand.filter(c=>c.count>0).length>=3)haste(own.hand.filter(c=>c.count>0),1+a);
 if(id==='sanctuary'&&half&&allies.some(x=>x.card.hp<x.card.max||x.card.burn?.turns)){for(const x of allies)delete x.card.burn;acted=true;heal(allies,1+a);log(0,allies.map(x=>x.lane));}
 if(id==='echoBlade')for(let i=0;i<2;i++){const list=alive(foe.board).sort((x,y)=>x.card.hp-y.card.hp);hit(list.slice(0,1),1+a);api.settle(state,events,0,deaths.splice(0));}
 if(acted){slot.charges--;api.settle(state,events,0,deaths);}
}
