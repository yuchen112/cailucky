'use strict';
const C=document.getElementById('game'),X=C.getContext('2d',{alpha:false});
const W=1600,H=900,MW=3200,MH=1800,A='assets/';
const IM={};
const CHAR_KEYS=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'];
const CHAR_NAMES=['快樂','夢想','夜晚陪伴','悲傷','信任','回憶','成長','療癒','幸運','希望'];
const CHAR_TITLES=['派對小彩星','星願魔法師','月夜守護者','雨天陪伴者','鑰匙守護者','回憶收藏家','森林旅伴','暖心絨絨','四葉鈴狐','光線編織者'];
const CHAR_CONCEPTS=['把日常變成值得笑的時刻。','替願望點亮下一步。','在夜晚陪你安靜前進。','陪你把難過慢慢放下。','守住約定與安心感。','把重要片段收進披風裡。','一步一步長大的森林夥伴。','陪你把低落安靜地走過。','帶著剛剛好的好運同行。','溫柔地把明天點亮。'];
const CHAR_ROLES=['幸運型','骰控型','卡片型','防禦型','商店型','移動型','土地型','小遊戲型','收租型','特殊型'];
const ROLE_DESC=['正向事件獎金提高','骰點過低時有機會修正','抽卡時有機會額外獲得卡片','支付租金時享有減免','商店價格較低','移動能力較穩定','購地價格享有折扣','小遊戲現金獎勵提高','收到的租金提高','首次瀕臨破產可獲救'];
const PLAYER_COLORS=['#ff716e','#6db9ff','#7ed87c','#ffd05d'];
const REGION_NAMES=['星願花園','月輝城鎮','森語溪谷','雲端市集'];
const MAPS=[
  {key:'starwish',name:'星願花園',tag:'初次冒險',difficulty:'輕鬆',desc:['道路平穩、價格均衡','適合第一次遊玩'],priceRate:1,rentRate:1,eventRate:1},
  {key:'moonharbor',name:'月光港灣',tag:'潮汐之路',difficulty:'標準',desc:['租金較高、卡片活躍','港口事件改變局勢'],priceRate:1.08,rentRate:1.15,eventRate:1.2},
  {key:'cloudbazaar',name:'雲端市集',tag:'空島競逐',difficulty:'挑戰',desc:['土地昂貴、事件頻繁','適合熟悉規則的玩家'],priceRate:1.18,rentRate:1.28,eventRate:1.45}
];
const SAVE='cxq_richman_latest_save_v4',PREF='cxq_richman_pref_v1';
const S={scene:'home',buttons:[],seats:[{type:'human',char:6,diff:'standard'},{type:'ai',char:1,diff:'standard'},{type:'off',char:2,diff:'standard'},{type:'off',char:3,diff:'standard'}],activeSeat:0,mapIndex:0,money:200000,rounds:30,victory:'assets',eventLevel:'standard',startingCards:1,gods:true,board:null,msg:'',rolling:false,dice:1,forcedDice:0,pickAnim:null,settings:{master:80,bgm:70,sfx:80,vibrate:true,lang:'zh-Hant',graphics:'medium'}};
try{Object.assign(S.settings,JSON.parse(localStorage.getItem(PREF)||'{}'))}catch(e){}

const ASSET_REV='20260824-0745';
function load(k,u){const i=new Image();i.decoding='async';i.onload=()=>{IM[k]=i};i.onerror=()=>{IM[k]=null};i.src=u+'?v='+ASSET_REV;IM[k]=i;return i}
load('btnBlue',A+'ui/btn_blue.webp');load('btnRed',A+'ui/btn_red.webp');
load('homeMenuNew',A+'ui/home_menu_new_v1.png');load('homeMenuContinue',A+'ui/home_menu_continue_v1.png');load('homeMenuHelp',A+'ui/home_menu_help_v1.png');load('homeMenuSettings',A+'ui/home_menu_settings_v1.png');
load('charSlot',A+'ui/char_slot_v2.webp');load('playerSeat',A+'ui/player_seat_v2.webp');load('roleInfo',A+'ui/role_info_v2.webp');
load('characterStage',A+'ui/character_stage_v1.png');load('abilityPanel',A+'ui/ability_panel_v1.png');
for(let i=0;i<4;i++)load('playerSeatP'+i,A+`ui/player_seat_p${i+1}_v1.png`);
load('statusHuman',A+'ui/status_human_v1.png');load('statusAi',A+'ui/status_ai_v1.png');load('statusOff',A+'ui/status_off_v1.png');
load('homeBg',A+'backgrounds/home_scene_v7.png');load('setupBg',A+'backgrounds/setup_scene_v4.png');load('mapBg',A+'backgrounds/map_scene_r1.webp');
MAPS.forEach((m,i)=>load('mapPreview'+i,A+'maps/map_preview_'+m.key+'_v1.png'));
load('tile_land',A+'tiles/land.webp');load('tile_card',A+'tiles/card_v2.png');load('tile_shop',A+'tiles/shop.webp');load('tile_minigame',A+'tiles/minigame.webp');load('tile_npc',A+'tiles/npc.webp');
// Known-corrupt start/event rasters are intentionally not loaded. They are visually quarantined.
for(let i=1;i<=6;i++)load('dice'+i,A+'dice/dice_'+i+'.webp');
CHAR_KEYS.forEach((k,i)=>{load('c'+i,'../../assets/characters/cxq-role-'+k+'.webp');load('portrait'+i,A+'characters/portraits/'+k+'_portrait_v1.png')});
load('joyWalkRightContact',A+'characters/joy/walk_right_contact_v1.png');load('joyWalkRightPassing',A+'characters/joy/walk_right_passing_v1.png');
load('dreamWalkRightContact',A+'characters/dream/walk_right_contact_v1.png');load('dreamWalkRightPassing',A+'characters/dream/walk_right_passing_v1.png');
load('nightWalkRightContact',A+'characters/night/walk_right_contact_v1.png');load('nightWalkRightPassing',A+'characters/night/walk_right_passing_v1.png');
load('sadnessWalkRightContact',A+'characters/sadness/walk_right_contact_v1.png');load('sadnessWalkRightPassing',A+'characters/sadness/walk_right_passing_v1.png');
load('trustWalkRightContact',A+'characters/trust/walk_right_contact_v1.png');load('trustWalkRightPassing',A+'characters/trust/walk_right_passing_v1.png');
load('memoryWalkRightContact',A+'characters/memory/walk_right_contact_v1.png');load('memoryWalkRightPassing',A+'characters/memory/walk_right_passing_v1.png');
load('growthWalkRightContact',A+'characters/growth/walk_right_contact_v1.png');load('growthWalkRightPassing',A+'characters/growth/walk_right_passing_v1.png');
IM.house1=IM.house2=IM.house3=null;

const VIEW={scale:1,ox:0,oy:0};
function resize(){const d=Math.min(devicePixelRatio||1,2),vw=(window.visualViewport?.width||innerWidth),vh=(window.visualViewport?.height||innerHeight);C.width=Math.max(1,Math.round(vw*d));C.height=Math.max(1,Math.round(vh*d));const sx=C.width/W,sy=C.height/H;VIEW.scale=Math.min(sx,sy);VIEW.ox=(C.width-W*VIEW.scale)/2;VIEW.oy=0}
addEventListener('resize',resize);addEventListener('orientationchange',()=>{resize();setTimeout(resize,180);setTimeout(resize,520)});if(window.visualViewport)visualViewport.addEventListener('resize',resize);resize();
function begin(){X.setTransform(1,0,0,1,0,0);X.fillStyle=S.scene==='game'?'#315d65':'#183f57';X.fillRect(0,0,C.width,C.height);const edgeBg=S.scene==='home'?IM.homeBg:S.scene==='setup'?IM.setupBg:null;if(edgeBg&&edgeBg.complete&&edgeBg.naturalWidth){const r=Math.max(C.width/edgeBg.naturalWidth,C.height/edgeBg.naturalHeight),iw=edgeBg.naturalWidth*r,ih=edgeBg.naturalHeight*r;X.save();X.globalAlpha=.72;X.drawImage(edgeBg,(C.width-iw)/2,(C.height-ih)/2,iw,ih);X.restore()}X.setTransform(VIEW.scale,0,0,VIEW.scale,VIEW.ox,VIEW.oy);S.buttons=[]}
function pointerToGame(e){const r=C.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*C.width,py=(e.clientY-r.top)/r.height*C.height;return{x:(px-VIEW.ox)/VIEW.scale,y:(py-VIEW.oy)/VIEW.scale}}
function txt(s,x,y,z=26,a='center',c='#fff',w=800,o=true){X.save();X.font=`${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;X.textAlign=a;X.textBaseline='middle';if(o){X.lineJoin='round';X.lineWidth=Math.max(2,z/7);X.strokeStyle='rgba(20,14,28,.9)';X.strokeText(String(s),x,y)}X.fillStyle=c;X.fillText(String(s),x,y);X.restore()}
function contain(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore();return true}
function cover(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.max(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore();return true}
function stretch(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x,y,w,h);X.restore();return true}
function containFacing(im,x,y,w,h,faceRight=true,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r,cx=x+w/2,iy=y+(h-ih)/2;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.translate(cx,0);X.scale(faceRight?1:-1,1);X.drawImage(im,-iw/2,iy,iw,ih);X.restore();return true}
function btn(id,label,x,y,w,h,red=false,alpha=1,en=true){contain(red?IM.btnRed:IM.btnBlue,x,y,w,h,alpha*(en?1:.38));txt(label,x+w/2,y+h*.49,Math.min(29,h*.34),'center','#fff',900,true);S.buttons.push({id,x,y,w,h,en})}
function hit(x,y){return S.buttons.slice().reverse().find(b=>b.en&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)}
function activeSeatIds(){return S.seats.map((s,i)=>s.type==='off'?-1:i).filter(i=>i>=0)}
function humanCount(){return S.seats.filter(s=>s.type==='human').length}
function assigned(ci){return activeSeatIds().find(i=>S.seats[i].char===ci)}
function title(x=350,y=138){txt('CxQ',x,y,94,'center','#ffe27a',1000,true);txt('童話大富翁',x,y+78,64,'center','#fff0b9',1000,true);txt('夢想王國資產大冒險',x,y+132,20,'center','#f4f7ff',850,true)}
const HOME={enteredAt:performance.now(),hover:null,pressed:null,leaving:null,leaveAt:0,locked:false};
function clamp01(v){return Math.max(0,Math.min(1,v))}
function easeOut(v){v=clamp01(v);return 1-Math.pow(1-v,3)}
function homeIntro(delay,duration=420){return easeOut((performance.now()-HOME.enteredAt-delay)/duration)}
function resetHome(){HOME.enteredAt=performance.now();HOME.hover=HOME.pressed=HOME.leaving=null;HOME.leaveAt=0;HOME.locked=false}
function homeTile(id,label,image,x,y,size,index,enabled=true){
  const a=homeIntro(330+index*90,360);if(a<=0)return;
  const active=HOME.pressed===id||HOME.hover===id,down=HOME.pressed===id;
  const scale=down?.955:(active?1.035:1),drawSize=size*scale,dx=x-(drawSize-size)/2,dy=y-(drawSize-size)/2+(1-a)*24;
  contain(image,dx,dy,drawSize,drawSize,a*(enabled?1:.38));
  X.save();X.globalAlpha=a*(enabled?1:.56);txt(label,x+size/2,y+size*.815+(1-a)*24,25,'center',enabled?'#fff7dd':'#cfcee0',1000,true);X.restore();
  if(active&&enabled){X.save();X.globalAlpha=a*.72;txt(down?'放開確認':'點擊進入',x+size/2,y+size-17,12,'center','#fff4b8',900,true);X.restore()}
  S.buttons.push({id,x,y,w:size,h:size,en:enabled&&!HOME.locked});
}
function home(){
  const now=performance.now(),sceneA=homeIntro(0,620),canContinue=!!localStorage.getItem(SAVE);
  cover(IM.homeBg,0,0,W,H,1);
  X.save();X.globalAlpha=sceneA;
  contain(IM.playerSeat,1120,38,430,94,.9);txt('童話棋盤冒險',1335,67,18,'center','#fff7dc',1000,true);txt('擲骰・買地・蓋房・收租・卡片・神明事件',1335,98,13,'center','#fff',850,true);X.restore();
  const logoA=homeIntro(80,520),logoY=(1-logoA)*30;X.save();X.globalAlpha=logoA;txt('CxQ',330,78+logoY,72,'center','#ffe27a',1000,true);txt('童話大富翁',330,145+logoY,52,'center','#fff1be',1000,true);txt('夢想王國資產大冒險',330,190+logoY,17,'center','#f7f2dc',900,true);X.restore();
  homeTile('start','新遊戲',IM.homeMenuNew,62,226,250,0);homeTile('continue','繼續遊戲',IM.homeMenuContinue,338,226,250,1,canContinue);homeTile('help','遊戲說明',IM.homeMenuHelp,62,500,250,2);homeTile('settings','系統設定',IM.homeMenuSettings,338,500,250,3);
  const infoA=homeIntro(740,380);X.save();X.globalAlpha=infoA;contain(IM.roleInfo,70,776,510,82,.94);txt(canContinue?'已有冒險紀錄｜可繼續上次進度':'尚無冒險紀錄｜請開始新遊戲',325,803,16,'center','#60462d',900,false);txt('2–4 人｜真人／電腦自由配置',325,832,14,'center','#76583b',850,false);X.restore();
  if(HOME.leaving){const p=clamp01((now-HOME.leaveAt)/300);X.save();X.globalAlpha=1-p;txt(HOME.leaving==='start'?'前往角色與玩家配置…':HOME.leaving==='continue'?'讀取冒險紀錄…':'',800,860,16,'center','#fff5c7',900,true);X.restore()}
  txt('CxQ FAIRYTALE RICHMAN',1515,874,11,'right','rgba(255,255,255,.82)',800,true);
}

const SETUP={stageX:260,stageY:104,stageW:520,stageH:520,seatY:684,seatX:[28,420,812,1204]};
const SETUP_VIEW={char:S.seats[S.activeSeat].char,notice:'',noticeUntil:0};
function slotPos(i){return{x:SETUP.gx+(i%5)*(SETUP.cw+SETUP.g),y:SETUP.gy+Math.floor(i/5)*(SETUP.ch+SETUP.g)}}
function seatTarget(i){return{x:SETUP.seatX[i]+60,y:SETUP.seatY+42}}
function chooseChar(ci){if(S.pickAnim||S.seats[S.activeSeat].type==='off')return;const a=S.activeSeat,b=assigned(ci),old=S.seats[a].char;if(old===ci&&b===a)return;S.pickAnim={char:ci,seat:a,swapSeat:(b!==undefined&&b!==a)?b:-1,oldChar:old,start:performance.now(),dur:650,from:{x:SETUP.stageX+SETUP.stageW/2,y:SETUP.stageY+SETUP.stageH*.52},to:seatTarget(a)}}
function updatePickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur);if(t>=1){S.seats[q.seat].char=q.char;if(q.swapSeat>=0)S.seats[q.swapSeat].char=q.oldChar;S.pickAnim=null}}
function drawPickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur),e=1-Math.pow(1-t,3),x=q.from.x+(q.to.x-q.from.x)*e,y=q.from.y+(q.to.y-q.from.y)*e;contain(IM['c'+q.char],x-66,y-92,132,154,1)}
function charCard(i,x,y,w,h){const own=assigned(i),sel=S.seats[S.activeSeat].char===i&&!S.pickAnim,moving=S.pickAnim&&S.pickAnim.char===i,fx=x+(sel?-6:0),fy=y+(sel?-7:0),fw=w+(sel?12:0),fh=h+(sel?14:0),a=own!==undefined&&!sel?.64:1;if(!moving)contain(IM['c'+i],x+24,y+20,w-48,h-60,own!==undefined&&!sel?.38:1);contain(IM.charSlot,fx,fy,fw,fh,a);txt(CHAR_NAMES[i],x+w/2,y+h-25,14,'center',sel?'#ffe786':'#fff8e8',900,true);if(own!==undefined){contain(IM.btnRed,x+5,y+5,62,34,.92);txt((own+1)+'P',x+36,y+22,13,'center','#fff',1000,true)}S.buttons.push({id:'char'+i,x,y,w,h,en:!S.pickAnim})}
function seatFrame(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const sy=Math.round(im.naturalHeight*.14),sh=Math.round(im.naturalHeight*.72);X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,0,sy,im.naturalWidth,sh,x,y,w,h);X.restore();return true}
function seatPanel(i,x,y){
  const s=S.seats[i],sel=S.activeSeat===i,typeLabel=s.type==='human'?'真人':s.type==='ai'?'電腦 AI':'空席';
  seatFrame(IM['playerSeatP'+i],x,y,368,216,s.type==='off'?.48:(sel?1:.94));
  S.buttons.push({id:'seat'+i,x,y,w:368,h:216,en:!S.pickAnim});
  if(!(S.pickAnim&&S.pickAnim.seat===i)&&s.type!=='off')contain(IM['portrait'+s.char],x+26,y+43,116,124,.99);
  contain(s.type==='human'?IM.statusHuman:s.type==='ai'?IM.statusAi:IM.statusOff,s.type==='off'?x+48:x+104,s.type==='off'?y+70:y+126,s.type==='off'?72:58,s.type==='off'?72:58,s.type==='off'?.72:1);
  txt((i+1)+'P',x+190,y+46,21,'center',sel?'#ffe67a':'#fff',1000,true);txt(s.type==='off'?'尚未參賽':CHAR_NAMES[s.char],x+278,y+46,16,'center',i===3?'#624215':'#fff',950,true);
  btn('seatType'+i,typeLabel,x+157,y+79,188,55,s.type==='human',s.type==='off'?.55:1,!S.pickAnim);
  if(s.type==='ai')btn('diff'+i,'AI 難度：'+(s.diff==='easy'?'輕鬆':s.diff==='standard'?'標準':'聰明'),x+157,y+143,188,45,false,.94,!S.pickAnim);else txt(s.type==='human'?'點擊切換為電腦':'點擊重新加入',x+251,y+163,14,'center',i===3?'#624215':'#fff5cf',850,true)
}
function setup(){updatePickAnim();cover(IM.setupBg,0,0,W,H,1);btn('back','返回首頁',18,15,190,64,false,1,!S.pickAnim);txt('角色選擇',800,42,40,'center','#fff0b6',1000,true);txt('先選席位，再選角色｜真人・電腦・空席自由配置',800,80,16,'center','#fff',850,true);const ci=SETUP_VIEW.char,owner=assigned(ci);if(!(S.pickAnim&&S.pickAnim.char===ci))contain(IM['c'+ci],SETUP.stageX+105,SETUP.stageY+72,SETUP.stageW-210,SETUP.stageH-120,.99);contain(IM.characterStage,SETUP.stageX,SETUP.stageY,SETUP.stageW,SETUP.stageH,.99);btn('prevChar','◀',132,306,108,96,false,1,!S.pickAnim);btn('nextChar','▶',672,306,108,96,false,1,!S.pickAnim);txt(`${ci+1} / ${CHAR_KEYS.length}`,520,588,19,'center','#fff5cf',900,true);btn('confirmChar',owner===undefined||owner===S.activeSeat?'選擇這名角色':`與 ${owner+1}P 交換`,350,606,340,68,true,1,!S.pickAnim&&S.seats[S.activeSeat].type!=='off');contain(IM.abilityPanel,850,104,420,420,.99);txt(CHAR_NAMES[ci],1060,164,30,'center','#fff4c8',1000,true);txt(CHAR_TITLES[ci]+'｜'+CHAR_ROLES[ci],1060,207,17,'center','#d9eaff',950,true);txt(CHAR_CONCEPTS[ci],1060,295,16,'center','#fff',850,true);txt('專屬能力',1060,348,15,'center','#ffe17b',1000,true);txt(ROLE_DESC[ci],1085,407,15,'center','#fff6d6',900,true);txt('★',935,407,32,'center','#75d8ff',1000,true);txt(`目前設定：${S.activeSeat+1}P`,1060,473,18,'center',PLAYER_COLORS[S.activeSeat],1000,true);btn('money','起始資金 $'+S.money.toLocaleString(),1278,174,300,64,false,.96,!S.pickAnim);btn('rounds',S.rounds+' 回合',1278,250,300,64,false,.96,!S.pickAnim);txt(`參賽 ${activeSeatIds().length} 人｜真人 ${humanCount()} 人`,1428,347,17,'center','#fff',900,true);btn('startGame','下一步',1268,388,310,86,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);if(SETUP_VIEW.notice&&performance.now()<SETUP_VIEW.noticeUntil)txt(SETUP_VIEW.notice,1060,558,17,'center','#ffe27a',1000,true);for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);drawPickAnim()}

function mapSelect(){
  cover(IM.setupBg,0,0,W,H,.88);txt('選擇冒險地圖',800,58,44,'center','#fff0b6',1000,true);txt('每張地圖都有不同的土地價格、租金與事件節奏',800,101,18,'center','#fff',850,true);btn('mapBack','返回選角',22,20,190,62,false);
  const xs=[150,620,1090];
  MAPS.forEach((m,i)=>{const x=xs[i],selected=S.mapIndex===i;stretch(IM.abilityPanel,x-10,125,380,620,selected?1:.84);cover(IM['mapPreview'+i],x+24,162,312,292,selected?1:.7);txt(m.name,x+180,488,30,'center','#fff2bd',1000,true);txt(m.tag+'｜'+m.difficulty,x+180,527,17,'center','#d9eaff',900,true);txt(m.desc[0],x+180,560,16,'center','#fff',850,true);txt(m.desc[1],x+180,585,16,'center','#fff',850,true);txt(`土地 ×${m.priceRate.toFixed(2)}　租金 ×${m.rentRate.toFixed(2)}`,x+180,617,14,'center','#ffe17b',850,true);btn('chooseMap'+i,selected?'已選擇':'選擇地圖',x+55,650,250,58,selected,false,1)});
  btn('mapNext','遊戲條件',630,772,340,84,true);
}

function rulesSetup(){
  const m=MAPS[S.mapIndex];cover(IM.setupBg,0,0,W,H,.82);txt('遊戲條件',800,58,44,'center','#fff0b6',1000,true);txt(`${m.name}｜${activeSeatIds().length} 名參賽者`,800,103,18,'center','#fff',900,true);btn('rulesBack','返回地圖',22,20,190,62,false);
  contain(IM.abilityPanel,180,145,560,560,.98);txt('基本規則',460,205,30,'center','#fff2bd',1000,true);btn('ruleMoney','起始資金　$'+S.money.toLocaleString(),250,265,420,68,false);btn('ruleRounds','遊戲回合　'+S.rounds,250,350,420,68,false);btn('ruleVictory','勝利條件　'+(S.victory==='assets'?'總資產最高':'最後生存者'),250,435,420,68,false);btn('ruleCards','起始卡片　'+S.startingCards+' 張',250,520,420,68,false);
  contain(IM.abilityPanel,860,145,560,560,.98);txt('事件規則',1140,205,30,'center','#fff2bd',1000,true);btn('ruleEvents','事件頻率　'+(S.eventLevel==='low'?'較少':S.eventLevel==='standard'?'標準':'熱鬧'),930,265,420,68,false);btn('ruleGods','神明／NPC　'+(S.gods?'開啟':'關閉'),930,350,420,68,false);txt(`地圖租金倍率 ×${m.rentRate.toFixed(2)}`,1140,460,18,'center','#fff7dd',900,true);txt('所有設定都可在開局前再次調整',1140,510,16,'center','#d9eaff',850,true);
  btn('launchGame','開始冒險',630,772,340,84,true);
}

function tileImage(type){if(type==='start')return IM.tile_shop||IM.tile_land;if(type==='event')return IM.tile_card||IM.tile_land;return IM['tile_'+type]||IM.tile_land}
function npcMarker(n,t){contain(IM.tile_npc,t.x-40,t.y-158,80,80,.92);txt(n.name,t.x,t.y-174,12,'center','#fff8ce',900,true)}
function drawTile(t){contain(tileImage(t.type),t.x-88,t.y-88,176,176,1);if(t.type==='start'||t.type==='event')txt(t.type==='start'?'起點':'事件',t.x,t.y+4,16,'center','#fff6d2',1000,true);if(t.type==='land'){if(t.owner>=0){contain(IM.btnRed,t.x-36,t.y-103,72,36,.88);txt((t.owner+1)+'P',t.x,t.y-86,14,'center',PLAYER_COLORS[t.owner],1000,true);if(t.level>0&&IM['house'+t.level])contain(IM['house'+t.level],t.x-58,t.y-148,116,116,.98)}txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+69,13,'center','#fff6d2',900,true)}}
function drawPlayers(){const b=S.board,now=performance.now();for(const p of b.players){if(p.bankrupt)continue;const t=b.tiles[p.pos],same=b.players.filter(q=>!q.bankrupt&&q.pos===p.pos),idx=same.indexOf(p),off=(idx-(same.length-1)/2)*34;let x=t.x+off,y=t.y;if(p.moveAnim){const q=p.moveAnim,u=Math.min(1,(now-q.start)/q.dur),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;x=q.from.x+(q.to.x-q.from.x)*e+off;y=q.from.y+(q.to.y-q.from.y)*e}const key=CHAR_KEYS[p.char],contact=IM[key+'WalkRightContact'],passing=IM[key+'WalkRightPassing'];if(p.moveAnim&&contact?.complete&&passing?.complete){const q=p.moveAnim,frame=Math.floor((now-q.start)/105)%2?passing:contact;containFacing(frame,x-74,y-184,148,164,q.to.x>=q.from.x)}else contain(IM['c'+p.char],x-62,y-174,124,144);txt((p.id+1)+'P',x,y-177,14,'center',PLAYER_COLORS[p.id],1000,true)}}
function drawMap(){const b=S.board;stretch(IM.mapBg,0,0,MW,MH,1);b.tiles.forEach(drawTile);if(b.npcs)for(const n of b.npcs){const t=b.tiles[n.pos];if(t)npcMarker(n,t)}drawPlayers()}
function hud(){const b=S.board,p=cp();contain(IM.playerSeat,18,16,570,72,.96);txt(`${p.id+1}P  ${CHAR_NAMES[p.char]}   $${Math.max(0,p.cash).toLocaleString()}`,303,51,20,'center','#fff',900,true);contain(IM.roleInfo,1218,16,362,76,.95);txt(`第 ${b.round}/${S.rounds} 回合`,1395,43,18,'center','#50321d',1000,false);const fx=(p.effects||[]).map(e=>`${e.kind}${e.turns}`).join(' ');if(fx)txt(fx,600,48,14,'left','#ffe69a',850,true);contain(IM['dice'+S.dice],1325,620,145,145);btn('roll','擲骰子',1260,770,300,86,true,1,!S.rolling&&!b.popup&&!b.winner);btn('cards','卡片 '+p.cards.length,1055,786,180,60,false,.95,!S.rolling&&!b.popup);if(S.msg)txt(S.msg,800,850,16,'center','#fff6d2',800,true)}
function popup(){const b=S.board,q=b.popup;if(!q)return;const p=cp();X.fillStyle='rgba(4,8,24,.64)';X.fillRect(0,0,W,H);contain(IM.abilityPanel,440,115,720,670,.99);let title='冒險訊息',body='',actions=[];
if(q.kind==='tile'){const t=q.tile;title=typeName(t.type);if(t.type==='land'){if(t.owner<0){body=`空地售價 $${buyCost(p,t).toLocaleString()}`;actions=[['buy','購買土地'],['skip','暫時略過']]}else if(t.owner===p.id){body=t.level<3?`目前 Lv${t.level}，升級費 $${Math.round(t.price*.65).toLocaleString()}`:'這塊土地已升至最高等級';actions=t.level<3?[['upgrade','升級土地'],['skip','完成回合']]:[['skip','完成回合']]}else{body=`需支付 $${rentFor(t,p).toLocaleString()} 租金`;actions=[['pay',p.shield>0?'使用護盾／結算':'支付租金']]} }else if(t.type==='start'){body='在起點稍作休息，獲得旅費。';actions=[['ok','繼續冒險']]}else{body=`抵達${typeName(t.type)}格`;actions=[['special','查看結果']]}}
else if(q.kind==='event'){title=q.name;body=q.desc;actions=[['eventOk','收下結果']]}
else if(q.kind==='npc'){title=`遇見${q.name}`;body=q.desc;actions=[['npcOk','繼續冒險']]}
else if(q.kind==='carddraw'){title='獲得卡片';body=q.card;actions=[['cardOk','收入卡冊']]}
else if(q.kind==='shop'){title='童話商店';body=`花費 $${shopCost(p).toLocaleString()} 購買一張隨機卡片`;actions=[['shopBuy','購買卡片'],['skip','離開商店']]}
else if(q.kind==='mini'){title=q.name||'童話小遊戲';body='光點越接近中央時按下停止，獎勵越高。';const pos=b.mini?.pos||0;X.fillStyle='#223d77';X.fillRect(570,430,460,34);X.fillStyle='#ffe067';X.fillRect(570+pos*440,424,20,46);X.strokeStyle='#fff4bb';X.lineWidth=4;X.strokeRect(790,420,20,54);actions=[['miniStop','現在停止']]}
else if(q.kind==='cards'){title='卡片冊';body=p.cards.length?'選擇一張卡片立即使用':'目前沒有卡片';p.cards.slice(0,6).forEach((c,i)=>actions.push(['useCard'+i,c]));actions.push(['closeCards','關閉卡冊'])}
else if(q.kind==='winner'){title='本局結果';body=q.text;actions=[['home','返回首頁']]}
txt(title,800,205,38,'center','#fff0a5',1000,true);txt(body,800,305,24,'center','#fff',850,true);const cols=actions.length>3?2:1,w=cols===2?270:360,h=64,startY=actions.length>3?370:470;actions.forEach((a,i)=>{const col=i%cols,row=Math.floor(i/cols),x=cols===2?515+col*300:620;btn(a[0],a[1],x,startY+row*74,w,h,i===0)});}
function help(){cover(IM.homeBg,0,0,W,H,.7);txt('遊戲說明',800,95,48,'center','#ffe58a',1000,true);const lines=['擲骰子逐格前進，購買土地、升級 Lv1～Lv3 房屋並向對手收租。','同一區域土地全數持有時，該區租金會提高。','事件、卡片、商店、小遊戲與 NPC / 神明會改變局勢。','資金不足會自動變賣房屋與土地；仍無法償付則破產退場。','真人與 AI 可自由配置 2～4 名參賽者，AI 有輕鬆／標準／聰明三種難度。'];lines.forEach((l,i)=>txt(l,800,230+i*82,23,'center','#fff',800,true));btn('home','回到首頁',630,690,340,86,true)}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(S.settings))}catch(e){}}
function settings(){cover(IM.setupBg,0,0,W,H,.72);txt('設定',800,90,46,'center','#ffe58a',1000,true);const s=S.settings;btn('master','主音量 '+s.master+'%',500,185,600,58,false);btn('bgm','BGM '+s.bgm+'%',500,255,600,58,false);btn('sfx','音效 '+s.sfx+'%',500,325,600,58,false);btn('vibrate','震動 '+(s.vibrate?'開':'關'),500,395,600,58,false);btn('graphics','畫質 '+s.graphics,500,465,600,58,false);btn('lang','語言 '+s.lang,500,535,600,58,false);btn('home','回到首頁',630,660,340,76,true)}

C.addEventListener('pointerdown',e=>{if(S.scene!=='home'||HOME.locked)return;const p=pointerToGame(e),b=hit(p.x,p.y);HOME.pressed=b?.en?b.id:null});
C.addEventListener('pointermove',e=>{if(S.scene!=='home'||HOME.locked)return;const p=pointerToGame(e),b=hit(p.x,p.y);HOME.hover=b?.en?b.id:null});
C.addEventListener('pointerleave',()=>{HOME.hover=null;HOME.pressed=null});
C.addEventListener('pointercancel',()=>{HOME.pressed=null});
