// Reuse decoded short effects. Long music tracks remain streamed by each game.
export function createEffectAudio({maxVoices=Infinity,maxPerUrl=3}={}){
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)return null;
 let context,output,volume=1,generation=0,disposed=false;
 const buffers=new Map(),active=new Set();
 function unlock(){
  if(disposed)return;
  try{
   if(!context){context=new Context();output=context.createGain();output.gain.value=volume;output.connect(context.destination);}
   if(context.state==='suspended'||context.state==='interrupted')void context.resume().catch(()=>{});
  }catch{/* Games retain their existing media fallback if Web Audio is unavailable. */}
 }
 async function prepare(url){
  if(!context||disposed)return null;
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
 async function play(url,{volume:gainValue=1,rate=1,allowed=()=>true,onended}={}){
  const requested=generation,buffer=await prepare(url);
  if(!buffer)return false;
  if(disposed||requested!==generation||!allowed()||context.state!=='running')return true;
  if(active.size>=maxVoices||[...active].filter(voice=>voice.url===url).length>=maxPerUrl)return true;
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=gainValue;
  source.connect(gain);gain.connect(output);
  const voice={url,source,gain,stopped:false};active.add(voice);
  source.onended=()=>{active.delete(voice);source.disconnect();gain.disconnect();if(!voice.stopped)onended?.();};
  source.start();return true;
 }
 function stop(){
  generation++;
  for(const voice of active){voice.stopped=true;try{voice.source.stop();}catch{}}
  active.clear();
 }
 return {
  unlock,prepare,play,stop,
  setVolume(value){volume=value;if(output)output.gain.value=value;if(!value)stop();},
  status(){return {state:context?.state||'locked',buffers:buffers.size,voices:active.size};},
  dispose(){stop();disposed=true;output?.disconnect();void context?.close().catch(()=>{});buffers.clear();}
 };
}
