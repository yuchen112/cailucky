import fs from 'node:fs';import path from 'node:path';
const roots=fs.readdirSync('games',{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>'games/'+d.name+'/index.html').filter(p=>fs.existsSync(p));
roots.push('games/heartlight-duel/arcade/index.html','games/fairytale-defense/rebuild/army.html');
for(const p of roots){let s=fs.readFileSync(p,'utf8');const relative=path.relative(path.dirname(p),'games/shared/audio-engine-v2.js').replaceAll('\\','/');
 if(!s.includes('audio-engine-v2.js'))s=s.replace('<script',()=>'<script src="'+relative+'?v=20261008-polish3"></script><script');
 if(!s.includes('cxq-input-polish'))s=s.replace('</head>','<style id="cxq-input-polish">button,a,[role="button"]{touch-action:manipulation}button{ -webkit-tap-highlight-color:transparent}canvas{touch-action:none}button:focus-visible,a:focus-visible{outline:3px solid #d7ac52;outline-offset:3px}</style></head>');
 s=s.replaceAll('20261008-upgrade1','20261008-polish3');
 if(p==='games/fortune/index.html'){s=s.replace('"name":"每日占卜"','"target":"website","name":"每日占卜"').replace('games/fortune/art/return-center-v2.webp','games/fortune/art/return-website-v3.webp');}
 fs.writeFileSync(p,s);
}
let p='games/shared/game-entry-v2.js',s=fs.readFileSync(p,'utf8');s=s.replace("art=new URL(cfg.art,root).href;","art=new URL(cfg.art,root).href,label=cfg.target==='website'?'返回網站首頁':'返回遊戲中心',destination=cfg.target==='website'?root.href:new URL('?view=game-hub&v=20261008-polish3',root).href;");s=s.replaceAll("new URL('?view=game-hub&v=20261008-upgrade1',root).href","destination").replaceAll("setAttribute('aria-label','返回遊戲中心')","setAttribute('aria-label',label)").replaceAll("img.alt='返回遊戲中心'","img.alt=label");fs.writeFileSync(p,s);
for(const p of ['index.html','assets/index-XdRDscQx.js','games/cxq-fairytale-richman/sw.js']){let s=fs.readFileSync(p,'utf8').replaceAll('20261008-upgrade1','20261008-polish3');fs.writeFileSync(p,s);}
console.log('Game entries, divination website return and input safeguards updated');
