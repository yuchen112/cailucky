const available=new Set(['unit-archer-rapid-5']);
export function advancedMotionAssets(id){return available.has(id)?[id+'-ready',id+'-release']:[];}
export function advancedMotionArt(id,phase){if(!available.has(id))return id;return phase==='windup'?id+'-ready':['release','recover'].includes(phase)?id+'-release':id;}
