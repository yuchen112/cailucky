// Mechanical cache revision update, scoped to the eight reviewed games.
const fs=require('fs'),path=require('path');process.chdir(path.resolve(__dirname,'..'));
const version='20260920-director2',games=['magic-bubble','dream-match','fairytale-defense','whack','merge','flappy','dino','mines'];
for(const game of games){const file='games/'+game+'/index.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/\?v=[^"']+/g,'?v='+version));}
const bundle='assets/index-XdRDscQx.js';let source=fs.readFileSync(bundle,'utf8');
for(const game of games)source=source.replace(new RegExp('url:"games/'+game+'/index\\.html(?:\\?v=[^"]*)?"','g'),'url:"games/'+game+'/index.html?v='+version+'"');
fs.writeFileSync(bundle,source);fs.writeFileSync('index.html',fs.readFileSync('index.html','utf8').replace(/index-XdRDscQx\.js\?v=[^"]+/,'index-XdRDscQx.js?v='+version));
console.log('Updated eight game entries and website bundle revision to '+version);
