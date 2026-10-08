import {toolDependency} from './refresh-deps.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';import crypto from 'node:crypto';
const ffmpeg=toolDependency('ffmpeg-static');
const dir='games/heartlight-duel/arcade/audio-v2',files=fs.readdirSync(dir).filter(f=>f.endsWith('.mp3')),hashes=new Set();let samples=0;
assert.equal(files.length,32);assert.equal(files.filter(f=>f.startsWith('music-')).length,5);
for(const file of files){const r=spawnSync(ffmpeg,['-v','error','-i',`${dir}/${file}`,'-f','s16le','-ac','1','-ar','22050','pipe:1'],{maxBuffer:20*1024*1024});assert.equal(r.status,0,`${file}: ${r.stderr}`);assert(r.stdout.length>3000,file);let peak=0,sum=0;for(let i=0;i<r.stdout.length;i+=2){const v=r.stdout.readInt16LE(i);peak=Math.max(peak,Math.abs(v));sum+=v*v;}assert(peak>500&&peak<32767,`Silent/clipping ${file}: ${peak}`);assert(sum>1e6,file);const hash=crypto.createHash('sha256').update(r.stdout).digest('hex');assert(!hashes.has(hash),`Duplicate cue ${file}`);hashes.add(hash);samples+=r.stdout.length/2;}
console.log(`PASS five music tracks and 27 unique sound/character cues decode, contain audible signal, no full-scale clipping (${samples} samples)`);
