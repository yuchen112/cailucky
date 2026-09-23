const fs=require('node:fs');
const file='assets/index-XdRDscQx.js';
let source=fs.readFileSync(file,'utf8');
source=source.replace(/(games\/[\w-]+\/index\.html)(?:\?[^"'`\s]*)?/g,'$1?v=20260924-speed2');
fs.writeFileSync(file,source);
const html='index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('index-XdRDscQx.js?v=20260924-mobile1','index-XdRDscQx.js?v=20260924-speed2'));
