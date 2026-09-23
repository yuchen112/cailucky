// Presentation state is deliberately separate from saved game state.
export function handLayout(width, count, cardWidth, cardHeight) {
  if (!count) return {height:0,positions:[]};
  const w=Math.max(1,width-12), cw=Math.min(cardWidth,w);
  const capacity=Math.max(1,Math.floor((w-cw)/28)+1);
  const rows=Math.ceil(count/capacity), per=Math.ceil(count/rows);
  const positions=[];
  for(let row=0;row<rows;row++){
    const n=Math.min(per,count-row*per),step=n>1?Math.min(cw+5,(w-cw)/(n-1)):0;
    const start=(width-(cw+step*(n-1)))/2;
    for(let col=0;col<n;col++)positions.push({x:start+col*step,y:20+row*(cardHeight+8),width:cw});
  }
  return {height:24+rows*cardHeight+(rows-1)*8,positions};
}
export function fitHands(root){
  for(const hand of root.querySelectorAll('.hand')){
    const cards=[...hand.children],style=getComputedStyle(hand);
    const height=parseFloat(style.getPropertyValue('--cardH'))||96;
    const width=height*2/3,layout=handLayout(hand.clientWidth,cards.length,width,height);
    hand.style.height=layout.height+'px';
    cards.forEach((card,i)=>{
      const p=layout.positions[i];
      Object.assign(card.style,{position:'absolute',left:p.x+'px',top:p.y+'px',width:p.width+'px',height:height+'px',zIndex:String(i+1)});
    });
  }
}
export function capture(root){
  const cards=[...root.querySelectorAll('.hand .card,.play-area .card')].map(el=>({
    key:el.dataset.face||null,rect:el.getBoundingClientRect(),src:el.querySelector('img')?.src,
    zone:el.closest('.hand')?'hand':'table'
  }));
  const seats=[root.querySelector('.player-info'),...[1,2,3].map(i=>root.querySelector('.s'+i))].map(el=>el?.getBoundingClientRect());
  return {cards,seats,deck:root.querySelector('.deck-stack')?.getBoundingClientRect()};
}
let active=[],ghosts=[];
export function cancelMotion(){
  active.forEach(a=>a.cancel());active=[];ghosts.forEach(e=>e.remove());ghosts=[];
}
export async function animateTable(root, before, action, settings, cue=()=>{}){
  cancelMotion();
  if(settings.reduced)return;
  const ms=settings.fast?190:430, pending=[],myGhosts=[];
  const keepGhost=e=>{ghosts.push(e);myGhosts.push(e);};
  const animate=(el,frames,delay=0,duration=ms)=>{
    const a=el.animate(frames,{duration,delay,fill:'backwards',easing:'cubic-bezier(.2,.75,.25,1)'});
    active.push(a);pending.push(a.finished.catch(()=>{}));return a;
  };
  const current=[...root.querySelectorAll('.hand .card,.play-area .card')];
  const source=before.seats?.[action.seat??0]||root.querySelector('.player-info')?.getBoundingClientRect();
  const deck=root.querySelector('.deck-stack')?.getBoundingClientRect();
  const arena=root.querySelector('.arena')?.getBoundingClientRect();
  const dealing=['deal','next'].includes(action.type);
  const dealPoint={x:arena?arena.x+arena.width/2:innerWidth/2,y:arena?arena.y+arena.height/2:innerHeight/3,width:40,height:60};
  const fallback=deck||(dealing?dealPoint:source)||dealPoint;
  if(dealing){
    for(let i=0;i<3;i++){
      const back=new Image();back.src='art/card-back.webp';back.className='motion-card';
      Object.assign(back.style,{left:(fallback.x+i*2)+'px',top:(fallback.y-i*2)+'px',width:'40px',height:'60px'});
      document.body.append(back);keepGhost(back);
      animate(back,[{opacity:1,translate:'0 0',rotate:'0deg'},{opacity:1,translate:(i%2?18:-18)+'px 0',rotate:(i%2?12:-12)+'deg',offset:.35},{opacity:1,translate:'0 0',rotate:'0deg',offset:.65},{opacity:0}],0,ms);
    }
  }
  let order=0;
  for(const el of current){
    const rect=el.getBoundingClientRect(),key=el.dataset.face;
    const old=key&&before.cards?.find(c=>c.key===key);
    if(old&&old.zone===(el.closest('.hand')?'hand':'table')){
      if(Math.abs(old.rect.x-rect.x)+Math.abs(old.rect.y-rect.y)>1)
        animate(el,[{translate:(old.rect.x-rect.x)+'px '+(old.rect.y-rect.y)+'px'},{translate:'0 0'}]);
      continue;
    }
    const origin=old?.rect||(['deal','next','hit','double','bet'].includes(action.type)?fallback:source||fallback);
    animate(el,[
      {opacity:0,translate:(origin.x+origin.width/2-rect.x-rect.width/2)+'px '+(origin.y+origin.height/2-rect.y-rect.height/2)+'px',rotate:el.closest('.hand')?'0deg':'-9deg',scale:.72,transform:['bet','hit','double'].includes(action.type)?'perspective(600px) rotateY(85deg)':'none'},
      {opacity:1,translate:'0 -3px',rotate:'1deg',scale:1.025,offset:.83},
      {opacity:1,translate:'0 0',rotate:'0deg',scale:1,transform:'perspective(600px) rotateY(0deg)'}
    ],order++*(settings.fast?12:28));
  }
  // Only copy already-public images; never derive a back-facing opponent card's identity.
  const visibleKeys=new Set(current.map(e=>e.dataset.face).filter(Boolean));
  const dest=root.querySelector('.discard-stack')?.getBoundingClientRect()||fallback;
  for(const old of before.cards||[]){
    if(!old.key||visibleKeys.has(old.key)||!old.src)continue;
    const ghost=new Image();ghost.src=old.src;ghost.className='motion-card';
    Object.assign(ghost.style,{left:old.rect.x+'px',top:old.rect.y+'px',width:old.rect.width+'px',height:old.rect.height+'px'});
    document.body.append(ghost);keepGhost(ghost);
    animate(ghost,[
      {translate:'0 0',opacity:1},
      {translate:(dest.x-old.rect.x)+'px '+(dest.y-old.rect.y)+'px',scale:.65,rotate:'7deg',opacity:.8,offset:.8},
      {translate:(dest.x-old.rect.x)+'px '+(dest.y-old.rect.y)+'px',scale:.6,opacity:0}
    ]);
  }
  const actor=action.seat===0?root.querySelector('.player-info .table-character'):root.querySelector('.s'+action.seat+' .table-character');
  if(actor)animate(actor,[{translate:'0 0'},{translate:'0 -5px',rotate:'-2deg',offset:.4},{translate:'0 0',rotate:'0deg'}],0,ms*1.2);
  if(['deal','next'].includes(action.type)){
    for(const el of root.querySelectorAll('.opponent-hand img'))
      animate(el,[{opacity:0,translate:'0 15px',rotate:'-20deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],order++*12);
  }
  if(action.reveal){
    const el=document.createElement('aside');el.className='draw-reveal';
    el.innerHTML='<span>抽到的牌</span><img src="art/card-'+action.reveal+'.webp" alt="抽到的牌">';
    document.body.append(el);keepGhost(el);
    animate(el,[{opacity:0,transform:'rotateY(85deg)'},{opacity:1,transform:'rotateY(0deg)',offset:.2},{opacity:1,offset:.75},{opacity:0}],0,ms*2.5);
  }
  if(action.type==='pass'){
    cue('pass');
    if(source){
      const bubble=document.createElement('span');bubble.className='seat-action';bubble.textContent='過牌';
      Object.assign(bubble.style,{left:Math.max(4,Math.min(innerWidth-84,source.x+source.width/2-40))+'px',top:Math.max(46,source.y)+'px'});
      document.body.append(bubble);keepGhost(bubble);
      animate(bubble,[{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0',offset:.2},{opacity:1,offset:.75},{opacity:0}],0,ms*1.8);
    }
  }
  else if(order||ghosts.length)cue(['deal','next'].includes(action.type)?'deal':'card');
  const result=root.querySelector('.result-grid');
  if(result){
    animate(result,[{opacity:0,translate:'0 15px'},{opacity:1,translate:'0 0'}],ms,ms);
    for(const el of result.querySelectorAll('img'))animate(el,Number(el.parentElement.dataset.delta)>0?[{scale:.92},{scale:1.07,offset:.6},{scale:1}]:[{translate:'0 -3px'},{translate:'0 3px'},{translate:'0 0'}],ms,ms);
    for(const [i,el] of [...result.children].entries()){
      const delta=action.deltas?.[i]||0;if(!delta)continue;
      const r=el.getBoundingClientRect(),chip=new Image();chip.src='art/chip-stack.webp';chip.className='motion-chip';
      const start=delta>0?{x:innerWidth/2,y:innerHeight/2}:r;
      const end=delta>0?r:{x:innerWidth/2,y:innerHeight/2};
      Object.assign(chip.style,{left:start.x+'px',top:start.y+'px'});
      document.body.append(chip);keepGhost(chip);
      animate(chip,[{opacity:0,translate:'0 0',scale:.7},{opacity:1,offset:.2},{opacity:1,translate:(end.x-start.x)+'px '+(end.y-start.y)+'px',offset:.85},{opacity:0,translate:(end.x-start.x)+'px '+(end.y-start.y)+'px'}],ms,ms*1.4);
    }
    cue(action.deltas?.[0]<0?'pass':'win');
  }
  await Promise.all(pending);
  myGhosts.forEach(e=>e.remove());ghosts=ghosts.filter(e=>!myGhosts.includes(e));active=active.filter(a=>a.playState==='running');
}
