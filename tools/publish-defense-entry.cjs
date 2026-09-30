// Scoped mechanical release rewrite. Refuse unexpected source instead of editing other games.
const fs=require('node:fs');
const bundle='assets/index-XdRDscQx.js';
const old='{id:"fairytale-defense",title:"CxQ 童話塔防",label:"童話塔防 · 暫未開放",cover:"assets/game-covers/fairytale-defense.webp?v=20260920"}';
const next='{id:"fairytale-defense",title:"CxQ 童話塔防",label:"英雄守護 · 重製試玩",url:"games/fairytale-defense/index.html?v=20261001-evolution1",cover:"assets/game-covers/fairytale-defense.webp?v=20260920"}';
let s=fs.readFileSync(bundle,'utf8');if(!s.includes(next)){if(s.split(old).length!==2)throw Error('Expected one closed tower card');fs.writeFileSync(bundle,s.replace(old,next));}
const html='games/fairytale-defense/rebuild/army.html';s=fs.readFileSync(html,'utf8').replace('重製開發版 · 進度自動保存在此瀏覽器','重製試玩版 · 進度自動保存在此瀏覽器').replace('>開發試玩<','>準備守護<').replace('此試玩與舊版分開存檔。','此版本與舊版分開存檔。');fs.writeFileSync(html,s);
