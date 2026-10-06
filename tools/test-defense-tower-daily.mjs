import assert from 'node:assert/strict';
import {awardEndless,towerDaily,validateRewardLedger,taiwanDay,TOWER_IDS} from '../games/fairytale-defense/rebuild/endless-rewards.mjs';
import {newArmySave,decodeArmySave,prepareArmyExpedition,settleArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
const now=Date.parse('2026-10-06T15:59:59Z'),tomorrow=now+1000;
const a=awardEndless(null,0,10,now,'forest'),old=JSON.stringify(a.ledger),b=awardEndless(a.ledger,0,10,now,'moon');
assert.equal(JSON.stringify(a.ledger),old);assert.equal(b.reward.dailyCoins,a.reward.dailyCoins);assert.equal(awardEndless(b.ledger,0,10,now,'forest').reward.dailyCoins,0);assert.equal(awardEndless(b.ledger,0,10,now,'moon').reward.basicCoins,a.reward.basicCoins);
assert.equal(towerDaily(b.ledger,'moon',now).next,11);assert.equal(towerDaily(b.ledger,'dawn',now).next,1);assert.equal(towerDaily(b.ledger,'forest',tomorrow).claimed.length,0);
const reset=awardEndless(b.ledger,0,1,tomorrow,'ruins');assert.deepEqual(reset.ledger.byTower,{forest:[],moon:[],dawn:[],ruins:[1]});assert.equal(awardEndless(b.ledger,10,10,now,'moon').reward.coins,0);
const legacy={day:taiwanDay(now),daily:[1,2],first99:true};assert.deepEqual(validateRewardLedger(legacy,'moon').byTower,{forest:[],moon:[1,2],dawn:[],ruins:[]});assert.equal(validateRewardLedger(legacy).byTower.forest.length,2);assert.throws(()=>validateRewardLedger({...legacy,byTower:{alien:[]}}));assert.throws(()=>awardEndless(null,0,1,now,'alien'));
let full=null;for(const id of TOWER_IDS){const p=awardEndless(full,0,99,now,id);assert.equal(p.reward.firstCoins,full?0:1000);full=p.ledger;assert.equal(towerDaily(full,id,now).next,null);}
const expedition=prepareArmyExpedition(newArmySave(),{hero:'growth',mode:'endless',map:'moon'},'daily-test');expedition.battle.wave=1;expedition.battle.phase='intermission';const save=settleArmySave(expedition.save,expedition.battle,'daily-test');assert.deepEqual(save.rewardLedger.byTower.moon,[1]);assert.deepEqual(save.rewardLedger.byTower.forest,[]);assert.equal(settleArmySave(save,expedition.battle,'daily-test').books,save.books);assert.deepEqual(decodeArmySave(save),save);
const migrated=decodeArmySave({...save,rewardLedger:legacy});assert.deepEqual(migrated.rewardLedger.byTower.moon,[1,2]);assert.equal(migrated.books,save.books);
console.log('PASS four independent tower dailies, midnight reset, legacy migration, immutable payouts and checkpoint settlement.');
