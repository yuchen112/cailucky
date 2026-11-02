export const MAX_WEAPONS=3,MAX_PASSIVES=4;
const branch=(name,desc,evolved)=>({name,desc,evolved});
export const WEAPONS={
 star:{name:'星芒法杖',desc:'從法杖發射遠距星彈。',color:'#ffe29a',branches:{pierce:branch('貫穿星芒','直線穿透更多敵人，適合拉成一列的怪群。','彗星貫流'),bounce:branch('彈射星芒','命中後跳向另一名敵人，單發傷害逐次遞減。','星河連珠')}},
 orbit:{name:'月環護衛',desc:'月刃持續環繞身體，沿軌跡造成傷害。',color:'#c8adff',branches:{close:branch('疾月護身','較小軌道、更多月刃與較快轉速，抵禦近身怪群。','月華護陣'),far:branch('遠月巡狩','擴大軌道與傷害，月刃較少、轉速較慢。','天環巡狩')}},
 rain:{name:'霜晶落雨',desc:'在敵群前進方向降下冰雨，累積寒霜後冰凍。',color:'#8fe8ff',branches:{wide:branch('寒霜領域','擴大範圍與冰凍時間，單次傷害較低。','永凍星域'),focused:branch('凝晶重擊','集中小範圍高傷害，適合精英與耐打敵人。','霜核崩解')}},
 pulse:{name:'星光震波',desc:'向外擴散的星光衝擊，清出移動空間。',color:'#ffb5df',branches:{knockback:branch('星爆推進','擴大震波並強力擊退，適合突圍。','超新星風暴'),field:branch('殘光禁域','減少擊退，留下持續灼傷敵人的星光區。','星輝禁域')}},
 meteor:{name:'星隕術',desc:'預告落點後降下隕星，打擊聚集的敵人。',color:'#ffc482',branches:{heavy:branch('巨星墜落','一顆高傷害隕星，覺醒後留下灼燒。','天墜星核'),shower:branch('群星墜落','多顆隕星依序轟炸，單顆傷害較低。','流星天幕')}},
 chain:{name:'星索雷鏈',desc:'雷光從一名敵人跳向附近敵人。',color:'#99e5ff',branches:{spread:branch('擴散星鏈','更多連鎖與更遠跳躍，適合密集怪群。','萬象星鏈'),focus:branch('聚能星鏈','連鎖較少但傷害提高；孤立目標承受額外傷害。','雷核裁決')}},
 summon:{name:'晶靈召喚',desc:'晶靈主動尋敵攻擊，露緹可專心走位與拾取。',color:'#c9afff',branches:{swarm:branch('晶靈群舞','多隻快速晶靈分頭攻擊，單隻傷害較低。','晶靈群舞'),guardian:branch('晶王契約','一名大型守衛，揮拳傷害附近多名敵人。','晶王守護')}},
 beam:{name:'星軌光束',desc:'從法杖射出持續光束，命中整條路徑。',color:'#ffedc4',branches:{follow:branch('追光指引','光束跟隨移動方向轉向，適合定向清路。','星軌裁光'),rotate:branch('環天掃光','光束自動旋轉掃射，單體持續傷害較低。','環天星軸')}}
};
for(const w of Object.values(WEAPONS))w.evolved=Object.values(w.branches)[0].evolved;
export const PASSIVES={power:{name:'星力共鳴',desc:'所有傷害每級 +15%。',max:5},haste:{name:'流光節奏',desc:'武器冷卻每級縮短 9%。',max:4},vitality:{name:'暖心護符',desc:'生命上限 +20，立即回復 30。',max:4},magnet:{name:'星晶回收',desc:'拾取半徑 +35、移動速度提高。',max:4},far:{name:'遠星共鳴',desc:'距離越遠，傷害越高；每級最高 +15%。',max:3},near:{name:'月影膽識',desc:'周圍敵人越多，受到傷害越低；每級最高減少 10%。',max:3},shatter:{name:'霜裂反應',desc:'冰凍敵人倒下時碎裂，傷害附近敵人。',max:3},pact:{name:'晶靈契約',desc:'每級召喚傷害 +18%，其他武器傷害 -8%。',max:3},trail:{name:'流光殘影',desc:'星閃衝刺留下持續傷害軌跡。',max:3}};
export const STARTERS={star:{name:'星芒法師',weapon:'star',desc:'遠距星彈起手，自由搭配其他武器。'},orbit:{name:'月影守衛',weapon:'orbit',desc:'環繞月刃起手，沿怪群邊緣突圍。'},summon:{name:'晶靈使者',weapon:'summon',desc:'晶靈自動尋敵，專心走位與拾取。'}};
export const DIFFICULTY={normal:{hp:1,speed:1,damage:1,shotSpeed:1,bossCounts:[10,16],fan:[3,5],name:'標準冒險',desc:'完整怪物強度與 Boss 彈幕。'},gentle:{hp:.78,speed:.86,damage:.65,shotSpeed:.80,bossCounts:[6,10],fan:[0,1],name:'輕鬆探索',desc:'敵人生命少 22%、速度慢 14%、所有敵方傷害少 35%；Boss 彈幕較少、較慢。'}};
export const body=p=>({x:p.x,y:p.y-24});
export const enemyBody=e=>({x:e.x,y:e.y-(e.type===3?32:12)});
export const muzzle=p=>({x:p.x+(p.facing||1)*32,y:p.y-55});
export const weaponCount=g=>Object.values(g.weapons).filter(v=>v>0).length;
export const passiveCount=g=>Object.values(g.passives).filter(v=>v>0).length;
export const weaponLimit=g=>g.legacyFour?4:MAX_WEAPONS;
export function branchOf(g,id){return g.branches?.[id]||Object.keys(WEAPONS[id].branches)[0]}
export function weaponName(g,id){const w=WEAPONS[id];return g.weapons[id]>=5?w.branches[branchOf(g,id)].evolved:w.name}
export function orbitSpec(g){const n=g.weapons.orbit,b=branchOf(g,'orbit'),far=b==='far'&&n>=3;return{r:far?165+n*12:100+n*8,count:far?Math.ceil(n/2)+1:n+1+(n>=3?1:0),speed:far?1.7:3.6,hitRadius:n===5?23:19,damage:(12+n*5)*(far?1.35:1)}}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)}
export function upgradeInfo(g,id){const n=g.weapons[id]+1,b=branchOf(g,id);switch(id){case'star':return`基礎傷害 ${23+n*7} · ${n>=3?(b==='bounce'?'彈射':'穿透'):'遠距星彈'}`;case'orbit':return n>=3&&b==='far'?'外圈巡狩 · 高傷害、慢轉速':'內圈護身 · 快速月刃';case'rain':return n>=3&&b==='focused'?'凝晶重擊 · 集中高傷害':'寒霜領域 · 範圍與冰凍提升';case'pulse':return n>=3&&b==='field'?'留下持續傷害區':'擴散震波與擊退';case'meteor':return n>=3&&b==='shower'?'多顆隕星連續落下':'大型隕星 · 高傷害';case'chain':return n>=3&&b==='focus'?'集中傷害 · 孤立目標加成':'連鎖跳躍 · 清除密集敵人';case'summon':return n>=3&&b==='guardian'?'單一大型守衛 · 範圍重拳':`${Math.min(5,1+n)} 隻晶靈協同攻擊`;case'beam':return n>=3&&b==='rotate'?'旋轉掃射 · 擴大覆蓋':'光束跟隨移動方向'}}
