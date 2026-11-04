import {ART,THEMES,LEVELS,SLIDE_SIZES,JIG_GRIDS,chooseArt,createSlide,slide,solved,createJigsaw,piecePath,target,snapJigsaw,emptySave,validateSave,complete} from './core.mjs?v=20261101-audio1';
import {RealmAudio} from './audio.mjs?v=original1';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const IS_TRIAL=location.pathname.endsWith('/play.html');
const KEY='cxq_picture_realm_v1',BACKUP=KEY+'_previous';
let save=emptySave(),storageOK=true;
try{const raw=localStorage.getItem(KEY);if(raw)save=validateSave(JSON.parse(raw));}catch{try{save=validateSave(JSON.parse(localStorage.getItem(BACKUP)));}catch{} }
const soundtrack=new RealmAudio({settings:()=>save.settings,onError:()=>notify('聲音載入失敗，請檢查網路後重新開啟音樂。')});
const sound=(type='tap')=>soundtrack.play(type);
const pictures=new Map(),assets={},buttons=[];
let W=1280,H=800,scale=1,ox=0,oy=0,portrait=false,screen='loading',mode='slide',level=0,rotation=false,page=0,theme=-1,game=null,currentImage=null,paused=false,peekUntil=0,flashUntil=0,flashId=null,selected=null,drag=null,panning=null,zoom=1,pan={x:0,y:0},viewerZoom=1,viewerPan={x:0,y:0},backFromView='gallery',message='',messageUntil=0,dialog=null,focus=-1,loaded=0,loadingError='',lastTick=performance.now(),lastPersist=0,winAt=0,firstUnlock=false,slideAnim=null,downButton=null,fullView=null,sessionLoaded=false;
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
const artById=id=>ART.find(a=>a.id===id);
function loadImage(url){if(pictures.has(url))return pictures.get(url);const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('圖片載入失敗：'+url));image.src=url;});pictures.set(url,promise);promise.catch(()=>pictures.delete(url));return promise;}
function persist(){if(game&&screen==='play'&&!solvedGame())save.active=structuredClone(game);save.updated=Date.now();try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(BACKUP,old);localStorage.setItem(KEY,JSON.stringify(save));storageOK=true;}catch{storageOK=false;} }
function notify(text){message=text;messageUntil=performance.now()+3500;}
let hoverPoint=null,lastUiScreen='',uiEntered=0;const uiMotion=new Map();
const sliceCache=new Map();
function nineSlice(im,x,y,w,h,border=24,fraction=.2){
 if(!im)return;const key=im.src+':'+w+':'+h+':'+border+':'+fraction;let stamp=sliceCache.get(key);
 if(!stamp){stamp=document.createElement('canvas');stamp.width=Math.ceil(w*2);stamp.height=Math.ceil(h*2);const c=stamp.getContext('2d'),cut=Math.floor(Math.min(im.width,im.height)*fraction),bx=Math.round(border*2),by=bx,xs=[0,cut,im.width-cut,im.width],ys=[0,cut,im.height-cut,im.height],dx=[0,bx,stamp.width-bx,stamp.width],dy=[0,by,stamp.height-by,stamp.height];
 for(let j=0;j<3;j++)for(let i=0;i<3;i++)c.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],dx[i],dy[j],dx[i+1]-dx[i],dy[j+1]-dy[j]);sliceCache.set(key,stamp);}
 ctx.drawImage(stamp,x,y,w,h);
}
function overlay(){ctx.save();ctx.globalAlpha=.94;image(assets.background,0,0,W,H);ctx.restore();}
function requestStart(){if(save.active)dialog={title:'開始新的挑戰？',lines:['你還有一局尚未完成。','開始後會取代原局進度，收藏仍保留。'],yes:()=>startNew()};else startNew();}
function modeCard(kind,x,y,w,h){
 const isSlide=kind==='slide',icon=isSlide?assets.slideIcon:assets.jigsawIcon,title=isSlide?'圖片華容道':'凹凸拼圖';panel(x,y,w,h);
 if(portrait){fit(icon,x+10,y+15,116,100);text(title,x+137,y+36,25,'#514365','left','700');text(isSlide?'滑動方塊，讓圖景歸位。':'拼合碎片，收藏完整故事。',x+138,y+72,14,'#887990');button(isSlide?'開始華容道':'開始拼圖',x+232,y+82,w-251,51,()=>chooseMode(kind),{primary:true,size:15});}
 else{fit(icon,x+15,y+16,116,116);text(title,x+144,y+48,26,'#514365','left','700');text(isSlide?'3×3 至 6×6':'12 至 120 片',x+145,y+87,16,'#887990');text(isSlide?'每一步，都靠近完整圖景。':'讓每一片，找到它的位置。',x+24,y+152,15,'#887990');button(isSlide?'開始華容道':'開始拼圖',x+22,y+179,w-44,58,()=>chooseMode(kind),{primary:true,size:18});}
}

function text(s,x,y,size=20,color='#514365',align='left',weight='400'){
 const remap={};for(const k of ['#f6eedc','#fff1d0','#f7e5b8','#fff0ca','#f3dfb5','#f8e5b9','#e5d3a6','#f8e7bc','#f1ddb5','#ffedc1','#f8e6bc','#f8e7bc','#f7e9ca','#ffedc2','#f8e7bc','#e6cf9a'])remap[k]='#514365';
 for(const k of ['#c5b78f','#cbd0dd','#d9dce6','#c4bca9','#c7c2ca','#d7d4df','#b8b9cc','#c7c5d4','#cad2e1','#cad2e1','#c1bed2','#d1d5e1','#d6d9e5','#c1c7d5','#c7c7d5','#d0c6b4','#c5c3d1','#bcb7cc','#ced1de','#d9dce7','#b7b7c9','#d9dce7','#cad2e1'])remap[k]='#887990';
 ctx.save();ctx.font=weight+' '+size+'px "Microsoft JhengHei", "Noto Sans TC", sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=remap[color]||color;ctx.fillText(s,x,y);ctx.restore();
}
function image(img,x,y,w,h,alpha=1){if(!img)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,x,y,w,h);ctx.restore();}
function fit(img,x,y,w,h,alpha=1){if(!img)return;const k=Math.min(w/img.width,h/img.height);image(img,x+(w-img.width*k)/2,y+(h-img.height*k)/2,img.width*k,img.height*k,alpha);}
function panel(x,y,w,h){nineSlice(assets.panel,x,y,w,h,Math.min(25,w/5,h/5),.16);}
function button(label,x,y,w,h,action,options={}){
 const enabled=options.enabled!==false,index=buttons.length,key=label+':'+x+':'+y;
 const inside=p=>p&&p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
 const hot=enabled&&(inside(hoverPoint)||focus===index),pressed=enabled&&downButton&&inside(downButton);
 let m=uiMotion.get(key);if(!m){m={lift:0,press:0};uiMotion.set(key,m);}m.lift+=((hot?1:0)-m.lift)*.24;m.press+=((pressed?1:0)-m.press)*.4;
 const primary=options.primary||options.selected||/^(開始|隨機抽圖|繼續遊戲|再抽一張|確認|下載原圖)/.test(label);
 buttons.push({label,x,y,w,h,action,enabled});ctx.save();ctx.globalAlpha=enabled?1:.42;ctx.translate(x+w/2,y+h/2-m.lift*3+m.press*4);const k=1-m.press*.035;ctx.scale(k,k);
 nineSlice(primary?assets.primary:assets.button,-w/2,-h/2,w,h,Math.min(28,h*.4),.38);
 text(label,0,-2,options.size||Math.min(20,(w-30)/Math.max(1,label.length)),primary?'#fff':'#66527b','center',primary?'700':'600');ctx.restore();return index;
}
function heading(title,subtitle){text('CxQ  /  幻裝圖境',portrait?28:58,32,14,'#94839f','left','600');text(title,portrait?28:58,portrait?83:89,portrait?31:38,'#514365','left','700');if(subtitle)text(subtitle,portrait?28:58,portrait?126:137,portrait?14:17,'#887990');}
function topBack(action=()=>goMenu()){button('返回',W-(portrait?116:174),19,portrait?94:116,48,action,{size:17});}
function goMenu(){if(game&&screen==='play')persist();screen='menu';paused=false;dialog=null;focus=-1;}
function resize(){canvas.width=innerWidth-2;canvas.height=innerHeight-8;portrait=innerWidth/innerHeight<1.05;W=portrait?480:1280;H=portrait?900:800;scale=Math.min(canvas.width/W,canvas.height/H);ox=(canvas.width-W*scale)/2;oy=(canvas.height-H*scale)/2;}
async function boot(){resize();screen='loading';loadingError='';loaded=0;try{
 const entries=[['background','board-background'],['homeWide','home-wide'],['homeTall','home-tall'],['panel','surface'],['button','button-secondary'],['primary','button-primary'],['slideIcon','slide-icon'],['jigsawIcon','jigsaw-icon'],['albumIcon','album-icon'],['titleArt','title']];
 await Promise.all(entries.map(async([name,url])=>{assets[name]=await loadImage('art/ui-v2/'+url+'.webp');loaded++;}));
 assets.back=await loadImage('art/card-back.webp');assets.cover=assets.homeWide;screen='menu';sessionLoaded=true;
 }catch(e){loadingError=e.message;}}
function backdrop(alpha=1){const im=screen==='menu'?(portrait?assets.homeTall:assets.homeWide):assets.background;if(!im)return;const k=Math.max(W/im.width,H/im.height);image(im,(W-im.width*k)/2,(H-im.height*k)/2,im.width*k,im.height*k,alpha);}
function mainMenu(){
 const collected=Object.keys(save.unlocked).length;
 if(portrait){
  text('CxQ  PICTURE ATELIER',28,35,14,'#85708f','left','700');text(collected+' / 30 收藏',452,35,14,'#85708f','right','600');
  fit(assets.titleArt,25,65,366,114);text('把每一種模樣，拼成珍藏。',30,205,18,'#85708f');
  modeCard('slide',30,475,420,140);modeCard('jigsaw',30,630,420,140);
  if(save.active){button('繼續遊戲',28,797,192,60,resumeGame,{primary:true,size:20});button('圖鑑',234,797,101,60,()=>{screen='gallery';page=0;},{size:20});button('設定',349,797,103,60,()=>screen='settings',{size:20});}else{button('收藏圖鑑',30,797,200,60,()=>{screen='gallery';page=0;});button('遊戲設定',250,797,200,60,()=>screen='settings');}
  text(IS_TRIAL?'試玩版':'隨機挑戰 · 收藏你的角色圖景',W/2,883,12,'#94839f','center');
 }else{
  text('CxQ  PICTURE ATELIER',64,54,16,'#85708f','left','700');
  fit(assets.titleArt,60,113,451,143);text('把每一種模樣，',67,295,23,'#85708f');text('拼成你的獨家珍藏。',67,332,23,'#85708f');
  text('選一種玩法，隨機遇見新的角色圖景',68,381,18,'#766180','left','600');
  modeCard('slide',64,426,338,247);modeCard('jigsaw',424,426,338,247);
  button('收藏圖鑑  '+collected+'/30',64,712,239,56,()=>{screen='gallery';page=0;});
  if(save.active)button('繼續上次遊戲',325,712,230,56,resumeGame);
  button('設定',1110,712,112,56,()=>screen='settings');
  text(IS_TRIAL?'製作中試玩版':'30 張角色圖景 · 隨機挑戰',1215,40,13,'#85708f','right');
 }
}
function chooseMode(m){mode=m;screen='choose';focus=-1;}
function chooseScreen(){
 heading(mode==='slide'?'圖片華容道':'凹凸拼圖','選擇難度，隨機開啟一張尚未收藏的圖景。');topBack();
 const icon=mode==='slide'?assets.slideIcon:assets.jigsawIcon;
 if(portrait){
  fit(icon,175,166,130,130);text('挑戰難度',28,327,19,'#66527b','left','700');
  LEVELS.forEach((label,i)=>{const x=28+(i%2)*224,y=355+Math.floor(i/2)*84;button(label+' · '+(mode==='slide'?SLIDE_SIZES[i]+'×'+SLIDE_SIZES[i]:JIG_GRIDS[i][0]*JIG_GRIDS[i][1]+' 片'),x,y,204,65,()=>level=i,{selected:level===i,size:20});});
  const on=mode==='slide'?save.settings.numbers:rotation;
  panel(28,545,424,106);text(mode==='slide'?'數字輔助':'拼片旋轉',49,581,19,'#66527b','left','600');text(mode==='slide'?'協助辨認方塊位置':'需要把散片轉回正確方向',49,615,13,'#887990');
  button(on?'開啟':'關閉',333,570,94,52,()=>{if(mode==='slide'){save.settings.numbers=!save.settings.numbers;persist();}else rotation=!rotation;},{selected:on,size:18});
  text(mode==='slide'?'利用空格移動方塊，還原完整圖片。':'拖曳拼片接合，組合後可以一起移動。',W/2,704,15,'#887990','center');
  button('隨機抽圖 · 開始',28,756,424,75,requestStart,{primary:true,size:23});text('完成任何難度，即可解鎖完整收藏圖。',W/2,860,13,'#887990','center');
 }else{
  panel(54,194,1172,494);fit(icon,90,240,240,240);text(mode==='slide'?'滑動，讓圖景歸位。':'一片片，拼回完整故事。',213,525,21,'#66527b','center','700');text('30 張角色圖 · 隨機出現',213,570,16,'#887990','center');
  text('挑戰難度',394,247,21,'#66527b','left','700');
  LEVELS.forEach((label,i)=>{const x=390+(i%2)*395,y=285+Math.floor(i/2)*88;button(label+' · '+(mode==='slide'?SLIDE_SIZES[i]+'×'+SLIDE_SIZES[i]:JIG_GRIDS[i][0]*JIG_GRIDS[i][1]+' 片'),x,y,364,68,()=>level=i,{selected:level===i,size:22});});
  const on=mode==='slide'?save.settings.numbers:rotation;
  text(mode==='slide'?'數字輔助':'拼片旋轉',403,513,22,'#66527b','left','600');text(mode==='slide'?'協助辨認方塊位置':'啟用後，散片也會隨機旋轉',403,549,16,'#887990');button(on?'開啟':'關閉',1036,496,119,57,()=>{if(mode==='slide'){save.settings.numbers=!save.settings.numbers;persist();}else rotation=!rotation;},{selected:on,size:19});
  button('隨機抽圖 · 開始挑戰',390,590,768,70,requestStart,{primary:true,size:24});
  text('完成任何難度，即可解鎖完整收藏圖。',W/2,741,17,'#887990','center');
 }
}
async function startNew(){dialog=null;const art=chooseArt(save.unlocked,save.last),seed=crypto.getRandomValues(new Uint32Array(1))[0];game={mode,level,artId:art.id,seed,elapsed:0,moves:0,assists:0,rotation,created:Date.now()};if(mode==='slide')game.board=createSlide(SLIDE_SIZES[level]).board;else Object.assign(game,createJigsaw(level,seed,rotation));save.last=art.id;save.active=structuredClone(game);persist();await enterGame();}
async function enterGame(cue='start'){screen='loadingGame';try{currentImage=await loadImage(artById(game.artId).file);screen='play';sound(cue);paused=false;peekUntil=0;selected=null;drag=null;zoom=1;pan={x:0,y:0};lastTick=performance.now();lastPersist=lastTick;focus=-1;}catch(e){screen='error';loadingError=e.message;} }
async function resumeGame(){game=structuredClone(save.active);if(game.mode==='jigsaw'){const j=createJigsaw(game.level,game.seed,game.rotation);game.edges=j.edges;game.cols=j.cols;game.rows=j.rows;}await enterGame('resume');}
function solvedGame(){return game?.mode==='slide'?solved(game.board):game?.pieces?.every(p=>p.locked);}
function finish(){firstUnlock=complete(save,game);sound('win');if(firstUnlock)setTimeout(()=>{if(screen==='win'&&!document.hidden)sound('unlock');},650);screen='win';winAt=performance.now();persist();notify(firstUnlock?'新圖鑑已解鎖！':'挑戰完成！');}
function layout(){if(portrait){const size=game?.mode==='jigsaw'?400:416;return {x:(480-size)/2,y:157,size,tray:{x:32,y:637,w:416,h:150},controlY:805};}return {x:216,y:147,size:560,tray:{x:825,y:169,w:330,h:500},controlY:727};}
function drawSquareImage(img,x,y,size,alpha=1){image(img,x,y,size,size,alpha);}
function slideBoard(){const b=layout(),n=SLIDE_SIZES[game.level],d=b.size/n;panel(b.x-19,b.y-19,b.size+38,b.size+38);if(performance.now()<peekUntil){drawSquareImage(currentImage,b.x,b.y,b.size);return;}game.board.forEach((v,i)=>{if(v===n*n-1&&!solvedGame())return;let x=b.x+(i%n)*d,y=b.y+Math.floor(i/n)*d;if(slideAnim&&v===slideAnim.id){const t=Math.min(1,(performance.now()-slideAnim.at)/150),ease=1-(1-t)**3;x=b.x+(slideAnim.from%n)*d+((i%n)-(slideAnim.from%n))*d*ease;y=b.y+Math.floor(slideAnim.from/n)*d+(Math.floor(i/n)-Math.floor(slideAnim.from/n))*d*ease;if(t===1)slideAnim=null;}ctx.drawImage(currentImage,(v%n)*currentImage.width/n,Math.floor(v/n)*currentImage.height/n,currentImage.width/n,currentImage.height/n,x+1,y+1,d-2,d-2);ctx.strokeStyle='#e7ddec';ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,d-2,d-2);if(save.settings.numbers){ctx.save();ctx.shadowColor='#000';ctx.shadowBlur=6;text(v+1,x+10,y+17,Math.max(13,24-n),'#fff','left','700');ctx.restore();}});if(portrait){text('點擊空格相鄰的方塊移動',W/2,614,17,'#d7d4df','center');text('鍵盤也可使用方向鍵操作',W/2,646,14,'#b8b9cc','center');text(`圖片將在通關後加入圖鑑`,W/2,690,16,'#e6cf9a','center');}else{panel(825,175,352,440);fit(assets.albumIcon,940,190,120,108,.9);text('還原整張圖片',1001,320,24,'#f3dfb5','center');text('點擊空格旁的方塊移動',1001,365,18,'#d7d4df','center');text('方向鍵也能操作',1001,400,16,'#c7c5d4','center');text('完成挑戰後',1001,468,18,'#f3dfb5','center');text('解鎖高清收藏圖',1001,503,21,'#f3dfb5','center');text('短暫看圖會計入提示次數',1001,557,15,'#c7c5d4','center');}}
function pieceSurface(p,b){const t=target(p.id,game.cols,game.rows);return {x:b.x+p.x*b.size,y:b.y+p.y*b.size,w:b.size/game.cols,h:b.size/game.rows,tx:t.x,ty:t.y};}
function drawPiece(p,b,alpha=1){const s=pieceSurface(p,b);ctx.save();ctx.globalAlpha=alpha;ctx.translate(s.x+s.w/2,s.y+s.h/2);ctx.rotate(p.rot*Math.PI/2);ctx.translate(-s.w/2,-s.h/2);piecePath(ctx,s.w,s.h,game.edges[p.id]);ctx.save();ctx.clip();ctx.drawImage(currentImage,-s.tx*b.size,-s.ty*b.size,b.size,b.size);ctx.restore();ctx.lineWidth=p.locked?.8:1.4;ctx.strokeStyle=p.id===selected?'#8e66bd':p.locked?'#ded0e8':'#9986ae';ctx.stroke();ctx.restore();}
function jigsawTransform(b){ctx.translate(b.x+b.size/2,b.y+b.size/2);ctx.scale(zoom,zoom);ctx.translate(-b.x-b.size/2+pan.x,-b.y-b.size/2+pan.y);}
function arrangeTray(){if(!game||game.mode!=='jigsaw')return;const pieces=game.pieces.filter(p=>!p.locked),order=pieces.sort((a,b)=>a.id-b.id),b=layout(),cols=portrait?8:4,rows=Math.ceil(order.length/cols);order.forEach((p,i)=>{p.group=p.id;p.x=1.11+(i%cols)*(.58/cols);p.y=.04+Math.floor(i/cols)*(.88/Math.max(1,rows));});persist();}
function trayPosition(p,b){const all=game.pieces.filter(v=>!v.locked&&v.x>1.05&&(!game.edgeOnly||game.edges[v.id].some(e=>e===0)));const pages=Math.max(1,Math.ceil(all.length/(portrait?12:24)));game.trayPage=Math.min(game.trayPage||0,pages-1);const loose=all.slice(game.trayPage*(portrait?12:24),(game.trayPage+1)*(portrait?12:24)),idx=loose.indexOf(p),cols=4,rows=Math.ceil(loose.length/cols);if(idx<0)return null;const pad=portrait?9:21,cw=(b.tray.w-2*pad)/cols,ch=(b.tray.h-2*pad)/Math.max(1,rows),factor=Math.min((cw*.82)/(b.size/game.cols),(ch*.82)/(b.size/game.rows),portrait?.85:1.05);return {cx:b.tray.x+pad+(idx%cols+.5)*cw,cy:b.tray.y+pad+(Math.floor(idx/cols)+.5)*ch,hitW:cw,hitH:ch,factor};}
function drawTrayPiece(p,b,tp){ctx.save();const s=pieceSurface(p,b);ctx.translate(tp.cx,tp.cy);ctx.scale(tp.factor,tp.factor);ctx.translate(-(s.x+s.w/2),-(s.y+s.h/2));drawPiece(p,b);ctx.restore();}
function jigsawBoard(){const b=layout();panel(b.x-18,b.y-18,b.size+36,b.size+36);panel(b.tray.x-12,b.tray.y-12,b.tray.w+24,b.tray.h+24);const looseCount=game.pieces.filter(v=>!v.locked&&v.x>1.05&&(!game.edgeOnly||game.edges[v.id].some(e=>e===0))).length,pages=Math.max(1,Math.ceil(looseCount/(portrait?12:24)));text(`散片 ${(game.trayPage||0)+1}/${pages}`,b.tray.x+b.tray.w/2,b.tray.y-(portrait?27:34),16,'#e5d3a6','center');button('前頁',b.tray.x,b.tray.y-49,portrait?78:90,35,()=>game.trayPage=Math.max(0,(game.trayPage||0)-1),{size:13,enabled:(game.trayPage||0)>0});button('後頁',b.tray.x+b.tray.w-(portrait?78:90),b.tray.y-49,portrait?78:90,35,()=>game.trayPage=Math.min(pages-1,(game.trayPage||0)+1),{size:13,enabled:(game.trayPage||0)<pages-1});ctx.save();ctx.beginPath();ctx.rect(b.x-13,b.y-13,b.size+26,b.size+26);ctx.clip();jigsawTransform(b);if(save.settings.ghost)drawSquareImage(currentImage,b.x,b.y,b.size,.17);if(performance.now()<peekUntil)drawSquareImage(currentImage,b.x,b.y,b.size,.93);const onBoard=game.pieces.filter(p=>p.locked||p.x<=1.05);onBoard.sort((a,c)=>Number(c.locked)-Number(a.locked)).forEach(p=>drawPiece(p,b));if(performance.now()<flashUntil&&flashId!==null){const t=target(flashId,game.cols,game.rows);ctx.strokeStyle='#a978c9';ctx.lineWidth=4/zoom;ctx.strokeRect(b.x+t.x*b.size,b.y+t.y*b.size,b.size/game.cols,b.size/game.rows);}ctx.restore();game.pieces.filter(p=>!p.locked&&p.x>1.05).forEach(p=>{const tp=trayPosition(p,b);if(tp)drawTrayPiece(p,b,tp);});if(drag?.fromTray){ctx.save();const p=game.pieces.find(x=>x.id===drag.id);if(p){const s=pieceSurface(p,b);ctx.translate(drag.pointer.x-(s.x+s.w/2),drag.pointer.y-(s.y+s.h/2));drawPiece(p,b);}ctx.restore();}const count=game.pieces.filter(p=>p.locked).length;text(`${count} / ${game.pieces.length} 片`,portrait?W/2:999,portrait?574:694,16,'#e5d3a6','center');}
function playScreen(){
 text(game.mode==='slide'?'圖片華容道':'凹凸拼圖',portrait?26:58,32,portrait?23:27,'#514365','left','700');text(LEVELS[game.level]+'  /  '+time(game.elapsed)+'  /  '+game.moves+' 步',portrait?26:58,75,portrait?16:18,'#887990');button('暫停',W-(portrait?122:177),18,portrait?96:118,51,()=>{paused=true;persist();},{size:18});
 if(game.mode==='slide')slideBoard();else jigsawBoard();const y=layout().controlY;
 if(game.mode==='slide'){button('看圖 3 秒',portrait?25:238,y,portrait?134:210,58,peek);button('復原一步',portrait?173:487,y,portrait?134:210,58,undo,{enabled:game.history?.length>0});button('回首頁',portrait?321:736,y,portrait?134:210,58,()=>{persist();goMenu();});}
 else{const labels=[['看圖',peek],['底圖',()=>{save.settings.ghost=!save.settings.ghost;persist();}],['邊緣',()=>{game.edgeOnly=!game.edgeOnly;notify(game.edgeOnly?'只顯示邊緣散片':'顯示全部散片');}],['提示',hint],['旋轉',rotateSelected],['放大',()=>setZoom(zoom+.25)],['縮小',()=>setZoom(zoom-.25)],['重置',()=>{zoom=1;pan={x:0,y:0};}]];labels.forEach(([label,fn],i)=>button(label,portrait?22+(i%4)*113:43+i*150,portrait?791+Math.floor(i/4)*53:y,portrait?100:137,portrait?46:54,fn,{size:portrait?16:18,selected:(label==='底圖'&&save.settings.ghost)||(label==='邊緣'&&game.edgeOnly),enabled:label!=='旋轉'||game.rotation}));}if(paused)pauseScreen();
}
function setZoom(z){zoom=Math.max(.75,Math.min(3,z));}
function peek(){sound('hint');peekUntil=performance.now()+3000;game.assists++;persist();}
function undo(){if(!game.history?.length)return;sound('undo');game.board=game.history.pop();game.moves++;game.assists++;persist();}
function hint(){const p=game.pieces.find(x=>x.id===selected&&!x.locked)||game.pieces.find(x=>!x.locked);if(!p)return;sound('hint');selected=p.id;flashId=p.id;flashUntil=performance.now()+3000;game.assists++;notify(`第 ${p.id+1} 片的位置已標示，請自行拼合`);persist();}
function rotateSelected(){const p=game?.pieces?.find(x=>x.id===selected);if(!p||p.locked){sound('error');notify('請先點選一張未固定的散片');return;}if(!game.rotation){sound('error');notify('本局未啟用拼片旋轉');return;}if(game.pieces.filter(x=>x.group===p.group).length>1){sound('error');notify('已拼接成組的拼片不再旋轉');return;}sound('rotate');p.rot=(p.rot+1)%4;game.moves++;persist();}
function pauseScreen(){buttons.length=0;overlay();const x=portrait?26:374,w=portrait?428:532,y=portrait?230:201;panel(x,y,w,portrait?432:402);text('休息一下',W/2,y+57,31,'#514365','center','700');text('進度已保存，計時暫停。',W/2,y+104,17,'#887990','center');button('繼續遊戲',x+36,y+151,w-72,64,()=>{paused=false;lastTick=performance.now();},{primary:true});button('保存並回首頁',x+36,y+232,w-72,58,()=>{persist();goMenu();});button('返回 CxQ',x+36,y+307,w-72,53,()=>{persist();location.href='../../index.html#game-hub';},{size:17});}
function galleryScreen(){heading('角色圖鑑','每一次完成，都是一張新的珍藏。  '+Object.keys(save.unlocked).length+' / 30');topBack();
 const filters=['全部',...THEMES];filters.forEach((t,i)=>{const cols=portrait?4:7,bw=portrait?103:162;button(t,portrait?25+(i%cols)*112:51+i*170,portrait?158+Math.floor(i/cols)*53:173,bw,44,()=>{theme=i-1;page=0;},{size:portrait?13:16,selected:theme===i-1});});
 const list=theme<0?ART:ART.filter(a=>a.theme===THEMES[theme]),per=portrait?4:8,cols=portrait?2:4,start=portrait?288:257,cw=portrait?202:270,ch=portrait?238:218,pages=Math.ceil(list.length/per);page=Math.max(0,Math.min(pages-1,page));
 list.slice(page*per,page*per+per).forEach((a,i)=>{const x=portrait?26+(i%cols)*228:56+(i%cols)*297,y=start+Math.floor(i/cols)*ch,s=portrait?154:146;panel(x,y,cw,ch-8);const unlocked=!!save.unlocked[a.id],img=unlocked?assets['thumb'+a.id]:assets.albumIcon;
  if(unlocked){if(img)image(img,x+(cw-s)/2,y+12,s,s);else loadImage(a.thumb).then(im=>assets['thumb'+a.id]=im).catch(()=>{});}else{fit(img,x+(cw-116)/2,y+24,116,110,.4);text('尚未解鎖',x+cw/2,y+149,15,'#a698b2','center');}
  text(unlocked?a.title:'未知圖景 '+a.id,x+cw/2,y+(portrait?184:175),portrait?17:18,unlocked?'#66527b':'#9d8daa','center','600');
  if(unlocked){const marks=Object.keys(save.records).filter(k=>k.startsWith(a.id+':')).length;text(marks+' / 8 挑戰',x+cw/2,y+(portrait?209:196),12,'#887990','center');}
  buttons.push({label:unlocked?'欣賞 '+a.title:'尚未解鎖 '+a.id,x,y,w:cw,h:ch-8,enabled:true,action:()=>unlocked?openViewer(a.id,'gallery'):notify('完成隨機挑戰後，就能收藏這張圖片。')});});
 const fy=portrait?834:738;button('上一頁',portrait?27:430,fy,127,50,()=>page--,{enabled:page>0,size:16});text((page+1)+' / '+pages,W/2,fy+24,17,'#887990','center');button('下一頁',portrait?326:724,fy,127,50,()=>page++,{enabled:page<pages-1,size:16});
}
async function openViewer(id,back){if(!save.unlocked[id])return;screen='loadingGame';backFromView=back;fullView=artById(id);viewerZoom=1;viewerPan={x:0,y:0};try{assets.view=await loadImage(fullView.original);screen='viewer';sound('page');}catch(e){notify('高清圖片載入失敗，可重試');screen=back;}}
function viewerScreen(){heading(fullView.title,`${fullView.theme} · 已解鎖高清收藏`);topBack(()=>screen=backFromView);const s=portrait?438:590,x=(W-s)/2,y=portrait?157:150;panel(x-15,y-15,s+30,s+30);ctx.save();ctx.beginPath();ctx.rect(x,y,s,s);ctx.clip();ctx.translate(W/2+viewerPan.x,y+s/2+viewerPan.y);ctx.scale(viewerZoom,viewerZoom);image(assets.view,-s/2,-s/2,s,s);ctx.restore();const by=portrait?654:747;button('放大',portrait?26:280,by,portrait?130:170,50,()=>viewerZoom=Math.min(4,viewerZoom+.5));button('縮小',portrait?175:472,by,portrait?130:170,50,()=>viewerZoom=Math.max(1,viewerZoom-.5));button('下載原圖',portrait?324:664,by,portrait?130:210,50,downloadArt);if(portrait){text('可拖曳看細節，下載保留完整原圖。',240,743,15,'#c7c7d5','center');text('手機亦可用下方按鈕開原圖，長按儲存。',240,776,13,'#c7c7d5','center');button('開啟原圖',95,813,290,52,()=>window.open(fullView.original,'_blank','noopener'));}else button('開啟原圖',900,by,170,50,()=>window.open(fullView.original,'_blank','noopener'));}
function downloadArt(){if(!fullView||!save.unlocked[fullView.id])return;const a=document.createElement('a');a.href=fullView.original;a.download=`CxQ-${fullView.id}-${fullView.title}.png`;document.body.appendChild(a);a.click();a.remove();sound('download');notify('已開始下載完整高清原圖');}
function winScreen(){heading(firstUnlock?'新圖景，收藏成功！':'挑戰完成！',LEVELS[game.level]+' · '+time(game.elapsed)+' · '+game.moves+' 步 · 提示 '+game.assists);const s=portrait?352:482,x=(W-s)/2,y=portrait?181:178;panel(x-12,y-12,s+24,s+24);const t=Math.min(1,(performance.now()-winAt)/420),k=.94+.06*(1-(1-t)**3);ctx.save();ctx.translate(W/2,y+s/2);ctx.scale(k,k);image(currentImage,-s/2,-s/2,s,s);ctx.restore();text(artById(game.artId).title,W/2,portrait?575:696,25,'#514365','center','700');const by=portrait?625:737;button('欣賞大圖',portrait?29:226,by,portrait?422:260,portrait?65:57,()=>openViewer(game.artId,'win'));button('再抽一張',portrait?29:510,portrait?709:by,portrait?422:260,portrait?65:57,()=>{mode=game.mode;level=game.level;rotation=game.rotation;startNew();},{primary:true});button('返回首頁',portrait?29:794,portrait?793:by,portrait?422:260,portrait?58:57,goMenu);}
function settingsScreen(){
 heading('遊戲設定','音樂與音效可獨立調整，設定會自動保存。');topBack();
 const x=portrait?26:260,w=portrait?428:760;panel(x,166,w,portrait?654:563);
 const settings=save.settings;
 const audioRow=(label,key,volumeKey,y)=>{
  const volume=Math.round((settings[volumeKey]??(key==='music'?.45:.7))*100);
  text(label,x+24,y+22,21,'#66527b','left','600');
  button(settings[key]?'開啟':'關閉',x+w-119,y,95,47,()=>{settings[key]=!settings[key];soundtrack.update();persist();if(settings[key])sound('tap');},{selected:settings[key],size:17});
  text('音量 '+volume+'%',x+24,y+73,16,'#887990');
  const adjust=delta=>{settings[volumeKey]=Math.round(Math.max(0,Math.min(1,(settings[volumeKey]??.7)+delta))*100)/100;soundtrack.update();persist();sound('tap');};
  button('−',x+w-179,y+51,68,43,()=>adjust(-.1),{size:24,enabled:volume>0});button('＋',x+w-95,y+51,68,43,()=>adjust(.1),{size:24,enabled:volume<100});
 };
 audioRow('背景音樂','music','musicVolume',188);audioRow('遊戲音效','sound','soundVolume',301);
 [['華容道數字','numbers'],['拼圖底圖','ghost']].forEach(([name,key],i)=>{const y=421+i*69;text(name,x+24,y+24,21,'#66527b','left','600');button(settings[key]?'開啟':'關閉',x+w-119,y,95,47,()=>{settings[key]=!settings[key];persist();},{selected:settings[key],size:17});});
 text('配樂會在首次操作後播放，切到背景自動停止。',W/2,portrait?586:579,portrait?13:16,'#887990','center');
 const by=portrait?624:617;button('匯出收藏備份',x+24,by,(w-64)/2,60,exportSave,{size:portrait?16:20});button('匯入備份',x+40+(w-64)/2,by,(w-64)/2,60,importSave,{size:portrait?16:20});
 text(storageOK?'收藏與進度保存在目前瀏覽器。':'儲存空間不足，請先匯出備份。',W/2,portrait?726:762,portrait?14:16,storageOK?'#887990':'#bf6b71','center');
 if(portrait)text('換手機前請先匯出收藏備份。',W/2,766,13,'#887990','center');
}
function exportSave(){persist();const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CxQ-幻裝圖境-${new Date().toISOString().slice(0,10)}.json`;a.click();sound('download');setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importSave(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;if(f.size>3e6){notify('備份檔案過大');return;}try{const imported=validateSave(JSON.parse(await f.text()));dialog={title:'匯入這份備份？',lines:[`備份收藏：${Object.keys(imported.unlocked).length} / 30 張`,'目前進度會先保留一份瀏覽器備份。'],yes:()=>{save=imported;soundtrack.update();sound('download');game=null;persist();dialog=null;notify('備份匯入完成');}};}catch{notify('檔案格式不正確，原存檔未變更');}};input.click();}
function drawDialog(){buttons.length=0;overlay();const x=portrait?25:340,w=portrait?430:600,y=portrait?250:230;panel(x,y,w,355);text(dialog.title,W/2,y+61,27,'#514365','center','700');dialog.lines.forEach((s,i)=>text(s,W/2,y+125+i*34,portrait?14:18,'#887990','center'));button('取消',x+29,y+248,(w-76)/2,62,()=>dialog=null);button('確認',x+47+(w-76)/2,y+248,(w-76)/2,62,dialog.yes,{primary:true});}
function render(now){
 soundtrack.setScene(screen==='play'?(game?.mode==='jigsaw'?'jigsaw':'slide'):['gallery','viewer','win'].includes(screen)?'gallery':'home',paused||!!dialog);
 const dt=Math.min(.1,(now-lastTick)/1000);lastTick=now;if(screen==='play'&&!paused&&!dialog&&document.visibilityState==='visible'){game.elapsed+=dt;if(now-lastPersist>5000){persist();lastPersist=now;}}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#f5edee';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,ox,oy);if(assets.background)backdrop();buttons.length=0;
 if(lastUiScreen!==screen){lastUiScreen=screen;uiEntered=now;hoverPoint=null;focus=-1;}
 ctx.save();ctx.globalAlpha=Math.min(1,(now-uiEntered)/180);
 switch(screen){case 'menu':mainMenu();break;case 'choose':chooseScreen();break;case 'play':playScreen();break;case 'gallery':galleryScreen();break;case 'viewer':viewerScreen();break;case 'win':winScreen();break;case 'settings':settingsScreen();break;case 'error':heading('載入遇到問題',loadingError);button('重試',W/2-150,H/2,300,64,enterGame,{primary:true});button('返回首頁',W/2-150,H/2+85,300,58,goMenu);break;default:text('CxQ 幻裝圖境',W/2,H/2-45,32,'#604578','center','700');text(loadingError||(screen==='loadingGame'?'正在打開新的圖景…':'正在準備畫室… '+loaded+'/10'),W/2,H/2+15,18,'#887990','center');if(loadingError)button('重新載入',W/2-150,H/2+80,300,60,boot);}
 ctx.restore();if(dialog)drawDialog();if(messageUntil>now&&screen!=='win'){const y=screen==='win'?95:H-132;panel(portrait?22:330,y,portrait?436:620,65);text(message,W/2,y+30,portrait?13:17,'#66527b','center');}
 const aria='CxQ 幻裝圖境 '+screen+'。'+buttons.filter(b=>b.enabled).map(b=>b.label).join('、');if(canvas.getAttribute('aria-label')!==aria)canvas.setAttribute('aria-label',aria);canvas.dataset.screen=screen;canvas.dataset.moves=game?.moves||0;canvas.dataset.collected=Object.keys(save.unlocked).length;canvas.dataset.ui='atelier-v2';const audioStatus=soundtrack.status();canvas.dataset.audio=audioStatus.state;canvas.dataset.music=audioStatus.track;canvas.dataset.musicEnabled=String(save.settings.music);canvas.dataset.soundEnabled=String(save.settings.sound);canvas.dataset.musicVolume=String(save.settings.musicVolume);canvas.dataset.soundVolume=String(save.settings.soundVolume);canvas.dataset.audioVoices=String(audioStatus.voices);canvas.dataset.audioCue=audioStatus.cue;requestAnimationFrame(render);
}
function coords(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left-ox)/scale,y:(e.clientY-r.top-oy)/scale};}
function hitButton(p){for(let i=buttons.length-1;i>=0;i--){const b=buttons[i];if(b.enabled&&p.x>=b.x&&p.y>=b.y&&p.x<=b.x+b.w&&p.y<=b.y+b.h)return b;}return null;}
function doSlide(index){if(slideAnim||performance.now()<peekUntil)return;const n=SLIDE_SIZES[game.level],next=slide(game.board,index,n);if(!next)return;const id=game.board[index];game.history ||= [];game.history.push([...game.board]);if(game.history.length>100)game.history.shift();slideAnim={id,from:index,at:performance.now()};game.board=next;game.moves++;sound('slide');if(solvedGame())finish();else persist();}
function boardPoint(p,b){return {x:((p.x-b.x-b.size/2)/zoom+b.size/2-pan.x)/b.size,y:((p.y-b.y-b.size/2)/zoom+b.size/2-pan.y)/b.size};}
function hitPiece(p,b){for(let i=game.pieces.length-1;i>=0;i--){const piece=game.pieces[i];if(piece.locked)continue;const edge=game.edges[piece.id].some(e=>e===0);if(game.edgeOnly&&!edge&&piece.x>1.05)continue;const tp=piece.x>1.05?trayPosition(piece,b):null,s=pieceSurface(piece,b);ctx.save();ctx.setTransform(1,0,0,1,0,0);let px,py;if(tp){px=(p.x-tp.cx)/tp.factor;py=(p.y-tp.cy)/tp.factor;}else{if(p.x<b.x||p.x>b.x+b.size||p.y<b.y||p.y>b.y+b.size){ctx.restore();continue;}const q=boardPoint(p,b);px=(q.x-piece.x)*b.size-s.w/2;py=(q.y-piece.y)*b.size-s.h/2;}const angle=-piece.rot*Math.PI/2,c=Math.cos(angle),ss=Math.sin(angle),lx=px*c-py*ss+s.w/2,ly=px*ss+py*c+s.h/2;piecePath(ctx,s.w,s.h,game.edges[piece.id]);const hit=tp?(Math.abs(p.x-tp.cx)<tp.hitW*.48&&Math.abs(p.y-tp.cy)<tp.hitH*.48):ctx.isPointInPath(lx,ly);ctx.restore();if(hit)return piece;}return null;}
canvas.addEventListener('pointerdown',e=>{soundtrack.unlock();e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=coords(e),btn=hitButton(p);if(btn){downButton={label:btn.label,x:p.x,y:p.y};return;}if(dialog||paused)return;if(screen==='viewer'){panning={start:p,pan:{...viewerPan},viewer:true};return;}if(screen!=='play')return;if(game.mode==='slide'){const b=layout(),n=SLIDE_SIZES[game.level],x=Math.floor((p.x-b.x)/b.size*n),y=Math.floor((p.y-b.y)/b.size*n);if(x>=0&&x<n&&y>=0&&y<n)doSlide(y*n+x);return;}const b=layout(),piece=hitPiece(p,b);if(piece){sound('pickup');selected=piece.id;drag={id:piece.id,start:p,pointer:p,original:game.pieces.filter(v=>v.group===piece.group).map(v=>({id:v.id,x:v.x,y:v.y})),fromTray:piece.x>1.05};const group=game.pieces.filter(v=>v.group===piece.group);game.pieces=game.pieces.filter(v=>v.group!==piece.group).concat(group);}else if(p.x>=b.x&&p.x<=b.x+b.size&&p.y>=b.y&&p.y<=b.y+b.size)panning={start:p,pan:{...pan}};});
canvas.addEventListener('pointermove',e=>{hoverPoint=coords(e);if(!drag&&!panning)return;e.preventDefault();const p=coords(e);if(drag){drag.pointer=p;if(!drag.fromTray){const b=layout(),dx=(p.x-drag.start.x)/(b.size*zoom),dy=(p.y-drag.start.y)/(b.size*zoom);drag.original.forEach(old=>{const v=game.pieces.find(v=>v.id===old.id);v.x=old.x+dx;v.y=old.y+dy;});}}else if(panning.viewer)viewerPan={x:panning.pan.x+p.x-panning.start.x,y:panning.pan.y+p.y-panning.start.y};else pan={x:panning.pan.x+(p.x-panning.start.x)/zoom,y:panning.pan.y+(p.y-panning.start.y)/zoom};});
canvas.addEventListener('pointerup',e=>{const p=coords(e);if(downButton){const btn=hitButton(p);if(btn&&btn.label===downButton.label&&Math.hypot(p.x-downButton.x,p.y-downButton.y)<20){activateButton(btn);}downButton=null;}if(drag){const b=layout(),piece=game.pieces.find(v=>v.id===drag.id),moved=Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5,inside=p.x>=b.x&&p.x<=b.x+b.size&&p.y>=b.y&&p.y<=b.y+b.size;if(moved){if(drag.fromTray&&inside){const q=boardPoint(p,b);piece.x=q.x-.5/game.cols;piece.y=q.y-.5/game.rows;}else if(!inside){drag.original.forEach(old=>{const v=game.pieces.find(v=>v.id===old.id);v.x=old.x;v.y=old.y;});}if(inside){game.moves++;const snapped=snapJigsaw(game.pieces,piece.id,game.cols,game.rows,Math.min(.045,.35/Math.max(game.cols,game.rows)));sound(snapped?'snap':'place');if(solvedGame())finish();}persist();}drag=null;}panning=null;});
canvas.addEventListener('pointerleave',()=>hoverPoint=null);
canvas.addEventListener('pointercancel',()=>{if(drag)drag.original.forEach(old=>{const p=game.pieces.find(v=>v.id===old.id);p.x=old.x;p.y=old.y;});drag=null;panning=null;downButton=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(screen==='viewer')viewerZoom=Math.min(4,Math.max(1,viewerZoom-e.deltaY*.002));else if(screen==='play'&&game.mode==='jigsaw'&&!paused)setZoom(zoom-e.deltaY*.001);},{passive:false});
canvas.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
addEventListener('keydown',e=>{soundtrack.unlock();if(e.key==='Tab'){e.preventDefault();focus=(focus+(e.shiftKey?-1:1)+buttons.length)%buttons.length;return;}if(e.key==='Enter'&&buttons[focus]?.enabled){e.preventDefault();activateButton(buttons[focus]);return;}if(e.key==='Escape'){e.preventDefault();if(dialog){dialog=null;sound('pause');}else if(screen==='play'){paused=!paused;sound(paused?'pause':'resume');persist();}else goMenu();return;}if(screen!=='play'||paused||dialog)return;if(game.mode==='slide'){const n=SLIDE_SIZES[game.level],z=game.board.indexOf(n*n-1),offset={ArrowLeft:1,ArrowRight:-1,ArrowUp:n,ArrowDown:-n}[e.key];if(offset!==undefined){e.preventDefault();doSlide(z+offset);}}else if(e.key.toLowerCase()==='r')rotateSelected();});
function activateButton(btn){const dedicated=/看圖|復原|提示|旋轉|下載|匯出|匯入|隨機抽圖|再抽一張|繼續上次/.test(btn.label);if(!dedicated)sound(/暫停|返回|取消/.test(btn.label)?'pause':/繼續/.test(btn.label)?'resume':/圖鑑|頁|欣賞/.test(btn.label)?'page':'tap');btn.action();}
addEventListener('resize',resize);addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{soundtrack.setHidden(document.hidden);if(document.hidden&&screen==='play'){paused=true;persist();}lastTick=performance.now();});
boot();requestAnimationFrame(render);
