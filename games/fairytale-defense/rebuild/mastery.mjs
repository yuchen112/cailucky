export const HERO_IDS=Object.freeze(['growth','dream','luck','joy','night','sadness','trust','memory','healing','hope']);
export const MASTERY_THRESHOLDS=Object.freeze([0,60,160,300,480,700,960,1260,1600,2000]);
export function masteryLevel(xp){if(!Number.isSafeInteger(xp)||xp<0)throw Error('無效熟練度');return MASTERY_THRESHOLDS.filter(n=>xp>=n).length;}
export function unlockedMastery(xp){const level=masteryLevel(xp);return {level,base:true,interaction:level>=2,specialization:level>=3,passive:level>=5,activeVariant:level>=7,ultimate:level>=10};}
export function newMastery(){return {version:1,xp:Object.fromEntries(HERO_IDS.map(id=>[id,0])),activeRun:null};}
export function validateMastery(v){
 if(v?.version!==1||!v.xp||HERO_IDS.some(id=>!Number.isSafeInteger(v.xp[id])||v.xp[id]<0||v.xp[id]>10000000))throw Error('熟練度存檔不正確');
 const r=v.activeRun;
 if(r!==null&&(!r||typeof r.id!=='string'||!r.id.length||r.id.length>100||!HERO_IDS.includes(r.hero)||!Number.isSafeInteger(r.claimed)||r.claimed<0||r.claimed>100000))throw Error('熟練度戰役紀錄不正確');
 return {version:1,xp:Object.fromEntries(HERO_IDS.map(id=>[id,v.xp[id]])),activeRun:r?{id:r.id,hero:r.hero,claimed:r.claimed}:null};
}
// Caller persists this with the battle boundary in ONE save envelope, never separately.
export function beginMasteryRun(profile,id,hero){const p=validateMastery(profile);if(typeof id!=='string'||!id.length||id.length>100||!HERO_IDS.includes(hero)||id===p.activeRun?.id)throw Error('無效新戰役');p.activeRun={id,hero,claimed:0};return p;}
export function awardCompletedWaves(profile,id,completed,{practice=false}={}){
 const p=validateMastery(profile),r=p.activeRun;
 if(!r||r.id!==id||!Number.isSafeInteger(completed)||completed<0||completed>100000)throw Error('戰役獎勵不符');
 if(practice||completed<=r.claimed)return p;
 p.xp[r.hero]=Math.min(10000000,p.xp[r.hero]+(completed-r.claimed)*10);r.claimed=completed;return p;
}
