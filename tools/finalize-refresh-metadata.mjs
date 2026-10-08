import fs from 'node:fs';
const dir='games/refresh-20261008',jobs=JSON.parse(fs.readFileSync(dir+'/asset-jobs.json'));
const extra=' IMPORTANT: Create a substantially different active attack drawing: the crescent lantern arm reaches diagonally DOWN AND RIGHT, both feet trail behind in an airborne plunge, torso leaning forward 45 degrees. Do not repeat a tucked-knee anticipation pose.';
const night=jobs.find(j=>j.id==='motion-night-air-1');if(!night.prompt.includes('IMPORTANT: Create a substantially different'))night.prompt+=extra;
fs.writeFileSync(dir+'/asset-jobs.json',JSON.stringify(jobs,null,2));
const file=dir+'/records/motion-night-air-1.json',record=JSON.parse(fs.readFileSync(file));record.prompt=night.prompt;fs.writeFileSync(file,JSON.stringify(record,null,2));
const inventory=JSON.parse(fs.readFileSync(dir+'/inventory.json'));inventory.artJobs=jobs.length;inventory.games.find(g=>g.id==='fairytale-defense').url='games/fairytale-defense/index.html?v=20261008-complete1';fs.writeFileSync(dir+'/inventory.json',JSON.stringify(inventory,null,2));
const records=jobs.map(j=>JSON.parse(fs.readFileSync(dir+'/records/'+j.id+'.json')));fs.writeFileSync(dir+'/generated.json',JSON.stringify(records.map(r=>({...r,source:r.source.split(/[\\/]/).pop()})),null,2));
const arcade='games/heartlight-duel/arcade',pack=fs.readFileSync(arcade+'/packs/menu.bin'),header=JSON.parse(pack.subarray(4,4+pack.readUInt32LE(0))),manifest=JSON.parse(fs.readFileSync(arcade+'/art/manifest.json'));
manifest.assets=manifest.assets.filter(a=>!a.newDrawnFrame);
for(const j of jobs.filter(j=>j.type==='motion')){const r=records.find(r=>r.id===j.id),id=j.id.replace('motion-',''),m=header.meta[id];if(!m?.newDrawnFrame)throw Error('Missing final pack metadata '+id);manifest.assets.push({id,file:j.target.replace(arcade+'/',''),source:r.source.split(/[\\/]/).pop(),kind:'motion-v2',prompt:r.prompt,...m});}
manifest.individualAssets=true;manifest.montageExtraction=false;fs.writeFileSync(arcade+'/art/manifest.json',JSON.stringify(manifest,null,2));
console.log('Final metadata: '+jobs.length+' art jobs, '+manifest.assets.length+' arcade art entries');
