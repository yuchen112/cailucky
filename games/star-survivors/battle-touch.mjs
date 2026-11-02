// Screen-space steering stays under the finger while the camera follows the hero.
export function touchVector(point,player,view){
 if(!point||!player)return{x:0,y:0};
 const x=view.w/2+(player.x-view.camera.x)*view.scale;
 const y=view.h*.52+(player.y-view.camera.y)*view.scale;
 const dx=point.x-x,dy=point.y-y,d=Math.hypot(dx,dy);
 if(d<=14)return{x:0,y:0};
 const speed=Math.min(1,(d-14)/65);
 return{x:dx/d*speed,y:dy/d*speed};
}
export function bindBattleTouch(canvas,{isPlaying,marker,onFirstMove=()=>{}}){
 let pointer=null,point=null;
 function place(e){const r=canvas.getBoundingClientRect();point={x:e.clientX-r.left,y:e.clientY-r.top};if(marker){marker.hidden=false;marker.style.left=e.clientX+'px';marker.style.top=e.clientY+'px'}}
 function reset(){const old=pointer;pointer=null;point=null;if(marker)marker.hidden=true;if(old!==null&&canvas.hasPointerCapture?.(old))canvas.releasePointerCapture(old)}
 canvas.addEventListener('pointerdown',e=>{if(!isPlaying()||pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;place(e);canvas.setPointerCapture(e.pointerId);onFirstMove()});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;if(!isPlaying()){reset();return}e.preventDefault();place(e)});
 for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===pointer)reset()});
 return{reset,vector:(player,view)=>touchVector(point,player,view),get active(){return pointer!==null}};
}
