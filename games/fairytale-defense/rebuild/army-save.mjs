import {STARTER_UNITS,validateLoadout} from './army.mjs?v=20261004-army3';
import {alignCommander} from './routes.mjs?v=20261004-army3';
import {captureCheckpoint,restoreCheckpoint} from './checkpoint.mjs?v=20261004-army3';
import {newMastery,validateMastery,beginMasteryRun,awardCompletedWaves} from './mastery.mjs?v=20261004-army3';
import {createBattle} from './core.mjs?v=20261004-army3';
import {newCollection,validateCollection,rewardCollection,trainingRanks} from './recruitment.mjs?v=20261004-army3';
// Separate envelope from the legacy preview. Persist one JSON value atomically.
export function newArmySave(){return {version:3,mastery:newMastery(),collection:newCollection(),campaign:{unlocked:1,cleared:[]},loadout:[...STARTER_UNITS],formations:[],endless:{forest:0,moon:0,dawn:0,ruins:0},checkpoint:null};}
// UI entry point: XP is read only from the saved profile, never from a form field.
export function prepareArmyExpedition(save,{hero,stage=1,mode='campaign',loadout,specialization=null,talents={},map=null},runId){
 const profile=decodeArmySave(save);
 loadout=loadout??profile.loadout;if(loadout.some(id=>!profile.collection.owned.includes(id)))throw Error('編隊包含未取得兵種');
 const battle=createBattle({hero,stage,mode,map,loadout,specialization,talents,masteryXp:profile.mastery.xp[hero],training:trainingRanks(profile.collection)});
 if(!battle.army)throw Error('請選擇一位英雄');alignCommander(battle);
 return {battle,save:beginArmySave(profile,battle,runId)};
}
export function beginArmySave(save,battle,runId){
 const old=decodeArmySave(save);if(!battle.army||battle.phase!=='planning')throw Error('需要新英雄戰役');
 if(battle.hero.masteryXp>old.mastery.xp[battle.hero.role])throw Error('英雄熟練度超出已取得進度');
 if(battle.mode==='campaign'&&battle.stage>old.campaign.unlocked)throw Error('關卡尚未開放');
 return {...old,mastery:beginMasteryRun(old.mastery,runId,battle.hero.role),checkpoint:captureCheckpoint(battle)};
}
export function settleArmySave(save,battle,runId,{practice=false}={}){
 const old=decodeArmySave(save),active=old.mastery.activeRun;
 if(!battle.army||active?.hero!==battle.hero.role||!['planning','intermission','victory','defeat'].includes(battle.phase))throw Error('尚未抵達結算邊界');
 const completed=battle.phase==='defeat'?Math.max(0,battle.wave-1):battle.wave;
 const mastery=awardCompletedWaves(old.mastery,runId,completed,{practice});
 const campaign={unlocked:old.campaign.unlocked,cleared:[...old.campaign.cleared]};
 if(!practice&&battle.mode==='campaign'&&battle.phase==='victory'){
   if(battle.wave!==battle.maxWaves||battle.stage>campaign.unlocked)throw Error('通關紀錄不正確');
   if(!campaign.cleared.includes(battle.stage))campaign.cleared.push(battle.stage);
   campaign.cleared.sort((a,b)=>a-b);campaign.unlocked=Math.min(15,Math.max(campaign.unlocked,battle.stage+1));
 }
 const collection=rewardCollection(old.collection,{waves:practice?0:Math.max(0,completed-active.claimed),firstClearStage:!practice&&battle.phase==='victory'&&!old.campaign.cleared.includes(battle.stage)&&battle.mode==='campaign'?battle.stage:0});
 const endless={...old.endless};if(battle.mode==='endless'&&!practice)endless[battle.map||'forest']=Math.max(endless[battle.map||'forest'],completed);
 return {...old,mastery,campaign,collection,endless,checkpoint:captureCheckpoint(battle)};
}
export function decodeArmySave(raw){
 const v=typeof raw==='string'?JSON.parse(raw):raw;
 if(v?.version!==3)throw Error('不是英雄戰役存檔');
 const mastery=validateMastery(v.mastery);
 const campaign=v.campaign??{unlocked:1,cleared:[]};
 if(!Number.isSafeInteger(campaign.unlocked)||campaign.unlocked<1||campaign.unlocked>15||!Array.isArray(campaign.cleared)||campaign.cleared.length>15||new Set(campaign.cleared).size!==campaign.cleared.length||campaign.cleared.some(n=>!Number.isInteger(n)||n<1||n>15)||Array.from({length:campaign.unlocked-1},(_,i)=>i+1).some(n=>!campaign.cleared.includes(n))||campaign.cleared.some(n=>n>=campaign.unlocked&&!(n===15&&campaign.unlocked===15)))throw Error('主線進度不正確');
 if(v.checkpoint!=null&&(v.checkpoint.version!==2||v.checkpoint.hero?.role!==mastery.activeRun?.hero))throw Error('英雄與戰役紀錄不一致');
 const checkpoint=v.checkpoint==null?null:captureCheckpoint(restoreCheckpoint(v.checkpoint));
 if(checkpoint&&checkpoint.hero.masteryXp>mastery.xp[checkpoint.hero.role])throw Error('英雄熟練度與存檔不一致');
 if(checkpoint?.mode==='campaign'&&checkpoint.stage>campaign.unlocked)throw Error('存檔超過已開放關卡');
 const collection=validateCollection(v.collection),ranks=trainingRanks(collection);if(checkpoint&&Object.entries(checkpoint.training||{}).some(([id,n])=>n>(ranks[id]||0)))throw Error('部隊訓練與存檔不一致');
 const loadout=validateLoadout(v.loadout??(v.collection?.version===1?['archer','cannon','frost','firefly']:STARTER_UNITS));if(loadout.some(id=>!collection.owned.includes(id)))throw Error('編隊兵種尚未解鎖');
 const endless=v.endless??{forest:0,moon:0,dawn:0,ruins:0};if(['forest','moon','dawn','ruins'].some(id=>!Number.isSafeInteger(endless[id])||endless[id]<0||endless[id]>99999))throw Error('無盡紀錄不正確');
 const formations=v.formations??[];if(!Array.isArray(formations)||formations.length>3)throw Error('常用編隊不正確');for(const f of formations){validateLoadout(f);if(f.some(id=>!collection.owned.includes(id)))throw Error('常用編隊包含未取得兵種');}
 return {version:3,mastery,collection,loadout,formations:formations.map(f=>[...f]),endless:{...endless},campaign:{unlocked:campaign.unlocked,cleared:[...campaign.cleared].sort((a,b)=>a-b)},checkpoint};
}
