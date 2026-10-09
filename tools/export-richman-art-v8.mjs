import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),src='outputs/richman-art-20261010/generation',dest='games/cxq-fairytale-richman/art/v8';
fs.mkdirSync(dest,{recursive:true});const assets=[];
for(const name of fs.readdirSync(src).filter(p=>p.endsWith('.json'))){
 const r=JSON.parse(fs.readFileSync(path.join(src,name),'utf8').replace(/^\uFEFF/,'')),file=r.id+'.webp';
 let pipeline=sharp(r.path);
 if(r.alpha){const meta=await pipeline.metadata();if(!meta.hasAlpha)throw Error(r.id+' missing alpha');pipeline=pipeline.trim({threshold:10});
  if(/^(joy|dream|night|sadness|trust|memory|growth|healing|luck|hope)-(idle|toss|receive|pay|skill|blink|windup)$/.test(r.id)){
   const body=await pipeline.resize(280,320,{fit:'inside'}).png().toBuffer(),m=await sharp(body).metadata();pipeline=sharp({create:{width:320,height:360,channels:4,background:'#00000000'}}).composite([{input:body,left:Math.round((320-m.width)/2),top:340-m.height}]);
  }else pipeline=pipeline.resize({width:900,height:650,fit:'inside',withoutEnlargement:true});
 }else pipeline=pipeline.resize({width:2560,withoutEnlargement:true});
 await pipeline.webp({quality:r.alpha?85:82,alphaQuality:100}).toFile(path.join(dest,file));
 const bytes=fs.readFileSync(path.join(dest,file)),m=await sharp(bytes).metadata();
 assets.push({id:r.id,file,prompt:r.prompt,reference:r.reference?path.relative('.',r.reference).replaceAll('\\','/'):undefined,source:path.basename(r.path),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),width:m.width,height:m.height,bytes:bytes.length,alpha:r.alpha});
}
fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({version:'20261010-richman8',generator:'built-in image_gen',independentDrawings:true,montageExtraction:false,assets},null,2));
console.log(JSON.stringify({exported:assets.length,bytes:assets.reduce((s,a)=>s+a.bytes,0)}));
