import {HERO_IDS} from './mastery.mjs?v=20261005-complete1';
import {heroBuild} from './hero-rules.mjs?v=20261005-complete1';

// All configurations live in the same atomic envelope as XP and backups.
export function validateCommanderConfigs(raw,mastery,checkpoint=null){
 if(raw!=null&&(typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(id=>!HERO_IDS.includes(id))))throw Error('英雄配置存檔不正確');
 return Object.fromEntries(HERO_IDS.map(id=>{
  const saved=raw?.[id]??(checkpoint?.hero?.role===id?checkpoint.hero:null);
  if(saved!=null&&(typeof saved!=='object'||Array.isArray(saved)))throw Error('英雄配置內容不正確');
  const build=heroBuild(id,mastery.xp[id],saved?.specialization??null,saved?.talents??{});
  return [id,{specialization:build.specialization,talents:build.talents}];
 }));
}
export function rememberCommander(save,id,specialization,talents){
 const build=heroBuild(id,save.mastery.xp[id],specialization,talents);
 return {...save,commanders:{...validateCommanderConfigs(save.commanders,save.mastery,save.checkpoint),[id]:{specialization:build.specialization,talents:build.talents}}};
}
