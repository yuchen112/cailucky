// Read-only alpha measurement. Does not crop, rewrite or alter artwork.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const dir='games/fairytale-defense/rebuild/art',layout={};for(const file of fs.readdirSync(dir).filter(n=>/^unit-.*\.webp$/.test(n))){
 const {data,info}=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=info.width,right=0,top=info.height,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>48){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(bottom<=top)throw Error('Empty sprite '+file);
 let footLeft=info.width,footRight=0;for(let y=Math.floor(bottom-(bottom-top)*.15);y<=bottom;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>48){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
 layout[file.replace('.webp','')]={anchorX:(footLeft+footRight+1)/2/info.width,anchorY:(bottom+1)/info.height,visibleHeight:(bottom-top+1)/info.height};
 }console.log(JSON.stringify(layout));})().catch(e=>{console.error(e);process.exitCode=1});
