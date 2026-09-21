/* Animate existing standalone artwork; gameplay remains owned by game.js. */
(() => {
  const reduced=()=>document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const active=new Set();
  function play(el,frames,options){
    if(!el||reduced())return Promise.resolve();
    const animation=el.animate(frames,options);active.add(animation);
    return animation.finished.catch(()=>{}).finally(()=>{active.delete(animation);if(options.fill!=='forwards')animation.cancel();});
  }
  const pieces=cell=>cell?[...cell.querySelectorAll('.gem,.special-mark')]:[];
  async function swap(board,i,j){
    for(const animation of active)animation.cancel();
    const A=board.children[i],B=board.children[j],a=A.getBoundingClientRect(),b=B.getBoundingClientRect();
    A.style.zIndex=B.style.zIndex='5';
    await Promise.all([[A,b.x-a.x,b.y-a.y],[B,a.x-b.x,a.y-b.y]].flatMap(([cell,x,y])=>pieces(cell).map(el=>play(el,[{translate:'0 0'},{translate:x+'px '+y+'px'}],{duration:280,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}))));
    A.style.zIndex=B.style.zIndex='';
  }
  function fall(board,distances){
    const step=(board.clientWidth+(parseFloat(getComputedStyle(board).gap)||0))/7;
    const duration=Math.min(620,320+Math.max(0,...Object.values(distances))*45);
    return Promise.all(Object.entries(distances).filter(([,d])=>d>0).flatMap(([i,d])=>pieces(board.children[i]).map(el=>play(el,[{translate:'0 '+(-d*step)+'px',opacity:1},{translate:'0 0',opacity:1}],{duration,easing:'cubic-bezier(.35,0,.45,1)',fill:'backwards'}))));
  }
  function spark(cell){
    const img=new Image();img.src='../storybook/art-polish/dream-burst.webp';img.alt='';img.className='dream-motion-spark';cell.append(img);
    return play(img,[{scale:.3,opacity:0},{scale:1.2,opacity:1,offset:.4},{scale:1.6,opacity:0}],{duration:420,easing:'ease-out'}).finally(()=>img.remove());
  }
  async function clear(board,indices,made,activated,colors,goals){
    if(reduced())return;
    const work=[],flying=new Set();
    for(const i of indices){
      const cell=board.children[i];
      work.push(...pieces(cell).map(el=>play(el,[{scale:1,opacity:1},{scale:1.045,opacity:1,offset:.25},{scale:.85,opacity:0}],{duration:280,fill:'forwards',easing:'ease-out'})),spark(cell));
      const g=goals.findIndex(g=>g.color===colors[i]&&g.got<g.need);
      if(g>=0&&!flying.has(g)){
        flying.add(g);const source=cell.querySelector('.gem'),target=document.querySelectorAll('#goals .gemMini')[g];
        if(source&&target){const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),fly=source.cloneNode();fly.className='dream-collection-flight';Object.assign(fly.style,{left:a.x+'px',top:a.y+'px',width:a.width+'px',height:a.height+'px'});document.body.append(fly);
          work.push(play(fly,[{translate:'0 0',scale:1,opacity:1},{translate:((b.x-a.x)*.45)+'px '+((b.y-a.y)*.45-24)+'px',scale:.8,opacity:1,offset:.45},{translate:(b.x-a.x)+'px '+(b.y-a.y)+'px',scale:.35,opacity:0}],{duration:520,easing:'ease-in-out'}).finally(()=>fly.remove()));}
      }
    }
    for(const i of Object.keys(made))work.push(spark(board.children[i]),...pieces(board.children[i]).map(el=>play(el,[{scale:.9,opacity:0},{scale:1,opacity:1}],{duration:420,easing:'ease-out'})));
    for(const [i,kind] of Object.entries(activated)){
      if(!indices.has(+i))continue;
      const cells=kind==='row'?[...board.children].slice(Math.floor(i/7)*7,Math.floor(i/7)*7+7):kind==='column'?[...board.children].filter((_,n)=>n%7===i%7):[];
      for(const [n,cell] of cells.entries())work.push(play(cell,[{filter:'brightness(1)'},{filter:'brightness(1.65)'},{filter:'brightness(1)'}],{duration:280,delay:n*28}));
    }
    await Promise.all(work);
  }
  function shuffle(board,out){for(const animation of active)animation.cancel();return Promise.all([...board.children].flatMap((cell,i)=>pieces(cell).map(el=>play(el,out?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration:240,delay:(i%7)*13,easing:'ease-in-out',fill:out?'forwards':'backwards'}))));}
  function feedback(el){return play(el,[{opacity:0},{opacity:1}],{duration:180});}
  function hint(board,indices){if(reduced())return;for(const i of indices)for(const el of pieces(board.children[i]))play(el,[{filter:'brightness(1)'},{filter:'brightness(1.3)'},{filter:'brightness(1)'}],{duration:850,easing:'ease-in-out'});}
  function stopIfReduced(){if(reduced())for(const animation of active)animation.cancel();}
  new MutationObserver(stopIfReduced).observe(document.body,{attributes:true,attributeFilter:['class']});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stopIfReduced);
  window.DreamMotion={swap,fall,clear,shuffle,feedback,hint};
})();
