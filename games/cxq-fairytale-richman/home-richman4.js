'use strict';

// CxQ 童話大富翁：首頁第一階段
// 參考《大富翁4》的「遊戲標題畫面 + 明確主選單 + 場景角色待機感」，
// 但保留 CxQ 自己的童話世界、角色與手機橫向操作。
const HOME_R4={started:performance.now()};

load('homeVillageHQ','../fortune/assets/backgrounds/destiny-village.png');
load('homeCottage','../fortune/assets/buildings/moon-tarot-cottage.png');

function homeRichmanLogo(){
  txt('CxQ',330,120,86,'center','#ffe27a',1000,true);
  txt('童話大富翁',330,198,62,'center','#fff1be',1000,true);
  txt('夢想王國資產大冒險',330,252,19,'center','#f7f2dc',900,true);
}

function homeRichmanMenu(){
  const canContinue=!!localStorage.getItem(SAVE);
  // 大按鈕優先，維持手機橫屏容易點擊；所有按鈕底板沿用正式圖像素材。
  btn('start','新遊戲',88,356,474,104,true,1,true);
  btn('continue','繼續遊戲',112,474,426,76,false,canContinue?1:.42,canContinue);
  btn('help','遊戲說明',112,564,426,76,false,.96,true);
  btn('settings','系統設定',112,654,426,76,false,.96,true);

  contain(IM.roleInfo,104,758,445,92,.93);
  txt(canContinue?'已有冒險紀錄，可從上次進度繼續':'尚無冒險紀錄｜開始新遊戲建立存檔',327,797,15,'center','#60462d',900,false);
  txt('2–4 人｜真人 / AI 自由配置',327,824,13,'center','#76583b',800,false);
}

function homeRichmanScene(){
  // 角色不再平均漂浮排列；先放在小屋後方，再由建築形成遮擋，建立場景深度。
  contain(IM.c6,980,360,205,315,.98);
  contain(IM.c1,1240,350,190,305,.97);
  contain(IM.homeCottage,805,245,735,600,1);
  // 前景小角色壓住小屋下緣，讓角色真正站在場景裡。
  contain(IM.c7,1160,650,168,185,.99);
  contain(IM.c8,1350,642,180,195,.99);

  // 右上只保留簡潔遊戲提示，不用網頁式功能列。
  contain(IM.playerSeat,1120,38,430,94,.90);
  txt('童話棋盤冒險',1335,67,18,'center','#fff7dc',1000,true);
  txt('擲骰・買地・蓋房・收租・卡片・神明事件',1335,98,13,'center','#fff',850,true);
}

home=function(){
  cover(IM.homeVillageHQ||IM.homeBg,0,0,W,H,1);
  homeRichmanScene();
  homeRichmanLogo();
  homeRichmanMenu();
  txt('CxQ FAIRYTALE RICHMAN',1515,874,11,'right','rgba(255,255,255,.82)',800,true);
};
