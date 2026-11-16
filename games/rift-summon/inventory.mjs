export function newInventory() { return {next:1,items:[]}; }
export function addInstance(inventory,kind,id,level=1,experience=0) {
  const item={uid:`i${inventory.next++}`,kind,id,level,experience};
  inventory.items.push(item);
  return item;
}
export function migrateInventory(saved,wallet,owned,heroes,runes) {
  if(saved?.inventory) return structuredClone(saved.inventory);
  const inventory=newInventory();
  const entries=[
    ['card',owned,wallet.copies,wallet.levels],
    ['hero',heroes,wallet.heroCopies,wallet.heroLevels],
    ['rune',runes,wallet.runeCopies,wallet.runeLevels],
  ];
  for(const [kind,ids,copies,levels] of entries) {
    for(const id of new Set(ids)) {
      const count=Math.min(500,Math.max(1,copies?.[id]??1));
      for(let i=0;i<count;i++) addInstance(inventory,kind,id,i===0?levels?.[id]??1:1);
    }
  }
  return inventory;
}
export function xpNeeded(level) {return 100+(level-1)*50;}
export function grantExperience(item,amount) {
  if(item.level>=5)return false;
  item.experience+=amount;
  while(item.level<5 && item.experience>=xpNeeded(item.level)) {
    item.experience-=xpNeeded(item.level);
    item.level++;
  }
  if(item.level===5)item.experience=0;
  return true;
}
export function validInventory(value,types) {
  if(!value||!Number.isSafeInteger(value.next)||value.next<1||!Array.isArray(value.items)||value.items.length>5000)return false;
  const ids=new Set();
  return value.items.every(item=>{
    if(!item||typeof item.uid!=='string'||!/^i[1-9]\d*$/.test(item.uid)||Number(item.uid.slice(1))>=value.next||ids.has(item.uid)||
      !Object.hasOwn(types,item.kind)||!types[item.kind].includes(item.id)||!Number.isInteger(item.level)||item.level<1||item.level>5||
      !Number.isInteger(item.experience)||item.experience<0||
      (item.level===5?item.experience!==0:item.experience>=xpNeeded(item.level)))return false;
    ids.add(item.uid);
    return true;
  });
}
