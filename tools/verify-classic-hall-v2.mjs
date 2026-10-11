import fs from 'node:fs';
import assert from 'node:assert/strict';
import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),base='games/classic-hall/',dir=base+'art-v2/';
const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json'));
assert.equal(manifest.assets.length,33);
assert.equal(new Set(manifest.assets.map(x=>x.source)).size,33);
for(const a of manifest.assets){const buf=fs.readFileSync(dir+a.file),m=await sharp(buf).metadata();assert.equal(buf.length,a.bytes);assert.equal(m.width,a.width);assert.equal(m.height,a.height);await sharp(buf).raw().toBuffer();if(!['hall','cover'].includes(a.id))assert(m.hasAlpha,a.id+' alpha');}
const games=JSON.parse(fs.readFileSync(base+'games.json'));assert.equal(games.length,12);
for(const g of games){const html=fs.readFileSync(base+g.url.split('?')[0],'utf8');assert(!html.includes('\0'));const c=JSON.parse(html.match(/data-game='([^']+)'/)[1]);assert.equal(c.bakedText,true);assert.equal(c.art,'games/classic-hall/art-v2/return-'+g.id+'.webp');assert(g.url.endsWith('20261012-classichall2'));assert(html.includes('../classic-hall/art-v2/return-'+g.id+'.webp'));}
const html=fs.readFileSync(base+'index.html','utf8'),cfg=JSON.parse(html.match(/data-loading='([^']+)'/)[1]);for(const f of cfg.files)assert(fs.existsSync(base+f.split('?')[0]),f);
for(const p of ['hall.css','hall.js','index.html','games.json'])assert(!fs.readFileSync(base+p).includes(0),p);
const js=fs.readFileSync(base+'hall.js','utf8');assert(!js.includes('machine-label'));assert(js.includes('b.append(img)'));
const groups=[games.map(g=>g.id),manifest.assets.filter(a=>a.id.startsWith('return-')).map(a=>a.id),['title','return','play','sound-on','sound-off','close','panel','cover','hall']];
for(let n=0;n<groups.length;n++){const ids=groups[n],w=n===0?340:500,h=n===0?460:260,cols=3,rows=Math.ceil(ids.length/cols),items=[];for(let i=0;i<ids.length;i++){const b=await sharp(dir+ids[i]+'.webp').resize(w,h,{fit:'contain',background:'#e9e2cf'}).png().toBuffer();items.push({input:b,left:(i%cols)*w,top:Math.floor(i/cols)*h});}await sharp({create:{width:cols*w,height:rows*h,channels:3,background:'#e9e2cf'}}).composite(items).png().toFile('outputs/classic-hall-20261012/contact-'+n+'.png');}
console.log('33 art assets decoded; 12 routes and baked return buttons verified; '+cfg.files.length+' loading files present.');
