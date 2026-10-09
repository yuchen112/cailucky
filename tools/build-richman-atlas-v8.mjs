import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),exe=process.env.ASEPRITE_BIN||(process.platform==='win32'?'C:/Program Files/Aseprite/Aseprite.exe':'aseprite');
const native='tools/art-sources/richman-v8',art='games/cxq-fairytale-richman/art/v8',temp='outputs/richman-art-20261010/aseprite',dest=art+'/atlases';
for(const folder of [native,temp,dest])fs.mkdirSync(folder,{recursive:true});
const ids=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'],poses=['idle','blink','windup','toss','receive','pay','skill'],manifest={version:8,independentDrawings:true,montageExtraction:false,characters:{}};
const quote=s=>JSON.stringify(s.replaceAll('\\','/'));
for(const id of ids){
 const ase=path.resolve(native+'/'+id+'.aseprite'),folder=temp+'/'+id;fs.mkdirSync(folder,{recursive:true});
 if(process.argv.includes('--import-poses')){
  const files=[];for(const [i,pose]of poses.entries()){const file=path.resolve(folder+'/'+i+'.png');await sharp(art+'/'+id+'-'+pose+'.webp').png().toFile(file);files.push(file);}
  const lua=path.resolve(folder+'/build.lua');fs.writeFileSync(lua,`local s=Sprite(320,360)\nlocal l=s.layers[1]\nlocal files={${files.map(quote).join(',')}}\nlocal names={${poses.map(quote).join(',')}}\nfor i,f in ipairs(files) do\n if i>1 then s:newEmptyFrame(i) end\n s:newCel(l,i,Image{fromFile=f},Point(0,0))\n s.frames[i].duration=0.12\n s:newTag(i,i).name=names[i]\nend\ns:saveAs(${quote(ase)})\n`);
  execFileSync(exe,['--batch','--script',lua],{windowsHide:true,timeout:120000});
 }
 if(!fs.existsSync(ase))throw Error('Missing native source '+ase+'; use --import-poses for first assembly');
 execFileSync(exe,['--batch',ase,'--sheet-type','rows','--sheet-columns','4','--sheet',path.resolve(folder+'/atlas.png'),'--data',path.resolve(folder+'/atlas.json'),'--format','json-array'],{windowsHide:true,timeout:120000});
 await sharp(folder+'/atlas.png').webp({quality:85,alphaQuality:100}).toFile(dest+'/'+id+'.webp');
 const data=JSON.parse(fs.readFileSync(folder+'/atlas.json'));if(data.frames.length!==7)throw Error(id+' expected 7 frames');
 manifest.characters[id]={atlas:id+'.webp',poses:Object.fromEntries(data.frames.map((frame,i)=>[poses[i],frame.frame]))};console.log(id+' native + 7-pose atlas exported');
}
fs.writeFileSync(dest+'/manifest.json',JSON.stringify(manifest,null,2));
