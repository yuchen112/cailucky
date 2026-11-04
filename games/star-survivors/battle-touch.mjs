// A floating joystick measures displacement from the first finger's fixed origin.
// Camera/player motion never changes that origin or the resulting movement vector.
export function touchVector(point,origin,{radius=44,deadzone=5}={}){
 if(!point||!origin)return{x:0,y:0};
 const dx=point.x-origin.x,dy=point.y-origin.y,d=Math.hypot(dx,dy);
 if(d<=deadzone)return{x:0,y:0};
 const magnitude=Math.min(1,(d-deadzone)/Math.max(1,radius-deadzone));
 return{x:dx/d*magnitude,y:dy/d*magnitude};
}
export function bindBattleTouch(canvas,{isPlaying,base,thumb=base?.lastElementChild,radius=44,deadzone=5,onFirstMove=()=>{}}){
 let pointer=null,point=null,origin=null;
 function paint(){if(!base||!origin)return;base.hidden=false;base.style.left=origin.x+'px';base.style.top=origin.y+'px';const dx=point.x-origin.x,dy=point.y-origin.y,d=Math.hypot(dx,dy)||1,clamp=Math.min(1,radius/d);if(thumb)thumb.style.transform=`translate(${dx*clamp}px,${dy*clamp}px)`}
 function reset(){const old=pointer;pointer=null;point=null;origin=null;if(base)base.hidden=true;if(thumb)thumb.style.transform='translate(0,0)';if(old!==null&&canvas.hasPointerCapture?.(old))canvas.releasePointerCapture(old)}
 canvas.addEventListener('pointerdown',e=>{if(!isPlaying()||pointer!==null||e.button>0||e.pointerType==='mouse')return;e.preventDefault();pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};point={...origin};canvas.setPointerCapture?.(e.pointerId);paint();onFirstMove()});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;if(!isPlaying()){reset();return}e.preventDefault();point={x:e.clientX,y:e.clientY};paint()});
 for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===pointer)reset()});
 if(typeof window!=='undefined')window.addEventListener('blur',reset);
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 return{reset,vector:()=>isPlaying()?touchVector(point,origin,{radius,deadzone}):{x:0,y:0},get active(){return pointer!==null},get origin(){return origin?{...origin}:null}};
}
