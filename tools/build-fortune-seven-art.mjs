import fs from 'node:fs';import path from 'node:path';import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),root='games/fortune/seven-v3',manifest=JSON.parse(fs.readFileSync(root+'/art-manifest.json'));fs.mkdirSync(root+'/art',{recursive:true});
for(const m of manifest.assets){await sharp(m.source).resize({width:m.id==='return'?640:/^(major|minor|suit)-/.test(m.id)?480:900,withoutEnlargement:true}).webp({quality:85,effort:5}).toFile(path.join(root,m.target));console.log(m.target);}
