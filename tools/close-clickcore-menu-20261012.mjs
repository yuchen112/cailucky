import fs from 'node:fs';import{execFileSync}from'node:child_process';
function patch(s){s=s.replace(/"url":"games\/click-core\/index.html\?v=[^"]+"/,'"url":""');s=s.replace('u.id==="fortune"?','u.id==="clickcore"?"暫停開放，等待後續更新":u.id==="fortune"?');s=s.replace('"暫未開放"]','"暫停開放"]');s=s.replace(/("url":"games\/[^"?]+\?v=)[^"]+/g,'$120261012-mobile1');return s;}
fs.writeFileSync('outputs/mobile-release-20261012/root-bundle-release.js',patch(execFileSync('git',['show','HEAD:assets/index-XdRDscQx.js'],{encoding:'utf8',maxBuffer:10e6})));
fs.writeFileSync('assets/index-XdRDscQx.js',patch(fs.readFileSync('assets/index-XdRDscQx.js','utf8')));
for(const file of ['index.html','games/classic-hall/hall.js','games/classic-hall/games.json','games/shared/game-entry-v2.js'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('20261012-classichall2','20261012-mobile1'));
