(()=>{
const board=document.querySelector('#board'),cols=Number(getComputedStyle(board).getPropertyValue('--cols')),steps=[];
const ns=i=>{const out=[],r=Math.floor(i/cols),c=i%cols;for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)if((x||y)&&r+y>=0&&c+x>=0&&c+x<cols&&(r+y)*cols+c+x<board.children.length)out.push((r+y)*cols+c+x);return out;};
for(let turn=0;turn<100;turn++){
 if(document.querySelector('dialog[open]'))break;
 const cells=[...board.children],open=cells.map(c=>c.classList.contains('open')),flags=cells.map(c=>c.getAttribute('aria-label').includes('已插旗'));
 const eq=[];cells.forEach((c,i)=>{if(!open[i])return;const label=c.getAttribute('aria-label'),match=label.match(/周圍 (\d+) 個陷阱/),n=match?Number(match[1]):0,u=ns(i).filter(k=>!open[k]&&!flags[k]);if(u.length)eq.push({u,n:n-ns(i).filter(k=>flags[k]).length});});
 let action=null;for(const e of eq)if(e.n===0||e.n===e.u.length){action={flag:e.n>0,indices:e.u};break;}
 if(!action)outer:for(const a of eq)for(const b of eq)if(a.u.length<b.u.length&&a.u.every(i=>b.u.includes(i))){const u=b.u.filter(i=>!a.u.includes(i)),n=b.n-a.n;if(n===0||n===u.length){action={flag:n>0,indices:u};break outer;}}
 if(!action)break;
 for(const i of action.indices){if(document.querySelector('dialog[open]'))break;const cell=board.children[i];if(action.flag)cell.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));else cell.click();steps.push({i,flag:action.flag});}
}
return {steps:steps.length,progress:document.querySelector('#progress').textContent,result:document.querySelector('dialog[open]')?.innerText||'no further visible deduction'};
})()
