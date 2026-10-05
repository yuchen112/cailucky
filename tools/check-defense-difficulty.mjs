import {createBattle,deploy,upgrade,startWave,advance,castHero,chooseBlessing} from '../games/fairytale-defense/rebuild/core.mjs';
import {selectAutoBlessing,shouldAutoSkill} from '../games/fairytale-defense/rebuild/assists.mjs';
const squads={starter:['archer','cannon','frost','archer','cannon','frost','archer','cannon','archer'],mixed:['oracle','frost','dragon','firefly','blossom','dragon','frost','oracle','dragon']};
function run({difficulty,level,trained=false,squad='starter',mode='campaign',wave=0}){
 const roles=[...new Set(squads[squad])],s=createBattle({hero:'hope',masteryXp:trained?2000:0,loadout:roles,training:Object.fromEntries(roles.map(id=>[id,trained?87:0])),dungeon:mode==='campaign'?{type:'training',difficulty}:null,mode});
 s.gold=100000;for(const [pad,id] of squads[squad].entries()){if(!deploy(s,pad,id))throw Error('Simulation deployment failed: '+id);while(s.towers[pad].level<level){const branch=['archer','oracle'].includes(id)?'heavy':id==='dragon'||id==='cannon'?'wide':id==='blossom'?'power':id==='firefly'?'rapid':'root';if(!upgrade(s,pad,branch))throw Error('Simulation upgrade failed: '+id+' / '+branch);}}
 s.wave=wave;let steps=0;const prefs={autoSkill:true,autoBlessing:true,strategy:'balanced'};
 while(!['victory','defeat'].includes(s.phase)&&steps++<30000){if(s.phase!=='battle'){const b=selectAutoBlessing(s,prefs);if(b)chooseBlessing(s,b);if(s.blessingChoices.length)chooseBlessing(s,s.blessingChoices[0]);startWave(s);}if(shouldAutoSkill(s,prefs))castHero(s);advance(s,1/10);}
 return {difficulty,level,trained,squad,mode,startingWave:wave,result:s.phase,completed:s.phase==='defeat'?s.wave-1:s.wave,hp:s.hp,time:Math.round(s.time)};
}
for(const difficulty of [1,2,3])for(const level of [1,3,5])console.log(JSON.stringify(run({difficulty,level})));
for(const wave of [19,59,98])console.log(JSON.stringify(run({difficulty:0,level:10,trained:true,squad:'mixed',mode:'endless',wave})));
// This is fixed-placement simulation evidence, not human-play or economy acceptance.
function economyRun(difficulty){
 const s=createBattle({hero:'hope',loadout:['archer','cannon','frost'],dungeon:{type:'training',difficulty}}),prefs={autoSkill:true,autoBlessing:true,strategy:'balanced'};
 for(const [pad,id] of [[4,'archer'],[3,'cannon'],[5,'frost']])deploy(s,pad,id);
 let steps=0;
 while(!['victory','defeat'].includes(s.phase)&&steps++<18000){
  if(s.phase!=='battle'){
   for(const t of s.towers.slice().sort((a,b)=>a.level-b.level))upgrade(s,t.pad,t.role==='archer'?'heavy':t.role==='cannon'?'wide':'root');
   const b=selectAutoBlessing(s,prefs);if(b)chooseBlessing(s,b);if(s.blessingChoices.length)chooseBlessing(s,s.blessingChoices[0]);startWave(s);
  }
  if(shouldAutoSkill(s,prefs))castHero(s);advance(s,.1);
 }
 return {kind:'real-budget',difficulty,result:s.phase,hp:s.hp,wave:s.wave,gold:s.gold,time:Math.round(s.time),troops:s.towers.map(t=>({role:t.role,level:t.level}))};
}
for(const difficulty of [1,2,3])console.log(JSON.stringify(economyRun(difficulty)));
