import {validateAssists} from './assists.mjs';
import {validateWeapons,validateWeaponReceipt,awardWeapon,weaponLevel,HERO_CAP,WEAPON_DROP_CHANCE} from './hero-weapons.mjs';
import {awardEndless,validateRewardLedger} from './endless-rewards.mjs?v=20261005-complete1';
import {validateBooks,validateBookInventory} from './training-books.mjs?v=20261005-complete1';
import {validateCampaignProgress} from './campaign-progress.mjs?v=20261005-complete1';
import {CAMPAIGN} from './encounters.mjs?v=20261005-complete1';
import {validateDungeon,dungeonReward} from './dungeons.mjs?v=20261005-complete1';
import {STARTER_UNITS,validateLoadout} from './army.mjs?v=20261005-complete1';
import {validateCommanderConfigs,rememberCommander} from './commander-config.mjs?v=20261005-complete1';
import {alignCommander} from './routes.mjs?v=20261005-complete1';
import {captureCheckpoint,restoreCheckpoint} from './checkpoint.mjs?v=20261005-complete1';
import {newMastery,validateMastery,beginMasteryRun,awardCompletedWaves} from './mastery.mjs?v=20261005-complete1';
import {createBattle} from './core.mjs?v=20261005-complete1';
import {newCollection,validateCollection,rewardCollection,trainingRanks} from './recruitment.mjs?v=20261005-complete1';
// Separate envelope from the legacy preview. Persist one JSON value atomically.
export function newArmySave(){return {version:3,books:0,bookInventory:validateBookInventory(),weapons:validateWeapons(),assists:validateAssists(),mastery:newMastery(),collection:newCollection(),campaign:{unlocked:1,cleared:[]},loadout:[...STARTER_UNITS],formations:[],endless:{forest:0,moon:0,dawn:0,ruins:0},checkpoint:null};}
// UI entry point: XP is read only from the saved profile, never from a form field.
export function prepareArmyExpedition(save,{hero,dungeon=null,stage=1,mode='campaign',loadout,specialization=null,talents={},map=null},runId){
 const profile=decodeArmySave(save);
 loadout=loadout??profile.loadout;if(loadout.some(id=>!profile.collection.owned.includes(id)))throw Error('編隊包含未取得兵種');
 const battle=createBattle({hero,dungeon,stage,mode,map,loadout,specialization,talents,masteryXp:profile.mastery.xp[hero],training:trainingRanks(profile.collection)});
 if(!battle.army)throw Error('請選擇一位英雄');battle.hero.weaponLevel=profile.weapons[hero].unlocked?weaponLevel(profile.weapons[hero].xp):0;alignCommander(battle);
 return {battle,save:beginArmySave(rememberCommander(profile,hero,specialization,talents),battle,runId)};
}
export function beginArmySave(save,battle,runId){
 const old=decodeArmySave(save);if(!battle.army||battle.phase!=='planning')throw Error('需要新英雄戰役');
 if(battle.hero.masteryXp>old.mastery.xp[battle.hero.role])throw Error('英雄熟練度超出已取得進度');
 if(!battle.dungeon&&battle.mode==='campaign'&&battle.stage>old.campaign.unlocked&&!old.campaign.cleared.includes(battle.stage))throw Error('關卡尚未開放');
 return {...old,dungeonRun:battle.dungeon?{id:runId,...battle.dungeon,claimed:false}:null,mastery:beginMasteryRun(old.mastery,runId,battle.hero.role),checkpoint:captureCheckpoint(battle)};
}
export function settleArmySave(save,battle,runId,{practice=false,random=Math.random}={}){
 const old=decodeArmySave(save),active=old.mastery.activeRun;
 if(!battle.army||active?.hero!==battle.hero.role||!['planning','intermission','victory','defeat'].includes(battle.phase))throw Error('尚未抵達結算邊界');
 const completed=battle.phase==='defeat'?Math.max(0,battle.wave-1):battle.wave;
 const mastery=awardCompletedWaves(old.mastery,runId,completed,{practice});
 let weapons=old.weapons,weaponReceipt=null;
 const eligible=!practice&&battle.dungeon?.type==='mastery'&&battle.dungeon?.difficulty===3;
 let overflow=eligible?Math.max(0,mastery.xp[battle.hero.role]-Math.max(HERO_CAP,old.mastery.xp[battle.hero.role])):0;
 mastery.xp[battle.hero.role]=Math.min(Math.max(HERO_CAP,old.mastery.xp[battle.hero.role]),mastery.xp[battle.hero.role]);
 const campaign={unlocked:old.campaign.unlocked,cleared:[...old.campaign.cleared]};
 if(!practice&&!battle.dungeon&&battle.mode==='campaign'&&battle.phase==='victory'){
   if(battle.wave!==battle.maxWaves||battle.stage>campaign.unlocked&&!campaign.cleared.includes(battle.stage))throw Error('通關紀錄不正確');
   if(!campaign.cleared.includes(battle.stage))campaign.cleared.push(battle.stage);
   campaign.cleared.sort((a,b)=>a-b);campaign.unlocked=Math.min(CAMPAIGN.length,Math.max(campaign.unlocked,battle.stage+1));
 }
 const collection=rewardCollection(old.collection,{waves:practice||battle.mode==='endless'?0:Math.max(0,completed-active.claimed),firstClearStage:!practice&&!battle.dungeon&&battle.phase==='victory'&&!old.campaign.cleared.includes(battle.stage)&&battle.mode==='campaign'?battle.stage:0});
 let books=old.books,rewardLedger=old.rewardLedger;
 if(!practice&&!battle.dungeon&&battle.mode==='campaign'&&battle.phase==='victory'&&completed>active.claimed)books=Math.min(100000000,books+(old.campaign.cleared.includes(battle.stage)?1:3));
 if(!practice&&battle.mode==='endless'){const payout=awardEndless(rewardLedger,Math.min(99,active.claimed),Math.min(99,completed),Date.now(),battle.map||'forest');rewardLedger=payout.ledger;books=Math.min(100000000,books+payout.reward.books);collection.coins=Math.min(100000000,collection.coins+payout.reward.coins);}
 const endless={...old.endless};if(battle.mode==='endless'&&!practice)endless[battle.map||'forest']=Math.max(endless[battle.map||'forest'],completed);
 let dungeonRun=old.dungeonRun??null;if(!practice&&battle.dungeon&&battle.phase==='victory'&&dungeonRun&&!dungeonRun.claimed){if(dungeonRun.id!==runId||dungeonRun.type!==battle.dungeon.type||dungeonRun.difficulty!==battle.dungeon.difficulty||completed!==3||battle.maxWaves!==3)throw Error('副本獎勵不符');const reward=dungeonReward(battle.dungeon);collection.coins=Math.min(100000000,collection.coins+reward.coins);const total=mastery.xp[battle.hero.role]+reward.xp;if(eligible)overflow+=Math.max(0,total-Math.max(HERO_CAP,old.mastery.xp[battle.hero.role]));mastery.xp[battle.hero.role]=Math.min(Math.max(HERO_CAP,old.mastery.xp[battle.hero.role]),total);if(eligible){const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('掉落判定不正確');const result=awardWeapon(weapons,battle.hero.role,{overflow,drop:roll<WEAPON_DROP_CHANCE});weapons=result.weapons;weaponReceipt=result.receipt;overflow=0;}books=Math.min(100000000,books+reward.books);dungeonRun={...dungeonRun,claimed:true};}
 if(eligible&&overflow){const result=awardWeapon(weapons,battle.hero.role,{overflow});weapons=result.weapons;weaponReceipt=result.receipt;}
 return {...old,weapons,weaponReceipt:weaponReceipt??old.weaponReceipt,books,bookInventory:{...old.bookInventory,common:books},rewardLedger,dungeonRun,mastery,campaign:validateCampaignProgress({clearedIds:campaign.cleared.map(n=>CAMPAIGN[n-1].id)}),collection,endless,checkpoint:captureCheckpoint(battle)};
}
export function decodeArmySave(raw){
 const v=typeof raw==='string'?JSON.parse(raw):raw;
 if(v?.version!==3)throw Error('不是英雄戰役存檔');
 const mastery=validateMastery(v.mastery);
 const campaign=validateCampaignProgress(v.campaign??{unlocked:1,cleared:[]});
 if(v.checkpoint!=null&&(v.checkpoint.version!==2||v.checkpoint.hero?.role!==mastery.activeRun?.hero))throw Error('英雄與戰役紀錄不一致');
 const checkpoint=v.checkpoint==null?null:captureCheckpoint(restoreCheckpoint(v.checkpoint));
 if(checkpoint&&checkpoint.hero.masteryXp>mastery.xp[checkpoint.hero.role])throw Error('英雄熟練度與存檔不一致');
 if(!checkpoint?.dungeon&&checkpoint?.mode==='campaign'&&checkpoint.stage>campaign.unlocked&&!campaign.cleared.includes(checkpoint.stage))throw Error('存檔超過已開放關卡');
 const weapons=validateWeapons(v.weapons);if(checkpoint&&(checkpoint.hero.weaponLevel??0)>(weapons[checkpoint.hero.role].unlocked?weaponLevel(weapons[checkpoint.hero.role].xp):0))throw Error('專武戰場與養成不一致');
 const collection=validateCollection(v.collection),ranks=trainingRanks(collection);if(checkpoint&&Object.entries(checkpoint.training||{}).some(([id,n])=>n>(ranks[id]||0)))throw Error('部隊訓練與存檔不一致');
 const loadout=validateLoadout(v.loadout??(v.collection?.version===1?['archer','cannon','frost','firefly']:STARTER_UNITS));if(loadout.some(id=>!collection.owned.includes(id)))throw Error('編隊兵種尚未解鎖');
 const endless=v.endless??{forest:0,moon:0,dawn:0,ruins:0};if(['forest','moon','dawn','ruins'].some(id=>!Number.isSafeInteger(endless[id])||endless[id]<0||endless[id]>99999))throw Error('無盡紀錄不正確');
 const formations=v.formations??[];if(!Array.isArray(formations)||formations.length>3)throw Error('常用編隊不正確');for(const f of formations){validateLoadout(f);if(f.some(id=>!collection.owned.includes(id)))throw Error('常用編隊包含未取得兵種');}
 const dungeonRun=v.dungeonRun??null;if(dungeonRun){validateDungeon(dungeonRun);if(dungeonRun.id!==mastery.activeRun?.id||typeof dungeonRun.claimed!=='boolean')throw Error('副本結算紀錄不正確');}
 if(checkpoint?.dungeon&&(!dungeonRun||checkpoint.dungeon.type!==dungeonRun.type||checkpoint.dungeon.difficulty!==dungeonRun.difficulty||dungeonRun.claimed))throw Error('副本戰場與紀錄不一致');
 const commanders=validateCommanderConfigs(v.commanders,mastery,checkpoint);
 return {version:3,assists:validateAssists(v.assists),weapons:validateWeapons(v.weapons),weaponReceipt:validateWeaponReceipt(v.weaponReceipt),books:validateBookInventory(v.bookInventory,v.books).common,bookInventory:validateBookInventory(v.bookInventory,v.books),rewardLedger:validateRewardLedger(v.rewardLedger,checkpoint?.mode==='endless'?checkpoint.map||'forest':'forest'),dungeonRun,mastery,commanders,collection,loadout,formations:formations.map(f=>[...f]),endless:{...endless},campaign:validateCampaignProgress(campaign),checkpoint};
}
