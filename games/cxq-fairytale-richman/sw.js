const CACHE='cxq-richman-20260924-speed2';
const SHELL=['./index.html','./core.js?v=20260924-speed2','./viewport.js?v=20260924-speed2','./game.js?v=20260924-speed2'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cxq-richman-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req,{cache:'no-store'}).then(async res=>{if(res.ok){const c=await caches.open(CACHE);await c.put('./index.html',res.clone());}return res;}).catch(()=>caches.match('./index.html')));
  return;
 }
 const image=/\.(?:webp|png|jpe?g|avif)$/i.test(url.pathname);
 if(image){
  event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(req);if(hit)return hit;const res=await fetch(req);if(res.ok)await cache.put(req,res.clone());return res;})());
 }else{
  event.respondWith(fetch(req).then(async res=>{if(res.ok){const c=await caches.open(CACHE);await c.put(req,res.clone());}return res;}).catch(()=>caches.match(req)));
 }
});
