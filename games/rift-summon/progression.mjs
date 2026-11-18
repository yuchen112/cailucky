export const heroLimits=[10,20,35,50];
export const heroHealth=level=>60+6*Math.min(50,Math.max(1,level));
export const heroCapacity=level=>8+Number(level>=10)+Number(level>=20)+Number(level>=35)+Number(level>=50);
export const nextHeroCapacity=level=>[10,20,35,50].find(n=>n>level)??null;
export function migrateHeroProgression(save){
  if(!save||typeof save!=='object'||Array.isArray(save)||save.heroProgressionVersion===2)return save;
  const map=[0,1,10,20,35,50];
  if(Array.isArray(save.inventory?.items))for(const item of save.inventory.items){
    if(item.kind!=='hero')continue;
    const old=item.level;item.level=map[old]??old;
    item.breakthrough=item.level>35?3:item.level>20?2:item.level>10?1:0;
    if(item.level>=heroLimits[item.breakthrough]&&item.experience>0){item.reserveExperience=(item.reserveExperience??0)+item.experience;item.experience=0;}
  }
  if(save.wallet?.heroLevels)save.wallet.heroLevels=Object.fromEntries(Object.entries(save.wallet.heroLevels).map(([id,n])=>[id,map[n]??n]));
  const state=save.state;
  if(state?.heroLevel&&state.heroProgressionVersion!==2){
    const oldMax=state.heroMax??23+state.heroLevel;
    state.heroLevel=map[state.heroLevel]??state.heroLevel;state.heroMax=heroHealth(state.heroLevel);
    if(state.sides?.[0]?.hp>0)state.sides[0].hp=Math.min(state.heroMax,state.sides[0].hp+Math.max(0,state.heroMax-oldMax));
    state.heroProgressionVersion=2;
  }
  save.heroProgressionVersion=2;return save;
}
export function shuffleDeck(items,random=Math.random){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
