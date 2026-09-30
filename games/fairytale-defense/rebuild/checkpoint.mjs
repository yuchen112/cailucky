import {createBattle,ROLES,UNITS,UNIT_BRANCHES,PADS,SPECIALIZATIONS,BLESSINGS,validateProfile} from './core.mjs';
const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function captureCheckpoint(s){
 if(!['planning','intermission'].includes(s.phase))return null;
 return {version:s.army?2:1,...(s.army?{hero:{role:s.hero.role,x:s.hero.x,y:s.hero.y,masteryXp:s.hero.masteryXp,specialization:s.hero.specialization,talents:{...s.hero.talents}},loadout:[...s.loadout]}:{}),mode:s.mode,stage:s.stage,wave:s.wave,gold:s.gold,hp:s.hp,kills:s.kills,buffs:{...s.buffs},blessingChoices:[...s.blessingChoices],towers:s.towers.map(t=>({pad:t.pad,role:t.role,level:t.level,branch:t.branch,priority:t.priority,spent:t.spent}))};
}
export function restoreCheckpoint(c){
 if(!c||![1,2].includes(c.version)||!['campaign','endless'].includes(c.mode)||!int(c.stage,1,30)||!int(c.wave,0,c.mode==='campaign'?5:99999)||!int(c.gold,0,10000000)||!int(c.hp,1,20)||!int(c.kills,0,10000000)||!Array.isArray(c.towers)||c.towers.length>9||!c.buffs||!int(c.buffs.power,0,50000)||!int(c.buffs.reach,0,50000)||!Array.isArray(c.blessingChoices)||c.blessingChoices.length>3||new Set(c.blessingChoices).size!==c.blessingChoices.length||c.blessingChoices.some(id=>!Object.hasOwn(BLESSINGS,id)))throw Error('戰場存檔格式不正確');
 if(c.blessingChoices.length&&(c.wave===0||c.wave%2))throw Error('祝福存檔階段不正確');
 const army=c.version===2;
 if(army&&(!c.hero||!Object.hasOwn(ROLES,c.hero.role)||!Number.isFinite(c.hero.x)||!Number.isFinite(c.hero.y)||c.hero.x<30||c.hero.x>360||c.hero.y<60||c.hero.y>500))throw Error('英雄存檔不正確');
 const s=createBattle({mode:c.mode,stage:c.stage,...(army?{hero:c.hero.role,loadout:c.loadout,masteryXp:c.hero.masteryXp??0,specialization:c.hero.specialization??null,talents:c.hero.talents??{}}:{})}),pads=new Set(),roles=new Set(),catalog=army?UNITS:ROLES,branches=army?UNIT_BRANCHES:SPECIALIZATIONS;
 if(army)Object.assign(s.hero,{x:c.hero.x,y:c.hero.y});
 s.towers=c.towers.map(t=>{
  if(!t||!int(t.pad,0,PADS.length-1)||!Object.hasOwn(catalog,t.role)||pads.has(t.pad)||(!army&&roles.has(t.role))||(army&&!s.loadout.includes(t.role))||!int(t.level,1,5)||!['first','strong','armor'].includes(t.priority))throw Error('角色存檔格式不正確');
  if(t.level<3?t.branch!==null:!branches[t.role].some(p=>p.id===t.branch))throw Error('專精存檔不正確');
  if(t.spent!==catalog[t.role].cost+40*t.level*(t.level-1))throw Error('升級費用存檔不正確');
  pads.add(t.pad);roles.add(t.role);return {...t,id:s.nextId++,ready:.2,attacks:0};
 });
 Object.assign(s,{wave:c.wave,gold:c.gold,hp:c.hp,kills:c.kills,buffs:{...c.buffs},blessingChoices:[...c.blessingChoices],phase:c.wave?'intermission':'planning'});return s;
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
