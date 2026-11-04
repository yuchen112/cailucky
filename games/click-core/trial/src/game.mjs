import {VERSION,SAVE_KEY,FACILITIES,UPGRADES,ACHIEVEMENTS,SKINS,fresh,restore,cps,clickPower,facilityRate,tap,cost,affordable,buyFacility,buyUpgrade,upgradeReady,achievementProgress,checkAchievements,tick,catchComet,offline,format,hintFor} from './core.mjs?v=20261104-treeglow1';
import {StarAudio} from './sound.mjs?v=20261104-treeglow1';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),BACKUP=SAVE_KEY+'_backup';
let s=fresh(),offlineReport=null,storageOK=true;
try{const raw=localStorage.getItem(SAVE_KEY);if(raw)s=restore(JSON.parse(raw));}catch{try{s=restore(JSON.parse(localStorage.getItem(BACKUP)));}catch{}}
offlineReport=offline(s);checkAchievements(s);
let screen='loading',section='workshop',storeTab='facilities',modal=null,buyPage=0,collectionPage=0,shopScroll=0,upgradeScroll=0,workPage=0,hover=null,pressed=null,focus=-1,tip='',tipEnds=0,loadCount=0,loadError='',frame=0,last=performance.now(),lastSave=0,lastCheck=0,clickAt=-10,pressPulse=-10,leafPulse=-10,lastBell=-10,screenTime=0,dragScroll=null,holdAt=0,holdStart=0,holdPointer=null,holdLight=0,tapLight=null,holdPoint=null,tabBlocked=false,winPulse=0;
let roomIndex=0, automaticGain=0, automaticTime=0, awayGain=0, awayTime=0, summaryUntil=0, summaryGain=0, productionFloat=null;
const roomLoads=new Set(), roomErrors=new Set();
let W=1440,H=900,scale=1,ox=0,oy=0,mobile=false,shopRect=null;
const A={},buttons=[],particles=[],floaters=[],history=[];
const audio=new StarAudio(()=>s.settings,()=>notify('聲音暫時無法載入，可在設定重新開啟。'));
const now=()=>performance.now()/1000;
const safe=n=>Number.isFinite(n)?format(n):'—';
function persist(){if(tabBlocked)return;try{s.lastSeen=Date.now();const old=localStorage.getItem(SAVE_KEY);if(old)localStorage.setItem(BACKUP,old);localStorage.setItem(SAVE_KEY,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}}
function notify(t){tip=t;tipEnds=now()+3.5;}
function img(name,x,y,w,h,alpha=1){const im=typeof name==='string'?A[name]:name;if(!im)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,x,y,w,h);ctx.restore();}
function fit(name,x,y,w,h,alpha=1){const im=typeof name==='string'?A[name]:name;if(!im)return;const r=Math.min(w/im.width,h/im.height);img(im,x+(w-im.width*r)/2,y+(h-im.height*r)/2,im.width*r,im.height*r,alpha);}
function text(t,x,y,size=18,color='#e9edf7',align='left',weight=400){ctx.save();ctx.font=`${weight} ${size}px "Microsoft JhengHei","Noto Sans TC",sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=['#fff1d6','#263145','#225c47'].includes(color)?color:'#50382c';ctx.fillText(String(t),x,y);ctx.restore();}
function wrap(t,x,y,width,size=17,color='#a7b7cb',line=27){let row='',yy=y;for(const c of t){ctx.font=`${size}px "Microsoft JhengHei",sans-serif`;if(ctx.measureText(row+c).width>width){text(row,x,yy,size,color);yy+=line;row=c;}else row+=c;}if(row)text(row,x,yy,size,color);return yy;}
function panel(x,y,w,h,alpha=1){img('page',x,y,w,h,alpha);}
function inside(p,b){return p&&p.x>=b.x&&p.y>=b.y&&p.x<=b.x+b.w&&p.y<=b.y+b.h;}
function button(label,x,y,w,h,fn,opt={}){const b={label,x,y,w,h,fn,clip:opt.clip,enabled:opt.enabled!==false};buttons.push(b);const hot=b.enabled&&(inside(hover,b)||focus===buttons.length-1),down=b.enabled&&pressed?.label===label&&inside(pressed,b);ctx.save();ctx.globalAlpha=b.enabled?1:.42;if(opt.selected)ctx.filter='saturate(0.7) hue-rotate(21deg)';img('wood',x,y+(down?2:hot?-1:0),w,h,1);ctx.filter='none';text(label,x+w/2,y+h/2+(down?3:hot?-2:0),opt.size||17,opt.selected?'#34523b':'#4a3022','center',opt.primary||opt.selected?700:500);ctx.restore();return b;}
function actionSound(type='tap'){audio.play(type);}
function activate(b){if(!b?.enabled)return;if(!b.tree&&!b.label.startsWith('收集星願'))actionSound(b.label.includes('返回')||b.label==='關閉'?'back':'tap');b.fn();focus=-1;}
function resize(){const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor((innerHeight-4)*dpr));canvas.setAttribute('width',canvas.width);canvas.setAttribute('height',canvas.height);canvas.width=Math.floor(innerWidth-2);canvas.height=Math.floor(innerHeight-5);mobile=innerWidth<800;W=mobile?480:1440;H=mobile?1000:900;scale=Math.min(canvas.width/W,canvas.height/H);ox=(canvas.width-W*scale)/2;oy=(canvas.height-H*scale)/2;}
function coords(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left-ox)/scale,y:(e.clientY-r.top-oy)/scale};}
function checkRewards(){const got=checkAchievements(s);if(got.length){actionSound('achievement');notify('成就達成：'+got[0].name+(got.length>1?' 等 '+got.length+' 項':''));winPulse=now();history.unshift(...got.map(a=>a.name));persist();}}
function purchase(i,quantity=s.buy){const first=!s.owned[i];const result=buyFacility(s,i,quantity);if(!result){actionSound('denied');notify('星願還不夠，換個購買數量試試。');return false;}actionSound('buy');checkRewards();notify(first?FACILITIES[i].role+'的工坊開張了！':FACILITIES[i].short+' +'+result.n);persist();return true;}
function upgrade(id){const u=UPGRADES.find(u=>u.id===id);if(!buyUpgrade(s,id)){actionSound('denied');return;}actionSound('upgrade');notify(u.name+'｜'+u.desc);checkRewards();persist();}
function starTap(point={x:W/2,y:mobile?540:480},repeating=false){
 if(tabBlocked||modal||screen!=='game'||section!=='workshop')return;
 const t=now();if(t-clickAt<.045)return;clickAt=t;
 const result=tap(s);
 leafPulse=t;tapLight=point;
 if(!repeating)pressPulse=t;
 if(t-lastBell>=(repeating?.48:.09)){lastBell=t;actionSound('collect');}
 const recent=floaters.at(-1);
 if(recent&&t-recent.last<.26){recent.gain+=result.gain;recent.last=t;recent.t=Math.min(recent.t,.4);}
 else{if(floaters.length>=3)floaters.shift();floaters.push({x:Math.max(65,Math.min(W-65,point.x)),y:Math.max(270,point.y),t:0,last:t,gain:result.gain});}
}
function burst(x,y,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*140,vy:-60-Math.random()*160,life:0,max:.65+Math.random()*.7,size:8+Math.random()*15});if(particles.length>220)particles.splice(0,particles.length-220);}
function catchStar(){const result=catchComet(s);if(!result)return;actionSound(result.type==='gift'?'cometGift':'cometBoost');notify(result.title+'｜'+(result.gain?'獲得 '+safe(result.gain)+' 星願':result.desc));burst(mobile?240:330,mobile?370:370,35);checkRewards();persist();}
function garden(){const im=mobile?(A.mobileGarden||A.background):A.background;if(!im)return;const k=Math.max(W/im.width,H/im.height);img(im,(W-im.width*k)/2,(H-im.height*k)/2,im.width*k,im.height*k);}
function scene(){garden();const skin=modal?.type==='skins'?modal.preview:s.skin;if(skin!=='midnight'){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.23;ctx.fillStyle={aurora:'#008f75',rose:'#ac3159',cosmos:'#513bbb'}[skin];ctx.fillRect(0,0,W,H);ctx.restore();}
 if(s.settings.motion)for(let i=0;i<5;i++){const x=(i*139.3+frame*2*(i%2?1:-1))%W,y=135+(i*83.7)%Math.max(1,H-210),a=.2+.18*Math.sin(frame+i);fit('spark',x,y,7+i%3*3,7+i%3*3,a);}}
function header(){panel(mobile?12:20,12,mobile?456:1400,mobile?142:112);text('CxQ 星願旅團',mobile?29:43,mobile?35:38,mobile?19:25,'#f0d49a','left',700);text('點亮夢境',mobile?29:44,mobile?62:73,mobile?13:15,'#93b2c7');
 const x=mobile?450:648;text(safe(s.stars),x,mobile?40:45,mobile?29:38,'#fff3cf','right',700);text('星願',x+(mobile?0:12),mobile?72:83,mobile?13:15,'#a8bacb',mobile?'right':'left');
 button('每秒 '+safe(cps(s)),mobile?24:760,mobile?89:24,mobile?156:225,mobile?47:40,()=>modal={type:'production'},{size:mobile?16:18});if(!mobile)text('每次點擊 '+safe(clickPower(s)),mobile?449:864,mobile?113:77,mobile?15:16,'#b3c3d5',mobile?'right':'left');
 if(!mobile){button('收藏',1085,35,92,56,()=>{goTo('collection');collectionPage=0;});button('設定',1187,35,92,56,()=>{goTo('settings');});button('區域地圖',1289,35,106,56,()=>goTo('map'));}}
function goTo(next){
 if(next!=='workshop')summaryUntil=0;
 if(next==='workshop'&&section!=='workshop'){
  if(awayTime>=5&&awayGain>0){summaryGain=awayGain;summaryUntil=now()+3.4;if(s.settings.motion)burst(W/2,mobile?470:408,9);}
  awayTime=0;awayGain=0;
 }
 if(next!==section){floaters.length=0;automaticGain=0;automaticTime=0;productionFloat=null;}
 section=next;holdPoint=null;focus=-1;
}
function openRoom(i){
 if(!s.owned[i])return;
 roomIndex=i;
 goTo('room');
 if(A['room'+i]||roomLoads.has(i))return;
 roomLoads.add(i);
 roomErrors.delete(i);
 const id=String(i+1).padStart(2,'0');
 load('room'+i,'art/regions/'+id+'.webp')
  .then(()=>load('roomWork'+i,'art/regions/'+id+'-work.webp').catch(()=>{}))
  .catch(()=>roomErrors.add(i))
  .finally(()=>roomLoads.delete(i));
}
let treeDelta=0;
function treeArea(){
 const w=mobile?404:615,h=mobile?476:526,x=(W-w)/2,y=mobile?320:234;
 panel(W/2-(mobile?192:236),mobile?176:143,mobile?384:472,62,.94);
 text('全工坊合計 · 每秒 '+safe(cps(s))+' 星願',W/2,mobile?206:174,mobile?19:23,'#225c47','center',700);
 const boosts=[];
 if(s.buffs.production>s.playTime)boosts.push('產量 ×5 · '+Math.ceil(s.buffs.production-s.playTime)+' 秒');
 if(s.buffs.click>s.playTime)boosts.push('點擊 ×12 · '+Math.ceil(s.buffs.click-s.playTime)+' 秒');
 if(boosts.length){
  const by=mobile?790:708;
  panel(W/2-161,by-13,322,30,.94);
  text(boosts.join('  /  '),W/2,by+2,15,'#225c47','center',700);
 }
 const pressAge=now()-pressPulse;
 const compression=s.settings.motion?Math.max(0,1-pressAge/.14)**2*.014:0;
 ctx.save();
 ctx.translate(x+w/2,y+h);
 ctx.scale(1+compression*.4,1-compression);
 ctx.translate(-x-w/2,-y-h);
 fit('tree',x,y,w,h);
 const held=holdPoint&&s.settings.hold&&s.clicks>=500&&now()-holdStart>=.35;
 holdLight=Math.max(0,Math.min(1,holdLight+(held?1:-1)*treeDelta/.5));
 if(holdLight>0){
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.filter='brightness(1.06) drop-shadow(0 0 5px #c28a41)';
  const breath=s.settings.motion?.015*Math.sin(now()*3):0;
  fit('tree',x,y,w,h,holdLight*(.19+breath));
  ctx.restore();
 }
 ctx.restore();
 const glow=now()-leafPulse;
 if(tapLight&&glow<.25){
  const size=30+glow*95;
  fit('spark',tapLight.x-size/2,tapLight.y-size/2,size,size,.9*(1-glow/.25));
 }
 buttons.unshift({label:'點擊星願樹',x,y,w,h,enabled:true,tree:true,fn:()=>starTap()});
 button('收集星願  +'+safe(clickPower(s)),W/2-141,mobile?830:749,282,57,()=>starTap({x:W/2,y:mobile?805:730}),{primary:true,size:20});
}
const regionPositions=[
 [.27,.19],[.74,.19],[.20,.34],[.79,.34],[.16,.49],
 [.84,.49],[.21,.66],[.79,.66],[.15,.83],[.85,.83]
];
function regionMap(){
 const x=mobile?8:132,y=mobile?167:127,w=W-x*2,h=mobile?741:675;
 img('regionMap',x,y,w,h);
 FACILITIES.forEach((f,i)=>{
  const [px,py]=regionPositions[i],open=s.owned[i]>0;
  const size=mobile?75:118,bx=x+w*px-size/2,by=y+h*py-size/2;
  ctx.save();
  if(!open)ctx.filter='brightness(.52) saturate(.55)';
  fit('facility'+i,bx,by,size,size);
  ctx.restore();
  if(open)fit('star',bx+size*.72,by,size*.22,size*.22,.85);
  buttons.push({label:f.role+'的'+f.short+'工坊',x:bx,y:by,w:size,h:size,enabled:true,
   fn:()=>open?openRoom(i):modal={type:'lockedRegion',i}});
 });
}
function room(){
 const i=roomIndex,f=FACILITIES[i],x=mobile?16:232,y=mobile?171:136,w=mobile?448:976,h=mobile?566:525;
 const artwork=A['room'+i];
 const drawRoom=(im,alpha=1)=>{
  const k=Math.max(w/im.width,h/im.height);
  img(im,x+(w-im.width*k)/2,y+(h-im.height*k)/2,im.width*k,im.height*k,alpha);
 };
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 if(artwork)drawRoom(artwork);
 else{
  panel(x,y,w,h,.94);
  fit('facility'+i,x+30,y+76,w-60,h-180);
  if(roomErrors.has(i))button('重新載入工坊',W/2-97,y+h-68,194,48,()=>openRoom(i));
  else text('正在準備工坊…',W/2,y+h-49,19,'#50382c','center');
 }
 const actionFrame=A['roomWork'+i];
 if(s.settings.motion&&actionFrame){
  const duration=2.6+1/(1+Math.log10(Math.max(1,s.owned[i]))*.72);
  const phase=((frame+i*.37)%duration)/duration;
  const mix=Math.max(0,Math.min(1,(phase-.29)/.12,(.83-phase)/.16));
  if(mix>0)drawRoom(actionFrame,mix);
 }
 ctx.restore();
 panel(x+12,y+12,w-24,49,.93);
 text(f.role+'的'+f.short+'工坊',W/2,y+36,mobile?22:27,'#50382c','center',700);
 if(s.settings.motion){const phase=(frame*.44)%1;fit('spark',x+w*.58,y+h*.67-phase*42,17,17,Math.sin(phase*Math.PI)*.6);}
 const milestones=[10,25,50,100].filter(n=>s.owned[i]>=n);
 milestones.forEach((_,j)=>fit('star',x+22+j*24,y+h-36,21,21,.95));
 const rate=facilityRate(s,i)*(s.buffs.production>s.playTime?5:1);
 panel(x,y+h+9,w,mobile?140:132,.95);
 text('持有 '+safe(s.owned[i])+' 個   ·   每秒產出 '+safe(rate)+' 星願',W/2,y+h+36,mobile?18:23,'#225c47','center',700);
 button('增購 1 個 · '+safe(cost(s,i)),W/2-109,y+h+64,218,49,()=>purchase(i,1),{enabled:s.stars>=cost(s,i),size:17});
}
function shop(){const x=mobile?16:830,y=mobile?176:139,w=mobile?448:590,h=mobile?718:657;img('paper',x,y,w,h);button('生產設施',x+14,y+13,(w-38)/2,43,()=>{storeTab='facilities';},{selected:storeTab==='facilities',size:17});button('研究升級',x+24+(w-38)/2,y+13,(w-38)/2,43,()=>{storeTab='upgrades';},{selected:storeTab==='upgrades',size:17});
 if(storeTab==='facilities'){
  [1,10,100,'max'].forEach((n,i)=>button(n==='max'?'最大':'×'+n,x+14+i*(w-22)/4,y+66,(w-40)/4,33,()=>{s.buy=n;persist();},{selected:s.buy===n,size:14}));
  const top=y+110,bottom=y+h-15,row=83;shopRect={x:x+10,y:top,w:w-20,h:bottom-top};shopScroll=Math.max(0,Math.min(shopScroll,Math.max(0,FACILITIES.length*row-shopRect.h)));ctx.save();ctx.beginPath();ctx.rect(shopRect.x,top,shopRect.w,shopRect.h);ctx.clip();
  FACILITIES.forEach((f,i)=>{const ry=top+i*row-shopScroll;if(ry+row<top||ry>bottom)return;fit('facility'+i,x+15,ry+3,75,69,s.total>=f.base*.12||s.owned[i]?1:.4);text(f.name,x+96,ry+19,mobile?15:16,'#e7e4d7','left',600);text('持有 '+s.owned[i]+'  ·  每個 '+safe(f.rate*2**s.upgrades.filter(id=>id.startsWith(`f${i}-`)).length)+'/秒',x+96,ry+43,11,'#91b5c7');const n=s.buy==='max'?affordable(s,i):s.buy,price=n?cost(s,i,n):cost(s,i,1),enabled=n>0&&s.stars>=price;button((s.buy==='max'?'買 '+n+' 個':'購買')+'  '+safe(price),x+w-151,ry+40,132,38,()=>purchase(i),{primary:enabled,enabled,size:14,clip:shopRect});});ctx.restore();
 }else{
  const ready=UPGRADES.filter(u=>upgradeReady(s,u)),future=UPGRADES.filter(u=>!s.upgrades.includes(u.id)&&!upgradeReady(s,u)).sort((a,b)=>a.cost-b.cost),list=[...ready.sort((a,b)=>a.cost-b.cost),...future.slice(0,5)];
  text('已研究 '+s.upgrades.length+' / '+UPGRADES.length,x+22,y+81,14,'#98b3c9');const top=y+105,row=103,bottom=y+h-12;shopRect={x:x+10,y:top,w:w-20,h:bottom-top};upgradeScroll=Math.max(0,Math.min(upgradeScroll,Math.max(0,list.length*row-shopRect.h)));ctx.save();ctx.beginPath();ctx.rect(shopRect.x,top,shopRect.w,shopRect.h);ctx.clip();
  list.forEach((u,i)=>{const ry=top+i*row-upgradeScroll;if(ry+row<top||ry>bottom)return;const unlocked=upgradeReady(s,u),can=unlocked&&s.stars>=u.cost;fit(u.type==='facility'?'facility'+u.i:'star',x+18,ry+13,57,57,unlocked?1:.4);text(u.name,x+86,ry+19,14,'#e6e7de','left',600);text(u.desc,x+86,ry+43,12,'#a9c9cc');if(!unlocked)text(hintFor(s,u),x+86,ry+72,11,'#8198ae');else button('研究 '+safe(u.cost),x+w-155,ry+64,135,28,()=>upgrade(u.id),{primary:can,enabled:can,size:12,clip:shopRect});});ctx.restore();
  if(!list.length)text('目前研究已全部完成。',x+w/2,y+170,18,'#c4d3df','center');
 }
 if(shopRect.h>150){const scroll=storeTab==='facilities'?shopScroll:upgradeScroll;if(scroll>0)text('▲',x+w-16,shopRect.y+8,10,'#dbbc80','right');text(mobile?'上下滑動查看更多':'滾輪捲動查看更多',x+w/2,y+h-7,12,'#8ca4bb','center');}
}
function bottom(){if(mobile){const links=section==='room'?[['星願樹','workshop'],['回地圖','map'],['商店','shop'],['設定','settings']]:[['星願樹','workshop'],['地圖','map'],['商店','shop'],['收藏','collection'],['設定','settings']];const w=448/links.length;links.forEach(([name,id],i)=>button(name,16+i*w,924,w-6,54,()=>goTo(id),{selected:section===id,size:16}));}
 else{panel(20,812,1400,66);text('星願樹 LV.'+(1+Math.floor(Math.log10(1+s.total))),46,844,18,'#f0d49a','left',700);button('星願樹',275,823,150,43,()=>goTo('workshop'),{selected:section==='workshop'});button('區域地圖',446,823,150,43,()=>goTo('map'),{selected:section==='map'||section==='room'});button('工坊商店',617,823,150,43,()=>goTo('shop'),{selected:section==='shop'});text('流星願 '+s.caught+' 顆',860,844,16,'#a2b8cc');button('返回 CxQ',1230,823,170,43,()=>{persist();location.href='../../../index.html?view=game-hub';},{size:16});}}
function comet(){if(!s.event)return;const t=frame,remaining=s.event.ends-s.playTime,x=mobile?350+Math.sin(t)*25:405+Math.sin(t*.8)*65,y=mobile?230+Math.cos(t*.9)*15:240+Math.cos(t*.9)*25;fit('comet',x-60,y-60,120,120);text('流星願 · 點我！',x,y+66,14,'#ffe3a0','center',700);text(Math.ceil(remaining)+' 秒',x,y+85,12,'#b8dce1','center');buttons.push({label:'捕捉流星願',x:x-67,y:y-67,w:134,h:134,enabled:true,fn:catchStar,comet:true});}
function collection(){const x=mobile?16:210,y=mobile?172:142,w=mobile?448:1020,h=mobile?726:654;panel(x,y,w,h);text('星光收藏',x+25,y+34,26,'#f1d8a4','left',700);if(!mobile)button('返回工坊',x+w-180,y+15,156,46,()=>goTo('workshop'));text(s.achievements.length+' / '+ACHIEVEMENTS.length+' 項成就 · 永久收益 +'+s.achievements.length+'%',x+25,y+77,mobile?14:18,'#aacad5');
 const per=mobile?6:12,cols=mobile?2:4,rowH=mobile?139:125;const pages=Math.ceil(ACHIEVEMENTS.length/per);collectionPage=Math.max(0,Math.min(pages-1,collectionPage));ACHIEVEMENTS.slice(collectionPage*per,(collectionPage+1)*per).forEach((a,k)=>{const cw=(w-40-(cols-1)*12)/cols,cx=x+20+(k%cols)*(cw+12),cy=y+112+Math.floor(k/cols)*rowH,done=s.achievements.includes(a.id);panel(cx,cy,cw,rowH-9,done?.9:.62);fit(done?'star':'spark',cx+cw/2-22,cy+8,44,44,done?1:.3);text(a.name,cx+cw/2,cy+65,mobile?13:14,done?'#ffe3ab':'#b2bbca','center',600);const p=achievementProgress(s,a);text(done?'已收藏 · 收益 +1%':safe(Math.min(p,a.need))+' / '+safe(a.need),cx+cw/2,cy+94,mobile?11:12,done?'#99d1cb':'#8da0b5','center');});
 const by=y+h-101;button('上一頁',x+22,by,108,40,()=>collectionPage--,{enabled:collectionPage>0,size:14});text((collectionPage+1)+' / '+pages,x+w/2,by+20,15,'#a9bdce','center');button('下一頁',x+w-130,by,108,40,()=>collectionPage++,{enabled:collectionPage<pages-1,size:14});button('庭院夜景',x+22,y+h-48,w-44,35,()=>{goTo('workshop');modal={type:'skins',preview:s.skin};},{size:14});}
function settingScreen(){const x=mobile?16:305,y=mobile?172:142,w=mobile?448:830,h=mobile?726:654;panel(x,y,w,h);text('遊戲設定',x+26,y+35,26,'#f1d8a4','left',700);button('返回遊戲館',x+24,y+h-56,w-48,42,returnToHub,{size:16});if(!mobile)button('返回工坊',x+w-180,y+15,155,46,()=>goTo('workshop'));
 const row=(label,key,volumeKey,ry)=>{text(label,x+24,ry+20,20,'#dbe5ec','left',600);button(s.settings[key]?'開啟':'關閉',x+w-124,ry,100,43,()=>{s.settings[key]=!s.settings[key];audio.update();persist();if(s.settings[key])actionSound('tap');},{selected:s.settings[key],size:16});const v=Math.round(s.settings[volumeKey]*100);text('音量 '+v+'%',x+24,ry+68,15,'#9eb7c9');const adjust=d=>{s.settings[volumeKey]=Math.round(Math.max(0,Math.min(1,s.settings[volumeKey]+d))*100)/100;audio.update();persist();};button('−',x+w-190,ry+47,68,39,()=>adjust(-.1),{size:22,enabled:v>0});button('＋',x+w-104,ry+47,80,39,()=>adjust(.1),{size:21,enabled:v<100});};
 row('背景音樂','music','musicVolume',y+91);row('操作音效','sound','soundVolume',y+197);
 [['動態演出','motion','減少動態時保留清楚的操作回饋。'],['按住收集','hold',s.clicks>=500?'按住星願樹，每秒收集 4 次。':'累積點擊 500 次後開放。']].forEach(([name,key,desc],i)=>{const ry=y+306+i*75;text(name,x+24,ry+19,19,'#dbe5ec');text(desc,x+24,ry+49,mobile?11:14,'#91adc3');button(s.settings[key]?'開啟':'關閉',x+w-124,ry,100,42,()=>{s.settings[key]=!s.settings[key];persist();},{selected:s.settings[key],enabled:key!=='hold'||s.clicks>=500,size:16});});
 const by=y+477;button('匯出備份',x+24,by,(w-60)/2,49,exportSave,{size:16});button('匯入備份',x+36+(w-60)/2,by,(w-60)/2,49,importSave,{size:16});text(storageOK?'新版進度已獨立保存；不影響舊版存檔。':'儲存失敗，請立即匯出備份。',x+w/2,y+550,mobile?12:16,storageOK?'#9cb7c7':'#ffb6ad','center');text('目前為瀏覽器存檔，換裝置前請匯出備份。',x+w/2,y+578,mobile?11:14,'#94a6bd','center');button('玩法說明',x+24,y+604,w-48,33,showHelp,{size:14});}
function showHelp(){modal={type:'help'};}
function nightPicker(){
 const x=mobile?12:370,y=mobile?754:684,w=W-x*2,h=mobile?147:119;
 panel(x,y,w,h,.97);
 const current=SKINS.find(k=>k.id===modal.preview),can=s.achievements.length>=current.need;
 text(can?current.name:'收藏 '+current.need+' 項成就後解鎖',W/2,y+19,16,'#50382c','center',700);
 const bw=(w-30)/SKINS.length;
 SKINS.forEach((k,i)=>button(k.name,x+15+i*bw,y+32,bw-4,33,()=>{modal.preview=k.id;},{size:mobile?12:14,selected:k.id===modal.preview}));
 button('取消',x+15,y+74,(w-40)/2,34,()=>{modal=null;},{size:15});
 button('套用',x+w/2+5,y+74,(w-40)/2,34,()=>{s.skin=modal.preview;modal=null;persist();actionSound('skin');},{enabled:can,primary:true,size:15});
}
function drawModal(){if(!modal)return;buttons.length=0;if(modal.type==='skins'){nightPicker();return;}ctx.fillStyle='#071322d9';ctx.fillRect(0,0,W,H);const x=mobile?23:390,w=mobile?434:660,y=mobile?216:222,h=mobile?530:470;panel(x,y,w,h);const close=()=>modal=null;
 if(modal.type==='offline'){text('歡迎回到星願樹',W/2,y+51,27,'#f1d8a4','center',700);fit('star',W/2-53,y+86,106,106);text('離線 '+duration(modal.seconds),W/2,y+218,18,'#adcad6','center');text('帶回 '+safe(modal.gain)+' 星願',W/2,y+270,mobile?26:33,'#fff0bc','center',700);text('按平常產量計算，最多累積 24 小時。',W/2,y+317,mobile?13:16,'#9db4c7','center');button('收下星光',x+30,y+h-88,w-60,59,close,{primary:true,size:20});}
 else if(modal.type==='help'){text('簡單點，慢慢變強',W/2,y+44,25,'#f1d8a4','center',700);const lines=['① 點擊星願樹，取得星願。','② 首次購買設施，即可從地圖進入工坊。','③ 買到 10、25、50 個等里程碑，開放升級。','④ 點中流星願，有機會取得收益或暫時加倍。','⑤ 成就永久增加收益，也解鎖庭院夜景。','沒有破關終點，也不需要重置。'];lines.forEach((t,i)=>text(t,x+25,y+105+i*(mobile?49:43),mobile?14:17,i===5?'#edcf91':'#b8cad6'));button('一起收集星願',x+30,y+h-74,w-60,48,close,{primary:true,size:18});}
 else if(modal.type==='production'){
  text('工坊每秒產量',W/2,y+35,24,'#50382c','center',700);
  const boost=s.buffs.production>s.playTime?5:1;
  FACILITIES.forEach((f,i)=>{
   const row=y+73+i*29;
   text(f.role+' · '+f.short,x+26,row,15,'#50382c');
   text(s.owned[i]>0?safe(facilityRate(s,i)*boost):'尚未開張',x+w-26,row,15,'#225c47','right');
  });
  text('總計 '+safe(cps(s))+' 星願 / 秒',W/2,y+367,18,'#225c47','center',700);
  button('關閉',x+25,y+h-62,w-50,40,close,{size:16});
 }
 else if(modal.type==='lockedRegion'){
  const i=modal.i,f=FACILITIES[i],price=cost(s,i,1);
  text(f.role+'的'+f.short+'工坊',W/2,y+42,25,'#50382c','center',700);
  fit('facility'+i,W/2-100,y+69,200,192,.65);
  text('首次購買即可開張 · '+safe(price)+' 星願',W/2,y+293,18,'#50382c','center');
  button('返回地圖',x+28,y+h-81,(w-70)/2,52,close,{size:16});
  button('購買並開張',W/2+8,y+h-81,(w-70)/2,52,()=>{if(purchase(i,1)){modal={type:'openedRegion',i};}},{enabled:s.stars>=price,primary:true,size:16});
 }
 else if(modal.type==='openedRegion'){
  const i=modal.i,f=FACILITIES[i];text(f.role+'的工坊開張了',W/2,y+50,25,'#225c47','center',700);
  fit('facility'+i,W/2-105,y+75,210,214);
  text('每秒產出 '+safe(facilityRate(s,i))+' 星願',W/2,y+316,19,'#225c47','center');
  button('留在地圖',x+28,y+h-81,(w-70)/2,52,close,{size:16});
  button('前往工坊',W/2+8,y+h-81,(w-70)/2,52,()=>{close();openRoom(i);},{primary:true,size:16});
 }
 else if(modal.type==='confirmImport'){text('匯入這份新版備份？',W/2,y+57,25,'#f1d8a4','center',700);text('累積星願 '+safe(modal.save.total),W/2,y+139,21,'#c3d9df','center');text('目前進度會先保留一份備份。',W/2,y+192,16,'#a9becd','center');button('取消',x+25,y+h-88,(w-65)/2,54,close);button('確認匯入',x+40+(w-65)/2,y+h-88,(w-65)/2,54,()=>{const value=modal.save;s=value;offline(s);modal=null;persist();audio.update();actionSound('upgrade');notify('備份匯入完成');},{primary:true});}
 else if(modal.type==='blocked'){text('已在另一個分頁遊玩',W/2,y+64,25,'#f1d8a4','center',700);wrap('為避免進度互相覆蓋，這個分頁已暫停。請關閉其他分頁後，再按下重新載入。',x+30,y+145,w-60,18);button('重新載入',x+30,y+h-90,w-60,58,()=>location.reload(),{primary:true});}
}
function duration(seconds){const m=Math.floor(seconds/60);return m>=60?Math.floor(m/60)+' 小時 '+m%60+' 分鐘':m>=1?m+' 分鐘':Math.floor(seconds)+' 秒';}
function exportSave(){persist();const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='CxQ-星願旅團-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);actionSound('achievement');notify('新版備份已匯出');}
function importSave(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;if(f.size>2e6){notify('備份檔案過大');return;}try{modal={type:'confirmImport',save:restore(JSON.parse(await f.text()))};}catch{notify('不是有效的新版存檔，原進度未變更。');actionSound('denied');}};input.click();}
async function load(name,url){const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('載入失敗：'+url));im.src=url;});A[name]=im;loadCount++;}
async function boot(){resize();screen='loading';loadCount=0;loadError='';try{const list=[['background','art/garden-dusk.webp'],['tree','art/story-tree.webp'],['paper','art/story-paper.webp'],['page','art/story-page.webp'],['wood','art/story-button.webp'],['mobileGarden','art/story-mobile.webp'],['star','art/star.webp'],['spark','art/star.webp'],['comet','art/comet.webp'],...FACILITIES.map((_,i)=>['facility'+i,'art/story-facilities/'+String(i+1).padStart(2,'0')+'.webp']),['regionMap','art/region-map.webp']];await Promise.all(list.map(([name,url])=>load(name,url)));screen='title';last=performance.now();screenTime=now();audio.scene('home');persist();}catch(e){loadError=e.message;}}
function returnToHub(){
 persist();
 location.href='../../../index.html?view=game-hub';
}
function titleScreen(){
 scene();
 const size=mobile?410:530;
 fit('tree',(W-size)/2,mobile?170:90,size,size);
 text('CxQ 星願旅團',W/2,mobile?96:56,mobile?34:42,'#fff2c9','center',700);
 text('點亮夢境',W/2,mobile?145:100,24,'#f8daa1','center',700);
 const y=mobile?630:626;
 button(s.total?'繼續遊戲':'開始遊戲',W/2-145,y,290,57,()=>startGame(),{primary:true,size:22});
 button('遊戲設定',W/2-145,y+70,290,49,()=>startGame('settings'),{size:17});
 button('返回遊戲館',W/2-145,y+130,290,49,returnToHub,{size:17});
}
function startGame(next='workshop'){
 screen='game';
 goTo(next);
 if(next==='workshop'&&offlineReport?.gain>=1&&offlineReport.seconds>=60){
  modal={type:'offline',...offlineReport};
  offlineReport=null;
 }else if(next==='workshop'&&!s.total)modal={type:'help'};
}
function render(t){const dt=Math.min(.1,Math.max(0,(t-last)/1000));last=t;frame=t/1000;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#43322b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,ox,oy);buttons.length=0;shopRect=null;
 if(screen==='title'){titleScreen();}
 else if(screen==='game'){
  if(!document.hidden&&!modal&&!tabBlocked){const before=s.total;
   const appeared=tick(s,dt),produced=Math.max(0,s.total-before);
   if(section==='workshop'){
    automaticGain+=produced;automaticTime+=dt;
    if(automaticTime>=1){
     const carryTime=automaticTime-1;
     const carryGain=dt>0?produced*carryTime/dt:0;
     const secondGain=automaticGain-carryGain;
     productionFloat=secondGain>0?{gain:secondGain,age:0}:null;
     automaticGain=carryGain;automaticTime=carryTime;
    }
   }else{awayGain+=produced;awayTime+=dt;}
   if(appeared&&section==='workshop')actionSound('cometAppear');if(holdPoint&&s.settings.hold&&s.clicks>=500&&now()-holdStart>=.35&&now()-holdAt>=.25){holdAt=now();starTap(holdPoint,true);}if(t-lastCheck>800){checkRewards();lastCheck=t;}if(t-lastSave>5000){persist();lastSave=t;}}
  scene();header();
  if(section==='collection')collection();
  else if(section==='settings')settingScreen();
  else if(section==='shop')shop();
  else if(section==='map')regionMap();
  else if(section==='room')room();
  else{treeDelta=dt;treeArea();comet();}
  bottom();
  audio.scene(section==='collection'?'collection':'home');audio.duck(!!modal);
  for(const p of particles){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;fit('spark',p.x,p.y,p.size,p.size,Math.max(0,1-p.life/p.max));}for(let i=particles.length-1;i>=0;i--)if(particles[i].life>=particles[i].max)particles.splice(i,1);
  if(section==='workshop'&&productionFloat){
   productionFloat.age+=dt;
   const age=productionFloat.age;
   if(age>=1)productionFloat=null;
   else if(now()>=summaryUntil){
    const y=(mobile?300:258)-(s.settings.motion?age*35:0);
    ctx.save();ctx.globalAlpha=Math.min(1,(1-age)*3);
    img('wood',W/2-109,y-17,218,34);
    text('工坊 +'+safe(productionFloat.gain),W/2,y,20,'#225c47','center',700);
    ctx.restore();
   }
  }
  if(section==='workshop'&&now()<summaryUntil){
   const y=mobile?253:269;
   img('wood',W/2-143,y-20,286,40);
   text('離開期間工坊產出 +'+safe(summaryGain),W/2,y,16,'#225c47','center',700);
  }
  floaters.forEach(f=>{f.t+=dt;ctx.save();ctx.globalAlpha=Math.min(1,(1-f.t)*3);img('wood',f.x-62,f.y-(s.settings.motion?f.t*62:0)-16,124,32,.92);text('+'+safe(f.gain),f.x,f.y-(s.settings.motion?f.t*62:0),20,'#50382c','center',700);ctx.restore();});for(let i=floaters.length-1;i>=0;i--)if(floaters[i].t>1)floaters.splice(i,1);
  drawModal();if(now()<tipEnds&&!modal){const tw=mobile?448:740,tx=(W-tw)/2,ty=section==='room'?(mobile?674:598):(mobile?860:729);panel(tx,ty,tw,53);text(tip,W/2,ty+26,mobile?12:17,'#f7e4b7','center',600);}
 }else{if(A.background)garden();panel(W/2-185,H/2-110,370,205);text('CxQ 星願旅團',W/2,H/2-75,34,'#f6d89f','center',700);text('點亮夢境',W/2,H/2-22,23,'#c7dbe7','center');text(loadError||'正在點亮庭院…',W/2,H/2+34,mobile?13:17,'#92bdcc','center');if(loadError)button('重新載入',W/2-130,H/2+90,260,58,boot,{primary:true});}
 const labels=buttons.filter(b=>b.enabled).map(b=>b.label).join('、'),aria='CxQ 星願旅團 '+screen+'。'+labels;if(canvas.getAttribute('aria-label')!==aria)canvas.setAttribute('aria-label',aria);
 const data={screen,section,region:section==='room'?roomIndex+1:0,unlocked:s.owned.filter(n=>n>0).length,productionFloat:productionFloat?.gain.toFixed(2)||'',stars:s.stars.toFixed(2),total:s.total.toFixed(2),cps:cps(s).toFixed(2),clicks:s.clicks,owned:s.owned.reduce((a,b)=>a+b,0),upgrades:s.upgrades.length,achievements:s.achievements.length,event:s.event?'active':'none',modal:modal?.type||'',audio:audio.status(),storage:storageOK?'ok':'error',version:'20261104-treeglow1'};for(const [k,v]of Object.entries(data))if(canvas.dataset[k]!==String(v))canvas.dataset[k]=String(v);requestAnimationFrame(render);
}
function hit(p){for(let i=buttons.length-1;i>=0;i--)if(buttons[i].enabled&&inside(p,buttons[i])&&(!buttons[i].clip||inside(p,buttons[i].clip)))return buttons[i];return null;}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();audio.unlock();canvas.setPointerCapture(e.pointerId);const p=coords(e),b=hit(p);pressed=b?{...p,label:b.label}:null;if(b?.tree){starTap(p);holdPoint=p;holdPointer=e.pointerId;holdStart=holdAt=now();pressed=null;}else if(shopRect&&inside(p,shopRect)){dragScroll={point:p,last:p,moved:false,start:storeTab==='facilities'?shopScroll:upgradeScroll};}});
canvas.addEventListener('pointermove',e=>{const p=coords(e);hover=p;if(holdPoint&&holdPointer===e.pointerId&&!hit(p)?.tree)holdPoint=null;if(dragScroll){const dy=p.y-dragScroll.point.y;if(Math.abs(dy)>9){dragScroll.moved=true;pressed=null;if(storeTab==='facilities')shopScroll=Math.max(0,dragScroll.start-dy);else upgradeScroll=Math.max(0,dragScroll.start-dy);}dragScroll.last=p;}});
canvas.addEventListener('pointerup',e=>{const p=coords(e);if(pressed&&!dragScroll?.moved){const b=hit(p);if(b?.label===pressed.label&&Math.hypot(p.x-pressed.x,p.y-pressed.y)<20)activate(b);}pressed=null;dragScroll=null;holdPoint=null;});
canvas.addEventListener('pointercancel',()=>{pressed=null;dragScroll=null;holdPoint=null;});canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===holdPointer)holdPoint=null;});canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('wheel',e=>{const p=coords(e);if(shopRect&&inside(p,shopRect)){e.preventDefault();if(storeTab==='facilities')shopScroll+=e.deltaY/scale;else upgradeScroll+=e.deltaY/scale;}},{passive:false});
canvas.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
addEventListener('keydown',e=>{audio.unlock();if(e.key==='Tab'){e.preventDefault();focus=(focus+(e.shiftKey?-1:1)+buttons.length)%buttons.length;return;}if(e.key==='Enter'&&focus>=0){e.preventDefault();activate(buttons[focus]);return;}if(e.key==='Escape'){e.preventDefault();if(modal&&modal.type!=='blocked')modal=null;else goTo(section==='room'?'map':'workshop');return;}if(e.code==='Space'&&screen==='game'&&section==='workshop'&&!modal){e.preventDefault();if(!e.repeat)starTap({x:mobile?250:300,y:mobile?340:420});}});
document.addEventListener('visibilitychange',()=>{audio.hidden(document.hidden);holdPoint=null;if(document.hidden)persist();else{offlineReport=offline(s);if(offlineReport.gain>=1&&offlineReport.seconds>=60)modal={type:'offline',...offlineReport};last=performance.now();persist();}});
addEventListener('pagehide',persist);addEventListener('resize',resize);
// A storage notification prevents concurrent game tabs from overwriting each other.
addEventListener('storage',e=>{if(e.key===SAVE_KEY&&e.newValue){tabBlocked=true;modal={type:'blocked'};audio.hidden(true);}});
boot();requestAnimationFrame(render);
