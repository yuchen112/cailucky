import {isBoss} from './enemy-catalog.mjs?v=20261007-names1';
import {activeEffects,clamp,skillRecipients} from './animation-state.mjs?v=20261007-names1';
import {SPELL_ART} from './motion.mjs?v=20261007-names1';
const impactArt={bolt:'anim-impact',crystal:'anim-shatter',gear:'anim-impact',spore:'projectile-spore',frost:'projectile-frost',glow:'fx-light',wind:'fx-rune',bloom:'fx-petal'};
// All decorative marks are independently authored raster assets, never canvas shapes.
export function drawCombatEffects({s,pads,corePoint,image,sprite,ctx,roles,reduced=false,simple=false}){
 const text=(value,x,y,alpha=1,color='#fff8dc')=>{ctx.save();ctx.globalAlpha=clamp(alpha);ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.strokeStyle='#153d32';ctx.lineWidth=3;const px=clamp(x,45,345),py=clamp(y,18,565);ctx.strokeText(value,px,py);ctx.fillText(value,px,py);ctx.restore();};
 const mark=(id,x,y,size,alpha=1)=>image(id,x-size/2,y-size/2,size,size,clamp(alpha));
 const particles=(id,x,y,age,count=5)=>{if(reduced||simple)return;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;mark(id,x+Math.cos(a)*age*42,y+Math.sin(a)*age*28-age*16,8+age*7,(1-age)*.65);}};
 const effects=activeEffects(s,{reduced,simple}),labels=new Set(effects.filter(e=>e.type==='hit').slice(-8).map(e=>e.id));
 for(const e of effects){
  const age=s.time-e.time;
  if(e.type==='hit'){
   const p=age/.45,art=impactArt[e.kind]||SPELL_ART[e.kind]||'anim-impact',size=reduced?24:24+Math.sin(p*Math.PI)*24;
   mark(art,e.x,e.y-15,size,1-p);if(e.splash&&!simple&&!reduced)mark(art,e.x,e.y-10,Math.min(110,e.splash*2)*(.5+p*.5),(1-p)*.25);
   if(labels.has(e.id)&&(e.critical||!simple))text((e.critical?'暴擊 ':'')+Math.round(e.damage),e.x,e.y-42-(reduced?0:p*18),1-p,e.critical?'#ffe084':'#fff8dc');
  }
  if(e.type==='upgrade'||e.type==='deploy'){
   const p=pads[e.pad],duration=e.type==='upgrade'?.95:.55,k=age/duration;
   mark('anim-rise',p.x,p.y-28,reduced?66:60+28*k,(1-k)*.75);particles('fx-light',p.x,p.y-24,k);
   if(e.type==='upgrade')text('Lv.'+e.level+' 升級',p.x,p.y-72-(reduced?0:k*10),1-k);
  }
  if(e.type==='sell'){const p=pads[e.pad];mark('anim-dissolve',p.x,p.y-24,50,1-age/.5);}
  if(e.type==='defeat-enemy'){
   const k=age/.65,h=isBoss(e.kind)?80:52;
   if(!reduced&&k<.6){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(k*.22);sprite(e.kind,0,0,h,1-k/.6);ctx.restore();}
   mark('anim-dissolve',e.x,e.y-h*.4,reduced?32:32+30*k,(1-k)*.65);particles('fx-light',e.x,e.y-20,k,4);
  }
  if(e.type==='shield-break'){const k=age/.65;mark('anim-shatter',e.x,e.y-20,44+k*20,1-k);}
  if(e.type==='enemy-heal'){mark('fx-petal',e.x,e.y-20,48,1-age/.9);text('敵方治療',e.x,e.y-54,1-age/.9);}
  if(e.type==='enemy-rage'){mark('fx-spark',e.x,e.y-20,42,1-age/.8);text('狂暴加速',e.x,e.y-54,1-age/.8);}
  if(e.type==='enemy-shield'){mark('fx-rune',e.x,e.y-20,48,1-age/.8);text('護甲強化',e.x,e.y-54,1-age/.8);}
  if(e.type==='cast-interrupted'){text('技能打斷',e.x,e.y-54,1-age/.8);}
  if(e.type==='boss-ward'){const k=age/.65,art={chill:'projectile-frost',summon:'fx-spark',haste:'anim-impact',ward:'fx-rune'}[e.ability]||'fx-rune';mark(art,e.x,e.y-24,reduced?64:64+26*k,1-k);text({chill:'冰霜壓制',summon:'援軍召喚',haste:'發條加速',ward:'群體護甲'}[e.ability]||'群體護甲',e.x,e.y-70,1-k);if(e.ability==='chill')for(const t of s.towers)if(t.chillUntil>s.time){const p=pads[t.pad];mark('projectile-frost',p.x,p.y-24,32,(1-k)*.7);}particles(art,e.x,e.y-24,k,4);}
  if(e.type==='boss-warning'){const k=age/1.2;mark('target',e.x,e.y,42+(reduced?0:Math.sin(k*Math.PI*4)*4));}
  if(e.type==='hero-skill'){
   const offensive=['dream','night','sadness','memory','hope'].includes(e.role);if(offensive)continue;const k=age/.9,art=SPELL_ART[roles[e.role].kind];
   for(const p of skillRecipients(s,e,pads,corePoint)){mark(art,p.x,p.y-20,reduced?40:36+35*k,(1-k)*.75);particles(art,p.x,p.y-20,k,3);}
  }
 }
 // Persistent statuses track actual expiration times, not a decorative timer.
 for(const t of s.towers){const p=pads[t.pad],remaining=Math.max(t.heroPowerUntil||0,t.trustUntil||0,s.hero?.hasteUntil||0)-s.time;if(remaining>0||t.luckyCharges>0)mark(t.luckyCharges>0?'fx-clover':'fx-light',p.x-23,p.y-28,20,t.luckyCharges>0?.65:clamp(remaining/.4)*.65);}
}
