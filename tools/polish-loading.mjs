import fs from 'node:fs';
function edit(p,a,b){let s=fs.readFileSync(p,'utf8');if(!s.includes(a))throw Error(p+' missing '+a.slice(0,50));fs.writeFileSync(p,s.replace(a,()=>b));}
edit('games/cxq-fairytale-richman/core.js','const IM = {};',`const IM = new Proxy({}, {get(target,key){const image=Reflect.get(target,key);if(image&&!image.src){const task=ASSET_BY_KEY.get(key);if(task&&!task.queued){task.queued=true;ASSET_QUEUE.push(task);queueMicrotask(pumpAssets);}}return image;}});`);
edit('games/cxq-fairytale-richman/core.js','const ASSET_REQUESTS = new Map(), ASSET_QUEUE = [];','const ASSET_BY_KEY=new Map();const ASSET_REQUESTS = new Map(), ASSET_QUEUE = [];');
edit('games/cxq-fairytale-richman/core.js','existing.keys.push(k);IM[k]=existing.image;return existing.image;','existing.keys.push(k);ASSET_BY_KEY.set(k,existing);IM[k]=existing.image;return existing.image;');
edit('games/cxq-fairytale-richman/core.js','const task={url,image,priority,keys:[k]};ASSET_REQUESTS.set(url,task);IM[k]=image;ASSET_QUEUE.push(task);',`const task={url,image,priority,keys:[k],queued:priority==='high'};ASSET_REQUESTS.set(url,task);ASSET_BY_KEY.set(k,task);IM[k]=image;if(task.queued)ASSET_QUEUE.push(task);`);
edit('games/cxq-fairytale-richman/core.js','load("setupBg", A + "backgrounds/setup_scene_v4.webp", "high");','load("setupBg", A + "backgrounds/setup_scene_v4.webp");');
edit('games/storybook/common.js','const loadingImages=new Map();','let imageJobs=0;const imageQueue=[];function pumpImages(){while(imageJobs<4&&imageQueue.length){imageJobs++;imageQueue.shift()().finally(()=>{imageJobs--;pumpImages()});}}function limitedImage(fn){return new Promise((resolve,reject)=>{imageQueue.push(()=>fn().then(resolve,reject));pumpImages()});}const loadingImages=new Map();');
edit('games/storybook/common.js','const pending=request(0).catch(()=>request(1))','const pending=limitedImage(()=>request(0).catch(()=>request(1)))');
edit('games/storybook/common.js',"if(loadFailed)start.onclick=()=>location.reload();",`if(loadFailed){const original=start.onclick;start.onclick=async()=>{try{await load([...new Set(names)]);start.onclick=original;original?.call(start);}catch{toast('圖片尚未準備好，請再按一次重試。')}};}`);
edit('assets/index-XdRDscQx.js','return l.loading?r.jsxs("div",{className:"loading-screen"','return l.loading&&oe!=="game-hub"?r.jsxs("div",{className:"loading-screen"');
// Only currently shown card art is fetched; off-screen collections remain lazy.
for(const p of ['games/lucky-town/views.mjs','games/lucky-town/app.mjs']){
 let s=fs.readFileSync(p,'utf8');s=s.replaceAll('class="${cls}" draggable="false"','class="${cls}" decoding="async" loading="${/hero-cover|scene-backdrop|body-art/.test(cls)?\'eager\':\'lazy\'}" draggable="false"');fs.writeFileSync(p,s);
}
let css='\n/* Individually drawn mascot frames drive animation, not element wobble. */\n.pet-avatar-stage,.floating-pet-v46 .pet-layer-body{animation:none!important;transition:none!important}.pet-avatar-layer{object-fit:contain!important}.pet-menu-actions-v45 a{min-height:44px}.floating-pet-body-v46{touch-action:manipulation}\n';fs.appendFileSync('assets/index-BCzgUWX_.css',css);
console.log('Deferred richman assets, four image workers, retry and immediate game hub integrated');
