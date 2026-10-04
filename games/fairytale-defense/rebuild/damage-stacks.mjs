// Separate sources and independent expiry; crowd-control duration never multiplies.
export function addDamageStack(enemy,shot,time){
 enemy.damageStacks=(enemy.damageStacks||[]).filter(v=>v.until>time);
 const kind=shot.kind||'spore',stack={kind,damage:shot.poison,until:time+3};
 const same=enemy.damageStacks.filter(v=>v.kind===kind);
 if(same.length>=3){const oldest=same.reduce((a,b)=>a.until<=b.until?a:b);enemy.damageStacks.splice(enemy.damageStacks.indexOf(oldest),1);}
 enemy.damageStacks.push(stack);enemy.poisonKind=kind;enemy.poisonUntil=time+3;
}
export function tickDamageStacks(enemy,time,dt){
 enemy.damageStacks=(enemy.damageStacks||[]).filter(v=>v.until>time);
 const armor=Math.max(0,Math.min(.75,(enemy.armor||0)+(enemy.wardUntil>time?.25:0))-(enemy.shredUntil>time?enemy.shred||0:0));
 enemy.hp-=enemy.damageStacks.reduce((n,v)=>n+v.damage,0)*(1-armor)*dt;
}
