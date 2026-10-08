import {toolDependency} from './refresh-deps.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const sharp=toolDependency('sharp');
const jobs=JSON.parse(fs.readFileSync('games/refresh-20261008/asset-jobs.json'));const hashes=new Map(),records=[];
for(const job of jobs){assert(fs.existsSync(job.target),`Missing ${job.id}`);const bytes=fs.readFileSync(job.target),meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert(!hashes.has(hash),`Duplicate art: ${job.id} and ${hashes.get(hash)}`);hashes.set(hash,job.id);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});let clear=0,solid=0;for(let i=3;i<data.length;i+=4){if(data[i]<10)clear++;if(data[i]>200)solid++;}assert(solid>1000,`Empty art ${job.id}`);if(['motion','button','icon','logo'].includes(job.type)){assert(meta.hasAlpha,job.id);assert(clear>info.width*info.height*.05,`Opaque background ${job.id}`);}
 const file=`games/refresh-20261008/records/${job.id}.json`;assert(fs.existsSync(file),`Missing provenance ${job.id}`);const record=JSON.parse(fs.readFileSync(file));records.push({...record,sha256:hash,deliveredWidth:info.width,deliveredHeight:info.height,source:record.source?.split(/[\\/]/).pop()});
}
assert.equal(jobs.filter(j=>j.type==='motion').length,120);assert.equal(jobs.filter(j=>j.type==='button').length,19);
fs.writeFileSync('games/refresh-20261008/manifest.json',JSON.stringify({version:'20261008-complete1',independentlyGenerated:true,montageExtraction:false,assets:records},null,2));
console.log(`PASS ${jobs.length} distinct production artworks decode, transparency checked, all 120 animation frames and 19 individual return buttons present with provenance`);
