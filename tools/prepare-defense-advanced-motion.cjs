const fs=require('node:fs'),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='games/fairytale-defense/rebuild/';
const manifest=JSON.parse(fs.readFileSync(root+'advanced-motion-manifest.json','utf8'));
(async()=>{const layout={};for(const a of manifest.assets){
 await sharp(a.source).resize(512,512,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88,alphaQuality:100}).toFile(root+a.output);
 const {data,info}=await sharp(root+a.output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let top=info.height,bottom=0,left=info.width,right=0,clear=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const alpha=data[(y*info.width+x)*4+3];if(alpha===0)clear++;if(alpha>100){top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(clear<info.width*info.height*.05||bottom<=top)throw Error('Invalid transparent sprite '+a.id);
 for(let y=Math.floor(bottom-(bottom-top)*.1);y<=bottom;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);}
 layout[a.id]={anchorX:(left+right)/2/info.width,anchorY:bottom/info.height,visibleHeight:(bottom-top)/info.height};
 console.log(a.id,fs.statSync(root+a.output).size);
 }fs.writeFileSync(root+'advanced-motion-layout.mjs','// Complete transparent images, foot-aligned; no cropping.\nexport const ADVANCED_MOTION_LAYOUT='+JSON.stringify(layout,null,2)+';\n');})().catch(e=>{console.error(e);process.exitCode=1;});
