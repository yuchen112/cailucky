import {unitMotion} from './troop-animation.mjs?v=20261005-growth1';
// Pure presentation functions: never advance combat or award resources.
export const TROOP_MOTION={scout:'ranged',warden:'heavy',storm:'magic',bramble:'magic',artisan:'magic',archer:'ranged',cannon:'heavy',frost:'magic',firefly:'ranged',crystal:'heavy',chime:'magic',blossom:'magic',clockwork:'heavy',alchemist:'ranged',vine:'magic',oracle:'magic',dragon:'heavy'};
export const EFFECT_ART=['anim-impact','anim-shatter','anim-rise','anim-dissolve'];
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function attackPhase(s,{hero=false,pad=null}){
 const e=s.events.findLast(e=>['anticipate','release','hero-skill'].includes(e.type)&&(e.type==='hero-skill'?hero:!!e.hero===hero&&(hero||e.pad===pad)));
 if(!e)return {phase:'idle',progress:0};const age=s.time-e.time;
 if(age<0)return {phase:'idle',progress:0};
 if(e.type==='anticipate'&&age<.22)return {phase:'windup',progress:clamp(age/.22),event:e};
 const duration=e.type==='hero-skill'?.6:.34;
 if(e.type!=='anticipate'&&age<duration)return {phase:age<duration*.48?'release':'recover',progress:clamp(age/duration),event:e};
 return {phase:'idle',progress:0};
}
export function troopPose(s,t,reduced=false){
 let a=attackPhase(s,{pad:t.pad});
 if(a.phase==='idle'&&['artisan','warden'].includes(t.role)){const e=s.events.findLast(e=>t.role==='artisan'?e.type==='supply':e.type==='block'&&e.pad===t.pad);const age=e?s.time-e.time:99;if(age>=0&&age<.34)a={phase:age<.16?'release':'recover',progress:age/.34,event:e};}
 if(reduced)return {...a,x:0,y:0,angle:0,sx:1,sy:1};
 return {...a,...unitMotion(a,t,s.time)};
}
export function enemyPose(s,e,reduced=false){
 const hit=s.events.findLast(v=>v.type==='hit'&&v.enemyId===e.id),age=hit?s.time-hit.time:99,stopped=e.rootUntil>s.time||e.blockedUntil>s.time||e.castUntil>s.time;
 const walk=Math.sin(e.distance*.14),reaction=age>=0&&age<.18?Math.sin(age/.18*Math.PI):0;
 return {x:reduced?0:-reaction*2,y:e.air?(reduced?-7:-7+Math.sin(s.time*4+e.id)*2):reduced||stopped?0:-Math.abs(walk)*(e.kind==='runner'?2:1),angle:reduced?0:reaction*.04,step:!e.air&&!reduced&&!stopped&&Math.floor(e.distance/8)%2===1,hit:reaction,casting:e.castUntil>s.time};
}
export function heroPose(s,reduced=false){const a=attackPhase(s,{hero:true}),id=s.hero.role;return {...a,art:s.phase==='victory'?id+'-victory':a.phase==='windup'?id+'-ready':['release','recover'].includes(a.phase)?id+'-cast':id,scale:reduced?1:a.phase==='windup'?.97:a.phase==='release'?1.06:1};}
export function activeEffects(s,{reduced=false,simple=false}={}){
 const budget=reduced?12:simple?24:64;
 return s.events.filter(e=>s.time>=e.time&&s.time-e.time<({hit:.45,'defeat-enemy':.65,upgrade:.95,deploy:.55,sell:.5,'shield-break':.65,'boss-ward':.65,'hero-skill':.9,'boss-warning':1.2}[e.type]||0)).slice(-budget);
}
export function previousAppearance(t,e){return e?.before&&e.pad===t.pad?e.before:t;}
export function skillRecipients(s,e,pads,corePoint={x:200,y:550}){if(['growth','joy','trust','luck'].includes(e.role))return s.towers.map(t=>pads[t.pad]);if(e.role==='healing')return [corePoint];return [{x:e.x,y:e.y}];}
