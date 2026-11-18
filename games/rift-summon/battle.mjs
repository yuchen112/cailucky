import {runExpandedRune} from './runes.mjs?v=expansion-1';
import {extraCards,cardSignatures} from './content-expansion.mjs?v=expansion-1';
import {campaignLevel,extendCampaign} from './campaign-expansion.mjs?v=expansion-1';
import {signatureDescription,runSignature} from './combat-effects.mjs?v=expansion-1';
export {signatureDescription};
import {heroSkillProfile,scaledHeroAmount} from './hero-skills.mjs?v=expansion-1';
import {heroHealth,shuffleDeck} from './progression.mjs?v=expansion-1';
export const cards = {
  ...extraCards,
  guard: ['壁壘衛士', 1, 2, 7, '護衛'],
  bomb: ['爆燈兵', 1, 2, 3, '自爆'],
  archer: ['荒牙斥候', 1, 2, 4, '追獵'],
  ax: ['重斧兵', 2, 4, 6, '橫掃'],
  ghost: ['守墓人', 2, 2, 5, '亡靈接替'],
  healer: ['提燈祭司', 2, 2, 5, '治療'],
  knight: ['守關騎士', 2, 3, 6, '護盾'],
  giant: ['鐵鑄巨像', 4, 6, 10, ''],
  bow: ['盾弓手', 1, 2, 5, '護盾'],
  fang: ['裂爪獸', 1, 3, 3, '追獵'],
  flag: ['軍旗手', 2, 2, 6, '護衛'],
  moon: ['夜燈醫者', 2, 3, 4, '治療'],
  ember: ['燼尾劍客', 1, 3, 4, '追獵'],
  wisp: ['星燈羽術師', 2, 3, 5, '治療'],
  turtle: ['苔殼盾衛', 2, 2, 8, '護衛'],
  raven: ['月刃夜鴉', 2, 4, 4, '橫掃'],
  stag: ['苔角靈鹿', 2, 2, 7, '護盾'],
  lynx: ['銀刃夜猞', 1, 3, 4, '追獵'],
  moth: ['微光蛾巫', 2, 2, 6, '治療'],
  drake: ['銅焰幼龍', 3, 5, 6, '橫掃'],
  ibis: ['赤羽弓衛', 1, 4, 3, '追獵'],
  hare: ['花籃兔醫', 1, 1, 5, '治療'],
  otter: ['藍溪盾獺', 2, 3, 6, '護盾'],
  ram: ['崖角斧羊', 3, 5, 7, '橫掃'],
  bat: ['紫翼引魂者', 1, 1, 4, '亡靈接替'],
  beetle: ['琥珀爆甲', 2, 3, 5, '自爆'],
  crane: ['玉燈白鶴', 3, 3, 8, '治療'],
  yak: ['岩盾犛牛', 3, 3, 9, '護衛'],
  seal: ['霜紋海豹', 1, 2, 4, '追獵'],
  boar: ['鐵鬃守衛', 2, 2, 7, '護盾'],
  swan: ['銀翼司祭', 2, 3, 6, '治療'],
  crab: ['熔殼焰蟹', 1, 2, 3, '自爆'],
  gecko: ['壁行引魂者', 1, 1, 3, '亡靈接替'],
  wolf: ['月斧狼騎', 3, 5, 6, '破甲'],
  panda: ['竹葉藥師', 1, 1, 4, '治療'],
  hedgehog: ['橡果刺衛', 1, 1, 5, '守蔭'],
  koi: ['碧波鯉術師', 2, 3, 6, '亡靈接替'],
  falcon: ['白隼追獵者', 1, 4, 3, '追獵'],
  mole: ['地穴爆破手', 2, 3, 4, '自爆'],
  lion: ['曜鬃獅統領', 3, 5, 7, '戰吼'],
  badger: ['岩弩獾兵', 2, 3, 5, '破甲'],
  lynxguard: ['霧銀猞衛', 2, 2, 8, '護衛'],
  robin: ['紅翎醫使', 1, 1, 4, '援護'],
  frog: ['翠沼藥師', 2, 2, 6, '治療'],
  yakfire: ['赤角火騎', 3, 5, 7, '猛進'],
  stork: ['雲梭白鸛', 2, 3, 5, '追獵'],
  ferret: ['沙刃鼬客', 1, 2, 3, '猛進'],
  beaver: ['堤工河狸', 2, 2, 7, '守蔭'],
  rabbit: ['月棲引魂兔', 2, 3, 6, '亡靈接替'],
  eagle: ['金羽御衛', 3, 5, 8, '戰吼'],
  boss: ['斷橋守將', 0, 2, 6, '橫掃'],
  spirit: ['靈體', 0, 1, 2, ''],
};
export const starter = ['guard', 'bomb', 'archer', 'ax', 'ghost', 'healer', 'knight', 'giant'];
const sentries = ['guard', 'bomb', 'knight', 'ax', 'ghost', 'giant'];
import {cardBonus,cardHealthBonus} from './inventory.mjs?v=expansion-1';
import {dailyStage} from './daily.mjs?v=expansion-1';
export const chapterNames = ["第一章・斷橋哨站", "第二章・沉鐘墓園", "第三章・翡翠林海", "第四章・赤焰熔城", "第五章・霜月群峰", "第六章・浮光水都", "第七章・沙海遺城", "第八章・幽影邊境", "第九章・蒼穹王庭", "第十章・裂界核心"];
export const stages = [
  {name:'哨站前沿', goal:'倒數歸零就能部署。先用護衛或斥候接住第一波。', hp:8, opponents:['guard','archer','healer','knight'], opening:['archer'], reward:'bow'},
  {name:'雙塔迴廊', goal:'同回合可以連下多張。留意每張牌的部署順序。', hp:10, opponents:['bomb','knight','archer','ghost','ax'], opening:['guard','bomb'], reward:'fang'},
  {name:'斷橋缺口', goal:'正對空位可直攻英雄。對手擅長護盾與追獵。', hp:9, opponents:['archer','knight','ghost','fang','bow'], opening:['knight'], reward:'flag'},
  {name:'斷橋守將', goal:'頭目橫掃正對欄與兩側。利用護衛、自爆和接替改寫對位。', hp:10, opponents:sentries, opening:['boss'], reward:'moon'},
  {name:'沉鐘入口', goal:'盾兵會保護正對的位置。用破甲或追獵拆開前線。',hp:11,opponents:['boar','seal','hare','archer','ax'],opening:['boar'],reward:'seal'},
  {name:'幽潮祭壇', goal:'留意亡靈接替，擊退本體後該欄仍可能被靈體佔據。',hp:12,opponents:['bat','ghost','koi','healer','ram'],opening:['bat'],reward:'koi'},
  {name:'水門斷層', goal:'爆甲和自爆會傷及相鄰欄位，調整下牌順序再進攻。',hp:13,opponents:['beetle','crab','bow','panda','wolf'],opening:['mole'],reward:'wolf'},
  {name:'沉鐘獅王', goal:'曜鬃獅統領的戰吼能隔著守軍傷害英雄。先壓力最大的欄位。',hp:14,opponents:['otter','hedgehog','fang','swan','giant'],opening:['lion'],reward:'swan'},
  {"name":"林緣小徑","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":14,"opponents":["turtle","stag","hare","hedgehog","frog","beaver"],"opening":["turtle"],"reward":"turtle","enemyLevel":5,"enemyEffect":1},
  {"name":"苔根溪谷","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":15,"opponents":["stag","hare","hedgehog","frog","beaver","turtle"],"opening":["stag"],"reward":"stag","enemyLevel":5,"enemyEffect":1},
  {"name":"古樹迴廊","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":16,"opponents":["hare","hedgehog","frog","beaver","turtle","stag"],"opening":["hare","hedgehog"],"reward":"frog","enemyLevel":5,"enemyEffect":1},
  {"name":"翡翠守望","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":17,"opponents":["hedgehog","frog","beaver","turtle","stag","hare"],"opening":["stag","yak"],"reward":"yak","enemyLevel":6,"enemyEffect":1},
  {"name":"熔爐街口","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":15,"opponents":["crab","beetle","mole","ember","drake","yakfire"],"opening":["crab"],"reward":"crab","enemyLevel":7,"enemyEffect":2},
  {"name":"燼火工坊","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":16,"opponents":["beetle","mole","ember","drake","yakfire","crab"],"opening":["beetle"],"reward":"beetle","enemyLevel":7,"enemyEffect":2},
  {"name":"赤銅城門","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":17,"opponents":["mole","ember","drake","yakfire","crab","beetle"],"opening":["mole","ember"],"reward":"drake","enemyLevel":7,"enemyEffect":2},
  {"name":"熔城領主","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":18,"opponents":["ember","drake","yakfire","crab","beetle","mole"],"opening":["drake","yakfire"],"reward":"yakfire","enemyLevel":8,"enemyEffect":2},
  {"name":"雪線哨口","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":16,"opponents":["seal","otter","yak","wolf","falcon","lynxguard"],"opening":["seal"],"reward":"seal","enemyLevel":9,"enemyEffect":2},
  {"name":"霜橋天險","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":17,"opponents":["otter","yak","wolf","falcon","lynxguard","seal"],"opening":["otter"],"reward":"otter","enemyLevel":9,"enemyEffect":2},
  {"name":"月影山脊","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":18,"opponents":["yak","wolf","falcon","lynxguard","seal","otter"],"opening":["yak","wolf"],"reward":"falcon","enemyLevel":9,"enemyEffect":2},
  {"name":"霜月狼王","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":19,"opponents":["wolf","falcon","lynxguard","seal","otter","yak"],"opening":["wolf","yak"],"reward":"wolf","enemyLevel":10,"enemyEffect":2},
  {"name":"藍溪碼頭","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":17,"opponents":["koi","swan","crane","otter","panda","stork"],"opening":["koi"],"reward":"otter","enemyLevel":11,"enemyEffect":2},
  {"name":"水晶迴橋","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":18,"opponents":["swan","crane","otter","panda","stork","koi"],"opening":["swan"],"reward":"koi","enemyLevel":11,"enemyEffect":2},
  {"name":"潮聲聖堂","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":19,"opponents":["crane","otter","panda","stork","koi","swan"],"opening":["crane","otter"],"reward":"crane","enemyLevel":11,"enemyEffect":2},
  {"name":"銀翼主祭","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":20,"opponents":["otter","panda","stork","koi","swan","crane"],"opening":["swan","crane"],"reward":"swan","enemyLevel":12,"enemyEffect":2},
  {"name":"風沙驛站","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":18,"opponents":["ferret","badger","ibis","yakfire","eagle","ram"],"opening":["ferret"],"reward":"ferret","enemyLevel":13,"enemyEffect":3},
  {"name":"殘壁暗巷","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":19,"opponents":["badger","ibis","yakfire","eagle","ram","ferret"],"opening":["badger"],"reward":"badger","enemyLevel":13,"enemyEffect":3},
  {"name":"金砂王庭","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":20,"opponents":["ibis","yakfire","eagle","ram","ferret","badger"],"opening":["ibis","yakfire"],"reward":"ibis","enemyLevel":13,"enemyEffect":3},
  {"name":"沙海御衛","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":21,"opponents":["yakfire","eagle","ram","ferret","badger","ibis"],"opening":["eagle","ram"],"reward":"eagle","enemyLevel":14,"enemyEffect":3},
  {"name":"暮色渡口","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":19,"opponents":["bat","gecko","rabbit","ghost","raven","moth"],"opening":["bat"],"reward":"bat","enemyLevel":15,"enemyEffect":3},
  {"name":"引魂長廊","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":20,"opponents":["gecko","rabbit","ghost","raven","moth","bat"],"opening":["gecko"],"reward":"rabbit","enemyLevel":15,"enemyEffect":3},
  {"name":"無月庭院","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":21,"opponents":["rabbit","ghost","raven","moth","bat","gecko"],"opening":["rabbit","ghost"],"reward":"moth","enemyLevel":15,"enemyEffect":3},
  {"name":"幽影統領","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":22,"opponents":["ghost","raven","moth","bat","gecko","rabbit"],"opening":["raven","rabbit"],"reward":"raven","enemyLevel":16,"enemyEffect":3},
  {"name":"雲階前哨","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":20,"opponents":["eagle","falcon","stork","crane","lion","lynxguard"],"opening":["eagle"],"reward":"stork","enemyLevel":17,"enemyEffect":3},
  {"name":"白羽長橋","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":21,"opponents":["falcon","stork","crane","lion","lynxguard","eagle"],"opening":["falcon"],"reward":"lynxguard","enemyLevel":17,"enemyEffect":3},
  {"name":"天穹大廳","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":22,"opponents":["stork","crane","lion","lynxguard","eagle","falcon"],"opening":["stork","crane"],"reward":"lion","enemyLevel":17,"enemyEffect":3},
  {"name":"金羽王衛","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":23,"opponents":["crane","lion","lynxguard","eagle","falcon","stork"],"opening":["eagle","lion"],"reward":"eagle","enemyLevel":18,"enemyEffect":3},
  {"name":"裂隙門扉","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":21,"opponents":["lion","drake","wolf","crane","rabbit","eagle","lynxguard","raven"],"opening":["lion"],"reward":"lynxguard","enemyLevel":19,"enemyEffect":4},
  {"name":"鏡界迴廊","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":22,"opponents":["drake","wolf","crane","rabbit","eagle","lynxguard","raven","lion"],"opening":["drake"],"reward":"rabbit","enemyLevel":19,"enemyEffect":4},
  {"name":"星核深淵","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":23,"opponents":["wolf","crane","rabbit","eagle","lynxguard","raven","lion","drake"],"opening":["wolf","crane"],"reward":"drake","enemyLevel":19,"enemyEffect":4},
  {"name":"裂界終戰","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":24,"opponents":["crane","rabbit","eagle","lynxguard","raven","lion","drake","wolf"],"opening":["lion","eagle"],"reward":"eagle","enemyLevel":20,"enemyEffect":4},
];

// Gradual chapter and within-chapter growth, including the second chapter.
extendCampaign(stages,chapterNames,cards);
function unit(id, uid, level=1,effect=1) {
  const [name, count, attack, max, skill] = cards[id];
  const bonus=cardBonus(level);
  return {id, uid, name, count, level, effect, attack:attack+bonus, max:max+cardHealthBonus(level), hp:max+cardHealthBonus(level), shield: skill === '護盾' ? 1+effect : 0, skill};
}
function side(deck, hp) {
  return {hp, deck: deck.slice(3), hand: deck.slice(0, 3), board: []};
}
export function createBattle(rune = 'wall', hero = '', stage = 3, deck = starter, levels = {}, heroLevel=1, runeLevel=1, daily=null,effects={},heroEffect=1,runeEffect=1,rune2=null,instances=null,random=Math.random) {
  const level = daily?dailyStage(daily):stages[stage];
  const drawPile=shuffleDeck(deck.map((id,i)=>{
    const item=instances?.[i];
    const card=unit(id,i,item?.level??levels[id]??1,item?.effect??effects[id]??1);
    if(item?.uid)card.inventoryUid=item.uid;
    return card;
  }),random);
  // Avoid an entirely stalled opening when the player included a quick card.
  if(!drawPile.slice(0,3).some(card=>card.count<=1)){
    const ready=drawPile.findIndex(card=>card.count<=1);
    if(ready>=3){const slot=Math.floor(random()*3);[drawPile[slot],drawPile[ready]]=[drawPile[ready],drawPile[slot]];}
  }
  const player=side(drawPile,heroHealth(heroLevel));
  const enemy = side(level.opponents.map((id, i) => unit(id, i + 20,level.enemyLevel??1,level.enemyEffect??1)), level.hp);
  enemy.board.push(...level.opening.map((id,i)=>unit(id,40+i,level.enemyLevel??1,level.enemyEffect??1)));
  const state = {version: 3, phase: 'deploy', stage, round: 1, result: null, sides: [player, enemy], hero, heroUsed: false, heroShield: 0, rune, charges: rune === 'none' ? 0 : 2, nextUid: 50, sequence: 0};
  if(daily) {
    state.daily=daily;
    if(['gold','xp'].includes(daily.vault)) for(const card of enemy.board)card.shield=Math.max(card.shield,2);
  }
  state.enemyMax=level.hp;state.heroProgressionVersion=2;state.heroMax=heroHealth(heroLevel);state.heroLevel=heroLevel;state.heroEffect=heroEffect;state.runeEffect=runeEffect;
  state.runeLevel=runeLevel;
  if(rune2)state.rune2={...rune2};
  begin(player, false);
  return state;
}
function begin(team, draw = true) {
  for (const card of team.hand) card.count = Math.max(0, card.count - 1);
  if (draw && team.deck.length) team.hand.push(team.deck.shift());
}
function record(state, events, kind, message, details = {}) {
  events.push({sequence: ++state.sequence, kind, message, ...details, frame: {
    sides: state.sides.map(({hp, board}) => ({hp, board: structuredClone(board)})),
    charges: state.charges, rune2Charges:state.rune2?.charges??0, heroShield: state.heroShield, round: state.round,
  }});
}
function trigger(state,events,timing,lane){
 const hero=heroes.find(h=>h.id===state.hero);
 if(!hero||state.heroUsed||hero.trigger!==timing)return;
 const [team,foe]=state.sides,p=heroSkillProfile(hero.id,state.heroEffect??1),max=state.heroMax??heroHealth(state.heroLevel??1);
 const injured=(half=false)=>team.board.map((card,index)=>({card,index})).filter(x=>x.card&&x.card.hp<x.card.max&&(!half||x.card.hp*2<=x.card.max)).sort((a,b)=>a.card.hp/a.card.max-b.card.hp/b.card.max||a.card.hp-b.card.hp);
 const adjacent=index=>[index-1,index+1].find(i=>team.board[i]?.hp>0);
 const addShield=(card,base,ratio)=>{card.shield+=scaledHeroAmount(base,card.max,ratio);};
 let target=0,lanes=[],name='英雄',strikeLane=-1;
 if(hero.effect==='shield'||hero.effect==='recover'){
  if(!team.hp||team.hp*2>max)return;
  const amount=scaledHeroAmount(3,max,p.ratio);
  if(hero.effect==='shield'){
   state.heroShield+=amount;
   if(p.advanced)team.hp=Math.min(max,team.hp+2);
   const ally=injured()[0]??team.board.map((card,index)=>({card,index})).filter(x=>x.card).sort((a,b)=>a.card.hp-b.card.hp)[0];
   if(p.master&&ally){ally.card.shield+=2;lanes.push(ally.index);}
  }else{
   team.hp=Math.min(max,team.hp+amount);
   const ally=injured()[0];if(p.advanced&&ally){ally.card.hp=Math.min(ally.card.max,ally.card.hp+2);lanes.push(ally.index);}
   if(p.master)state.heroShield+=2;
  }
  lanes.push(null);
 }else if(hero.effect==='haste'){
  const hand=team.hand.filter(c=>c.count>0).sort((a,b)=>a.count-b.count);
  if(!hand.length)return;
  hand[0].count=Math.max(0,hand[0].count-(p.master?2:1));addShield(hand[0],0,p.ratio);
  if(p.advanced&&hand[1])hand[1].count=Math.max(0,hand[1].count-1);
  name=hand[0].name;
 }else if(hero.effect==='draw'){
  if(!team.deck.length)return;
  const drawn=team.deck.splice(0,p.advanced?2:1);
  for(const card of drawn){addShield(card,0,p.ratio);if(p.master)card.count=Math.max(0,card.count-1);}
  team.hand.push(...drawn);name=drawn.map(c=>c.name).join('、');
 }else if(hero.effect==='summon'){
  if(team.board[lane])return;
  const spirit=unit('spirit',state.nextUid++);spirit.attack=p.spiritAttack;spirit.max=p.spiritHealth;spirit.hp=p.spiritHealth;spirit.shield=p.advanced?1:0;team.board[lane]=spirit;
  if(p.master){const side=adjacent(lane);if(side!==undefined){team.board[side].shield+=2;lanes.push(side);}}
  name='靈體';lanes.push(lane);
 }else if(hero.effect==='strike'){
  const pick=foe.board.map((card,index)=>({card,index})).filter(x=>x.card&&x.card.hp<=p.threshold).sort((a,b)=>a.card.hp-b.card.hp)[0];
  if(!pick)return;strikeLane=pick.index;target=1;name=pick.card.name;lanes=[strikeLane];
 }else{
  const pick=timing==='deploy'?{card:team.board[lane],index:lane}:injured(hero.effect==='armor')[0];
  if(!pick?.card||(hero.effect==='power'&&team.board.filter(Boolean).length<3))return;
  const card=pick.card;lane=pick.index;name=card.name;lanes=[lane];
  if(hero.effect==='heal'){
   card.hp=Math.min(card.max,card.hp+scaledHeroAmount(3,card.max,p.ratio));
   const second=injured().find(x=>x.index!==lane);
   if(p.advanced&&second){second.card.hp=Math.min(second.card.max,second.card.hp+scaledHeroAmount(1,second.card.max,2));lanes.push(second.index);}
   if(p.master)card.shield+=2;
  }else if(hero.effect==='power'){
   card.attack+=scaledHeroAmount(1,card.attack,p.ratio*2);
   const side=adjacent(lane);if(p.advanced&&side!==undefined){team.board[side].attack++;lanes.push(side);}
   if(p.master)addShield(card,1,3);
  }else{
   addShield(card,2,p.ratio);
   if(hero.id==='trust'){
    if(p.advanced)state.heroNextShield={base:1,ratio:2};
    if(p.master)card.heroBreakHeal=2;
   }else{
    if(p.advanced)card.hp=Math.min(card.max,card.hp+scaledHeroAmount(1,card.max,2));
    const side=adjacent(lane);if(p.master&&side!==undefined){addShield(team.board[side],1,2);lanes.push(side);}
   }
  }
 }
 state.heroUsed=true;
 record(state,events,'hero',`${hero.name}・${hero.skill} Lv.${p.level} → ${name}`,{actor:0,target,lanes:lanes.length?lanes:[null]});
 if(strikeLane>=0){
  const primaryUid=foe.board[strikeLane].uid;
  const hit=lane=>{const deaths=[];hitBatch(state,events,0,hero,[{target:1,lane,amount:p.strike}],deaths);settle(state,events,0,deaths);};
  hit(strikeLane);
  if(p.advanced&&!foe.board.some(card=>card?.uid===primaryUid))hitBatch(state,events,0,hero,[{target:1,lane:null,amount:1}],[]);
  if(p.master){const second=foe.board.map((card,index)=>({card,index})).filter(x=>x.card&&x.card.uid!==primaryUid&&x.card.hp<=p.threshold).sort((a,b)=>a.card.hp-b.card.hp)[0];if(second)hit(second.index);}
 }
}
function deploy(state, events, actor, uid) {
  const {hand, board} = state.sides[actor];
  const slot = hand.findIndex(card => card.uid === uid && card.count === 0);
  if (slot < 0) return false;
  const [card] = hand.splice(slot, 1);
  board.push(card);
  record(state, events, 'deploy', `${card.name} 部署到第 ${board.length} 欄`, {actor, target: actor, lanes: [board.length - 1]});
  if(actor===0&&state.heroNextShield){const gift=state.heroNextShield;card.shield+=scaledHeroAmount(gift.base,card.max,gift.ratio);delete state.heroNextShield;record(state,events,'skill',`信約之盾・接續庇護 → ${card.name}`,{actor:0,target:0,lanes:[board.length-1]});}
  if (actor === 0) trigger(state, events, 'deploy', board.length - 1);
  const deaths=[];runSignature(state,events,actor,card,board.length-1,'deploy',deaths,{record,hitBatch});settle(state,events,actor,deaths);
  return true;
}
function hitBatch(state, events, actor, source, hits, deaths, normal = false) {
  const batch = hits.map(({target, lane, amount}) => {
    const board = state.sides[target].board;
    const support = lane !== null && normal ? Math.max(0,...[board[lane - 1],board[lane + 1]].filter(c=>c?.hp>0&&c.skill==='護衛').map(c=>c.effect??1)) : 0;
    return {target, lane, damage: Math.max(0, amount - support)};
  });
  for (const {target, lane, damage} of batch) {
    const side = state.sides[target];
    const card = lane === null ? null : side.board[lane];
    if (lane !== null && !card) continue;
    let healAfter=0;
    const absorbed = Math.min(card?.shield ?? (target === 0 ? state.heroShield : 0), damage);
    const dealt = damage - absorbed;
    if (card) {
      card.shield -= absorbed;
      if(['gold','xp'].includes(state.daily?.vault)&&target===1&&absorbed&&!card.shield)card.attack=Math.max(0,card.attack-1);
      card.hp = Math.max(0, card.hp - dealt);
      if(absorbed&&!card.shield&&card.heroBreakHeal){healAfter=card.hp>0?card.heroBreakHeal:0;card.heroBreakHeal=0;}
      if (!card.hp) {
        side.board[lane] = null;
        deaths.push({actor: target, lane, card});
      }
    } else {
      side.hp = Math.max(0, side.hp - dealt);
      if (target === 0) state.heroShield -= absorbed;
    }
    record(state, events, 'hit', `${source.name} → ${card?.name ?? '英雄'}：${dealt} 傷害${absorbed ? `，盾吸收 ${absorbed}` : ''}`, {actor, target, lanes: [lane], hp: card?.hp ?? side.hp});
    if(card?.hp>0&&dealt>0)runSignature(state,events,target,card,lane,'hurt',deaths,{record,hitBatch});
    if(healAfter){card.hp=Math.min(card.max,card.hp+healAfter);record(state,events,'skill',`信約之盾・護盾破裂回復 ${healAfter} → ${card.name}`,{actor:target,target,lanes:[lane]});}
  }
  if (batch.some(hit => hit.target === 0 && hit.lane === null)) trigger(state, events, 'danger');
}
function settle(state, events, active, deaths) {
  const sort = (a, b) => (a.actor !== active) - (b.actor !== active) || a.lane - b.lane;
  deaths.sort(sort);
  for (let i = 0; i < deaths.length; i++) {
    const {actor, lane, card} = deaths[i];
    record(state, events, 'death', `${card.name} 陣亡`, {actor, target: actor, lanes: [lane]});
    const next = [];
    if (card.skill === '自爆') {
      const lanes = [lane - 1, lane, lane + 1].filter(index => state.sides[1 - actor].board[index]);
      record(state, events, 'skill', `${card.name} 自爆`, {actor, target: 1 - actor, lanes});
      hitBatch(state, events, actor, card, lanes.map(index => ({target: 1 - actor, lane: index, amount: 1+(card.effect??1)})), next);
    }
    if (card.skill === '亡靈接替' && !state.sides[actor].board[lane]) {
      state.sides[actor].board[lane] = unit('spirit', state.nextUid++,1,card.effect??1);
      state.sides[actor].board[lane].hp+=((card.effect??1)-1);state.sides[actor].board[lane].max=state.sides[actor].board[lane].hp;
      record(state, events, 'skill', `靈體接替第 ${lane + 1} 欄`, {actor, target: actor, lanes: [lane]});
    }
    state.losses??=[0,0];state.losses[actor]++;
    runSignature(state,events,actor,card,lane,'death',next,{record,hitBatch});
    if (actor === 0) trigger(state, events, 'death', lane);
    deaths.push(...next.sort(sort));
  }
}
function result(state) {
  const lost = state.sides.map(side => side.hp <= 0 || (!side.deck.length && !side.hand.length && !side.board.some(Boolean)));
  if (lost[0] && lost[1]) return '平局';
  if (lost[0]) return '敗北';
  if (lost[1]) return '勝利';
  return null;
}
function runRune(state,events,second=false){runExpandedRune(state,events,second,{record,hitBatch,settle});}
function attack(state, events, actor) {
  const board = state.sides[actor].board;
  const rival = state.sides[1 - actor].board;
  const order = board.slice();
  for (const [lane, card] of order.entries()) {
    if (!card || board[lane] !== card) continue;
    const statusDeaths=[];
    for(const status of ['burn','poison'])if(card[status]?.turns>0){
      const tick=card[status];tick.turns--;
      hitBatch(state,events,1-actor,{name:status==='burn'?'燃燒':'中毒'},[{target:actor,lane,amount:tick.amount}],statusDeaths);
      if(board[lane]!==card)break;
    }
    settle(state,events,actor,statusDeaths);if(result(state)){state.result=result(state);break;}
    if(board[lane]!==card)continue;
    if(card.stun){card.stun=0;record(state,events,'skill',`${card.name} 凍結・略過出手`,{actor,target:actor,lanes:[lane]});continue;}
    const signatureDeaths=[];runSignature(state,events,actor,card,lane,'attack',signatureDeaths,{record,hitBatch});settle(state,events,actor,signatureDeaths);
    if(result(state)){state.result=result(state);break;}if(board[lane]!==card)continue;
    const skillBonus=(card.effect??1)-1;
    if (card.skill === '治療') {
      const allies = board.flatMap((ally, index) => ally && ally.hp < ally.max ? [{ally, index}] : []);
      allies.sort((a, b) => a.ally.hp - b.ally.hp || a.index - b.index);
      const target = allies[0];
      if (target) {
        target.ally.hp = Math.min(target.ally.max, target.ally.hp + 2+skillBonus);
        record(state, events, 'skill', `${card.name} 治療 ${target.ally.name}`, {actor, target: actor, lanes: [target.index]});
      }
    }
    const prey = card.skill === '追獵' ? rival.flatMap((enemy, index) => enemy ? [{enemy, index}] : []).sort((a, b) => a.enemy.hp - b.enemy.hp || a.index - b.index)[0] : null;
    const primary = prey?.index ?? (rival[lane] ? lane : null);
    if(card.skill==='援護') {
      const adjacent=[lane-1,lane+1].filter(index=>board[index]&&board[index].hp<board[index].max);
      adjacent.sort((a,b)=>board[a].hp-board[b].hp);
      const target=adjacent[0];
      if(target!==undefined){
        board[target].hp=Math.min(board[target].max,board[target].hp+2+skillBonus);
        record(state,events,'skill',`${card.name} 援護 → ${board[target].name}`,{actor,target:actor,lanes:[target]});
      }
    }
    if(card.skill==='破甲' && primary!==null && rival[primary].shield>0) {
      const removed=Math.min(2+skillBonus,rival[primary].shield);
      rival[primary].shield-=removed;
      record(state,events,'skill',`${card.name} 破甲・移除 ${removed} 點護盾`,{actor,target:1-actor,lanes:[primary]});
    }
    if(card.skill==='守蔭') {
      const target=[lane-1,lane+1].find(index=>board[index]&&!board[index].shield);
      if(target!==undefined) {
        board[target].shield+=1+skillBonus;
        record(state,events,'skill',`${card.name} 守蔭・${board[target].name} 獲得 ${1+skillBonus} 點護盾`,{actor,target:actor,lanes:[target]});
      }
    }
    const advance=card.skill==='猛進'&&primary!==null&&rival[primary].hp>card.hp?1+skillBonus:0;
    const hits = [{target: 1 - actor, lane: primary, amount: card.attack+advance+(prey||!card.skill?skillBonus:0)}];
    if(card.skill==='戰吼' && primary!==null) hits.push({target:1-actor,lane:null,amount:1+skillBonus});
    if (card.skill === '橫掃') {
      for (const index of [lane - 1, lane + 1]) {
        if (rival[index]) hits.push({target: 1 - actor, lane: index, amount: Math.floor(card.attack / 2)+skillBonus});
      }
    }
    record(state, events, 'attack', `${card.name} ${card.skill === '橫掃' ? '橫掃' : '出手'}`, {actor, origin: lane, target: 1 - actor, lanes: hits.map(hit => hit.lane)});
    const deaths = [];
    hitBatch(state, events, actor, card, hits, deaths, true);
    settle(state, events, actor, deaths);
    const ending = result(state);
    if (ending) {
      state.result = ending;
      break;
    }
  }
  for (const side of state.sides) side.board = side.board.filter(Boolean);
}
export function applyAction(previous, action) {
  if (previous.phase !== 'deploy') return null;
  const state = structuredClone(previous);
  const events = [];
  if (action.type === 'deploy') {
    if (!deploy(state, events, 0, action.uid)) return null;
    state.result=result(state);if(state.result){state.phase='end';record(state,events,'end',state.result);}
  } else if (action.type === 'attack') {
    if(['gems','tech'].includes(state.daily?.vault)){
      const lane=(state.round-1)%3;
      const deaths=[];
      hitBatch(state,events,1,{name:'星晶爆裂'},[{target:0,lane,amount:1+Number(state.daily.floor>=6)}],deaths);
      settle(state,events,1,deaths);
    }
    if(!result(state))runRune(state, events);
    if(!result(state))runRune(state, events,true);
    state.result=result(state)??null;
    if(!state.result) {
      trigger(state, events, 'attack');
      state.result=result(state)??null;
    }
    if(!state.result) attack(state, events, 0);
    if (!state.result) {
      const enemy = state.sides[1];
      begin(enemy);
      for (const card of [...enemy.hand]) deploy(state, events, 1, card.uid);
      attack(state, events, 1);
    }
    if (!state.result && state.round >= 40) state.result = '平局';
    if (state.result) {
      state.phase = 'end';
      record(state, events, 'end', state.result);
    } else {
      state.round++;
      begin(state.sides[0]);
      trigger(state, events, 'round');
      record(state, events, 'round', `第 ${state.round} 回合`);
    }
  } else return null;
  return {state, events};
}
import {heroes} from './heroes.mjs?v=expansion-1';
