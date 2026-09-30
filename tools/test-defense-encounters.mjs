import assert from 'node:assert/strict';
import {CAMPAIGN,encounterWave} from '../games/fairytale-defense/rebuild/encounters.mjs';
import {createBattle,deploy,startWave,wavePreview} from '../games/fairytale-defense/rebuild/core.mjs';
assert.equal(CAMPAIGN.length,15);assert.equal(new Set(CAMPAIGN.map(c=>JSON.stringify(c.waves))).size,15);
for(const c of CAMPAIGN){assert.equal(c.waves.length,6);for(let wave=1;wave<=6;wave++){
 const s=createBattle({hero:'growth',stage:c.stage});deploy(s,0,'archer');s.wave=wave-1;
 const preview=wavePreview(s);assert(startWave(s));assert.deepEqual(s.queue.map(q=>q.kind),encounterWave(c.stage,wave));
 assert.deepEqual(s.queue.reduce((a,q)=>(a[q.kind]=(a[q.kind]||0)+1,a),{}),preview);
 assert(s.queue.every((q,i)=>!i||q.at>s.queue[i-1].at));
}}
console.log('PASS: all 90 authored waves, preview/spawn parity and distinct 15 encounters. Not a balance acceptance test.');
