import assert from 'node:assert/strict';
import {createBattle} from '../games/fairytale-defense/rebuild/core.mjs';
import {newArmySave,beginArmySave,settleArmySave,decodeArmySave,prepareArmyExpedition} from '../games/fairytale-defense/rebuild/army-save.mjs';
let profile=newArmySave();
assert.throws(()=>beginArmySave(profile,createBattle({hero:'growth',stage:2}),'locked'));
for(let stage=1;stage<=15;stage++){
 const s=createBattle({hero:'growth',stage});profile=beginArmySave(profile,s,'stage-'+stage);s.phase='victory';s.wave=6;
 const practice=settleArmySave(profile,s,'stage-'+stage,{practice:true});assert.equal(practice.campaign.unlocked,stage);assert.equal(practice.mastery.xp.growth,profile.mastery.xp.growth);
 profile=settleArmySave(profile,s,'stage-'+stage);assert.equal(profile.campaign.unlocked,Math.min(15,stage+1));assert.equal(profile.campaign.cleared.length,stage);assert.deepEqual(settleArmySave(profile,s,'stage-'+stage),profile);assert.deepEqual(decodeArmySave(JSON.stringify(profile)),profile);
}
assert.equal(profile.mastery.xp.growth,900);
for(const campaign of [{unlocked:3,cleared:[1]},{unlocked:1,cleared:[1]},{unlocked:2,cleared:[1,1]},{unlocked:16,cleared:[]}])assert.throws(()=>decodeArmySave({...profile,campaign}));
const legacy=newArmySave();delete legacy.campaign;assert.deepEqual(decodeArmySave(legacy).campaign,{unlocked:1,cleared:[],clearedIds:[],unlockedId:'forest-entrance'});
assert.throws(()=>prepareArmyExpedition(newArmySave(),{hero:'growth',specialization:'elite',masteryXp:9999},'illegal'));
const prepared=prepareArmyExpedition(profile,{hero:'growth',specialization:'elite',talents:{passive:'reach'}},'new');assert.equal(prepared.battle.hero.masteryXp,900);assert.equal(prepared.save.mastery.activeRun.id,'new');assert.equal(profile.mastery.activeRun.id,'stage-15','preparation does not mutate input');
assert.throws(()=>prepareArmyExpedition(profile,{hero:null},'bad'));
console.log('PASS: sequential 15-stage unlock, replay idempotency, practice exclusion, save roundtrip and malformed campaign rejection. This tests persistence, not encounter balance.');
