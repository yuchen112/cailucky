import {BY_ID,STAGES} from './cast.mjs?v=20261007-duel6';
export const WIDTH=1400,FLOOR=594,DT=1/60;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function random(seed){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296}};
function fighter(id,index){const c=BY_ID[id];return{id,index,x:index?1000:400,y:FLOOR,vx:0,vy:0,facing:index?-1:1,hp:c.hp,maxHp:c.hp,meter:0,guard:100,shield:0,shieldTime:0,recoverable:0,healUses:0,action:null,buffer:null,stun:0,knock:0,invuln:0,cooldown:0,slow:0,combo:0,comboTime:0,held:{},dash:0,lastTap:{},hits:0,blocked:0,damage:0,lastMove:'',poseTime:0};}
export function createMatch(options={}){const mode=options.mode||'free';return{version:1,mode,stage:options.stage||'festival',difficulty:options.difficulty||'normal',fighters:[fighter(options.p1||'growth',0),fighter(options.p2||'luck',1)],time:60,clock:0,phase:'intro',intro:1.5,round:1,wins:[0,0],target:mode==='survival'?1:2,projectiles:[],zones:[],events:[],nextId:0,hitstop:0,rng:random(options.seed??Date.now()),aiWait:.5,aiMove:0,result:null,lastResult:null,roundEnded:false,dummy:options.dummy||'stand',bestCombo:[0,0],training:{damage:0,maxCombo:0,hits:0},options:{...options},flash:0};}
function emit(m,type,data={}){m.events.push({type,at:m.clock,id:++m.nextId,...data});if(m.events.length>80)m.events.splice(0,m.events.length-80);}
export function setHeld(m,index,action,value){const f=m.fighters[index];if(f)f.held[action]=!!value;}
export function command(m,index,action){const f=m.fighters[index];if(!f||m.phase!=='fight')return false;
 if(action==='dashLeft'||action==='dashRight'){if(f.stun||f.knock||f.action||f.y<FLOOR)return false;f.dash=.16;f.vx=action==='dashLeft'?-BY_ID[f.id].speed*2.15:BY_ID[f.id].speed*2.15;emit(m,'dash',{fighter:index});return true;}
 if(action==='jump'){if(f.y<FLOOR||f.stun||f.knock||f.action)return false;f.vy=-810;emit(m,'jump',{fighter:index});return true;}
 if(!['light','heavy','skill','super','throw'].includes(action))return false;
 if(action==='throw'&&f.action&&['light','heavy'].includes(f.action.key)&&f.action.t<.08&&!f.action.fired){f.action=null;return begin(m,f,'throw');}
 if(f.stun||f.knock||f.action){f.buffer={action,until:m.clock+.12};return false;}
 return begin(m,f,action);
}
function spec(f,key){const air=f.y<FLOOR-8,c=BY_ID[f.id];let s={key,start:.1,active:.1,end:.19,damage:62,reach:118,height:air?'overhead':'mid',knock:12,stun:.22,air,armor:false};
 if(key==='heavy')Object.assign(s,{start:.27,active:.13,end:.38,damage:112,reach:168,knock:65,stun:.34});
 if(key==='throw')Object.assign(s,{start:.14,active:.05,end:.4,damage:145,reach:90,height:'throw',knock:95,stun:.65});
 if(key==='skill')Object.assign(s,{start:.22,active:.14,end:.34,damage:110,reach:164,knock:50,stun:.3});
 if(key==='super')Object.assign(s,{start:.28,active:.25,end:.6,damage:295,reach:260,knock:115,stun:.8});
 if(f.id==='trust'){s.damage*=1.1;s.start+=.04;s.reach+=12;}if(f.id==='joy'){s.start*=.8;s.damage*=.92;}if(f.id==='luck'){s.start*=.85;s.reach-=12;}if(f.id==='hope'||f.id==='growth')s.reach+=20;
 if(key==='skill'){
  if(f.id==='joy')s.rush=440;
  if(f.id==='dream')Object.assign(s,{projectile:true,damage:95,reach:0});
  if(f.id==='night')Object.assign(s,{counter:true,start:0,active:.5,end:.28,damage:125});
  if(f.id==='sadness')Object.assign(s,{zone:'rain',damage:75,reach:0});
  if(f.id==='trust')Object.assign(s,{armor:true,start:.42,damage:170,reach:188,knock:85});
  if(f.id==='memory')Object.assign(s,{echo:true,damage:74});
  if(f.id==='growth')Object.assign(s,{antiAir:true,reach:178,damage:125});
  if(f.id==='healing')Object.assign(s,{shield:true,damage:0,reach:0});
  if(f.id==='luck')Object.assign(s,{rush:670,height:'low',damage:100,start:.12});
  if(f.id==='hope')Object.assign(s,{zone:'light',damage:90,reach:0});
 }
 if(key==='super'){
  if(f.id==='dream'||f.id==='hope')Object.assign(s,{projectile:true,damage:290,reach:0});
  if(f.id==='sadness')Object.assign(s,{zone:'rain',damage:285,reach:0});
  if(f.id==='night')s.reach=360;
  if(f.id==='joy'||f.id==='luck')s.rush=650;
  if(f.id==='healing')Object.assign(s,{height:'throw',reach:135});
  if(f.id==='trust')s.armor=true;
  if(f.id==='growth')s.antiAir=true;
  if(f.id==='memory')s.echo=true;
 }
 return s;
}
function begin(m,f,key){if(f.y<FLOOR&&['throw','skill','super'].includes(key))return false;if(key==='skill'&&f.cooldown>0)return false;if(key==='super'&&f.meter<100)return false;if(key==='super'){f.meter=0;m.flash=.4;emit(m,'super',{fighter:f.index,name:BY_ID[f.id].superName});}if(key==='skill')f.cooldown=f.id==='healing'?4:2.5;f.dash=0;f.action={...spec(f,key),t:0,fired:false,hit:false};f.lastMove=key;f.held.guard=false;emit(m,'attack',{fighter:f.index,key});return true;}
function damage(m,attacker,target,specification){if(target.invuln>0||target.hp<=0)return false;const spec=specification;
 const sameHeight=Math.abs(target.y-attacker.y)<(spec.antiAir?290:145);if(!sameHeight&&spec.height!=='projectile')return false;
 const counter=target.action?.counter&&target.action.t<=target.action.active;
 if(counter&&spec.height!=='throw'){const amount=Math.min(125,attacker.hp);target.action=null;target.invuln=.3;attacker.action=null;attacker.stun=.55;attacker.hp-=amount;attacker.recoverable=clamp(attacker.recoverable+amount*.55,0,attacker.maxHp-attacker.hp);target.damage+=amount;target.hits++;target.combo++;target.comboTime=.85;m.bestCombo[target.index]=Math.max(m.bestCombo[target.index],target.combo);target.meter=clamp(target.meter+16,0,100);m.training.damage+=amount;m.training.hits++;m.training.maxCombo=Math.max(m.training.maxCombo,target.combo);emit(m,'counter',{fighter:target.index,target:attacker.index,damage:amount,x:attacker.x,y:attacker.y-150});m.hitstop=.08;return true;}
 const front=(attacker.x-target.x)*target.facing>0,ground=target.y>=FLOOR-1;
 const blocked=target.held.guard&&front&&ground&&!target.stun&&!target.knock&&!target.action&&(spec.height==='mid'||spec.height==='projectile'||spec.height==='low'&&target.held.down||spec.height==='overhead'&&!target.held.down);
 if(blocked){target.guard=Math.max(0,target.guard-(spec.key==='super'?50:spec.key==='heavy'?28:14));target.hp=Math.max(1,target.hp-(spec.key==='super'?24:0));target.stun=.16;target.vx=attacker.facing*70;target.blocked++;target.meter=clamp(target.meter+5,0,100);attacker.meter=clamp(attacker.meter+5,0,100);emit(m,'block',{fighter:target.index,x:target.x,y:target.y-115});if(target.guard===0){target.stun=1.05;target.held.guard=false;target.guard=30;emit(m,'break',{fighter:target.index});}m.hitstop=.035;return true;}
 const scale=Math.max(.4,1-attacker.combo*.12);let amount=Math.round(spec.damage*scale*(target.action?.armor ? .6 : 1));if(spec.antiAir&&target.y<FLOOR-20)amount=Math.round(amount*1.2);const absorbed=Math.min(target.shield,amount);target.shield-=absorbed;amount-=absorbed;
 target.hp=Math.max(0,target.hp-amount);target.recoverable=clamp(target.recoverable+amount*.55,0,target.maxHp-target.hp);attacker.damage+=amount;attacker.hits++;attacker.combo++;attacker.comboTime=.85;attacker.meter=clamp(attacker.meter+8+amount*.045,0,100);target.meter=clamp(target.meter+amount*.05,0,100);
 if(!target.action?.armor){target.action=null;target.stun=spec.stun;target.vx=attacker.facing*(spec.knock||20)*5;target.knock=spec.stun>=.6?.55:0;}
 const hitCombo=attacker.combo;m.bestCombo[attacker.index]=Math.max(m.bestCombo[attacker.index],hitCombo);if(hitCombo>=5){target.invuln=.55;target.knock=.55;target.stun=.55;target.vx=attacker.facing*400;attacker.combo=0;}
 if(spec.slow)target.slow=1.5;
 m.training.damage+=amount;m.training.hits++;m.training.maxCombo=Math.max(m.training.maxCombo,hitCombo);m.hitstop=spec.key==='super'?.12:.055;
 emit(m,amount?'hit':'shield',{fighter:attacker.index,target:target.index,damage:amount,combo:hitCombo,x:target.x,y:target.y-150,color:BY_ID[attacker.id].color});return true;
}
function fire(m,f,a){const target=m.fighters[1-f.index],superMove=a.key==='super';a.fired=true;
 if(a.shield){f.shield=Math.min(150,f.shield+90);f.shieldTime=3;if(f.healUses<2&&f.recoverable>0){const healed=Math.min(60,f.recoverable,f.maxHp-f.hp);f.hp+=healed;f.recoverable-=healed;f.healUses++;emit(m,'heal',{fighter:f.index,damage:healed,x:f.x,y:f.y-160});}emit(m,'shield',{fighter:f.index,x:f.x,y:f.y-150});return;}
 if(a.projectile){m.projectiles.push({id:++m.nextId,owner:f.index,x:f.x+f.facing*65,y:f.y-100,vx:f.facing*(superMove?930:640),life:2,radius:superMove?46:20,spec:{...a,height:'projectile'},color:BY_ID[f.id].color});return;}
 if(a.zone){m.zones.push({id:++m.nextId,owner:f.index,x:clamp(f.x+f.facing*(superMove?220:180),80,WIDTH-80),delay:superMove?.2:.4,life:superMove?.65:.9,radius:superMove?220:100,spec:{...a,height:'mid',slow:true},hit:false});return;}
 if(a.echo)m.zones.push({id:++m.nextId,owner:f.index,x:clamp(f.x+f.facing*120,80,WIDTH-80),delay:.55,life:.3,radius:superMove?170:115,spec:{...a,damage:superMove?80:60,height:'mid'},hit:false});
 if(a.counter)return;
}
function tickFighter(m,f,dt){const c=BY_ID[f.id],other=m.fighters[1-f.index];f.poseTime+=dt;
 for(const k of ['stun','knock','invuln','cooldown','slow','dash','shieldTime','comboTime'])f[k]=Math.max(0,f[k]-dt);if(!f.shieldTime)f.shield=0;if(!f.comboTime)f.combo=0;
 if(!f.held.guard&&!f.stun)f.guard=clamp(f.guard+18*dt,0,100);
 if(f.buffer&&f.buffer.until<m.clock)f.buffer=null;
 if(!f.action&&!f.stun&&!f.knock&&f.buffer){const b=f.buffer;f.buffer=null;begin(m,f,b.action);}
 const canMove=!f.action&&!f.stun&&!f.knock&&f.y>=FLOOR-1;
 if(canMove&&!f.dash){const direction=(f.held.right?1:0)-(f.held.left?1:0);f.vx=f.held.guard||f.held.down?0:direction*c.speed*(f.slow ? .55 : 1);}
 if(f.action){const a=f.action;a.t+=dt;if(a.rush&&a.t>=a.start&&a.t<a.start+a.active&&!a.hit)f.vx=f.facing*a.rush;else if(f.y>=FLOOR)f.vx*=Math.exp(-dt*18);
  if(!a.fired&&a.t>=a.start)fire(m,f,a);
  if(a.t>=a.start&&a.t<=a.start+a.active&&!a.hit&&!a.projectile&&!a.zone&&!a.counter&&!a.shield){const range=Math.abs(other.x-f.x),inFront=(other.x-f.x)*f.facing>=-20;if(range<a.reach&&inFront&&!(a.height==='throw'&&other.y<FLOOR-12))a.hit=damage(m,f,other,a);}
  if(a.hit&&f.buffer&&a.key==='light'&&a.t>=a.start+a.active){const b=f.buffer;f.buffer=null;f.action=null;begin(m,f,b.action);}
  else if(a.t>=a.start+a.active+a.end)f.action=null;
 }
 f.x=clamp(f.x+f.vx*dt,75,WIDTH-75);if(f.stun||f.knock)f.vx*=Math.exp(-dt*7);
 f.vy+=2250*dt;f.y=Math.min(FLOOR,f.y+f.vy*dt);if(f.y===FLOOR)f.vy=0;
 if(!f.action&&!f.stun&&!f.knock)f.facing=other.x>=f.x?1:-1;
}
function ai(m,dt){const f=m.fighters[1],p=m.fighters[0];if(m.mode==='local')return;if(m.mode==='training'){f.held={guard:m.dummy==='guard',down:m.dummy==='guard'&&p.action?.height==='low'};if(m.dummy!=='counter')return;}
 m.aiWait-=dt;if(m.aiWait>0)return;const d=m.difficulty==='easy'?0:m.difficulty==='hard'?2:1;const reaction=[.36,.2,.12][d];m.aiWait=reaction+m.rng()*.12;const distance=Math.abs(p.x-f.x),incoming=p.action&&distance<250||m.projectiles.some(b=>b.owner===0&&Math.abs(b.x-f.x)<380),r=m.rng();
 f.held={};if(incoming&&r<[.2,.55,.78][d]){f.held.guard=true;f.held.down=p.action?.height==='low';if(f.id==='night'&&f.cooldown===0&&r<.35)command(m,1,'skill');return;}
 const ranged=['dream','hope','sadness'].includes(f.id);const desired=ranged?270:125;
 if(distance>desired+35){f.held.left=p.x<f.x;f.held.right=p.x>f.x;}else if(distance<75&&ranged&&r<.55){f.held.right=p.x<f.x;f.held.left=p.x>f.x;}
 if(f.meter>=100&&distance<350&&r<.45)command(m,1,'super');else if(f.cooldown===0&&(distance<230||ranged)&&r<.34)command(m,1,'skill');else if(distance<95&&p.held.guard&&r<.35)command(m,1,'throw');else if(distance<180)command(m,1,r<.65?'light':'heavy');else if(r<[.08,.14,.2][d])command(m,1,'jump');
}
function endRound(m){if(m.roundEnded)return;m.roundEnded=true;const[a,b]=m.fighters;const ar=a.hp/a.maxHp,br=b.hp/b.maxHp;const winner=Math.abs(ar-br)<.0001?-1:ar>br?0:1;if(winner>=0)m.wins[winner]++;m.phase='round';m.result={winner,reason:a.hp<=0||b.hp<=0?'KO':'TIME',round:m.round,matchOver:winner>=0&&m.wins[winner]>=m.target};m.lastResult={...m.result};emit(m,'round',m.result);m.projectiles=[];m.zones=[];for(const f of m.fighters){f.held={};f.buffer=null;f.action=null;f.vx=0;}}
export function nextRound(m){if(m.phase!=='round'||m.result.matchOver)return false;const ids=m.fighters.map(f=>f.id),meters=m.fighters.map(f=>f.meter*.5);m.fighters=ids.map(fighter);m.fighters.forEach((f,i)=>f.meter=meters[i]);m.round++;m.time=60;m.intro=1.4;m.phase='intro';m.roundEnded=false;m.result=null;m.hitstop=0;return true;}
export function step(m,dt=DT){if(!Number.isFinite(dt)||dt<=0||dt>.05)return;m.clock+=dt;if(m.phase==='intro'){m.intro-=dt;if(m.intro<=0){m.phase='fight';emit(m,'fight',{round:m.round});}return;}if(m.phase!=='fight')return;
 if(m.hitstop>0){m.hitstop=Math.max(0,m.hitstop-dt);return;}if(m.mode!=='training')m.time=Math.max(0,m.time-dt);m.flash=Math.max(0,m.flash-dt);ai(m,dt);
 for(const f of m.fighters)tickFighter(m,f,dt);
 const[a,b]=m.fighters;if(Math.abs(a.x-b.x)<92&&Math.abs(a.y-b.y)<120){const mid=(a.x+b.x)/2,sign=a.x<=b.x?-1:1;a.x=clamp(mid+sign*46,75,WIDTH-75);b.x=clamp(mid-sign*46,75,WIDTH-75);}
 for(const p of m.projectiles){p.x+=p.vx*dt;p.life-=dt;const target=m.fighters[1-p.owner],owner=m.fighters[p.owner];if(Math.abs(target.x-p.x)<p.radius+40&&Math.abs(target.y-100-p.y)<110){if(damage(m,owner,target,p.spec))p.life=0;}}
 m.projectiles=m.projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<WIDTH+100);
 for(const z of m.zones){z.delay-=dt;if(z.delay>0)continue;z.life-=dt;const target=m.fighters[1-z.owner];if(!z.hit&&Math.abs(target.x-z.x)<z.radius&&target.y>FLOOR-180)z.hit=damage(m,m.fighters[z.owner],target,z.spec);}
 m.zones=m.zones.filter(z=>z.delay>0||z.life>0);
 if(m.mode==='training'){for(const f of m.fighters){if(f.hp<1||f.hp<f.maxHp&&!f.stun&&!f.knock&&m.fighters[1-f.index].comboTime===0){f.hp=f.maxHp;f.recoverable=0;}f.meter=100;}return;}
 if(a.hp<=0||b.hp<=0||m.time<=0)endRound(m);
}
export function clearInputs(m){for(const f of m.fighters){f.held={};f.buffer=null;if(f.dash){f.dash=0;f.vx=0;}}}
export function snapshot(m){return{version:1,mode:m.mode,stage:m.stage,difficulty:m.difficulty,options:m.options,phase:m.phase,time:m.time,clock:m.clock,intro:m.intro,round:m.round,wins:[...m.wins],target:m.target,result:m.result,lastResult:m.lastResult,roundEnded:m.roundEnded,dummy:m.dummy,bestCombo:[...m.bestCombo],training:{...m.training},fighters:m.fighters.map(f=>({...f,held:{},buffer:null,lastTap:{}})),projectiles:m.projectiles.map(p=>({...p})),zones:m.zones.map(z=>({...z}))};}
export function restore(raw){const finite=(v,min=0,max=1e8)=>Number.isFinite(v)&&v>=min&&v<=max,validMove=a=>a===null||a&&['light','heavy','skill','super','throw'].includes(a.key)&&['t','start','active','end','damage','reach','knock','stun'].every(k=>finite(a[k]));
 if(!raw||raw.version!==1||!['story','free','survival','local','training'].includes(raw.mode)||!STAGES.some(s=>s.id===raw.stage)||!['easy','normal','hard'].includes(raw.difficulty)||!['intro','fight','round'].includes(raw.phase)||!finite(raw.clock)||!finite(raw.intro,-1,2)||!Number.isInteger(raw.round)||raw.round<1||raw.round>10000||raw.target!==(raw.mode==='survival'?1:2)||!['stand','guard','counter'].includes(raw.dummy)||!raw.training||!['damage','hits','maxCombo'].every(k=>finite(raw.training[k]))||!Array.isArray(raw.fighters)||raw.fighters.length!==2||!raw.fighters.every((f,i)=>BY_ID[f.id]&&f.index===i&&finite(f.hp,0,BY_ID[f.id].hp)&&f.maxHp===BY_ID[f.id].hp&&finite(f.x,0,WIDTH)&&finite(f.y,-2000,FLOOR)&&finite(f.meter,0,100)&&finite(f.guard,0,100)&&[1,-1].includes(f.facing)&&['vx','vy'].every(k=>finite(f[k],-10000,10000))&&['shield','shieldTime','recoverable','healUses','stun','knock','invuln','cooldown','slow','combo','comboTime','dash','hits','blocked','damage','poseTime'].every(k=>finite(f[k]))&&validMove(f.action))||!finite(raw.time,0,60)||!Array.isArray(raw.wins)||raw.wins.length!==2||raw.wins.some(n=>!Number.isInteger(n)||n<0||n>2)||!Array.isArray(raw.projectiles)||raw.projectiles.length>20||!Array.isArray(raw.zones)||raw.zones.length>20||raw.projectiles.some(p=>![0,1].includes(p.owner)||!finite(p.x,-200,1600)||!finite(p.y,-2000,788)||!finite(p.vx,-2000,2000)||!finite(p.life,0,3)||!finite(p.radius,0,100)||!validMove(p.spec))||raw.zones.some(z=>![0,1].includes(z.owner)||!finite(z.x,0,WIDTH)||!finite(z.delay,-5,2)||!finite(z.life,0,2)||!finite(z.radius,0,400)||!validMove(z.spec))||raw.phase==='round'&&(!raw.result||![-1,0,1].includes(raw.result.winner)||typeof raw.result.matchOver!=='boolean'||!['KO','TIME'].includes(raw.result.reason)))throw Error('對戰存檔格式不正確');
 const options={mode:raw.mode,p1:raw.fighters[0].id,p2:raw.fighters[1].id,stage:raw.stage,difficulty:raw.difficulty,dummy:raw.dummy};const m=createMatch(options);Object.assign(m,structuredClone(raw));m.options=options;m.bestCombo=Array.isArray(raw.bestCombo)&&raw.bestCombo.length===2&&raw.bestCombo.every(v=>Number.isInteger(v)&&v>=0&&v<=5)?[...raw.bestCombo]:[0,0];m.events=[];m.rng=random(Date.now());m.nextId=1000;m.hitstop=0;m.aiWait=.4;m.flash=0;clearInputs(m);return m;}
