import {exclusiveInfo} from './exclusive-cards.mjs?v=combat-3';
import {rarity,rarityNames,walletCardIds} from './economy.mjs?v=combat-3';
import {cards} from './battle.mjs?v=combat-3';
import {addInstance} from './inventory.mjs?v=combat-3';
export const fragmentYields=[1,2,4,8,16,40,100,220];
export const exchangeCosts=[30,60,140,300,700,1800,4800,9000];
export const fragmentValue=item=>fragmentYields[rarityNames.indexOf(rarity(item.id))]??0;
export const exchangeCost=id=>exclusiveInfo[id]?.cost??exchangeCosts[rarityNames.indexOf(rarity(id))];
export function protectedItems(teams,inventory,homeHero){
 const ids=new Set(teams.flatMap(t=>t.items?[...t.items.cards,t.items.hero,t.items.rune,t.items.rune2].filter(Boolean):[]));
 for(const item of inventory.items)if(item.locked)ids.add(item.uid);
 // Display selection is a hero identity, not a stack. Preserve its strongest
 // instance while allowing spare copies to remain independently recyclable.
 const display=inventory.items.filter(i=>i.kind==='hero'&&i.id===homeHero).sort((a,b)=>b.level-a.level||(b.effect??1)-(a.effect??1)||b.experience-a.experience)[0];
 if(display)ids.add(display.uid);
 return ids;
}
export function dismantle(inventory,wallet,uids,protectedUids=new Set()){
 if(!Array.isArray(uids)||!uids.length||uids.length>100||new Set(uids).size!==uids.length)return null;
 const selected=uids.map(uid=>inventory.items.find(i=>i.uid===uid));
 if(selected.some(i=>!i||i.locked||protectedUids.has(i.uid)||!['card','hero','rune'].includes(i.kind)))return null;
 const gain=selected.reduce((n,i)=>n+fragmentValue(i),0);
 if(!Number.isSafeInteger((wallet.fragments??0)+gain))return null;
 const next=structuredClone(inventory),money=structuredClone(wallet),removed=new Set(uids),consumed=[];
 next.items=next.items.filter(i=>!removed.has(i.uid));money.fragments=(money.fragments??0)+gain;
 for(const item of selected){
  const key={card:'copies',hero:'heroCopies',rune:'runeCopies'}[item.kind];
  money[key]??={};const count=next.items.filter(i=>i.kind===item.kind&&i.id===item.id).length;
  if(count&&(item.kind!=='card'||walletCardIds.includes(item.id)))money[key][item.id]=count;else delete money[key][item.id];
  if(!count){consumed.push(item.kind+':'+item.id);if(item.kind==='card'){money.unlocked=money.unlocked.filter(id=>id!==item.id);money.exclusiveUnlocked=(money.exclusiveUnlocked??[]).filter(id=>id!==item.id);}}
 }
 return {inventory:next,wallet:money,consumed,gain};
}
export function exchangeCard(inventory,wallet,id){
 if(!cards[id]||['boss','spirit'].includes(id)||inventory.items.length>=5000)return null;
 const cost=exchangeCost(id);if((wallet.fragments??0)<cost)return null;
 const next=structuredClone(inventory),money=structuredClone(wallet);money.fragments-=cost;
 addInstance(next,'card',id);if(exclusiveInfo[id]){money.exclusiveUnlocked??=[];if(!money.exclusiveUnlocked.includes(id))money.exclusiveUnlocked.push(id);money.copies??={};money.copies[id]=next.items.filter(i=>i.kind==='card'&&i.id===id).length;}else if(walletCardIds.includes(id)){money.copies??={};money.copies[id]=next.items.filter(i=>i.kind==='card'&&i.id===id).length;if(!money.unlocked.includes(id))money.unlocked.push(id);}
 return {inventory:next,wallet:money,cost};
}
