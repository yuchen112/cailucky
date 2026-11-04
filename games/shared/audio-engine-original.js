/* Local HTML-media audio service. No player data or network telemetry. */
(()=>{
 const root=new URL('.',document.currentScript.src),clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 const originalCues = {
  "2048": {
    "move": "move",
    "merge": "merge",
    "milestone": "milestone",
    "game-over": "game-over",
    "tap": "move",
    "drop": "move",
    "match": "merge",
    "upgrade": "milestone",
    "lose": "game-over"
  },
  "brick-breaker": {
    "paddle": "paddle",
    "brick": "brick",
    "power-up": "power-up",
    "ball-lost": "ball-lost",
    "clear": "clear",
    "tap": "paddle",
    "hit": "brick",
    "collect": "power-up",
    "upgrade": "power-up",
    "lose": "ball-lost",
    "win": "clear"
  },
  "click-core": {
    "collect": "collect",
    "upgrade": "upgrade",
    "expedition": "expedition",
    "reward": "reward"
  },
  "cxq-fairytale-richman": {
    "dice": "dice",
    "step": "step",
    "buy": "buy",
    "rent": "rent",
    "bankruptcy": "bankruptcy",
    "tap": "dice",
    "roll": "dice",
    "pay": "rent",
    "lose": "bankruptcy"
  },
  "dino": {
    "jump": "jump",
    "land": "land",
    "collect": "collect",
    "collision": "collision",
    "record": "record",
    "tap": "jump",
    "hit": "collision",
    "lose": "collision",
    "win": "record",
    "upgrade": "record"
  },
  "dream-match": {
    "swap": "swap",
    "invalid": "invalid",
    "match": "match",
    "combo": "combo",
    "clear": "clear",
    "tap": "swap",
    "miss": "invalid",
    "upgrade": "combo",
    "win": "clear"
  },
  "fairytale-defense": {
    "build": "build",
    "arrow": "arrow",
    "cannon": "cannon",
    "wave": "wave",
    "boss": "boss",
    "victory": "victory",
    "defeat": "defeat"
  },
  "flappy": {
    "flap": "flap",
    "pass": "pass",
    "collision": "collision",
    "medal": "medal",
    "tap": "flap",
    "jump": "flap",
    "collect": "pass",
    "hit": "collision",
    "lose": "collision",
    "win": "medal",
    "upgrade": "medal"
  },
  "fortune": {
    "draw": "draw",
    "reveal": "reveal",
    "blessing": "blessing",
    "tap": "draw",
    "flip": "reveal",
    "win": "blessing"
  },
  "heartlight-duel": {
    "attack": "attack",
    "hit": "hit",
    "guard": "guard",
    "skill": "skill",
    "victory": "victory",
    "defeat": "defeat"
  },
  "link": {
    "select": "select",
    "link": "link",
    "invalid": "invalid",
    "shuffle": "shuffle",
    "clear": "clear",
    "tap": "select",
    "match": "link",
    "miss": "invalid",
    "win": "clear"
  },
  "lucky-town": {
    "spin": "spin",
    "stop": "stop",
    "jackpot": "jackpot",
    "scratch": "scratch",
    "buy": "buy",
    "pet": "pet"
  },
  "magic-bubble": {
    "shoot": "shoot",
    "bounce": "bounce",
    "pop": "pop",
    "chain": "chain",
    "drop": "drop",
    "clear": "clear",
    "tap": "shoot",
    "hit": "bounce",
    "match": "pop",
    "upgrade": "chain",
    "win": "clear"
  },
  "memory": {
    "flip": "flip",
    "match": "match",
    "mismatch": "mismatch",
    "clear": "clear",
    "tap": "flip",
    "miss": "mismatch",
    "lose": "mismatch",
    "win": "clear"
  },
  "merge": {
    "drop": "drop",
    "bounce": "bounce",
    "merge": "merge",
    "combo": "combo",
    "overflow": "overflow",
    "tap": "drop",
    "hit": "bounce",
    "match": "merge",
    "upgrade": "combo",
    "lose": "overflow"
  },
  "mines": {
    "reveal": "reveal",
    "flag": "flag",
    "unflag": "unflag",
    "mine": "mine",
    "clear": "clear",
    "tap": "reveal",
    "flip": "flag",
    "hit": "mine",
    "lose": "mine",
    "win": "clear"
  },
  "picture-realm": {
    "select": "select",
    "place": "place",
    "discover": "discover",
    "unlock": "unlock",
    "clear": "clear"
  },
  "poker": {
    "deal": "deal",
    "chip": "chip",
    "check": "check",
    "fold": "fold",
    "showdown": "showdown",
    "win": "win",
    "tap": "chip",
    "click": "chip",
    "flip": "deal"
  },
  "star-survivors": {
    "shoot": "shoot",
    "impact": "impact",
    "hurt": "hurt",
    "pickup": "pickup",
    "level-up": "level-up",
    "evolve": "evolve",
    "boss": "boss",
    "victory": "victory",
    "defeat": "defeat"
  },
  "tetris": {
    "move": "move",
    "rotate": "rotate",
    "drop": "drop",
    "line-clear": "line-clear",
    "four-lines": "four-lines",
    "game-over": "game-over",
    "tap": "move",
    "flip": "rotate",
    "match": "line-clear",
    "win": "four-lines",
    "lose": "game-over"
  },
  "whack": {
    "hit": "hit",
    "miss": "miss",
    "gold": "gold",
    "bomb": "bomb",
    "heal": "heal",
    "time-up": "time-up",
    "tap": "hit",
    "collect": "gold",
    "hurt": "bomb",
    "lose": "time-up",
    "upgrade": "heal"
  }
};
 const players=new Set();let unlocked=false;
 function create({id,settings=()=>({music:.25,sfx:.6}),tracks=[],effects={}}={}){
  const game = id === 'richman' ? 'cxq-fairytale-richman' : id;
  const cues = originalCues[game];
  const audioRoot = cues && new URL('../' + game + '/audio-original/', root);
  const normalize = next => {
    if (!audioRoot || !next.length) return next;
    const score = new URL('music-loop.mp3', audioRoot).href;
    return [score, ...next.filter(track => String(track) !== score)];
  };
  tracks=normalize(tracks);
  let held=false,index=0,music=null,source='',generation=0,failed=0,state='點擊畫面啟用聲音';
  const pool=new Map(),last=new Map(),variation=new Map(),voices=new Set();
  const absolute=p=>{const url=new URL(p,root).href;return globalThis.CxQLoading?.mediaURL(url)||url;};
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
   const cue = cues?.[name]; let choices=cue ? new URL(cue + ".wav", audioRoot).href : effects[name]||effects.tap;if(!choices)return;choices=Array.isArray(choices)?choices:[choices];
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
