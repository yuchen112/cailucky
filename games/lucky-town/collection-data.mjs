export const SERIES=[
 {id:'wood',name:'暖木居家',style:'honey oak, cream linen, carved leaf motifs, cozy cottage',room:'暖木小屋'},
 {id:'tea-garden',name:'花園午茶',style:'ivory wicker, sage green, blush roses, floral porcelain',room:'花園茶室'},
 {id:'starlight',name:'星月臥室',style:'midnight blue velvet, pale gold crescent moons and stars',room:'星光閣樓'},
 {id:'candy',name:'糖果甜屋',style:'pastel strawberry pink, vanilla cream, mint trim, tasteful candy details',room:'糖果暖屋'},
 {id:'magic',name:'魔法書房',style:'walnut carved wood, dusty violet, aged brass, celestial scroll details',room:'魔法書房'},
 {id:'woodland',name:'森林小屋',style:'natural birch wood, moss green, acorn motifs, forest cottage',room:'森林樹屋'},
 {id:'royal',name:'皇家客廳',style:'ivory carved wood, burgundy velvet, restrained ornate gold',room:'皇家客廳'},
 {id:'seaside',name:'海邊度假',style:'whitewashed driftwood, seafoam blue linen, seashell details',room:'海岸小屋'}
];
const pieces=[
 ['sofa','雙人沙發',1800,2,1,'坐下休息','seat'],
 ['bed','舒眠小床',2700,2,2,'晚安小憩','bed'],
 ['table','生活茶桌',1150,1,1,'一起喝茶','surface'],
 ['shelf','收藏書櫃',1950,2,1,'閱讀故事','surface'],
 ['lamp','柔光立燈',850,1,1,'點亮小屋','light'],
 ['rug','織紋地毯',650,2,1,'舒服伸展','rug'],
 ['vase','桌上花瓶',400,1,1,'欣賞花朵','small'],
 ['cushion','柔軟抱枕',300,1,1,'抱抱放鬆','cushion']
];
export const EXTRA_FURNITURE=SERIES.flatMap((s,k)=>pieces.map(([type,name,price,w,h,action,category])=>({id:s.id+'-'+type,name:s.name+'・'+name,price:Math.round(price*(k===6?1.3:1)/50)*50,w,h,action,category,theme:s.id,kind:'furniture',art:'art/furniture-'+s.id+'-'+type+'.webp',type,description:s.style})));
const lookNames={joy:['草莓晚安','彩星漫遊','花束店長','冬日糖霜','春日遊園'],dream:['星雲晚安','銀河旅人','星圖研究員','雪夜星願','夢境茶會'],night:['月兔晚安','暮色漫遊','夜燈看守人','霜月斗篷','月影舞會'],sadness:['雨滴晚安','雨後散步','小花園藝師','霧雪暖衣','藍花茶會'],trust:['暖金晚安','秋日同行','約定郵差','雪日守護','金鑰舞會'],memory:['書頁晚安','復古漫步','相片收藏師','冬日懷想','花影茶會'],growth:['嫩芽晚安','森林遠足','種子園藝師','松果暖冬','森之花祭'],healing:['絨雲晚安','暖陽散步','暖心茶療師','棉雪暖衣','柔光茶會'],luck:['四葉晚安','幸運旅行','鈴鐺花店長','青松暖冬','翡翠花祭'],hope:['晨曦晚安','虹光遠行','光線畫家','雪光暖衣','晨光花祭']};
export const LOOK_TYPES=['sleep','journey','craft','winter','festival'];
export const LOOK_DESIGNS={sleep:'soft pajama set with tiny role-specific embroidered motifs and comfy slippers',journey:'distinctive comfortable outdoors travel outfit with layered jacket and walking shoes',craft:'role-specific artisan occupation outfit with carefully designed apron or vest, no hand-held tools',winter:'warm layered coat, knit collar, fitted boots and role-specific winter embroidery',festival:'elaborate role-specific spring festival outfit with refined embroidery, graceful silhouette, no handheld objects'};
export const makeExtraClothes=roles=>roles.flatMap(r=>LOOK_TYPES.map((type,i)=>({id:'outfit-'+r.id+'-'+type,name:r.name+'・'+lookNames[r.id][i],price:[1250,1700,1900,2300,3500][i],role:r.id,kind:'outfit',art:'art/outfit-'+r.id+'-'+type+'.webp',type,description:LOOK_DESIGNS[type]})));
export const EXTRA_THEMES=[...SERIES.map((s,i)=>({id:s.id,name:s.room,price:[2800,3200,3800,3400,4200,3600,6500,4000][i],art:'art/room-'+s.id+'.webp',window:{x:136,y:35,w:184,h:265},series:s.id})),{id:'sunroom',name:'晨光玻璃屋',price:4600,art:'art/room-sunroom.webp',window:{x:136,y:35,w:184,h:265}}];
export const WINDOW_SCENES=[{id:'original',name:'原有窗景',price:0,art:null},...[
 ['garden','花園晨光',900,'a peaceful flower garden, soft morning sunshine'],['forest','森林微風',1100,'sunlit woodland canopy and distant mossy path'],['town','小鎮夕色',1300,'fairytale town rooftops in warm sunset'],['ocean','海岸午晴',1500,'peaceful turquoise ocean and distant sandy shore'],['stars','星河夜空',1900,'gentle deep blue starry night with a crescent moon'],['snow','雪日暖光',1700,'soft snowy garden and warm winter daylight']
].map(([id,name,price,description])=>({id,name,price,description,art:'art/window-'+id+'.webp'}))];
