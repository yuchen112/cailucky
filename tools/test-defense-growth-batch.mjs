import assert from 'node:assert/strict';
import {newArmySave,decodeArmySave,prepareArmyExpedition,settleArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
import {synthesizeBooks,useTrainingBooks,trainingInfo} from '../games/fairytale-defense/rebuild/training-books.mjs';
import {awardWeapon,weaponThreshold} from '../games/fairytale-defense/rebuild/hero-weapons.mjs';
import {createBattle,deploy,upgrade,upgradeCost,towerStats} from '../games/fairytale-defense/rebuild/core.mjs';
import {captureCheckpoint,restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
let p=decodeArmySave({...newArmySave(),bookInventory:undefined,books:1000});p=synthesizeBooks(p,'common',100);p=synthesizeBooks(p,'rare',10);p=synthesizeBooks(p,'epic',1);assert.deepEqual(p.bookInventory,{common:0,rare:0,epic:0,legendary:1});
p.collection.owned.push('dragon');p=useTrainingBooks(p,'dragon',1).profile;assert.equal(p.collection.training.dragon,1);assert.equal(p.bookInventory.legendary,0);assert.throws(()=>useTrainingBooks(p,'archer',1));assert.equal(trainingInfo(p,'archer').required,1);
assert.equal(upgradeCost({role:'archer',level:2}),160);assert.equal(upgradeCost({role:'dragon',level:2}),320);
let s=createBattle({hero:'growth',loadout:['firefly']});s.gold=10000;deploy(s,0,'firefly');upgrade(s,0);assert.equal(restoreCheckpoint(captureCheckpoint(s)).towers[0].spent,190);
let w=awardWeapon(null,'growth',{overflow:25});assert.equal(w.weapons.growth.pending,25);w=awardWeapon(w.weapons,'growth',{drop:true,overflow:10});assert.equal(w.weapons.growth.xp,35);w=awardWeapon(w.weapons,'growth',{drop:true});assert.equal(w.weapons.growth.xp,135);
const profile=decodeArmySave(newArmySave());profile.mastery.xp.growth=1990;const start=prepareArmyExpedition(profile,{hero:'growth',dungeon:{type:'mastery',difficulty:3}},'weapon-test');start.battle.wave=3;start.battle.phase='victory';const done=settleArmySave(start.save,start.battle,'weapon-test',{random:()=>0});assert.equal(done.mastery.xp.growth,2000);assert.equal(done.weapons.growth.xp,200);assert.equal(done.weapons.growth.unlocked,true);assert.deepEqual(settleArmySave(done,start.battle,'weapon-test',{random:()=>{throw Error('reroll');}}),done);
assert.equal(weaponThreshold(10),4500);assert.equal(decodeArmySave({...newArmySave(),bookInventory:undefined,books:45}).bookInventory.common,45);
const historical=decodeArmySave(newArmySave());historical.mastery.xp.growth=2500;const oldRun=prepareArmyExpedition(historical,{hero:'growth',dungeon:{type:'mastery',difficulty:3}},'old-max');oldRun.battle.wave=3;oldRun.battle.phase='victory';const oldDone=settleArmySave(oldRun.save,oldRun.battle,'old-max',{random:()=>0});assert.equal(oldDone.mastery.xp.growth,2500);assert.equal(oldDone.weapons.growth.xp,210);
const artisan={role:'artisan',level:1};const untrained=towerStats(artisan,{army:true,training:{artisan:0}}),trained=towerStats(artisan,{army:true,training:{artisan:87}});assert.equal(trained.income,Math.floor(untrained.income*1.87));assert.equal(trained.heal,untrained.heal);assert.equal(trainingInfo(p,'artisan').effectLabel,'補給收益');
console.log('PASS rarity book restrictions, synthesis conservation, old save migration, weapon drops/overflow/idempotence and rarity upgrade cost.');

