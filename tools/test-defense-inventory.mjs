import assert from 'node:assert/strict';
import {inventoryItems} from '../games/fairytale-defense/rebuild/inventory.mjs';
import {newArmySave,decodeArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
import {synthesizeBooks} from '../games/fairytale-defense/rebuild/training-books.mjs';
const base=decodeArmySave(newArmySave());assert.equal(inventoryItems(base).length,4);assert.ok(inventoryItems(base).every(i=>i.count===0));
base.books=100;base.bookInventory.common=100;const initial=JSON.stringify(base),next=synthesizeBooks(base,'common',10);assert.equal(JSON.stringify(base),initial);assert.equal(next.books,0);assert.equal(next.bookInventory.rare,10);assert.deepEqual(decodeArmySave(next),next);assert.throws(()=>synthesizeBooks(base,'common',11));assert.throws(()=>synthesizeBooks(base,'common',.5));assert.throws(()=>synthesizeBooks(base,'legendary',1));
base.weapons.growth={unlocked:true,xp:100,pending:0,drops:2};const items=inventoryItems(base),weapon=items.find(i=>i.kind==='weapons');assert.equal(items.length,5);assert.equal(weapon.hero,'growth');assert.equal(weapon.summary.level,2);assert.ok(weapon.summary.remaining>0);assert.equal(weapon.stamp,3);assert.equal(inventoryItems(base).filter(i=>i.kind==='weapons').length,1);
console.log('PASS zero-count book slots, held-only weapons, mastery details and atomic integer synthesis.');
