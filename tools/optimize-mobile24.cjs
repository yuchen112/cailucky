const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
async function main(){
 const report=[];
 for(const name of ['fortune','link','brick','clickcore','twenty48','memory','tetris','bonus','poker']){
  const source='assets/game-covers/'+name+'.png',target='assets/game-covers/'+name+'-mobile24.webp';
  await sharp(source).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(target);
  report.push({source,target,before:fs.statSync(source).size,after:fs.statSync(target).size});
 }
 for(const name of ['luck','healing','growth','memory','joy','night','trust','dream','sadness','hope']){
  const source='assets/characters/cxq-role-'+name+'.webp',target='games/storybook/art-mobile24/portrait-'+name+'.webp';
  await sharp(source).resize({width:384,height:384,fit:'inside',withoutEnlargement:true}).webp({quality:84,alphaQuality:100,effort:6}).toFile(target);
  report.push({source,target,before:fs.statSync(source).size,after:fs.statSync(target).size});
 }
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exit(1)});
