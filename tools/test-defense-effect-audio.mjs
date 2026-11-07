import assert from 'node:assert/strict';
import {createEffectAudio} from '../games/fairytale-defense/rebuild/effect-audio.mjs';

let decodes=0,fetches=0;
const sources=[];
globalThis.fetch=async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
globalThis.AudioContext=class {
 state='suspended';destination={};
 async resume(){this.state='running';}
 async decodeAudioData(){decodes++;return {duration:.2};}
 createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
 createBufferSource(){
  const source={playbackRate:{value:1},connect(){},disconnect(){},start(){sources.push(this);},stop(){this.onended();}};
  return source;
 }
};
const audio=createEffectAudio();
audio.unlock();
await Promise.all([audio.prepare('hit.wav'),audio.prepare('hit.wav')]);
assert.equal(decodes,1);assert.equal(fetches,1);
const options={volume:.4,rate:1.02,allowed:()=>true};
for(let i=0;i<4;i++)assert(await audio.play('hit.wav',options));
assert.equal(sources.length,3);
assert.equal(sources[0].playbackRate.value,1.02);
audio.stop();
await audio.play('hit.wav',options);
assert.equal(sources.length,4);
await audio.play('hit.wav',{...options,allowed:()=>false});
assert.equal(sources.length,4);
assert.equal(decodes,1);
let release;
globalThis.fetch=()=>new Promise(resolve=>{release=resolve;});
const delayed=createEffectAudio();delayed.unlock();
const before=sources.length,pending=delayed.play('late.wav',options);
delayed.stop();
release({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
assert(await pending);
assert.equal(sources.length,before,'An effect queued before pause must not play after decoding');
console.log('PASS shared decode, overlapping voice limit, rate, stop and hidden-page guard');
