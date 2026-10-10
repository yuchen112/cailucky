import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),root=process.cwd(),version='20261010-loadingart3',out='games/shared/loading-art-v2';
const tracked=new Set(execFileSync('git',['ls-files'],{encoding:'utf8',maxBuffer:20e6}).split('\n'));
fs.mkdirSync(out,{recursive:true});fs.mkdirSync('outputs/loading-art-20261010',{recursive:true});
const inputs=JSON.parse(fs.readFileSync('tools/loading-art-inputs-20261010.json','utf8'));
const art=[];
for(const item of inputs){if(!item.path)throw Error('Missing art '+item.id);const target=out+'/'+item.id+'.webp';if(fs.existsSync(item.path))await sharp(item.path).resize({width:960,withoutEnlargement:true}).webp({quality:68,effort:6}).toFile(target);else if(!fs.existsSync(target))throw Error('Generate missing art '+item.id);art.push({id:item.id,file:target,bytes:fs.statSync(target).size,prompt:item.prompt,source:path.basename(item.path)});}
fs.writeFileSync(out+'/manifest.json',JSON.stringify({version,generator:'built-in image_gen',independentlyGenerated:true,art},null,2));
const thumbs=await Promise.all(art.map(async(a,i)=>({input:await sharp(a.file).resize(320,180).png().toBuffer(),left:(i%4)*320,top:Math.floor(i/4)*180})));
await sharp({create:{width:1280,height:900,channels:3,background:'#10151c'}}).composite(thumbs).png().toFile('outputs/loading-art-20261010/art-review.png');
const posix=p=>p.replaceAll('\\','/'),rel=(dir,p)=>posix(path.relative(dir,p));
const list=(dir,filter)=>fs.existsSync(dir)?fs.readdirSync(dir,{recursive:true}).map(f=>posix(path.join(dir,f))).filter(p=>fs.statSync(p).isFile()&&filter(p)):[];
const inventories=JSON.parse(fs.readFileSync('games/refresh-20261008/inventory.json','utf8')).games,report=[];
const roles=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'];
const revisions=JSON.parse(fs.readFileSync('games/cxq-fairytale-richman/asset-versions-v1.js','utf8').split('=')[1].replace(/;\s*$/,''));
const defenseContext={};vm.createContext(defenseContext);vm.runInContext(fs.readFileSync('games/fairytale-defense/rebuild/asset-revisions.mjs','utf8').replace('export const','globalThis.'),defenseContext);
const prepared=new Map(),packDir='games/shared/loading-packs-v2';fs.mkdirSync(packDir,{recursive:true});
async function packedFile(filename){const disk=filename.split('?')[0];if(prepared.has(disk))return prepared.get(disk);const promise=(async()=>{const raw=fs.readFileSync(disk);if(/\.(webp|png|jpe?g)$/i.test(disk)){const converted=await sharp(raw).webp({quality:72,effort:4}).toBuffer();if(converted.length<raw.length)return{bytes:converted,type:'image/webp',originalBytes:raw.length};}return{bytes:raw,type:/\.mp3$/i.test(disk)?'audio/mpeg':/\.ogg$/i.test(disk)?'audio/ogg':/\.svg$/i.test(disk)?'image/svg+xml':/\.png$/i.test(disk)?'image/png':/\.webp$/i.test(disk)?'image/webp':'application/octet-stream',originalBytes:raw.length};})();prepared.set(disk,promise);return promise;}
for(const game of inventories){
 const entry=game.id==='fairytale-defense'?'games/fairytale-defense/rebuild/army.html':game.url.split('?')[0],dir=path.dirname(entry);
 let html=fs.readFileSync(entry,'utf8');const old=html.match(/data-loading='([^']+)'/),cfg=JSON.parse(old[1].replaceAll('&#39;',"'"));
 const candidates=new Set();const add=p=>{const name=p.split('?')[0],key=posix(path.relative(root,path.resolve(name)));if(tracked.has(key)&&fs.existsSync(name)&&fs.statSync(name).isFile())candidates.add(posix(path.resolve(name))+(p.includes('?')?'?'+p.split('?')[1]:''));};
 for(const p of list(dir,p=>tracked.has(p)&&/\.(js|mjs|css)$/.test(p)&&!p.includes('tools/')&&!p.includes('/packs/'))){const text=fs.readFileSync(p,'utf8');for(const m of text.matchAll(/["'`]([^"'`\n]*\.(?:webp|png|svg|mp3|ogg|bin)(?:\?[^"'`\n]*)?)["'`]/g)){const u=m[1];if(u.includes('${')||/^(https?:|data:|blob:)/.test(u))continue;const [name,query]=u.split('?');add(posix(path.resolve(path.dirname(p),name))+(query?'?'+query:''));}}
 // Complete common gameplay sets; large optional collections continue quietly after entry.
 if(game.id==='lucky-town'){candidates.clear();for(const p of list(dir+'/delivery',p=>/\.webp$/.test(p)&&!/(outfit-|furniture-(candy|magic|royal)|theme-(candy|magic|royal)|walk-outfit|lie-outfit|sit-outfit)/.test(p)))add(p);}
 if(game.id==='heartlight-duel'){candidates.clear();for(const p of list(dir+'/packs',p=>/\.bin$/.test(p)))add(p+'?v=20261008-complete2');}
 if(game.id==='richman'){candidates.clear();for(const p of list(dir+'/art',p=>/\.webp$/.test(p)&&(!p.includes('/v8/')||!/\/poses\//.test(p)))){const key=rel(dir,p);add(p+'?r='+revisions[key]);}for(const p of list(dir+'/assets',p=>/\.webp$/.test(p)&&/(speed24|home_scene|setup_scene)/.test(p))){const key=rel(dir,p);add(p+'?r='+revisions[key]);}}
 if(game.id==='fairytale-defense'){candidates.clear();for(const [key,rev] of Object.entries(defenseContext.ASSET_REVISIONS.files)){if(!/\.webp$/.test(key)||/(speed24|thumb|level-[2-9]|level-\d\d)/.test(key))continue;if(/(camp|cover|entry-|button|panel|portrait|hero-|growth|luck|army-|chapter-|play-)/.test(key))add(posix(path.resolve(dir,key))+'?r='+rev);}}
 if(!['lucky-town','richman','heartlight-duel','fairytale-defense'].includes(game.id)){for(const p of list(dir,p=>/\.(webp|svg)$/.test(p)&&!/(source|generation|backup)/.test(p)))add(p);}
 for(const role of roles){add('assets/characters/cxq-role-'+role+'.webp');add('games/shared/character-motion/'+role+'.webp?v=20261009-refresh1');}
 const audioId={twenty48:'2048',brick:'brick-breaker',clickcore:'click-core'}[game.id]||game.id;
 add('games/shared/audio-v3/'+audioId+'.mp3?v=20261009-refresh1');add('games/shared/audio-v2/'+audioId+'.mp3');
 for(const p of list('games/shared/audio-v2',p=>/\/(tap|match|miss|flip|hit|win|lose|upgrade)-[012]\.mp3$/.test(p)))add(p);
 const unique=[...candidates].map(p=>({file:rel(dir,path.resolve(p.split('?')[0]))+(p.includes('?')?'?'+p.split('?')[1]:''),bytes:fs.statSync(p.split('?')[0]).size})).sort((a,b)=>a.bytes-b.bytes);
 // Keep a bounded cold-entry payload. All remaining assets prefetch sequentially in background.
 let bytes=0;const required=[],background=[];const budget=game.id==='heartlight-duel'?18*1024*1024:10*1024*1024;
 const score=unique.filter(x=>x.file.includes('/audio-v3/'));for(const item of score){required.push(item.file);bytes+=item.bytes;}
 for(const item of unique.filter(x=>!score.includes(x))){if(bytes+item.bytes<=budget&&required.length<260){required.push(item.file);bytes+=item.bytes;}else background.push(item.file);}
 const illustration=rel(dir,out+'/'+game.id+'.webp');cfg.scene=illustration;cfg.illustration='';cfg.resources=required;cfg.background=background;cfg.release=version;
 const entries=[],payload=[];let offset=0,originalBytes=0;
 for(const file of required){const data=await packedFile(path.resolve(dir,file.split('?')[0]));entries.push({file,offset,length:data.bytes.length,type:data.type});payload.push(data.bytes);offset+=data.bytes.length;originalBytes+=data.originalBytes;}
 const header=Buffer.from(JSON.stringify({format:1,entries})),prefix=Buffer.alloc(4);prefix.writeUInt32LE(header.length);const pack=Buffer.concat([prefix,header,...payload]),digest=createHash('sha256').update(pack).digest('hex').slice(0,12),parts=[];
 for(let start=0,index=1;start<pack.length;start+=1024*1024,index++){const target=packDir+'/'+game.id+'-'+digest+'-'+index+'.bin';fs.writeFileSync(target,pack.subarray(start,Math.min(pack.length,start+1024*1024)));parts.push(rel(dir,target));}
 cfg.pack={files:parts,bytes:pack.length};
 cfg.files=cfg.files.map(p=>/\.(js|mjs)(\?|$)/.test(p)?p.replace(/\?v=[^"']+$/,'?v='+version):p);
 html=html.replace(old[0],"data-loading='"+JSON.stringify(cfg).replaceAll("'",'&#39;')+"'").replace(/(<script[^>]*src=["'][^"']+\.(?:js|mjs)\?v=)[^"']+/g,'$1'+version);
 html=html.replace(/<link rel="preload" as="image" href="[^"]*loading-art-v2[^"]*" fetchpriority="high">/g,'').replace(/(<title>[^<]*<\/title>)/,`$1<link rel="preload" as="image" href="${illustration}" fetchpriority="high">`);
 fs.writeFileSync(entry,html);report.push({id:game.id,entry,required:required.length,background:background.length,bytes,packFiles:parts.length,packBytes:pack.length,originalBytes,sceneBytes:fs.statSync(out+'/'+game.id+'.webp').size});
}
fs.writeFileSync('outputs/loading-art-20261010/build.json',JSON.stringify({version,report},null,2));console.log(report);
