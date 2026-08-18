'use strict';
const C=document.getElementById('game'),X=C.getContext('2d',{alpha:false});
const W=1600,H=900,MW=3200,MH=1800,A='assets/';
const IM={};
const CHAR_KEYS=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'];
const CHAR_NAMES=['慶典少女','星夢魔女','夜鈴米亞','雨音澄澄','鑰匙守護者','記憶偵探','森林旅人','棉糖汪汪','森鈴芽獸','希望旅人'];
const CHAR_ROLES=['幸運型','骰控型','卡片型','防禦型','商店型','移動型','土地型','小遊戲型','收租型','特殊型'];
const ROLE_DESC=['正向事件獎金提高','骰點過低時有機會修正','抽卡時有機會額外獲得卡片','支付租金時享有減免','商店價格較低','移動能力較穩定','購地價格享有折扣','小遊戲現金獎勵提高','收到的租金提高','首次瀕臨破產可獲救'];
const PLAYER_COLORS=['#ff716e','#6db9ff','#7ed87c','#ffd05d'];
const REGION_NAMES=['星願花園','月輝城鎮','森語溪谷','雲端市集'];
const SAVE='cxq_richman_latest_save_v4',PREF='cxq_richman_pref_v1';
const S={scene:'home',buttons:[],seats:[{type:'human',char:6,diff:'standard'},{type:'ai',char:1,diff:'standard'},{type:'off',char:2,diff:'standard'},{type:'off',char:3,diff:'standard'}],activeSeat:0,money:200000,rounds:30,board:null,msg:'',rolling:false,dice:1,forcedDice:0,pickAnim:null,settings:{master:80,bgm:70,sfx:80,vibrate:true,lang:'zh-Hant',graphics:'medium'}};
try{Object.assign(S.settings,JSON.parse(localStorage.getItem(PREF)||'{}'))}catch(e){}

const ASSET_REV='20260818-1740';
function load(k,u){const i=new Image();i.decoding='async';i.onload=()=>{IM[k]=i};i.onerror=()=>{IM[k]=null};i.src=u+'?v='+ASSET_REV;IM[k]=i;return i}
load('btnBlue',A+'ui/btn_blue.webp');load('btnRed',A+'ui/btn_red.webp');
load('charSlot',A+'ui/char_slot_v2.webp');load('playerSeat',A+'ui/player_seat_v2.webp');load('roleInfo',A+'ui/role_info_v2.webp');
load('homeBg',A+'backgrounds/home_scene_v3.webp');load('setupBg',A+'backgrounds/setup_scene_v3.webp');load('mapBg',A+'backgrounds/map_scene_r1.webp');
load('tile_land',A+'tiles/land.webp');load('tile_card',A+'tiles/card.webp');load('tile_shop',A+'tiles/shop.webp');load('tile_minigame',A+'tiles/minigame.webp');load('tile_npc',A+'tiles/npc.webp');
// Known-corrupt start/event rasters are intentionally not loaded. They are visually quarantined.
for(let i=1;i<=6;i++)load('dice'+i,A+'dice/dice_'+i+'.webp');
CHAR_KEYS.forEach((k,i)=>load('c'+i,'../../assets/characters/cxq-role-'+k+'.webp'));
IM.house1=IM.house2=IM.house3=null;

const VIEW={scale:1,ox:0,oy:0};
function resize(){const d=Math.min(devicePixelRatio||1,2),vw=(window.visualViewport?.width||innerWidth),vh=(window.visualViewport?.height||innerHeight);C.width=Math.max(1,Math.round(vw*d));C.height=Math.max(1,Math.round(vh*d));const sx=C.width/W,sy=C.height/H;VIEW.scale=Math.min(sx,sy);VIEW.ox=(C.width-W*VIEW.scale)/2;VIEW.oy=(C.height-H*VIEW.scale)/2}
addEventListener('resize',resize);addEventListener('orientationchange',()=>{resize();setTimeout(resize,180);setTimeout(resize,520)});if(window.visualViewport)visualViewport.addEventListener('resize',resize);resize();
function begin(){X.setTransform(1,0,0,1,0,0);X.clearRect(0,0,C.width,C.height);X.setTransform(VIEW.scale,0,0,VIEW.scale,VIEW.ox,VIEW.oy);S.buttons=[]}
function pointerToGame(e){const r=C.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*C.width,py=(e.clientY-r.top)/r.height*C.height;return{x:(px-VIEW.ox)/VIEW.scale,y:(py-VIEW.oy)/VIEW.scale}}
function txt(s,x,y,z=26,a='center',c='#fff',w=800,o=true){X.save();X.font=`${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;X.textAlign=a;X.textBaseline='middle';if(o){X.lineJoin='round';X.lineWidth=Math.max(2,z/7);X.strokeStyle='rgba(20,14,28,.9)';X.strokeText(String(s),x,y)}X.fillStyle=c;X.fillText(String(s),x,y);X.restore()}
function contain(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore();return true}
function cover(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.max(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore();return true}
function stretch(im,x,y,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;X.save();X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalAlpha=alpha;X.drawImage(im,x,y,w,h);X.restore();return true}
function btn(id,label,x,y,w,h,red=false,alpha=1,en=true){contain(red?IM.btnRed:IM.btnBlue,x,y,w,h,alpha*(en?1:.38));txt(label,x+w/2,y+h*.49,Math.min(29,h*.34),'center','#fff',900,true);S.buttons.push({id,x,y,w,h,en})}
function hit(x,y){return S.buttons.slice().reverse().find(b=>b.en&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)}
function activeSeatIds(){return S.seats.map((s,i)=>s.type==='off'?-1:i).filter(i=>i>=0)}
function humanCount(){return S.seats.filter(s=>s.type==='human').length}
function assigned(ci){return activeSeatIds().find(i=>S.seats[i].char===ci)}
function title(x=350,y=138){txt('CxQ',x,y,94,'center','#ffe27a',1000,true);txt('童話大富翁',x,y+78,64,'center','#fff0b9',1000,true);txt('夢想王國資產大冒險',x,y+132,20,'center','#f4f7ff',850,true)}
function home(){cover(IM.homeBg,0,0,W,H,1);title();btn('start','開始遊戲',86,390,440,104,true);btn('continue','繼續遊戲',108,506,396,78,false,.96,!!localStorage.getItem(SAVE));btn('help','遊戲說明',108,596,396,78,false,.96);btn('settings','設定',108,686,396,78,false,.96);contain(IM.c0,930,450,205,285,.98);contain(IM.c1,1110,462,190,270,.97);contain(IM.c2,1270,447,210,292,.98)}

const SETUP={gx:44,gy:125,cw:178,ch:216,g:13,seatY:708,seatX:[42,432,822,1212]};
function slotPos(i){return{x:SETUP.gx+(i%5)*(SETUP.cw+SETUP.g),y:SETUP.gy+Math.floor(i/5)*(SETUP.ch+SETUP.g)}}
function seatTarget(i){return{x:SETUP.seatX[i]+60,y:SETUP.seatY+42}}
function chooseChar(ci){if(S.pickAnim||S.seats[S.activeSeat].type==='off')return;const a=S.activeSeat,b=assigned(ci),old=S.seats[a].char,p=slotPos(ci);if(old===ci&&b===a)return;S.pickAnim={char:ci,seat:a,swapSeat:(b!==undefined&&b!==a)?b:-1,oldChar:old,start:performance.now(),dur:650,from:{x:p.x+SETUP.cw/2,y:p.y+SETUP.ch*.48},to:seatTarget(a)}}
function updatePickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur);if(t>=1){S.seats[q.seat].char=q.char;if(q.swapSeat>=0)S.seats[q.swapSeat].char=q.oldChar;S.pickAnim=null}}
function drawPickAnim(){const q=S.pickAnim;if(!q)return;const t=Math.min(1,(performance.now()-q.start)/q.dur),e=1-Math.pow(1-t,3),x=q.from.x+(q.to.x-q.from.x)*e,y=q.from.y+(q.to.y-q.from.y)*e;contain(IM['c'+q.char],x-66,y-92,132,154,1)}
function charCard(i,x,y,w,h){const own=assigned(i),sel=S.seats[S.activeSeat].char===i&&!S.pickAnim,moving=S.pickAnim&&S.pickAnim.char===i;contain(IM.charSlot,x+(sel?-5:0),y+(sel?-6:0),w+(sel?10:0),h+(sel?12:0),own!==undefined&&!sel?.62:.98);if(!moving)contain(IM['c'+i],x+22,y+23,w-44,h-66,own!==undefined&&!sel?.32:1);txt(CHAR_NAMES[i],x+w/2,y+h-25,14,'center',sel?'#ffe786':'#fff8e8',900,true);if(own!==undefined){contain(IM.btnRed,x+5,y+5,62,34,.92);txt((own+1)+'P',x+36,y+22,13,'center','#fff',1000,true)}S.buttons.push({id:'char'+i,x,y,w,h,en:!S.pickAnim})}
function seatPanel(i,x,y){const s=S.seats[i],sel=S.activeSeat===i;contain(IM.playerSeat,x,y,350,132,s.type==='off'?.38:(sel?1:.92));S.buttons.push({id:'seat'+i,x,y,w:350,h:132,en:!S.pickAnim});if(!(S.pickAnim&&S.pickAnim.seat===i)&&s.type!=='off')contain(IM['c'+s.char],x+15,y+13,92,92,.98);txt((i+1)+'P',x+145,y+29,16,'center',sel?'#ffe67a':'#fff',1000,true);txt(s.type==='off'?'空席':CHAR_NAMES[s.char],x+233,y+30,14,'center','#fff',900,true);btn('human'+i,'真人',x+124,y+66,64,34,false,s.type==='human'?1:.38,!S.pickAnim);btn('ai'+i,'AI',x+192,y+66,52,34,true,s.type==='ai'?1:.38,!S.pickAnim);btn('off'+i,'空席',x+248,y+66,68,34,false,s.type==='off'?1:.38,!S.pickAnim);if(s.type==='ai')btn('diff'+i,s.diff==='easy'?'輕鬆':s.diff==='standard'?'標準':'聰明',x+244,y+100,78,28,false,.88,!S.pickAnim)}
function setup(){updatePickAnim();cover(IM.setupBg,0,0,W,H,1);btn('back','返回',18,15,150,58,false,1,!S.pickAnim);txt('角色與玩家配置',500,45,36,'center','#fff0b6',1000,true);txt('每個席位直接選真人 / AI / 空席，再選角色',500,82,16,'center','#fff',800,true);for(let i=0;i<10;i++){const p=slotPos(i);charCard(i,p.x,p.y,SETUP.cw,SETUP.ch)}const ci=S.pickAnim&&S.pickAnim.seat===S.activeSeat?S.pickAnim.char:S.seats[S.activeSeat].char;contain(IM.roleInfo,1000,100,555,205,.96);txt(CHAR_NAMES[ci],1265,145,28,'left','#50321d',1000,false);txt(CHAR_ROLES[ci]+'｜'+ROLE_DESC[ci],1265,184,15,'left','#745236',850,false);txt('目前席位 '+(S.activeSeat+1)+'P',1265,221,17,'left',PLAYER_COLORS[S.activeSeat],1000,true);txt('參賽 '+activeSeatIds().length+' 人 / 真人 '+humanCount()+' 人',1265,253,15,'left','#62462f',850,false);contain(IM['c'+ci],1048,285,225,315,.99);btn('money','起始資金 $'+S.money.toLocaleString(),1270,344,270,58,false,.96,!S.pickAnim);btn('rounds',S.rounds+' 回合',1270,414,270,58,false,.96,!S.pickAnim);btn('startGame','開始這局',1270,496,270,82,true,1,activeSeatIds().length>=2&&humanCount()>=1&&!S.pickAnim);for(let i=0;i<4;i++)seatPanel(i,SETUP.seatX[i],SETUP.seatY);drawPickAnim()}

function tileImage(type){if(type==='start')return IM.tile_shop||IM.tile_land;if(type==='event')return IM.tile_card||IM.tile_land;return IM['tile_'+type]||IM.tile_land}
function npcMarker(n,t){contain(IM.tile_npc,t.x-40,t.y-158,80,80,.92);txt(n.name,t.x,t.y-174,12,'center','#fff8ce',900,true)}
function drawTile(t){contain(tileImage(t.type),t.x-88,t.y-88,176,176,1);if(t.type==='start'||t.type==='event')txt(t.type==='start'?'起點':'事件',t.x,t.y+4,16,'center','#fff6d2',1000,true);if(t.type==='land'){if(t.owner>=0){contain(IM.btnRed,t.x-36,t.y-103,72,36,.88);txt((t.owner+1)+'P',t.x,t.y-86,14,'center',PLAYER_COLORS[t.owner],1000,true);if(t.level>0&&IM['house'+t.level])contain(IM['house'+t.level],t.x-58,t.y-148,116,116,.98)}txt('$'+Math.round(t.price/1000)+'K',t.x,t.y+69,13,'center','#fff6d2',900,true)}}
function drawPlayers(){const b=S.board;for(const p of b.players){if(p.bankrupt)continue;const t=b.tiles[p.pos],same=b.players.filter(q=>!q.bankrupt&&q.pos===p.pos),idx=same.indexOf(p),off=(idx-(same.length-1)/2)*34;contain(IM['c'+p.char],t.x-62+off,t.y-174,124,144);txt((p.id+1)+'P',t.x+off,t.y-177,14,'center',PLAYER_COLORS[p.id],1000,true)}}
function drawMap(){const b=S.board;stretch(IM.mapBg,0,0,MW,MH,1);b.tiles.forEach(drawTile);if(b.npcs)for(const n of b.npcs){const t=b.tiles[n.pos];if(t)npcMarker(n,t)}drawPlayers()}
function hud(){const b=S.board,p=cp();contain(IM.playerSeat,18,16,570,72,.96);txt(`${p.id+1}P  ${CHAR_NAMES[p.char]}   $${Math.max(0,p.cash).toLocaleString()}`,303,51,20,'center','#fff',900,true);contain(IM.roleInfo,1218,16,362,76,.95);txt(`第 ${b.round}/${S.rounds} 回合`,1395,43,18,'center','#50321d',1000,false);const fx=(p.effects||[]).map(e=>`${e.kind}${e.turns}`).join(' ');if(fx)txt(fx,600,48,14,'left','#ffe69a',850,true);contain(IM['dice'+S.dice],1325,620,145,145);btn('roll','擲骰子',1260,770,300,86,true,1,!S.rolling&&!b.popup&&!b.winner);btn('cards','卡片 '+p.cards.length,1055,786,180,60,false,.95,!S.rolling&&!b.popup);if(S.msg)txt(S.msg,800,850,16,'center','#fff6d2',800,true)}
function help(){cover(IM.homeBg,0,0,W,H,.7);txt('遊戲說明',800,95,48,'center','#ffe58a',1000,true);const lines=['擲骰子逐格前進，購買土地、升級 Lv1～Lv3 房屋並向對手收租。','同一區域土地全數持有時，該區租金會提高。','事件、卡片、商店、小遊戲與 NPC / 神明會改變局勢。','資金不足會自動變賣房屋與土地；仍無法償付則破產退場。','真人與 AI 可自由配置 2～4 名參賽者，AI 有輕鬆／標準／聰明三種難度。'];lines.forEach((l,i)=>txt(l,800,230+i*82,23,'center','#fff',800,true));btn('home','回到首頁',630,690,340,86,true)}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(S.settings))}catch(e){}}
function settings(){cover(IM.setupBg,0,0,W,H,.72);txt('設定',800,90,46,'center','#ffe58a',1000,true);const s=S.settings;btn('master','主音量 '+s.master+'%',500,185,600,58,false);btn('bgm','BGM '+s.bgm+'%',500,255,600,58,false);btn('sfx','音效 '+s.sfx+'%',500,325,600,58,false);btn('vibrate','震動 '+(s.vibrate?'開':'關'),500,395,600,58,false);btn('graphics','畫質 '+s.graphics,500,465,600,58,false);btn('lang','語言 '+s.lang,500,535,600,58,false);btn('home','回到首頁',630,660,340,76,true)}

C.addEventListener('pointerup',e=>{const p=pointerToGame(e),b=hit(p.x,p.y);if(b)action(b.id)});
function frame(){begin();if(S.scene==='home')home();else if(S.scene==='setup')setup();else if(S.scene==='game'&&S.board)game();else if(S.scene==='help')help();else if(S.scene==='settings')settings();requestAnimationFrame(frame)}requestAnimationFrame(frame);
