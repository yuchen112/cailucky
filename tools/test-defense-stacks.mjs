import assert from 'node:assert/strict';
import {addDamageStack,tickDamageStacks} from '../games/fairytale-defense/rebuild/damage-stacks.mjs';
import {tickZones} from '../games/fairytale-defense/rebuild/troop-mechanics.mjs';
const e={hp:100,armor:0};for(let i=0;i<4;i++)addDamageStack(e,{kind:'spore',poison:5},i*.2);
assert.equal(e.damageStacks.length,3);addDamageStack(e,{kind:'flame',poison:7},.8);tickDamageStacks(e,1,1);assert.equal(e.hp,78);tickDamageStacks(e,4,1);assert.equal(e.hp,78);
const enemy={hp:100,armor:0,distance:0,slow:1};const s={time:1,towers:[1,2,3,4].map(id=>({id})),zones:[1,2,3,4].map(owner=>({owner,x:0,y:0,radius:50,damage:10,slow:.6,until:3})),enemies:[enemy]};tickZones(s,1,()=>({x:0,y:0}));assert.equal(enemy.hp,70);assert.equal(enemy.slow,.6);
console.log('PASS independent poison/flame expiry, three stacks per type, strongest three zone owners, nonstacking slow');
