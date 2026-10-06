export const RELEASE='20261006-town5';
export const ROLES=[
 ['joy','快樂','派對小彩星','把日常變成值得笑的時刻。'],['dream','夢想','星願魔法師','替願望點亮下一步。'],['night','夜晚陪伴','月夜守護者','陪你度過安靜的夜晚。'],['sadness','悲傷','雨天陪伴者','陪你把難過慢慢放下。'],['trust','信任','鑰匙守護者','守住約定與安心感。'],['memory','回憶','回憶收藏家','把重要片段收進生活裡。'],['growth','成長','森林旅伴','一起照顧慢慢長大的日子。'],['healing','療癒','暖心絨絨','在柔軟的小屋裡歇一歇。'],['luck','幸運','四葉鈴狐','帶著剛剛好的好運同行。'],['hope','希望','光線編織者','溫柔地把明天點亮。']
].map(([id,name,title,desc])=>({id,name,title,desc,original:`../../assets/characters/cxq-role-${id}.webp`,outfit:`art/outfit-${id}.webp`}));
export const MACHINES=[
 {id:'classic',name:'四葉幸運',tag:'三軸・中央連線',cols:3,rows:1,cost:10,desc:'中央三個相同得到大獎；兩個相同也有小獎。',rules:'三同：100～200 金幣；兩同：22 金幣。其餘為 0。六種圖案等機率。',theme:'forest'},
 {id:'sweet',name:'甜點連連',tag:'五軸・消除連鎖',cols:5,rows:3,cost:15,desc:'三個相鄰的橫向圖案消除補落，最多連鎖三次。',rules:'每條橫向三連起獎 75 金幣，每多一格加 8。第 2／3 次連鎖倍率 2／3；每輪最多結算三次。',theme:'rose'},
 {id:'moon',name:'星月收藏',tag:'五軸・鎖星重轉',cols:5,rows:3,cost:15,desc:'三顆星星啟動免費鎖星重轉，星星留下來繼續收集。',rules:'星星每顆 2 金幣；三顆起啟動兩次免費重轉，保留星星。每次重轉按當次星星數給獎。',theme:'night'},
 {id:'garden',name:'花園成長',tag:'四軸・累積開花',cols:4,rows:3,cost:10,desc:'每次旋轉的葉子都會累積，集滿 18 片花園開花。',rules:'三個以上葉子每片 3 金幣；累積 18 葉額外得到 55 金幣，餘數保留。另有橫向三連獎 12 起。',theme:'forest'},
 {id:'toy',name:'玩具百變',tag:'三軸・保留重轉',cols:3,rows:1,cost:10,desc:'轉完可保留一軸，另外兩軸免費重轉一次。',rules:'三同：110～220 金幣；兩同：20 金幣。每次付費旋轉後可選一軸保留重轉，最後結果只結算一次，也可直接收獎。',theme:'sky'},
 {id:'photo',name:'回憶相館',tag:'五軸・組合相簿',cols:5,rows:1,cost:10,desc:'收集相機圖案，集滿一頁相簿領取紀念金幣。',rules:'每個相機 5 金幣；每累積 12 個相機額外得 50 金幣，餘數保留。任意三個相同再得 18 金幣。',theme:'warm'}
];
export const SYMBOLS=[['clover','幸運草'],['star','星星'],['cake','點心'],['leaf','葉子'],['camera','相機'],['gift','禮物']].map(([id,name])=>({id,name,art:`art/symbol-${id}.webp`}));
const furniture=[
 ['sofa','奶油雙人沙發',420,2,1,'坐下休息','living'],['bed','星月小床',650,2,2,'晚安小憩','night'],['table','下午茶圓桌',260,1,1,'一起喝茶','living'],['chair','森林小椅',120,1,1,'坐下休息','forest'],['plant','四葉盆栽',90,1,1,'澆水照顧','forest'],['lamp','月光立燈',210,1,1,'點亮小屋','night'],['shelf','回憶書櫃',380,2,1,'閱讀故事','living'],['rug','草莓小地毯',160,2,1,'舒服伸展','rose'],['tea','暖心茶具',110,1,1,'一起喝茶','living'],['cushion','雲朵抱枕',80,1,1,'抱抱放鬆','night'],['desk','星願畫桌',460,2,1,'畫一張畫','night'],['record','復古唱片機',340,1,1,'跟著音樂跳舞','living'],['vanity','花瓣梳妝台',480,2,1,'整理穿搭','rose'],['cake-stand','甜點展示架',300,1,1,'享用點心','rose'],['flower','晨光花束',100,1,1,'欣賞花朵','forest'],['toy-bear','絨絨玩偶',130,1,1,'抱抱放鬆','living'],['ottoman','森林腳凳',140,1,1,'坐下休息','forest'],['cabinet','奶油收納櫃',330,2,1,'整理收藏','living'],['pillow','星星靠墊',95,1,1,'抱抱放鬆','night'],['basket','野餐小籃',180,1,1,'享用點心','forest'],['mirror','星光落地鏡',290,1,1,'整理穿搭','night'],['clock','童話座鐘',150,1,1,'聽聽鐘聲','living'],['planter','窗邊花架',310,2,1,'澆水照顧','forest'],['stool','草莓圓凳',125,1,1,'坐下休息','rose']
];
export const FURNITURE=furniture.map(([id,name,price,w,h,action,theme])=>({id,name,price,w,h,action,theme,kind:'furniture',art:`art/furniture-${id}.webp`}));
export const CLOTHES=ROLES.flatMap(r=>[{id:'outfit-'+r.id,name:r.name+'・居家新衣',price:350,role:r.id,kind:'outfit',art:r.outfit},...['day','gala'].map((v,i)=>({id:'outfit-'+r.id+'-'+v,name:r.name+'・'+(i?'特色盛裝':'日常套裝'),price:i?900:550,role:r.id,kind:'outfit',art:'art/outfit-'+r.id+'-'+v+'.webp'}))]);
export const BETS=[1,5,10,25,50];
export const PETS=[['cloud','雲朵貓',400,'安靜又黏人的小夥伴'],['sprout','葉芽兔',400,'喜歡在花園散步'],['star','星糖犬',500,'總是開心跟在身邊'],['moon','月光刺蝟',500,'慢慢靠近你的溫柔朋友']].map(([id,name,price,desc])=>({id,name,price,desc,art:'art/pet-'+id+'.webp'}));
export const PET_MAP=Object.fromEntries(PETS.map(p=>[p.id,p]));
export const suitArt=(role,suit,pose='stand')=>pose==='stand'?(suit==='original'?ROLE_MAP[role].original:BY_ID[suit].art):'art/'+pose+'-'+(suit==='original'?role:suit.replace('outfit-','outfit-'))+'.webp';
export const ACCESSORIES=[['bow','暖桃蝴蝶結',140],['brooch','幸運胸針',180],['bag','星願小提袋',220]].map(([id,name,price])=>({id:`accessory-${id}`,name,price,kind:'accessory',art:`art/accessory-${id}.webp`}));
export const CATALOG=[...FURNITURE,...CLOTHES];
export const THEMES=[{id:'cream',name:'奶油日光',price:0,art:'art/room.webp'},{id:'rose',name:'草莓午茶',price:380,art:'art/room-rose.webp'},{id:'night',name:'星月晚安',price:380,art:'art/room-night.webp'}];
export const BY_ID=Object.fromEntries([...CATALOG,...ACCESSORIES].map(x=>[x.id,x]));
export const ROLE_MAP=Object.fromEntries(ROLES.map(x=>[x.id,x]));

const SUIT_NAMES={"outfit-joy-day":"甜點烘焙服","outfit-joy-gala":"慶典小禮服","outfit-dream-day":"星願書房服","outfit-dream-gala":"銀河晚禮服","outfit-night-day":"月光日常服","outfit-night-gala":"守夜禮服","outfit-sadness-day":"雨後花園服","outfit-sadness-gala":"霧藍晚禮服","outfit-trust-day":"暖心店長服","outfit-trust-gala":"金鑰慶典服","outfit-memory-day":"回憶書店服","outfit-memory-gala":"玫瑰茶會服","outfit-growth-day":"花園工作服","outfit-growth-gala":"春日花祭服","outfit-healing-day":"暖心烘焙服","outfit-healing-gala":"冬日絨絨服","outfit-luck-day":"幸運店長服","outfit-luck-gala":"四葉慶典服","outfit-hope-day":"晨光日常服","outfit-hope-gala":"虹光禮服"};for(const c of CLOTHES)if(SUIT_NAMES[c.id])c.name=ROLE_MAP[c.role].name+'・'+SUIT_NAMES[c.id];
