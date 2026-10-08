import fs from 'node:fs';import assert from 'node:assert/strict';import {toolDependency} from './refresh-deps.mjs';import {tarot,characters} from '../games/fortune/seven-v3/content.mjs';
const sharp=toolDependency('sharp'),dir='games/fortune/seven-v3',manifest=JSON.parse(fs.readFileSync(dir+'/art-manifest.json')),results=[];
assert.equal(manifest.assets.length,86);assert.equal(new Set(manifest.assets.map(m=>m.source)).size,86);
for(const m of manifest.assets){const p=dir+'/'+m.target;assert(fs.existsSync(p),p);const meta=await sharp(p).metadata();assert(meta.width>100&&meta.height>100);await sharp(p).raw().toBuffer();results.push({id:m.id,width:meta.width,height:meta.height,bytes:fs.statSync(p).size});}
for(const c of tarot)assert(fs.existsSync(dir+'/art/'+(c.id<22?'major-'+c.id:'minor-'+(c.id-22))+'.webp'));
for(const c of characters)assert(fs.existsSync('assets/mascot-motion-v2/'+c.id+'-idle.webp'));
const html=fs.readFileSync('games/fortune/index.html','utf8');assert(html.includes('games/fortune/seven-v3/art/return.webp'));assert(!html.includes('return-website-v3.webp'));
fs.mkdirSync('outputs/fortune-seven-v3',{recursive:true});fs.writeFileSync('outputs/fortune-seven-v3/art-tests.json',JSON.stringify({passed:results.length,bytes:results.reduce((s,r)=>s+r.bytes,0),assets:results},null,2));console.log(JSON.stringify({passed:results.length,bytes:results.reduce((s,r)=>s+r.bytes,0)}));
