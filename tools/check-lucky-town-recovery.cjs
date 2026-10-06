const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});try{
 const p=await b.newPage();await p.goto(process.env.LUCKY_TOWN_URL||'http://127.0.0.1:4179/games/lucky-town/');await p.getByRole('button',{name:'開始生活',exact:true}).waitFor();
 const raw=await p.evaluate(async()=>{const s=await import('./store.mjs?v=20261006-town3');await s.change(x=>{x.coins=1234;x.started=true;});return s.pack(s.get());});
 await p.evaluate(async()=>{localStorage.setItem('cxq-lucky-town-v1','bad-primary');localStorage.removeItem('cxq-lucky-town-v1-backups');const req=indexedDB.open('cxq-lucky-town-v1');await new Promise((resolve,reject)=>{req.onsuccess=()=>{const db=req.result;const tx=db.transaction('saves','readwrite');tx.objectStore('saves').clear();tx.oncomplete=resolve;tx.onerror=reject;};req.onerror=reject;});});
 await p.reload();await p.getByRole('heading',{name:'先找回你的生活紀錄'}).waitFor();assert.equal(await p.locator('[data-action="spin"]').count(),0);assert.equal(await p.evaluate(()=>localStorage.getItem('cxq-lucky-town-v1')),'bad-primary');
 await p.locator('[data-action="saves"]').click();await p.locator('#import-file').setInputFiles({name:'recovery.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.locator('[data-action="confirm"]').click();await p.waitForTimeout(250);assert.equal(await p.evaluate(async()=>(await import('./store.mjs?v=20261006-town3')).get().coins),1234);assert.ok(await p.evaluate(async()=>(await import('./store.mjs?v=20261006-town3')).damagedCopies().includes('bad-primary')));
 await p.reload();await p.waitForTimeout(250);assert.equal(await p.locator('.recovery-page').count(),0);assert.equal(await p.evaluate(async()=>(await import('./store.mjs?v=20261006-town3')).get().coins),1234);
 console.log('All-damaged saves block replacement; downloaded valid backup restores progress and preserves raw evidence.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
