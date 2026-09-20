const fs=require('fs'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const games=['merge','magic-bubble','dream-match','whack','flappy','fairytale-defense','dino','mines'];
let assertions=0;const check=(ok,msg)=>{assert(ok,msg);assertions++};
for(const game of games){const dir=path.join(root,'games',game),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');check(html.includes('director.css'),'director style missing: '+game);check(html.includes('game-settings.js'),'settings missing: '+game);for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){if(m[1].startsWith('http'))continue;check(fs.existsSync(path.resolve(dir,m[1])),'Missing page dependency '+game+': '+m[1]);}execFileSync(process.execPath,['--check',path.join(dir,'game.js')]);}
for(const name of ['game-settings','game-entry','mobile-menu','play-session'])execFileSync(process.execPath,['--check',path.join(root,'games/storybook',name+'.js')]);
const art=JSON.parse(fs.readFileSync(path.join(root,'games/storybook/art-director/manifest.json')));
check(art.length===40,'Expected 40 independently generated images');check(new Set(art.map(a=>a.source)).size===art.length,'Reused source / sliced artwork');
for(const a of art)check(fs.existsSync(path.join(root,'games/storybook/art-director',a.name+'.webp')),'Missing art '+a.name);
const cleanup=JSON.parse(fs.readFileSync(path.join(__dirname,'director-obsolete-assets.json')));
for(const file of cleanup.files)check(!fs.existsSync(path.join(root,file)),'Obsolete export retained '+file);
console.log('Director integration: '+assertions+' assertions passed; 8 game scripts compile; 40 unique image sources; '+cleanup.files.length+' obsolete files removed.');
