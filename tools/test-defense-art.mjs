import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pointAt,PATH_LENGTH,PADS} from '../games/fairytale-defense/rebuild/core.mjs';
const require=createRequire(import.meta.url),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {data,info}=await sharp('games/fairytale-defense/rebuild/art/road.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
function sample(p){const x=Math.max(0,Math.min(info.width-1,Math.round(p.x/390*info.width))),y=Math.max(0,Math.min(info.height-1,Math.round(p.y/585*info.height))),i=(y*info.width+x)*4;return [...data.subarray(i,i+4)];}
// A route on a transparent shadow is not a valid route on the actual paved road.
const bad=[];
for(let d=8;d<PATH_LENGTH-8;d+=4){const p=pointAt(d),[r,g,b,a]=sample(p);if(a<240||r<160||g<140||b<100)bad.push({d,p,rgba:[r,g,b,a]});}
assert.equal(bad.length,0,`Route leaves bright paved surface: ${JSON.stringify(bad.slice(0,8))}`);
for(const p of PADS)assert(sample(p)[3]<240,`Deployment center is on road at ${JSON.stringify(p)}`);
console.log('PASS: every 4px of calibrated route stays on visible stone, all 9 deployment centers off-road.');
