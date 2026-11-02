export const ARENA_BOUNDS=Object.freeze({x:1000,y:600,spawnX:1120,spawnY:720});
// Shared expedition rules. IDs are permanent save keys; presentation never defines hitboxes.
export const VERSION=4,MAX_WEAPONS=3,MAX_PASSIVES=4,UPGRADE_CAP=5;
const route=(name,desc,evolved)=>({name,desc,evolved});
const mains=[
 ['joy','朵莉','派對小彩星','歡樂節拍鈴','pulse','#ffb7d6','音波連拍','持續命中累積節拍，最多提高 24% 攻擊速度。','歡樂巡演','六秒加速，沿途發出節拍衝擊。',18,['colorRing','fireworks','clover','wings'],['連拍音浪','快速小範圍音波，連擊更穩定。','歡樂交響'],['重拍綻放','慢速大範圍重拍，擅長清出空間。','盛典重奏']],
 ['dream','露緹','星願魔法師','星夢法杖','star','#d5b4ff','星願積蓄','每四次施法，下一輪星彈額外穿透並強化 35%。','星願綻放','在前方降下三輪星雨。',20,['starfall','prism','seed','mirror'],['貫穿星芒','直線穿透更多敵人。','彗星貫流'],['彈射星芒','命中後跳向附近敵人，傷害逐次遞減。','星河連珠']],
 ['night','米洛','月夜守護者','凝月長弓','arrow','#a4bdff','凝月追擊','連續命中同一目標，傷害逐次提升，最多 30%。','月夜獵行','六秒提高射速與穿透，留下月影箭。',19,['quiver','moonblade','prism','clover'],['月影貫箭','長距離穿透箭，適合拉成直線的怪群。','穿月長虹'],['繁星箭雨','扇形多箭，近中距離清群。','月夜千矢']],
 ['sadness','汐寧','雨天陪伴者','細雨晶杖','rain','#93dcff','寒霜累積','主武器與冰雨累積寒霜，三次命中造成冰凍。','靜雨結界','在身邊展開五秒雨幕，減速並傷害敵人。',22,['rainbell','tide','hourglass','incense'],['綿長細雨','大範圍雨幕，冰凍時間更長。','永凍星域'],['凝晶重擊','集中小範圍高傷害。','霜核崩解']],
 ['trust','伯恩','鑰匙守護者','羈絆守護盾','shield','#edc785','守約反擊','每十秒獲得一次抵擋；成功抵擋後釋放反擊。','守約壁壘','獲得四秒護盾，並以震波擊退周圍敵人。',24,['chains','ward','moonblade','thorns'],['堅盾反擊','近身扇形盾擊，強化擊退與抵擋。','守約重城'],['迴旋飛盾','盾牌飛出並回返，沿途傷害敵人。','誓約輪盾']],
 ['memory','緹雅','回憶收藏家','回聲記錄之書','echo','#e9baee','昨日回聲','每第三次主武器施法，在舊位置額外重播一次。','昨日重現','重播最近的攻擊位置，形成三道延遲回響。',20,['mirror','hourglass','starfall','chains'],['深刻回聲','較少次數、高傷害的延遲重擊。','永恆留影'],['重疊記憶','多次回聲分段爆發，適合引導怪群。','萬華重映']],
 ['growth','森芽','森林旅伴','翠芽指揮杖','summon','#ade0a0','森林共生','召喚物每三十秒成長，最多提高 24% 傷害。','森林號令','召喚物集中尋敵，六秒攻擊速度與傷害提高。',22,['seed','thorns','ward','incense'],['森靈群舞','多名快速森靈協同進攻。','萬葉同行'],['古樹守衛','一名大型守衛，使用範圍重擊。','森林之王']],
 ['healing','糯糯','暖心絨絨','花語療癒杖','petal','#ffd6c7','暖心循環','每十秒回復生命；滿血時轉為有限護盾。','暖心庇護','回復生命並展開四秒花瓣保護區。',26,['plush','incense','rainbell','colorRing'],['花語反擊','花瓣穿透攻擊，治療時強化下一輪。','百花盛放'],['守護花庭','攻擊留下小型花庭，持續清理靠近敵人。','暖春花界']],
 ['luck','鈴可','四葉鈴狐','幸運四葉權杖','clover','#c8eca4','幸運保底','每五次攻擊必定觸發幸運強擊，不依賴隨機運氣。','四葉時刻','六秒提升幸運強擊頻率，並吸引附近星晶。',20,['dice','clover','fireworks','quiver'],['幸運強擊','集中傷害，每第五擊造成強力爆發。','四葉裁決'],['幸運連跳','葉彈反彈更多敵人，適合清理分散怪群。','幸運巡遊']],
 ['hope','曦羽','光線編織者','破曉星槍','lance','#ffe9b2','破曉印記','對重甲與首領提高傷害，連續貫刺留下破甲印記。','破曉裁線','向移動方向釋放長距離貫穿光槍。',21,['wings','lightning','prism','ward'],['曙光重刺','集中長距離貫刺，擅長精英與首領。','破曉裁光'],['光羽連槍','多段扇形光槍，擅長清理前方路徑。','晨曦萬羽']]
];
export const ROLES=mains.map(([id,name,title,mainName,family,color,innateName,innateDesc,activeName,activeDesc,cooldown,allowed,a,b])=>({id,name,title,desc:innateDesc,color,main:'main-'+id,mainName,allowed,allowedSupports:allowed,innate:{name:innateName,desc:innateDesc},trait:{name:innateName,desc:innateDesc},active:{name:activeName,desc:activeDesc,cooldown},branches:{a:route(...a),b:route(...b)},family,art:'art/v4/role-'+id+'.png'}));
const supportRows=[
 ['starfall','星隕晶核','meteor','預告落點後降下隕星，打擊密集敵群。','#ffc28f'],['prism','星軌稜鏡','beam','持續光束跟隨方向，整條明亮光路都有傷害。','#e9c8ff'],['colorRing','迴旋彩環','orbit','彩環環繞身體，沿完整掃掠路徑命中。','#ffb3e0'],['fireworks','煙花禮盒','fireworks','在敵人位置引爆煙花，形成連續爆破。','#ffc7d3'],['quiver','月影箭袋','arrow','向最近敵人補射穿透月箭。','#b9cfff'],['moonblade','巡夜月刃','orbit','慢速外圈月刃，以較遠軌道攔截敵人。','#c4bdff'],['rainbell','霜晶雨鈴','rain','在前方敵群降下霜雨，累積寒霜冰凍。','#a0eaff'],['tide','潮汐寶珠','pulse','週期釋放潮汐，擊退靠近的敵群。','#a5e3ee'],['chains','守約鎖鏈','chain','鎖鏈在鄰近敵人間連接並造成傷害。','#f1d29a'],['ward','守護紋章','ward','週期產生有限護盾，並發出守護震波。','#f4d899'],['mirror','留影水晶','echo','在敵人走過的位置留下延遲回響。','#edc1f6'],['hourglass','回憶沙漏','slow','留下減速時域，幫助繞行與集中敵群。','#b4c7ef'],['seed','森靈種子','summon','召喚快速森靈，自動追擊並攻擊敵人。','#c0e6a2'],['thorns','荊棘花冠','thorns','腳邊留下短暫荊棘，反制追擊怪群。','#a4d6b1'],['plush','絨絨護符','plush','定期回復少量生命，滿血時生成有限護盾。','#ffe2dd'],['incense','花語香囊','incense','在前方展開花語領域，持續傷害敵人。','#ffcbd7'],['dice','幸運骰','chain','幸運雷光在敵群間連鎖，每次鏈尾爆發。','#d1f2ae'],['clover','四葉飛輪','clover','飛輪彈向多名敵人，傷害逐次降低。','#c3e88d'],['wings','曙光羽翼','wings','向前方發出交錯光羽，清理行進路徑。','#ffebc0'],['lightning','引光雷晶','chain','遠距連鎖雷光，擅長攻擊分散敵人。','#a6eaff']
];
const supportBranches={meteor:[['巨星墜落','單顆高傷害，進化後留下灼燒。','天墜星核'],['群星墜落','多顆隕星連續落下，單顆傷害較低。','流星天幕']],fireworks:[['禮花重奏','較少顆大範圍禮花，單顆傷害更高。','盛典禮花'],['繁花連爆','更多顆小範圍禮花，依序覆蓋敵群。','繁花萬響']],beam:[['追光指引','跟隨移動方向，可定向清路。','星軌裁光'],['環天掃光','自動旋轉掃射，單體傷害較低。','環天星軸']],orbit:[['疾環護身','內圈快速環繞。','流環護陣'],['遠環巡狩','擴大軌道、降低轉速。','天環巡狩']],arrow:[['貫月補射','單箭穿透更多敵人。','月影長虹'],['散月箭雨','多箭扇形射出，單箭穿透較少。','月影千矢']],clover:[['幸運追輪','單輪精準彈跳。','四葉追影'],['四葉散輪','多輪扇形射出，覆蓋前方。','四葉巡遊']],wings:[['交錯光羽','較少光羽，穿透更多敵人。','曙光貫羽'],['漫天光羽','更多光羽，單發傷害與穿透較低。','曙光漫天']],rain:[['寒霜領域','擴大範圍與控制。','霜晶星域'],['凝晶重擊','集中範圍、提高傷害。','凝晶崩解']],pulse:[['潮汐推進','強力擊退周圍敵群。','滄潮奔流'],['潮月留光','降低擊退，留下持續傷害領域。','潮月禁域']],chain:[['擴散連鎖','更多跳躍與更遠連接。','萬象連鎖'],['聚能連鎖','跳躍較少、距離較短，單次威力更高。','聚能裁決']],echo:[['深刻留影','較快引爆一次強力回聲。','永恆留影'],['重疊留影','延後引爆兩次，適合預判與引怪。','萬華重映']],slow:[['綿長時域','維持較久的減速傷害區。','永刻時域'],['擴散時域','更大範圍、更快冷卻，持續較短。','流時之環']],thorns:[['荊棘守陣','較小區域持續較久。','萬棘守陣'],['荊棘擴散','更大區域短暫爆發。','萬棘綻放']],ward:[['守約庇護','獲得更多護盾，震波範圍較小。','守約壁壘'],['守約反震','護盾較少，震波更大、更強。','守約回震']],plush:[['暖心回復','優先回復生命，滿血時轉為護盾。','絨絨暖春'],['絨絨守護','優先獲得更強護盾，只回復少量生命。','絨絨護城']],incense:[['花語庭園','較大花庭、持續較久。','百花春庭'],['花語凝華','較小花庭、單次傷害更高。','凝華花界']],summon:[['森靈群舞','多名快速夥伴。','萬葉同行'],['古樹守衛','一名範圍重擊守衛。','古樹庇護']]};
export const EQUIPMENT={};
for(const role of ROLES)EQUIPMENT[role.main]={id:role.main,name:role.mainName,desc:role.desc,kind:'main',roleId:role.id,family:role.family,color:role.color,branches:role.branches};
for(const[id,name,family,desc,color]of supportRows){const branches=supportBranches[family]||[['凝聚強化','集中威力，強化主要效果。',name+'・凝華'],['擴散強化','提高覆蓋，延長或增加攻擊。',name+'・流轉']];EQUIPMENT[id]={id,name,family,desc,color,kind:'support',branches:{a:route(...branches[0]),b:route(...branches[1])}}}
export const WEAPONS=EQUIPMENT;
export const PASSIVES={power:{name:'星力共鳴',desc:'所有傷害每級 +12%。',max:5},haste:{name:'流光節奏',desc:'攻擊冷卻每級縮短 8%。',max:4},vitality:{name:'暖心護符',desc:'生命上限 +20，立即回復 25。',max:4},magnet:{name:'星晶回收',desc:'每級拾取半徑 +32，移動速度 +5。',max:4},far:{name:'遠星共鳴',desc:'遠距命中每級最多增加 15% 傷害。',max:3},near:{name:'月影膽識',desc:'敵人聚集時每級最多降低 10% 傷害。',max:3},shatter:{name:'霜裂反應',desc:'冰凍敵人倒下時造成碎裂範圍傷害。',max:3},pact:{name:'森靈契約',desc:'召喚傷害每級 +18%，其他傷害 -6%。',max:3},trail:{name:'流光殘影',desc:'衝刺留下持續傷害軌跡。',max:3},barrier:{name:'守護回流',desc:'每級提高護盾上限與獲得量。',max:3},focus:{name:'破陣決心',desc:'對精英與首領每級增加 12% 傷害。',max:3},recovery:{name:'暖光循環',desc:'每十五秒回復每級 3 點生命。',max:3}};
export const MAPS=[
 {id:'cave',name:'星晶洞窟',desc:'晶簇共鳴、遠射與重甲敵人交錯的結晶洞窟。',color:'#b3a0e8',material:{id:'crystal',name:'星晶碎片'},duration:240,mechanic:'crystal',objective:'收集共鳴星晶並討伐晶核巨像',mechanicDesc:'共鳴晶簇週期爆發；先出現危險圓圈，離開後再回頭收集素材。',enemies:[0,1,2,3,4,5]},
 {id:'forest',name:'森語秘境',desc:'生長藤蔓、治療怪與召喚怪共同守護的古老森林。',color:'#a2d5a7',material:{id:'seed',name:'森靈芽核'},duration:270,mechanic:'roots',objective:'淨化三座森靈花苞，再迎戰古樹王',mechanicDesc:'花苞會沿途出現，靠近淨化可恢復生命並獲得芽核；孢子區域需要繞行。',enemies:[6,7,8,9,10,11]},
 {id:'coast',name:'潮汐月岸',desc:'海潮交替、橫向浪帶與甲殼守衛構成的月光海岸。',color:'#92d8e9',material:{id:'pearl',name:'潮月珍珠'},duration:240,mechanic:'tide',objective:'拾取三顆潮月珠，討伐深潮領主',mechanicDesc:'潮汐會預告後橫掃一條區域；乾潮時出現可拾取的潮月珠。',enemies:[12,13,14,15,16,17]},
 {id:'clock',name:'回聲鐘庭',desc:'延遲爆破、齒輪衝鋒與時間場交錯的遺忘庭院。',color:'#d4b9dc',material:{id:'gear',name:'回聲齒輪'},duration:270,mechanic:'echo',objective:'校準三座回聲時鐘，擊敗時序典獄',mechanicDesc:'時間裂隙會減速；靠近時鐘完成校準可清除附近危險並獲得齒輪。',enemies:[18,19,20,21,22,23]},
 {id:'sky',name:'曙光浮庭',desc:'光羽疾行者、雷晶遠射與環形彈幕守護的天空遺跡。',color:'#f2dca7',material:{id:'feather',name:'曙光羽晶'},duration:300,mechanic:'wind',objective:'啟動三座曙光信標，迎戰蒼穹聖像',mechanicDesc:'風場提供短暫加速，但雷光落點會追蹤舊位置；啟動信標能暫時護身。',enemies:[24,25,26,27,28,29]}
].map(m=>({...m,art:'art/v4/map-'+m.id+'.jpg'}));
// Six independent silhouettes per map; atlas rows correspond exactly to this order.
const monsterRows=[
 ['晶露史萊姆','chase',32,62,18],['晶翼蝠','orbit',24,112,15],['幽晶法徒','range',40,48,18],['岩甲守衛','shield',100,34,27],['裂晶幼獸','split',60,69,22],['晶核巨像','bossCrystal',5700,43,52],
 ['苔球精','chase',34,59,18],['荊棘奔鹿','charge',55,72,20],['孢子菇使','zone',45,38,20],['花芽祭司','healer',55,37,19],['藤蔓巢母','summoner',90,28,25],['森語古樹王','bossRoots',6200,32,56],
 ['泡沫水靈','split',38,58,18],['月砂蟹','shield',90,42,23],['潮刃魚','charge',35,94,17],['珍珠水母','range',40,40,20],['潛沙海鰻','burrow',65,80,22],['深潮領主','bossTide',5900,42,54],
 ['發條鼠','zigzag',29,93,16],['銅甲齒輪','shield',100,39,24],['留影幽靈','echo',42,60,18],['沙漏巫偶','zone',50,37,19],['報時鳥','range',35,72,17],['時序典獄','bossClock',6500,38,52],
 ['雲絨靈','orbit',30,83,18],['疾風羽蛇','charge',45,102,20],['雷晶使徒','range',48,45,19],['光紋護衛','healer',75,40,23],['風鈴召使','summoner',65,36,20],['蒼穹聖像','bossSky',6800,45,56]
];
export const MONSTERS=monsterRows.map(([name,behavior,hp,speed,r],id)=>({id,name,behavior,hp,speed,r,mapId:MAPS[Math.floor(id/6)].id,boss:id%6===5,atlas:Math.floor(id/6),cell:id%6,desc:({chase:'持續追擊',orbit:'從側翼繞行',range:'保持距離並預告射擊',shield:'正面護甲，重擊與光束可破甲',split:'倒下後分裂小型個體',charge:'鎖定方向後衝鋒',zone:'預告地面危險區',healer:'定期治療附近敵人',summoner:'召喚小型追擊者',burrow:'潛入地面後在舊位置現身',zigzag:'左右交錯逼近',echo:'在舊位置留下延遲爆破'})[behavior]||'兩階段首領，使用地圖專屬攻擊'}));
export const DIFFICULTY={normal:{name:'標準冒險',hp:1,speed:1,damage:1,shotSpeed:1,bossCount:10,desc:'完整怪物強度與首領攻擊。'},gentle:{name:'輕鬆探索',hp:.78,speed:.86,damage:.65,shotSpeed:.8,bossCount:6,desc:'敵方生命 -22%、移速 -14%、所有傷害 -35%，彈幕較少較慢。'}};
export const getRole=id=>ROLES.find(r=>r.id===id)||ROLES[1];
export const getMap=id=>MAPS.find(m=>m.id===id)||MAPS[0];
export const body=p=>({x:p.x,y:p.y-24});
export const enemyBody=e=>({x:e.x,y:e.y-(e.type===3?32:12)});
export const muzzle=p=>({x:p.x+(p.facing||1)*32,y:p.y-55});
export const weaponCount=g=>Object.values(g.weapons).filter(n=>n>0).length;
export const passiveCount=g=>Object.values(g.passives).filter(n=>n>0).length;
export const weaponLimit=()=>MAX_WEAPONS;
export const branchOf=(g,id)=>g.branches?.[id]||'a';
export function weaponName(g,id){const w=EQUIPMENT[id];return w?(g.weapons[id]>=5?w.branches[branchOf(g,id)].evolved:w.name):id}
export function upgradeInfo(g,id){const w=EQUIPMENT[id];if(!w)return'';const n=(g.weapons[id]||0)+1;return n===3?'選擇兩種攻擊路線':n===5?w.branches[branchOf(g,id)].evolved+' · 路線進化':`${w.family==='beam'?'整條光束持續命中 · ':''}Lv.${n} · 傷害與主要效果提升`}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)}
export function orbitSpec(g,id='moonblade'){const n=g.weapons[id]||1,far=n>=3?branchOf(g,id)==='b':id==='moonblade';return{r:far?170+n*10:103+n*7,count:far?2+Math.floor(n/2):2+n,speed:far?1.8:3.7,hitRadius:n===5?23:19,damage:(12+n*5)*(far?1.3:1)}}
