'use strict';
// Image-skin pass: visible cards/panels/HUD use raster assets only.
// Dynamic text remains live; geometry drawing is being removed layer by layer.
function skinPanel(im,x,y,w,h,alpha=1){
  if(!im||!im.complete||!im.naturalWidth)return;
  X.save();X.globalAlpha=alpha;X.drawImage(im,x,y,w,h);X.restore();
}
function charCard(i,x,y,w,h){
  const own=assigned(i),sel=S.seats[S.activeSeat].char===i&&!S.pickAnim,moving=S.pickAnim&&S.pickAnim.char===i;
  skinPanel(sel?IM.btnRed:IM.btnBlue,x,y,w,h,own!==undefined&&!sel?.70:.96);
  if(!moving)contain(IM['c'+i],x+12,y+10,w-24,h-50,own!==undefined&&!sel?.34:1);
  txt(CHAR_NAMES[i],x+w/2,y+h-23,15,'center',sel?'#ffe786':'#fff',900,true);
  if(own!==undefined){
    txt((own+1)+'P',x+27,y+23,16,'center',PLAYER_COLORS[own],1000,true);
    if(!sel)txt('已選',x+w-31,y+23,13,'center','#fff',900,true);
  }
  S.buttons.push({id:'char'+i,x,y,w,h,en:!S.pickAnim});
}
function seatPanel(i,x,y){
  const s=S.seats[i],sel=S.activeSeat===i;
  skinPanel(sel?IM.btnRed:IM.btnBlue,x,y,345,138,s.type==='off'?.42:.96);
  S.buttons.push({id:'seat'+i,x,y,w:345,h:138,en:!S.pickAnim});
  if(!(S.pickAnim&&S.pickAnim.seat===i)&&s.type!=='off')contain(IM['c'+s.char],x+8,y-30,104,118,.98);
  txt((i+1)+'P',x+145,y+25,19,'center',PLAYER_COLORS[i],1000,true);
  txt(s.type==='off'?'空席':CHAR_NAMES[s.char],x+214,y+51,14,'center','#fff',900,true);
  btn('human'+i,'真人',x+117,y+74,67,38,false,s.type==='human'?1:.42,!S.pickAnim);
  btn('ai'+i,'AI',x+188,y+74,57,38,true,s.type==='ai'?1:.42,!S.pickAnim);
  btn('off'+i,'空席',x+249,y+74,72,38,false,s.type==='off'?1:.42,!S.pickAnim);
  if(s.type==='ai')txt(s.diff==='easy'?'輕鬆':s.diff==='standard'?'標準':'聰明',x+282,y+23,12,'center','#ffe7a2',900,true);
}
function setup(){
  updatePickAnim();setupBg();
  btn('back','返回',20,18,150,58,false,1,!S.pickAnim);
  txt('角色選擇',500,48,38,'center','#fff0b6',1000,true);
  txt('先選 P1～P4 席位，再選角色；確認後角色會走到玩家席位',500,88,17,'center','#fff',800,true);
  for(let i=0;i<10;i++){const p=slotPos(i);charCard(i,p.x,p.y,SETUP.cw,SETUP.ch)}
  skinPanel(IM.btnBlue,1010,118,535,520,.90);
  const ci=S.pickAnim&&S.pickAnim.seat===S.activeSeat?S.pickAnim.char:S.seats[S.activeSeat].char;
  contain(IM['c'+ci],1060,138,195,260);
  txt(CHAR_NAMES[ci],1290,168,32,'left','#fff0b2',950,true);
  txt(CHAR_ROLES[ci],1290,213,18,'left','#dceaff',800,true);
  txt('目前席位 '+(S.activeSeat+1)+'P',1290,255,18,'left',PLAYER_COLORS[S.activeSeat],900,true);
  txt('參賽 '+activeSeatIds().length+' 人 / 真人 '+humanCount()+' 人',1290,292,17,'left','#fff',800,true);
  btn('money','起始資金 $'+S.money.toLocaleString(),1082,345,405,62,false,.96,!S.pickAnim);
  btn('rounds',S.rounds+' 回合',1082,417,405,62,false,.96,!S.pickAnim);
  btn('startGame','開始這局',1082,510,405,92,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);
  for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);
  if(S.pickAnim)drawWalker(S.pickAnim);
}
function drawTile(t,i){
  contain(IM['tile_'+t.type],t.x-78,t.y-78,156,156,1);
  if(t.type==='land'){
    if(t.owner>=0){
      txt((t.owner+1)+'P',t.x,t.y-65,14,'center',PLAYER_COLORS[t.owner],1000,true);
      if(t.level>0)contain(IM['house'+t.level],t.x-53,t.y-140,106,104,.98);
    }
    txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+61,12,'center','#fff6d2',900,true);
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
