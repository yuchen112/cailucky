import fs from 'node:fs';
let p='games/lucky-town/audio.mjs',s=fs.readFileSync(p,'utf8');s=s.replace('export function status(){return{','export function status(){if(engine)return engine.status();return{');fs.writeFileSync(p,s);
p='games/fairytale-defense/rebuild/audio.mjs';s=fs.readFileSync(p,'utf8').replace('debug(){return {unlocked','debug(){if(engine)return engine.status();return {unlocked');fs.writeFileSync(p,s);
p='assets/index-XdRDscQx.js';s=fs.readFileSync(p,'utf8');s=s.replace('const src=animated&&ready?', 'const src=animated?');s=s.replace('src,alt:"",draggable:"false",loading:animated?', 'src,onError:e=>{if(e.currentTarget.src!==base)e.currentTarget.src=base},alt:"",draggable:"false",loading:animated?');fs.writeFileSync(p,s);
s=fs.readFileSync('tools/test-upgrade-regressions.mjs','utf8').replace('games/upgrade-20261008/regression-results.json','games/polish-20261008/regression-results.json');fs.writeFileSync('tools/test-polish-regressions.mjs',s);
