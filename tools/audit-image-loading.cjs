const fs=require('node:fs'),cp=require('node:child_process');
const bin='C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const pages=['cxq-fairytale-richman','magic-bubble','dream-match','fairytale-defense','whack','merge','flappy','dino','mines','2048','brick-breaker','click-core','fortune','link','memory','tetris'];
const session=process.argv[2]||'speed24baseline';
function ab(...args){return cp.execFileSync(bin,['--session',session,...args],{encoding:'utf8',timeout:60000}).trim()}
const results=[];
for(const game of pages){try{
 ab('open','http://127.0.0.1:4173/games/'+game+'/');ab('wait','--load','networkidle');
 const raw=ab('eval',`({title:document.title,images:performance.getEntriesByType('resource').filter(e=>/\\.(png|webp|jpg|jpeg|avif)(\\?|$)/i.test(e.name)).map(e=>({url:e.name.replace(location.origin,''),bytes:e.encodedBodySize,transfer:e.transferSize,duration:Math.round(e.duration)})),broken:[...document.images].filter(e=>e.complete&&e.currentSrc&&!e.naturalWidth).map(e=>e.currentSrc),errors:[]})`);
 const data=JSON.parse(raw);data.game=game;data.errors=ab('errors');results.push(data);
 console.log(JSON.stringify({game,count:data.images.length,KB:Math.round(data.images.reduce((n,e)=>n+e.bytes,0)/1024),broken:data.broken,errors:data.errors}));
 }catch(e){results.push({game,error:String(e.message)});console.log(game+': '+e.message)}}
fs.writeFileSync('preview/'+session+'.json',JSON.stringify(results,null,2));ab('close');
