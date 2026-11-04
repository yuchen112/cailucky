export const VERSION=2, SAVE_KEY='cxq_starwish_trial_v2', MAX=1e240, OFFLINE_CAP=86400;
export const FACILITIES=[
 {id:'bell',name:'鈴可的星鈴',short:'星鈴',role:'鈴可',base:15,rate:.1,desc:'每一聲輕響，都會誕生小小星願。'},
 {id:'pillow',name:'糯糯的夢枕',short:'夢枕',role:'糯糯',base:100,rate:1,desc:'把溫暖的好夢，收進柔軟枕頭。'},
 {id:'garden',name:'森芽的星光苗圃',short:'苗圃',role:'森芽',base:1100,rate:8,desc:'細心照料，讓星願結滿枝頭。'},
 {id:'photo',name:'緹雅的回憶相館',short:'相館',role:'緹雅',base:12000,rate:47,desc:'每張值得珍藏的照片，都藏著光。'},
 {id:'festival',name:'朵莉的慶典舞台',short:'舞台',role:'朵莉',base:130000,rate:260,desc:'笑聲、彩帶與一場永不散場的慶典。'},
 {id:'moon',name:'米洛的月光觀測台',short:'觀測台',role:'米洛',base:1400000,rate:1400,desc:'在安靜夜空中，發現新的星願。'},
 {id:'vault',name:'伯恩的星鑰寶庫',short:'寶庫',role:'伯恩',base:20000000,rate:7800,desc:'把每份信任，化成閃耀的金鑰。'},
 {id:'post',name:'露緹的星願郵局',short:'郵局',role:'露緹',base:330000000,rate:44000,desc:'一封封信，將星光送往世界各處。'},
 {id:'dew',name:'汐寧的雨露溫室',short:'溫室',role:'汐寧',base:5100000000,rate:260000,desc:'收集雨滴裡，那些細小的願望。'},
 {id:'loom',name:'曦羽的織夢工坊',short:'織夢坊',role:'曦羽',base:75000000000,rate:1600000,desc:'以夢為線，將無限可能織進星空。'}
];
export const TIERS=[10,25,50,100,200,400,800,1600,3200];
const tierNames=['嶄新工具','默契練習','閃耀配方','星光工藝','月夜協奏','夢境共鳴','星河之心','無盡靈感','永恆星願'];
export const UPGRADES=[
 ...FACILITIES.flatMap((f,i)=>TIERS.map((n,k)=>({id:`f${i}-${k}`,type:'facility',i,need:n,cost:f.base*n*8*2**k,name:f.role+'・'+tierNames[k],desc:f.short+'產量 ×2'}))),
 ...Array.from({length:16},(_,k)=>({id:`tap-${k}`,type:'tap',need:Math.floor(10*2.5**k),cost:50*6**k,name:['星鈴打磨','光芒指尖','心願迴響','流光節奏'][k%4]+' '+(Math.floor(k/4)+1),desc:'基礎點擊收益 ×2'})),
 ...Array.from({length:12},(_,k)=>({id:`global-${k}`,type:'global',need:10000*10**k,cost:5000*10**k,name:'星願協奏 '+(k+1),desc:'全部生產與點擊收益 +20%'})),
 ...Array.from({length:8},(_,k)=>({id:`link-${k}`,type:'link',i:k,need:25,cost:FACILITIES[k+2].base*30,name:FACILITIES[k].role+'與'+FACILITIES[k+2].role+'的合作',desc:FACILITIES[k].short+'每持有一個，'+FACILITIES[k+2].short+'產量 +1%'})),
 ...Array.from({length:5},(_,k)=>({id:`echo-${k}`,type:'echo',need:1000*100**k,cost:1000*80**k,name:'星樹回聲 '+(k+1),desc:'每次點擊額外取得每秒產量的 1%'}))
];
export const ACHIEVEMENTS=[
 ...[100,1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e12,1e14,1e16,1e20,1e25,1e30].map((n,i)=>({id:'total-'+i,name:['第一束星光','微光成河','閃耀的夜','夢開始的地方','星願滿枝'][i%5]+(i>=5?' '+(Math.floor(i/5)+1):''),kind:'total',need:n})),
 ...[10,100,500,1000,5000,10000,50000,100000,1e6].map((n,i)=>({id:'tap-'+i,name:'指尖星光 '+(i+1),kind:'clicks',need:n})),
 ...[1,5,20,50,100,500,1000].map((n,i)=>({id:'comet-'+i,name:'追星的人 '+(i+1),kind:'caught',need:n})),
 ...FACILITIES.flatMap((f,i)=>[1,10,50,100,400].map((n,k)=>({id:`owned-${i}-${k}`,name:f.role+'的'+['初次相遇','小小隊伍','熟練旅團','星光工坊','夢境匠心'][k],kind:'owned',i,need:n}))),
 ...[10,25,50,100].map((n,i)=>({id:'research-'+i,name:'靈感收藏家 '+(i+1),kind:'upgrades',need:n}))
];
export const SKINS=[{id:'midnight',name:'琥珀暮庭',need:0,desc:'暖金星光與寧靜夜色'}, {id:'aurora',name:'極光雪庭',need:12,desc:'青綠極光與琉璃星光'}, {id:'rose',name:'花雨夜庭',need:28,desc:'玫瑰色的夢與溫暖星雨'}, {id:'cosmos',name:'月下靜庭',need:50,desc:'深紫宇宙與銀白星光'}];
const finite=(n,d=0,max=MAX)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?Math.min(n,max):d;
const cap=n=>Math.min(MAX,Math.max(0,n));
export function fresh(now=Date.now()){return {version:VERSION,stars:0,total:0,roundTotal:0,permanent:permanent(),clicks:0,caught:0,owned:Array(10).fill(0),upgrades:[],achievements:[],playTime:0,created:now,lastSeen:now,nextComet:25,event:null,buffs:{production:0,click:0},skin:'midnight',settings:{music:true,sound:true,musicVolume:.4,soundVolume:.65,motion:true,hold:false},buy:1};}
export function restore(raw,now=Date.now()){
 if(!raw||raw.version!==VERSION)throw Error('這不是新版星願旅團的存檔。');const s=fresh(now);
 for(const k of ['stars','total','clicks','caught','playTime'])s[k]=finite(raw[k]);s.total=Math.max(s.stars,s.total);s.clicks=Math.floor(s.clicks);s.caught=Math.floor(s.caught);
 s.owned=Array.from({length:10},(_,i)=>Math.floor(finite(raw.owned?.[i],0,100000)));
 s.upgrades=[...new Set((Array.isArray(raw.upgrades)?raw.upgrades:[]).filter(id=>UPGRADES.some(u=>u.id===id)))];
 s.achievements=[...new Set((Array.isArray(raw.achievements)?raw.achievements:[]).filter(id=>ACHIEVEMENTS.some(a=>a.id===id)))];
 s.created=finite(raw.created,now,now);s.lastSeen=finite(raw.lastSeen,now,now);s.buy=[1,10,100,'max'].includes(raw.buy)?raw.buy:1;
 for(const k of ['music','sound','motion','hold'])if(typeof raw.settings?.[k]==='boolean')s.settings[k]=raw.settings[k];
 for(const k of ['musicVolume','soundVolume'])s.settings[k]=finite(raw.settings?.[k],s.settings[k],1);
 s.skin=SKINS.some(k=>k.id===raw.skin&&s.achievements.length>=k.need)?raw.skin:'midnight';
 s.nextComet=Math.max(s.playTime+5,finite(raw.nextComet,s.playTime+30));
 // Events and temporary boosts pause across page reloads; never produce boosted offline income.
 for(const k of ['production','click'])s.buffs[k]=Math.max(s.playTime,Math.min(s.playTime+90,finite(raw.buffs?.[k],s.playTime)));
 s.roundTotal=finite(raw.roundTotal,s.total,s.total);s.permanent=permanent(raw.permanent??{});
 checkAchievements(s);return s;
}
export function globalMultiplier(s){return (1+s.achievements.length*.01)*1.2**s.upgrades.filter(id=>id.startsWith('global-')).length;}
export function facilityRate(s,i){let r=FACILITIES[i].rate*s.owned[i]*2**s.upgrades.filter(id=>id.startsWith(`f${i}-`)).length;for(let k=0;k<8;k++)if(k+2===i&&s.upgrades.includes(`link-${k}`))r*=1+s.owned[k]*.01;const item=petItem(s);return cap(r*globalMultiplier(s)*(1+(s.permanent?.levels[1]??0)*.04)*(item?.group===1?1+item.bonus:1));}
export function cps(s,boosted=true){const base=FACILITIES.reduce((r,_,i)=>r+facilityRate(s,i),0);return cap(base*(boosted&&s.buffs.production>s.playTime?5:1));}
export function clickPower(s){const base=2**s.upgrades.filter(id=>id.startsWith('tap-')).length*globalMultiplier(s),echo=s.upgrades.filter(id=>id.startsWith('echo-')).length;const item=petItem(s);return cap((base+cps(s)*.01*echo)*(s.buffs.click>s.playTime?12:1)*(1+(s.permanent?.levels[0]??0)*.04)*(item?.group===0?1+item.bonus:1));}
export function earn(s,n){if(!Number.isFinite(n)||n<0)return 0;n=Math.min(n,MAX-s.total,MAX-s.stars);s.stars=cap(s.stars+n);s.total=cap(s.total+n);s.roundTotal=cap((s.roundTotal??0)+n);return n;}
export function tap(s,random=Math.random){const crit=random()<.04,gain=earn(s,clickPower(s)*(crit?5:1));s.clicks++;return {gain,crit};}
export function cost(s,i,count=1){if(!FACILITIES[i]||!Number.isInteger(count)||count<1)return Infinity;const start=FACILITIES[i].base*1.15**s.owned[i],v=start*(1.15**count-1)/.15;return Number.isFinite(v)&&v<=MAX?Math.ceil(v-1e-9):Infinity;}
export function affordable(s,i){if(!FACILITIES[i])return 0;let lo=0,hi=Math.min(100000-s.owned[i],4000);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(cost(s,i,mid)<=s.stars)lo=mid;else hi=mid-1;}return lo;}
export function buyFacility(s,i,quantity=s.buy){let n=quantity==='max'?affordable(s,i):quantity;if(!Number.isInteger(n)||n<1||s.owned[i]+n>100000)return null;const price=cost(s,i,n);if(price>s.stars||!Number.isFinite(price))return null;s.stars=Math.max(0,s.stars-price);s.owned[i]+=n;return {n,price};}
export function upgradeReady(s,u){if(s.upgrades.includes(u.id))return false;if(u.type==='facility')return s.owned[u.i]>=u.need;if(u.type==='tap')return s.clicks>=u.need;if(u.type==='link')return s.owned[u.i]>=25&&s.owned[u.i+2]>=10;return (s.roundTotal??s.total)>=u.need;}
export function buyUpgrade(s,id){const u=UPGRADES.find(u=>u.id===id);if(!u||!upgradeReady(s,u)||u.cost>s.stars)return false;s.stars-=u.cost;s.upgrades.push(id);return true;}
export function achievementProgress(s,a){return a.kind==='owned'?s.owned[a.i]:a.kind==='upgrades'?s.upgrades.length:s[a.kind];}
export function checkAchievements(s){const gained=[];for(const a of ACHIEVEMENTS)if(!s.achievements.includes(a.id)&&achievementProgress(s,a)>=a.need){s.achievements.push(a.id);gained.push(a);}return gained;}
export function tick(s,seconds,random=Math.random){seconds=Math.min(60,Math.max(0,seconds));
 // Split at buff expiry so a slow frame cannot overpay the entire interval.
 let left=seconds;while(left>1e-8){const step=Math.min(left,.5);earn(s,cps(s)*step);s.playTime+=step;left-=step;}
 if(s.event&&s.playTime>=s.event.ends)s.event=null;
 if(!s.event&&s.playTime>=s.nextComet){s.event={ends:s.playTime+15,seed:random()};s.nextComet=s.playTime+65+random()*50;return true;}return false;
}
export function catchComet(s,random=Math.random){if(!s.event||s.event.ends<=s.playTime)return null;s.event=null;s.caught++;const r=random();
 if(r<.45){const gain=earn(s,Math.max(30,Math.min(s.stars*.1+cps(s,false)*60,cps(s,false)*600+300)));return {type:'gift',gain,title:'流星贈禮',desc:'星願已加入收藏'};}
 if(r<.75){s.buffs.production=Math.max(s.buffs.production,s.playTime)+60;return {type:'production',title:'星河豐收',desc:'60 秒內自動產量 ×5'};}
 s.buffs.click=Math.max(s.buffs.click,s.playTime)+30;return {type:'click',title:'指尖星雨',desc:'30 秒內點擊收益 ×12'};
}
export function offline(s,now=Date.now()){const item=petItem(s),offlineItem=item?.group===2?item:null;
 const seconds=Math.min(OFFLINE_CAP+(offlineItem?.hours??0)*3600,Math.max(0,(now-s.lastSeen)/1000));
 const gain=earn(s,cps(s,false)*(seconds+(offlineItem&&!offlineItem.hours?Math.min(seconds,14400)*offlineItem.bonus:0)));s.lastSeen=now;return {seconds,gain};}
export function format(n){if(n===Infinity)return '極遠星空';if(n<1000)return n<10?n.toFixed(1).replace(/\.0$/,''):Math.floor(n).toLocaleString('en-US');const units=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No'];const p=Math.floor(Math.log10(n)/3);if(p<=units.length){const v=n/1000**p;return (v>=100?v.toFixed(0):v.toFixed(2).replace(/\.?0+$/,''))+' '+units[p-1];}return n.toExponential(2).replace('+','');}
export function hintFor(s,u){if(u.type==='facility')return `持有 ${u.need} 個${FACILITIES[u.i].short}`;if(u.type==='tap')return `累積點擊 ${format(u.need)} 次`;if(u.type==='link')return `${FACILITIES[u.i].short} 25 個、${FACILITIES[u.i+2].short} 10 個`;return `累積星願 ${format(u.need)}`;}

export const PETS=[
 '苔苔龜','栗尾狐','雲絨兔','燈芯鼠','花帽刺蝟','露珠鴨',
 '金葉鹿','琉璃貓','月紗蛾','鈴羽雀','繡球羊',
 '星角小龍','銀河鯨','夢火鳳雛','月冠獅',
].map((name,id)=>({id,name,tier:id<6?'普通':id<11?'華麗':'神話',price:id<6?3:id<11?8:16}));
const itemNames=[
 ['拾星鈴','晨星手環','橡果指套','金葉護符','曙光手套','連星水晶','星冠指輪'],
 ['工坊徽章','木輪吊飾','星光油壺','群星齒輪','金匠圍巾','極光齒輪','旅團號角'],
 ['晨露提燈','月光小毯','晚安枕頭','銀月沙漏','夢鄉羅盤','長夜燈籠','星河睡袋'],
];
export const PET_ITEMS=itemNames.flatMap((names,group)=>names.map((name,index)=>({
 id:group*7+index,name,group,price:[3,5,7,9,12,16,21][index],
 bonus:(index+2)*.025,shops:index<3?0:index-1,
 hours:group===2&&index%2===1?index*2:0,
})));
export const REBIRTH_TARGET=100000;
function permanent(raw={}){
 const ids=(list,catalog)=>[...new Set((Array.isArray(list)?list:[]).filter(id=>catalog[id]?.id===id))];
 const pets=ids(raw.pets,PETS),items=ids(raw.items,PET_ITEMS);
 const equipped=Object.fromEntries(pets.flatMap(id=>items.includes(raw.equipped?.[id])?[[id,raw.equipped[id]]]:[]));
 return {
  points:Math.floor(finite(raw.points,0,1000000000)), rebirths:Math.floor(finite(raw.rebirths,0,1000000)),
  pets,items,equipped,active:pets.includes(raw.active)?raw.active:null,
  levels:Array.from({length:3},(_,i)=>Math.floor(finite(raw.levels?.[i],0,50))),
 };
}
export function petItem(s){
 const p=s.permanent,item=PET_ITEMS[p?.equipped?.[p.active]];
 return item&&p.pets.includes(p.active)&&p.items.includes(item.id)&&s.owned.filter(Boolean).length>=item.shops?item:null;
}
export function adoptPet(s,id){
 const p=s.permanent,pet=PETS[id];
 if(!pet||p.pets.includes(id))return false;
 const price=p.pets.length===0&&id<3?0:pet.price;
 if(p.points<price)return false;
 p.points-=price;p.pets.push(id);p.active=id;return true;
}
export function buyPetItem(s,id){
 const p=s.permanent,item=PET_ITEMS[id];
 if(!item||p.items.includes(id)||p.points<item.price)return false;
 p.points-=item.price;p.items.push(id);return true;
}
export function equipPetItem(s,id){
 const p=s.permanent;
 if(!p.pets.includes(p.active)||id!==null&&!p.items.includes(id))return false;
 if(id===null)delete p.equipped[p.active];else p.equipped[p.active]=id;
 return true;
}
export function permanentCost(s,i){
 const level=s.permanent.levels[i];
 return Number.isInteger(level)&&level<50?3+level*2:Infinity;
}
export function upgradePermanent(s,i){
 const p=s.permanent,price=permanentCost(s,i);
 if(p.points<price)return false;
 p.points-=price;p.levels[i]++;return true;
}
export function rebirthQuote(s){
 const base=REBIRTH_TARGET*(1+s.permanent.rebirths*.4);
 const steps=Math.min(230,Math.max(0,Math.floor(Math.log10(Math.max(1,s.roundTotal/base)))+1));
 const points=s.roundTotal<base?0:steps+2;
 return {points,next:base*10**(points?steps:0)};
}
export function rebirth(s){
 const {points}=rebirthQuote(s);
 if(!points)return 0;
 const p=s.permanent;
 p.points+=points;p.rebirths++;
 s.stars=p.levels[2]*25;s.roundTotal=0;s.owned.fill(0);s.upgrades=[];
 s.buffs={production:0,click:0};s.event=null;s.nextComet=s.playTime+25;s.buy=1;
 return points;
}
