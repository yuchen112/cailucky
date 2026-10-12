import fs from 'node:fs';
import path from 'node:path';
import {toolDependency} from './refresh-deps.mjs';

const sharp=toolDependency('sharp');
const root='games/shared/loading-art-v2';
const output='outputs/mobile-release-20261012';
const ids=['twenty48','brick','richman','dino','dream-match','fairytale-defense','flappy','fortune','heartlight-duel','link','lucky-town','magic-bubble','memory','merge','mines','poker','tetris','whack','classic-hall'];
const assets=[];
for(const id of ids){
 const source=path.join(root,`portrait-${id}.png`),target=path.join(root,`portrait-${id}.webp`);
 if(!fs.existsSync(source))throw Error(`Missing generated portrait art: ${source}`);
 await sharp(source).resize({height:1536,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(target);
 const meta=await sharp(target).metadata();
 assets.push({id,file:`portrait-${id}.webp`,source:path.basename(source),width:meta.width,height:meta.height,bytes:fs.statSync(target).size,brief:'Independent portrait mobile loading illustration with a clear lower information plaque; built-in image_gen source, never cropped from a shared montage.'});
}
fs.writeFileSync(path.join(root,'mobile-portrait-manifest.json'),JSON.stringify({version:'20261012-mobile1',generator:'built-in image_gen',individualAssets:true,montageExtraction:false,assets},null,2));
fs.mkdirSync(output,{recursive:true});
const tiles=[];for(const asset of assets){const tile=await sharp(path.join(root,asset.file)).resize({width:256,height:384,fit:'cover'}).composite([{input:Buffer.from(`<svg width="256" height="38"><rect width="256" height="38" fill="#1b1539" fill-opacity=".85"/><text x="12" y="25" fill="#fff4d1" font-size="18" font-family="sans-serif">${asset.id}</text></svg>`),top:346,left:0}]).png().toBuffer();tiles.push({input:tile});}
await sharp({create:{width:1024,height:1920,channels:4,background:'#17122d'}}).composite(tiles.map((tile,index)=>({...tile,left:(index%4)*256,top:Math.floor(index/4)*384}))).png().toFile(path.join(output,'portrait-contact-sheet.png'));
console.log(JSON.stringify({assets:assets.length,bytes:assets.reduce((sum,x)=>sum+x.bytes,0),manifest:path.join(root,'mobile-portrait-manifest.json')},null,2));
