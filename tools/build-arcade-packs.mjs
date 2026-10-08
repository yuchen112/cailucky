import {toolDependency} from './refresh-deps.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {CAST,STAGES,ART} from '../games/heartlight-duel/arcade/cast.mjs';
import {BOOT_ASSETS,SELECT_ASSETS} from '../games/heartlight-duel/arcade/render.mjs';
const sharp=toolDependency('sharp');
const dir='games/heartlight-duel/arcade',out=dir+'/packs';fs.mkdirSync(out,{recursive:true});
const groups={menu:[...BOOT_ASSETS],selection:[...SELECT_ASSETS],common:Object.values(ART).filter(src=>!BOOT_ASSETS.includes(src)&&!SELECT_ASSETS.includes(src))};
for(const c of CAST)groups[c.id]=Object.values(c.poses).filter(src=>!BOOT_ASSETS.includes(src)&&!SELECT_ASSETS.includes(src));
for(const s of STAGES)groups['stage-'+s.id]=[s.art];
const index=Object.fromEntries(Object.entries(groups).flatMap(([name,files])=>files.map(src=>[src,name])));
const meta=Object.fromEntries(JSON.parse(fs.readFileSync(dir+'/art/manifest.json')).assets.map(a=>[a.id,a]));
const incomplete=process.argv.includes('--allow-incomplete-dev');
for(const c of CAST)for(const [pose,src] of Object.entries(c.poses)){if(!src.startsWith('art/v2/')||!fs.existsSync(path.resolve(dir,src)))continue;const {data,info}=await sharp(path.resolve(dir,src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=0,y1=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}let sum=0,weight=0;for(let y=Math.floor(y1*.91);y<=y1;y++)for(let x=x0;x<=Math.min(x1,info.width*.83);x++){const alpha=data[(y*info.width+x)*4+3];if(alpha>60){sum+=x*alpha;weight+=alpha;}}meta[c.id+'-'+pose]={id:c.id+'-'+pose,bounds:{x:x0/info.width,y:y0/info.height,w:(x1-x0+1)/info.width,h:(y1-y0+1)/info.height},feet:(y1+1)/info.height,anchorX:weight?sum/weight/info.width:.45,newDrawnFrame:true};}
const report={format:1,montageExtraction:false,groups:{},totalOriginalBytes:0,totalPackedBytes:0};
const layout={};
for(const [name,files] of Object.entries(groups)){
 let offset=0;const buffers=[],entries=[];
 for(const src of [...new Set(files)]){const file=path.resolve(dir,src);if(incomplete&&!fs.existsSync(file))continue;const original=fs.statSync(file).size;
 const portrait=src.includes('/characters/'),background=src.includes('backdrop')||src.includes('arena-'),ui=src.startsWith('art/')&&Object.values(ART).includes(src);
 const width=portrait?160:background?(name==='menu'?1120:1280):ui?(src.includes('panel-frame')?960:src.includes('control-')?192:640):src.includes('/v2/')?360:480;
 const data=await sharp(file).resize({width,withoutEnlargement:true}).webp({quality:portrait?82:76,alphaQuality:90,effort:6}).toBuffer();
 entries.push({src,offset,length:data.length});buffers.push(data);offset+=data.length;report.totalOriginalBytes+=original;
 }
 const keys=new Set(files.map(src=>path.basename(src,'.webp')));for(const c of CAST)for(const [pose,src] of Object.entries(c.poses))if(files.includes(src))keys.add(c.id+'-'+pose);
 const slim=Object.fromEntries([...keys].filter(k=>meta[k]).map(k=>[k,{bounds:meta[k].bounds,feet:meta[k].feet,anchorX:meta[k].anchorX,newDrawnFrame:meta[k].newDrawnFrame}]));
 const header=Buffer.from(JSON.stringify({format:1,entries,meta:slim})),size=Buffer.alloc(4);size.writeUInt32LE(header.length);const packed=Buffer.concat([size,header,...buffers]);
 fs.writeFileSync(out+'/'+name+'.bin',packed);const parts=[];for(let at=0;at<packed.length;at+=98304){const part=name+'.part-'+parts.length+'.bin';fs.writeFileSync(out+'/'+part,packed.subarray(at,at+98304));parts.push(part);}layout[name]={parts,bytes:packed.length};report.groups[name]={images:entries.length,bytes:packed.length};report.totalPackedBytes+=packed.length;
}
fs.writeFileSync(out+'/layout.mjs','export const PACK_LAYOUT='+JSON.stringify(layout)+';\nexport const PACK_INDEX='+JSON.stringify(index)+';\n');
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
