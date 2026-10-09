import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {toolDependency} from './refresh-deps.mjs';
const esbuild=toolDependency('esbuild'),sharp=toolDependency('sharp'),version='20261010-loading1',root=process.cwd();
const hash=b=>createHash('sha256').update(b).digest('hex').slice(0,12),read=p=>fs.readFileSync(p,'utf8'),posix=p=>p.replaceAll('\\','/');
const rich='games/cxq-fairytale-richman';fs.mkdirSync(rich+'/art/v8/previews',{recursive:true});
const previews=[];for(const map of ['starwish','moonharbor','cloudbazaar']){const src=rich+'/art/v8/map-'+map+'.webp',out=rich+'/art/v8/previews/map-'+map+'.webp';await sharp(src).resize({width:640,withoutEnlargement:true}).webp({quality:66,effort:6}).toFile(out);previews.push({map,originalBytes:fs.statSync(src).size,previewBytes:fs.statSync(out).size});}
const revisions={};for(const dir of ['assets','art'])for(const file of fs.readdirSync(rich+'/'+dir,{recursive:true})){const p=posix(dir+'/'+file);if(/\.(?:webp|png|jpe?g|svg)$/i.test(p))revisions[p]=hash(fs.readFileSync(rich+'/'+p));}fs.writeFileSync(rich+'/asset-versions-v1.js','globalThis.CxQRichmanAssetVersions='+JSON.stringify(revisions)+';\n');
let richHTML=read(rich+'/index.html');if(!richHTML.includes('asset-versions-v1.js'))richHTML=richHTML.replace('<script defer src="core.js',`<script defer src="asset-versions-v1.js?v=${version}"></script><script defer src="core.js`);fs.writeFileSync(rich+'/index.html',richHTML);
// Stable content addresses keep unchanged art reusable across code releases.
let sw=read(rich+'/sw.js').replace(/20261010-richman8/g,version).replace("caches.open(CACHE),hit=await cache.match(req)","caches.open('cxq-art-richman-v1'),hit=await cache.match(req)");if(!sw.includes('./asset-versions-v1.js'))sw=sw.replace("const SHELL=[",`const SHELL=['./asset-versions-v1.js?v=${version}',`);fs.writeFileSync(rich+'/sw.js',sw);
const clean={name:'local-module-queries',setup(b){b.onResolve({filter:/\.mjs\?v=/},a=>({path:path.resolve(a.resolveDir,a.path.split('?')[0])}));}};
for(const [dir,entry,out] of [['games/lucky-town','app.mjs','game-v2.bundle.mjs'],['games/heartlight-duel/arcade','app.mjs','game-v2.bundle.mjs'],['games/fairytale-defense/rebuild','army-ui.mjs','army-bundle.mjs'],['games/poker','app.mjs','app.bundle.mjs'],['games/fortune/seven-v3','app.mjs','app.bundle.mjs']]){
 const plugins=[clean];if(dir==='games/lucky-town')plugins.push({name:'town-delivery',setup(b){b.onLoad({filter:/games[\\/]lucky-town[\\/].*\.mjs$/},a=>({contents:read(a.path).replace(/(["'`])art\//g,'$1delivery/'),loader:'js'}));}});
 await esbuild.build({entryPoints:[dir+'/'+entry],bundle:true,minify:true,format:'esm',target:'es2022',outfile:dir+'/'+out,plugins});
}
let pokerHTML=read('games/poker/index.html').replace(/src="app\.mjs\?v=[^"]+"/,`src="app.bundle.mjs?v=${version}"`);fs.writeFileSync('games/poker/index.html',pokerHTML);
for(const id of ['dino','flappy','merge','mines','whack','dream-match','magic-bubble']){const dir='games/'+id,plan=JSON.parse(read(dir+'/upgrade-build.json')),source="'use strict';\n"+plan.scripts.map(p=>read(path.resolve(dir,p))+'\n;').join('\n');fs.writeFileSync(dir+'/game-upgrade.bundle.js',(await esbuild.transform(source,{target:'es2020',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'none'})).code);}
const inventory=JSON.parse(read('games/refresh-20261008/inventory.json')).games;
const colors={ 'heartlight-duel':['#17233b','#fff3b6','#d65d81'], 'lucky-town':['#fff4df','#584137','#b49454'],richman:['#193c3c','#fff2bf','#d8b76e'],fortune:['#f4eef8','#4b3a68','#a184b4'], 'fairytale-defense':['#eef5df','#304731','#87a55e'],poker:['#142d36','#f9edbd','#c4a765'],dino:['#f8efe2','#574231','#94ad73'],flappy:['#edf5ff','#384e70','#80a9cc'],whack:['#fff2dc','#64452e','#b88550'],mines:['#e9eff9','#414962','#9c93c2'],'dream-match':['#f4edfa','#58456f','#ae93d0'],'magic-bubble':['#f2ecfa','#554771','#8eacd7'],merge:['#faedf3','#664452','#d391aa']};
const previous=fs.existsSync('outputs/loading-20261010/build.json')?JSON.parse(fs.readFileSync('outputs/loading-20261010/build.json','utf8')):{games:[]};const report=[];
for(const game of inventory){
 const entry=game.id==='fairytale-defense'?'games/fairytale-defense/rebuild/army.html':game.url.split('?')[0],dir=path.dirname(entry);let html=read(entry);
 html=html.replace(/<script[^>]*data-loading='[^']*'[^>]*><\/script>/g,'');
 // Refresh code URLs only. Images keep their existing/content-based cache keys.
 html=html.replace(/(<script\b[^>]*src=["'][^"']+)(["'])/g,(_,p,q)=>p.replace(/\?v=[^"']+$/,'')+'?v='+version+q);
 const cssLinks=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g)].map(m=>({tag:m[0],url:m[0].match(/href=["']([^"']+)/)?.[1]})).filter(l=>l.url&&!/^https?:/.test(l.url));
 let cssFiles=cssLinks.map(l=>l.url),homeCSS='';
 if(cssLinks.length>1){
  const combined=cssLinks.map(l=>{const p=path.resolve(dir,l.url.split('?')[0]);return read(p).replace(/url\((["']?)([^)'"\s]+)\1\)/g,(m,q,u)=>{if(/^(data:|https?:|#)/.test(u))return m;const [name,search]=u.split('?');return `url(${q}${posix(path.relative(dir,path.resolve(path.dirname(p),name)))}${search?'?'+search:''}${q})`;});}).join('\n');
  homeCSS=combined;const name='loading-ui.bundle.css';fs.writeFileSync(dir+'/'+name,(await esbuild.transform(combined,{loader:'css',minify:true})).code);html=html.replace(cssLinks[0].tag,`<link rel="stylesheet" href="${name}?v=${version}">`);for(const l of cssLinks.slice(1))html=html.replace(l.tag,'');cssFiles=[name+'?v='+version];
 }else homeCSS=cssLinks.map(l=>read(path.resolve(dir,l.url.split('?')[0]))).join('\n');
 const codeFiles=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)/g)].map(m=>m[1]);
 const validImage=u=>{if(!u||u.includes('${')||u.includes('data:')||/^https?:/.test(u)||!/\.(webp|png|jpg|jpeg|svg)(?:\?|$)/i.test(u))return false;try{return fs.statSync(path.resolve(dir,decodeURI(u.split('?')[0]))).isFile();}catch{return false;}};
 let images=[...html.matchAll(/<img[^>]*src=["']([^"']+)/g)].map(m=>m[1]).filter(validImage).slice(0,3);
 const cssArt=[...homeCSS.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]).filter(validImage).slice(0,2);images.push(...cssArt);
 if(game.id==='lucky-town')images=['delivery/cover-landscape.webp','delivery/coin.webp'];
 if(game.id==='fairytale-defense')images=['art/cover.webp','art/title.webp','art/camp-living.webp'].filter(validImage);
 if(game.id==='fortune')images=['seven-v3/art/tarot.webp','seven-v3/art/return.webp'].filter(validImage);
 if(['heartlight-duel','richman'].includes(game.id))images=[];
 images=[...new Set(images)];const [paper,ink,accent]=colors[game.id]||['#f1f1fa','#4c4a6e','#9b9ccc'];
 const config={id:game.id,label:'準備 CxQ '+(game.id==='fortune'?'占卜館':game.name),files:[...new Set([...cssFiles,...codeFiles,...images])],images,illustration:images.find(u=>!/(scene|backdrop|cover|background|camp)/.test(u))||'',colors:{paper,ink,accent}};
 const shared=posix(path.relative(dir,'games/shared/load-progress-v1.js'));
 html=html.replace(/(<title>[^<]*<\/title>)/,`$1<script src="${shared}?v=${version}" data-loading='${JSON.stringify(config).replaceAll("'",'&#39;')}'></script>`);
 // Old text placeholders are covered by the real declared-file meter.
 html=html.replace('正在打開小鎮的大門…','準備遊戲檔案…');
 if(game.id==='richman')html=html.replaceAll('20261010-richman8',version);
 fs.writeFileSync(entry,html);report.push({id:game.id,entry,files:config.files,images,cssRequestsBefore:previous.games.find(g=>g.id===game.id)?.cssRequestsBefore??cssLinks.length,cssRequestsAfter:cssFiles.length});
}
fs.mkdirSync('outputs/loading-20261010',{recursive:true});fs.writeFileSync('outputs/loading-20261010/build.json',JSON.stringify({version,previews,games:report},null,2));
console.log(JSON.stringify({games:report.length,previews,cssRequestsRemoved:report.reduce((n,g)=>n+g.cssRequestsBefore-g.cssRequestsAfter,0)}));
