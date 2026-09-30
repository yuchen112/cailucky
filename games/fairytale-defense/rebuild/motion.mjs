// Presentation only: simulation time freezes these animations when paused.
export const SPELL_ART={seed:'seed',star:'fx-star',clover:'fx-clover',spark:'fx-spark',moon:'fx-moon',rain:'fx-rain',rune:'fx-rune',echo:'fx-echo',petal:'fx-petal',light:'fx-light'};
export function actorMotion(state,{hero=false,pad=null},reduced=false){
 if(reduced)return {angle:0,offset:0};
 const e=state.events.findLast(e=>(e.type==='anticipate'||e.type==='release'||e.type==='hero-skill')&&!!e.hero===hero&&(hero||e.pad===pad));
 if(!e)return {angle:0,offset:0};const age=state.time-e.time;
 if(e.type==='anticipate'&&age<.22){const p=Math.sin(age/.22*Math.PI/2);return {angle:-.12*p,offset:-3*p};}
 if(e.type==='release'&&age<.32){const p=Math.sin(age/.32*Math.PI);return {angle:.16*p,offset:4*p};}
 return {angle:0,offset:0};
}
export function projectilePose(shot,target,time,reduced=false){const p=Math.max(0,Math.min(1,(time-shot.born)/(shot.arriveAt-shot.born))),x=shot.from.x+(target.x-shot.from.x)*p,y=shot.from.y-30+(target.y-shot.from.y+30)*p;
 return {x,y:y-(reduced?0:Math.sin(p*Math.PI)*(shot.kind==='spore'?35:10)),angle:Math.atan2(target.y-shot.from.y+30,target.x-shot.from.x),progress:p};
}
