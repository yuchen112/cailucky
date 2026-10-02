const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='games/fairytale-defense/rebuild/';
(async()=>{for(const job of JSON.parse(fs.readFileSync(root+'collection-art-manifest.json','utf8')).jobs){const large=job.id.startsWith('road-'),out=root+'art/'+job.id+'.webp';await sharp(job.source).resize(large?780:512,large?1170:512,{fit:'inside'}).webp({quality:86,alphaQuality:100}).toFile(out);const m=await sharp(out).metadata();if(!large&&!m.hasAlpha)throw Error('Missing alpha '+job.id);console.log(job.id,m.width,m.height,fs.statSync(out).size);}})().catch(e=>{console.error(e);process.exitCode=1});
