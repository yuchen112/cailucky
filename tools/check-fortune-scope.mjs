import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const old=p=>execFileSync('git',['show','0e67c4e105025f198b9a19291e4ec766c78564f8:'+p],{encoding:'utf8',maxBuffer:10000000}).replaceAll('\r\n','\n');
const read=p=>process.argv.includes('--staged')?execFileSync('git',['show',':'+p],{encoding:'utf8',maxBuffer:10000000}):fs.readFileSync(p,'utf8');
const expected=old('assets/index-XdRDscQx.js').replace('href:"games/fortune/index.html?v=20261008-polish3",children:[r.jsx(Qh,{size:18}),"每日占卜"]','href:"games/fortune/index.html?v=20261009-oracle1",children:[r.jsx(Qh,{size:18}),"占卜館"]');assert.equal(read('assets/index-XdRDscQx.js').replaceAll('\r\n','\n'),expected);
assert.equal(read('index.html').replaceAll('\r\n','\n'),old('index.html').replace('index-XdRDscQx.js?v=20261008-polish4','index-XdRDscQx.js?v=20261009-oracle1'));
assert(fs.readFileSync('games/fortune/app.js','utf8').includes("CxQ.read('quiet-oracle-journal'"));console.log('PASS site edits limited to fortune menu label, URL and cache version; legacy journal key preserved');
