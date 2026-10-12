import fs from 'node:fs';import path from 'node:path';
const root='games',out='outputs/mobile-release-20261012';fs.mkdirSync(out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const entries=[];
for(const file of walk(root).filter(f=>f.endsWith('.html'))){const text=fs.readFileSync(file,'utf8'),m=text.match(/data-loading='([^']+)'/);if(!m)continue;const cfg=JSON.parse(m[1].replaceAll('&#39;',"'")),files=[...new Set([...cfg.files||[],...cfg.pack?.files||[],cfg.scene].filter(Boolean))];let bytes=0;const missing=[];for(const f of files){const p=path.resolve(path.dirname(file),f.split('?')[0]);if(fs.existsSync(p))bytes+=fs.statSync(p).size;else missing.push(f);}entries.push({file:file.replaceAll('\\','/'),id:cfg.id||'classic-hall',label:cfg.label,files:files.length,bytes,packBytes:cfg.pack?.bytes||0,resources:cfg.resources?.length||0,missing});}
fs.writeFileSync(out+'/baseline.json',JSON.stringify(entries,null,2));console.log(JSON.stringify(entries,null,2));
