const fs=require('fs'),assert=require('node:assert/strict');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const version='20261007-arcade2',bundle='assets/index-XdRDscQx.js';
(async()=>{
const old='id:"heartlight-duel",title:"CxQ 心光對決",label:"十位夥伴・童話格鬥武鬥祭",cover:"assets/game-covers/heartlight-duel.webp?v=20261007-duel6",url:"games/heartlight-duel/index.html?v=20261007-duel6"';
const next=`id:"heartlight-duel",title:"CxQ 心光對決",label:"十位心光角色・橫向街機格鬥",cover:"assets/game-covers/heartlight-duel.webp?v=${version}",url:"games/heartlight-duel/arcade/index.html?v=${version}"`;
let code=fs.readFileSync(bundle,'utf8');assert.equal(code.split(old).length,2,'Expected one original game record');code=code.replace(old,next);fs.writeFileSync(bundle,code);
let root=fs.readFileSync('index.html','utf8');assert(root.includes('index-XdRDscQx.js?v=20261007-duel6'));root=root.replace('index-XdRDscQx.js?v=20261007-duel6','index-XdRDscQx.js?v='+version);fs.writeFileSync('index.html',root);
await sharp('games/heartlight-duel/arcade/art/thumbnail.webp').resize({width:640,withoutEnlargement:true}).webp({quality:90}).toFile('assets/game-covers/heartlight-duel.webp');
fs.writeFileSync('games/heartlight-duel/index.html',`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CxQ 心光對決 · 街機新版</title><meta http-equiv="refresh" content="0;url=./arcade/index.html?v=${version}"><script>location.replace('./arcade/index.html?v=${version}'+location.hash);</script></head><body><a href="./arcade/index.html?v=${version}">點擊開始遊戲：心光對決街機新版</a></body></html>\n`);
console.log('Updated only heartlight-duel game card, full square thumbnail, root cache version and legacy redirect');
})();
