import {actorFrame} from './animation-assets.mjs?v=5.5';
const victoryCache=new Map();
async function victoryFrames(roleId){
 if(!victoryCache.has(roleId)){
  victoryCache.set(roleId,Promise.all(Array.from({length:6},(_,index)=>new Promise((resolve,reject)=>{
   const frame=new Image();frame.onload=()=>resolve(frame);frame.onerror=()=>reject(new Error('慶祝動作載入失敗'));
   frame.src='art/v12/victory/'+roleId+'-'+index+'.webp?v=6.12';
  }))).catch(error=>{victoryCache.delete(roleId);throw error}));
 }
 return victoryCache.get(roleId);
}
export function playOutcomeMotion(image,roleId,won,images){
 let stopped=false,frameRequest=null;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const load=won?victoryFrames(roleId):Promise.resolve([0,.99].map(progress=>actorFrame(images,'roles',roleId,'death',progress)).filter(Boolean));
 load.then(frames=>{
  if(stopped||!image.isConnected||!frames.length)return;
  image.dataset.sequence=won?'victory':'defeat';
  const start=performance.now();
  function paint(now){
   if(stopped||!image.isConnected)return;
   const elapsed=Math.max(0,now-start);
   const index=reduce?frames.length-1:Math.min(frames.length-1,Math.floor(elapsed/(won?170:450)));
   image.src=frames[index].src;
   if(index<frames.length-1)frameRequest=requestAnimationFrame(paint);
  }
  frameRequest=requestAnimationFrame(paint);
 }).catch(()=>{image.dataset.motionError='true'});
 return ()=>{stopped=true;if(frameRequest!==null)cancelAnimationFrame(frameRequest)};
}
