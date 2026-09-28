// Mechanical cache-key update: only changed resources, not every image.
const fs=require('node:fs');
const revision='20260929-mobile1';
const pages=fs.readdirSync('games',{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>'games/'+e.name+'/index.html').filter(p=>fs.existsSync(p)&&!p.includes('cxq-fairytale-richman')&&!p.includes('fairytale-defense'));
for(const file of pages){
 let src=fs.readFileSync(file,'utf8'),next=src.replace(/((?:\.\.\/shared\/runtime\.(?:css|js)|\.\.\/storybook\/(?:studio\.js|polish\.css))\?v=)[^"'\s>]+/g,'$1'+revision);
 if(file.includes('/dream-match/'))next=next.replace(/(game\.js\?v=)[^"'\s>]+/g,'$1'+revision);
 if(file.includes('/mines/'))next=next.replace(/(mobile24\.js\?v=)[^"'\s>]+/g,'$1'+revision);
 if(file.includes('/click-core/'))next=next.replace(/(src\/game\.js\?v=)[^"'\s>]+/g,'$1'+revision);
 if(src!==next){fs.writeFileSync(file,next);console.log(file);}
}
const bundle='assets/index-XdRDscQx.js',src=fs.readFileSync(bundle,'utf8');
const next=src.replace(/(games\/(?:2048|brick-breaker|click-core|dino|dream-match|flappy|fortune|link|magic-bubble|memory|merge|mines|tetris|whack)\/index\.html\?v=)[^"]+/g,'$1'+revision);
if(src!==next)fs.writeFileSync(bundle,next);
const index=fs.readFileSync('index.html','utf8');
fs.writeFileSync('index.html',index.replace(/(index-XdRDscQx\.js\?v=)[^"']+/g,'$1'+revision));
