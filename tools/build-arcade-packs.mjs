import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {CAST,STAGES,ART} from '../games/heartlight-duel/arcade/cast.mjs';
import {BOOT_ASSETS,SELECT_ASSETS} from '../games/heartlight-duel/arcade/render.mjs';
const sharp=createRequire(import.meta.url)('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir='games/heartlight-duel/arcade',out=dir+'/packs';fs.mkdirSync(out,{recursive:true});
const groups={menu:[...BOOT_ASSETS],selection:[...SELECT_ASSETS],common:Object.values(ART).filter(src=>!BOOT_ASSETS.includes(src)&&!SELECT_ASSETS.includes(src))};
for(const c of CAST)groups[c.id]=Object.values(c.poses).filter(src=>!BOOT_ASSETS.includes(src)&&!SELECT_ASSETS.includes(src));
for(const s of STAGES)groups['stage-'+s.id]=[s.art];
const index=Object.fromEntries(Object.entries(groups).flatMap(([name,files])=>files.map(src=>[src,name])));
const meta=Object.fromEntries(JSON.parse(fs.readFileSync(dir+'/art/manifest.json')).assets.map(a=>[a.id,a]));
const report={format:1,montageExtraction:false,groups:{},totalOriginalBytes:0,totalPackedBytes:0};
for(const [name,files] of Object.entries(groups)){
 let offset=0;const buffers=[],entries=[];
 for(const src of [...new Set(files)]){const file=path.resolve(dir,src),original=fs.statSync(file).size;
 const portrait=src.includes('/characters/'),background=src.includes('backdrop')||src.includes('arena-'),ui=src.startsWith('art/')&&Object.values(ART).includes(src);
 const width=portrait?160:background?1280:ui?(src.includes('panel-frame')?960:src.includes('control-')?192:640):480;
 const data=await sharp(file).resize({width,withoutEnlargement:true}).webp({quality:portrait?82:76,alphaQuality:90,effort:6}).toBuffer();
 entries.push({src,offset,length:data.length});buffers.push(data);offset+=data.length;report.totalOriginalBytes+=original;
 }
 const header=Buffer.from(JSON.stringify({format:1,entries,...(name==='menu'?{index,meta}:{})})),size=Buffer.alloc(4);size.writeUInt32LE(header.length);const packed=Buffer.concat([size,header,...buffers]);
 fs.writeFileSync(out+'/'+name+'.bin',packed);report.groups[name]={images:entries.length,bytes:packed.length};report.totalPackedBytes+=packed.length;
}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
