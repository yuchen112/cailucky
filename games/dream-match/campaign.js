/* Hand-authored first journey; single-round play never writes campaign progress. */
(() => {
 const levels=[
  {name:'星光初醒',moves:28,targets:[[0,8],[1,8],[2,8]]},
  {name:'葉間微光',moves:27,targets:[[4,12],[5,10],[1,8]]},
  {name:'月影來信',moves:27,targets:[[3,12],[0,12],[2,10]],chain:2},
  {name:'水晶庭院',moves:28,targets:[[1,16],[4,12],[5,10]]},
  {name:'暖陽花徑',moves:28,targets:[[5,14],[0,14],[4,12]],score:4500},
  {name:'流星書頁',moves:29,targets:[[2,16],[3,14],[1,12]],chain:2},
  {name:'雲端鐘聲',moves:30,targets:[[4,16],[2,16],[0,12]],score:6000},
  {name:'月光迴廊',moves:30,targets:[[3,18],[1,14],[5,14]],chain:3},
  {name:'晨露花海',moves:30,targets:[[1,18],[4,18],[0,12]],score:7000},
  {name:'極光奏鳴',moves:31,targets:[[2,18],[5,18],[3,14]],chain:3},
  {name:'星河心願',moves:31,targets:[[0,20],[3,18],[4,14]],score:8000},
  {name:'美夢重啟',moves:32,targets:[[2,20],[1,18],[5,18]],chain:3}
 ];
 const api={levels,clamp:n=>Math.max(0,Math.min(levels.length-1,Number.isFinite(+n)?Math.floor(+n):0)),cleared:n=>Math.max(0,Math.min(levels.length,Number.isFinite(+n)?Math.floor(+n):0))};
 if(typeof module!=='undefined')module.exports=api;else window.DreamCampaign=api;
})();
