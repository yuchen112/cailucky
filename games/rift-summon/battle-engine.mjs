import {cards,stages,starter} from './battle.mjs?v=combat-3';
import {dailyStage} from './daily.mjs?v=combat-3';
import {heroHealth,shuffleDeck} from './progression.mjs?v=combat-3';
import {profiles,cardStats,skillScale,combatVersion} from './combat-rules.mjs?v=combat-3';
import {runeProfile} from './runes.mjs?v=combat-3';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createBattle(rune='wall',hero='trust',stage=0,deck=starter,levels={},heroLevel=1,runeLevel=1,daily=null,effects={},heroEffect=1,runeEffect=1,rune2=null,instances=null,random=Math.random){
 const mission=daily?dailyStage(daily):stages[stage];if(!mission)throw Error('Unknown mission');
 const make=(id,uid,level=1,effect=1)=>{const stats=cardStats(id,level,effect);return {id,uid,name:cards[id][0],skill:cards[id][4],level,effect,...stats,hp:stats.max,baseAttack:stats.attack,baseMax:stats.max,turns:0,uses:{}};};
 const own=shuffleDeck(deck.map((id,i)=>({...make(id,i,instances?.[i]?.level??levels[id]??1,instances?.[i]?.effect??effects[id]??1),...(instances?.[i]?.uid?{inventoryUid:instances[i].uid}:{})})),random);
 const enemyIds=mission.opponents.slice(0,12);for(const id of mission.opening)if(!enemyIds.includes(id))enemyIds[enemyIds.length-1]=id;
 const enemies=shuffleDeck(enemyIds.map((id,i)=>make(id,20+i,mission.enemyLevel,mission.enemyEffect)),random),opening=[];
 for(const id of mission.opening){const index=enemies.findIndex(c=>c.id===id);if(index>=0)opening.push(enemies.splice(index,1)[0]);}
 const side=(pile,hp,board=[])=>({hp,maxHp:hp,deck:pile.slice(3),hand:pile.slice(0,3),board,graveyard:[],heroShield:0,revivals:0});
 const hp=heroHealth(heroLevel),state={version:3,combatVersion,phase:'deploy',stage,round:1,result:null,sides:[side(own,hp),side(enemies,mission.hp,opening)],hero,heroLevel,heroEffect,heroMax:hp,enemyHero:mission.hero??'trust',enemyHeroLevel:mission.heroLevel??Math.min(50,Math.ceil(mission.enemyLevel/2)),enemyHeroEffect:mission.enemyEffect,enemyMax:mission.hp,heroProgressionVersion:2,heroUsed:false,heroShield:0,rune,charges:rune==='none'?0:2,runeLevel,runeEffect,rune2:rune2?{...rune2}:null,enemyRunes:(mission.runes??[]).map(id=>({id,level:mission.runeLevel??1,effect:mission.enemyEffect,charges:2})),nextUid:50,sequence:0,losses:[0,0],heroTimers:[0,0],heroUses:[0,0],teamFlags:[{},{}],runeStates:[{},{}]};
 if(daily)state.daily=daily;
 for(const card of state.sides[0].hand)card.count=Math.max(0,card.count-1);
 for(const card of opening)card.opening=true;
 return state;
}
export function applyAction(previous,action){
 if(previous.phase!=='deploy'||previous.combatVersion!==combatVersion)return null;
 const state=structuredClone(previous),events=[];
 const alive=a=>state.sides[a].board.flatMap((card,lane)=>card?[{card,lane}]:[]);
 const frame=()=>({sides:state.sides.map(s=>({hp:s.hp,heroShield:s.heroShield,board:structuredClone(s.board)})),charges:state.charges,rune2Charges:state.rune2?.charges??0,heroShield:state.sides[0].heroShield,round:state.round,runeActivity:structuredClone(state.runeStates[0])});
 function record(kind,message,actor=0,target=actor,lanes=[],extra={}){state.heroShield=state.sides[0].heroShield;events.push({sequence:++state.sequence,kind,message,actor,target,lanes,...extra,frame:frame()});}
 const weak=a=>alive(a).sort((x,y)=>x.card.hp/x.card.max-y.card.hp/y.card.max||x.lane-y.lane);
 const injured=a=>weak(a).filter(x=>x.card.hp<x.card.max);
 const attackValue=(c,a)=>{
  let mult=1+(c.power?.turns>0?c.power.ratio:0)-(c.weaken?.turns>0?c.weaken.ratio:0)-.1*(c.frost??0);
  const lane=state.sides[a].board.indexOf(c),opposite=state.sides[1-a].board[lane];
  if(opposite?.summonKind==='tentacle')mult-=.2;if(opposite?.id==='al04')mult-=.15;
  if(c.id==='my09'&&c.turns%3===1)mult+=.3;
  return Math.max(1,Math.round(c.baseAttack*clamp(mult,.25,2)));
 };
 const capShield=c=>Math.round(c.max*.65);
 function shield(a,c,amount,source='護盾'){
  if(!c||c.hp<=0)return;const before=c.shield;c.shield=Math.min(capShield(c),c.shield+Math.max(1,Math.round(amount)));
  if(c.shield>before)record('skill',`${source} → ${c.name}・護盾 +${c.shield-before}`,a,a,[state.sides[a].board.indexOf(c)]);
 }
 function heal(a,c,amount,source='治療'){
  if(!c||c.hp<=0||c.antiHeal?.turns>0&&c.antiHeal.ratio>=1)return 0;
  const factor=(1-(c.antiHeal?.turns>0?c.antiHeal.ratio:0))*(c.id==='an01'?.75:1),n=Math.min(c.max-c.hp,Math.max(0,Math.round(amount*factor)));
  if(n){c.hp+=n;record('skill',`${source} → ${c.name}・回復 ${n}`,a,a,[state.sides[a].board.indexOf(c)]);}return n;
 }
 function heroHeal(a,amount,source){const s=state.sides[a],n=Math.min(s.maxHp-s.hp,Math.max(0,Math.round(amount)));if(n){s.hp+=n;record('skill',`${source}・英雄回復 ${n}`,a,a,[null]);}return n;}
 function clear(c){for(const key of ['burn','poison','stun','frost','silence','antiHeal','weaken','mark'])delete c[key];}
 function haste(a,delay=false){const list=state.sides[a].hand.filter(c=>delay?c.count<4:c.count>0).sort((x,y)=>x.count-y.count);if(list[0]){list[0].count=clamp(list[0].count+(delay?1:-1),0,4);record('skill',`${delay?'遲滯':'加速'} → ${list[0].name}・倒數 ${list[0].count}`,1-a,a,[null]);return true;}return false;}
 function buff(c,ratio,turns=2){c.power={ratio:Math.max(c.power?.ratio??0,ratio),turns};}
 function status(a,c,key,source){
  if(!c||c.hp<=0)return;
  if(key==='frost'){
   if((c.immuneUntil??0)>=state.round)return;c.frost=(c.frost??0)+1;
   if(c.frost>=3){c.frost=0;c.stun=1;c.immuneUntil=state.round+2;}
  }else if(key==='poison'){c.poison={stacks:Math.min(3,(c.poison?.stacks??0)+1),turns:3,amount:Math.max(1,Math.round(c.max*.03))};}
  else if(key==='burn'){c.burn={amount:Math.max(1,Math.round((source?.baseAttack??10)*.35*skillScale(source?.effect??1))),turns:2};}
  record('skill',`${source?.name??'符文'}・${{frost:'寒霜',poison:'中毒',burn:'燃燒'}[key]}`,a,1-a,[state.sides[1-a].board.indexOf(c)]);
 }
 let chain=0;
 function summon(a,source,kind,ar,hpr){
  const s=state.sides[a];if(s.board.filter(Boolean).length>=14)return null;
  const c={id:'spirit',uid:state.nextUid++,name:{spirit:'英靈',tentacle:'深海觸手',paper:'護身紙偶',hatch:'熔巢幼體',egg:'鳳凰卵'}[kind],skill:'',level:source.level,effect:source.effect,count:0,attack:Math.max(1,Math.round(source.baseAttack*ar)),max:Math.max(1,Math.round(source.baseMax*hpr)),artId:kind==='spirit'?'spirit':'summon-'+kind,sourceId:source.sourceId??source.id,shield:0,turns:0,uses:{},summonKind:kind,rootUid:source.rootUid??source.uid};
  c.baseAttack=c.attack;c.baseMax=c.max;c.hp=c.max;s.board.push(c);record('deploy',`${source.name} 召喚 ${c.name}・Lv.${c.level}・攻 ${c.attack}・血 ${c.hp}`,a,a,[s.board.length-1]);return c;
 }
 function revive(a,corpse,ratio,source){
  const s=state.sides[a];if(!corpse||corpse.summonKind||corpse.revived||s.revivals>=2||s.board.filter(Boolean).length>=14)return false;
  const index=s.graveyard.findIndex(x=>x.uid===corpse.uid);if(index>=0)s.graveyard.splice(index,1);
  const c=structuredClone(corpse);c.uid=state.nextUid++;c.rootUid=corpse.rootUid??corpse.uid;c.revived=true;c.hp=Math.max(1,Math.round(c.max*ratio));c.shield=0;c.count=0;clear(c);s.revivals++;s.board.push(c);record('deploy',`${source}・${c.name} 復活 ${c.hp} / ${c.max} 生命`,a,a,[s.board.length-1]);return true;
 }
 function damage(a,source,target,lane,amount,kind='skill',pierce=0){
  if(++chain>2000)throw Error('Combat reaction safety limit');
  const s=state.sides[target],c=lane===null?null:s.board[lane];if(lane!==null&&!c)return 0;
  let n=Math.max(0,Math.round(amount));
  if(c){
   if(kind==='normal'&&c.id==='my07'){c.hitsTaken=(c.hitsTaken??0)+1;if(c.hitsTaken%3===0){record('skill',`${c.name}・星翼閃避`,target,target,[lane]);return 0;}}
   if(c.id==='al01'&&kind==='normal'&&c.adaptRound!==state.round){c.adaptRound=state.round;shield(target,c,c.max*.12,'晶殼適應');}
   let reduction=0;
   for(const {card,lane:allyLane} of alive(target))if(Math.abs(allyLane-lane)===1){
    if(card.id==='my02'||card.id==='dv08')reduction=Math.max(reduction,.2);
    else if(card.summonKind==='paper')reduction=Math.max(reduction,.15);
    else if(!card.summonKind&&profiles[card.id]?.role==='tank'&&kind==='normal')reduction=Math.max(reduction,.12+.008*card.effect);
   }
   if(c.mark?.turns>0)n=Math.round(n*1.2);n=Math.round(n*(1-reduction));
  }else if(alive(target).some(x=>x.card.id==='dv01'))n=Math.round(n*.75);
  const barrier=c?c.shield:s.heroShield,absorb=Math.min(Math.round(barrier),Math.round(n*(1-pierce))),dealt=c?Math.min(c.hp,n-absorb):Math.min(s.hp,n-absorb);
  if(c){c.shield-=absorb;c.hp-=dealt;}else{s.heroShield-=absorb;s.hp-=dealt;
   const mazu=alive(target).find(x=>x.card.id==='dv01');if(s.hp<=0&&mazu&&!state.teamFlags[target].mazu){state.teamFlags[target].mazu=true;s.hp=Math.round(s.maxHp*.15);record('hero','天后護航・抵擋致命傷害',target,target,[null]);}}
  record('hit',`${source.name} → ${c?.name??'英雄'}：${dealt} 傷害${absorb?'，盾吸收 '+absorb:''}`,a,target,[lane],{hp:c?.hp??s.hp});
  if(c){
   if(!c.hp)die(target,c,lane);
   else{
    if(dealt&&c.id==='an07'&&!c.uses.beast&&c.hp*2<c.max){c.uses.beast=1;heal(target,c,c.max*.2,'月下獸化');}
    if(dealt){state.teamFlags[target].injuryRound=state.round;
     if(kind==='normal'&&(c.id==='dv08'||!c.summonKind&&profiles[c.id]?.trait==='counter'&&c.counterRound!==state.round)){
      c.counterRound=state.round;const back=state.sides[a].board.findIndex(x=>x?.uid===source.uid);if(back>=0)damage(target,c,a,back,c.baseAttack*(c.id==='dv08'?.3:.25),'counter');
     }
     if(kind==='skill'&&c.id==='al05'){const back=state.sides[a].board.findIndex(x=>x?.uid===source.uid);if(back>=0)damage(target,c,a,back,dealt*.25,'reflect');}
    }
   }
  }
  return dealt;
 }
 function die(a,c,lane){
  const s=state.sides[a];s.board[lane]=null;state.losses[a]++;record('death',`${c.name} 陣亡`,a,a,[lane]);
  if(c.summonKind==='egg')return;
  if(!c.summonKind)s.graveyard.push(structuredClone(c));
  if(!c.summonKind&&c.id==='my03'&&!c.revived&&!c.uses.egg){c.uses.egg=1;const egg=summon(a,c,'egg',0,.2+.01*c.effect);if(egg){egg.incubate=2;egg.corpse={...structuredClone(c),uses:{...c.uses}};}return;}
  if(c.id==='an01'&&!c.revived){revive(a,c,.35,'不腐殭身');return;}
  if(c.id==='al08'&&!c.summonKind){summon(a,c,'hatch',.4,.3);summon(a,c,'hatch',.4,.3);}
  if(c.id==='an10')for(const x of alive(1-a).slice(0,3)){status(a,x.card,'poison',c);x.card.antiHeal={ratio:.2,turns:2};}
  if(!c.summonKind&&profiles[c.id]?.role==='bomber')for(const index of [lane-1,lane,lane+1])if(state.sides[1-a].board[index])damage(a,c,1-a,index,c.baseAttack*.9*skillScale(c.effect));
  if(!c.summonKind&&c.id!=='my03'&&profiles[c.id]?.role==='revenant')summon(a,c,'spirit',.5+.01*c.effect,.4+.01*c.effect);
 }
 function deploy(a,uid){
  const s=state.sides[a],index=s.hand.findIndex(c=>c.uid===uid&&c.count===0);if(index<0||s.board.filter(Boolean).length>=12)return false;
  const [c]=s.hand.splice(index,1);s.board.push(c);record('deploy',`${c.name} 部署`,a,a,[s.board.length-1]);
  if(c.id==='my08'){summon(a,c,'tentacle',.45,.35);summon(a,c,'tentacle',.45,.35);}
  if(c.id==='an03')summon(a,c,'paper',.35,.45);
  if(c.id==='my10')for(const x of alive(a).filter(x=>x.card!==c).slice(0,2))shield(a,x.card,x.card.max*.15,'獅鷲護翼');
  if(!profiles[c.id]?.special){const trait=profiles[c.id]?.trait;if(trait==='haste')haste(a);if(trait==='rally'||trait==='ward'){const ally=alive(a).find(x=>x.card!==c&&(trait==='rally'||Math.abs(x.lane-s.board.indexOf(c))===1));if(ally)shield(a,ally.card,ally.card.max*(trait==='ward'?.12:.1),c.name);}}
  return true;
 }
 function pulseHero(a){
  const hero=a===0?state.hero:state.enemyHero,level=a===0?state.heroEffect:state.enemyHeroEffect,s=state.sides[a],scale=skillScale(level),timers=state.heroTimers;
  if((timers[a]??0)>state.round)return;let fired=false;const targets=injured(a),all=alive(a);
  if(['hope','night'].includes(hero)&&s.hp<s.maxHp*.65){if(hero==='hope'){s.heroShield=Math.round(Math.min(s.maxHp*.3,s.heroShield+s.maxHp*.12*scale));fired=true;}else fired=!!heroHeal(a,s.maxHp*.13*scale,'夜幕回復');}
  if(hero==='trust'&&all.length){const x=weak(a)[0];shield(a,x.card,x.card.max*.16*scale,hero==='trust'?'信約之盾':'淚光庇護');if(level>=5)heal(a,x.card,x.card.max*.06);fired=true;}
  if(hero==='sadness'&&targets.some(x=>x.card.hp<=x.card.max*.5)){for(const x of targets.slice(0,level>=5?2:1)){shield(a,x.card,x.card.max*.14*scale,'淚光庇護');if(level>=5){delete x.card.burn;delete x.card.poison;}}fired=true;}
  if(hero==='healing'&&targets.length){for(const x of targets.slice(0,level>=5?2:1))heal(a,x.card,x.card.max*.2*scale,'心光治療');fired=true;}
  if(hero==='growth')for(let n=0;n<(level>=5?2:1);n++)fired=haste(a)||fired;
  if(hero==='joy'&&all.length>=2){for(const x of all.slice(0,level>=5?3:2))buff(x.card,.1+.01*level,2);fired=true;}
  if(hero==='luck'&&alive(1-a).length){const x=weak(1-a)[0],power=all.length?all.reduce((n,x)=>n+x.card.baseAttack,0)/all.length:4+(a===0?state.heroLevel:state.enemyHeroLevel)*.3;damage(a,{name:'幸運追擊'},1-a,x.lane,power*scale*(x.card.hp/x.card.max<.35?1.2:.6));fired=true;}
  if(hero==='memory'&&s.graveyard.length&&state.heroUses[a]<2){const corpse=s.graveyard.find(c=>!c.revived);if(corpse){summon(a,corpse,'spirit',.5+.02*level,.35+.015*level);s.graveyard=s.graveyard.filter(c=>c.uid!==corpse.uid);fired=true;}}
  if(hero==='dream'&&s.deck.length&&s.hand.length<5){const c=s.deck.shift();c.count=Math.max(0,c.count-(level>=5?2:1));s.hand.push(c);fired=true;}
  if(fired){state.heroUses[a]++;timers[a]=state.round+(level>=10?2:3);if(a===0)state.heroUsed=true;record('hero',`${hero}・技能 Lv.${level}（${timers[a]-state.round} 回合冷卻）`,a,a,[null]);}
 }
 function specialTurn(a,c){
  const allies=()=>alive(a),foes=()=>alive(1-a),hurt=()=>injured(a),p=c.turns,atk=attackValue(c,a),every=n=>p%n===0;
  if(c.id==='my01'&&every(3))for(const x of allies())delete x.card.burn;
  if(c.id==='my02'&&every(2)){const lane=state.sides[a].board.indexOf(c);for(const x of allies().filter(x=>Math.abs(x.lane-lane)===1))heal(a,x.card,x.card.max*.15,c.name);}
  if(c.id==='my05'&&every(2))for(const x of hurt().slice(0,2)){heal(a,x.card,x.card.max*.22,c.name);clear(x.card);x.card.immuneUntil=state.round+1;}
  if(c.id==='my06')heal(a,c,c.max*.1,c.name);
  if(c.id==='my07'&&every(2))haste(a);
  if(c.id==='my09'){if(p%3===2)shield(a,c,c.max*.2,c.name);if(p%3===0)heal(a,c,c.max*.2,c.name);}
  if(c.id==='an02'&&every(3)){const x=foes().at(-1);if(x)x.card.weaken={ratio:.2,turns:2};}
  if(c.id==='an04'&&every(2)){const x=foes().sort((x,y)=>y.card.shield-x.card.shield)[0];if(x?.card.shield){const n=x.card.shield;x.card.shield=0;shield(a,c,n*.5,c.name);}}
  if(c.id==='an05'&&every(3))for(const x of foes().filter(x=>x.card.burn?.turns))x.card.antiHeal={ratio:1,turns:1};
  if(c.id==='an06'&&every(2)){const x=weak(1-a).find(x=>x.card.hp/x.card.max<.3);if(x)damage(a,c,1-a,x.lane,atk*(x.card.id==='boss'?1:1.6));}
  if(c.id==='an09'&&every(3)){const x=foes().filter(x=>(x.card.immuneUntil??0)<state.round).sort((x,y)=>y.card.attack-x.card.attack)[0];if(x){x.card.silence=1;x.card.immuneUntil=state.round+2;record('skill',`${c.name} 沉默 ${x.card.name}`,a,1-a,[x.lane]);}}
  if(c.id==='dv02'&&every(2)){for(const x of hurt().slice(0,3)){heal(a,x.card,x.card.max*.18,c.name);clear(x.card);}if(!c.uses.revive&&revive(a,state.sides[a].graveyard.find(x=>!x.revived),.4,'慈航蓮生'))c.uses.revive=1;}
  if(c.id==='dv04'&&every(2)){const lane=state.sides[a].board.indexOf(c);for(let n=0;n<2;n++){const target=state.sides[1-a].board[lane];if(target){damage(a,c,1-a,lane,atk*.7);if(target.hp>0)status(a,target,'burn',c);}}}
  if(c.id==='dv05'&&every(2)){const x=foes()[0];if(x){x.card.shield=0;delete x.card.power;record('skill',`${c.name}・破妄清除護盾與強化`,a,1-a,[x.lane]);}}
  if(c.id==='dv06'){
   if(state.teamFlags[a].injuryRound===state.round-1)c.stones=(c.stones??0)+1;
   if(c.stones>=5&&(c.uses.stones??0)<2){c.stones=0;c.uses.stones=(c.uses.stones??0)+1;heroHeal(a,state.sides[a].maxHp*.15,c.name);for(const x of allies())heal(a,x.card,x.card.max*.2,c.name);}
  }
  if(c.id==='dv07'&&every(2))for(const x of foes().slice(0,3)){x.card.shield=Math.floor(x.card.shield*.75);damage(a,c,1-a,x.lane,atk*.75);}
  if(c.id==='dv09'&&(c.uses.judge??0)<2){const x=weak(1-a).find(x=>x.card.hp/x.card.max<.15);if(x){c.uses.judge=(c.uses.judge??0)+1;damage(a,c,1-a,x.lane,x.card.id==='boss'?atk*1.2:x.card.hp+x.card.shield);}}
  if(c.id==='dv10'){for(const x of allies()){heal(a,x.card,x.card.max*.08,c.name);if(every(3))clear(x.card);}if(every(3))for(const x of foes())status(a,x.card,'burn',c);}
  if(c.id==='al03'&&every(2)){for(const x of allies())heal(a,x.card,x.card.max*.12,c.name);if(foes()[0])status(a,foes()[0].card,'poison',c);}
  if(c.id==='al04'&&every(2))shield(a,c,c.max*.2,c.name);
  if(c.id==='al06'&&every(3)){haste(1-a,true);for(const x of foes())damage(a,c,1-a,x.lane,atk*.4);}
  if(c.id==='al09')haste(p%2?a:1-a,p%2===0);
  if(c.id==='al10'&&every(2)){const x=weak(1-a)[0];if(x){x.card.mark={turns:2};record('skill',`${c.name}・虹膜標記`,a,1-a,[x.lane]);}}
 }
 function ordinaryTurn(a,c,traits=true){
  const profile=profiles[c.id],e=skillScale(c.effect),all=alive(a),hurt=injured(a),lane=state.sides[a].board.indexOf(c);
  if(profile.role==='healer'&&hurt[0])heal(a,hurt[0].card,c.baseAttack*e+hurt[0].card.max*.06,c.name);
  if(profile.role==='medic')for(const x of hurt.filter(x=>Math.abs(x.lane-lane)===1))heal(a,x.card,x.card.max*.1*e,c.name);
  if(profile.role==='barrier'&&c.turns%3===0)shield(a,c,c.max*(.1+.005*c.effect),c.name);
  if(profile.role==='support'&&c.turns%2===0){const x=all.filter(x=>Math.abs(x.lane-lane)===1).sort((x,y)=>x.card.shield-y.card.shield)[0];if(x)shield(a,x.card,x.card.max*.12*e,c.name);}
  if(profile.role==='leader'&&c.turns%3===0)for(const x of all.slice(0,2))buff(x.card,.1+.01*c.effect,2);
  if(traits&&profile.trait==='regen')heal(a,c,c.max*.08,c.name);
  if(traits&&profile.trait==='mend'&&c.turns%2===0&&hurt[0])heal(a,hurt[0].card,hurt[0].card.max*.1,c.name);
  if(traits&&profile.trait==='cleanse'&&c.turns%3===0&&hurt[0]){clear(hurt[0].card);record('skill',`${c.name} 淨化 ${hurt[0].card.name}`,a,a,[hurt[0].lane]);}
  if(traits&&['avenge','oracle'].includes(profile.trait)&&c.turns%3===0)heroHeal(a,state.sides[a].maxHp*(profile.trait==='oracle'?.04:.03),c.name);
 }
 function rune(a,slot){
  if(!slot||slot.id==='none')return;const p=runeProfile(slot.id,slot.level??1,slot.effect??1);if(!p)return;
  const key=slot.key??slot.id,store=state.runeStates[a];store[key]??={next:1,uses:0};const timer=store[key];if(timer.next>state.round||p.limit&&timer.uses>=p.limit)return;
  const team=state.sides[a],foes=alive(1-a),all=alive(a),hurt=injured(a),half=team.hp<=team.maxHp*.5;
  if(p.condition==='wounded'&&!hurt.length||p.condition==='two'&&all.length<2||p.condition==='three'&&all.length<3||p.condition==='foes3'&&foes.length<3||p.condition==='foes4'&&foes.length<4||p.condition==='half'&&!half||p.condition==='outnumbered'&&foes.length<=all.length||p.condition==='death'&&!(state.losses[a]>(timer.losses??0))||p.condition==='hand3'&&team.hand.filter(c=>c.count>0).length<3)return;
  let fired=false;const n=p.amount,targets=injured(a).length?injured(a):weak(a),source={name:p.name,baseAttack:n*2,effect:slot.effect??1};
  const healMany=list=>{for(const x of list.slice(0,p.targets)){const value=heal(a,x.card,n+x.card.max*p.percent,p.name);fired=fired||value>0;if(p.cleanse){clear(x.card);fired=true;}if(p.addShield)shield(a,x.card,n*.4,p.name);}};
  if(p.action==='shield'){const list=p.condition==='half'?all:targets;for(const x of list.slice(0,p.targets)){if(x.card.shield<capShield(x.card)){shield(a,x.card,n+x.card.max*p.percent,p.name);fired=true;}}}
  if(p.action==='heal')healMany(targets);
  if(p.action==='heroShield'&&team.heroShield<team.maxHp*.3){team.heroShield=Math.round(Math.min(team.maxHp*.3,team.heroShield+n+team.maxHp*p.percent));fired=true;}
  if(p.action==='heroHeal')fired=!!heroHeal(a,n+team.maxHp*p.percent,p.name);
  if(p.action==='renewal'){fired=!!heroHeal(a,n+team.maxHp*p.percent,p.name);healMany(targets);}
  if(p.action==='haste')for(let i=0;i<p.targets;i++)fired=haste(a)||fired;
  if(p.action==='delay')for(let i=0;i<p.targets;i++)fired=haste(1-a,true)||fired;
  if(p.action==='draw'&&team.deck.length){const card=team.deck.shift();team.hand.push(card);if(p.haste)card.count=Math.max(0,card.count-1);fired=true;timer.losses=state.losses[a];}
  if(p.action==='power'&&all.length){for(const x of [...all].sort((x,y)=>y.card.attack-x.card.attack).slice(0,p.targets))buff(x.card,p.percent,2);fired=true;}
  if(['hit','leech','burn','poison','freeze','dispel','weaken','vitality','cleanse','mend','echo'].includes(p.action)){
   if(['vitality','cleanse','mend'].includes(p.action)){
    for(const x of targets.slice(0,p.targets)){if(p.action==='vitality'){const cap=x.card.baseMax*1.35,added=Math.min(n,Math.max(0,Math.round(cap-x.card.max)));x.card.max+=added;heal(a,x.card,added,p.name);fired=fired||added>0;}
     else {if(p.action==='cleanse'&&!['burn','poison','stun','silence','antiHeal'].some(k=>x.card[k]))continue;clear(x.card);heal(a,x.card,n+x.card.max*p.percent,p.name);if(p.action==='mend')shield(a,x.card,n*.5,p.name);fired=true;}}
   }else{
    let picks=[...foes];if(p.id==='shadow')picks.reverse();else picks.sort((x,y)=>p.action==='weaken'?y.card.attack-x.card.attack:x.card.hp-y.card.hp);
    for(const x of picks.slice(0,p.targets)){
     if(p.action==='dispel'){const v=Math.min(x.card.shield,n+x.card.max*p.percent);x.card.shield-=Math.round(v);fired=fired||v>0;}
     else if(p.action==='freeze'){if((x.card.immuneUntil??0)>=state.round)continue;x.card.stun=1;x.card.immuneUntil=state.round+2;fired=true;}
     else if(p.action==='weaken'){x.card.weaken={ratio:p.percent,turns:2};fired=true;}
     else if(p.action==='burn'||p.action==='poison'){status(a,x.card,p.action,source);if(p.action==='burn')x.card.burn.amount=n;if(p.action==='poison')x.card.poison.amount=Math.max(1,Math.round(x.card.max*p.percent));fired=true;}
     else {const dealt=damage(a,source,1-a,x.lane,n+x.card.max*p.percent);fired=true;if(p.action==='leech')heroHeal(a,dealt,p.name);if(p.action==='echo'&&state.sides[1-a].board[x.lane])damage(a,source,1-a,x.lane,n*.5);}
    }
   }
  }
  if(p.action==='heroHit'){damage(a,source,1-a,null,n);fired=true;}
  if(fired){timer.uses++;timer.next=state.round+p.cooldown;slot.charges=p.limit?Math.max(0,p.limit-timer.uses):2;record('skill',`${p.name}・${p.cooldown} 回合冷卻`,a,a,[null],{rune:slot.id});}
 }
 function turn(a){
  const s=state.sides[a];for(const c of [...s.board].filter(Boolean)){
   if(c.summonKind==='egg'){if(--c.incubate<=0){const lane=s.board.indexOf(c);s.board[lane]=null;revive(a,c.corpse,.4+.02*c.effect,'浴火重生');}continue;}
   c.turns++;
   for(const key of ['burn','poison'])if(c[key]?.turns>0&&c.hp>0){const x=c[key];x.turns--;damage(1-a,{name:key==='burn'?'燃燒':'中毒'},a,s.board.indexOf(c),Math.min(c.max*.15,x.amount*(key==='poison'?x.stacks:1)),'dot');}
  }
  if(!s.hp)return;pulseHero(a);
  if(a===0){const slot={id:state.rune,level:state.runeLevel,effect:state.runeEffect,key:'first',charges:state.charges};rune(a,slot);state.charges=slot.charges;if(state.rune2){state.rune2.key='second';rune(a,state.rune2);}}
  else for(const [i,r] of state.enemyRunes.entries()){r.key='enemy'+i;rune(a,r);}
  const order=[...s.board];for(const c of order){
   if(!c||c.hp<=0||c.summonKind==='egg'||!s.board.includes(c))continue;
   if(c.stun){c.stun=0;record('skill',`${c.name} 凍結・略過本次出手`,a,a,[s.board.indexOf(c)]);continue;}
   if(!c.silence&&!c.summonKind){if(profiles[c.id]?.special){ordinaryTurn(a,c,false);specialTurn(a,c);}else ordinaryTurn(a,c);}
   if(c.silence)c.silence--;
   if(!s.board.includes(c)||!state.sides[1-a].hp)continue;
   const lane=s.board.indexOf(c),foe=state.sides[1-a],profile=c.summonKind?{role:'fighter'}:profiles[c.id];let target=foe.board[lane]?lane:null;
   if(profile.role==='hunter'||c.id==='an04')target=weak(1-a)[0]?.lane??null;
   if(c.id==='dv03')target=alive(1-a).sort((x,y)=>y.card.attack-x.card.attack)[0]?.lane??null;
   const atk=attackValue(c,a);c.attack=atk;let amount=atk;
   if(profile.role==='charger'&&!c.uses.charge){c.uses.charge=1;amount*=1.3+.03*c.effect;}
   if(profile.role==='hunter'&&target!==null&&foe.board[target].hp*2<foe.board[target].max)amount*=1.1+.01*c.effect;
   if(profile.role==='fighter'&&c.turns%2===0)amount*=1.15+.015*c.effect;
   if(profile.role==='charger'&&target!==null&&foe.board[target].hp>c.hp)amount*=1.1+.01*c.effect;
   if(profile.trait==='focus'&&c.turns%3===0)amount*=1.2;
   const pierce=Math.min(.75,(c.id==='dv05'?.5:profile.role==='breaker'?.25:0)+(profile.trait==='pierce'?.25:0));
   if(profile.role==='breaker'&&target!==null)foe.board[target].shield=Math.max(0,foe.board[target].shield-Math.round(atk*skillScale(c.effect)));
   record('attack',`${c.name} 出手`,a,1-a,[target],{origin:lane});
   const victim=target===null?null:foe.board[target];const dealt=damage(a,c,1-a,target,amount*(c.id==='al02'?.65:1),'normal',pierce);
   if(c.hp>0&&c.id==='al02'&&target!==null&&foe.board[target])damage(a,c,1-a,target,amount*.65,'normal',.5);
   const leech=c.id==='an08'?.5:c.id==='an02'?.4:c.id==='an07'&&c.uses.beast?.45:profile.trait==='leech'?.3:0;
   if(leech&&dealt){heal(a,c,dealt*leech,'吸血');if(c.id==='an08')heroHeal(a,dealt*.1,c.name);}
   if(victim?.hp>0){
    if(profile.trait==='burn'||c.id==='al08'||c.id==='an05')status(a,victim,'burn',c);
    if(profile.trait==='poison'||c.id==='my06'||c.id==='al07'){status(a,victim,'poison',c);if(c.id==='al07')victim.antiHeal={ratio:.2,turns:3};}
    if(c.id==='my04'||profile.trait==='frost'&&c.turns%2===0)status(a,victim,'frost',c);
    if(c.id==='my01'){victim.thunder=(victim.thunder??0)+1;if(victim.thunder>=3){victim.thunder=0;for(const x of alive(1-a).slice(0,3))damage(a,c,1-a,x.lane,atk*.7);}}
   }
   if(c.id==='my10'&&victim&&victim.hp<=0)for(const x of alive(a))buff(x.card,.15,2);
   if(c.id==='dv03'&&victim&&victim.hp<=0)shield(a,c,c.max*.25,c.name);
   if(c.hp<=0||!s.board.includes(c)){if(end())break;continue;}
   if(profile.role==='sweeper')for(const i of [lane-1,lane+1])if(foe.board[i])damage(a,c,1-a,i,atk*(.3+.02*c.effect),'normal');
   if(profile.role==='leader'&&target!==null)damage(a,c,1-a,null,Math.max(1,atk*.12));
   if(c.id==='my06')for(const x of alive(1-a).filter(x=>x.card!==victim).slice(0,2))damage(a,c,1-a,x.lane,atk*(.25+.25*c.hp/c.max));
   if(profile.trait==='cleave'&&c.turns%3===0&&target!==null&&foe.board[target])damage(a,c,1-a,target,atk*.35,'normal');
   if(end())break;
  }
  for(const c of order)if(c&&s.board.includes(c))for(const key of ['power','weaken','mark','antiHeal'])if(c[key]?.turns>0)c[key].turns--;
  for(const side of state.sides)side.board=side.board.filter(Boolean);
 }
 function end(){for(const a of [0,1]){const s=state.sides[a],hero=a===0?state.hero:state.enemyHero;if(s.hp>0&&!s.deck.length&&!s.hand.length&&!s.board.some(Boolean)&&hero==='memory'&&s.graveyard.length&&state.heroUses[a]<2&&(state.heroTimers[a]??0)<=state.round)pulseHero(a);}
 const lost=state.sides.map(s=>s.hp<=0||!s.deck.length&&!s.hand.length&&!s.board.some(Boolean));state.result=lost[0]&&lost[1]?'平局':lost[0]?'敗北':lost[1]?'勝利':null;return state.result;}
 if(action.type==='deploy'){if(!deploy(0,action.uid))return null;}
 else if(action.type==='attack'){
  turn(0);
  if(!end()){
   const foe=state.sides[1];for(const c of foe.hand)c.count=Math.max(0,c.count-1);if(foe.deck.length)foe.hand.push(foe.deck.shift());
   const ready=foe.hand.filter(c=>!c.count).sort((x,y)=>Number(['tank','barrier'].includes(profiles[y.id]?.role))-Number(['tank','barrier'].includes(profiles[x.id]?.role)));
   for(const c of ready){deploy(1,c.uid);if(end())break;}
   if(!end())turn(1);
  }
  if(!end()&&state.round>=60)state.result='平局';
  if(!state.result){state.round++;const own=state.sides[0];for(const c of own.hand)c.count=Math.max(0,c.count-1);if(own.deck.length)own.hand.push(own.deck.shift());record('round',`第 ${state.round} 回合`);}
 }else return null;
 if(state.result==='平局'||end()){state.phase='end';record('end',state.result);}
 return {state,events};
}
