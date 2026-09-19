(async()=>{
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const results=[];
 for(let turn=0;turn<6;turn++){
  if(!document.querySelector('#result').hidden)break;
  const cells=[...document.querySelectorAll('#board .cell')],values=cells.map(c=>c.getAttribute('aria-label').split(' ')[0]);
  let best=null;
  function count(a){const set=new Set();for(let i=0;i<49;i++){if(i%7<5&&a[i]===a[i+1]&&a[i]===a[i+2]){set.add(i);set.add(i+1);set.add(i+2);}if(i<35&&a[i]===a[i+7]&&a[i]===a[i+14]){set.add(i);set.add(i+7);set.add(i+14);}}return set.size;}
  for(let i=0;i<49;i++)for(const j of [i%7<6?i+1:-1,i+7<49?i+7:-1]){if(j<0)continue;const a=[...values];[a[i],a[j]]=[a[j],a[i]];let n=count(a);if(cells[i].getAttribute('aria-label').includes('彩虹')||cells[j].getAttribute('aria-label').includes('彩虹'))n+=15;if(n>0&&(!best||n>best.n))best={i,j,n};}
  if(!best){results.push('no visible match');break;}
  document.querySelectorAll('#board .cell')[best.i].click();document.querySelectorAll('#board .cell')[best.j].click();await delay(2400);
  results.push({swap:[best.i,best.j],score:document.querySelector('#score').textContent,moves:document.querySelector('#moves').textContent,specials:document.querySelectorAll('.special-mark').length});
 }
 return {results,result:document.querySelector('#result').hidden?'playing':document.querySelector('#result').innerText};
})()
