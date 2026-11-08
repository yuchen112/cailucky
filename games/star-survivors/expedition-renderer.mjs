import {actorFrame} from './animation-assets.mjs?v=5.5';
import * as DATA from './expedition-data.mjs?v=6';

const TAU=Math.PI*2;
const SUPPORTS=['starfall','prism','colorRing','fireworks','quiver','moonblade','rainbell','tide','chains','ward','mirror','hourglass','seed','thorns','plush','incense','dice','clover','wings','lightning'];
const MAP_IDS=['cave','forest','coast','clock','sky'];
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const role=id=>DATA.getRole?.(id)||DATA.ROLES?.find(r=>r.id===id)||{id,color:'#d3b7ff'};
const map=id=>DATA.getMap?.(id)||DATA.MAPS?.find(m=>m.id===id)||{id,color:'#a98aca'};
const body=p=>DATA.body?.(p)||{x:p.x,y:p.y-24};
const enemyBody=e=>DATA.enemyBody?.(e)||{x:e.x,y:e.y-(e.type===3?32:12)};
const imageFor=(images,kind,id)=>images[`${kind}-${id}`]||images[`${kind}${id}`]||images[`${kind}s`]?.[id]||images[`${kind}s`]?.get?.(id);
const speciesFor=e=>DATA.MONSTERS?.find(s=>s.id===(e.species??0));
const colorFor=(kind,fallback='#d8b4ff')=>/rain|frost|ice|tide|water/.test(kind)?'#83ddff':/seed|thorn|forest|root|heal|incense/.test(kind)?'#a4e4ac':/burn|meteor|fire|starfall/.test(kind)?'#ffbe79':/moon|mirror|echo|memory/.test(kind)?'#c4b7ff':/shield|ward|hope|light|beam/.test(kind)?'#ffe7a5':/joy|ring|pulse|color/.test(kind)?'#ffb9db':fallback;
function artCell(c,im,x,y,w,h,cell=0,cols=1,rows=1,{alpha=1,rotation=0,mirror=false,anchor=.5}={}){if(!im||!Number.isFinite(x+y+w+h))return;c.save();c.globalAlpha*=clamp(alpha);c.translate(x,y);c.rotate(rotation);if(mirror)c.scale(-1,1);const sw=im.width/cols,sh=im.height/rows;c.drawImage(im,(cell%cols)*sw,Math.floor(cell/cols)*sh,sw,sh,-w/2,-h*anchor,w,h);c.restore()}
function setLine(c,color,width,points){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}
function shield(c,x,y,r,color,alpha=.6){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=2;c.beginPath();for(let i=0;i<=6;i++){const a=-Math.PI/2+i*TAU/6;(i?c.lineTo.bind(c):c.moveTo.bind(c))(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath();c.stroke();c.fillStyle=color+'12';c.fill();c.restore()}

const SCENERY_SIZES={
  cave:[[82,88],[124,62],[126,92],[31,48],[46,28]],
  forest:[[148,77],[58,52],[82,69],[62,47],[46,30]],
  coast:[[57,44],[76,71],[132,59],[49,66],[60,42]],
  clock:[[88,66],[39,63],[82,106],[31,48],[119,84]],
  sky:[[73,126],[55,32],[85,139],[52,51],[63,77]]
};
export class Renderer{
 constructor(images={},options={}){this.images=images;this.canvas=options.canvas||document.getElementById('game');this.ctx=this.canvas.getContext('2d',{alpha:false});this.feedback=options.feedback||document.getElementById('feedback');this.fctx=this.feedback?.getContext('2d');this.fx=[];this.numbers=[];this.ghosts=[];this.screenFX=[];this.glows=new Map();this.camera={x:0,y:0};this.roleId='dream';this.mapId='cave';this.cast=0;this.activeAnim=0;this.hurtAnim=0;this.bossCast=0;this.shake=0;this.flash=0;this.walk=0;this.facing=1;this.pickupClock=0;this.death=0;this.reduced=matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;this.resizeHandler=()=>this.resize();addEventListener('resize',this.resizeHandler);this.resize()}
 resize(){const rect=this.canvas.getBoundingClientRect();this.w=rect.width||innerWidth;this.h=rect.height||innerHeight;this.dpr=Math.min(devicePixelRatio||1,this.w<700?1.5:1.75);this.scale=Math.min(1.12,Math.max(.69,Math.min(this.w,this.h)/650));this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);if(this.feedback){this.feedback.width=this.canvas.width;this.feedback.height=this.canvas.height;this.fctx.setTransform(this.dpr,0,0,this.dpr,0,0)}}
 dispose(){removeEventListener('resize',this.resizeHandler)}
 reset(p,roleId='dream',mapId='cave'){this.roleId=roleId;this.mapId=mapId;this.camera={x:p.x,y:p.y};this.facing=p.facing||1;this.fx=[];this.numbers=[];this.ghosts=[];this.screenFX=[];this.cast=this.activeAnim=this.hurtAnim=this.shake=this.flash=this.walk=this.death=0}
 image(c,key,x,y,w,h,cell=0,cols=1,rows=1,rotation=0,alpha=1,mirror=false,anchor=.5){artCell(c,this.images[key],x,y,w,h,cell,cols,rows,{rotation,alpha,mirror,anchor})}
 glow(c,x,y,r,color,alpha=.25){if(!Number.isFinite(x+y+r)||r<=0)return;let stamp=this.glows.get(color);if(!stamp){stamp=document.createElement('canvas');stamp.width=stamp.height=96;const s=stamp.getContext('2d'),gradient=s.createRadialGradient(48,48,0,48,48,48);gradient.addColorStop(0,color);gradient.addColorStop(.45,color+'88');gradient.addColorStop(1,'transparent');s.fillStyle=gradient;s.fillRect(0,0,96,96);this.glows.set(color,stamp)}c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=clamp(alpha);c.drawImage(stamp,x-r,y-r,r*2,r*2);c.restore()}
 visible(x,y,pad=100){return Math.abs(x-this.camera.x)<this.w/this.scale/2+pad&&Math.abs(y-this.camera.y)<this.h/this.scale/2+pad}
 burst(x,y,kind='gold',size=85,ttl=.38){if(this.fx.length<85)this.fx.push({x,y,kind,size,ttl,max:ttl,rotation:Math.random()*TAU})}
 uiBurst(x,y){if(this.reduced)return;this.screenFX.push({x,y,kind:'click',ttl:.36,max:.36,size:90});if(this.screenFX.length>12)this.screenFX.shift()}
 cinematic(kind){this.screenFX.push({x:this.w/2,y:this.h*.45,kind,ttl:1.15,max:1.15,size:kind==='boss'?460:340});this.flash=kind==='boss'?.09:.16}
 event(e,g){const x=e.x??g?.player.x??0,y=e.y??g?.player.y??0;
  if(['shoot','cast','beam','chain'].includes(e.type)){this.cast=.34;if(e.type==='shoot')this.burst(x,y,'gold',48,.21)}
  if(e.type==='hit'){if(this.numbers.length<48)this.numbers.push({x:x+(Math.random()-.5)*12,y:y-16,value:e.value??e.damage??0,ttl:.63,max:.63,strong:(e.value||0)>=100,color:colorFor(e.effect||'')});if(this.fx.length<70)this.burst(x,y,/rain|frost|ice/.test(e.effect||'')?'ice':'gold',(e.value||0)>100?70:43,.23)}
  if(e.type==='kill'){const enemy=g?.enemies.find(a=>a.id===e.id);if(this.ghosts.length<42)this.ghosts.push({x,y,species:e.species??enemy?.species??0,boss:e.boss||e.enemyType===3,ttl:.43,max:.43,frame:Math.floor((g?.time||0)*7)%4});this.burst(x,y,'gold',e.enemyType===3?180:55,.38)}
  if(e.type==='dash'){this.shake=Math.max(this.shake,1.5);this.burst(x,y,'ice',130,.36)}
  if(e.type==='hurt'){this.hurtAnim=.24;this.shake=Math.max(this.shake,5);this.flash=.17;this.numbers.push({x,y:y-37,value:'−'+(e.value??e.damage??0),ttl:.85,max:.85,hurt:true});this.burst(x,y,'ice',90,.29)}
  if(['pulse','nova','shieldBurst'].includes(e.type)){this.fx.push({x,y,kind:'nova',size:(e.r||170)*2,ttl:.48,max:.48,rotation:0});this.shake=Math.max(this.shake,1.5)}
  if(['meteor','starfall'].includes(e.type)){this.burst(x,y,'gold',(e.r||90)*2.25,.48);this.shake=Math.max(this.shake,3)}
  if(e.type==='shatter')this.burst(x,y,'ice',(e.r||85)*2,.43);
  if(['active','skill'].includes(e.type)){this.activeAnim=.72;this.burst(x,y,'active',220,.65);this.flash=.10}
  if(e.type==='bossAttack'){this.bossCast=.55;this.burst(x,y,'ice',170,.45)}
  if(['upgrade','evolve'].includes(e.type)){this.burst(x,y,'gold',235,.65);this.flash=.12}
  if(e.type==='pickup'&&++this.pickupClock%4===0)this.burst(x,y,'ice',27,.21);
  if(e.type==='block'){this.burst(x,y,'gold',140,.32);this.flash=.06}if(e.type==='lucky')this.burst(x,y,'gold',100,.38);if(e.type==='objective'){this.burst(x,y,'gold',210,.6);this.flash=.07}if(e.type==='enemyHeal')this.fx.push({x,y,kind:'heal',size:(e.r||160)*2,ttl:.5,max:.5,rotation:0});
  if(['heal','material'].includes(e.type))this.burst(x,y,'gold',e.type==='heal'?110:55,.4)
 }
 scenery(c,g,foreground){
  // World-space width and height limits, in the same order as each map's prop assets.
  const sizes=SCENERY_SIZES[g.mapId];
  const key=g.mapId+g.runId;
  if(this.sceneryKey!==key){
    this.sceneryKey=key;
    const seed=[...key].reduce((n,ch)=>Math.imul(n,31)+ch.charCodeAt(0)|0,0);
    const bounds=DATA.ARENA_BOUNDS;
    const columns=8,rows=5;
    const spacingX=(bounds.x*2-140)/columns;
    const spacingY=(bounds.y*2-140)/rows;
    this.sceneryItems=Array.from({length:columns*rows},(_,i)=>{
      const x=(i%columns+.5-columns/2+(hash(i,seed)-.5)*.38)*spacingX;
      const y=(Math.floor(i/columns)+.5-rows/2+(hash(i+50,seed)-.5)*.38)*spacingY;
      return {x,y,variation:1.28+hash(i+80,seed)*.12,type:i%5};
    }).filter(({x,y})=>Math.hypot(x,y)>135);
  }
  for(const {x,y,variation,type} of this.sceneryItems){
    const [maxWidth,maxHeight]=sizes[type];
    if((y>=g.player.y)!==foreground||!this.visible(x,y,Math.max(maxWidth,maxHeight)*variation))continue;
    if(g.gems.some(gem=>gem.kind==='objective'&&Math.hypot(gem.x-x,gem.y-y)<Math.max(82,maxWidth*variation*.6)))continue;
    const image=this.images['scenery-'+g.mapId+'-'+type];
    if(!image)continue;
    const scale=Math.min(maxWidth/image.width,maxHeight/image.height)*variation;
    const width=image.width*scale,height=image.height*scale;
    const distance=Math.hypot(g.player.x-x,g.player.y-(y-height*.38));
    c.save();
    c.globalAlpha=.16+.84*clamp((distance-28)/78);
    c.fillStyle='#10162955';
    c.beginPath();c.ellipse(x,y-2,width*.35,Math.min(9,width*.09),0,0,TAU);c.fill();
    c.drawImage(image,x-width/2,y-height,width,height);
    c.restore();
  }
 }
 aimHint(c,g,input){
  if(Math.hypot(input.aimX||0,input.aimY||0)<.05)return;
  const point=DATA.body(g.player);
  const target=g.enemies.find(enemy=>enemy.id===g.aimTarget);
  const length=Math.hypot(input.aimX,input.aimY);
  setLine(c,'#ffe3a6',2,[point,{x:point.x+input.aimX/length*48,y:point.y+input.aimY/length*48}]);
  if(target){
   const center=DATA.enemyBody(target);
   c.strokeStyle='#ffdf83';c.lineWidth=2;
   c.strokeRect(center.x-target.r,center.y-target.r,target.r*2,target.r*2);
  }
 }
 terrain(c,g){const im=imageFor(this.images,'map',g.mapId),left=this.camera.x-this.w/this.scale/2,top=this.camera.y-this.h/this.scale/2;c.fillStyle='#101b29';c.fillRect(left-10,top-10,this.w/this.scale+20,this.h/this.scale+20);if(im)c.drawImage(im,-1600,-1066.6667,3200,2133.3334);c.fillStyle=g.mapId==='sky'?'#10213d20':g.mapId==='coast'?'#0c243a25':'#07112030';c.fillRect(left,top,this.w/this.scale,this.h/this.scale);const b=DATA.ARENA_BOUNDS;
  c.save();
  c.fillStyle='#060a14a8';
  c.beginPath();c.rect(left-20,top-20,this.w/this.scale+40,this.h/this.scale+40);
  c.rect(-b.x,-b.y,b.x*2,b.y*2);c.fill('evenodd');
  c.lineWidth=9;c.strokeStyle='#0d1421';c.strokeRect(-b.x,-b.y,b.x*2,b.y*2);
  c.lineWidth=4;c.strokeStyle='#ffe49a';c.strokeRect(-b.x,-b.y,b.x*2,b.y*2);
  c.setLineDash([10,10]);c.lineWidth=2;c.strokeStyle='#ffe49ac0';
  c.strokeRect(-b.x-11,-b.y-11,b.x*2+22,b.y*2+22);
  c.restore();
  this.glow(c,g.player.x,g.player.y-20,210,role(g.roleId).color,.05)}

 hazards(c,g,now){for(const h of g.hazards||[]){if(!this.visible(h.x,h.y,(h.r||h.width||100)+20))continue;const r=h.r||h.radius||80,warning=(h.delay??h.warn??0)>0,alpha=warning?.95:.84,color=h.safe?'#9be4c0':warning?'#ffb896':'#f17e9f';c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=warning?3:4;c.fillStyle=color+(warning?'36':'52');if(h.width&&h.height){c.fillRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height);c.strokeRect(h.x-h.width/2,h.y-h.height/2,h.width,h.height)}else if(h.width&&h.length){c.translate(h.x,h.y);c.rotate(h.angle||0);c.fillRect(0,-h.width/2,h.length,h.width);c.strokeRect(0,-h.width/2,h.length,h.width)}else{c.beginPath();c.arc(h.x,h.y,r,0,TAU);c.fill();if(warning)c.setLineDash([7,7]);c.stroke();if(warning){c.setLineDash([]);c.beginPath();c.arc(h.x,h.y,r*(.25+.7*((now*.7)%1)),0,TAU);c.stroke()}}c.restore();if(!warning)this.glow(c,h.x,h.y,r,color,.10)}}
 fields(c,g,now){for(const f of g.fields||[]){if(!this.visible(f.x,f.y,(f.r||100)+50))continue;const kind=f.kind||'rain',color=colorFor(kind),r=f.r||70,alpha=clamp(f.ttl*2)*.5;c.save();c.globalAlpha=alpha;c.fillStyle=color+'17';c.strokeStyle=color+'88';c.lineWidth=1.5;c.beginPath();c.arc(f.x,f.y,r,0,TAU);c.fill();c.stroke();this.glow(c,f.x,f.y,r,color,.12);const frozen=/rain|frost|ice/.test(kind);for(let j=0;j<(frozen?6:4);j++){const a=j*2.399+g.time*.3,rr=r*(.25+(j%3)*.22),t=(g.time*1.5+j*.19)%1;this.image(c,frozen?'icons':'vfx',f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr-25*(1-t),frozen?20:27,frozen?26:27,frozen?2:0,4,2,a,alpha*(1-t*.5))}c.restore()}}
 groundAttacks(c,g,now){for(const m of g.meteors||[]){if(!this.visible(m.x,m.y,(m.r||90)+90))continue;const t=clamp(1-m.delay/(m.total||.7)),r=m.r||90;c.save();c.strokeStyle='#ffbf8e';c.fillStyle='#f69f551b';c.lineWidth=2;c.setLineDash([8,6]);c.beginPath();c.arc(m.x,m.y,r,0,TAU);c.fill();c.stroke();c.setLineDash([]);c.globalAlpha=.3+t*.6;c.beginPath();c.arc(m.x,m.y,r*Math.max(.05,1-t),0,TAU);c.stroke();this.image(c,'icons3',m.x+80*(1-t),m.y-270*(1-t),55,55,0,4,2,-.6,clamp(t*2));c.restore()}
  for(const b of g.beams||[]){const length=b.length||0,width=b.width||16,end=DATA.beamEnd(b),ex=end.x,ey=end.y,color=b.enemy?'#ff94b9':colorFor(b.kind||'beam');c.save();c.lineCap='round';c.globalAlpha=.24;setLine(c,color,width*1.35,[b,end]);c.globalAlpha=.93;setLine(c,color,width,[b,end]);setLine(c,'#fff9ec',width*.36,[b,end]);c.fillStyle='#fff4c9';c.beginPath();c.arc(ex,ey,width*.23,0,TAU);c.fill();c.restore()}
  for(const a of g.arcs||[]){c.save();c.globalAlpha=clamp(a.ttl/(a.max||.27));for(let j=1;j<(a.points?.length||0);j++){const from=a.points[j-1],to=a.points[j],points=[from];for(let i=1;i<=7;i++){const t=i/7,zig=i===7?0:Math.sin(i*3+now*80)*9;points.push({x:from.x+(to.x-from.x)*t+zig,y:from.y+(to.y-from.y)*t-zig})}setLine(c,'#7f9df588',a.focus?8:5,points);setLine(c,'#dbfbff',2,points)}c.restore()}
  for(const e of g.echoes||[]){if(!this.visible(e.x,e.y,(e.r||80)+20))continue;const t=clamp(1-e.delay/(e.total||.8)),color=e.color||'#d7b7ee';c.save();c.strokeStyle=color;c.fillStyle=color+'12';c.lineWidth=1.5;c.setLineDash([5,7]);c.beginPath();c.arc(e.x,e.y,e.r||80,0,TAU);c.fill();c.stroke();c.setLineDash([]);c.globalAlpha=.4;c.beginPath();c.arc(e.x,e.y,(e.r||80)*(1-t),0,TAU);c.stroke();this.equipment(c,'mirror',e.x,e.y,32,now*.3,.6);c.restore()}
  for(const s of g.slashes||[]){if(!this.visible(s.x,s.y,(s.r||100)+10))continue;const t=clamp(1-s.ttl/(s.max||.3)),arc=s.arc||Math.PI*.8,r=s.r||100;c.save();c.globalAlpha=clamp(s.ttl/(s.max||.3))*.65;c.fillStyle=(s.color||'#ffe5aa')+'24';c.strokeStyle=s.color||'#ffe5aa';c.lineWidth=4;c.beginPath();c.moveTo(s.x,s.y);c.arc(s.x,s.y,r,s.angle-arc/2,s.angle+arc/2);c.closePath();c.fill();c.beginPath();c.arc(s.x,s.y,r*(.83+t*.17),s.angle-arc/2,s.angle+arc/2);c.stroke();c.restore()}
 }
 drops(c,g,now){for(const gem of g.gems||[]){if(!this.visible(gem.x,gem.y,95))continue;if(gem.kind==='magnet'){this.glow(c,gem.x,gem.y,55,'#8ef5ff',.45);c.save();c.translate(gem.x,gem.y);c.lineWidth=7;c.strokeStyle='#071622';c.beginPath();c.arc(0,2,11,0,Math.PI);c.lineTo(-11,-9);c.stroke();c.strokeStyle='#93efff';c.lineWidth=4;c.beginPath();c.moveTo(11,-9);c.lineTo(11,2);c.arc(0,2,11,0,Math.PI);c.lineTo(-11,-9);c.stroke();c.fillStyle='#fff2a5';c.fillRect(-13,-11,4,5);c.fillRect(9,-11,4,5);c.restore();continue}const objective=gem.kind==='objective',isMat=gem.kind==='material',cell=gem.kind==='heart'?4:gem.kind==='chest'?6:5,size=objective?65:gem.kind==='chest'?38:gem.kind==='heart'?27:isMat?25:gem.value>8?20:15,bob=gem.pull?0:Math.sin(now*3+gem.x*.03)*2;if(gem.kind==='chest'||isMat||objective)this.glow(c,gem.x,gem.y,objective?100:40,isMat||objective?map(g.mapId).color:'#e6bf74',objective?.32:.22);if(objective){c.save();c.strokeStyle='#fff1b5';c.lineWidth=2;c.globalAlpha=.45+Math.sin(now*3)*.12;c.beginPath();c.ellipse(gem.x,gem.y+20,39,16,0,0,TAU);c.stroke();setLine(c,'#f4d8ff44',2,[{x:gem.x,y:gem.y-70},{x:gem.x,y:gem.y-27}]);c.restore()}if(gem.pull){const a=Math.atan2(gem.y-g.player.y,gem.x-g.player.x);setLine(c,'#c5abed44',1.5,[gem,{x:gem.x+Math.cos(a)*13,y:gem.y+Math.sin(a)*13}])}if((isMat||objective)&&this.images.materials)this.image(c,'materials',gem.x,gem.y+bob,size,size,MAP_IDS.indexOf(g.mapId),5,1,0,1);else this.image(c,'icons',gem.x,gem.y+bob,size,size,cell,4,2,0,1);if(objective){c.save();c.font='700 12px system-ui';c.textAlign='center';c.strokeStyle='#132037';c.lineWidth=3;c.strokeText('靠近完成目標',gem.x,gem.y+45);c.fillStyle='#fff0c6';c.fillText('靠近完成目標',gem.x,gem.y+45);c.restore()}}}
 shots(c,g,now){for(const s of g.shots||[]){if(!this.visible(s.x,s.y,65))continue;const a=Math.atan2(s.vy||0,s.vx||1),kind=s.kind||s.equipmentId||'star',r=s.r||7;if(s.enemy){this.glow(c,s.x,s.y,r*2.4,'#f18cb6',.18);this.image(c,'vfx',s.x,s.y,r*3,r*3,4,4,2,a+now,.95);c.save();c.strokeStyle='#ffadbd';c.lineWidth=1.4;c.beginPath();c.arc(s.x,s.y,r,0,TAU);c.stroke();c.restore();continue}if(/shield/.test(kind)){this.equipment(c,'main-trust',s.x,s.y,Math.max(34,r*3.4),now*7);this.glow(c,s.x,s.y,29,'#f1d18f',.13)}else if(/arrow|quiver|night|spear|hope|lance/.test(kind)){c.save();c.translate(s.x,s.y);c.rotate(a);c.strokeStyle=/hope|spear|lance/.test(kind)?'#fff0b7':'#d9d5ff';c.lineWidth=r>8?3:2;c.beginPath();c.moveTo(-20,0);c.lineTo(10,0);c.moveTo(5,-5);c.lineTo(12,0);c.lineTo(5,5);c.stroke();this.image(c,'vfx',4,0,26,26,0,4,2,0,.55);c.restore()}else if(/dice|clover|ring|colorRing/.test(kind)){const index=SUPPORTS.indexOf(kind);this.equipment(c,index>=0?kind:kind.includes('clover')?'clover':'colorRing',s.x,s.y,r*4,now*4);this.glow(c,s.x,s.y,r*3,colorFor(kind),.12)}else{const color=colorFor(kind,role(g.roleId).color);c.save();c.globalCompositeOperation='lighter';for(let j=2;j>=0;j--)this.image(c,'vfx',s.x-Math.cos(a)*j*12,s.y-Math.sin(a)*j*12,29-j*6,29-j*6,0,4,2,a,.5-j*.14);c.restore();this.image(c,'vfx',s.x,s.y,Math.max(25,r*4),Math.max(25,r*4),0,4,2,a,1);this.glow(c,s.x,s.y,r*2.5,color,.12)}}}
 equipment(c,id,x,y,size=38,rotation=0,alpha=1){const index=SUPPORTS.indexOf(id),mainIndex=DATA.ROLES?.findIndex(r=>r.main===id)??-1;if(mainIndex>=0&&this.images.mainWeapons)this.image(c,'mainWeapons',x,y,size,size,mainIndex,5,2,rotation,alpha);else if(index>=0&&this.images.equipment)this.image(c,'equipment',x,y,size,size,index,5,4,rotation,alpha);else this.image(c,'icons',x,y,size,size,/moon/.test(id)?1:/rain/.test(id)?2:0,4,2,rotation,alpha)}
 orbits(c,g){let orbits=g.orbits||[];if(!orbits.length&&DATA.orbitSpec){for(const[id,n]of Object.entries(g.weapons||{})){if(!n||!['moonblade','colorRing','main-trust'].includes(id))continue;let spec;try{spec=DATA.orbitSpec(g,id)}catch{}if(spec?.r&&spec.count)orbits=[...orbits,{...spec,equipmentId:id}]}}
  const center=body(g.player);for(const o of orbits){const origin={x:o.x??center.x,y:o.y??center.y},r=o.r||o.radius||100,count=o.count||1,speed=o.speed||2.5;c.save();c.strokeStyle='#d1b9ed22';c.lineWidth=1;c.beginPath();c.arc(origin.x,origin.y,r,0,TAU);c.stroke();for(let j=0;j<count;j++){const a=(o.angle??g.time*speed)+j*TAU/count,x=origin.x+Math.cos(a)*r,y=origin.y+Math.sin(a)*r;c.strokeStyle='#d8b8ee55';c.lineWidth=3;c.beginPath();c.arc(origin.x,origin.y,r,a-.32,a);c.stroke();this.equipment(c,o.equipmentId||o.id||o.kind||'moonblade',x,y,(o.hitRadius||18)*2,a+Math.PI/2)}c.restore()}}
 summons(c,g,now){for(const ally of g.summons||[]){if(!this.visible(ally.x,ally.y,90))continue;const guard=ally.guardian||ally.kind==='guardian',forest=ally.source==='main-growth'||/forest|wood/.test(ally.kind||''),heal=g.roleId==='healing'||/plush|heal/.test(ally.kind||''),size=guard?99:forest?55:48,frame=guard?(ally.anim>0?Math.min(3,Math.floor((.4-ally.anim)*10)):0):Math.floor(now*8)%4;this.glow(c,ally.x,ally.y,size*.6,forest?'#acde9b':heal?'#ffd9b0':'#c5a5ee',.10);if(this.images.companions&&(forest||heal)){const row=heal?2:guard?1:0;this.image(c,'companions',ally.x,ally.y+size*.15,size,size,frame+row*4,4,3,0,1,false,.75)}else this.image(c,'allies',ally.x,ally.y+size*.15,size,size,frame+(guard?4:0),4,2,0,1,false,.75)}}
 drawEnemy(c,e,g,now,alpha=1,deathProgress=0){const spec=speciesFor(e),boss=spec?.boss||e.type===3,size=boss?174:Math.max(62,Math.min(112,(e.r||18)*3.5)),mapId=spec?.mapId||MAP_IDS[Math.floor((e.species||0)/6)]||g.mapId,im=imageFor(this.images,'enemies',mapId),row=(e.species||0)%6,behavior=spec?.behavior||'',burrow=(e.burrow||e.hidden)>0,frame=e.windup>0?1:Math.floor(g.time*(/bat|fly|dash/.test(behavior)?10:6)+(e.id||0))%4;const yy=e.y+size*.19,ec=enemyBody(e);if(burrow&&!deathProgress){c.save();c.strokeStyle='#a2d9e966';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+6,24+Math.sin(now*7)*4,8,0,0,TAU);c.stroke();c.restore();return}c.save();c.globalAlpha*=alpha*(burrow?.28:1);c.fillStyle='#03091466';c.beginPath();c.ellipse(e.x,e.y+8,size*.3*(1-deathProgress*.6),size*.09,0,0,TAU);c.fill();if(e.hit>0)c.filter='brightness(1.7)';else if(e.frozen>0)c.filter='brightness(1.25) saturate(.35)';artCell(c,actorFrame(this.images,"monsters",e.species,deathProgress?"death":e.windup>0?"attack":e.hit>0?"hurt":"run",deathProgress||frame/4),e.x,yy+deathProgress*14,size*(1+deathProgress*.08),size*(1-deathProgress*.25),0,1,1,{alpha:1,mirror:e.x>g.player.x,anchor:1});c.restore();if(deathProgress)return;
  if((e.windup||0)>0||boss&&(e.attack||0)<.65){const warn=clamp((e.windup||.65-(e.attack||0))/.65);this.glow(c,e.x,ec.y,size*.7,'#ed87a7',warn*.15);c.save();c.strokeStyle='#f2a6bb';c.globalAlpha=.25+warn*.4;c.lineWidth=1.5;c.setLineDash([6,6]);c.beginPath();c.arc(e.x,ec.y,size*.5,0,TAU);c.stroke();c.setLineDash([]);if(/charge|dash|ram/.test(behavior)){const a=e.chargeTime>0?e.chargeAngle:Math.atan2(g.player.y-e.y,g.player.x-e.x);setLine(c,'#ffb3bd88',16,[ec,{x:ec.x+Math.cos(a)*190,y:ec.y+Math.sin(a)*190}])}c.restore()}
  if(e.shield>0||/shield/.test(behavior)&&e.shield!==0)shield(c,ec.x,ec.y,size*.45,'#e9cb91',.6);
  if(/heal/.test(behavior))this.glow(c,e.x,e.y-15,55,'#98dbbb',.13+.04*Math.sin(now*3));
  if(boss||e.elite||e.hp<e.maxHp){const width=boss?98:e.elite?58:32,y=e.y-size*.85;c.fillStyle='#100f2588';c.fillRect(e.x-width/2,y,width,4);c.fillStyle=boss?'#f2bbcf':'#c9a9e8';c.fillRect(e.x-width/2,y,width*clamp(e.hp/e.maxHp),4)}
 }
 player(c,g,input,ed,now){const p=g.player,dead=g.status==='lost',moving=!dead&&(Math.hypot(input.x||0,input.y||0)>.08||p.dash>0);if(moving)this.walk+=ed;this.facing=p.facing||this.facing;const activeClock=Math.max(this.activeAnim,g.roleState?.activeAnim||0),active=activeClock>0,hurt=this.hurtAnim>0,castClock=Math.max(this.cast,g.roleState?.castAnim||0),row=dead||active||hurt?2:moving?0:castClock>0?1:0,frame=dead?3:active?(activeClock>.4?0:1):hurt?2:moving?Math.floor(this.walk*10)%4:castClock>0?clamp(Math.floor((.34-castClock)/.085),0,3):0,im=actorFrame(this.images,'roles',g.roleId,dead?'death':hurt?'hurt':active?'skill':castClock>0?'attack':moving?'run':'idle',dead?this.death*2:active?1-activeClock:castClock>0?(0.34-castClock)/0.34:frame/4),size=130,bob=moving?Math.sin(this.walk*20)*1.2:Math.sin(now*2)*1.1,y=p.y+23+bob;
  c.fillStyle='#03091375';c.beginPath();c.ellipse(p.x,p.y+9,27,8,0,0,TAU);c.fill();if(p.dash>0)for(let j=3;j>0;j--)artCell(c,im,p.x-p.dirX*j*19,y-p.dirY*j*19,size,size,0,1,1,{alpha:.08+(3-j)*.055,mirror:this.facing<0,anchor:1});
  if(p.shield>0||g.roleState?.shield>0)shield(c,p.x,p.y-30,57,'#f9deb0',.45+.12*Math.sin(now*4));
  const alpha=dead?Math.max(.35,1-this.death*.15):p.inv>0&&Math.floor(now*18)%2?.45:1;artCell(c,im,p.x,y,size,size,0,1,1,{alpha,mirror:this.facing<0,anchor:1});
  if(active)this.glow(c,p.x,p.y-38,110,role(g.roleId).color,.16*this.activeAnim/.72)
 }
 render(g,mode='playing',input={},dt=0,now=0){const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#10172a';c.fillRect(0,0,this.w,this.h);if(!g||['home','lobby','loading'].includes(mode)){this.renderFeedback(dt,now);return}this.roleId=g.roleId;this.mapId=g.mapId;const live=['playing','cinematic','result'].includes(mode),ed=live?dt:0,p=g.player;this.cast=Math.max(0,this.cast-ed);this.activeAnim=Math.max(0,this.activeAnim-ed);this.hurtAnim=Math.max(0,this.hurtAnim-ed);this.bossCast=Math.max(0,this.bossCast-ed);this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-ed*20);if(g.status==='lost')this.death+=dt;const smooth=Math.min(1,dt*11);this.camera.x+=(p.x-this.camera.x)*smooth;this.camera.y+=(p.y-this.camera.y)*smooth;const shake=this.reduced?0:this.shake,ox=this.w/2-this.camera.x*this.scale+(Math.random()-.5)*shake,oy=this.h*.52-this.camera.y*this.scale+(Math.random()-.5)*shake;c.save();c.translate(ox,oy);c.scale(this.scale,this.scale);this.terrain(c,g);this.scenery(c,g,false);

  this.hazards(c,g,now);this.fields(c,g,now);this.drops(c,g,now);this.groundAttacks(c,g,now);
  for(const f of this.fx){if(f.size<160&&f.kind!=='nova')continue;this.drawBurst(c,f,ed,.30)}
  const actors=(g.enemies||[]).filter(e=>this.visible(e.x,e.y,160)).map(e=>({enemy:e,y:e.y}));actors.push({player:true,y:p.y});actors.sort((a,b)=>a.y-b.y);for(const a of actors)if(a.player)this.player(c,g,input,ed,now);else this.drawEnemy(c,a.enemy,g,now);
  this.shots(c,g,now);this.orbits(c,g);this.summons(c,g,now);
  this.scenery(c,g,true);this.aimHint(c,g,input);
  for(const ghost of this.ghosts){ghost.ttl-=ed;const t=1-ghost.ttl/ghost.max;this.drawEnemy(c,{...ghost,id:0,r:ghost.boss?48:19,type:ghost.boss?3:0,hp:1,maxHp:1},g,now,clamp(ghost.ttl/ghost.max),t)}this.ghosts=this.ghosts.filter(d=>d.ttl>0);
  for(const f of this.fx){if(f.size>=160||f.kind==='nova')continue;this.drawBurst(c,f,ed,.78)}this.fx=this.fx.filter(f=>f.ttl>0);
  for(const n of this.numbers){n.ttl-=ed;n.y-=ed*25;c.save();c.globalAlpha=clamp(n.ttl*4);c.font=`800 ${n.hurt?20:n.strong?18:12}px system-ui`;c.textAlign='center';c.strokeStyle='#181027';c.lineWidth=3.5;c.strokeText(n.value,n.x,n.y);c.fillStyle=n.hurt?'#ffadbe':n.strong?'#ffe7b1':n.color||'#f0e3ff';c.fillText(n.value,n.x,n.y);c.restore()}this.numbers=this.numbers.filter(n=>n.ttl>0);c.restore();
  const vignette=c.createRadialGradient(this.w/2,this.h*.50,Math.min(this.w,this.h)*.22,this.w/2,this.h*.5,Math.max(this.w,this.h)*.68);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#050b2088');c.fillStyle=vignette;c.fillRect(0,0,this.w,this.h);this.atmosphere(c,g,now);
  const boss=(g.enemies||[]).find(e=>speciesFor(e)?.boss||e.type===3);if(boss){const bx=boss.x*this.scale+ox,by=boss.y*this.scale+oy;if(bx<32||bx>this.w-32||by<48||by>this.h-40){const dx=bx-this.w/2,dy=by-this.h/2,f=Math.min((this.w/2-30)/Math.max(1,Math.abs(dx)),(this.h/2-55)/Math.max(1,Math.abs(dy)));c.save();c.translate(this.w/2+dx*f,this.h/2+dy*f);c.rotate(Math.atan2(dy,dx));c.fillStyle='#f4c5db';c.beginPath();c.moveTo(13,0);c.lineTo(-8,-7);c.lineTo(-8,7);c.closePath();c.fill();c.restore()}}
  const objective=(g.gems||[]).filter(d=>d.kind==='objective').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(objective){const bx=objective.x*this.scale+ox,by=objective.y*this.scale+oy;if(bx<50||bx>this.w-50||by<160||by>this.h-135){const dx=bx-this.w/2,dy=by-this.h/2,f=Math.min((this.w/2-48)/Math.max(1,Math.abs(dx)),(this.h/2-155)/Math.max(1,Math.abs(dy))),x=this.w/2+dx*f,y=this.h/2+dy*f;c.save();c.translate(x,y);this.image(c,'icons',0,0,29,29,5,4,2,0,.9);c.rotate(Math.atan2(dy,dx));c.strokeStyle='#ffecae';c.lineWidth=2;c.beginPath();c.moveTo(18,-6);c.lineTo(25,0);c.lineTo(18,6);c.stroke();c.restore();c.save();c.font='700 11px system-ui';c.textAlign='center';c.strokeStyle='#0b1731';c.lineWidth=3;c.strokeText('地圖目標',x,y+29);c.fillStyle='#fff0c2';c.fillText('地圖目標',x,y+29);c.restore()}}
  if(p.hp<p.maxHp*.25){c.fillStyle=`rgba(146,32,66,${.06+Math.sin(now*4)*.025})`;c.fillRect(0,0,this.w,this.h)}this.renderFeedback(dt,now)
 }
 drawBurst(c,f,dt,alpha){f.ttl-=dt;if(!this.visible(f.x,f.y,f.size))return;const t=1-f.ttl/f.max,cell=Math.min(3,Math.floor(t*4))+(f.kind==='ice'?4:0);c.save();c.globalCompositeOperation='lighter';this.image(c,'vfx',f.x,f.y,f.size,f.size,cell,4,2,f.rotation,clamp(f.ttl*8)*alpha);if(f.kind==='nova'||f.kind==='heal'){c.strokeStyle=f.kind==='heal'?'#a5e9c2':'#f5cef2';c.globalAlpha=clamp(1-t)*.4;c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,f.size*.5*clamp(t*1.3),0,TAU);c.stroke()}c.restore()}
 atmosphere(c,g,now){if(this.reduced)return;const id=g.mapId,color=map(id).color||'#cbb4ff';for(let j=0;j<12;j++){const x=((hash(j,3)*this.w-this.camera.x*.025)%this.w+this.w)%this.w,y=((hash(j,11)*this.h-now*(id==='coast'?12:6)-this.camera.y*.025)%this.h+this.h)%this.h;this.image(c,'vfx',x,y,id==='forest'?8:12,id==='forest'?8:12,id==='coast'?4:0,4,2,now*.15,.1+hash(j,9)*.08)}if(id==='coast'||id==='sky'){c.save();c.globalAlpha=.05;c.fillStyle=color;c.fillRect(0,0,this.w,this.h);c.restore()}}
 renderFeedback(dt,now){const c=this.fctx;if(!c)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);for(const f of this.screenFX){f.ttl-=dt;const t=1-f.ttl/f.max;c.save();c.globalCompositeOperation='lighter';this.image(c,'vfx',f.x,f.y,f.size,f.size,Math.min(3,Math.floor(t*4))+(f.kind==='boss'?4:0),4,2,now*.1,clamp(f.ttl/f.max)*.65);c.restore()}this.screenFX=this.screenFX.filter(f=>f.ttl>0);if(this.flash>0){c.fillStyle=`rgba(249,226,255,${this.flash*.4})`;c.fillRect(0,0,this.w,this.h)}}
}

export function renderHero(canvas,roleId,time,images,{state='idle',mirror=false}={}){if(!canvas)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,im=imageFor(images,'role',roleId),color=role(roleId).color;c.clearRect(0,0,w,h);const x=w*.5,y=h*.92,size=Math.min(w*.98,h*.98);const halo=c.createRadialGradient(x,h*.56,0,x,h*.56,size*.58);halo.addColorStop(0,color+'42');halo.addColorStop(1,'transparent');c.fillStyle=halo;c.fillRect(0,0,w,h);c.fillStyle='#050c1a55';c.beginPath();c.ellipse(x,y-size*.04,size*.24,size*.055,0,0,TAU);c.fill();const row=['active','hurt','death'].includes(state)?2:state==='attack'?1:0,frame=state==='idle'?0:state==='active'?Math.floor(time*3)%2:state==='hurt'?2:state==='death'?3:Math.floor(time*(state==='run'?8:5))%4;artCell(c,actorFrame(images,"roles",roleId,state,frame/4),x,y+Math.sin(time*1.8)*2,size,size,0,1,1,{mirror,anchor:1});for(let j=0;j<6;j++){const px=w*(.2+hash(j,5)*.6),py=(h*hash(j,7)-time*(5+hash(j,8)*8)+h*20)%h;artCell(c,images.vfx,px,py,12,12,0,4,2,{rotation:time*.2,alpha:.14})}}

export function preview(canvas,id,branch,t,images,roleId='dream'){if(!canvas)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,spec=DATA.EQUIPMENT?.[id]||{},kind=spec.family||spec.kind||id,r=role(roleId);branch=({beam:['follow','rotate'],meteor:['heavy','shower'],orbit:['close','far'],rain:['wide','focused'],summon:['swarm','guardian'],star:['pierce','bounce'],clover:['focus','bounce'],arrow:['pierce','fan'],shield:['close','fly'],echo:['heavy','repeat']})[kind]?.[branch==='b'?1:0]||branch;c.clearRect(0,0,w,h);const ground=imageFor(images,'map',roleId==='sadness'?'coast':roleId==='growth'?'forest':'cave');c.fillStyle='#111b2a';c.fillRect(0,0,w,h);if(ground){c.globalAlpha=.2;c.drawImage(ground,0,0,w,h);c.globalAlpha=1}const scale=w/280;c.save();c.scale(scale,h/90);const cx=48,cy=48,hero=actorFrame(images,'roles',roleId,'attack',t,true);artCell(c,hero,cx,cy+23,47,47,0,1,1,{anchor:1});for(let i=0;i<4;i++)artCell(c,actorFrame(images,'monsters',0,'run',t*1.25+i/4,true),153+i*26,36+i%2*25,29,29,0,1,1,{anchor:.6});const line=(points,color='#e4caff',width=3)=>setLine(c,color,width,points.map(([x,y])=>({x,y}))),spark=(x,y,size=19)=>artCell(c,images.vfx,x,y,size,size,0,4,2);
 if(/prism|beam/.test(kind)){const a=/rotate/.test(branch)?Math.sin(t)*.35:Math.sin(t*.6)*.14;line([[cx,cy],[cx+207*Math.cos(a),cy+207*Math.sin(a)]],'#d5b3f188',10);line([[cx,cy],[cx+207*Math.cos(a),cy+207*Math.sin(a)]],'#fff0cf',4)}
 else if(/starfall|meteor|firework/.test(kind)){for(let i=0;i<(/shower/.test(branch)?3:1);i++){const z=(t*.75+i*.25)%1,x=170+i*22;c.strokeStyle='#ffc17d';c.beginPath();c.ellipse(x,62,/shower/.test(branch)?17:33,11,0,TAU);c.stroke();artCell(c,images.icons3,x+20*(1-z),62-65*(1-z),22,22,0,4,2)}}
 else if(/rain|tide|frost|incense|thorns|ward|plush/.test(kind)){const rr=/focused/.test(branch)?21:43;c.fillStyle=colorFor(kind)+'30';c.beginPath();c.ellipse(187,53,rr,24,0,0,TAU);c.fill();for(let j=0;j<6;j++){const x=187+Math.sin(j*17)*rr,y=((t*42+j*13)%47)+10;line([[x,y],[x-3,y+8]],colorFor(kind),1.5)}}
 else if(/seed|summon|growth/.test(kind)){const im=images.companions||images.allies,guard=/guardian/.test(branch),rows=images.companions?3:2;for(let i=0;i<(guard?1:3);i++)artCell(c,im,123+i*34+Math.sin(t*2+i)*9,45+Math.cos(t*2+i)*10,guard?50:29,guard?50:29,Math.floor(t*8)%4+(guard?4:0),4,rows)}
 else if(kind==='shield'){if(branch==='fly'){const x=60+(t*100)%165;artCell(c,images.mainWeapons,x,cy,26,26,DATA.ROLES.findIndex(r=>r.id==='trust'),5,2,{rotation:t*6})}else{const rr=55;c.fillStyle='#f4d79920';c.strokeStyle='#ffe1a4';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,rr,-.9,.9);c.closePath();c.fill();c.stroke();artCell(c,images.mainWeapons,cx+30,cy,28,28,DATA.ROLES.findIndex(r=>r.id==='trust'),5,2)}}
 else if(/moonblade|colorRing|orbit|trust/.test(kind)){const rr=/far/.test(branch)?38:27;for(let i=0;i<4;i++){const a=t*(/far/.test(branch)?1.7:3.6)+i*TAU/4,idx=SUPPORTS.indexOf(id);if(idx>=0)artCell(c,images.equipment,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,19,19,idx,5,4,{rotation:a});else artCell(c,images.icons,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,19,19,1,4,2,{rotation:a})}}
 else if(/lightning|chain/.test(kind)){if(t%1<.7)line(/focus/.test(branch)?[[cx,cy],[153,36]]:[[cx,cy],[153,36],[180,61],[206,36],[232,61]],'#c2efff',3)}
 else if(/joy|pulse|sound/.test(kind)){const rr=(t*45)%78;c.strokeStyle='#ffc5df';c.lineWidth=2;c.beginPath();c.arc(cx,cy,rr,0,TAU);c.stroke()}
 else if(/memory|mirror|hourglass|echo/.test(kind)){const z=t%1;for(let i=0;i<2;i++){const x=70+(t*85+i*43)%180;spark(x,42+i*15,i?14:21)}c.strokeStyle='#c8baff55';c.strokeRect(145,20,63,53)}
 else if(/arrow|lance|wings/.test(kind)){for(let j=0;j<(branch==='fan'?3:1);j++){const x=65+(t*120)%185,y=48+(j-(branch==='fan'?1:0))*15;line([[x-22,y],[x+7,y],[x,y-4],[x+7,y],[x,y+4]],'#f4e4b7',kind==='lance'?3:2);spark(x+5,y,14)}}
 else{const x=64+(t*100)%190;spark(x,48);if(/bounce|luck|clover/.test(branch+kind))line([[82,48],[153,36],[180,61],[207,36]],r.color,1.5)}c.restore()}
