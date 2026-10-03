// Pure presentation functions: never advance combat or award resources.
export const TROOP_MOTION={archer:'ranged',cannon:'heavy',frost:'magic',firefly:'ranged',crystal:'heavy',chime:'magic',blossom:'magic',clockwork:'heavy',alchemist:'ranged',vine:'magic',oracle:'magic',dragon:'heavy'};
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
 const a=attackPhase(s,{pad:t.pad}),style=TROOP_MOTION[t.role]||'magic';
 if(reduced)return {...a,x:0,y:0,angle:0,sx:1,sy:1};
 const p=a.progress,heavy=style==='heavy',pulse=Math.sin(Math.PI*p);
 if(a.phase==='windup')return {...a,x:-(heavy?2:1)*p,y:0,angle:-(heavy?.035:.025)*p,sx:1,sy:1-.025*p};
 if(a.phase==='release'||a.phase==='recover')return {...a,x:(heavy?-3:2)*pulse,y:style==='magic'?-1.5*pulse:0,angle:(heavy?-.035:.035)*pulse,sx:1,sy:1+.018*pulse};
 return {...a,x:0,y:0,angle:0,sx:1,sy:1+Math.sin(s.time*2+(t.pad||0))*.006};
}
export function enemyPose(s,e,reduced=false){
 const hit=s.events.findLast(v=>v.type==='hit'&&v.enemyId===e.id),age=hit?s.time-hit.time:99,stopped=e.rootUntil>s.time||e.castUntil>s.time;
 const walk=Math.sin(e.distance*.14),reaction=age>=0&&age<.18?Math.sin(age/.18*Math.PI):0;
 return {x:reduced?0:-reaction*2,y:reduced||stopped?0:-Math.abs(walk)*(e.kind==='runner'?2:1),angle:reduced?0:reaction*.04,step:!reduced&&!stopped&&Math.floor(e.distance/8)%2===1,hit:reaction,casting:e.castUntil>s.time};
}
export function heroPose(s,reduced=false){const a=attackPhase(s,{hero:true}),id=s.hero.role;return {...a,art:s.phase==='victory'?id+'-victory':a.phase==='windup'?id+'-ready':['release','recover'].includes(a.phase)?id+'-cast':id,scale:reduced?1:a.phase==='windup'?.97:a.phase==='release'?1.06:1};}
export function activeEffects(s,{reduced=false,simple=false}={}){
 const budget=reduced?12:simple?24:64;
 return s.events.filter(e=>s.time>=e.time&&s.time-e.time<({hit:.45,'defeat-enemy':.65,upgrade:.95,deploy:.55,sell:.5,'shield-break':.65,'boss-ward':.65,'hero-skill':.9,'boss-warning':1.2}[e.type]||0)).slice(-budget);
}
export function previousAppearance(t,e){return e?.before&&e.pad===t.pad?e.before:t;}
export function skillRecipients(s,e,pads){if(['growth','joy','trust','luck'].includes(e.role))return s.towers.map(t=>pads[t.pad]);if(e.role==='healing')return [{x:200,y:550}];return [{x:e.x,y:e.y}];}
