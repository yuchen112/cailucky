const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs'),path=require('node:path');
async function main(){const [source,target,width='512',quality='84']=process.argv.slice(2);if(!source||!target)throw Error('source and target required');fs.mkdirSync(path.dirname(target),{recursive:true});const meta=await sharp(source).metadata();await sharp(source).resize({width:+width,height:+width,fit:'inside',withoutEnlargement:true}).webp({quality:+quality,alphaQuality:100,effort:6}).toFile(target);console.log(JSON.stringify({target,alpha:meta.hasAlpha,bytes:fs.statSync(target).size}));}
main().catch(e=>{console.error(e);process.exit(1)});
