import {makeEncounter} from './encounters.mjs?v=combat-4';
import {exclusiveIds} from './exclusive-cards.mjs?v=combat-4';
export const plannedChapters=99;
export function campaignLevel(chapter,step=0){
  if(chapter>=80)return 99;
  const c=Math.max(1,chapter)+Math.min(3,Math.max(0,step))/4;
  return Math.min(98,Math.floor(c<=20?1+(c-1)*39/19:c<=50?40+(c-20)*35/30:75+(c-50)*24/30));
}
const regions=['晨曦港灣','翠羽丘陵','暮鐘小鎮','銀泉濕地','烈風峽谷','琉璃古塔','星沙綠洲','白霧森林','赤銅礦脈','月桂神殿','冰瀑長廊','浮島航路','熔岩深井','迷夢花園','珊瑚王城','千燈山道','翡翠庭院','雷鳴高原','靈鹿聖林','黃昏堡壘','星海迴廊','忘卻書庫','寒晶要塞','燼羽火山','流螢谷地','深潮裂谷','巡星觀測台','靜默荒原','雲端鐘樓','失落王庭','破曉邊境','鏡月迷宮','霜火戰線','天穹龍巢','夜紗城邦','時砂深淵','聖光禁域','群星之門','終焉前庭','裂界王座'];
export function extendCampaign(stages,names,cards){
 const additions=Object.keys(cards).filter(id=>!exclusiveIds.includes(id)&&!stages.some(s=>s.reward===id)&&!['boss','spirit','guard','bomb','archer','ax','ghost','healer','knight','giant'].includes(id));
 const all=Object.keys(cards).filter(id=>!exclusiveIds.includes(id)&&!['boss','spirit'].includes(id));
 for(let c=10;c<50;c++){
  const region=regions[c-10];names.push(`第 ${c+1} 章・${region}`);
  for(let step=0;step<4;step++){
   const offset=(c*7+step*3)%all.length;
   const roster=Array.from({length:8},(_,i)=>all[(offset+i*11)%all.length]);
   stages.push({name:region+['・前哨','・迴廊','・核心','・守將'][step],goal:['掌握部署倒數，搭配護盾與回復維持戰線。','觀察敵方專屬技能，優先處理控制與治療單位。','運用破甲與狀態效果集中突破一欄。','章末守將：留意技能連鎖與側翼直攻。'][step],hp:Math.min(73,24+Math.floor(c*.8)+step),opponents:roster,opening:[roster[step]],reward:additions[((c-10)*4+step)%additions.length]});
  }
 }
 stages.forEach((s,index)=>{
  const chapter=Math.floor(index/4)+1,step=index%4;Object.assign(s,makeEncounter(chapter,step,campaignLevel(chapter,step)));
  s.goal=s.strategy+'。'+['觀察敵軍配置，保留支援牌維持戰線。','留意敵方符文的發動條件與冷卻。','先處理治療與控制，避免長期消耗。','章末頭目配置；開局守軍計入牌組總數。'][step];
 });
}
