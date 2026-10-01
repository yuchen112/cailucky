// Real-time accumulation feeds identical fixed simulation ticks at every speed.
export function createBattleClock(step=1/60){
 let remainder=0,speed=1;
 return {get speed(){return speed;},setSpeed(next){if(![1,2,3].includes(next))throw Error('無效倍速');speed=next;},reset(){remainder=0;speed=1;},
 tick(elapsed,paused,advance){if(paused||!Number.isFinite(elapsed)||elapsed<0||elapsed>.25){remainder=0;return 0;}remainder+=elapsed*speed;let count=0;while(remainder+1e-10>=step){if(advance(step)===false){remainder=0;break;}remainder=Math.max(0,remainder-step);count++;}return count;}};
}
