import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),out='outputs/richman-art-20261010/production-hashes.json';
const paths=execFileSync('git',['diff','--name-only','HEAD^','HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>p.startsWith('games/cxq-fairytale-richman/')||p==='index.html'||p==='assets/index-XdRDscQx.js');
const hash=b=>createHash('sha256').update(b).digest('hex');let cursor=0;const results=[];
await Promise.all(Array.from({length:6},async()=>{while(cursor<paths.length){const p=paths[cursor++],expected=hash(execFileSync('git',['show',sha+':'+p],{maxBuffer:30e6}));let r;for(let attempt=0;attempt<3;attempt++){try{const response=await fetch('https://yuchen112.github.io/cailucky/'+p+'?verify='+sha,{signal:AbortSignal.timeout(120000)}),actual=hash(Buffer.from(await response.arrayBuffer()));r={path:p,status:response.status,match:response.ok&&actual===expected};if(r.match)break;}catch(e){r={path:p,match:false,error:e.message};}}results.push(r);if(results.length%25===0)console.log(results.length+' files checked');}}));
fs.writeFileSync(out,JSON.stringify({sha,checkedAt:new Date().toISOString(),results},null,2));const failed=results.filter(r=>!r.match);console.log(JSON.stringify({sha,total:results.length,passed:results.length-failed.length,failed}));if(failed.length)process.exitCode=1;
