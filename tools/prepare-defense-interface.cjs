const fs=require('node:fs'),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='games/fairytale-defense/rebuild/';
(async()=>{for(const job of JSON.parse(fs.readFileSync(root+'interface-art-manifest.json')).jobs){await sharp(job.source).resize({width:job.id.startsWith('nav-')?192:job.id.startsWith('entry-')?600:960,withoutEnlargement:true}).webp({quality:86,alphaQuality:100}).toFile(root+'art/'+job.id+'.webp');console.log(job.id);}})().catch(e=>{console.error(e);process.exitCode=1});
