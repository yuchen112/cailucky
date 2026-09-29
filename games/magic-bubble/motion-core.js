(function(root){
 'use strict';
 const clamp=t=>Math.max(0,Math.min(1,t));
 function popDelay(origin,point,reduced=false){
  return reduced?0:100+Math.min(140,Math.hypot(point.x-origin.x,point.y-origin.y)*.3);
 }
 function lifetime(effect,reduced=false){return reduced?100:effect.fall?680:380;}
 // Pure projections: time is supplied by the paused game clock, never wall time.
 function sample(effect,clock,reduced=false){
  const age=clock-effect.born,life=lifetime(effect,reduced),t=clamp(age/life);
  if(age<0)return {x:effect.x,y:effect.y,scale:1,alpha:1,angle:0,burst:0,done:false};
  if(reduced)return {x:effect.x,y:effect.y,scale:1,alpha:1-t,angle:0,burst:0,done:t===1};
  if(effect.fall){
   const direction=effect.x<360?-1:1;
   return {x:effect.x+direction*28*t*t,y:effect.y+360*t*t,scale:1,alpha:1-clamp((t-.65)/.35),angle:direction*t*.45,burst:0,done:t===1};
  }
  return {x:effect.x,y:effect.y,scale:1+.12*Math.sin(Math.PI*clamp(t/.32)),alpha:1-clamp((t-.2)/.25),angle:0,burst:clamp((t-.18)/.2)*(1-clamp((t-.5)/.5)),burstScale:.65+t,done:t===1};
 }
 function dock(from,to,age,reduced=false){
  const t=reduced?1:clamp(age/160),ease=1-Math.pow(1-t,3);
  return {x:from.x+(to.x-from.x)*ease,y:from.y+(to.y-from.y)*ease,scale:1+.065*Math.sin(Math.PI*t),done:t===1};
 }
 const api={popDelay,lifetime,sample,dock};
 if(typeof module!=='undefined')module.exports=api;else root.BubbleMotion=api;
})(globalThis);
