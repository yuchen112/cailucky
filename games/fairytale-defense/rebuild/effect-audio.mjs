// Short effects share decoded buffers. Music continues through the existing player.
export function createEffectAudio(){
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)return null;
 let context;
 const buffers=new Map(),active=new Set();
 function unlock(){
  try{
   context??=new Context();
   if(context.state==='suspended')void context.resume().catch(()=>{});
  }catch{/* The caller retains its HTML audio fallback. */}
 }
 async function prepare(url){
  if(!context)return null;
  if(!buffers.has(url)){
   buffers.set(url,(async()=>{
    try{
     const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
     if(!response.ok)return null;
     return await context.decodeAudioData(await response.arrayBuffer());
    }catch{return null;}
   })());
  }
  return buffers.get(url);
 }
 async function play(url,{volume,rate,allowed}){
  const buffer=await prepare(url);
  if(!buffer)return false;
  if(!allowed()||context.state!=='running')return true;
  if([...active].filter(voice=>voice.url===url).length>=3)return true;
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=buffer;
  source.playbackRate.value=rate;
  gain.gain.value=volume;
  source.connect(gain);gain.connect(context.destination);
  const voice={url,source,gain};active.add(voice);
  source.onended=()=>{active.delete(voice);source.disconnect();gain.disconnect();};
  source.start();
  return true;
 }
 function stop(){for(const voice of active)voice.source.stop();}
 return {unlock,prepare,play,stop};
}
