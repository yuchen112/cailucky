import {heroCapacity} from './progression.mjs?v=book-growth-1';
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
export const limits=[20,40,60,80,99];
export const effectsMax=10;
export const levelLimit=item=>item.kind==='card'?limits[item.breakthrough??0]:5;
export const cardHealthBonus=level=>2*Math.min(4,Math.max(0,level-1))+Math.max(0,level-5);
export const cardBonus=level=>Math.min(4,level-1)+Math.floor(Math.max(0,level-5)/8);
export function xpNeeded(level) {return 100+(level-1)*50;}
export function grantExperience(item,amount) {
  if(item.level>=levelLimit(item))return false;
  item.experience+=amount;
  while(item.level<levelLimit(item) && item.experience>=xpNeeded(item.level)) {
    item.experience-=xpNeeded(item.level);
    item.level++;
  }
  if(item.level===levelLimit(item))item.experience=0;
  return true;
}
export function validInventory(value,types) {
  if(!value||!Number.isSafeInteger(value.next)||value.next<1||!Array.isArray(value.items)||value.items.length>5000)return false;
  const ids=new Set();
  return value.items.every(item=>{
    if(!item||typeof item.uid!=='string'||!/^i[1-9]\d*$/.test(item.uid)||Number(item.uid.slice(1))>=value.next||ids.has(item.uid)||
      !Object.hasOwn(types,item.kind)||!types[item.kind].includes(item.id)||!Number.isInteger(item.level)||item.level<1||item.level>levelLimit(item)||
      (item.breakthrough!==undefined&&(!Number.isInteger(item.breakthrough)||item.kind!=='card'||item.breakthrough<0||item.breakthrough>4))||
      (item.effect!==undefined&&(!Number.isInteger(item.effect)||item.effect<1||item.effect>10))||
      (item.locked!==undefined&&typeof item.locked!=='boolean')||!Number.isInteger(item.experience)||item.experience<0||
      (item.level===levelLimit(item)?item.experience!==0:item.experience>=xpNeeded(item.level)))return false;
    ids.add(item.uid);
    return true;
  });
}
export function checkLineup(items,find) {
  if(!items||!Array.isArray(items.cards)||items.cards.length<8||items.cards.length>12)return '請放入 8 至 12 張卡牌。';
  const cards=items.cards.map(find);
  if(cards.some(card=>card?.kind!=='card'))return '有牌位缺少可用的卡牌，請重新選擇。';
  if(new Set(items.cards).size!==items.cards.length)return '同一張卡牌個體不能重複佔用牌位。';
  if(find(items.hero)?.kind!=='hero')return '請選擇一位已持有的英雄。';
  const cap=heroCapacity(find(items.hero).level);
  if(cards.length>cap)return `此英雄目前最多可帶 ${cap} 張，請移除多出的卡牌或提升英雄等級。`;
  if(items.rune!==null&&find(items.rune)?.kind!=='rune')return '裝備的符文已不可用，請重新選擇或卸下。';
  if(items.rune2!=null&&(items.rune2===items.rune||find(items.rune2)?.kind!=='rune'))return '第二格符文無效或重複裝備。';
  return '';
}
export function assignLineupCard(slots,position,uid,find) {
  const candidate=find(uid);
  if(candidate?.kind!=='card'||!Number.isInteger(position)||position<0||position>slots.length)return null;
  const other=slots.findIndex((id,i)=>i!==position&&id===uid);
  if(position===slots.length&&other>=0)return null;
  const next=[...slots];
  if(other>=0)next[other]=slots[position];
  next[position]=uid;
  return next;
}
