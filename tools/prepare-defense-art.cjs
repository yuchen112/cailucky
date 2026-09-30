const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest=require('../games/fairytale-defense/rebuild/art-manifest.json');
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/spell-art-manifest.json').jobs);
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/hero-cast-manifest.json').jobs);
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/presentation-art-manifest.json').jobs);
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/evolution-art-manifest.json').jobs.filter(job=>job.source));
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/battle-art-manifest.json').jobs);
manifest.jobs.push(...require('../games/fairytale-defense/rebuild/region-art-manifest.json').jobs);
(async()=>{for(const job of manifest.jobs){
 fs.mkdirSync(path.dirname(job.output),{recursive:true});
 const large=['meadow','road','camp-scene','cover-scene','meadow-moon','meadow-dawn'].includes(job.id);
 await sharp(job.source).resize(large?780:512,large?1170:512,{fit:'inside',withoutEnlargement:true}).webp({quality:87,alphaQuality:100}).toFile(job.output);
 const meta=await sharp(job.output).metadata();
 console.log(JSON.stringify({id:job.id,width:meta.width,height:meta.height,alpha:meta.hasAlpha,bytes:fs.statSync(job.output).size}));
 if(!['meadow','camp-scene','cover-scene','meadow-moon','meadow-dawn'].includes(job.id)&&!meta.hasAlpha)throw Error('Expected transparent alpha: '+job.id);
}})().catch(e=>{console.error(e);process.exitCode=1});
