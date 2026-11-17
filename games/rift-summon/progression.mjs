export const heroHealth=level=>24+4*(Math.min(5,Math.max(1,level))-1);
export const heroCapacity=level=>7+Math.min(5,Math.max(1,level));
export function shuffleDeck(items,random=Math.random){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
