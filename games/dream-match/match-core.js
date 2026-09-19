/* Pure board rules, shared by browser and regression tests. */
(function(root){
  'use strict';
  const N=7;
  function groups(a){
    const out=[];
    for(const vertical of [false,true])for(let line=0;line<N;line++){
      let run=[];
      for(let step=0;step<=N;step++){
        const i=vertical?step*N+line:line*N+step;
        if(step<N&&a[i]>=0&&(!run.length||a[i]===a[run[0]]))run.push(i);
        else{if(run.length>=3)out.push({cells:run,axis:vertical?'column':'row'});run=step<N&&a[i]>=0?[i]:[];}
      }
    }
    return out;
  }
  function match(a){return new Set(groups(a).flatMap(g=>g.cells));}
  function move(a,special={}){
    for(let i=0;i<a.length;i++)for(const j of [i%N<N-1?i+1:-1,i+N<a.length?i+N:-1]){
      if(j<0)continue;
      if(special[i]==='prism'||special[j]==='prism'||(special[i]&&special[j]))return[i,j];
      [a[i],a[j]]=[a[j],a[i]];const ok=match(a).size>0;[a[i],a[j]]=[a[j],a[i]];
      if(ok)return[i,j];
    }
    return null;
  }
  function specials(a,existing={},preferred=[]){
    const made={};
    for(const g of groups(a))if(g.cells.length>=4){
      const i=preferred.find(i=>g.cells.includes(i)&&!existing[i])??g.cells.find(i=>!existing[i]);
      if(i!==undefined&&made[i]!=='prism')made[i]=g.cells.length>=5?'prism':g.axis;
    }
    return made;
  }
  function expand(a,special,initial){
    const all=new Set(initial),queue=[...all],done=new Set;
    while(queue.length){const i=queue.pop();if(done.has(i))continue;done.add(i);
      const kind=special[i];if(!kind)continue;
      for(let j=0;j<a.length;j++)if(kind==='prism'?a[j]===a[i]:kind==='row'?Math.floor(j/N)===Math.floor(i/N):j%N===i%N){if(!all.has(j)){all.add(j);queue.push(j);}}
    }
    return all;
  }
  const api={N,groups,match,move,specials,expand};
  if(typeof module!=='undefined')module.exports=api;else root.DreamRules=api;
})(globalThis);
