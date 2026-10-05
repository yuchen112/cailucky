import {ENEMY_IDS} from './enemy-catalog.mjs';
import {CAMPAIGN} from './encounters.mjs?v=20261005-complete1';
import {createBattle,ROLES,UNITS,UNIT_BRANCHES,PADS,SPECIALIZATIONS,BLESSINGS,validateProfile,upgradeCost} from './core.mjs?v=20261005-complete1';
const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function captureCheckpoint(s){
 if(!['planning','intermission'].includes(s.phase))return null;
 return {version:s.army?2:1,...(s.army?{hero:{role:s.hero.role,weaponLevel:s.hero.weaponLevel??0,x:s.hero.x,y:s.hero.y,masteryXp:s.hero.masteryXp,specialization:s.hero.specialization,talents:{...s.hero.talents}},loadout:[...s.loadout],training:{...s.training}}:{}),stageId:s.army&&s.mode==='campaign'&&!s.dungeon?CAMPAIGN[s.stage-1]?.id:null,dungeon:s.dungeon??null,mode:s.mode,stage:s.stage,map:s.map??null,wave:s.wave,gold:s.gold,hp:s.hp,kills:s.kills,buffs:{...s.buffs},contributions:{...(s.contributions??{})},leaks:{...(s.leaks??{})},costVersion:s.costVersion??2,blessingHistory:[...(s.blessingHistory??[])],blessingChoices:[...s.blessingChoices],towers:s.towers.map(t=>({pad:t.pad,role:t.role,level:t.level,branch:t.branch,priority:t.priority,spent:t.spent,upgradeCosts:t.upgradeCosts??Array.from({length:t.level-1},(_,i)=>80*(i+1))}))};
}
export function restoreCheckpoint(c){
 if(c?.stageId!=null){const stage=CAMPAIGN.find(v=>v.id===c.stageId);if(!stage||c.mode!=='campaign'||c.dungeon)throw Error('戰場關卡 ID 不正確');c={...c,stage:stage.stage};}
 if(!c||![1,2].includes(c.version)||!['campaign','endless'].includes(c.mode)||!int(c.stage,1,Math.max(30,CAMPAIGN.length))||!int(c.wave,0,c.mode==='campaign'?(c.dungeon?2:c.version===2?(CAMPAIGN[c.stage-1]?.waves.length??0)-1:5):99999)||!int(c.gold,0,10000000)||!int(c.hp,1,20)||!int(c.kills,0,10000000)||!Array.isArray(c.towers)||c.towers.length>9||!c.buffs||!int(c.buffs.power,0,50000)||!int(c.buffs.reach,0,50000)||!int(c.buffs.shatter??0,0,50000)||!int(c.buffs.command??0,0,50000)||!Array.isArray(c.blessingChoices)||c.blessingChoices.length>3||new Set(c.blessingChoices).size!==c.blessingChoices.length||c.blessingChoices.some(id=>!Object.hasOwn(BLESSINGS,id)))throw Error('戰場存檔格式不正確');
 if(c.blessingChoices.length&&(c.wave===0||c.wave%2))throw Error('祝福存檔階段不正確');
 const army=c.version===2;
 if(army&&(!c.hero||!Object.hasOwn(ROLES,c.hero.role)||!Number.isFinite(c.hero.x)||!Number.isFinite(c.hero.y)||c.hero.x<30||c.hero.x>360||c.hero.y<60||c.hero.y>550))throw Error('英雄存檔不正確');
 const s=createBattle({dungeon:c.dungeon??null,mode:c.mode,stage:c.stage,map:c.map??null,...(army?{hero:c.hero.role,loadout:c.loadout,masteryXp:c.hero.masteryXp??0,specialization:c.hero.specialization??null,talents:c.hero.talents??{},training:c.training??{}}:{})}),pads=new Set(),roles=new Set(),catalog=army?UNITS:ROLES,branches=army?UNIT_BRANCHES:SPECIALIZATIONS;
 if(army){if(!int(c.hero.weaponLevel??0,0,10))throw Error('專武戰場等級不正確');Object.assign(s.hero,{x:c.hero.x,y:c.hero.y,weaponLevel:c.hero.weaponLevel??0});}
 s.towers=c.towers.map(t=>{
  if(!t||!int(t.pad,0,PADS.length-1)||!Object.hasOwn(catalog,t.role)||pads.has(t.pad)||(!army&&roles.has(t.role))||(army&&!s.loadout.includes(t.role))||!int(t.level,1,army?10:5)||!['first','strong','armor'].includes(t.priority))throw Error('角色存檔格式不正確');
  if(t.level<3?t.branch!==null:!branches[t.role].some(p=>p.id===t.branch))throw Error('專精存檔不正確');
  const costs=t.upgradeCosts??Array.from({length:t.level-1},(_,i)=>80*(i+1));if(!Array.isArray(costs)||costs.length!==t.level-1||costs.some((n,i)=>n!==80*(i+1)&&n!==upgradeCost({...t,level:i+1})))throw Error('升級費用歷史不正確');const expected=catalog[t.role].cost+costs.reduce((a,b)=>a+b,0);if(t.spent!==expected)throw Error('升級費用存檔不正確');t={...t,upgradeCosts:[...costs]};
  pads.add(t.pad);roles.add(t.role);return {...t,id:s.nextId++,ready:.2,attacks:0};
 });
 const history=c.blessingHistory??Object.entries(c.buffs).flatMap(([id,n])=>Object.hasOwn(BLESSINGS,id)?Array(n).fill(id):[]);if(!Array.isArray(history)||history.length>50000||history.some(id=>!Object.hasOwn(BLESSINGS,id)))throw Error('祝福紀錄不正確');
 for(const [key,max] of [['contributions',1000000000],['leaks',1000000]]){const data=c[key]??{};if(typeof data!=='object'||Array.isArray(data)||Object.entries(data).some(([id,n])=>!Number.isFinite(n)||n<0||n>max||(key==='contributions'?!['hero','retired',...Object.keys(UNITS)].includes(id):!ENEMY_IDS.includes(id))))throw Error('戰績紀錄不正確');s[key]={...data};}
 Object.assign(s,{costVersion:c.costVersion??1,blessingHistory:[...history],wave:c.wave,gold:c.gold,hp:c.hp,kills:c.kills,buffs:{...c.buffs},blessingChoices:[...c.blessingChoices],phase:c.wave?'intermission':'planning'});return s;
}
export function decodeSave(raw){
 const v=typeof raw==='string'?JSON.parse(raw):raw;
 if(v?.version===1)return {version:2,profile:validateProfile(v),checkpoint:null};
 if(v?.version!==2)throw Error('不支援的存檔版本');
 if(v.checkpoint?.version===2)throw Error('英雄戰役請使用新版存檔介面，不能匯入舊預覽');
 const profile=validateProfile(v.profile);const checkpoint=v.checkpoint==null?null:captureCheckpoint(restoreCheckpoint(v.checkpoint));
 if(checkpoint?.mode==='campaign'&&checkpoint.stage>profile.unlockedStage)throw Error('存檔關卡超過已開放進度');
 return {version:2,profile,checkpoint};
}
