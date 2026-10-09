import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import {queuedDecode} from '../games/heartlight-duel/arcade/decode-queue.mjs';
let active=0,peak=0;
await Promise.all(Array.from({length:25},(_,i)=>queuedDecode(async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,2));active--;return i})));assert.equal(peak,4);assert.equal(active,0);
await assert.rejects(queuedDecode(()=>{throw Error('decode failure')}),/decode failure/);assert.equal(await queuedDecode(()=>42),42);
let now=1000;const events={},made=[];
class Audio{constructor(src){this.src=src;this.paused=true;this.listeners={};made.push(this)}addEventListener(k,f){this.listeners[k]=f}pause(){this.paused=true}play(){this.paused=false;return Promise.resolve()}}
const document={currentScript:{src:'https://test/games/shared/audio-engine-v2.js'},hidden:false,querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f},window={};
vm.runInNewContext(fs.readFileSync('games/shared/audio-engine-v2.js','utf8'),{window,document,Audio,URL,performance:{now:()=>now},addEventListener:(k,f)=>events[k]=f});
const level={music:.2,sfx:.7},p=window.CxQAudioEngine.create({settings:()=>level,tracks:['theme.mp3'],effects:{tap:['tap.mp3']}});events.pointerdown();await Promise.resolve();p.hold();assert.equal(p.status().held,true);now+=100;p.test();assert.equal(p.status().held,true);assert.equal(p.status().playing,false);assert.equal(made[1].paused,false,'preview remains audible without resuming music');level.sfx=0;now+=100;p.test();assert.equal(made.length,2);p.hold(false);await Promise.resolve();assert.equal(p.status().playing,true);p.dispose();
for(const file of ['games/fairytale-defense/rebuild/inventory.mjs','games/fairytale-defense/rebuild/inventory-ui.mjs']){const text=fs.readFileSync(file,'utf8');assert(!text.includes('合成上一級'));assert(text.includes('合成下一級'))}
console.log('PASS bounded decoder and recovery, audible paused preview, mute, resume, upward synthesis terminology');
