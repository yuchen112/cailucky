import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const version='20261010-richman8';
for(const p of ['assets/index-XdRDscQx.js','index.html']){
 const original=execFileSync('git',['show','HEAD:'+p],{encoding:'utf8',maxBuffer:20e6}),current=fs.readFileSync(p,'utf8');
 const update=p.endsWith('.js')?s=>s.replace(/(games\/cxq-fairytale-richman\/index\.html\?v=)[^"'\s<]+/g,'$1'+version):s=>s.replace(/(index-XdRDscQx\.js\?v=)20261009-refresh1/g,'$1'+version);
 const staged=update(original);if(staged===original)throw Error('Expected release entry was not found: '+p);
 fs.writeFileSync(p,update(current));const hash=execFileSync('git',['hash-object','-w','--stdin'],{input:staged,encoding:'utf8'}).trim();execFileSync('git',['update-index','--cacheinfo','100644,'+hash+','+p]);
 console.log('Staged only richman entry; other working changes retained: '+p);
}
