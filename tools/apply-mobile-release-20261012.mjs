import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {toolDependency} from './refresh-deps.mjs';
const sharp=toolDependency('sharp'),release='20261012-mobile1',out='outputs/mobile-release-20261012';
const entries=JSON.parse(fs.readFileSync(out+'/baseline.json'));
const report=[];
for(const e of entries){if(e.id==='clickcore')continue;let html=fs.readFileSync(e.file,'utf8');const m=html.match(/data-loading='([^']+)'/);const source=execFileSync('git',['show','HEAD:'+e.file],{encoding:'utf8'});const sourceMatch=source.match(/data-loading='([^']+)'/),cfg=JSON.parse(sourceMatch[1].replaceAll('&#39;',"'"));const sourceFiles=[...(cfg.files||[])];
 cfg.deferredResources=[...new Set([...(cfg.resources||[]),...(cfg.background||[])])];delete cfg.pack;cfg.resources=[];cfg.background=[];cfg.release=release;
 cfg.images=[...new Set(cfg.images||[])];cfg.files=[...new Set(cfg.files||[])];
 if(e.id==='classic-hall'){cfg.scene='art-v2/panel.webp';cfg.layout={left:15,top:30,width:70,height:30};cfg.files=sourceFiles.filter(f=>/(hall\.css|hall\.js|audio-engine-v2\.js)/.test(f));cfg.deferredResources=[...new Set([...cfg.deferredResources,...sourceFiles.filter(f=>!cfg.files.includes(f))])];}else cfg.layout={left:25,top:65,width:50,height:23};
 const portrait='../../shared/loading-art-v2/portrait-'+e.id+'.webp';
 if(fs.existsSync(path.resolve(path.dirname(e.file),portrait))){cfg.landscapeScene=cfg.scene;cfg.portraitScene=portrait;cfg.portraitLayout={left:15,top:64,width:70,height:24};}
 const imagePath=path.resolve(path.dirname(e.file),cfg.scene),meta=await sharp(imagePath).metadata();cfg.aspect=meta.width/meta.height;
 cfg.sizes={};for(const f of [...cfg.files,cfg.scene]){const p=path.resolve(path.dirname(e.file),f.split('?')[0]);if(fs.existsSync(p))cfg.sizes[f]=fs.statSync(p).size;}if(cfg.portraitScene){const p=path.resolve(path.dirname(e.file),cfg.portraitScene);cfg.sizes[cfg.portraitScene]=fs.statSync(p).size;}
 html=html.replace(/<script defer src="[^"]*mobile-performance-v1\.js\?v=[^"]+"><\/script>/g,'').replace(m[0],"data-loading='"+JSON.stringify(cfg)+"'").replace(/load-progress-v1\.js\?v=[^"']+/g,'load-progress-v1.js?v='+release);
 const runtime=path.relative(path.dirname(e.file),'games/shared/mobile-performance-v1.js').replaceAll('\\','/');html=html.replace('</head>','<script defer src="'+runtime+'?v='+release+'"></script></head>');fs.writeFileSync(e.file,html);
 report.push({id:e.id,file:e.file,oldBytes:e.bytes,entryBytes:Object.values(cfg.sizes).reduce((a,b)=>a+b,0),deferredFiles:cfg.deferredResources.length});
}
fs.writeFileSync(out+'/changes.json',JSON.stringify(report,null,2));
const click='games/click-core/index.html';fs.copyFileSync(click,out+'/click-core-original.html');fs.writeFileSync(click,'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>CxQ 星願旅團：暫停開放</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#241b36 url(assets/backgrounds/village-main.speed24.webp) center/cover;color:#fff8df;font-family:system-ui}main{margin:24px;padding:28px;text-align:center;background:#241b36ed;border-radius:20px;max-width:500px}h1{font-size:26px}a{display:inline-block;padding:14px 24px;color:#fff8df}</style></head><body><main><h1>CxQ 星願旅團：點亮夢境</h1><h2>暫停開放</h2><p>正在準備後續更新，開放時間將另行公布。</p><p>原有遊戲存檔會保留。</p><a href="../../index.html?view=game-hub">返回遊戲中心</a></main></body></html>');
const clean=execFileSync('git',['show','HEAD:assets/index-XdRDscQx.js'],{encoding:'utf8',maxBuffer:10e6});const index=clean.indexOf('星願旅團');console.log('Root menu context:',clean.slice(index-180,index+330));
console.log(JSON.stringify(report,null,2));
