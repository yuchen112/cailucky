import {bookInventory,BOOK_GRADES,BOOK_NAMES} from './training-books.mjs?v=20261007-names1';
import {validateWeapons,WEAPONS,weaponSummary} from './hero-weapons.mjs?v=20261007-names1';
import {ROLES} from './core.mjs?v=20261007-names1';
export function inventoryItems(profile){
 const books=bookInventory(profile),weapons=validateWeapons(profile.weapons);
 return [...BOOK_GRADES.map(grade=>({key:'book-'+grade,kind:'books',grade,name:BOOK_NAMES[grade]+'訓練書',shortName:BOOK_NAMES[grade],art:'training-book-'+grade,count:books[grade],stamp:books[grade]})),...Object.entries(weapons).filter(([,w])=>w.unlocked).map(([hero,w])=>({key:'weapon-'+hero,kind:'weapons',hero,name:WEAPONS[hero].name,shortName:ROLES[hero].name,art:'weapon-'+hero,count:1,stamp:w.drops+1,summary:weaponSummary(hero,w)}))];
}
export const bookSource='兵種演練副本：一般／進階／困難固定獲得一般書 100／200／300 張。每 10 張可合成上一級 1 張；傳說書需 1000 張一般書。';
export const weaponSource='英雄熟練副本・困難有機率掉落當前英雄專武。重複掉落提升專武熟練；英雄滿等後，此副本溢出的熟練也會累積至專武。不能使用訓練書。';
