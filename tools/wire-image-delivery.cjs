// Mechanical URL migration only. Original PNG routes remain valid for old saves/clients.
const fs=require('node:fs'),cp=require('node:child_process');
const files=cp.execFileSync('git',['ls-files','games'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(js|css|html)$/.test(f));
const changed=[];
for(const file of files){let old=fs.readFileSync(file,'utf8'),next=old;
 next=next.replace(/assets\/brand\/[a-zA-Z0-9_-]+\.png|\.png/g,m=>m.startsWith('assets/brand/')?m:'.speed24.webp');
 if(file.endsWith('.html'))next=next.replace(/((?:src|href)=["'])([^"']+\.(?:js|css))(?:\?[^"']*)?(["'])/g,(m,p,url,end)=>/^https?:/.test(url)?m:p+url+'?v=20260924-speed2'+end);
 if(next!==old){fs.writeFileSync(file,next);changed.push(file);}
}
console.log(JSON.stringify(changed));
