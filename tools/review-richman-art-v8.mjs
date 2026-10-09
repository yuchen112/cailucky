import fs from 'node:fs';
import vm from 'node:vm';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),root='games/cxq-fairytale-richman/art/v8/',out='outputs/richman-art-20261010/';
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
fs.mkdirSync(out,{recursive:true});
const roles=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'];
const poses=['idle','blink','windup','toss','receive','pay','skill'];
async function sheet(ids,name,columns,cw,ch){
 const rows=Math.ceil(ids.length/columns),composite=[];
 for(let i=0;i<ids.length;i++){const id=ids[i],a=manifest.assets.find(a=>a.id===id);if(!a)throw Error(id);
  composite.push({input:await sharp(root+a.file).resize(cw-20,ch-40,{fit:'contain',background:'#ded5bf'}).png().toBuffer(),left:(i%columns)*cw+10,top:Math.floor(i/columns)*ch+5});
  const label=Buffer.from(`<svg width="${cw}" height="28"><text x="8" y="20" font-size="15" fill="#29201c">${id}</text></svg>`);
  composite.push({input:label,left:(i%columns)*cw,top:Math.floor(i/columns)*ch+ch-28});
 }
 await sharp({create:{width:columns*cw,height:rows*ch,channels:3,background:'#ded5bf'}}).composite(composite).png().toFile(out+name+'.png');
}
for(let i=0;i<roles.length;i+=2)await sheet(roles.slice(i,i+2).flatMap(r=>poses.map(p=>r+'-'+p)),'poses-'+roles[i],7,185,244);
await sheet(manifest.assets.filter(a=>!roles.some(r=>a.id.startsWith(r+'-'))).map(a=>a.id),'worlds-buildings-ui',4,330,255);
const roadLiteral=fs.readFileSync('games/cxq-fairytale-richman/presentation-v8.js','utf8').match(/const RICH_PAINTED_ROADS=(\[[^;]+\]);/)[1],roads=vm.runInNewContext(roadLiteral);
for(const [mi,id]of ['starwish','moonharbor','cloudbazaar'].entries()){const r=roads[mi],m=await sharp(root+'map-'+id+'.webp').metadata();let nodes='';for(let i=0;i<24;i++){const angle=Math.PI/2+i*Math.PI/12,x=r.cx+Math.cos(angle)*r.rx,y=r.cy+Math.sin(angle)*r.ry;nodes+=`<circle cx="${x}" cy="${y}" r="18" fill="#003a65" fill-opacity=".65" stroke="#ffffff" stroke-width="2"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#ffffff" font-size="15">${i+1}</text>`;}const svg=Buffer.from(`<svg width="${m.width}" height="${m.height}">${nodes}</svg>`);await sharp(root+'map-'+id+'.webp').composite([{input:svg}]).png().toFile(out+'route-'+id+'.png');}
console.log('Six art review sheets and three road-alignment proofs created; source artwork was not modified.');
