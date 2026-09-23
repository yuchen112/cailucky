// Delivery-only optimization: preserve exact dimensions, transparency and all original PNGs.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const files=cp.execFileSync('git',['ls-files','games','assets/characters'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(png|webp)$/i.test(f)&&!f.includes('.speed24.'));
const report=[],jobs=new Map();let cursor=0,done=0;
async function encode(file){
 const raw=fs.readFileSync(file),isPNG=file.endsWith('.png'),key=crypto.createHash('sha256').update(raw).digest('hex')+(isPNG?'png':'webp');
 if(!jobs.has(key))jobs.set(key,(async()=>{const meta=await sharp(raw).metadata();if(meta.pages>1)return {skip:'animated'};
 const out=await sharp(raw).webp({quality:isPNG?90:84,alphaQuality:100,effort:4}).toBuffer();
 const next=await sharp(out).metadata();if(next.width!==meta.width||next.height!==meta.height||Boolean(next.hasAlpha)!==Boolean(meta.hasAlpha))throw Error('Geometry/alpha changed: '+file);
 return {out,width:meta.width,height:meta.height,alpha:meta.hasAlpha};})());
 const result=await jobs.get(key);if(result.skip)return;
 if(!isPNG&&(raw.length<80000||result.out.length>raw.length*.82))return;
 const target=isPNG?file.replace(/\.png$/,'.speed24.webp'):file;
 if(!isPNG){const backup=path.resolve('..','asset-originals-speed24',file);fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.copyFileSync(file,backup);}
 fs.writeFileSync(target,result.out);report.push({source:file,target,before:raw.length,after:result.out.length,width:result.width,height:result.height,alpha:result.alpha});
}
async function worker(){while(cursor<files.length){const file=files[cursor++];await encode(file);if(++done%100===0)console.log('Checked '+done+'/'+files.length)}}
Promise.all(Array.from({length:4},worker)).then(()=>{fs.writeFileSync('tools/image-delivery-speed24.json',JSON.stringify({format:'WebP; original dimensions and alpha retained; no cropping',files:report},null,2));console.log(JSON.stringify({checked:files.length,optimized:report.length,before:report.reduce((s,r)=>s+r.before,0),after:report.reduce((s,r)=>s+r.after,0)}));}).catch(e=>{console.error(e);process.exitCode=1});
