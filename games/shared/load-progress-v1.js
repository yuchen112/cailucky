/* File completion, not elapsed time or image counts. No save or gameplay writes. */
(() => {
  'use strict';
  const absolute = value => new URL(value, globalThis.location?.href || 'https://cxq.invalid/').href;
  const unique = files => [...new Set(files.filter(Boolean).map(absolute))];
  function summary(states) {
    const list = [...states], total = list.length;
    const completed = list.filter(s => s === 'ready').length;
    const failed = list.filter(s => s === 'failed').length;
    return {completed, total, failed, percent: total ? Math.floor(completed / total * 100) : 100, ready: completed === total};
  }
  class FileProgress {
    constructor(files, change = () => {}) { this.states = new Map(unique(files).map(f => [f, 'pending'])); this.change = change; }
    set(file, state) { const key = absolute(file); if (!this.states.has(key)) throw Error('Unplanned loading file: ' + key); this.states.set(key, state); this.change(this.snapshot()); }
    ready(file) { this.set(file, 'ready'); }
    fail(file) { this.set(file, 'failed'); }
    retry(file) { this.set(file, 'pending'); }
    snapshot() { return summary(this.states.values()); }
  }
  const api = {FileProgress, summary, unique};
  globalThis.CxQLoading = api;
  if (typeof document === 'undefined') return;
  const script = document.currentScript, config = JSON.parse(script?.dataset.loading || '{}');
  const packedMedia=new Map();
  let serial = 0, jobs = 0, decodedBytes = 0; const queue = [], images = new Map(), requests = new Map(), sessions = new Set();
  const style = document.createElement('style');
  style.textContent = `.cxq-file-cover{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#08131ed9;padding:14px;box-sizing:border-box}.cxq-file-cover[hidden]{display:none}.cxq-file-card{box-sizing:border-box;width:min(440px,92vw);padding:24px;background:var(--load-paper,#fff8e8);color:var(--load-ink,#493425);border:2px solid var(--load-accent,#c7a461);border-radius:18px;box-shadow:0 12px 45px #0007;text-align:center;font-family:system-ui,sans-serif}.cxq-file-card h2{font-size:22px;line-height:1.4;margin:0 0 12px}.cxq-file-card strong{display:block;font-size:32px;margin:6px}.cxq-file-card p{font-size:15px;line-height:1.6;margin:10px 0}.cxq-file-card progress{display:block;appearance:none;width:100%;height:20px;border:1px solid var(--load-accent,#c7a461);border-radius:10px;overflow:hidden;background:#0002}.cxq-file-card progress::-webkit-progress-bar{background:#0002}.cxq-file-card progress::-webkit-progress-value{background:var(--load-accent,#c7a461)}.cxq-file-card progress::-moz-progress-bar{background:var(--load-accent,#c7a461)}.cxq-file-card button,.cxq-file-card a{display:inline-grid;place-items:center;min-height:44px;min-width:110px;margin:5px;padding:8px 12px;box-sizing:border-box;font:inherit;border:1px solid var(--load-accent,#c7a461);border-radius:8px;background:var(--load-paper,#fff8e8);color:inherit;text-decoration:none;touch-action:manipulation}.cxq-file-card img{width:72px;height:72px;object-fit:contain}.cxq-file-inline .cxq-file-card{width:100%;max-width:440px;margin:auto;padding:16px}.cxq-file-inline strong{font-size:26px}@media(max-height:420px){.cxq-file-card{padding:14px;width:min(540px,90vw)}.cxq-file-card img{display:none}.cxq-file-card h2{font-size:19px;margin-bottom:4px}.cxq-file-card strong{font-size:26px}.cxq-file-card p{margin:5px 0}}`;
  style.textContent += '.cxq-file-cover{width:100%;height:100%;max-width:none;max-height:none;margin:0;border:0}.cxq-file-cover::backdrop{background:transparent}';
  document.head.append(style);
  style.textContent += `.cxq-file-card.art-card{width:min(960px,94vw,145vh);padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;color:#fff4cf}.cxq-file-inline .cxq-file-card.art-card{width:100%;padding:0}.art-stage{position:relative}.cxq-file-card img.loading-scene{display:block;width:100%;height:auto;max-height:82vh;object-fit:contain}.art-card .live-info{position:absolute;left:22%;width:56%;bottom:14%;text-shadow:0 1px 3px #000}.art-card h2{font-size:clamp(13px,2vw,21px);margin:0 0 2px}.art-card strong{font-size:clamp(16px,2.6vw,25px);margin:0 0 3px}.art-card progress{height:clamp(8px,1.6vw,14px);border-radius:7px}.art-card .cxq-file-count{font-size:clamp(11px,1.6vw,15px);margin:3px 0 0}.art-card .cxq-file-error:empty{display:none}.art-card .cxq-file-error{color:#fff4cf;font-size:14px;background:#09121be8;margin:0;padding:6px}.art-card .cxq-file-actions{background:#09121be8}.art-card .cxq-file-actions:empty{display:none}@media(max-width:600px) and (orientation:portrait){.art-card .live-info{position:static;width:auto;padding:14px 18px;background:#09121be8}.art-card h2{font-size:18px}.art-card strong{font-size:25px}.art-card progress{height:15px}.art-card .cxq-file-count{font-size:14px}.cxq-file-card img.loading-scene{max-height:none}}`;
  function render(target, state, label = '準備遊戲', illustration = '') {
    let card = target.querySelector('.cxq-file-card');
    if (!card) {
      card = document.createElement('section'); card.className = 'cxq-file-card';
      card.innerHTML = '<h2></h2><strong></strong><progress max="100" value="0" aria-label="檔案載入進度"></progress><p class="cxq-file-count"></p><p class="cxq-file-error" role="status"></p><div class="cxq-file-actions"></div>';
      if(config.scene){card.classList.add('art-card');const stage=document.createElement('div');stage.className='art-stage';const scene=new Image();scene.className='loading-scene';scene.alt='本遊戲專屬載入美術';scene.fetchPriority='high';scene.src=config.scene;const info=document.createElement('div');info.className='live-info';for(const selector of ['h2','strong','progress','.cxq-file-count'])info.append(card.querySelector(selector));stage.append(scene,info);card.prepend(stage);}
      if (illustration) { const image = new Image(); image.src = illustration; image.alt = ''; card.prepend(image); }
      target.replaceChildren(card);
      for (const [key, value] of Object.entries(config.colors || {})) card.style.setProperty('--load-' + key, value);
    }
    card.querySelector('h2').textContent = label;
    card.querySelector('strong').textContent = state.percent + '%';
    card.querySelector('progress').value = state.percent;
    card.querySelector('.cxq-file-count').textContent = `已完成 ${state.completed}／${state.total} 個檔案`;
    card.querySelector('.cxq-file-error').textContent = state.failed ? `${state.failed} 個檔案未完成，已完成的內容會保留。` : config.scene ? '' : state.ready ? '準備完成' : '正在下載與準備本階段檔案…';
    target.dataset.completed = state.completed; target.dataset.total = state.total; target.dataset.percent = state.percent;
    return card;
  }
  function create(files, options = {}) {
    const session = new FileProgress(files); session.id = ++serial; session.options = options; session.closed = false;
    const host = options.mount || document.createElement('dialog'); session.host = host;
    host.classList.add(options.mount ? 'cxq-file-inline' : 'cxq-file-cover');
    host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
    if (!options.mount){host.addEventListener('cancel',e=>e.preventDefault());document.documentElement.append(host);}
    const update = state => {
      if (session.closed) return;
      render(host, state, options.label || '準備遊戲', options.illustration || config.illustration);
      const actions = host.querySelector('.cxq-file-actions'); actions.replaceChildren();
      if (state.failed && options.retry) { const b = document.createElement('button'); b.textContent = '重試未完成檔案'; b.onclick = options.retry; actions.append(b); }
      if (state.failed && !options.mount) { const a = document.createElement('a'); a.textContent = '返回網站'; a.href = new URL('../../?view=game-hub', new URL('.', script.src)).href; actions.append(a); }
      if (!options.mount) { const winner = [...sessions].filter(s => !s.closed && !s.options.mount).sort((a,b) => (b.options.priority || 0) - (a.options.priority || 0) || b.id - a.id)[0]; for (const s of sessions) if (!s.options.mount && s!==winner){s.host.hidden=true;if(s.host.open)s.host.close();}if(winner){winner.host.hidden=false;if(!winner.host.open)winner.host.showModal();} }
      options.change?.(state);
    };
    session.change = update; session.close = () => { session.closed = true; sessions.delete(session); if (!options.mount){if(host.open)host.close();host.remove();} for (const s of sessions) s.change(s.snapshot()); };
    sessions.add(session); update(session.snapshot()); return session;
  }
  function pump() { while (jobs < 6 && queue.length) { jobs++; const work = queue.shift(); work().finally(() => { jobs--; pump(); }); } }
  function image(file) {
    const url = absolute(file); if (images.has(url)) return Promise.resolve(images.get(url)); if (requests.has(url)) return requests.get(url);
    const pending = new Promise((resolve, reject) => { queue.push(async () => {
      try { const value = await new Promise((yes, no) => {
        const im = new Image(); im.decoding = 'async'; let ended = false;
        const finish = error => { if (ended) return; ended = true; clearTimeout(timer); im.onload = im.onerror = null; error ? no(error) : yes(im); };
        const timer = setTimeout(() => finish(Error('檔案下載逾時')), 45000);
        im.onload = async () => { try { if (!im.naturalWidth) throw Error('檔案內容無效'); if (im.decode) await im.decode(); finish(); } catch (error) { finish(error); } };
        im.onerror = () => finish(Error('檔案下載中斷')); im.src = packedMedia.get(url) || url;
      }); images.set(url, value);decodedBytes+=value.naturalWidth*value.naturalHeight*4;while(decodedBytes>64*1024*1024&&images.size>1){const oldest=images.keys().next().value,old=images.get(oldest);images.delete(oldest);decodedBytes-=old.naturalWidth*old.naturalHeight*4;}resolve(value); } catch (error) { reject(error); }
    }); pump(); }).finally(() => requests.delete(url)); requests.set(url, pending); return pending;
  }
  async function prepare(files, options = {}) {
    files = unique(files); const session = create(files, {...options, retry: () => run()});
    async function run() {
      const values = new Map();
      const results = await Promise.allSettled(files.map(async f => { if(session.states.get(f)!=='ready')session.retry(f); try { const value = await (options.load ? options.load(f) : image(f)); values.set(f, value); session.ready(f); } catch (error) { session.fail(f); throw error; } }));
      const error = results.find(r => r.status === 'rejected');
      if (error) { options.error?.(error.reason); return {session, values, error: error.reason}; }
      options.done?.(values); session.close(); return {session, values};
    }
    return run();
  }
  function visibleFiles(root) {
    const files = [];
    for (const el of [root, ...root.querySelectorAll('img,main,section,header,button,[style]')]) {
      if (!(el instanceof Element) || !el.getClientRects().length || el.closest('[hidden],.cxq-file-cover,.cxq-file-inline')) continue;
      const box = el.getBoundingClientRect(); if (box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) continue;
      if (el.tagName === 'IMG' && el.getAttribute('src')) files.push(el.currentSrc || el.src);
      for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) files.push(m[1]);
    }
    return unique(files.filter(f => !f.startsWith('data:') && !f.startsWith('blob:')));
  }
  const domScopes = new Map();
  function prepareDOM(root, options = {}) {
    if (!root) return Promise.resolve(); const files = visibleFiles(root), signature = files.join('|');
    if (!files.length || files.every(f => images.has(f))) return Promise.resolve();
    const previous = domScopes.get(root); if (previous?.signature === signature) return previous.promise;
    previous?.session?.close();
    const entry = {signature}; domScopes.set(root, entry);
    entry.promise = prepare(files, {...options, change: state => { const active = [...sessions].find(s => s.options.scope === entry); if (active) entry.session = active; options.change?.(state); }, scope: entry});
    return entry.promise;
  }
  Object.assign(api, {create, render, prepare, prepareDOM, visibleFiles, image, images});
  const byteCache=new Map(),bytePending=new Map();let byteJobs=0;const byteQueue=[];
  function pumpBytes(){while(byteJobs<4&&byteQueue.length){byteJobs++;byteQueue.shift()().finally(()=>{byteJobs--;pumpBytes();});}}
  function fileBytes(file){const url=absolute(file);if(byteCache.has(url))return Promise.resolve(byteCache.get(url));if(bytePending.has(url))return bytePending.get(url);const promise=new Promise((resolve,reject)=>{byteQueue.push(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);try{const response=await fetch(packedMedia.get(url)||url,{signal:controller.signal,cache:'force-cache'});if(!response.ok)throw Error('檔案下載失敗 HTTP '+response.status);const bytes=new Uint8Array(await response.arrayBuffer());if(!bytes.length)throw Error('檔案內容為空');if(/\.bin(\?|$)/.test(url))byteCache.set(url,bytes);resolve(bytes);}catch(error){reject(error);}finally{clearTimeout(timer);}});pumpBytes();}).finally(()=>bytePending.delete(url));bytePending.set(url,promise);return promise;}
  const resource=file=>/\.(webp|png|jpe?g|svg)(\?|$)/i.test(file)?image(file):fileBytes(file);
  function registerPack(bytes){if(bytes.length<4)throw Error('載入包不完整');const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0,true);if(size>bytes.length-4)throw Error('載入包標頭不完整');const header=JSON.parse(new TextDecoder().decode(bytes.subarray(4,4+size)));if(header.format!==1||!Array.isArray(header.entries))throw Error('載入包格式錯誤');const base=4+size;for(const item of header.entries){if(!Number.isInteger(item.offset)||!Number.isInteger(item.length)||item.offset<0||item.length<=0||base+item.offset+item.length>bytes.length)throw Error('載入包內容不完整');const url=absolute(item.file),part=bytes.subarray(base+item.offset,base+item.offset+item.length);if(item.type.startsWith('image/')||item.type.startsWith('audio/')){const old=packedMedia.get(url);if(old)URL.revokeObjectURL(old);packedMedia.set(url,URL.createObjectURL(new Blob([part],{type:item.type})));}else byteCache.set(url,part);}return header.entries.length;}
  Object.assign(api,{fileBytes,resource,byteCache,registerPack,hasPacked:file=>packedMedia.has(absolute(file))||byteCache.has(absolute(file)),mediaURL:file=>packedMedia.get(absolute(file))||absolute(file)});
  function reuseImage(el){if(el.tagName!=='IMG')return;const source=el.getAttribute('src');if(!source||source.startsWith('blob:')||source.startsWith('data:'))return;const url=packedMedia.get(absolute(source));if(url)el.src=url;}
  if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='attributes')reuseImage(record.target);else for(const node of record.addedNodes){if(node.nodeType!==1)continue;reuseImage(node);node.querySelectorAll?.('img').forEach(reuseImage);}}});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});}
  addEventListener('pagehide',event=>{if(event.persisted)return;for(const url of packedMedia.values())URL.revokeObjectURL(url);packedMedia.clear();});
  // The declared list is fixed before downloads start. Background/lazy assets are separate phases.
  if (config.files?.length) {
    const files=unique([...config.files,...(config.pack?.files||config.resources||[]),config.scene].filter(Boolean));
    const boot = create(files, {label: config.label || '準備遊戲入口', priority: 1000, retry: () => retryResources()});
    let released=false;
    const finish=()=>{if(released||!boot.snapshot().ready)return;released=true;document.documentElement.dataset.cxqLoadReadyMs=Math.round(performance.now());document.documentElement.dataset.cxqLoadFiles=files.length;boot.close();void backgroundWarm();};
    async function retryResources(){if(config.pack)void loadPack();for(const file of [...(!config.pack?config.resources||[]:[]),...config.images||[],config.scene].filter(Boolean)){const key=absolute(file);if(boot.states.get(key)==='ready')continue;boot.retry(file);resource(file).then(()=>ready(file),()=>failed(file));}const codeFailed=[...boot.states].some(([file,state])=>state==='failed'&&!/\.(webp|png|jpe?g|svg|mp3|ogg|bin)(\?|$)/i.test(file));if(codeFailed)location.reload();}
    let packLoading=false;
    async function loadPack(){if(packLoading)return;packLoading=true;const parts=config.pack.files,last=parts.at(-1);try{const buffers=await Promise.all(parts.map(async file=>{if(boot.states.get(absolute(file))!=='ready')boot.retry(file);try{const bytes=await fileBytes(file);if(file!==last)ready(file);return bytes;}catch(error){failed(file);throw error;}}));const bytes=new Uint8Array(buffers.reduce((n,b)=>n+b.length,0));let offset=0;for(const part of buffers){bytes.set(part,offset);offset+=part.length;}registerPack(bytes);await Promise.all((config.resources||[]).filter(file=>/\.(webp|png|jpe?g|svg)(\?|$)/i.test(file)).map(image));ready(last);}catch{failed(last);}finally{packLoading=false;}}
    async function backgroundWarm(){for(const file of config.background||[]){if(document.hidden)await new Promise(resolve=>{const visible=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',visible);resolve();}};document.addEventListener('visibilitychange',visible);});try{await fileBytes(file);}catch{} }}
    const ready = file => { const key = absolute(file); if (boot.states.has(key)) { boot.ready(key); finish(); } };
    const failed = file => { const key = absolute(file); if (boot.states.has(key)) boot.fail(key); };
    document.addEventListener('load', e => { const el = e.target; if (el?.src || el?.href) ready(el.src || el.href); }, true);
    document.addEventListener('error', e => { const el = e.target; if (el?.src || el?.href) failed(el.src || el.href); }, true);
    const imageFiles = config.images || [];
    for (const file of imageFiles) image(file).then(() => ready(file), () => failed(file));
    if(config.scene)image(config.scene).then(()=>ready(config.scene),()=>failed(config.scene));
    if(config.pack)void loadPack();else for(const file of config.resources||[])resource(file).then(()=>ready(file),()=>failed(file));
    document.addEventListener('DOMContentLoaded', () => { for (const link of document.querySelectorAll('link[rel="stylesheet"]')) if (link.sheet) ready(link.href); for (const im of document.images) if (im.complete && im.naturalWidth) ready(im.src); });
  }
})();
