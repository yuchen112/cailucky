// Separate sources and independent expiry; crowd-control duration never multiplies.
export function addDamageStack(enemy,shot,time){
 enemy.damageStacks=(enemy.damageStacks||[]).filter(v=>v.until>time);
 const kind=shot.kind||'spore',stack={kind,source:shot.source??'retired',damage:shot.poison,until:time+3};
 const same=enemy.damageStacks.filter(v=>v.kind===kind);
 if(same.length>=3){const oldest=same.reduce((a,b)=>a.until<=b.until?a:b);enemy.damageStacks.splice(enemy.damageStacks.indexOf(oldest),1);}
 enemy.damageStacks.push(stack);enemy.poisonKind=kind;enemy.poisonUntil=time+3;
}
export function tickDamageStacks(enemy,time,dt,onDamage=null){
 enemy.damageStacks=(enemy.damageStacks||[]).filter(v=>v.until>time);
 const armor=Math.max(0,Math.min(.75,(enemy.armor||0)+(enemy.wardUntil>time?.25:0))-(enemy.shredUntil>time?enemy.shred||0:0));
 for(const v of enemy.damageStacks){const damage=v.damage*(1-armor)*dt,actual=Math.min(Math.max(0,enemy.hp),damage);enemy.hp-=damage;if(actual>0)onDamage?.(v.source??'retired',actual);}
}
