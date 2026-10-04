import assert from 'node:assert/strict';
import {newArmySave,prepareArmyExpedition,settleArmySave,decodeArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
import {restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
import {kindsFor} from '../games/fairytale-defense/rebuild/core.mjs';
for(const type of ['money','mastery'])for(let difficulty=1;difficulty<=3;difficulty++){
 const {battle,save}=prepareArmyExpedition(newArmySave(),{hero:'growth',dungeon:{type,difficulty}},type+difficulty);
 assert.equal(battle.maxWaves,3);assert(kindsFor(battle,3).includes('boss'));
 assert.deepEqual(restoreCheckpoint(save.checkpoint).dungeon,{type,difficulty});
 battle.wave=3;battle.phase='victory';const done=settleArmySave(save,battle,type+difficulty),again=settleArmySave(done,battle,type+difficulty);
 assert.deepEqual(done,again);assert.equal(done.campaign.unlocked,1);assert.deepEqual(done.campaign.cleared,[]);
 assert.equal(done.mastery.xp.growth,30+(type==='mastery'?60*difficulty:0));
 assert(done.collection.coins>=save.collection.coins+(type==='money'?120:30)*difficulty);decodeArmySave(JSON.stringify(done));
}
assert.throws(()=>prepareArmyExpedition(newArmySave(),{hero:'hope',dungeon:{type:'money',difficulty:4}},'invalid'));
console.log('PASS six dungeon configurations, checkpoint restoration, separate campaign progression and idempotent rewards');
