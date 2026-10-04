import {addDamageStack,tickDamageStacks} from './damage-stacks.mjs?v=20261005-growth1';
import {validateDungeon,dungeonWave} from './dungeons.mjs?v=20261005-growth1';
import {routePoint,routeLength,routePads,regionFor} from './routes.mjs?v=20261005-growth1';
import {inCone} from './attack-shapes.mjs?v=20261005-growth1';
import {tickZones,tickBlocking} from './troop-mechanics.mjs?v=20261005-growth1';
// Deterministic simulation. Visuals consume events; animation never grants damage.
import {SPECIALIZATIONS,statsFor,BLESSINGS} from './progression.mjs?v=20261005-growth1';
import {UNITS,UNIT_BRANCHES,DEFAULT_LOADOUT,validateLoadout} from './army.mjs?v=20261005-growth1';
import {heroBuild,supportFor,supportRadius,heroRange} from './hero-rules.mjs?v=20261005-growth1';
import {CAMPAIGN,encounterWave} from './encounters.mjs?v=20261005-growth1';
import {skillSpec} from './skill-spec.mjs?v=20261005-growth1';
export {UNITS,UNIT_BRANCHES};
export {SPECIALIZATIONS,BLESSINGS};
export const towerStats=(t,s)=>{const r=statsFor(ROLES[t.role]||UNITS[t.role],t,s?.buffs);if(s?.army)r.damage*=1+(s.training?.[t.role]||0)*.01;return r;};
export function validateTraining(value={}){if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([id,n])=>!Object.hasOwn(UNITS,id)||!Number.isInteger(n)||n<0||n>87))throw Error('部隊訓練不正確');return {...value};}
export const WORLD = Object.freeze({width:390,height:585});
// Calibrated against the actual independent road image, not its generation prompt.
export const PATH = [[197,0],[197,32],[186,59],[164,71],[76,71],[56,85],[51,107],[51,150],[66,173],[88,183],[306,183],[329,195],[337,218],[337,270],[327,293],[305,308],[79,308],[60,326],[52,351],[52,389],[65,410],[89,416],[176,416],[191,431],[198,456],[198,585]];
export const PADS = [130,258,386].flatMap(y=>[102,195,288].map(x=>({x,y})));
export const ROLES = Object.freeze({
  growth:{name:'成長',cost:100,damage:24,interval:.95,range:145,kind:'seed',description:'穩定單體攻擊，適合前排守路。'},
  dream:{name:'夢想',cost:140,damage:19,interval:1.6,range:150,splash:55,kind:'star',description:'星光命中後波及附近敵人。'},
  luck:{name:'幸運',cost:120,damage:21,interval:1.1,range:145,crit:3,kind:'clover',description:'每第三次攻擊造成雙倍傷害。'},
  joy:{name:'快樂',cost:100,damage:13,interval:.55,range:125,kind:'spark',description:'快速攻擊，擅長處理小群敵人。'},
  night:{name:'夜晚陪伴',cost:140,damage:42,interval:1.7,range:205,kind:'moon',description:'長射程重擊，優先追擊最接近終點的敵人。'},
  sadness:{name:'悲傷',cost:120,damage:14,interval:1.1,range:145,slow:.48,kind:'rain',description:'命中減慢敵人，效果不會無限疊加。'},
  trust:{name:'信任',cost:120,damage:12,interval:1.2,range:130,aura:1.2,kind:'rune',description:'提升附近伙伴的攻擊傷害。'},
  memory:{name:'回憶',cost:130,damage:21,interval:1.3,range:150,pierce:true,kind:'echo',description:'回響攻擊無視敵人的護甲。'},
  healing:{name:'療癒',cost:110,damage:15,interval:1.25,range:135,heal:1,kind:'petal',description:'完成一波後恢復守護目標一點生命。'},
  hope:{name:'希望',cost:160,damage:34,interval:1.6,range:155,splash:35,pierce:true,kind:'light',description:'光芒穿透護甲並波及小範圍。'}
});
export const ENEMIES = Object.freeze({
  moth:{hp:52,speed:44,armor:0,reward:16,leak:1,air:true},
  walker:{hp:66,speed:33,armor:0,reward:12,leak:1},
  runner:{hp:48,speed:55,armor:0,reward:14,leak:1},
  armored:{hp:125,speed:25,armor:.45,reward:20,leak:2},
  boss:{hp:580,speed:21,armor:.2,reward:90,leak:5}
});
const lengths = PATH.slice(1).map((p,i)=>Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1]));
export const PATH_LENGTH = lengths.reduce((a,b)=>a+b,0);
export function pointAt(distance,s=null,route=0){
  const routed=routePoint(distance,s,route);if(routed)return routed;
  let d=Math.max(0,distance);
  for(let i=0;i<lengths.length;i++){
    if(d<=lengths[i]){const t=d/lengths[i];return {x:PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*t,y:PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*t};}
    d-=lengths[i];
  }
  return {x:198,y:585};
}
export function createBattle({dungeon=null,mode='campaign',stage=1,hero=null,loadout=DEFAULT_LOADOUT,masteryXp=0,specialization=null,talents={},training={},map=null}={}){
  dungeon=validateDungeon(dungeon);if(dungeon&&mode!=='campaign')throw Error('副本模式不正確');
  if(!['campaign','endless'].includes(mode)||!Number.isInteger(stage)||stage<1||stage>Math.max(30,CAMPAIGN.length))throw Error('無效戰役');
  if(hero!==null&&!Object.hasOwn(ROLES,hero))throw Error('無效英雄');
  const army=hero!==null;training=validateTraining(training);
  if(army&&stage>CAMPAIGN.length)throw Error('關卡尚未製作');
  if(map!==null&&!['forest','moon','dawn','ruins'].includes(map))throw Error('無效地圖');
  return {version:1,dungeon,mode,stage,map,army,training,loadout:army?validateLoadout(loadout):[],hero:army?{role:hero,...heroBuild(hero,masteryXp,specialization,talents),x:195,y:215,ready:0,skillReady:0,attacks:0,moves:0,echo:0,focus:0,guardianUsed:false}:null,phase:'planning',time:0,remainder:0,paused:false,gold:360,hp:20,maxHp:20,shield:0,buffs:{power:0,reach:0},blessingChoices:[],wave:0,maxWaves:dungeon?3:army&&mode==='campaign'?CAMPAIGN[stage-1].waves.length:6,kills:0,nextId:1,towers:[],enemies:[],shots:[],pending:[],zones:[],queue:[],events:[],eventId:0};
}
function event(s,type,data={}){s.events.push({id:++s.eventId,type,time:s.time,...data});}
export function moveHero(){return false;} // Fixed commander; retained for legacy callers.
export function castHero(s,targetId){
 const h=s.hero;if(!h||s.paused||s.phase!=='battle'||h.skillReady>s.time)return false;
 const target=s.enemies.find(e=>e.id===targetId&&e.hp>0)||s.enemies.filter(e=>e.hp>0).sort((a,b)=>b.distance-a.distance)[0];
 if(['dream','night','sadness','memory','hope'].includes(h.role)&&!target)return false;
 const p=target?pointAt(target.distance,s,target.route):h;
 const spec=skillSpec(h,ROLES[h.role]),radius=spec.radius;
 const nearby=s.towers;
 if((['growth','luck'].includes(h.role)&&!nearby.length)||(h.role==='joy'&&!s.towers.length))return false;
 if(h.role==='growth')for(const t of nearby)t.heroPowerUntil=s.time+spec.duration;
 else if(h.role==='trust'){for(const t of nearby)t.trustUntil=s.time+spec.duration;s.shield+=spec.shield;}
 else if(h.role==='joy')h.hasteUntil=s.time+spec.duration;
 else if(h.role==='luck')for(const t of nearby)t.luckyCharges=spec.charges;
 else if(h.role==='healing'){s.hp=Math.min(s.maxHp,s.hp+spec.heal);s.shield+=spec.shield;}
 else {s.shots.push({id:s.nextId++,hero:true,targetId:target.id,from:{x:h.x,y:h.y},born:s.time,arriveAt:s.time+.6,damage:spec.damage,kind:ROLES[h.role].kind,splash:spec.splash,pierce:spec.pierce,slow:spec.slow,slowDuration:spec.slowDuration,root:spec.root});if(h.role==='memory')h.echo=0;}
 h.skillReady=s.time+spec.cooldown;event(s,'hero-skill',{hero:true,role:h.role,duration:spec.duration||0,radius:spec.radius||0,...p});return true;
}
export function deploy(s,pad,role){
  const catalog=s.army?UNITS:ROLES;
  if(!['planning','battle','intermission'].includes(s.phase)||s.paused||!Number.isInteger(pad)||!PADS[pad]||!Object.hasOwn(catalog,role)||(s.army&&!s.loadout.includes(role)))return false;
  if(s.towers.some(t=>t.pad===pad||(!s.army&&t.role===role))||s.gold<catalog[role].cost)return false;
  s.gold-=catalog[role].cost;
  s.towers.push({id:s.nextId++,pad,role,level:1,branch:null,priority:'first',spent:catalog[role].cost,blockBudget:catalog[role].blockStamina||0,ready:s.time+.2,attacks:0});event(s,'deploy',{pad,role});return true;
}
export const upgradeCost=t=>80*t.level;
export function upgrade(s,pad,branch){
  const t=s.towers.find(t=>t.pad===pad);
  if(s.paused||!['planning','battle','intermission'].includes(s.phase)||!t||t.level>=(s.army?10:5)||s.gold<upgradeCost(t))return false;
  if(t.level===2&&!(s.army?UNIT_BRANCHES:SPECIALIZATIONS)[t.role].some(p=>p.id===branch))return false;
  const oldStamina=towerStats(t,s).blockStamina||0;const before={role:t.role,level:t.level,branch:t.branch};if(t.level===2)t.branch=branch;
  const cost=upgradeCost(t);s.gold-=cost;t.spent+=cost;t.level++;t.blockBudget=(t.blockBudget||0)+Math.max(0,(towerStats(t,s).blockStamina||0)-oldStamina);event(s,'upgrade',{pad,level:t.level,before});return true;
}
export function setPriority(s,pad,priority){const t=s.towers.find(t=>t.pad===pad);if(s.paused||!t||!['planning','battle','intermission'].includes(s.phase)||!['first','strong','armor'].includes(priority))return false;t.priority=priority;return true;}
export function chooseBlessing(s,id){if(s.paused||s.phase!=='intermission'||!s.blessingChoices.includes(id))return false;if(id==='supplies')s.gold+=100;else if(id==='power')s.buffs.power++;else if(id==='reach')s.buffs.reach++;else if(id==='repair')s.hp=Math.min(s.maxHp,s.hp+4);else s.buffs[id]=(s.buffs[id]||0)+1;s.blessingChoices=[];event(s,'blessing',{kind:id});return true;}
const waveKinds=wave=>{const count=Math.min(40,5+wave*2);return Array.from({length:count},(_,i)=>wave%3===0&&i===count-1?'boss':wave>=3&&i%4===2?'armored':wave>=5&&i%7===1?'moth':wave>=2&&i%3===1?'runner':'walker');};
export const kindsFor=(s,wave)=>s.dungeon?dungeonWave(s.dungeon,wave):s.army&&s.mode==='campaign'?encounterWave(s.stage,wave):waveKinds(wave);
export function wavePreview(s){return kindsFor(s,s.mode==='campaign'?Math.min(s.maxWaves,s.wave+1):s.wave+1).reduce((counts,kind)=>(counts[kind]=(counts[kind]||0)+1,counts),{});}
export function sell(s,pad){
  const t=s.towers.find(t=>t.pad===pad);
  if(s.paused||!['planning','battle','intermission'].includes(s.phase)||!t)return false;
  s.gold+=Math.floor(t.spent*70/100);s.towers=s.towers.filter(x=>x!==t);
  // An anticipation cancelled before its release cannot create a ghost projectile.
  s.pending=s.pending.filter(a=>a.towerId!==t.id);s.zones=(s.zones||[]).filter(z=>z.owner!==t.id);for(const e of s.enemies)if(e.blockOwner===t.id)e.blockedUntil=s.time;event(s,'sell',{pad});return true;
}
export function startWave(s){
  if(s.paused||!['planning','intermission'].includes(s.phase)||!s.towers.length||s.blessingChoices.length)return false;
  if(s.mode==='endless'&&s.wave>=(s.army?99:99999))return false;
  if(!s.towers.some(t=>towerStats(t,s).damage>0))return false;for(const t of s.towers)t.blockBudget=towerStats(t,s).blockStamina||0;s.zones=[];
  s.shield=s.towers.reduce((n,t)=>n+towerStats(t,s).shield,0);
  if(s.hero){Object.assign(s.hero,{ready:s.time,skillReady:s.time,moveReady:s.time,moves:0,hasteUntil:0,echo:0,focus:0,focusId:null,guardianUsed:false});for(const t of s.towers)Object.assign(t,{heroPowerUntil:0,trustUntil:0,luckyCharges:0});}
  s.wave++;s.phase='battle';
  s.queue=kindsFor(s,s.wave).map((kind,i)=>({at:s.time+i*(s.army&&s.mode==='campaign'&&!s.dungeon?CAMPAIGN[s.stage-1].interval:.95),kind,route:i%2}));
  event(s,'wave',{wave:s.wave});return true;
}
export function enemyStats(kind,s,wave=s.wave){const p=ENEMIES[kind],scale=s.dungeon?1+(s.dungeon.difficulty-1)*.65+(wave-1)*.18:s.mode==='endless'?1+(wave-1)*.17+Math.max(0,wave-20)*.06:(1+(s.stage-1)*.18+(wave-1)*.14)*(1+Math.max(0,s.stage-5)*.12);return {...p,hp:p.hp*scale*(regionFor(s)==='moon'?.72:1),speed:p.speed*(regionFor(s)==='moon'?.85:1)};}
function spawn(s,q){
  const p=enemyStats(q.kind,s);
  s.enemies.push({id:s.nextId++,kind:q.kind,route:regionFor(s)==='moon'?(q.route||0):0,hp:p.hp,maxHp:p.hp,speed:p.speed,armor:p.armor,reward:p.reward,leak:p.leak,distance:0,air:!!p.air,slow:1,slowUntil:0});
  event(s,q.kind==='boss'?'boss-enter':'spawn',{kind:q.kind});
}
function hit(s,shot){
  const target=s.enemies.find(e=>e.id===shot.targetId&&e.hp>0);
  if(!target)return;const p=pointAt(target.distance,s,target.route);
  if(shot.zoneRadius){s.zones??=[];s.zones=s.zones.filter(z=>z.owner!==shot.towerId);s.zones.push({owner:shot.towerId,x:p.x,y:p.y,radius:shot.zoneRadius,damage:shot.zoneDamage,slow:shot.zoneSlow,born:s.time,until:s.time+shot.zoneDuration});event(s,'zone',{...p,radius:shot.zoneRadius});}
  if(shot.cone)event(s,'cone',{from:shot.from,aim:p,range:shot.range,angle:shot.cone});
  const victims=shot.cone?s.enemies.filter(e=>e.hp>0&&(!e.air||shot.air)&&inCone(shot.from,p,pointAt(e.distance,s,e.route),shot.range,shot.cone)):shot.splash?s.enemies.filter(e=>e.hp>0&&(!e.air||shot.hero||shot.air)&&Math.hypot(pointAt(e.distance,s,e.route).x-p.x,pointAt(e.distance,s,e.route).y-p.y)<=shot.splash):[target];
  if(shot.bounces&&!shot.splash){let last=target;for(let i=0;i<shot.bounces;i++){const at=pointAt(last.distance,s,last.route),next=s.enemies.filter(e=>e.hp>0&&!victims.includes(e)&&Math.hypot(pointAt(e.distance,s,e.route).x-at.x,pointAt(e.distance,s,e.route).y-at.y)<=(shot.chainRange||75)&&(!e.air||shot.air)).sort((a,b)=>Math.abs(a.distance-last.distance)-Math.abs(b.distance-last.distance)||a.id-b.id)[0];if(!next)break;victims.push(next);last=next;}}
  for(const e of victims){
    if(shot.bounces&&victims.indexOf(e)>0){const previous=victims[victims.indexOf(e)-1];event(s,'chain',{from:pointAt(previous.distance,s,previous.route),to:pointAt(e.distance,s,e.route),kind:shot.kind});}
    const armor=Math.max(0,Math.min(.75,e.armor+(e.wardUntil>s.time?.25:0))-(e.shredUntil>s.time?e.shred:0));
    let damage=shot.damage*(e.air?(shot.airBonus||1):1)*(e.slowUntil>s.time?1+(s.buffs.shatter||0)*.12:1)*(shot.pierce?1:1-armor)*(shot.bounces?Math.pow(.8,victims.indexOf(e)):1);
    if(shot.hero&&s.hero?.talents?.ultimate==='resolve'&&e.kind==='boss')damage*=1.25;
    if(!shot.hero&&e.dreamUntil>s.time){damage+=s.hero?.specialization==='mark'?20:12;e.dreamUntil=0;}
    if(e.markUntil>s.time)damage*=e.mark;
    const actual=Math.min(e.hp,damage);e.hp-=damage;
    if(s.hero?.role==='memory'&&!shot.hero)s.hero.echo=Math.min(s.hero.specialization==='deep'?260:180,s.hero.echo+actual*.25);
    if(s.hero?.role==='dream'&&shot.hero)e.dreamUntil=s.time+4;
    if(shot.slow){e.slow=Math.min(e.slow,shot.slow);e.slowUntil=Math.max(e.slowUntil,s.time+(shot.slowDuration||2));}
    if(shot.root&&!(e.rootImmuneUntil>s.time)){const duration=shot.root*(e.kind==='boss'?.35:1);e.rootUntil=s.time+duration;e.rootImmuneUntil=s.time+duration+1;}
    if(shot.poison)addDamageStack(e,shot,s.time);
    if(shot.mark){e.mark=shot.mark;e.markUntil=s.time+4;}
    if(shot.shred){e.shred=Math.max(e.shred||0,shot.shred);e.shredUntil=s.time+3;}
    event(s,'hit',{enemyId:e.id,damage,critical:!!shot.critical,splash:shot.splash||0,x:pointAt(e.distance,s,e.route).x,y:pointAt(e.distance,s,e.route).y,kind:shot.kind});
  }
}
function tick(s,dt){
  s.time+=dt;s.events=s.events.filter(e=>s.time-e.time<2.5);
  if(s.phase!=='battle')return;
  while(s.queue.length&&s.queue[0].at<=s.time)spawn(s,s.queue.shift());
  tickZones(s,dt,pointAt);tickBlocking(s,dt,routePads(s),towerStats,pointAt,(data)=>event(s,'block',data));
  for(const e of s.enemies){
    if(e.slowUntil<=s.time)e.slow=1;
    if(e.wardUntil&&e.wardUntil<=s.time){event(s,'shield-break',{enemyId:e.id,...pointAt(e.distance,s,e.route)});e.wardUntil=0;}
    tickDamageStacks(e,s.time,dt);
    if(e.hp<=0)continue;
    if(e.kind==='boss'){
      e.nextSkill??=s.time+5;
      if(e.castUntil&&s.time>=e.castUntil){
        const p=pointAt(e.distance,s,e.route);
        for(const ally of s.enemies)if(ally.hp>0&&Math.hypot(pointAt(ally.distance,s,ally.route).x-p.x,pointAt(ally.distance,s,ally.route).y-p.y)<=100)ally.wardUntil=s.time+3;
        event(s,'boss-ward',{enemyId:e.id,...p});e.castUntil=0;e.nextSkill=s.time+8;
      }else if(!e.castUntil&&s.time>=e.nextSkill){
        e.castUntil=s.time+1.2;event(s,'boss-warning',{enemyId:e.id,...pointAt(e.distance,s,e.route)});
      }
    }
    if(!(e.rootUntil>s.time)&&!(e.blockedUntil>s.time)&&!e.castUntil)e.distance+=e.speed*e.slow*dt;
  }
  for(const e of s.enemies.filter(e=>e.distance>=(routeLength(s,e.route)||PATH_LENGTH)&&e.hp>0)){const absorbed=Math.min(s.shield,e.leak);s.shield-=absorbed;s.hp=Math.max(0,s.hp-e.leak+absorbed);s.leaks??={};s.leaks[e.kind]=(s.leaks[e.kind]||0)+1;event(s,'leak',{enemyId:e.id,amount:e.leak-absorbed,absorbed});if(s.hp===0&&s.hero?.talents?.ultimate==='guardian'&&!s.hero.guardianUsed){s.hero.guardianUsed=true;s.hp=1;event(s,'hero-rescue',{role:s.hero.role});}}
  s.enemies=s.enemies.filter(e=>e.distance<(routeLength(s,e.route)||PATH_LENGTH));
  if(s.hp===0){s.phase='defeat';s.pending=[];s.shots=[];s.queue=[];event(s,'defeat');return;}
  // Release after the actual anticipation period, only while the tower still exists.
  for(const a of s.pending.filter(a=>a.releaseAt<=s.time)){
    const tower=a.hero?s.hero:s.towers.find(t=>t.id===a.towerId),target=s.enemies.find(e=>e.id===a.targetId&&e.hp>0);
    if(tower&&target){const shot={...a,from:a.hero?{x:tower.x,y:tower.y}:{...routePads(s)[tower.pad]},born:s.time,arriveAt:s.time+.28};s.shots.push(shot);event(s,'release',{pad:tower.pad,hero:!!a.hero,role:tower.role,targetId:target.id});}
  }
  s.pending=s.pending.filter(a=>a.releaseAt>s.time);
  for(const shot of s.shots.filter(p=>p.arriveAt<=s.time))hit(s,shot);
  s.shots=s.shots.filter(p=>p.arriveAt>s.time);
  // Award each defeated enemy exactly once, even on simultaneous splash impacts.
  for(const e of s.enemies.filter(e=>e.hp<=0)){s.gold+=e.reward;s.kills++;if(s.hero?.role==='luck'&&s.kills%5===0)s.gold+=s.hero.specialization==='fortune'?12:8;event(s,'defeat-enemy',{enemyId:e.id,...pointAt(e.distance,s,e.route),kind:e.kind});}
  s.enemies=s.enemies.filter(e=>e.hp>0);
  for(const t of s.towers){
    if(t.ready>s.time)continue;const role=towerStats(t,s);if(role.income)continue;const pos=routePads(s)[t.pad];
    const target=s.enemies.filter(e=>{const distance=Math.hypot(pointAt(e.distance,s,e.route).x-pos.x,pointAt(e.distance,s,e.route).y-pos.y);return distance<=role.range&&distance>=(role.minRange||0)&&(!e.air||role.air);}).sort((a,b)=>(role.air?Number(!!b.air)-Number(!!a.air):0)||(t.priority==='strong'?b.hp-a.hp:t.priority==='armor'?b.armor-a.armor:0)||b.distance-a.distance||a.id-b.id)[0];
    if(!target)continue;
    const supporters=s.towers.filter(other=>other.id!==t.id&&Math.hypot(routePads(s)[other.pad].x-pos.x,routePads(s)[other.pad].y-pos.y)<=155).map(other=>towerStats(other,s));
    const heroSupport=supportFor(s,t,routePads(s));
    const buff=Math.max(1,...supporters.map(r=>r.aura))*heroSupport.damage,haste=Math.min(1,...supporters.map(r=>r.haste))*heroSupport.interval;
    t.attacks++;t.ready=s.time+role.interval*haste;
    const crit=(role.crit&&t.attacks%role.crit===0)||t.luckyCharges>0;if(t.luckyCharges>0)t.luckyCharges--;
    const damage=role.damage*buff*(crit?2:1);
    s.pending.push({id:s.nextId++,towerId:t.id,targetId:target.id,releaseAt:s.time+.22,damage,critical:!!crit,kind:role.kind,cone:role.cone||0,range:role.range,air:!!role.air,airBonus:role.airBonus||1,chainRange:role.chainRange||75,zoneRadius:role.zoneRadius||0,zoneDuration:role.zoneDuration||0,zoneDamage:(role.zoneDamage||0)*(role.damage/(UNITS[t.role]?.damage||role.damage))*buff,zoneSlow:role.zoneSlow||1,splash:role.splash||0,bounces:role.bounces||0,pierce:!!role.pierce,slow:role.slow||0,shred:role.shred||0,poison:role.poison||0,mark:role.mark||0,slowDuration:role.slowDuration,root:role.rootEvery&&t.attacks%role.rootEvery===0?role.rootDuration:0});
    event(s,'anticipate',{pad:t.pad,role:t.role,targetId:target.id});
  }
  if(s.hero&&s.hero.ready<=s.time){
    const h=s.hero,r=ROLES[h.role],target=s.enemies.filter(e=>e.hp>0).sort((a,b)=>b.distance-a.distance)[0];
    if(target){h.attacks++;h.ready=s.time+r.interval*(h.talents.passive==='reach'?.9:1)*Math.pow(.94,Math.min(8,s.buffs.command||0));h.focus=h.focusId===target.id?Math.min(3,h.focus+1):0;h.focusId=target.id;
      const multiplier=h.role==='night'?1+h.focus*(h.specialization==='focus'?.15:.1):h.role==='hope'&&(target.armor>0||target.kind==='boss')?(h.specialization==='breaker'?1.35:1.2):1;
      s.pending.push({id:s.nextId++,hero:true,targetId:target.id,releaseAt:s.time+.22,damage:r.damage*multiplier*(h.talents.passive==='focus'?1.15:1),kind:r.kind,splash:r.splash||0,pierce:!!r.pierce,slow:r.slow||0});event(s,'anticipate',{hero:true,role:h.role,targetId:target.id});}
  }
  if(!s.queue.length&&!s.enemies.length){
    s.pending=[];s.shots=[];s.zones=[];const income=Math.min(36,s.towers.reduce((n,t)=>n+(towerStats(t,s).income||0),0));s.gold+=45+income;if(income)event(s,'supply',{amount:income});s.hp=Math.min(s.maxHp,s.hp+s.towers.reduce((n,t)=>n+towerStats(t,s).heal,0)+(s.hero?.role==='healing'?(s.hero.specialization==='restore'?2:1):0));
    s.phase=(s.mode==='campaign'&&s.wave>=s.maxWaves)||(s.army&&s.mode==='endless'&&s.wave>=99)?'victory':'intermission';if(s.phase==='intermission'&&s.wave%2===0){const choices=Object.keys(BLESSINGS),shift=(Math.floor(s.wave/2)-1)%choices.length;s.blessingChoices=Array.from({length:3},(_,i)=>choices[(shift+i)%choices.length]);}event(s,s.phase,{wave:s.wave});
  }
}
export function advance(s,seconds){
  if(!Number.isFinite(seconds)||seconds<0)throw Error('無效時間');
  if(s.paused||['victory','defeat'].includes(s.phase))return;
  // Fixed steps keep results independent of screen refresh. Background resume is capped.
  s.remainder+=Math.min(seconds,.25);
  while(s.remainder+1e-9>=1/60){s.remainder-=1/60;tick(s,1/60);if(['victory','defeat'].includes(s.phase)){s.remainder=0;break;}}
}
export function newProfile(){return {version:1,unlockedStage:1,bestEndless:0,settings:{sound:true,reducedMotion:false},formation:[]};}
export function validateProfile(value){
  if(!value||value.version!==1||!Number.isInteger(value.unlockedStage)||value.unlockedStage<1||value.unlockedStage>30||!Number.isInteger(value.bestEndless)||value.bestEndless<0||value.bestEndless>100000)throw Error('存檔格式不正確');
  if(!value.settings||typeof value.settings.sound!=='boolean'||typeof value.settings.reducedMotion!=='boolean'||!Array.isArray(value.formation)||value.formation.length>9)throw Error('存檔設定不正確');
  const pads=new Set(),roles=new Set();
  const formation=value.formation.map(t=>{if(!t||!Number.isInteger(t.pad)||!PADS[t.pad]||!Object.hasOwn(ROLES,t.role)||pads.has(t.pad)||roles.has(t.role))throw Error('隊伍存檔不正確');pads.add(t.pad);roles.add(t.role);return {pad:t.pad,role:t.role};});
  return {version:1,unlockedStage:value.unlockedStage,bestEndless:value.bestEndless,settings:{sound:value.settings.sound,reducedMotion:value.settings.reducedMotion},formation};
}
export function recordResult(profile,s){
  const p=validateProfile(profile);
  if(s.mode==='campaign'&&s.phase==='victory')p.unlockedStage=Math.min(30,Math.max(p.unlockedStage,s.stage+1));
  if(s.mode==='endless')p.bestEndless=Math.max(p.bestEndless,s.wave-(s.phase==='battle'||s.phase==='defeat'?1:0));
  // Legacy profile formation contains IP roles, never persist troop IDs there.
  if(!s.army)p.formation=s.towers.map(t=>({pad:t.pad,role:t.role}));return p;
}
