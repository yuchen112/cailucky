// Per-unit motion data, not CSS illustration. All times use the battle clock.
export const TROOP_ANIMATIONS={
 archer:{pull:2,recoil:-3,tilt:.035,idle:2.1},cannon:{pull:3,recoil:-6,tilt:.065,idle:1.7},
 frost:{pull:1,recoil:1,lift:2.2,tilt:.035,idle:1.9},firefly:{pull:2,recoil:-2,lift:1.2,tilt:.045,idle:3},
 crystal:{pull:3,recoil:3,tilt:.075,idle:1.6},chime:{pull:1,recoil:1,lift:1.5,tilt:.06,idle:2.3},
 blossom:{pull:1,recoil:2,lift:1.7,tilt:.04,idle:2},clockwork:{pull:3,recoil:-5,tilt:.055,idle:2.8},
 alchemist:{pull:2,recoil:-3,tilt:.05,idle:2.2},vine:{pull:1,recoil:2,lift:1,tilt:.065,idle:1.8},
 oracle:{pull:1,recoil:0,lift:2.5,tilt:.025,idle:1.5},dragon:{pull:4,recoil:3,lift:1,tilt:.055,idle:1.4},
 scout:{pull:2,recoil:-2,tilt:.05,idle:2.7},warden:{pull:3,recoil:2,tilt:.07,idle:1.4},
 storm:{pull:1,recoil:2,lift:3,tilt:.055,idle:2.4},bramble:{pull:2,recoil:2,lift:1.4,tilt:.04,idle:1.7},
 artisan:{pull:1,recoil:1,lift:1,tilt:.045,idle:2.2}
};
export function unitMotion(a,t,time){
 const p=TROOP_ANIMATIONS[t.role],k=a.progress,smooth=k*k*(3-2*k),pulse=Math.sin(Math.PI*k);
 if(a.phase==='windup')return {x:-p.pull*smooth,y:0,angle:-p.tilt*smooth,sx:1,sy:1-.025*smooth};
 if(['release','recover'].includes(a.phase))return {x:p.recoil*pulse,y:-(p.lift||0)*pulse,angle:p.tilt*pulse,sx:1,sy:1+.015*pulse};
 return {x:0,y:0,angle:Math.sin(time*p.idle+(t.pad||0))*.004,sx:1,sy:1+Math.sin(time*p.idle+(t.pad||0))*.007};
}
