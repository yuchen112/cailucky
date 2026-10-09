import fs from 'node:fs';
function edit(file, before, after){const s=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');if(s.includes(after))return;if(!s.includes(before))throw Error(file+' missing integration anchor: '+before.slice(0,70));fs.writeFileSync(file,s.replace(before,()=>after));}
const arcade='games/heartlight-duel/arcade/app.mjs';
edit(arcade,"const paint=new Painter", "function fileProgress(completed,total){const state={completed,total,failed:0,percent:total?Math.floor(completed/total*100):100,ready:completed===total};globalThis.CxQLoading?.render($('#load-status'),state,'準備街機素材包');}\nconst paint=new Painter");
let s=fs.readFileSync(arcade,'utf8');s=s.replace(/\(n,total,status\)=>\$\('#load-status'\)\.textContent=status\|\|'[^']*'\+BY_ID\[next\.fighters\[0\]\.id\]\.name\+'[^']*'\+BY_ID\[next\.fighters\[1\]\.id\]\.name\+'[^']*'\+n\+' \/ '\+total/g,'fileProgress').replace(/\(n,total,status\)=>\$\('#load-status'\)\.textContent=status\|\|'[^']*'\+n\+' \/ '\+total/g,'fileProgress');fs.writeFileSync(arcade,s);
const defense='games/fairytale-defense/rebuild/army-ui.mjs';
edit(defense,"loadingStatus.textContent=(s.dungeon?'準備副本':s.mode==='endless'?'準備99層守城':'準備本關戰場')+'… '+Math.round(completed/total*100)+'%';", "globalThis.CxQLoading?.render(loadingStatus,{completed,total,failed:0,percent:total?Math.floor(completed/total*100):100,ready:completed===total},s.dungeon?'準備副本':s.mode==='endless'?'準備99層守城':'準備本關戰場');");
const whack='games/whack/game.js';
edit(whack,'async function prepareArt(){if(preparingArt)return;',"let whackMeter;async function prepareArt(){if(preparingArt)return;whackMeter?.close();whackMeter=globalThis.CxQLoading?.create(artFiles,{label:'準備森林檔案',priority:10,retry:prepareArt});for(const file of preparedArt)if(artFiles.includes(file))whackMeter?.ready(file);");
edit(whack,'try{await prepareImage(name);}catch{failed=true;}',"try{await prepareImage(name);whackMeter?.ready(name);}catch{failed=true;whackMeter?.fail(name);}");
edit(whack,"}else{button.textContent='進入森林';button.onclick=start;", "}else{whackMeter?.close();button.textContent='進入森林';button.onclick=start;");
edit(whack,"setTimeout(()=>finish(Error('圖片載入逾時')),8000)","setTimeout(()=>finish(Error('檔案載入逾時')),45000)");
const poker='games/poker/app.mjs';
edit(poker,'},8000);','},45000);');
edit(poker,'  let at = 0;\n  await Promise.all(',"  const files=[...new Set(queue)],meter=globalThis.CxQLoading?.create(files,{label:'準備牌桌檔案',priority:10,retry:()=>{meter.close();void prepareGame(type).catch(e=>note(e.message));}});\n  let at = 0;\n  try{await Promise.all(");
edit(poker,'while (at < queue.length) await warmImage(queue[at++]);',"while (at < files.length){const file=files[at++];try{await warmImage(file);meter?.ready(file);}catch(error){meter?.fail(file);throw error;}}");
edit(poker,'  toastEl.classList.remove("show");toastEl.textContent="";\n}', '  meter?.close();}catch(error){throw error;}\n  toastEl.classList.remove("show");toastEl.textContent="";\n}');
// Native DOM pages declare a fixed current-view list; unseen catalog art stays lazy.
const town='games/lucky-town/app.mjs';
edit(town,"document.body.dataset.page=page;", "document.body.dataset.page=page;queueMicrotask(()=>globalThis.CxQLoading?.prepareDOM(root,{label:page==='machine'?'準備拉霸機檔案':page==='scratch'?'準備刮刮樂檔案':page==='characters'?'準備夥伴檔案':'準備小鎮檔案',priority:10}));");
edit(town,"if(!dialog.open)dialog.showModal()}","if(!dialog.open)dialog.showModal();queueMicrotask(()=>globalThis.CxQLoading?.prepareDOM(dialog,{label:'準備本頁檔案',priority:10}));}");
const oracle='games/fortune/seven-v3/app.mjs';
s=fs.readFileSync(oracle,'utf8');const render=s.match(/function render\([^)]*\)\{[\s\S]*?(?=\nfunction |\nasync function )/)?.[0];
if(!render)throw Error('Oracle render not found');
if(!render.includes('CxQLoading')){const pos=render.lastIndexOf('}');const next=render.slice(0,pos)+"queueMicrotask(()=>globalThis.CxQLoading?.prepareDOM(document.querySelector('#app'),{label:'準備占卜檔案',priority:10}));"+render.slice(pos);s=s.replace(render,next);fs.writeFileSync(oracle,s);}
console.log('Six native/small-game loading adapters integrated');
