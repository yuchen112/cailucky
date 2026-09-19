const fs=require('fs'),path=require('path'),cp=require('child_process');
const ids=['magic-bubble','dream-match','fairytale-defense','whack','merge','flappy','dino','mines'];
const root=path.resolve(__dirname,'..'),errors=[],files=new Set();
function visit(file){if(files.has(file)||!fs.existsSync(file))return;files.add(file);const text=fs.readFileSync(file,'utf8');const pattern=file.endsWith('.html')?/(?:src|href)=["']([^"']+)["']/g:/url\(['"]?([^)'"\s]+)['"]?\)/g;for(const m of text.matchAll(pattern)){const url=m[1].split(/[?#]/)[0];if(!url||/^(https?:|data:|#)/.test(url))continue;const target=path.resolve(path.dirname(file),url);if(!fs.existsSync(target))errors.push(path.relative(root,file)+' -> '+url);else if(/\.(?:html|css)$/.test(target))visit(target);}}
for(const id of ids){visit(path.join(root,'games',id,'index.html'));cp.execFileSync(process.execPath,['--check',path.join(root,'games',id,'game.js')]);}
for(const file of ['common.js','game-entry.js','play-session.js','mobile-menu.js'])cp.execFileSync(process.execPath,['--check',path.join(root,'games/storybook',file)]);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'games/storybook/art-20260920-batch/manifest.json')));
for(const a of manifest)if(!fs.existsSync(path.join(root,'games/storybook/art-20260920-batch',a.name+'.webp')))errors.push('Missing generated asset: '+a.name);
console.log(JSON.stringify({games:ids.length,staticFiles:files.size,individualNewAssets:manifest.length,errors},null,2));process.exitCode=errors.length?1:0;
