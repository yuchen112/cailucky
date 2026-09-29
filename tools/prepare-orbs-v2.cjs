const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest=require('../games/shared/orbs-v2-manifest.json');
(async()=>{const geometry={bubble:[],merge:[]};let total=0;
for(const j of manifest.jobs){
 const size=j.id.startsWith('bubble')?256:384;
 fs.mkdirSync(path.dirname(j.dest),{recursive:true});
 await sharp(j.source).resize(size,size,{fit:'inside'}).webp({quality:88,alphaQuality:100}).toFile(j.dest);
 const {data,info}=await sharp(j.dest).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==info.height)throw Error('Non-square asset '+j.id);
 let left=info.width,right=0,top=info.height,bottom=0,transparent=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const alpha=data[(y*info.width+x)*4+3];if(!alpha)transparent++;
  if(alpha>=128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(transparent<info.width*info.height*.1)throw Error('Transparency missing '+j.id);
 const width=right-left+1,height=bottom-top+1;
 if(Math.abs(width-height)/Math.max(width,height)>.07)throw Error('Non-circular silhouette '+j.id);
 const meta={cx:(left+right+1)/2/info.width,cy:(top+bottom+1)/2/info.height,radius:(width+height)/4/info.width};
 geometry[j.id.startsWith('bubble')?'bubble':'merge'].push(meta);
 const bytes=fs.statSync(j.dest).size;total+=bytes;console.log(JSON.stringify({id:j.id,bytes,...meta}));
}
console.log(JSON.stringify({geometry,total}));
})().catch(e=>{console.error(e);process.exitCode=1});
