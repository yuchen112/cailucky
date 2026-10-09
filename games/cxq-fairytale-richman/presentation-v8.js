"use strict";
// Presentation only: game rules, saved coordinates and economic calculations remain in game.js.
const RICH_ART='art/v8/', RICH_INK='#493425', RICH_MUTED='#735c46';
for(const id of ['traveler-hall','deed-panel','action-ribbon','player-ledger','journal-panel','construction','coin-token'])load('v8-'+id,RICH_ART+id+'.webp',id==='action-ribbon'||id==='player-ledger'?'high':'auto');
IM.setupBg=IM['v8-traveler-hall'];ASSET_BY_KEY.set('setupBg',ASSET_BY_KEY.get('v8-traveler-hall'));
MAPS.forEach((m,i)=>{load('mapWorld'+i,RICH_ART+'map-'+m.key+'.webp');load('mapPreview'+i,RICH_ART+'map-'+m.key+'.webp');for(let level=1;level<=4;level++)load('building'+i+'_'+level,RICH_ART+m.key+'-building-'+level+'.webp');});
CHAR_KEYS.forEach((id,i)=>{load('c'+i,RICH_ART+id+'-idle.webp');load('portrait'+i,RICH_ART+id+'-idle.webp');load('v8-atlas-'+id,RICH_ART+'atlases/'+id+'.webp');load(id+'Dice',RICH_ART+id+'-toss.webp');load(id+'Victory',RICH_ART+id+'-receive.webp');load(id+'Surprise',RICH_ART+id+'-pay.webp');});
const RICH_POSES=['idle','blink','windup','toss','receive','pay','skill'];
// Source-pixel road measurements. Fit the painted oval to the saved 24-space route.
const RICH_PAINTED_ROADS=[{cx:836,cy:430,rx:562,ry:307},{cx:836,cy:422,rx:500,ry:250},{cx:825,cy:405,rx:488,ry:211}];
function richDrawWorld(mi){
 const image=IM['mapWorld'+mi];if(!image?.complete||!image.naturalWidth)return;
 const source=RICH_PAINTED_ROADS[mi],road=MAPS[mi].road,sx=road.rx/source.rx,sy=road.ry/source.ry,x=road.cx-source.cx*sx,y=road.cy-source.cy*sy;
 if(x>0||y>0||x+image.naturalWidth*sx<MW||y+image.naturalHeight*sy<MH)cover(image,0,0,MW,MH);
 X.drawImage(image,x,y,image.naturalWidth*sx,image.naturalHeight*sy);
}
function richIdlePose(ci){return !S.settings.reduced&&(performance.now()+ci*451)%4300<150?'blink':'idle';}
function richDrawPose(role,pose,x,y,w,h,alpha=1){
 const image=IM['v8-atlas-'+role],index=Math.max(0,RICH_POSES.indexOf(pose));
 if(!image?.complete||!image.naturalWidth){contain(IM['c'+CHAR_KEYS.indexOf(role)],x,y,w,h,alpha);return;}
 const scale=Math.min(w/320,h/360),dw=320*scale,dh=360*scale;
 X.save();X.globalAlpha*=alpha;X.drawImage(image,(index%4)*320,Math.floor(index/4)*360,320,360,x+(w-dw)/2,y+(h-dh)/2,dw,dh);X.restore();
}
S.settings.animationSpeed=S.settings.animationSpeed===2?2:1;
S.settings.reduced=!!S.settings.reduced;
const richV8={reactions:new Map(),transfers:[],cash:new Map(),board:null,failed:[],scene:'',loadingAt:0};
function richImageReady(key){const image=IM[key];return !!(image?.complete&&image.naturalWidth);}
function richWarm(keys){for(const key of keys){void IM[key];const task=ASSET_BY_KEY.get(key);if(task){task.priority='high';if(task.status==='idle'&&!task.queued){task.queued=true;ASSET_QUEUE.push(task);}}}pumpAssets();}
function richRetry(keys){for(const key of keys){const task=ASSET_BY_KEY.get(key);if(!task||task.status!=='failed')continue;task.status='idle';task.queued=true;task.image.src='';ASSET_QUEUE.push(task);}richWarm(keys);}
function richBaseAssets(){
 const ui=['v8-action-ribbon','v8-deed-panel','v8-player-ledger','v8-journal-panel','btnBlue','btnRed'];
 if(S.scene==='home')return ['homeBg','homeReturn','v8-action-ribbon','v8-player-ledger','homeMenuNew','homeMenuContinue','homeMenuGallery','homeMenuHelp','homeMenuSettings'];
 if(S.scene==='setup')return [...ui,'setupBg',...CHAR_KEYS.map((_,i)=>'c'+i)];
 if(S.scene==='game'&&S.board){const mi=S.board.mapIndex||0;return [...ui,'mapWorld'+mi,'mapPreview'+mi,'roadNode','tile_start','tile_event','tile_land','facilityMagic','diceAction','diceFrame','settingsIcon','roleInfo',...((S.board.npcs||[]).length?['npcWealth','npcFortune','npcPoverty','npcMisfortune','npcLand','npcAngel','npcDemon','npcDeath']:[]),...Array.from({length:6},(_,i)=>'diceThrow'+(i+1)),...S.board.players.flatMap(p=>['c'+p.char,'v8-atlas-'+CHAR_KEYS[p.char]]),...S.board.players.map(p=>'playerFlag'+p.id),...Array.from({length:4},(_,i)=>'building'+mi+'_'+(i+1))];}
 if(S.scene==='mapSelect')return [...ui,'setupBg',...MAPS.map((_,i)=>'mapPreview'+i)];
 if(S.scene==='loadout')return [...ui,'setupBg',...EQUIPMENT_DEFS.map(e=>'equip_'+e.id),...S.seats.filter(s=>s.type!=='off').map(s=>'c'+s.char)];
 return [...ui,'setupBg','abilityPanel','settingsFrame','roleInfo'];
}
function richSceneAssets(){
 const keys=richBaseAssets(),q=S.board?.popup;
 if(S.scene==='game'&&q?.kind==='event')keys.push(q.art&&ASSET_BY_KEY.has('event_'+q.art)?'event_'+q.art:'eventScene'+(S.board.mapIndex||0));
 if(S.scene==='game'&&q?.kind==='tile'&&q.tile.level>=5){const owner=S.board.players.find(p=>p.id===q.tile.owner);if(owner)keys.push('landmark_'+CHAR_KEYS[owner.char]);}
 if(S.scene==='result'&&S.board?.winner)keys.push(CHAR_KEYS[S.board.winner.char]+'Victory');
 return [...new Set(keys)];
}
function richSceneReady(){
 const keys=richSceneAssets();
 const signature=S.scene+':'+keys.join(',');
 if(richV8.scene!==signature){richV8.scene=signature;richV8.loadingAt=performance.now();richWarm(keys);if(S.scene==='game'&&S.board)richPrepareCast();}
 richV8.failed=keys.filter(key=>!richImageReady(key)&&ASSET_BY_KEY.get(key)?.status==='failed');
 return keys.every(richImageReady);
}
function richLoading(){
 beginUiLayer();X.fillStyle='rgba(5,17,28,.82)';X.fillRect(0,0,W,H);
 const keys=richSceneAssets(),ready=keys.filter(richImageReady).length;
 txt('CxQ 童話大富翁',800,345,42,'center','#ffedbd',900,true);
 txt(richV8.failed.length?'素材下載未完成':'正在準備完整冒險畫面',800,412,28);
 txt(ready+' / '+keys.length,800,463,22);
 if(richV8.failed.length){btn('v8-retry','重新載入',570,525,460,80,true);btn('v8-back','返回首頁',650,630,300,68);}
 endUiLayer();
}
function richPanel(x,y,w,h){stretch(IM['v8-deed-panel'],x,y,w,h);}
function richLedger(x,y,w,h,alpha=1){stretch(IM['v8-player-ledger'],x,y,w,h,alpha);}
panelPlate=function(x,y,w,h,alpha=.94){stretch(IM['v8-journal-panel'],x,y,w,h,alpha);};
diceIconButton=function(id,x,y,size,en=true){
 X.save();X.globalAlpha=en?1:.38;X.shadowColor='#ffe29b';X.shadowBlur=en&&UI_BUTTON.hover===id?20:0;
 contain(IM.diceFrame,x,y,size,size);contain(IM.diceAction,x+size*.19,y+size*.19,size*.62,size*.62);X.restore();
 S.buttons.push({id,x,y,w:size,h:size,en});
};
const richOriginalBtn=btn;
btn=function(id,label,x,y,w,h,red=false,alpha=1,en=true){
 if(!richImageReady('v8-action-ribbon'))return richOriginalBtn(id,label,x,y,w,h,red,alpha,en);
 const pressed=en&&UI_BUTTON.pressed===id;
 X.save();if(en&&UI_BUTTON.hover===id){X.shadowColor='#ffe49a';X.shadowBlur=12;}
 stretch(IM['v8-action-ribbon'],x,y,w,h,alpha*(en?1:.4));X.restore();
 fitTxt(label,x+w/2,y+h/2+(pressed?2:0),w*.78,Math.min(29,h*.38),'center',red?'#ffedb0':'#fff8e6',900,true,13);
 S.buttons.push({id,x,y,w,h,en});
};
home=function(){
 cover(IM.homeBg,0,0,W,H);
 txt('CxQ',335,110,68,'center','#ffe29b',1000,true);txt('童話大富翁',335,179,49,'center','#fff3cc',1000,true);
 txt('擲骰探索・經營你的童話王國',335,235,22);
 const continuing=hasAnySave();
 btn(continuing?'continue':'start',continuing?'繼續冒險':'開始冒險',80,330,510,104,true,1,!HOME.locked);
 if(continuing)btn('start','展開新旅程',120,452,430,78,false,1,!HOME.locked);
 const y=continuing?558:490;
 [['gallery','圖鑑',IM.homeMenuGallery],['help','說明',IM.homeMenuHelp],['settings','設定',IM.homeMenuSettings]].forEach(([id,label,icon],i)=>{const x=78+i*174;contain(icon,x+32,y,110,110);btn(id,label,x,y+112,160,60,false,1,!HOME.locked);});
 txt(continuing?'冒險紀錄已保存，可隨時繼續':'選擇旅伴，從第一塊土地開始',335,continuing?790:742,20);
 txt('即時存檔＋四個自選紀錄',335,continuing?826:778,18,'center','#f3dfb3');
 stretch(IM.homeReturn,1180,795,360,85);S.buttons.push({id:'game-center',x:1180,y:795,w:360,h:85,en:!HOME.locked});
};
SETUP.stageX=85;SETUP.stageY=225;SETUP.stageW=495;SETUP.stageH=390;
setup=function(){
 updatePickAnim();cover(IM.setupBg,0,0,W,H);
 btn('back','返回首頁',28,24,210,66);txt('集結冒險旅團',800,52,38,'center','#fff0bd',1000,true);
 for(let i=0;i<10;i++){const x=35+i*153,selected=SETUP_VIEW.char===i;
  richLedger(x,110,143,113,selected?1:.78);contain(IM['c'+i],x+37,119,70,76);fitTxt(CHAR_NAMES[i],x+72,207,125,20,'center',RICH_INK,900,false,14);
  if(selected){X.strokeStyle='#ffe090';X.lineWidth=4;X.strokeRect(x+3,112,137,110);}S.buttons.push({id:'v8-char-'+i,x,y:110,w:143,h:113,en:!S.pickAnim});
 }
 const ci=SETUP_VIEW.char,owner=assigned(ci);
 if(!(S.pickAnim&&S.pickAnim.char===ci))richDrawPose(CHAR_KEYS[ci],richIdlePose(ci),130,255,355,350);
 btn('prevChar','◀',34,403,90,90,false,1,!S.pickAnim);btn('nextChar','▶',501,403,90,90,false,1,!S.pickAnim);
 btn('confirmChar',owner===undefined||owner===S.activeSeat?'邀請這位旅伴':`已由 ${owner+1}P 選擇`,155,626,380,76,true,1,!S.pickAnim&&S.seats[S.activeSeat].type!=='off'&&(owner===undefined||owner===S.activeSeat));
 richPanel(624,256,494,438);
 txt(CHAR_NAMES[ci],870,355,36,'center',RICH_INK,1000,false);
 fitTxt(CHAR_TITLES[ci]+' · '+CHAR_ROLES[ci],870,400,382,23,'center',RICH_MUTED,900,false,17);
 paragraph(CHAR_CONCEPTS[ci],870,448,364,23,34,3,'center',RICH_INK,800,false);
 txt('旅伴專長',870,532,22,'center',RICH_MUTED,900,false);paragraph(ROLE_DESC[ci],870,580,364,25,32,2,'center',RICH_INK,900,false);
 richPanel(1140,265,425,430);txt('旅團配置',1352,355,28,'center',RICH_INK,1000,false);
 txt(`參賽 ${activeSeatIds().length} 人 · 真人 ${humanCount()} 人`,1352,395,24,'center',RICH_INK,900,false);
 const editing=S.seats[S.activeSeat];txt(`編輯 ${S.activeSeat+1}P`,1352,431,23,'center',RICH_MUTED,900,false);
 btn('seatType'+S.activeSeat,editing.type==='human'?'真人玩家':editing.type==='ai'?'電腦玩家':'加入旅團',1174,455,357,82,false,1,!S.pickAnim);
 if(editing.type==='ai')btn('diff'+S.activeSeat,'難度：'+(editing.diff==='easy'?'輕鬆':editing.diff==='smart'?'聰明':'標準'),1174,550,357,60,false,1,!S.pickAnim);
 btn('startGame','選擇隨身裝備',1170,619,365,80,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);
 if(SETUP_VIEW.notice&&performance.now()<SETUP_VIEW.noticeUntil)fitTxt(SETUP_VIEW.notice,1000,715,780,22,'center','#fff0b1',900,true,16);
 for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);
 drawPickAnim();
};
seatPanel=function(i,x,y){
 const seat=S.seats[i],selected=S.activeSeat===i,enabled=seat.type!=='off';
 richLedger(x+10,y,380,150,enabled?1:.55);
 if(selected){X.strokeStyle=PLAYER_COLORS[i];X.lineWidth=5;X.strokeRect(x+15,y+5,370,140);}
 if(enabled&&!(S.pickAnim&&S.pickAnim.seat===i))contain(IM['c'+seat.char],x+22,y+16,93,119);
 fitTxt(`${i+1}P · ${enabled?CHAR_NAMES[seat.char]:'空席'}`,x+245,y+32,220,28,'center',RICH_INK,1000,false,19);
 S.buttons.push({id:'seat'+i,x:x+10,y,w:380,h:150,en:!S.pickAnim});
 fitTxt(seat.type==='human'?'真人玩家':seat.type==='ai'?'電腦玩家':'尚未加入',x+250,y+78,223,25,'center',RICH_INK,900,false,18);
 fitTxt(selected?'正在編輯':'點擊編輯',x+250,y+123,223,21,'center',RICH_MUTED,800,false,16);
};
mapSelect=function(){
 cover(IM.setupBg,0,0,W,H,.82);txt('選擇冒險地圖',800,52,42,'center','#fff0b6',1000,true);
 txt('三個童話世界，各有不同的經營節奏',800,96,21);
 btn('mapBack','返回選角',22,20,190,62);
 MAPS.forEach((m,i)=>{const x=38+i*524,selected=S.mapIndex===i;
  panelPlate(x,142,476,617,selected?1:.85);
  X.save();X.beginPath();X.rect(x+24,174,428,256);X.clip();cover(IM['mapPreview'+i],x+24,174,428,256,selected?1:.8);X.restore();
  fitTxt(m.name,x+238,477,398,34,'center','#fff0bc',1000,true,23);
  fitTxt(m.tag+' · '+m.difficulty,x+238,519,398,22,'center','#cfe7e5',850,true,17);
  m.desc.forEach((line,j)=>fitTxt(line,x+238,561+j*32,390,23,'center','#fff5dc',850,true,18));
  fitTxt(`土地 ×${m.priceRate.toFixed(2)} · 租金 ×${m.rentRate.toFixed(2)}`,x+238,632,410,20,'center','#ffe0a4',900,true,15);
  btn('chooseMap'+i,selected?'已選擇這個世界':'探索這個世界',x+56,672,364,72,selected,1,true);
  if(selected){X.strokeStyle='#ffe396';X.lineWidth=4;X.strokeRect(x+8,150,460,601);}
 });
 btn('mapNext','設定遊戲條件',580,803,440,76,true);
};
playerHudCard=function(p,i){
 const x=22+i*327,y=18,w=314,h=106,current=p.id===cp().id;
 richLedger(x,y,w,h,p.bankrupt?.5:1);contain(IM['c'+p.char],x+11,y+12,77,83);
 fitTxt(`${p.id+1}P ${CHAR_NAMES[p.char]}${current?' · 行動中':''}`,x+104,y+28,193,21,'left',RICH_INK,1000,false,14);
 fitTxt('$'+Math.max(0,p.cash).toLocaleString(),x+104,y+59,193,23,'left',RICH_INK,1000,false,15);
 fitTxt('土地 '+ownedLands(p).length+' · 資產 '+Math.round(netWorth(p)/1000)+'K',x+104,y+86,193,18,'left',RICH_MUTED,800,false,13);
 if(current){X.strokeStyle=PLAYER_COLORS[p.id];X.lineWidth=4;X.strokeRect(x+5,y+5,w-10,h-10);}
 S.buttons.push({id:'inspectPlayer'+p.id,x,y,w,h,en:!S.rolling&&!S.board.popup});
};
hud=function(){
 const b=S.board,p=cp(),busy=S.rolling||!!b.popup;
 b.players.forEach(playerHudCard);
 btn('pause','選單',1406,28,172,72,false,1,!busy);
 panelPlate(360,790,900,88);fitTxt(`${b.mapRules.name} · 第 ${b.round}/${S.rounds} 回合`,555,819,335,24,'center','#fff0bb',900,true,17);
 const status=S.diceAnim?'擲骰中':b.phase==='moving'?'沿路探索中':b.popup?'等待選擇':p.type==='ai'?'旅伴正在思考':'輪到你行動';
 fitTxt(`${CHAR_NAMES[p.char]} · ${status}`,555,850,335,19,'center','#e5eee5',900,true,14);
 btn('forecast','路線預覽',771,803,207,60,false,1,!busy&&b.phase==='pre-roll'&&p.type==='human');
 btn('v8-speed',S.settings.reduced?'簡化演出':`演出 ×${S.settings.animationSpeed}`,1000,803,220,60,false,1,!busy);
 diceIconButton('roll',1390,684,160,!busy&&!b.winner&&b.phase==='pre-roll'&&p.type==='human');
 txt('擲骰前進',1470,868,23,'center','#fff5c9',900,true);
 miniMapHud();
 const effects=(p.effects||[]).map(e=>e.kind+' '+e.turns+'回合').join(' · '),gear=(p.equipment||[]).map(id=>equipmentDef(id)?.name).filter(Boolean).join('、');
 panelPlate(22,138,890,64,.94);fitTxt(`物價 ×${marketIndex().toFixed(1)} · ${gear||'未攜帶裝備'}${effects?' · '+effects:''}`,467,172,812,21,'center','#fff0c5',900,true,15);
 if(S.msg&&S.msg!==S.toastText){S.toastText=S.msg;S.toastAt=performance.now();}
 if(S.toastText&&!b.popup&&!S.diceAnim){const age=performance.now()-(S.toastAt||0),alpha=Math.max(0,Math.min(1,(3900-age)/1300));if(alpha>0){X.save();X.globalAlpha=alpha;panelPlate(410,698,780,74,.92);fitTxt(S.toastText,800,735,700,23,'center','#fff4c9',900,true,16);X.restore();}else if(S.msg===S.toastText)S.msg='';}
 richTrackCash();richDrawTransfers();diceThrowOverlay();if(!busy&&p.type==='ai'&&b.phase==='pre-roll')aiTurn();
};
function richPrepareCast(){
 if(!S.board)return;
 for(const p of S.board.players){const role=CHAR_KEYS[p.char];void IM['v8-atlas-'+role];void IM['landmark_'+role];
  if(!motionResources.has(role)&&!motionPending.has(role)&&globalThis.CxQCharacterMotion){motionPending.add(role);CxQCharacterMotion.prepare(role).then(r=>motionResources.set(role,r)).catch(()=>{}).finally(()=>motionPending.delete(role));}
 }
}
function richReact(p,pose,duration=1200){if(p&&!S.settings.reduced)richV8.reactions.set(p.id,{pose,at:performance.now(),duration});}
function richTrackCash(){
 const b=S.board;if(richV8.board!==b){richV8.board=b;richV8.cash=new Map(b.players.map(p=>[p.id,p.cash]));richV8.reactions.clear();richV8.transfers=[];return;}
 const changes=[];for(const p of b.players){const old=richV8.cash.get(p.id);if(old!==undefined&&old!==p.cash){changes.push({p,delta:p.cash-old});richReact(p,p.cash>old?'receive':'pay');}richV8.cash.set(p.id,p.cash);}
 const payer=changes.find(c=>c.delta<0),recipient=changes.find(c=>c.delta>0);
 if(changes.length)richV8.transfers.push({from:payer?.p.id,to:recipient?.p.id,delta:recipient?.delta||payer?.delta||0,at:performance.now()});
 richV8.transfers=richV8.transfers.slice(-8);
}
function richDrawTransfers(){
 const now=performance.now();richV8.transfers=richV8.transfers.filter(t=>now-t.at<1100);
 if(S.settings.reduced)return;
 for(const t of richV8.transfers){const u=(now-t.at)/1100,from=t.from===undefined?800:22+t.from*327+157,to=t.to===undefined?800:22+t.to*327+157;
  for(let i=0;i<5;i++){const q=Math.min(1,Math.max(0,u*1.3-i*.05)),x=from+(to-from)*q,y=150+Math.sin(q*Math.PI)*100;contain(IM['v8-coin-token'],x-15,y-15,30,30,1-u);}
  fitTxt((t.delta>=0?'+':'−')+'$'+Math.abs(t.delta).toLocaleString(),to,144-u*35,260,24,'center',t.delta>=0?'#ffe698':'#ffd4c8',1000,true,17);
 }
}
const richOriginalAction=action;
action=function(id){
 if(!id)return;
 if(id==='v8-retry'){richRetry(richV8.failed);return;}
 if(id==='v8-back'){S.board=null;S.rolling=false;S.diceAnim=null;S.scene='home';richV8.scene='';HOME.locked=false;return;}
 if(id.startsWith('v8-char-')){if(!S.pickAnim)SETUP_VIEW.char=Number(id.slice(8));return;}
 if(id==='v8-speed'){if(!S.rolling&&!S.board?.popup){S.settings.animationSpeed=S.settings.animationSpeed===2?1:2;savePrefs();}return;}
 if(id==='v8-reduced'){S.settings.reduced=!S.settings.reduced;savePrefs();return;}
 if(id==='v8-animation'){S.settings.animationSpeed=S.settings.animationSpeed===2?1:2;savePrefs();return;}
 richOriginalAction(id);
};
const richOriginalSettings=settings;
settings=function(){richOriginalSettings();btn('v8-animation',`演出速度 ×${S.settings.animationSpeed}`,130,575,340,68);btn('v8-reduced','簡化演出 '+(S.settings.reduced?'開':'關'),1130,575,340,68);};
plotAnchor=function(t){
 if(t.type!=='land')return {x:t.x,y:t.y};
 const road=MAPS[S.board?.mapIndex||0].road,nx=(t.x-road.cx)/road.rx,ny=(t.y-road.cy)/road.ry,length=Math.hypot(nx,ny)||1;
 return {x:t.x+nx/length*120,y:t.y+ny/length*120};
};
drawTile=function(t){
 const road=roadAnchor(t),plot=plotAnchor(t),selected=S.board?.selectedTile===t;
 contain(t.type==='land'?IM.roadNode:tileImage(t.type),road.x-48,road.y-48,96,96);
 if(t.type==='land'){
  let building=buildingImage(t);if(!building?.complete||!building.naturalWidth)building=IM['building'+(S.board.mapIndex||0)+'_4'];const build=S.board?.buildAnim,age=build?.tile===t?performance.now()-build.at:99999;
  if(t.owner>=0){
   const size=[0,104,126,148,168,184][Math.min(5,t.level)]||104;
   X.fillStyle='rgba(20,25,18,.25)';X.beginPath();X.ellipse(plot.x,plot.y+12,55,23,0,0,Math.PI*2);X.fill();
   if(age<500&&!S.settings.reduced&&richImageReady('v8-construction'))contain(IM['v8-construction'],plot.x-87,plot.y-132,174,152);
   else if(building){const reveal=S.settings.reduced?1:Math.min(1,Math.max(0,(age-400)/350));X.save();if(reveal<1){X.beginPath();X.rect(plot.x-size/2,plot.y+19-size*reveal,size,size*reveal);X.clip();}contain(building,plot.x-size/2,plot.y+19-size,size,size);X.restore();}
   drawOwnerFlag(t.owner,plot.x-79,plot.y-89,47,65);
   X.fillStyle=PLAYER_COLORS[t.owner];X.beginPath();X.arc(road.x,road.y,9,0,Math.PI*2);X.fill();
   if(age<1150&&!S.settings.reduced)fitTxt('建築更新',plot.x,plot.y-size-18,190,22,'center','#fff1ae',1000,true,16);
  }else {X.strokeStyle='rgba(241,215,141,.65)';X.lineWidth=3;X.beginPath();X.ellipse(plot.x,plot.y+6,41,23,0,0,Math.PI*2);X.stroke();}
 }else {
  const facility=facilityImage(t.type);if(facility)contain(facility,road.x-60,road.y-130,120,135);
  if(t.type==='start'||t.type==='event')txt(t.type==='start'?'起點':'命運',road.x,road.y,23,'center','#fff7d2',1000,true);
 }
 if(selected){X.strokeStyle='#ffeb83';X.lineWidth=5;X.beginPath();X.ellipse(road.x,road.y,55,40,0,0,Math.PI*2);X.stroke();if(t.type==='land')fitTxt(REGION_NAMES[t.region]+' $'+Math.round(t.price/1000)+'K',plot.x,plot.y+49,240,21,'center','#fff5d1',900,true,16);}
};
drawMap=function(){const b=S.board;richDrawWorld(b.mapIndex||0);b.tiles.forEach(drawTile);for(const n of b.npcs||[]){const tile=b.tiles[n.pos];if(tile)npcMarker(n,tile);}drawPlayers();if(!S.settings.reduced){const time=performance.now()/1000;X.save();X.fillStyle=b.mapIndex===1?'#addef7':'#fff4a1';for(let i=0;i<14;i++){const x=420+(i*173)%2320,y=370+(i*137)%1060+Math.sin(time*.7+i)*18;X.globalAlpha=.13+.14*(1+Math.sin(time+i));X.beginPath();X.arc(x,y,2.5,0,Math.PI*2);X.fill();}X.restore();}};
miniMapHud=function(){
 const b=S.board,x=20,y=730,w=260,h=146;panelPlate(x-10,y-38,w+20,h+50,.96);txt('路線小地圖',x+w/2,y-15,19,'center','#fff0ad',1000,true);
 X.save();X.beginPath();X.rect(x,y,w,h);X.clip();X.translate(x,y);X.scale(w/MW,h/MH);richDrawWorld(b.mapIndex||0);X.restore();
 X.strokeStyle='#fff080';X.lineWidth=2;X.strokeRect(x+b.cam.x/MW*w,y+b.cam.y/MH*h,W/MW*w,H/MH*h);
 for(const p of b.players){if(p.bankrupt)continue;const t=b.tiles[p.pos];X.fillStyle=PLAYER_COLORS[p.id];X.beginPath();X.arc(x+t.x/MW*w,y+t.y/MH*h,3.5,0,Math.PI*2);X.fill();}
};
aiTurn=function(){
 const b=S.board;if(S.scene!=='game'||!b)return;const p=cp();
 if(!p||p.type!=='ai'||b.popup||b.winner||b.phase!=='pre-roll')return;
 if(richV8.ai?.board===b&&richV8.ai.player===p)return;
 const token={board:b,player:p};richV8.ai=token;
 setTimeout(()=>{if(richV8.ai!==token)return;richV8.ai=null;if(S.scene==='game'&&S.board===b&&cp()===p&&!b.popup&&!b.winner&&b.phase==='pre-roll'){if(richSceneReady())rollDice();else aiTurn();}},p.diff==='easy'?520:p.diff==='smart'?240:360);
};
const richOriginalScenePopup=scenePopup;
scenePopup=function(q,b,p){
 const age=performance.now()-(q.openedAt||0);
 if(q.kind==='tile'&&q.tile.type==='land'){
  const t=q.tile,own=t.owner===p.id,unowned=t.owner<0,cost=unowned?buyCost(p,t):own?upgradeCost(t,p):rentEstimate(t,p),owner=b.players.find(player=>player.id===t.owner),mi=b.mapIndex||0;
  richPanel(390,100,820,700);txt(REGION_NAMES[t.region]+' · 地契',800,273,36,'center',RICH_INK,1000,false);
  contain(unowned?IM['building'+mi+'_1']:buildingImage(t),485,315,240,220);
  txt(unowned?'尚未開發':own?'你的童話地產':CHAR_NAMES[owner?.char||0]+'的地產',945,350,27,'center',RICH_INK,900,false);
  txt(unowned?'購地費用':own?'基礎租金':'應付租金',945,410,22,'center',RICH_MUTED,800,false);
  txt('$'+(own?rentEstimate(t):cost).toLocaleString(),945,462,35,'center',RICH_INK,1000,false);
  paragraph(unowned?'取得土地後，可逐級建設並向旅伴收租。':own?`建築 Lv${t.level} / 5${t.level<5?' · 升級費 $'+cost.toLocaleString():' · 已達最高階段'}`:p.shield>0?'持有護盾，可以抵銷本次租金。':'完成結算後，繼續下一位旅伴的回合。',800,574,650,24,35,3,'center',RICH_INK,800,false);
  if(unowned||own){if(unowned||t.level<5)btn(unowned?'buy':'upgrade',unowned?'取得地契':'建設下一階段',455,672,445,86,true,1,p.cash>=cost);btn('skip',own?'完成回合':'暫時略過',925,672,230,86);}
  else btn('pay',p.shield>0?'使用護盾並結算':'支付租金',520,672,560,86,true);
  return true;
 }
 if(q.kind==='event'){
  const draw=()=>{richPanel(350,55,900,790);fitTxt(q.name,800,256,720,34,'center',RICH_INK,1000,false,24);const art=(q.art&&IM['event_'+q.art])||IM['eventScene'+(b.mapIndex||0)];X.save();X.beginPath();X.rect(490,305,620,245);X.clip();cover(art,490,305,620,245);X.restore();paragraph(q.desc,800,630,700,24,34,4,'center',RICH_INK,850,false);btn('eventOk','收下結果，繼續旅程',510,733,580,80,true);};
  if(!S.settings.reduced&&age<240){X.save();X.translate(800,450);X.scale(Math.max(.05,age/240),1);X.translate(-800,-450);draw();X.restore();S.buttons=[];}else draw();return true;
 }
 return richOriginalScenePopup(q,b,p);
};
const richOriginalMarkUpgrade=markUpgrade;
markUpgrade=function(t){richOriginalMarkUpgrade(t);richReact(S.board?.players.find(p=>p.id===t.owner),'skill',1300);void IM['v8-construction'];};
const richOriginalNPC=applyNPCByName;
applyNPCByName=function(name,p){richOriginalNPC(name,p);richReact(p,'skill',1200);};
globalThis.RichmanV8={ready:richSceneReady,loading:richLoading,react:richReact,state:richV8};
