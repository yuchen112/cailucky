const fs=require('fs'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),art=JSON.parse(fs.readFileSync(path.join(root,'games/storybook/art-studio/manifest.json')));
assert.equal(art.length,38);assert.equal(new Set(art.map(a=>a.source)).size,38);
for(const a of art)assert(fs.existsSync(path.join(root,'games/storybook/art-studio',a.name+'.webp')),a.name);
const games=['merge','magic-bubble','dream-match','whack','flappy','fairytale-defense','dino','mines'];
for(const game of games){const html=fs.readFileSync(path.join(root,'games',game,'index.html'),'utf8');assert(html.includes('studio.css?v='));assert(html.includes('studio.js?v='));assert(!html.includes('director2'));}
for(const file of ['games/storybook/studio.js','games/storybook/common.js','games/merge/resume.js'])execFileSync(process.execPath,['--check',path.join(root,file)]);
for(const file of ['games/storybook/common.js','games/whack/game.js']){const source=fs.readFileSync(path.join(root,file),'utf8');for(const name of ['幸運','療癒','成長','回憶','快樂','夜晚陪伴','信任','夢想','悲傷','希望'])assert(source.includes(name),file+': '+name);}
console.log('Studio checks passed: 38 unique complete-image sources, 8 versioned integrations, 10 authoritative IP names, shared scripts compile.');
