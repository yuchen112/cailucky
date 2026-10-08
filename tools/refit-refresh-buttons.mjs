import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const dir='games/refresh-20261008',jobs=JSON.parse(fs.readFileSync(dir+'/asset-jobs.json'));
for(const j of jobs.filter(j=>j.type==='button')){const r=JSON.parse(fs.readFileSync(dir+'/records/'+j.id+'.json'));execFileSync(process.execPath,['tools/import-refresh-asset.mjs',j.id,r.source],{stdio:'inherit'});}
console.log('Removed only transparent outer margins from 19 independent button artworks');
