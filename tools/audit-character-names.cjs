const fs=require('node:fs'),cp=require('node:child_process');
const words=['快樂','夢想','夜晚陪伴','悲傷','信任','回憶','成長','療癒','幸運','希望'];
const files=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(f=>/^(games|assets)\//.test(f)&&/\.(js|mjs|html|json)$/.test(f)&&!f.includes('/art/'));
for(const file of files){const text=fs.readFileSync(file,'utf8').replace(/\\u([a-f\d]{4})/gi,(_,n)=>String.fromCharCode(parseInt(n,16)));const hits=[];
 for(const w of words){let at=-1;while((at=text.indexOf(w,at+1))>=0){const context=text.slice(Math.max(0,at-28),at+70);if(!/ticket|generation|asset-revision/.test(file))hits.push(context);}}
 if(hits.length)console.log(file+'\n'+[...new Set(hits)].join('\n')+'\n');}
