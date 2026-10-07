import {BY_ID,STAGES} from './cast.mjs?v=20261007-duel6';
import {WIDTH,FLOOR} from './core.mjs?v=20261007-duel6';
const HEIGHT=788;
export function renderer(canvas,preferences){const ctx=canvas.getContext('2d',{alpha:false}),images=new Map(),effects=[];let lastEvent=0,shake=0,resizeNeeded=true;
 const resize=()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,preferences().quality==='low'?1:1.5);const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}resizeNeeded=false;};
 const observer=new ResizeObserver(()=>resizeNeeded=true);observer.observe(canvas);
 async function load(src){if(images.has(src))return images.get(src);const p=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('圖片載入失敗：'+src));image.src=src;});images.set(src,p);try{const img=await p;images.set(src,img);return img;}catch(e){images.delete(src);throw e;}}
 async function prepare(match){const stage=STAGES.find(s=>s.id===match.stage)||STAGES[0];await Promise.all([load(stage.art),...match.fighters.flatMap(f=>Object.values(BY_ID[f.id].poses).map(load))]);effects.length=0;lastEvent=0;resizeNeeded=true;}
 function mesh(img,x,y,w,h,phase,walk,alpha=1){const inherited=ctx.globalAlpha;ctx.globalAlpha=alpha*inherited;const bands=preferences().quality==='low'?8:16;for(let i=0;i<bands;i++){const p=i/bands,sy=Math.floor(img.height*p),sh=Math.min(img.height-sy,Math.ceil(img.height/bands)+1);const offset=walk?Math.sin(phase-p*5)*(p>.67?7:2)*walk:Math.sin(phase+p*2)*1.2;ctx.drawImage(img,0,sy,img.width,sh,x+offset,y+p*h,w,h/bands+1.2);}ctx.globalAlpha=inherited;}
 function drawFighter(f,m){const c=BY_ID[f.id],poses=c.poses,ready=images.get(poses.ready),cast=images.get(poses.cast),victory=images.get(poses.victory);if(!ready||ready instanceof Promise)return;const floorY=f.y;
  ctx.save();ctx.fillStyle='#0a121155';ctx.beginPath();ctx.ellipse(f.x,FLOOR+7,75*(1-Math.min(200,FLOOR-floorY)/400),13,0,0,Math.PI*2);ctx.fill();ctx.restore();
  let w=280,h=280,lean=0,castAmount=0,walk=Math.abs(f.vx)>25&&!f.action&&!f.stun&&f.y===FLOOR?Math.min(1,Math.abs(f.vx)/350):0;const phase=f.poseTime*(walk?17:2.8);
  if(f.action){const a=f.action,p=a.t/a.start;castAmount=a.t<a.start?Math.max(0,p-.45)*1.8:a.t<a.start+a.active?1:Math.max(0,1-(a.t-a.start-a.active)/a.end);lean=(a.key==='heavy'?.08:.04)*Math.sin(Math.min(1,a.t/(a.start+a.active))*Math.PI);}
  if(f.held.down&&f.y===FLOOR&&!f.action)h*=.79;
  if(f.held.guard&&!f.action){lean=-.07;h*=.94;}
  if(f.y<FLOOR){h*=1.025;lean=f.vx/500*.06;}
  if(f.stun){lean=-.16;w*=1.04;h*=.95;}
  const isWinner=m.phase==='round'&&m.result?.winner===f.index;
  ctx.save();ctx.translate(f.x,floorY);ctx.scale(f.facing,1);ctx.rotate(lean);
  if(f.knock||f.hp<=0&&!isWinner){ctx.translate(0,-40);ctx.rotate(-1.15);w=250;h=250;}
  if(f.invuln>0&&Math.floor(m.clock*20)%2===0)ctx.globalAlpha=.65;
  const bob=f.y===FLOOR&&!f.knock?Math.sin(phase)*(walk?3:1.6):0;
  if(isWinner&&victory)mesh(victory,-w/2,-h+bob,w,h,phase,0);
  else {mesh(ready,-w/2,-h+bob,w,h,phase,walk,1-Math.min(1,castAmount));if(castAmount>.01&&cast)mesh(cast,-w/2+castAmount*5,-h+bob,w,h,phase,0,Math.min(1,castAmount));}

  ctx.restore();
  if(f.shield>0||f.held.guard&&!f.action){ctx.save();ctx.strokeStyle=f.shield>0?'#f8d7b5':'#b9eff4';ctx.lineWidth=4;ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(f.x+f.facing*14,f.y-130,83,135,0,-Math.PI*.55,Math.PI*.55);ctx.stroke();ctx.restore();}
 }
 function star(x,y,r,color,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.4:r;const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();ctx.restore();}
 function effect(e,m){const age=m.clock-e.at;if(age>e.life)return;const p=age/e.life;ctx.save();ctx.globalAlpha=1-p;const color=e.color||'#ffe0a0';if(e.type==='hit'||e.type==='counter'||e.type==='block'||e.type==='shield'){const r=(e.type==='block'?38:60)*(1-p)+18;ctx.lineWidth=5;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3+e.id;star(e.x+Math.cos(a)*p*100,e.y+Math.sin(a)*p*70,10*(1-p),color,a);}if(e.damage){ctx.fillStyle=e.type==='heal'?'#b5efc4':'#fff2c7';ctx.font='bold 27px sans-serif';ctx.textAlign='center';ctx.fillText((e.type==='heal'?'+':'')+e.damage,e.x,e.y-30-p*70);}}ctx.restore();}
 function draw(m,alpha=0){if(resizeNeeded)resize();ctx.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);const stage=STAGES.find(s=>s.id===m.stage)||STAGES[0],bg=images.get(stage.art);ctx.fillStyle=stage.tint;ctx.fillRect(0,0,WIDTH,HEIGHT);if(bg&&!(bg instanceof Promise))ctx.drawImage(bg,0,0,WIDTH,HEIGHT);
  const shade=ctx.createLinearGradient(0,0,0,HEIGHT);shade.addColorStop(0,'#071e2659');shade.addColorStop(.3,'#071e2600');shade.addColorStop(1,'#071e2666');ctx.fillStyle=shade;ctx.fillRect(0,0,WIDTH,HEIGHT);
  for(const e of m.events){if(e.id<=lastEvent)continue;lastEvent=e.id;if(['hit','counter','block','shield','heal'].includes(e.type)){effects.push({...e,life:.55});if(e.type==='hit'&&!preferences().reducedMotion)shake=5;} }
  while(effects.length>(preferences().quality==='low'?14:36))effects.shift();
  ctx.save();if(shake>0){ctx.translate(Math.sin(m.clock*91)*shake,Math.cos(m.clock*87)*shake*.5);shake*=.8;}
  for(const z of m.zones){ctx.save();ctx.globalAlpha=z.delay>0?.3:.75;ctx.fillStyle=BY_ID[m.fighters[z.owner].id].color;ctx.beginPath();ctx.ellipse(z.x,FLOOR,z.radius,18,0,0,Math.PI*2);ctx.fill();if(z.delay<=0){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=5;for(let j=0;j<5;j++){const x=z.x+(j-2)*z.radius*.35;ctx.beginPath();ctx.moveTo(x,FLOOR);ctx.lineTo(x+Math.sin(m.clock*9+j)*22,FLOOR-160-Math.sin(j+m.clock)*20);ctx.stroke();}}ctx.restore();}
  const ordered=[...m.fighters].sort((a,b)=>!!a.action-!!b.action);for(const f of ordered)drawFighter(f,m);
  for(const p of m.projectiles){ctx.save();ctx.globalAlpha=.24;ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x-p.vx/35,p.y,p.radius*2,p.radius*.75,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;star(p.x,p.y,p.radius,p.color,m.clock*4);star(p.x,p.y,p.radius*.45,'#fff8da',-m.clock*3);ctx.restore();}
  for(const e of effects)effect(e,m);for(let i=effects.length-1;i>=0;i--)if(m.clock-effects[i].at>effects[i].life)effects.splice(i,1);ctx.restore();
  if(m.flash>0&&!preferences().reducedMotion){ctx.fillStyle='#f7eccc'+Math.round(m.flash*80).toString(16).padStart(2,'0');ctx.fillRect(0,0,WIDTH,HEIGHT);}
  if(preferences().hitboxes){for(const f of m.fighters){ctx.strokeStyle='#6ffff0';ctx.lineWidth=2;ctx.strokeRect(f.x-42,f.y-205,84,205);if(f.action){ctx.strokeStyle='#ff796a';const a=f.action;ctx.strokeRect(f.facing>0?f.x:f.x-a.reach,f.y-190,a.reach,150);}}}
 }
 return{prepare,draw,resize:()=>resizeNeeded=true,dispose(){observer.disconnect();}};
}
