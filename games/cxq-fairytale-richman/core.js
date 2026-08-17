'use strict';
const C=document.getElementById('game'),X=C.getContext('2d',{alpha:false});
const W=1600,H=900,MW=3200,MH=1800,A='assets/';
document.documentElement.style.background='#071325';document.body.style.margin='0';document.body.style.overflow='hidden';C.style.display='block';C.style.width='100vw';C.style.height='100vh';C.style.touchAction='none';

const CHAR_KEYS=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'];
const CHAR_NAMES=['慶典少女','星夢魔女','夜鈴米亞','雨音澄澄','鑰匙守護者','記憶偵探','森林旅人','棉糖汪汪','森鈴芽獸','希望旅人'];
const CHAR_ROLES=['幸運型','骰控型','卡片型','防禦型','商店型','移動型','土地型','小遊戲型','收租型','特殊型'];
const PLAYER_COLORS=['#ff716e','#6db9ff','#7ed87c','#ffd05d'];
const REGION_NAMES=['星願花園','月輝城鎮','森語溪谷','雲端市集'];
const IM={};
function load(k,u){const i=new Image();i.decoding='async';i.src=u;IM[k]=i;return i}
load('btnBlue',A+'ui/btn_blue.webp');load('btnRed',A+'ui/btn_red.webp');
['start','land','event','card','shop','minigame','npc'].forEach(k=>load('tile_'+k,A+'tiles/'+k+'.webp'));
for(let i=1;i<=3;i++)load('house'+i,A+'houses/house_lv'+i+'.webp');
for(let i=1;i<=6;i++)load('dice'+i,A+'dice/dice_'+i+'.webp');
CHAR_KEYS.forEach((k,i)=>load('c'+i,'../../assets/characters/cxq-role-'+k+'.webp'));

const SAVE='cxq_richman_latest_save_v3';
const S={scene:'home',buttons:[],seats:[{type:'human',char:6,diff:'standard'},{type:'ai',char:1,diff:'standard'},{type:'off',char:2,diff:'standard'},{type:'off',char:3,diff:'standard'}],activeSeat:0,money:200000,rounds:30,board:null,msg:'',help:false,settings:false,rolling:false,dice:1,forcedDice:0,pickAnim:null};

function resize(){const d=Math.min(devicePixelRatio||1,2);C.width=Math.round(innerWidth*d);C.height=Math.round(innerHeight*d)}
addEventListener('resize',resize);resize();
function begin(){X.setTransform(C.width/W,0,0,C.height/H,0,0);X.clearRect(0,0,W,H);S.buttons=[]}
function txt(s,x,y,z=26,a='center',c='#fff',w=800,o=true){X.save();X.font=`${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;X.textAlign=a;X.textBaseline='middle';if(o){X.lineJoin='round';X.lineWidth=Math.max(2,z/7);X.strokeStyle='rgba(20,14,28,.92)';X.strokeText(String(s),x,y)}X.fillStyle=c;X.fillText(String(s),x,y);X.restore()}
function contain(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return;const r=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;X.save();X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore()}
function stretch(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return;X.save();X.globalAlpha=alpha;X.drawImage(im,x,y,w,h);X.restore()}
function btn(id,label,x,y,w,h,red=false,alpha=1,en=true){contain(red?IM.btnRed:IM.btnBlue,x,y,w,h,alpha*(en?1:.38));txt(label,x+w/2,y+h*.49,Math.min(29,h*.34),'center','#fff',900,true);S.buttons.push({id,x,y,w,h,en})}
function hit(x,y){return S.buttons.slice().reverse().find(b=>b.en&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)}
function activeSeatIds(){return S.seats.map((s,i)=>s.type==='off'?-1:i).filter(i=>i>=0)}
function humanCount(){return S.seats.filter(s=>s.type==='human').length}
function assigned(ci){return activeSeatIds().find(i=>S.seats[i].char===ci)}

/* Visible presentation rule: this mainline does not draw decorative panels, gradients,
   clouds, castles, stars or other faux UI with Canvas geometry. Runtime Canvas is only
   the compositor for independent image assets + dynamic text/data. */
function imagePanel(im,x,y,w,h,alpha=1){stretch(im,x,y,w,h,alpha)}
function title(x=370,y=150){txt('CxQ',x,y,102,'center','#ffe27a',1000,true);txt('童話大富翁',x,y+84,68,'center','#fff0b9',1000,true);txt('夢想王國資產大冒險',x,y+142,22,'center','#f4f7ff',850,true)}
function home(){
  contain(IM.tile_start,950,90,430,430,.34);
  title(360,145);
  btn('start','開始遊戲',110,405,470,110,true);
  btn('continue','繼續遊戲',135,520,420,82,false,.96,!!localStorage.getItem(SAVE));
  btn('help','遊戲說明',135,614,420,82,false,.94);
  btn('settings','設定',135,708,420,82,false,.94);
  contain(IM.c0,760,390,230,330,.98);contain(IM.c1,970,410,220,310,.96);contain(IM.c2,1180,400,230,320,.96);
  txt('目前畫面已停止使用官網 Brand 背景與程式繪製裝飾',1070,820,18,'center','#fff5cf',850,true);
}

const SETUP={gx:44,gy:125,cw:178,ch:216,g:13,seatY:708,seatX:[42,432,822,1212]};
function slotPos(i){return {x:SETUP.gx+(i%5)*(SETUP.cw+SETUP.g),y:SETUP.gy+Math.floor(i/5)*(SETUP.ch+SETUP.g)}}
function seatTarget(i){return {x:SETUP.seatX[i]+62,y:SETUP.seatY+40}}
function chooseChar(ci){if(S.pickAnim||S.seats[S.activeSeat].type==='off')return;const a=S.activeSeat,b=assigned(ci),old=S.seats[a].char,p=slotPos(ci);if(old===ci&&b===a)return;S.pickAnim={char:ci,seat:a,swapSeat:(b!==undefined&&b!==a)?b:-1,oldChar:old,start:performance.now(),dur:800,from:{x:p.x+SETUP.cw/2,y:p.y+SETUP.ch*.48},to:seatTarget(a)}}
function updatePickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur);if(t>=1){S.seats[q.seat].char=q.char;if(q.swapSeat>=0)S.seats[q.swapSeat].char=q.oldChar;S.pickAnim=null}}
function drawPickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur),e=1-Math.pow(1-t,3);const x=q.from.x+(q.to.x-q.from.x)*e,y=q.from.y+(q.to.y-q.from.y)*e;contain(IM['c'+q.char],x-66,y-92,132,154,1)}
function charCard(i,x,y,w,h){
  const own=assigned(i),sel=S.seats[S.activeSeat].char===i&&!S.pickAnim,moving=S.pickAnim&&S.pickAnim.char===i;
  contain(IM.tile_start,x,y,w,h,sel?1:.76);
  if(!moving)contain(IM['c'+i],x+18,y+12,w-36,h-54,own!==undefined&&!sel?.34:1);
  txt(CHAR_NAMES[i],x+w/2,y+h-22,15,'center',sel?'#ffe786':'#fff',900,true);
  if(own!==undefined){contain(IM.btnRed,x+3,y+2,66,36,.9);txt((own+1)+'P',x+36,y+20,14,'center','#fff',1000,true)}
  S.buttons.push({id:'char'+i,x,y,w,h,en:!S.pickAnim});
}
function seatPanel(i,x,y){
  const s=S.seats[i],sel=S.activeSeat===i;
  imagePanel(sel?IM.btnRed:IM.btnBlue,x,y,345,138,s.type==='off'?.42:.96);
  S.buttons.push({id:'seat'+i,x,y,w:345,h:138,en:!S.pickAnim});
  if(!(S.pickAnim&&S.pickAnim.seat===i)&&s.type!=='off')contain(IM['c'+s.char],x+10,y-28,100,116,.98);
  contain(IM.btnRed,x+112,y+5,62,39,.9);txt((i+1)+'P',x+143,y+25,16,'center','#fff',1000,true);
  txt(s.type==='off'?'空席':CHAR_NAMES[s.char],x+220,y+49,15,'center','#fff',900,true);
  btn('human'+i,'真人',x+118,y+72,66,38,false,s.type==='human'?1:.42,!S.pickAnim);
  btn('ai'+i,'AI',x+188,y+72,56,38,true,s.type==='ai'?1:.42,!S.pickAnim);
  btn('off'+i,'空席',x+248,y+72,72,38,false,s.type==='off'?1:.42,!S.pickAnim);
  if(s.type==='ai')btn('diff'+i,s.diff==='easy'?'輕鬆':s.diff==='standard'?'標準':'聰明',x+250,y+10,78,34,false,.9,!S.pickAnim);
}
function setup(){
  updatePickAnim();
  btn('back','返回',18,15,150,58,false,1,!S.pickAnim);
  txt('角色選擇',500,45,38,'center','#fff0b6',1000,true);
  txt('P1～P4 先選真人 / AI / 空席，再選角色',500,84,17,'center','#fff',800,true);
  for(let i=0;i<10;i++){const p=slotPos(i);charCard(i,p.x,p.y,SETUP.cw,SETUP.ch)}
  imagePanel(IM.btnBlue,1015,112,520,520,.9);
  const ci=S.pickAnim&&S.pickAnim.seat===S.activeSeat?S.pickAnim.char:S.seats[S.activeSeat].char;
  contain(IM['c'+ci],1060,135,190,250);
  txt(CHAR_NAMES[ci],1290,170,30,'left','#fff0b2',950,true);txt(CHAR_ROLES[ci],1290,215,18,'left','#dceaff',800,true);
  txt('目前席位 '+(S.activeSeat+1)+'P',1290,256,18,'left',PLAYER_COLORS[S.activeSeat],900,true);
  txt('參賽 '+activeSeatIds().length+' 人 / 真人 '+humanCount()+' 人',1290,294,17,'left','#fff',800,true);
  btn('money','起始資金 $'+S.money.toLocaleString(),1082,347,405,62,false,.96,!S.pickAnim);
  btn('rounds',S.rounds+' 回合',1082,419,405,62,false,.96,!S.pickAnim);
  btn('startGame','開始這局',1082,505,405,90,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);
  for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);
  drawPickAnim();
}

const ROUTE=[[1450,1590],[1240,1610],[1030,1540],[840,1430],[710,1270],[650,1080],[700,900],[820,760],[980,650],[1160,575],[1360,515],[1570,500],[1780,530],[1990,600],[2180,720],[2340,870],[2440,1040],[2440,1220],[2340,1390],[2180,1515],[1980,1590],[1780,1570],[1600,1475],[1480,1320],[1390,1150],[1240,1030],[1070,1030],[930,1120],[1010,1270],[1220,1380]];
const TYPE_PATTERN=['start','land','event','land','card','land','shop','land','event','land','minigame','land','npc','land','card','land','event','land','shop','land','npc','land','event','land','minigame','land','card','land','event','land'];
function makeBoard(){const tiles=ROUTE.map((p,i)=>({x:p[0],y:p[1],type:TYPE_PATTERN[i%TYPE_PATTERN.length],owner:-1,level:0,region:Math.floor(i/8)%4,price:9000+(i%7)*1800}));tiles[0].type='start';const players=activeSeatIds().map((si,id)=>({id,seat:si,type:S.seats[si].type,char:S.seats[si].char,diff:S.seats[si].diff,cash:S.money,pos:0,cards:[],tickets:0,skip:0,shield:0,bankrupt:false}));S.board={worldW:MW,worldH:MH,tiles,players,turn:0,round:1,cam:{x:650,y:900,target:null},popup:null,mini:null,log:['遊戲開始！'],winner:null};focus(true);saveGame()}
function cp(){return S.board.players[S.board.turn]}
function living(){return S.board.players.filter(p=>!p.bankrupt)}
function focus(now=false){const b=S.board,p=cp(),t=b.tiles[p.pos],tx=Math.max(0,Math.min(MW-W,t.x-W/2)),ty=Math.max(0,Math.min(MH-H,t.y-H/2));if(now){b.cam.x=tx;b.cam.y=ty;b.cam.target=null}else b.cam.target={x:tx,y:ty}}
function regionOwned(pid,reg){const lands=S.board.tiles.filter(t=>t.type==='land'&&t.region===reg);return lands.length>0&&lands.every(t=>t.owner===pid)}
function drawTile(t){
  contain(IM['tile_'+t.type],t.x-88,t.y-88,176,176,1);
  if(t.type==='land'){
    if(t.owner>=0){contain(IM.btnRed,t.x-36,t.y-103,72,36,.88);txt((t.owner+1)+'P',t.x,t.y-86,14,'center',PLAYER_COLORS[t.owner],1000,true);if(t.level>0)contain(IM['house'+t.level],t.x-58,t.y-148,116,116,.98)}
    txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+69,13,'center','#fff6d2',900,true);
  }
}
function drawPlayers(){const b=S.board;for(const p of b.players){if(p.bankrupt)continue;const t=b.tiles[p.pos],same=b.players.filter(q=>!q.bankrupt&&q.pos===p.pos),idx=same.indexOf(p),off=(idx-(same.length-1)/2)*34;contain(IM['c'+p.char],t.x-62+off,t.y-174,124,144);txt((p.id+1)+'P',t.x+off,t.y-177,14,'center',PLAYER_COLORS[p.id],1000,true)}}
function drawMap(){const b=S.board;b.tiles.forEach(drawTile);drawPlayers()}
function hud(){const b=S.board,p=cp();btn('noop',`${p.id+1}P  ${CHAR_NAMES[p.char]}   $${Math.max(0,p.cash).toLocaleString()}`,18,16,570,70,false);btn('noop2',`第 ${b.round}/${S.rounds} 回合`,1230,16,350,70,false);btn('cards','卡片 '+p.cards.length,1088,790,160,72,false,.95,!S.rolling&&!b.popup);btn('roll',S.rolling?'骰子轉動中':'擲骰子',1260,760,300,112,true,.98,!S.rolling&&!b.popup&&!b.winner);contain(IM['dice'+S.dice],1330,655,160,100);if(S.msg)txt(S.msg,800,852,20,'center','#fff3ca',900,true);if(b.log.length)txt(b.log[b.log.length-1],800,815,16,'center','#edf5ff',750,true)}
function typeName(t){return {start:'起點',land:'土地',event:'事件',card:'卡片',shop:'商店',minigame:'小遊戲',npc:'NPC / 神明'}[t]||t}
