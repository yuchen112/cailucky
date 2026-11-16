export const materials=Object.fromEntries([
  ...[['R',500],['SR',1500],['S',4000],['SSR',10000]].map(([tier,xp])=>['xp-'+tier,{tier,xp,name:'經驗之書・'+tier}]),
  ...[['card','卡牌'],['hero','英雄'],['rune','符文']].map(([kind,name])=>['tech-'+kind,{kind,tier:'S',xp:50,name:name+'秘技之書'}]),
]);
export const bookFor=(vault,floor)=>vault==='xp'?'xp-'+(floor<=2?'R':floor<=5?'SR':floor<=8?'S':'SSR'):'tech-'+['card','hero','rune'][(floor-1)%3];
