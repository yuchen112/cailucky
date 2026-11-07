import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const flush=async()=>{for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));};
function fixture(engine,webAudio=true){
 const listeners={},sources=[],media=[],fetches=[];let now=1000;
 const document={hidden:false,currentScript:{src:'https://example.test/games/shared/'+engine+'.js'},querySelectorAll:()=>[],addEventListener(name,fn){(listeners[name]??=[]).push(fn);}};
 class Media {
  paused=true;ended=false;volume=1;src='';events={};
  constructor(src=''){this.src=src;this.plays=0;media.push(this);}
  addEventListener(name,fn){this.events[name]=fn;}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
  pause(){this.paused=true;}
 }
 class Context {
  state='suspended';destination={};
  async resume(){this.state='running';}
  async close(){this.state='closed';}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
  async decodeAudioData(data){return {url:data.url};}
  createBufferSource(){const source={playbackRate:{value:1},connect(){},disconnect(){},start(){sources.push(this);},stop(){this.onended();}};return source;}
 }
 const sandbox={URL,AbortSignal,document,Audio:Media,performance:{now:()=>now},console,addEventListener(name,fn){(listeners[name]??=[]).push(fn);},fetch:async url=>{fetches.push(url);return {ok:true,arrayBuffer:async()=>Object.assign(new ArrayBuffer(4),{url})};}};
 if(webAudio)sandbox.AudioContext=Context;
 sandbox.window=sandbox;
 vm.runInNewContext(fs.readFileSync('games/shared/'+engine+'.js','utf8'),sandbox);
 return {engine:sandbox.CxQAudioEngine,document,sources,media,fetches,advance(){now+=200;},dispatch(name){for(const fn of listeners[name]||[])fn();}};
}

for(const engine of ['audio-engine-original','audio-engine-v2']){
 const f=fixture(engine),settings={music:.2,sfx:.6};
 const audio=f.engine.create({id:engine.endsWith('original')?'dino':'classic-hall',settings:()=>settings,tracks:['../dino/audio-original/music-loop.mp3'],effects:{tap:'test.wav',jump:'test.wav'}});
 audio.sound('jump');assert.equal(f.sources.length,0);assert.equal(f.fetches.length,0);
 f.dispatch('pointerdown');await flush();
 assert.equal(f.media.length,1);assert.equal(f.media[0].plays,1);
 const url=engine.endsWith('original')?'https://example.test/games/dino/audio-original/jump.wav':'https://example.test/games/shared/test.wav';
 audio.sound('jump');await flush();f.advance();audio.sound('jump');await flush();
 assert.equal(f.sources.length,2);assert.equal(f.sources[0].buffer.url,url);
 assert.equal(f.fetches.filter(value=>value===url).length,1);
 assert.equal(f.media.length,1,'Effects must not create HTML media elements');
 f.dispatch('pointerdown');await flush();assert.equal(f.media[0].plays,1,'Repeated gestures must not restart playing music');
 audio.hold();assert.equal(audio.status().voices,0);f.advance();audio.sound('jump');await flush();assert.equal(f.sources.length,2);
 audio.test();await flush();assert.equal(f.sources.length,3,'Preview remains usable while held');
 settings.sfx=0;audio.sync();f.advance();audio.test();await flush();assert.equal(f.sources.length,3);
 settings.sfx=.6;audio.hold(false);await flush();f.document.hidden=true;f.dispatch('visibilitychange');assert.equal(f.media[0].paused,true);assert.equal(audio.status().voices,0);
 f.document.hidden=false;f.dispatch('visibilitychange');await flush();assert.equal(f.media[0].paused,false);
 audio.dispose();f.advance();audio.sound('jump');await flush();assert.equal(f.sources.length,3);

 const fallback=fixture(engine,false),legacy=fallback.engine.create({id:'classic-hall',effects:{tap:'legacy.wav'}});
 fallback.dispatch('pointerdown');legacy.sound('tap');await flush();
 assert.equal(fallback.media.length,1);assert(fallback.media[0].src.endsWith('/legacy.wav'));
 const launch=fixture(engine),launcher=launch.engine.create({id:'classic-hall',effects:{launch:'launch.wav'}});
 let ended=0;launch.dispatch('pointerdown');
 await launcher.sound('launch',{onended:()=>ended++});await flush();
 launch.sources[0].onended();assert.equal(ended,1,'Game launch keeps its audio completion callback');
 console.log('PASS '+engine+' gesture gating, source/variation, decoded reuse, music, mute, preview, pause, background, disposal and fallback');
}
