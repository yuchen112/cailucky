export const VERSION = 1;
export const SLIDE_SIZES = [3, 4, 5, 6];
export const JIG_GRIDS = [[4,3],[6,5],[10,6],[12,10]];
export const LEVELS = ['入門','普通','困難','專家'];
const names = ['花傘春庭','星燈書生','竹影俠客','月下簷歌','花庭小公主','龍橋騎士','幸運魔藥','精靈書庫','雪色學院','雲海飛船','晨光咖啡','街角樂章','花車漫遊','雨夜書店','街機假日','森林茶會','蘑菇小屋','糖果王國','雲上月園','信任舞會','櫻花野餐','夏日航海','秋林露營','雪村漫步','星野望遠鏡','星夢舞台','花語禮服','古堡鐘聲','蒸氣工坊','星際旅人'];
const roles = ['hope','dream','growth','night','healing','joy','luck','memory','sadness','trust','hope','dream','growth','night','joy','healing','memory','luck','sadness','trust','hope','joy','growth','sadness','night','dream','healing','memory','luck','trust'];
export const THEMES = ['古風雅境','奇幻冒險','現代日常','童話夢境','四季旅遊','華麗舞台'];
const originalEntries=names.map((title,i)=>[title,roles[i],THEMES[Math.floor(i/5)]]);
const additionalEntries=[
 ["月池蓮燈","hope","古風雅境"],
 ["墨香小院","dream","古風雅境"],
 ["青竹茶席","growth","古風雅境"],
 ["山門晨鐘","night","古風雅境"],
 ["藥香花坊","healing","古風雅境"],
 ["錦鯉水巷","joy","古風雅境"],
 ["金桂香囊","luck","古風雅境"],
 ["梅窗繡卷","memory","古風雅境"],
 ["聽雨蘭亭","sadness","古風雅境"],
 ["雲崖琴心","trust","古風雅境"],
 ["瑞雪圍爐","hope","古風雅境"],
 ["花朝紙鳶","dream","古風雅境"],
 ["柳岸投壺","growth","古風雅境"],
 ["秋庭團扇","night","古風雅境"],
 ["鵲橋花燈","healing","古風雅境"],
 ["琉璃星港","joy","奇幻冒險"],
 ["龍眠花谷","luck","奇幻冒險"],
 ["秘銀鍛坊","memory","奇幻冒險"],
 ["珊瑚王庭","sadness","奇幻冒險"],
 ["月輪遺跡","trust","奇幻冒險"],
 ["羽光神殿","hope","奇幻冒險"],
 ["星砂魔法課","dream","奇幻冒險"],
 ["藤蔓巨樹","growth","奇幻冒險"],
 ["霜晶守望","night","奇幻冒險"],
 ["藍焰藥泉","healing","奇幻冒險"],
 ["機巧雲城","joy","奇幻冒險"],
 ["寶石洞窟","luck","奇幻冒險"],
 ["流星郵局","memory","奇幻冒險"],
 ["螢海迷航","sadness","奇幻冒險"],
 ["時鐘秘境","trust","奇幻冒險"],
 ["海風烘焙","hope","現代日常"],
 ["雨巷花店","dream","現代日常"],
 ["週末畫室","growth","現代日常"],
 ["地鐵小旅行","night","現代日常"],
 ["暖心診所","healing","現代日常"],
 ["露台早餐","joy","現代日常"],
 ["唱片午後","luck","現代日常"],
 ["手作陶坊","memory","現代日常"],
 ["深夜便利屋","sadness","現代日常"],
 ["屋頂音樂會","trust","現代日常"],
 ["甜點研究所","hope","現代日常"],
 ["單車河岸","dream","現代日常"],
 ["玻璃溫室","growth","現代日常"],
 ["街角攝影館","night","現代日常"],
 ["窗邊讀書日","healing","現代日常"],
 ["杏仁糖列車","joy","童話夢境"],
 ["胡桃音樂盒","luck","童話夢境"],
 ["蜂蜜郵差","memory","童話夢境"],
 ["雲朵洗衣房","sadness","童話夢境"],
 ["森林麵包屋","trust","童話夢境"],
 ["彩虹裁縫店","hope","童話夢境"],
 ["月兔鐘樓","dream","童話夢境"],
 ["苔蘚小旅館","growth","童話夢境"],
 ["蒲公英遠行","night","童話夢境"],
 ["星砂玻璃屋","healing","童話夢境"],
 ["奶油城堡","joy","童話夢境"],
 ["棉花糖湖","luck","童話夢境"],
 ["松果小劇場","memory","童話夢境"],
 ["紙船溪流","sadness","童話夢境"],
 ["花蕾夢工廠","trust","童話夢境"],
 ["紫藤春祭","hope","四季旅遊"],
 ["繡球小徑","dream","四季旅遊"],
 ["湖畔露營","growth","四季旅遊"],
 ["向日葵車站","night","四季旅遊"],
 ["楓谷溫泉","healing","四季旅遊"],
 ["銀杏野餐","joy","四季旅遊"],
 ["雪原極光","luck","四季旅遊"],
 ["冰湖釣星","memory","四季旅遊"],
 ["初春採莓","sadness","四季旅遊"],
 ["盛夏燈塔","trust","四季旅遊"],
 ["秋收葡萄園","hope","四季旅遊"],
 ["冬日滑雪","dream","四季旅遊"],
 ["沙漠星宿","growth","四季旅遊"],
 ["海島花環","night","四季旅遊"],
 ["高山雲瀑","healing","四季旅遊"],
 ["珍珠芭蕾","joy","華麗舞台"],
 ["星河小提琴","luck","華麗舞台"],
 ["水晶歌劇院","memory","華麗舞台"],
 ["花火巡遊","sadness","華麗舞台"],
 ["月光華爾滋","trust","華麗舞台"],
 ["金羽頒獎夜","hope","華麗舞台"],
 ["彩蝶時裝秀","dream","華麗舞台"],
 ["藍調爵士廳","growth","華麗舞台"],
 ["紅絨魔術台","night","華麗舞台"],
 ["寶石假面舞","healing","華麗舞台"],
 ["雲端鋼琴曲","joy","華麗舞台"],
 ["風鈴舞衣","luck","華麗舞台"],
 ["玫瑰舞台","memory","華麗舞台"],
 ["彩光冰舞","sadness","華麗舞台"],
 ["銀河謝幕","trust","華麗舞台"]
];
export const ART = [...originalEntries,...additionalEntries].map(([title,role,theme],i)=>{
 const id=String(i+1).padStart(2,'0');
 return {id,title,role,theme,file:'art/'+id+'.webp',original:'art/'+id+'.png',thumb:'art/'+id+'-thumb.webp'};
});
export function rng(seed) { let a=seed>>>0; return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}; }
export function shuffle(items, random=Math.random) { const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
export function chooseArt(unlocked,last,random=Math.random){let pool=ART.filter(a=>!unlocked[a.id]);if(!pool.length)pool=ART;const noRepeat=pool.filter(a=>a.id!==last);if(noRepeat.length)pool=noRepeat;return pool[Math.floor(random()*pool.length)];}
export function solved(board){return board.every((v,i)=>v===i);}
export function neighbors(index,n){const x=index%n,y=Math.floor(index/n);return [x>0?index-1:-1,x<n-1?index+1:-1,y>0?index-n:-1,y<n-1?index+n:-1].filter(x=>x>=0);}
export function slide(board,index,n){const z=board.indexOf(n*n-1);if(!neighbors(z,n).includes(index))return null;const next=[...board];[next[z],next[index]]=[next[index],next[z]];return next;}
export function distance(board,n){return board.reduce((s,v,i)=>s+(v===n*n-1?0:Math.abs(v%n-i%n)+Math.abs(Math.floor(v/n)-Math.floor(i/n))),0);}
export function createSlide(n,random=Math.random){let board=Array.from({length:n*n},(_,i)=>i),z=n*n-1,prev=-1;const path=[];for(let i=0;i<n*n*110;i++){const options=neighbors(z,n).filter(x=>x!==prev),idx=options[Math.floor(random()*options.length)];path.push(z);[board[z],board[idx]]=[board[idx],board[z]];prev=z;z=idx;}if(distance(board,n)<n*n){return createSlide(n,random);}return {board,path};}
export function edges(cols,rows,random){const out=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const top=y?-out[(y-1)*cols+x][2]:0,left=x?-out[y*cols+x-1][1]:0;out.push([top,x===cols-1?0:(random()<.5?-1:1),y===rows-1?0:(random()<.5?-1:1),left]);}return out;}
export function piecePath(ctx,w,h,e){ctx.beginPath();ctx.moveTo(0,0);const edge=(x0,y0,x1,y1,s)=>{const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len,amp=Math.min(w,h)*.22*s;const p=(t,a=0)=>[x0+dx*t+nx*a,y0+dy*t+ny*a];const line=(t,a=0)=>ctx.lineTo(...p(t,a));const curve=(a,b,c,d,f,g)=>ctx.bezierCurveTo(...p(a,b),...p(c,d),...p(f,g));if(!s){line(1);return;}line(.34);curve(.48,0,.34,amp,.44,amp);curve(.52,amp*1.15,.62,amp,.60,amp*.45);curve(.57,0,.58,0,.67,0);line(1);};edge(0,0,w,0,e[0]);edge(w,0,w,h,e[1]);edge(w,h,0,h,e[2]);edge(0,h,0,0,e[3]);ctx.closePath();}
export function createJigsaw(level,seed,rotation){const [cols,rows]=JIG_GRIDS[level],random=rng(seed),ed=edges(cols,rows,random);const order=shuffle(Array.from({length:cols*rows},(_,i)=>i),random);const pieces=order.map((id,i)=>({id,x:1.13+(i%4)*(.9/4),y:.06+Math.floor(i/4)*(.88/Math.ceil(order.length/4)),rot:rotation?Math.floor(random()*4):0,group:id,locked:false}));return {cols,rows,edges:ed,pieces};}
export function target(id,cols,rows){return {x:(id%cols)/cols,y:Math.floor(id/cols)/rows};}
export function snapJigsaw(pieces,activeId,cols,rows,tolerance=.035){let p=pieces.find(x=>x.id===activeId);if(!p||p.rot)return false;let changed=false;const moveGroup=(group,dx,dy)=>pieces.filter(v=>v.group===group).forEach(v=>{v.x+=dx;v.y+=dy;});const own=()=>pieces.filter(v=>v.group===p.group);let t=target(p.id,cols,rows);if(Math.hypot(p.x-t.x,p.y-t.y)<tolerance){moveGroup(p.group,t.x-p.x,t.y-p.y);own().forEach(v=>v.locked=true);changed=true;}
 let again=true;while(again){again=false;for(const a of own()){if(a.rot)continue;for(const b of pieces){if(b.group===a.group||b.rot)continue;const ax=a.id%cols,ay=Math.floor(a.id/cols),bx=b.id%cols,by=Math.floor(b.id/cols);if(Math.abs(ax-bx)+Math.abs(ay-by)!==1)continue;const ta=target(a.id,cols,rows),tb=target(b.id,cols,rows),dx=b.x+(ta.x-tb.x)-a.x,dy=b.y+(ta.y-tb.y)-a.y;if(Math.hypot(dx,dy)>tolerance)continue;const ga=a.group,gb=b.group,locked=pieces.some(v=>(v.group===ga||v.group===gb)&&v.locked);if(own().some(v=>v.locked))moveGroup(gb,-dx,-dy);else moveGroup(ga,dx,dy);pieces.filter(v=>v.group===gb).forEach(v=>v.group=ga);if(locked)own().forEach(v=>v.locked=true);changed=again=true;break;}if(again)break;}}
 return changed;}
export function emptySave(){return {version:VERSION,unlocked:{},records:{},active:null,last:null,settings:{sound:true,music:true,musicVolume:.45,soundVolume:.7,numbers:true,ghost:true},updated:Date.now()};}
export function validateSave(raw){if(!raw||raw.version!==VERSION)throw Error('不支援的存檔版本');const s=emptySave();for(const a of ART)if(raw.unlocked?.[a.id])s.unlocked[a.id]=raw.unlocked[a.id];s.last=ART.some(a=>a.id===raw.last)?raw.last:null;s.settings={...s.settings,...raw.settings};for(const k of ['sound','music','numbers','ghost'])s.settings[k]=typeof raw.settings?.[k]==='boolean'?raw.settings[k]:true;for(const [k,d] of [['musicVolume',.45],['soundVolume',.7]])s.settings[k]=typeof raw.settings?.[k]==='number'&&Number.isFinite(raw.settings[k])?Math.max(0,Math.min(1,raw.settings[k])):d;for(const [key,value] of Object.entries(raw.records||{})){if(/^\d{2,3}:(slide|jigsaw):[0-3]$/.test(key)&&ART.some(a=>key.startsWith(a.id+':'))&&value&&Number.isFinite(value.time)&&value.time>=0&&Number.isFinite(value.moves))s.records[key]=value;}
const a=raw.active;if(a&&['slide','jigsaw'].includes(a.mode)&&Number.isInteger(a.level)&&a.level>=0&&a.level<4&&ART.some(x=>x.id===a.artId)&&Number.isFinite(a.elapsed)&&a.elapsed>=0){let valid=true;if(a.mode==='slide'){const n=SLIDE_SIZES[a.level];valid=Array.isArray(a.board)&&a.board.length===n*n&&new Set(a.board).size===n*n&&a.board.every(v=>Number.isInteger(v)&&v>=0&&v<n*n);}else{const [c,r]=JIG_GRIDS[a.level];valid=Array.isArray(a.pieces)&&a.pieces.length===c*r&&new Set(a.pieces.map(p=>p.id)).size===c*r&&a.pieces.every(p=>Number.isInteger(p.id)&&p.id>=0&&p.id<c*r&&Number.isFinite(p.x)&&Math.abs(p.x)<10&&Number.isFinite(p.y)&&Math.abs(p.y)<10&&Number.isInteger(p.rot)&&p.rot>=0&&p.rot<4&&Number.isInteger(p.group));}if(valid)s.active=a;}return s;}
export function complete(save,game,now=Date.now()){const first=!save.unlocked[game.artId];save.unlocked[game.artId] ||= {at:now};const key=`${game.artId}:${game.mode}:${game.level}`,old=save.records[key];const record={time:Math.round(game.elapsed),moves:game.moves||0,assists:game.assists||0,at:now,wins:(old?.wins||0)+1};if(!old||record.time<old.time)save.records[key]=record;else old.wins=record.wins;save.active=null;save.last=game.artId;return first;}
