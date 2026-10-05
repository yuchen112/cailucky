import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../games/fairytale-defense/rebuild/asset-cache.js',import.meta.url),'utf8');
const entries=new Map(),root='https://example.test/games/fairytale-defense/rebuild/';
const cache={match:async key=>entries.get(String(key))?.clone(),put:async(key,response)=>entries.set(String(key),response.clone()),keys:async()=>[...entries.keys()].map(url=>({url})),delete:async key=>entries.delete(key.url||String(key))};
let online=true,requests=0;
function worker(){const listeners={};vm.runInNewContext(source,{URL,fetch:async input=>{requests++;if(!online)throw Error('offline');return String(input).includes('asset-revisions.json')?Response.json({files:{'art/example.webp':'abc'}}):new Response('image');},caches:{open:async()=>cache},self:{location:{href:root+'asset-cache.js'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(name,fn)=>listeners[name]=fn}});return listeners;}
async function lifecycle(w,name){let task;w[name]({waitUntil:x=>task=x});await task;}
async function image(w,hash='abc'){let task;w.fetch({request:{url:root+'art/example.webp?r='+hash,method:'GET'},respondWith:x=>task=x});return (await task).text();}
let w=worker();await lifecycle(w,'install');await lifecycle(w,'activate');assert.equal(await image(w),'image');assert.equal(entries.size,2);
online=false;w=worker();await lifecycle(w,'activate');const before=requests;assert.equal(await image(w),'image');assert.equal(requests,before);assert.equal(entries.size,2);
online=true;assert.equal(await image(w,'updated'),'image');assert(entries.has(root+'art/example.webp?r=updated'));
console.log('PASS persistent manifest fallback, offline cached art, activation retention and explicit content version.');
