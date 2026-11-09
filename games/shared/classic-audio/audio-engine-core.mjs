import {createEffectAudio} from './effect-audio.mjs';

export function installAudioEngine({root,originalCues={},normalizeTracks=(_,tracks)=>tracks}){
 const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));
 const players=new Set();let unlocked=false;
 function create({id,settings=()=>({music:.25,sfx:.6}),tracks=[],effects={}}={}){
  const game=id==='richman'?'cxq-fairytale-richman':id,cues=originalCues[game];
  const audioRoot=cues&&new URL('../'+game+'/audio-original/',root);
  const normalize=next=>normalizeTracks({id,game,audioRoot},next);
  tracks=normalize(tracks);
  let held=false,index=0,music=null,source='',generation=0,failed=0,state='點擊畫面啟用聲音',disposed=false;
  const pool=new Map(),last=new Map(),variation=new Map(),voices=new Set(),preloaded=new Set();
  const buffered=createEffectAudio({maxVoices:8});
  const absolute=p=>{const url=new URL(p,root).href;return globalThis.CxQLoading?.mediaURL(url)||url;};
  const levels=()=>{const value=settings()||{};return {music:clamp(value.music),sfx:clamp(value.sfx)};};
  function report(){for(const el of document.querySelectorAll('[data-audio-status]'))if(el.textContent!==state)el.textContent=state;}
  function choicesFor(name){
   const cue=cues?.[name],choices=cue?new URL(cue+'.wav',audioRoot).href:effects[name]||effects.tap;
   return choices?(Array.isArray(choices)?choices:[choices]):[];
  }
  function prepare(){
   if(!buffered||!unlocked||!levels().sfx||disposed)return;
   buffered.unlock();
   for(const name of new Set([...Object.keys(effects),...Object.keys(cues||{})])){
    for(const choice of choicesFor(name)){
     const url=absolute(choice);if(preloaded.has(url))continue;
     preloaded.add(url);void buffered.prepare(url);
    }
   }
  }
  function sync(){
   if(disposed)return;
   const volume=levels();buffered?.setVolume(volume.sfx);prepare();
   if(!music&&tracks.length){
    music=new Audio();music.preload='none';music.loop=false;
    music.addEventListener('ended',()=>{index=(index+1)%tracks.length;source='';sync();});
    music.addEventListener('error',()=>{state='音樂暫時無法載入，點擊可重試';report();source='';failed++;if(failed<tracks.length){index=(index+1)%tracks.length;sync();}});
   }
   if(!music)return;music.volume=volume.music;
   if(!unlocked||held||document.hidden||!volume.music){
    music.pause();state=!volume.music?'音樂已靜音':held?'音樂已暫停':!unlocked?'點擊畫面啟用聲音':'背景暫停';report();return;
   }
   const next=absolute(tracks[index]);if(source!==next){music.src=next;source=next;}
   if(!music.paused){state='音樂播放中';report();return;}
   const token=++generation,promise=music.play();
   promise?.then(()=>{if(token!==generation)return;failed=0;state='音樂播放中';report();}).catch(()=>{if(token!==generation)return;state='點擊畫面恢復聲音';report();});
  }
  function stopEffects(){buffered?.stop();for(const voice of voices)voice.pause();voices.clear();}
  function htmlSound(src,{rate,gain,preview,onended}){
   if(disposed||!unlocked||(held&&!preview)||document.hidden||!levels().sfx)return false;
   let list=pool.get(src);if(!list){list=[];pool.set(src,list);}
   let voice=list.find(item=>item.paused||item.ended);
   if(!voice&&list.length<3){voice=new Audio(src);voice.preload='none';list.push(voice);}
   if(!voice||voices.size>=8)return false;
   voice.volume=clamp(levels().sfx*gain);voice.playbackRate=rate;voice.preservesPitch=false;voice.currentTime=0;voices.add(voice);
   const release=()=>voices.delete(voice);
   voice.onended=()=>{release();onended?.();};voice.onerror=()=>{release();pool.delete(src);};
   return voice.play()?.then(()=>true).catch(()=>{release();return false;});
  }
  function sound(name='tap',{rate=1,gain=1,preview=false,onended}={}){
   if(disposed||!unlocked||(held&&!preview)||document.hidden||!levels().sfx)return;
   const now=performance.now(),gap=/step|scratch/.test(name)?130:45;
   if(now-(last.get(name)??-Infinity)<gap)return;last.set(name,now);
   const choices=choicesFor(name);if(!choices.length)return;
   const n=variation.get(name)||0;variation.set(name,n+1);
   const src=absolute(choices[n%choices.length]),playRate=Math.max(.8,Math.min(1.2,rate*[.98,1.02,1][n%3]));
   const options={rate:playRate,gain,preview,onended};
   if(!buffered)return htmlSound(src,options);
   buffered.setVolume(levels().sfx);
   return buffered.play(src,{volume:clamp(levels().sfx*gain)/levels().sfx,rate:playRate,onended,allowed:()=>!disposed&&unlocked&&(!held||preview)&&!document.hidden&&levels().sfx>0})
    .then(played=>played||htmlSound(src,options));
  }
  const api={
   sync,sound,prepare,
   unlock(){prepare();sync();},
   background(){generation++;music?.pause();stopEffects();},
   hold(value=true){held=value;generation++;if(held){music?.pause();stopEffects();}else sync();},
   tracks(next){next=normalize(next);if(JSON.stringify(next)===JSON.stringify(tracks))return;tracks=next;index=0;source='';failed=0;music?.pause();sync();},
   test(){return sound('tap',{preview:true});},
   status(){return {id,unlocked,held,state,playing:!!music&&!music.paused,source,voices:voices.size+(buffered?.status().voices||0),effects:buffered?.status()||{state:'media-fallback'}};},
   dispose(){api.hold();disposed=true;buffered?.dispose();players.delete(api);}
  };
  players.add(api);if(unlocked)api.unlock();return api;
 }
 const gesture=()=>{unlocked=true;for(const player of players)player.unlock();};
 document.addEventListener('pointerdown',gesture,{capture:true,passive:true});
 document.addEventListener('keydown',gesture,{capture:true});
 document.addEventListener('visibilitychange',()=>{for(const player of players){if(document.hidden)player.background();else player.sync();}});
 addEventListener('pagehide',()=>{for(const player of players)player.background();});
 addEventListener('pageshow',()=>{for(const player of players)player.sync();});
 window.CxQAudioEngine={create};
}
