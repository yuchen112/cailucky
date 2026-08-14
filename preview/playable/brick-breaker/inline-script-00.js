const shell = document.getElementById('shell');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const stageText = document.getElementById('stageText');
const menuOverlay = document.getElementById('menuOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const toast = document.getElementById('toast');
const difficultyEl = document.getElementById('difficulty');
const modeEl = document.getElementById('mode');
const themeModeEl = document.getElementById('themeMode') || {value:'dark',addEventListener(){}};
const backgroundStyleEl = document.getElementById('backgroundStyle') || {value:'heartlight',addEventListener(){}};
const brickStyleEl = document.getElementById('brickStyle') || {value:'memory',addEventListener(){}};
const paddleStyleEl = document.getElementById('paddleStyle') || {value:'character',addEventListener(){}};
let W = 0, H = 0, DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let running = false, paused = false, gameOver = false;
let last = 0, shake = 0, flash = 0;
let soundOn = true;
let pointerX = null;
const state = {score:0,stage:1,lives:3,combo:0,maxCombo:0,hits:0,mode:'stage',difficulty:'normal',theme:'dark',bgStyle:'nebula',brickStyle:'crystal',paddleStyle:'core',pierceTimer:0,laserTimer:0,paddleGrowTimer:0,basePaddleW:100,nextRowScore:0};
let paddle = null;
let balls = [];
let bricks = [];
let particles = [];
let powerups = [];
let beams = [];
let rings = [];
let stars = [];
let ornaments = [];
const DIFF = {easy:{paddle:.27,lives:5,speed:.78,drop:.08,stageSpeed:.018,rowPressure:.78},normal:{paddle:.22,lives:3,speed:.92,drop:.06,stageSpeed:.026,rowPressure:1},hard:{paddle:.18,lives:2,speed:1.09,drop:.04,stageSpeed:.038,rowPressure:1.28}};
const PALETTES = {crystal:{normal:['rgba(101,231,255,.95)','rgba(88,108,255,.72)','rgba(255,255,255,.28)'],bonus:['rgba(117,255,189,.95)','rgba(78,196,255,.68)','rgba(255,255,255,.3)'],blast:['rgba(255,107,141,.96)','rgba(255,214,107,.68)','rgba(255,255,255,.32)'],armor:['rgba(210,220,255,.86)','rgba(104,122,154,.78)','rgba(255,255,255,.28)']},metal:{normal:['rgba(150,180,210,.95)','rgba(55,72,105,.85)','rgba(255,255,255,.2)'],bonus:['rgba(82,230,170,.95)','rgba(42,110,120,.78)','rgba(255,255,255,.22)'],blast:['rgba(255,115,80,.96)','rgba(130,62,54,.8)','rgba(255,255,255,.22)'],armor:['rgba(235,238,245,.9)','rgba(86,91,104,.88)','rgba(255,255,255,.18)']},candy:{normal:['rgba(255,130,210,.95)','rgba(102,190,255,.8)','rgba(255,255,255,.32)'],bonus:['rgba(145,255,160,.95)','rgba(255,230,120,.78)','rgba(255,255,255,.34)'],blast:['rgba(255,92,120,.96)','rgba(255,190,80,.78)','rgba(255,255,255,.34)'],armor:['rgba(255,255,255,.95)','rgba(175,145,255,.74)','rgba(255,255,255,.28)']},rune:{normal:['rgba(120,210,255,.88)','rgba(42,72,108,.86)','rgba(255,244,180,.18)'],bonus:['rgba(130,255,190,.9)','rgba(40,95,70,.82)','rgba(255,244,180,.18)'],blast:['rgba(255,120,86,.94)','rgba(105,58,48,.84)','rgba(255,244,180,.18)'],armor:['rgba(190,175,145,.94)','rgba(88,75,60,.88)','rgba(255,244,180,.16)']}};
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const rand = (a,b)=>a+Math.random()*(b-a);
function applyTheme(){document.body.classList.toggle('light', state.theme === 'light')}
function readVisualOptions(){state.theme=themeModeEl.value;state.bgStyle=backgroundStyleEl.value;state.brickStyle=brickStyleEl.value;state.paddleStyle=paddleStyleEl.value;localStorage.setItem('energy_breakout_visuals',JSON.stringify({theme:state.theme,bgStyle:state.bgStyle,brickStyle:state.brickStyle,paddleStyle:state.paddleStyle}));applyTheme();makeStars();makeOrnaments()}
function loadVisualOptions(){try{const saved=JSON.parse(localStorage.getItem('energy_breakout_visuals')||'{}');if(saved.theme)themeModeEl.value=saved.theme;if(saved.bgStyle)backgroundStyleEl.value=saved.bgStyle;if(saved.brickStyle)brickStyleEl.value=saved.brickStyle;if(saved.paddleStyle)paddleStyleEl.value=saved.paddleStyle}catch(e){}readVisualOptions()}
[themeModeEl,backgroundStyleEl,brickStyleEl,paddleStyleEl].forEach(el=>el.addEventListener('change',()=>{readVisualOptions();showToast('旅團裝束已更新')}));
function resize(){const r=shell.getBoundingClientRect();W=Math.floor(r.width);H=Math.floor(r.height);DPR=Math.max(1,Math.min(2,window.devicePixelRatio||1));canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);if(paddle){paddle.y=H-Math.max(76,H*.11);state.basePaddleW=Math.max(80,W*DIFF[state.difficulty].paddle);if(state.paddleGrowTimer<=0)paddle.w=state.basePaddleW;paddle.x=clamp(paddle.x,paddle.w/2+14,W-paddle.w/2-14)}makeStars();makeOrnaments()}
window.addEventListener('resize',resize,{passive:true});
function makeStars(){const count=state.bgStyle==='city'?38:state.bgStyle==='temple'?42:state.bgStyle==='ocean'?58:74;stars=Array.from({length:count},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.25,a:Math.random()*.55+.12,s:Math.random()*18+8,drift:rand(-8,8)}))}
function makeOrnaments(){ornaments=[];if(!W||!H)return;if(state.bgStyle==='city'){const n=10;for(let i=0;i<n;i++){const w=rand(22,54),h=rand(H*.12,H*.34);ornaments.push({type:'tower',x:i*(W/n)+rand(-8,8),y:H-h,w,h,lit:Math.random()})}}else if(state.bgStyle==='temple'){for(let i=0;i<9;i++)ornaments.push({type:'rune',x:rand(30,W-30),y:rand(120,H-130),r:rand(10,28),a:rand(0,Math.PI)})}else if(state.bgStyle==='ocean'){for(let i=0;i<20;i++)ornaments.push({type:'bubble',x:rand(16,W-16),y:rand(95,H-70),r:rand(3,16),speed:rand(6,18)})}else{for(let i=0;i<12;i++)ornaments.push({type:'orb',x:rand(20,W-20),y:rand(90,H-110),r:rand(8,24),a:rand(0,6.28)})}}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1200)}
function beep(type='hit'){if(!soundOn)return;try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!beep.ctx)beep.ctx=new AudioCtx();const ac=beep.ctx,o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime,map={hit:[520,.035,'sine'],brick:[720,.055,'triangle'],power:[980,.09,'sine'],lose:[180,.18,'sawtooth'],boom:[90,.16,'square'],laser:[1260,.04,'square'],stage:[880,.16,'triangle']},[freq,dur,wave]=map[type]||map.hit;o.type=wave;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(45,freq*.55),now+dur);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.08,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+dur+.02)}catch(e){}}
function resetGame(){readVisualOptions();state.score=0;state.stage=1;state.combo=0;state.maxCombo=0;state.hits=0;state.pierceTimer=0;state.laserTimer=0;state.paddleGrowTimer=0;state.mode=modeEl.value;state.difficulty=difficultyEl.value;state.lives=DIFF[state.difficulty].lives;state.nextRowScore=1000;state.basePaddleW=Math.max(80,W*DIFF[state.difficulty].paddle);paddle={x:W/2,y:H-Math.max(76,H*.11),w:state.basePaddleW,h:16,targetX:W/2,glow:0};balls=[];const speed=350*DIFF[state.difficulty].speed;spawnBall(W/2,paddle.y-24,-Math.PI/2+rand(-.28,.28),speed,true);particles=[];powerups=[];beams=[];rings=[];makeBricks();updateHud();gameOver=false;paused=false;running=true;last=performance.now();showToast('拖曳控制心光板')}
function makeBricks(){bricks=[];const cols=7,rows=clamp(4+Math.floor(state.stage/2),4,8),gap=7,top=92,side=18,bw=(W-side*2-gap*(cols-1))/cols,bh=clamp(H*.035,24,34);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=side+c*(bw+gap),y=top+r*(bh+gap),typeRoll=Math.random();let hp=1+Math.floor(state.stage/3),type='normal';if(typeRoll<.07+state.stage*.003){type='armor';hp+=2}else if(typeRoll<.15){type='bonus';hp=1}else if(typeRoll<.22){type='blast';hp=1}if(state.mode==='endless')hp=Math.min(hp,4+Math.floor(state.stage/8));bricks.push({x,y,w:bw,h:bh,hp,maxHp:hp,type,alive:true,phase:Math.random()*Math.PI*2,vx:type==='armor'&&state.stage>3?(Math.random()<.5?-1:1)*rand(8,18):0,flash:0})}}
function compactBricks(){if(bricks.length>120)bricks=bricks.filter(b=>b.alive||b.y<H+80)}
function spawnBall(x,y,angle,speed,primary=false){const minSpeed=290,maxSpeed=680;balls.push({x,y,vx:Math.cos(angle)*clamp(speed,minSpeed,maxSpeed),vy:Math.sin(angle)*clamp(speed,minSpeed,maxSpeed),r:primary?7.4:6.4,trail:[],primary,pierceHits:0})}
function updateHud(){scoreText.textContent=state.score;stageText.textContent=state.stage+' / ❤'+state.lives}
function addScore(v){state.score+=Math.round(v);updateHud()}
function addRing(x,y,color,size=34){rings.push({x,y,color,size,life:.36,max:.36})}
function addParticles(x,y,color,count=16,power=1,dir=null){for(let i=0;i<count;i++){const a=dir==null?Math.random()*Math.PI*2:dir+rand(-.9,.9),sp=rand(55,270)*power;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.28,.72),max:rand(.28,.72),r:rand(1.2,3.8)*power,color})}}
function dropPower(x,y){const types=['multi','long','pierce','blast','slow','laser'],type=types[Math.floor(Math.random()*types.length)];powerups.push({x,y,vy:92,w:30,h:30,type,rot:0,tail:[]})}
function powerLabel(type){return {multi:'星群祝福',long:'絲帶延展',pierce:'月光穿透',blast:'花火綻放',slow:'星願緩流',laser:'雙月光束'}[type]||'祝福'}
function applyPower(type){beep('power');showToast(powerLabel(type));if(type==='multi'){const source=balls[0]||{x:paddle.x,y:paddle.y-40,vx:0,vy:-360};for(let i=-1;i<=1;i+=2){const base=Math.atan2(source.vy,source.vx);spawnBall(source.x,source.y,base+i*.42,Math.hypot(source.vx,source.vy)*.96)}}if(type==='long'){state.paddleGrowTimer=8.5;paddle.w=clamp(state.basePaddleW*1.35,80,W*.52)}if(type==='pierce'){state.pierceTimer=7.5;balls.forEach(b=>b.pierceHits=8)}if(type==='blast'){const target=bricks.find(b=>b.alive);if(target)explodeAt(target.x+target.w/2,target.y+target.h/2,86)}if(type==='slow')balls.forEach(b=>{b.vx*=.76;b.vy*=.76});if(type==='laser')state.laserTimer=5.6}
function explodeAt(x,y,rad){beep('boom');flash=Math.max(flash,.35);shake=Math.max(shake,10);addRing(x,y,'rgba(255,214,107,.95)',rad);addParticles(x,y,'rgba(255,214,107,.95)',38,1.45);for(const br of bricks){if(!br.alive)continue;const cx=br.x+br.w/2,cy=br.y+br.h/2;if(Math.hypot(cx-x,cy-y)<rad){br.hp-=2;if(br.hp<=0)destroyBrick(br,true)}}}
function destroyBrick(br,chain=false,impactDir=null){if(!br.alive)return;br.alive=false;const palette=PALETTES[state.brickStyle]||PALETTES.crystal,color=palette[br.type][0];addParticles(br.x+br.w/2,br.y+br.h/2,color,br.type==='blast'?32:20,br.type==='blast'?1.25:1,impactDir);addRing(br.x+br.w/2,br.y+br.h/2,color,br.type==='blast'?42:28);state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);addScore((100+state.combo*8+state.stage*12)*(chain?1:1));const diffDrop=DIFF[state.difficulty].drop;if(br.type==='bonus'||Math.random()<diffDrop)dropPower(br.x+br.w/2,br.y+br.h/2);if(br.type==='blast')explodeAt(br.x+br.w/2,br.y+br.h/2,78)}