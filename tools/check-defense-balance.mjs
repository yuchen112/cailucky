import {storyMap} from '../games/fairytale-defense/rebuild/expedition.mjs';
import {createBattle,deploy,upgrade,upgradeCost,startWave,advance,castHero,chooseBlessing,UNIT_BRANCHES} from '../games/fairytale-defense/rebuild/core.mjs';
import {newArmySave,prepareArmyExpedition,settleArmySave,decodeArmySave} from '../games/fairytale-defense/rebuild/army-save.mjs';
import assert from 'node:assert/strict';
import {masteryLevel} from '../games/fairytale-defense/rebuild/mastery.mjs';
import {HERO_SPECIALIZATIONS} from '../games/fairytale-defense/rebuild/hero-rules.mjs';
let profile=newArmySave();
const hero=process.argv[2]||'hope';
// A reproducible legal-input baseline, not an assertion that every build should win.
for(let stage=1;stage<=15;stage++){
 const level=masteryLevel(profile.mastery.xp[hero]),cultivate=process.argv.includes('--cultivate'),build=cultivate?{specialization:level>=3?HERO_SPECIALIZATIONS[hero][0].id:null,talents:{...(level>=5?{passive:'reach'}:{}),...(level>=7?{active:'swift'}:{})}}:{};
 const runId='campaign-qa-'+stage,next=prepareArmyExpedition(profile,{hero,stage,map:storyMap(stage),...build},runId);profile=next.save;const s=next.battle;const plan=[[0,'archer'],[1,'archer'],[3,'frost'],[4,'cannon'],[2,'archer'],[5,'cannon'],[6,'archer'],[7,'cannon'],[8,'archer']];let steps=0;
 while(!['victory','defeat'].includes(s.phase)&&steps++<60000){
  if(s.blessingChoices.length)chooseBlessing(s,s.blessingChoices.includes('power')?'power':s.blessingChoices[0]);
  for(const [pad,role] of plan)if(!s.towers.some(t=>t.pad===pad)){if(!deploy(s,pad,role))break;}
  if(s.towers.length===9)for(const t of [...s.towers].sort((a,b)=>a.level-b.level))if(t.level<5&&s.gold>=upgradeCost(t))upgrade(s,t.pad,UNIT_BRANCHES[t.role][t.role==='cannon'&&stage>=10?1:0].id);
  if(['planning','intermission'].includes(s.phase)){profile=settleArmySave(profile,s,runId);startWave(s);}castHero(s);advance(s,1/30);
 }
 console.log(JSON.stringify({stage,result:s.phase,wave:s.wave,hp:s.hp,time:Math.round(s.time),gold:s.gold}));
 if(!['victory','defeat'].includes(s.phase))throw Error('Encounter stalled');
 if(s.phase==='defeat'&&process.argv.includes('--survey')){profile=decodeArmySave(JSON.stringify(settleArmySave(profile,s,runId)));console.log(`SURVEY ${hero}: fixed baseline lost stage ${stage}; ${profile.campaign.cleared.length} stages cleared. This is a strategy/balance finding, not a crash.`);process.exit(0);}
 assert.equal(s.phase,'victory','baseline cannot complete stage '+stage);profile=decodeArmySave(JSON.stringify(settleArmySave(profile,s,runId)));assert(profile.campaign.cleared.includes(stage));assert.equal(profile.campaign.unlocked,Math.min(15,stage+1));
}
assert.equal(profile.campaign.cleared.length,15);assert.equal(profile.mastery.xp[hero],900);console.log(`PASS ${hero}: legal campaign progression, all 15 victories, serialized saves and 900 XP awarded exactly once.`);
