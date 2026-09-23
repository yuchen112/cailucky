const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
const manifest=JSON.parse(fs.readFileSync('tools/image-delivery-speed24.json'));
for(const f of manifest.files){const m=await sharp(f.target).metadata();assert.equal(m.width,f.width,f.target);assert.equal(m.height,f.height,f.target);assert.equal(m.hasAlpha,f.alpha,f.target);assert.equal(fs.statSync(f.target).size,f.after,f.target);}
const files=cp.execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split(/\r?\n/);
for(const f of files){if(f.endsWith('.js')){if(f.startsWith('assets/index-'))continue;new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});}}
for(const name of ['luck','healing','growth','memory','joy','night','trust','dream','sadness','hope'])assert.ok(fs.existsSync('games/storybook/art-mobile24/portrait-'+name+'.webp'));
 const core=fs.readFileSync('games/cxq-fairytale-richman/core.js','utf8');
 const loader=core.slice(core.indexOf('const ASSET_REV'),core.indexOf('load("homeBg"'));
 const queued=[],requested=[];class MockImage{set src(url){this.url=url;requested.push(this);}}
 const context={Image:MockImage,queueMicrotask:f=>queued.push(f),IM:{}};vm.createContext(context);vm.runInContext(loader,context);
 for(let i=0;i<9;i++)context.load('test'+i,'asset'+i);
 context.load('priority','urgent','high');context.load('alias','asset0');queued.shift()();
 assert.equal(requested.length,6);assert.ok(requested[0].url.startsWith('urgent?'));assert.equal(context.IM.alias,context.IM.test0);
 requested[0].onload();assert.equal(requested.length,7);
 context.IM.test0.onerror();assert.ok(context.IM.test0.url.endsWith('&retry=1'));context.IM.test0.onerror();assert.equal(context.IM.test0,null);assert.equal(context.IM.alias,null);
 console.log('PASS '+manifest.files.length+' image dimensions, alpha, byte sizes; changed game JS syntax; portraits; queue limit, priority, deduplication and retry.');
})().catch(e=>{console.error(e);process.exitCode=1});
