/* Local HTML-media audio service. No player data or network telemetry. */
(()=>{
 const root=new URL('.',document.currentScript.src),clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 const players=new Set();let unlocked=false;
 function create({id,settings=()=>({music:.25,sfx:.6}),tracks=[],effects={}}={}){
  const scored=new Set(['dino','flappy','merge','mines','whack','dream-match','magic-bubble','2048','brick-breaker','click-core','link','memory','tetris','fortune','poker','richman','lucky-town','heartlight-duel','fairytale-defense']);
  const normalize=next=>{if(!next.length||!scored.has(id))return next;const score=new URL('audio-v3/'+id+'.mp3?v=20261009-refresh1',root).href,original=next.filter(p=>!String(p).includes('/audio-v3/'));const regional=['poker','fairytale-defense','heartlight-duel'].includes(id)&&original[0]&&!String(original[0]).includes('audio-v2/'+id+'.mp3');return regional?[original[0],score,...original.slice(1)]:[score,...original];};
  tracks=normalize(tracks);
  let held=false,index=0,music=null,source='',generation=0,failed=0,state='點擊畫面啟用聲音';
  const pool=new Map(),last=new Map(),variation=new Map(),voices=new Set();
  const absolute=p=>new URL(p,root).href;
  function report(){for(const el of document.querySelectorAll('[data-audio-status]'))el.textContent=state;}
  function levels(){const s=settings()||{};return{music:clamp(s.music),sfx:clamp(s.sfx)};}
  function sync(){const v=levels();if(!music&&tracks.length){music=new Audio();music.preload='none';music.loop=false;music.addEventListener('ended',()=>{index=(index+1)%tracks.length;source='';sync()});music.addEventListener('error',()=>{state='音樂暫時無法載入，點擊可重試';report();source='';failed++;if(failed<tracks.length){index=(index+1)%tracks.length;sync()}});}
   if(!music)return;music.volume=v.music;
   if(!unlocked||held||document.hidden||!v.music){music.pause();state=!v.music?'音樂已靜音':held?'音樂已暫停':!unlocked?'點擊畫面啟用聲音':'背景暫停';report();return;}
   const next=absolute(tracks[index]);if(source!==next){music.src=next;source=next;}
   const token=++generation;const promise=music.play();if(promise?.then)promise.then(()=>{if(token!==generation)return;failed=0;state='音樂播放中';report()}).catch(()=>{if(token!==generation)return;state='點擊畫面恢復聲音';report()});
  }
  function sound(name='tap',{rate=1,gain=1,preview=false}={}){if(!unlocked||(held&&!preview)||document.hidden||!levels().sfx)return;
   const now=performance.now(),gap=/step|scratch/.test(name)?130:45;if(now-(last.get(name)??-Infinity)<gap)return;last.set(name,now);
   let choices=effects[name]||effects.tap;if(!choices)return;choices=Array.isArray(choices)?choices:[choices];
   const n=variation.get(name)||0;variation.set(name,n+1);const src=absolute(choices[n%choices.length]);
   let list=pool.get(src);if(!list){list=[];pool.set(src,list)}let a=list.find(x=>x.paused||x.ended);if(!a&&list.length<3){a=new Audio(src);a.preload='none';list.push(a)}if(!a||voices.size>=8)return;
   a.volume=clamp(levels().sfx*gain);a.playbackRate=Math.max(.8,Math.min(1.2,rate*[.98,1.02,1][n%3]));a.preservesPitch=false;a.currentTime=0;voices.add(a);
   const release=()=>voices.delete(a);a.onended=release;a.onerror=()=>{release();pool.delete(src)};a.play()?.catch(release);
  }
  const api={sync,sound,background(){generation++;music?.pause();for(const a of voices)a.pause();voices.clear();},hold(value=true){held=value;generation++;if(held){music?.pause();for(const a of voices)a.pause();voices.clear();}else sync()},tracks(next){next=normalize(next);if(JSON.stringify(next)===JSON.stringify(tracks))return;tracks=next;index=0;source='';failed=0;music?.pause();sync()},test(){sound('tap',{preview:true})},status(){return{id,unlocked,held,state,playing:!!music&&!music.paused,source,voices:voices.size}},dispose(){api.hold();players.delete(api)}};
  players.add(api);return api;
 }
 const gesture=()=>{unlocked=true;for(const p of players)p.sync()};
 document.addEventListener('pointerdown',gesture,{capture:true,passive:true});document.addEventListener('keydown',gesture,{capture:true});
 document.addEventListener('visibilitychange',()=>{for(const p of players){if(document.hidden)p.background();else p.sync()}});
 addEventListener('pagehide',()=>{for(const p of players)p.background()});addEventListener('pageshow',()=>{for(const p of players)p.sync()});
 window.CxQAudioEngine={create};
})();
