'use strict';
// Visible UI skin: raster/image assets only. Canvas is used only as compositor + live text.
load('charSlot',A+'ui/char_slot.webp');
load('charSlotSelected',A+'ui/char_slot_selected.webp');

function skinPanel(im,x,y,w,h,alpha=1){
  if(!im||!im.complete||!im.naturalWidth)return;
  X.save();X.globalAlpha=alpha;X.drawImage(im,x,y,w,h);X.restore();
}

function charCard(i,x,y,w,h){
  const own=assigned(i),sel=S.seats[S.activeSeat].char===i&&!S.pickAnim,moving=S.pickAnim&&S.pickAnim.char===i;
  contain(sel?IM.charSlotSelected:IM.charSlot,x,y,w,h,own!==undefined&&!sel?.70:.98);
  if(!moving)contain(IM['c'+i],x+16,y+10,w-32,h-52,own!==undefined&&!sel?.34:1);
  txt(CHAR_NAMES[i],x+w/2,y+h-22,15,'center',sel?'#ffe786':'#fff',900,true);
  if(own!==undefined){
    contain(IM.btnRed,x+4,y+3,64,36,.92);
    txt((own+1)+'P',x+36,y+21,14,'center','#fff',1000,true);
    if(!sel)txt('已選',x+w-31,y+21,12,'center','#fff',900,true);
  }
  S.buttons.push({id:'char'+i,x,y,w,h,en:!S.pickAnim});
}

function seatPanel(i,x,y){
  const s=S.seats[i],sel=S.activeSeat===i;
  skinPanel(sel?IM.btnRed:IM.btnBlue,x,y,345,138,s.type==='off'?.42:.96);
  S.buttons.push({id:'seat'+i,x,y,w:345,h:138,en:!S.pickAnim});
  if(!(S.pickAnim&&S.pickAnim.seat===i)&&s.type!=='off')contain(IM['c'+s.char],x+8,y-30,104,118,.98);
  contain(IM.btnRed,x+111,y+4,64,39,.92);
  txt((i+1)+'P',x+143,y+24,16,'center','#fff',1000,true);
  txt(s.type==='off'?'空席':CHAR_NAMES[s.char],x+219,y+50,14,'center','#fff',900,true);
  btn('human'+i,'真人',x+117,y+74,67,38,false,s.type==='human'?1:.42,!S.pickAnim);
  btn('ai'+i,'AI',x+188,y+74,57,38,true,s.type==='ai'?1:.42,!S.pickAnim);
  btn('off'+i,'空席',x+249,y+74,72,38,false,s.type==='off'?1:.42,!S.pickAnim);
  if(s.type==='ai')btn('diff'+i,s.diff==='easy'?'輕鬆':s.diff==='standard'?'標準':'聰明',x+251,y+10,77,34,false,.9,!S.pickAnim);
}

function setup(){
  updatePickAnim();
  contain(IM.tile_start,580,55,440,440,.16);
  btn('back','返回',18,15,150,58,false,1,!S.pickAnim);
  txt('角色選擇',500,45,38,'center','#fff0b6',1000,true);
  txt('P1～P4 先選真人 / AI / 空席，再選角色',500,84,17,'center','#fff',800,true);
  for(let i=0;i<10;i++){const p=slotPos(i);charCard(i,p.x,p.y,SETUP.cw,SETUP.ch)}
  skinPanel(IM.btnBlue,1015,112,520,520,.90);
  const ci=S.pickAnim&&S.pickAnim.seat===S.activeSeat?S.pickAnim.char:S.seats[S.activeSeat].char;
  contain(IM['c'+ci],1060,135,190,250);
  txt(CHAR_NAMES[ci],1290,170,30,'left','#fff0b2',950,true);
  txt(CHAR_ROLES[ci],1290,215,18,'left','#dceaff',800,true);
  txt('目前席位 '+(S.activeSeat+1)+'P',1290,256,18,'left',PLAYER_COLORS[S.activeSeat],900,true);
  txt('參賽 '+activeSeatIds().length+' 人 / 真人 '+humanCount()+' 人',1290,294,17,'left','#fff',800,true);
  btn('money','起始資金 $'+S.money.toLocaleString(),1082,347,405,62,false,.96,!S.pickAnim);
  btn('rounds',S.rounds+' 回合',1082,419,405,62,false,.96,!S.pickAnim);
  btn('startGame','開始這局',1082,505,405,90,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);
  for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);
  drawPickAnim();
}

function drawTile(t){
  contain(IM['tile_'+t.type],t.x-88,t.y-88,176,176,1);
  if(t.type==='land'){
    if(t.owner>=0){
      contain(IM.btnRed,t.x-36,t.y-103,72,36,.88);
      txt((t.owner+1)+'P',t.x,t.y-86,14,'center',PLAYER_COLORS[t.owner],1000,true);
      if(t.level>0)contain(IM['house'+t.level],t.x-58,t.y-148,116,116,.98);
    }
    txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+69,13,'center','#fff6d2',900,true);
  }
}

function hud(){
  const b=S.board,p=cp();
  skinPanel(IM.btnBlue,18,16,570,70,.96);
  txt(`${p.id+1}P  ${CHAR_NAMES[p.char]}   $${Math.max(0,p.cash).toLocaleString()}`,303,51,21,'center','#fff',900,true);
  skinPanel(IM.btnBlue,1230,16,350,70,.96);
  txt(`第 ${b.round}/${S.rounds} 回合`,1405,51,21,'center','#fff',900,true);
  btn('cards','卡片 '+p.cards.length,1088,790,160,72,false,.95,!S.rolling&&!b.popup);
  btn('roll',S.rolling?'骰子轉動中':'擲骰子',1260,760,300,112,true,.98,!S.rolling&&!b.popup&&!b.winner);
  contain(IM['dice'+S.dice],1330,655,160,100);
  if(S.msg)txt(S.msg,800,852,20,'center','#fff3ca',900,true);
  if(b.log.length)txt(b.log[b.log.length-1],800,815,16,'center','#edf5ff',750,true);
}

popup=function(){
  const b=S.board,p=cp(),q=b&&b.popup;
  if(!q)return;
  const t=q.tile;
  if(q.kind==='tile'){
    contain(IM['tile_'+t.type],590,105,420,420,.98);
    btn('noop3',typeName(t.type),600,460,400,70,false);
    if(t.type==='start'){txt('經過起點可獲得 $5,000',800,555,24);btn('ok','確定',680,630,240,74,false);return;}
    if(t.type==='land'){
      if(t.owner<0){txt(REGION_NAMES[t.region]+'・土地價格 $'+t.price.toLocaleString(),800,550,23);btn('buy','購買',600,620,245,78,true,1,p.cash>=t.price);btn('skip','略過',870,620,190,78,false);}
      else if(t.owner===p.id){const cost=Math.round(t.price*.65);txt('自己的土地・Lv'+t.level+' / 3',800,548,23);btn('upgrade',t.level<3?'升級 $'+cost.toLocaleString():'已滿級',620,620,360,78,true,1,t.level<3&&p.cash>=cost);btn('skip','繼續',690,715,220,62,false);}
      else{const rent=rentFor(t);txt(`支付 ${t.owner+1}P 租金 $${rent.toLocaleString()}`,800,550,23);btn('pay','支付租金',650,625,300,78,true);}
      return;
    }
    btn('special','查看結果',665,625,270,78,false);return;
  }
  if(q.kind==='event'){contain(IM.tile_event,610,105,380,380);txt(q.name,800,525,30,'center','#ffe58a',1000,true);txt(q.desc,800,570,22);btn('eventOk','確定',680,640,240,74,false);return;}
  if(q.kind==='npc'){contain(IM.tile_npc,610,105,380,380);txt(q.name,800,525,30,'center','#ffe58a',1000,true);txt(q.desc,800,570,22);btn('npcOk','確定',680,640,240,74,false);return;}
  if(q.kind==='shop'){contain(IM.tile_shop,610,90,380,380);txt('童話商店',800,500,30,'center','#ffe58a',1000,true);txt('支付 $2,500 隨機取得一張卡片',800,548,21);btn('shopBuy','購買卡片',620,615,300,76,true,1,p.cash>=2500);btn('skip','離開',940,615,170,76,false);return;}
  if(q.kind==='carddraw'){contain(IM.tile_card,610,90,380,380);txt('抽到：'+q.card,800,520,28,'center','#ffe58a',1000,true);btn('cardOk','收下',680,620,240,76,false);return;}
  if(q.kind==='cards'){
    contain(IM.tile_card,95,120,290,290,.95);txt('持有卡片',450,132,28,'left','#ffe58a',1000,true);
    if(!p.cards.length){txt('目前沒有卡片',450,195,22,'left');btn('closeCards','返回',1120,700,240,70,false);return;}
    p.cards.slice(0,6).forEach((c,i)=>btn('useCard'+i,c,440,180+i*78,450,62,i===0));btn('closeCards','返回',1120,700,240,70,false);return;
  }
  if(q.kind==='mini'){
    contain(IM.tile_minigame,610,90,380,380);txt('星光停格挑戰',800,495,30,'center','#ffe58a',1000,true);txt('看準時機按下「停！」，越接近中央獎勵越高',800,540,20);
    const m=b.mini,x=515,y=590,w=570;skinPanel(IM.btnBlue,x,y,w,30,.98);skinPanel(IM.btnRed,x+w*.44,y,w*.12,30,.95);contain(IM.dice1,x+(m?.pos??0)*w-28,y-18,56,64,1);btn('miniStop','停！',660,655,280,78,true);return;
  }
  if(q.kind==='winner'){contain(IM.dice6,690,145,220,180,.96);txt('本局結束',800,340,54,'center','#ffe58a',1000,true);txt(q.text,800,420,34,'center','#fff',1000,true);btn('home','回到首頁',630,540,340,88,true);return;}
};
