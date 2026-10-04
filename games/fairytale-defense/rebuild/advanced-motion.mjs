export const ADVANCED_MOTION_IDS=Object.freeze(['unit-archer-rapid-5','unit-archer-heavy-5','unit-cannon-wide-5','unit-frost-root-5','unit-archer-rapid-10']);
const available=new Set(ADVANCED_MOTION_IDS);
export const hasAdvancedMotion=id=>available.has(id);
export function advancedMotionAssets(id){return available.has(id)?[id+'-ready',id+'-release']:[];}
export function advancedMotionArt(id,phase){if(!available.has(id))return id;return phase==='windup'?id+'-ready':['release','recover'].includes(phase)?id+'-release':id;}
