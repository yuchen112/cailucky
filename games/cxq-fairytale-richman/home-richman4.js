'use strict';

// CxQ 童話大富翁：首頁第二階段
// 取《大富翁4》的「標題畫面→主選單→短轉場」節奏，但使用 CxQ 自有世界與素材。
const HOME_R4={
  started:performance.now(),
  hover:null,
  pressed:null,
  leaving:null,
  leaveAt:0,
  locked:false
};

load('homeVillageHQ','../fortune/assets/backgrounds/destiny-village.png');
load('homeCottage','../fortune/assets/buildings/moon-tarot-cottage.png');

function clamp01(v){return Math.max(0,Math.min(1,v))}
function easeOut(v){v=clamp01(v);return 1-Math.pow(1-v,3)}
function introAlpha(delay,dur=420){return easeOut((performance.now()-HOME_R4.started-delay)/dur)}

function homeRichmanLogo(){
  const a=introAlpha(80,520),dy=(1-a)*30;
  X.save();X.globalAlpha=a;
  txt('CxQ',330,120+dy,86,'center','#ffe27a',1000,true);
  txt('童話大富翁',330,198+dy,62,'center','#fff1be',1000,true);
  txt('夢想王國資產大冒險',330,252+dy,19,'center','#f7f2dc',900,true);
  X.restore();
}

function homeMenuBtn(id,label,x,y,w,h,red,index,en=true){
  const a=introAlpha(330+index*90,360);
  if(a<=0)return;
  const active=HOME_R4.pressed===id||HOME_R4.hover===id;
  const press=HOME_R4.pressed===id;
  const s=press?.965:(active?1.025:1);
  const dw=w*s,dh=h*s,dx=x-(dw-w)/2,dy=y-(dh-h)/2+(1-a)*22;
  contain(red?IM.btnRed:IM.btnBlue,dx,dy,dw,dh,a*(en?1:.38));
  X.save();X.globalAlpha=a*(en?1:.58);txt(label,x+w/2,y+h*.49+(1-a)*22,Math.min(29,h*.34),'center','#fff',900,true);X.restore();
  S.buttons.push({id,x,y,w,h,en:en&&!HOME_R4.locked});
}

function homeRichmanMenu(){
  const canContinue=!!localStorage.getItem(SAVE);
  homeMenuBtn('start','新遊戲',88,356,474,104,true,0,true);
  homeMenuBtn('continue','繼續遊戲',112,474,426,76,false,1,canContinue);
  homeMenuBtn('help','遊戲說明',112,564,426,76,false,2,true);
  homeMenuBtn('settings','系統設定',112,654,426,76,false,3,true);

  const ia=introAlpha(740,380);
  if(ia>0){
    X.save();X.globalAlpha=ia;
    contain(IM.roleInfo,104,758,445,92,.93);
    txt(canContinue?'已有冒險紀錄，可從上次進度繼續':'尚無冒險紀錄｜開始新遊戲建立存檔',327,797,15,'center','#60462d',900,false);
    txt('2–4 人｜真人 / AI 自由配置',327,824,13,'center','#76583b',800,false);
    X.restore();
  }
}

function homeRichmanScene(){
  const t=(performance.now()-HOME_R4.started)/1000;
  const sceneA=introAlpha(0,620);
  const bob1=Math.sin(t*1.7)*4,bob2=Math.sin(t*1.55+1.2)*4,bob3=Math.sin(t*1.9+.5)*3;
  X.save();X.globalAlpha=sceneA;
  // 後景角色 → 建築 → 前景角色，讓角色真的存在於場景中。
  contain(IM.c6,980,360+bob1,205,315,.98);
  contain(IM.c1,1240,350+bob2,190,305,.97);
  contain(IM.homeCottage,805,245,735,600,1);
  contain(IM.c7,1160,650+bob3,168,185,.99);
  contain(IM.c8,1350,642-bob3,180,195,.99);
  contain(IM.playerSeat,1120,38,430,94,.90);
  txt('童話棋盤冒險',1335,67,18,'center','#fff7dc',1000,true);
  txt('擲骰・買地・蓋房・收租・卡片・神明事件',1335,98,13,'center','#fff',850,true);
  X.restore();
}

function homeLeavingCue(){
  if(!HOME_R4.leaving)return;
  const p=clamp01((performance.now()-HOME_R4.leaveAt)/300);
  X.save();X.globalAlpha=1-p;
  txt(HOME_R4.leaving==='start'?'前往角色與玩家配置…':HOME_R4.leaving==='continue'?'讀取冒險紀錄…':'',800,860,16,'center','#fff5c7',900,true);
  X.restore();
}

home=function(){
  cover(IM.homeVillageHQ||IM.homeBg,0,0,W,H,1);
  homeRichmanScene();
  homeRichmanLogo();
  homeRichmanMenu();
  homeLeavingCue();
  txt('CxQ FAIRYTALE RICHMAN',1515,874,11,'right','rgba(255,255,255,.82)',800,true);
};

function homeResetIntro(){
  HOME_R4.started=performance.now();
  HOME_R4.hover=HOME_R4.pressed=HOME_R4.leaving=null;
  HOME_R4.leaveAt=0;HOME_R4.locked=false;
}

// 此檔在 game.js 後載入，因此可包住既有 action，不改動其他遊戲流程。
const richmanBaseAction=action;
action=function(id){
  if(S.scene==='home'&&!HOME_R4.locked&&['start','continue','help','settings'].includes(id)){
    if(id==='continue'&&!localStorage.getItem(SAVE))return;
    HOME_R4.locked=true;HOME_R4.pressed=id;HOME_R4.leaving=id;HOME_R4.leaveAt=performance.now();
    setTimeout(()=>{HOME_R4.pressed=null;richmanBaseAction(id);HOME_R4.locked=false;HOME_R4.leaving=null},260);
    return;
  }
  const before=S.scene;
  richmanBaseAction(id);
  if(S.scene==='home'&&before!=='home')homeResetIntro();
};

C.addEventListener('pointerdown',e=>{
  if(S.scene!=='home'||HOME_R4.locked)return;
  const p=pointerToGame(e),b=hit(p.x,p.y);HOME_R4.pressed=b?.en?b.id:null;
});
C.addEventListener('pointermove',e=>{
  if(S.scene!=='home'||HOME_R4.locked)return;
  const p=pointerToGame(e),b=hit(p.x,p.y);HOME_R4.hover=b?.en?b.id:null;
});
C.addEventListener('pointerleave',()=>{HOME_R4.hover=null;HOME_R4.pressed=null});
C.addEventListener('pointercancel',()=>{HOME_R4.pressed=null});
