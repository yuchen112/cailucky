'use strict';
// Structural correction pass: remove unrelated website-brand backgrounds and broken house art.
// This file intentionally overrides only presentation functions while the dedicated game art set is rebuilt.
function cxqPlainBackdrop(){
  X.save();
  X.fillStyle='#11182d';
  X.fillRect(0,0,W,H);
  X.restore();
}
function home(){
  cxqPlainBackdrop();
  title(430,150);
  contain(IM.c0,780,155,250,330,.98);
  contain(IM.c1,1010,190,220,300,.92);
  contain(IM.c2,1220,190,220,300,.92);
  btn('start','開始遊戲',145,405,470,110,true);
  btn('continue','繼續遊戲',165,520,430,82,false,.96,!!localStorage.getItem(SAVE));
  btn('help','遊戲說明',165,614,430,82,false,.94);
  btn('settings','設定',165,708,430,82,false,.94);
  txt('CxQ 童話大富翁・最新製作版',800,856,20,'center','#fff7d5',850,true);
}
function setup(){
  updatePickAnim();
  cxqPlainBackdrop();
  btn('back','返回',20,18,150,58,false,1,!S.pickAnim);
  txt('角色選擇',480,52,38,'center','#fff0b6',1000,true);
  txt('先選 P1～P4 席位，再從角色格選擇角色',480,92,18,'center','#fff',800,true);
  for(let i=0;i<10;i++){const p=slotPos(i);charCard(i,p.x,p.y,SETUP.cw,SETUP.ch)}
  stretch(IM.btnBlue,1028,112,518,532,.82);
  const ci=S.pickAnim&&S.pickAnim.seat===S.activeSeat?S.pickAnim.char:S.seats[S.activeSeat].char;
  contain(IM['c'+ci],1080,136,185,245);
  txt(CHAR_NAMES[ci],1300,168,32,'left','#fff0b2',950,true);
  txt(CHAR_ROLES[ci],1300,212,18,'left','#dceaff',800,true);
  txt('目前席位 '+(S.activeSeat+1)+'P',1300,254,18,'left',PLAYER_COLORS[S.activeSeat],900,true);
  txt('參賽 '+activeSeatIds().length+' 人 / 真人 '+humanCount()+' 人',1300,292,17,'left','#fff',800,true);
  btn('money','起始資金 $'+S.money.toLocaleString(),1082,338,405,62,false,.96,!S.pickAnim);
  btn('rounds',S.rounds+' 回合',1082,410,405,62,false,.96,!S.pickAnim);
  btn('startGame','開始這局',1082,500,405,92,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);
  txt('每席：真人 / AI / 空席；AI 可調整難度',1286,612,16,'center','#e9ecff',800,true);
  for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);
  drawPickAnim();
}
function drawMap(){
  const b=S.board;
  X.save();
  X.fillStyle='#16314a';
  X.fillRect(0,0,MW,MH);
  X.restore();
  for(let r=0;r<4;r++){
    const indices=b.tiles.map((t,i)=>t.region===r&&t.type==='land'?i:-1).filter(i=>i>=0);
    if(indices.length){const t=b.tiles[indices[Math.floor(indices.length/2)]];txt(REGION_NAMES[r],t.x,t.y+112,16,'center','#fff1bc',900,true)}
  }
  b.tiles.forEach(drawTile);
  drawPlayers();
}
function drawTile(t,i){
  contain(IM['tile_'+t.type],t.x-88,t.y-88,176,176,1);
  if(t.type==='land'){
    if(t.owner>=0)txt((t.owner+1)+'P',t.x,t.y-75,15,'center',PLAYER_COLORS[t.owner],1000,true);
    txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+69,13,'center','#fff6d2',900,true);
    if(t.level>0)txt('Lv'+t.level,t.x,t.y-103,14,'center','#ffe7a2',1000,true);
  }
}
