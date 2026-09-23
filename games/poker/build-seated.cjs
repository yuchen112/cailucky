const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.CXQ_SHARP_PATH||'sharp');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'art/seated-manifest.json'),'utf8'));
 for(const a of manifest.assets){
  const dest=path.join(__dirname,'art',a.id+'.png');
  if(!fs.existsSync(dest))fs.copyFileSync(a.source,dest);
  await sharp(dest).resize({width:480,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(path.join(__dirname,'art',a.id+'.webp'));
  const meta=await sharp(dest).metadata();if(!meta.hasAlpha)throw Error(a.id+' missing alpha');
 }
 console.log('Converted '+manifest.assets.length+' individual sprites, no cropping.');
})().catch(e=>{console.error(e);process.exitCode=1;});
