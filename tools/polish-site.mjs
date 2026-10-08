import fs from 'node:fs';
const p='assets/index-XdRDscQx.js';let s=fs.readFileSync(p,'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing site patch: '+a.slice(0,80));s=s.replace(a,()=>b);}
replace('fetch("./data/app.json?v="+Date.now(),{cache:"no-store"})','fetch("./data/app.json",{cache:"no-cache",signal:AbortSignal.timeout(12000)})');
const fortune=/\{\"id\":\"fortune\",\"title\":\"CxQ 每日占卜\"[^}]+\},/;
if(!fortune.test(s))throw Error('Fortune catalog entry missing');s=s.replace(fortune,'');
replace('r.jsxs("button",{type:"button",onClick:()=>T("points"),children:[r.jsx(En,{size:18}),"點數查詢"]})','r.jsxs("a",{href:"games/fortune/index.html?v=20261008-polish3",children:[r.jsx(Qh,{size:18}),"每日占卜"]}),r.jsxs("button",{type:"button",onClick:()=>T("points"),children:[r.jsx(En,{size:18}),"點數查詢"]})');
const start=s.indexOf('function jo('),end=s.indexOf('function lg(',start);
if(start<0||end<0)throw Error('Mascot component missing');
const component=fs.readFileSync('tools/polish-mascot-component.txt','utf8');s=s.slice(0,start)+component+s.slice(end);
fs.writeFileSync(p,s);
console.log('Site entry, data revalidation and 11 mascot controller integrated');
