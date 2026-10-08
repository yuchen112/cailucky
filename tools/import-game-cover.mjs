import fs from 'node:fs';import crypto from 'node:crypto';import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),dir='assets/game-covers/redrawn-20261008',file=dir+'/manifest.json',manifest=JSON.parse(fs.readFileSync(file));
const [id,source]=process.argv.slice(2),job=manifest.jobs.find(j=>j.id===id);if(!job||!source)throw Error('Usage: node tools/import-game-cover.mjs id source');
const meta=await sharp(source).metadata();if(meta.width!==meta.height)throw Error('Cover must be square '+id);
await sharp(source).resize(768,768,{fit:'inside',withoutEnlargement:true}).webp({quality:88,effort:6}).toFile(job.target);
const thumb=job.target.replace('.webp','-thumb.webp');await sharp(source).resize(320,320).webp({quality:84,effort:6}).toFile(thumb);
const final=await sharp(job.target).stats();if(final.entropy<3)throw Error('Unexpected empty cover');
job.source=source.split(/[\\/]/).pop();job.sha256=crypto.createHash('sha256').update(fs.readFileSync(job.target)).digest('hex');job.bytes=fs.statSync(job.target).size;job.thumbnail=thumb;job.thumbnailBytes=fs.statSync(thumb).size;
fs.writeFileSync(file,JSON.stringify(manifest,null,2));console.log(JSON.stringify({id,bytes:job.bytes,thumbnailBytes:job.thumbnailBytes}));