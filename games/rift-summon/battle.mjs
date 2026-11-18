import {cards,starter} from './card-data.mjs?v=combat-3';
import {extendCampaign} from './campaign-expansion.mjs?v=combat-3';
export {cards,starter};
export {createBattle,applyAction} from './battle-engine.mjs?v=combat-3';
const sentries = ['guard', 'bomb', 'knight', 'ax', 'ghost', 'giant'];


export const chapterNames = ["第一章・斷橋哨站", "第二章・沉鐘墓園", "第三章・翡翠林海", "第四章・赤焰熔城", "第五章・霜月群峰", "第六章・浮光水都", "第七章・沙海遺城", "第八章・幽影邊境", "第九章・蒼穹王庭", "第十章・裂界核心"];
export const stages = [
  {name:'哨站前沿', goal:'倒數歸零就能部署。先用護衛或斥候接住第一波。', hp:8, opponents:['guard','archer','healer','knight'], opening:['archer'], reward:'bow'},
  {name:'雙塔迴廊', goal:'同回合可以連下多張。留意每張牌的部署順序。', hp:10, opponents:['bomb','knight','archer','ghost','ax'], opening:['guard','bomb'], reward:'fang'},
  {name:'斷橋缺口', goal:'正對空位可直攻英雄。對手擅長護盾與追獵。', hp:9, opponents:['archer','knight','ghost','fang','bow'], opening:['knight'], reward:'flag'},
  {name:'斷橋守將', goal:'頭目橫掃正對欄與兩側。利用護衛、自爆和接替改寫對位。', hp:10, opponents:sentries, opening:['boss'], reward:'moon'},
  {name:'沉鐘入口', goal:'盾兵會保護正對的位置。用破甲或追獵拆開前線。',hp:11,opponents:['boar','seal','hare','archer','ax'],opening:['boar'],reward:'seal'},
  {name:'幽潮祭壇', goal:'留意亡靈接替，擊退本體後該欄仍可能被靈體佔據。',hp:12,opponents:['bat','ghost','koi','healer','ram'],opening:['bat'],reward:'koi'},
  {name:'水門斷層', goal:'爆甲和自爆會傷及相鄰欄位，調整下牌順序再進攻。',hp:13,opponents:['beetle','crab','bow','panda','wolf'],opening:['mole'],reward:'wolf'},
  {name:'沉鐘獅王', goal:'曜鬃獅統領的戰吼能隔著守軍傷害英雄。先壓力最大的欄位。',hp:14,opponents:['otter','hedgehog','fang','swan','giant'],opening:['lion'],reward:'swan'},
  {"name":"林緣小徑","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":14,"opponents":["turtle","stag","hare","hedgehog","frog","beaver"],"opening":["turtle"],"reward":"turtle","enemyLevel":5,"enemyEffect":1},
  {"name":"苔根溪谷","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":15,"opponents":["stag","hare","hedgehog","frog","beaver","turtle"],"opening":["stag"],"reward":"stag","enemyLevel":5,"enemyEffect":1},
  {"name":"古樹迴廊","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":16,"opponents":["hare","hedgehog","frog","beaver","turtle","stag"],"opening":["hare","hedgehog"],"reward":"frog","enemyLevel":5,"enemyEffect":1},
  {"name":"翡翠守望","goal":"護衛會替相鄰友軍減傷，先處理前排守軍。","hp":17,"opponents":["hedgehog","frog","beaver","turtle","stag","hare"],"opening":["stag","yak"],"reward":"yak","enemyLevel":6,"enemyEffect":1},
  {"name":"熔爐街口","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":15,"opponents":["crab","beetle","mole","ember","drake","yakfire"],"opening":["crab"],"reward":"crab","enemyLevel":7,"enemyEffect":2},
  {"name":"燼火工坊","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":16,"opponents":["beetle","mole","ember","drake","yakfire","crab"],"opening":["beetle"],"reward":"beetle","enemyLevel":7,"enemyEffect":2},
  {"name":"赤銅城門","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":17,"opponents":["mole","ember","drake","yakfire","crab","beetle"],"opening":["mole","ember"],"reward":"drake","enemyLevel":7,"enemyEffect":2},
  {"name":"熔城領主","goal":"自爆會波及相鄰欄位，部署時留意連鎖傷害。","hp":18,"opponents":["ember","drake","yakfire","crab","beetle","mole"],"opening":["drake","yakfire"],"reward":"yakfire","enemyLevel":8,"enemyEffect":2},
  {"name":"雪線哨口","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":16,"opponents":["seal","otter","yak","wolf","falcon","lynxguard"],"opening":["seal"],"reward":"seal","enemyLevel":9,"enemyEffect":2},
  {"name":"霜橋天險","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":17,"opponents":["otter","yak","wolf","falcon","lynxguard","seal"],"opening":["otter"],"reward":"otter","enemyLevel":9,"enemyEffect":2},
  {"name":"月影山脊","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":18,"opponents":["yak","wolf","falcon","lynxguard","seal","otter"],"opening":["yak","wolf"],"reward":"falcon","enemyLevel":9,"enemyEffect":2},
  {"name":"霜月狼王","goal":"破甲能穿透護盾，搭配治療守住高血量前排。","hp":19,"opponents":["wolf","falcon","lynxguard","seal","otter","yak"],"opening":["wolf","yak"],"reward":"wolf","enemyLevel":10,"enemyEffect":2},
  {"name":"藍溪碼頭","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":17,"opponents":["koi","swan","crane","otter","panda","stork"],"opening":["koi"],"reward":"otter","enemyLevel":11,"enemyEffect":2},
  {"name":"水晶迴橋","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":18,"opponents":["swan","crane","otter","panda","stork","koi"],"opening":["swan"],"reward":"koi","enemyLevel":11,"enemyEffect":2},
  {"name":"潮聲聖堂","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":19,"opponents":["crane","otter","panda","stork","koi","swan"],"opening":["crane","otter"],"reward":"crane","enemyLevel":11,"enemyEffect":2},
  {"name":"銀翼主祭","goal":"治療與亡靈接替互相掩護，集中火力突破一欄。","hp":20,"opponents":["otter","panda","stork","koi","swan","crane"],"opening":["swan","crane"],"reward":"swan","enemyLevel":12,"enemyEffect":2},
  {"name":"風沙驛站","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":18,"opponents":["ferret","badger","ibis","yakfire","eagle","ram"],"opening":["ferret"],"reward":"ferret","enemyLevel":13,"enemyEffect":3},
  {"name":"殘壁暗巷","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":19,"opponents":["badger","ibis","yakfire","eagle","ram","ferret"],"opening":["badger"],"reward":"badger","enemyLevel":13,"enemyEffect":3},
  {"name":"金砂王庭","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":20,"opponents":["ibis","yakfire","eagle","ram","ferret","badger"],"opening":["ibis","yakfire"],"reward":"ibis","enemyLevel":13,"enemyEffect":3},
  {"name":"沙海御衛","goal":"猛進擅長壓制低生命單位，使用護衛接下攻勢。","hp":21,"opponents":["yakfire","eagle","ram","ferret","badger","ibis"],"opening":["eagle","ram"],"reward":"eagle","enemyLevel":14,"enemyEffect":3},
  {"name":"暮色渡口","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":19,"opponents":["bat","gecko","rabbit","ghost","raven","moth"],"opening":["bat"],"reward":"bat","enemyLevel":15,"enemyEffect":3},
  {"name":"引魂長廊","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":20,"opponents":["gecko","rabbit","ghost","raven","moth","bat"],"opening":["gecko"],"reward":"rabbit","enemyLevel":15,"enemyEffect":3},
  {"name":"無月庭院","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":21,"opponents":["rabbit","ghost","raven","moth","bat","gecko"],"opening":["rabbit","ghost"],"reward":"moth","enemyLevel":15,"enemyEffect":3},
  {"name":"幽影統領","goal":"亡靈退場後可能留下靈體，橫掃能壓制接替陣線。","hp":22,"opponents":["ghost","raven","moth","bat","gecko","rabbit"],"opening":["raven","rabbit"],"reward":"raven","enemyLevel":16,"enemyEffect":3},
  {"name":"雲階前哨","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":20,"opponents":["eagle","falcon","stork","crane","lion","lynxguard"],"opening":["eagle"],"reward":"stork","enemyLevel":17,"enemyEffect":3},
  {"name":"白羽長橋","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":21,"opponents":["falcon","stork","crane","lion","lynxguard","eagle"],"opening":["falcon"],"reward":"lynxguard","enemyLevel":17,"enemyEffect":3},
  {"name":"天穹大廳","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":22,"opponents":["stork","crane","lion","lynxguard","eagle","falcon"],"opening":["stork","crane"],"reward":"lion","enemyLevel":17,"enemyEffect":3},
  {"name":"金羽王衛","goal":"戰吼能越過守軍傷害英雄，盡快解決敵方主力。","hp":23,"opponents":["crane","lion","lynxguard","eagle","falcon","stork"],"opening":["eagle","lion"],"reward":"eagle","enemyLevel":18,"enemyEffect":3},
  {"name":"裂隙門扉","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":21,"opponents":["lion","drake","wolf","crane","rabbit","eagle","lynxguard","raven"],"opening":["lion"],"reward":"lynxguard","enemyLevel":19,"enemyEffect":4},
  {"name":"鏡界迴廊","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":22,"opponents":["drake","wolf","crane","rabbit","eagle","lynxguard","raven","lion"],"opening":["drake"],"reward":"rabbit","enemyLevel":19,"enemyEffect":4},
  {"name":"星核深淵","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":23,"opponents":["wolf","crane","rabbit","eagle","lynxguard","raven","lion","drake"],"opening":["wolf","crane"],"reward":"drake","enemyLevel":19,"enemyEffect":4},
  {"name":"裂界終戰","goal":"敵軍兼具破甲、戰吼與接替，依對位調整出牌順序。","hp":24,"opponents":["crane","rabbit","eagle","lynxguard","raven","lion","drake","wolf"],"opening":["lion","eagle"],"reward":"eagle","enemyLevel":20,"enemyEffect":4},
];

// Gradual chapter and within-chapter growth, including the second chapter.
extendCampaign(stages,chapterNames,cards);
