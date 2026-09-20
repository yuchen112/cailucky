const fs=require('fs'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'games/storybook/art-polish/manifest.json')));
assert.equal(manifest.length,15);assert.equal(new Set(manifest.map(a=>a.source)).size,15);
for(const a of manifest)assert(fs.existsSync(path.join(root,'games/storybook/art-polish',a.name+'.webp')));
const games=['merge','magic-bubble','dream-match','whack','flappy','fairytale-defense','dino','mines'];
for(const id of games){const html=fs.readFileSync(path.join(root,'games',id,'index.html'),'utf8');assert(html.includes('polish.css?v=20260921-polish1'));assert(html.includes('polish.js?v=20260921-polish1'));assert(!html.includes('studio1'));}
for(const file of ['games/storybook/polish.js','games/storybook/common.js','games/magic-bubble/game.js','games/dream-match/game.js','games/whack/game.js'])execFileSync(process.execPath,['--check',path.join(root,file)]);
const css=fs.readFileSync(path.join(root,'games/storybook/polish.css'),'utf8');assert(!/gradient\(/.test(css));assert(!/border-image/.test(css));
for(const match of css.matchAll(/url\('([^']+)'\)/g))assert(fs.existsSync(path.resolve(root,'games/storybook',match[1])),match[1]);
assert.equal(fs.readdirSync(path.join(root,'games/storybook/art-polish')).filter(f=>f.endsWith('.webp')).length,15);
console.log('Polish integration passed: 15 unique full-image assets, eight versioned pages, no gradient/atlas skins, no rejected exports, scripts compile.');
