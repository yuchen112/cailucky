(function(root){
 'use strict';
 function advance(grid,turn,random=Math.random){
  const colors=Math.min(6,3+Math.floor(turn/12)),count=Math.min(9,5+Math.floor(turn/8));
  const columns=Array.from({length:9},(_,i)=>i);
  for(let i=8;i>0;i--){const j=Math.floor(random()*(i+1));[columns[i],columns[j]]=[columns[j],columns[i]];}
  const row=Array(9).fill(-1);for(const c of columns.slice(0,count))row[c]=Math.floor(random()*colors);
  return {grid:[row,...grid.slice(0,-1).map(r=>[...r])],overflow:grid.at(-1).some(v=>v>=0)};
 }
 const api={advance};if(typeof module!=='undefined')module.exports=api;else root.BubbleEndless=api;
})(globalThis);
