const fs=require('fs'),path=require('path'),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../games/storybook/art-polish');
(async()=>{for(const a of JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'))){const out=path.join(dir,a.name+'.webp');if(fs.existsSync(out))continue;await sharp(a.source).resize({width:1200,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toFile(out);console.log(a.name);}})().catch(e=>{console.error(e);process.exitCode=1});
