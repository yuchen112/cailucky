// Presentation state is deliberately separate from saved game state.
export function playPosePath(source='') {
  const role=source.match(/(?:^|\/)seat-(luck|dream|growth|joy|night|sadness|trust|memory|healing|hope)\.webp(?:\?.*)?$/)?.[1];
  return role ? `art/seat-${role}-play-v1.webp` : null;
}
const poseCache=new Map();
export function warmPlayPose(path){
  if(!path)return Promise.resolve(false);
  if(poseCache.has(path))return poseCache.get(path).promise;
  const entry={image:new Image(),ready:false};
  entry.promise=new Promise(resolve=>{
    entry.image.onload=()=>{entry.ready=true;resolve(true);};
    entry.image.onerror=()=>{poseCache.delete(path);resolve(false);};
  });
  poseCache.set(path,entry);entry.image.src=path;
  return entry.promise;
}
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
// A bounded arc makes the direction readable without sending cards off-screen.
export function cardFlight(origin, target, {flip=false, lift=18}={}){
  const dx=origin.x+origin.width/2-target.x-target.width/2;
  const dy=origin.y+origin.height/2-target.y-target.height/2;
  const arc=Math.min(lift,Math.hypot(dx,dy)*.12);
  return [
    {opacity:1,translate:`${dx}px ${dy}px`,scale:.78,rotate:`${Math.sign(dx)*8}deg`,transform:flip?'perspective(600px) rotateY(85deg)':'none'},
    {opacity:1,translate:`${dx*.45}px ${dy*.45-arc}px`,scale:.94,rotate:`${Math.sign(dx)*3}deg`,offset:.48},
    {opacity:1,translate:'0 -2px',scale:1.025,rotate:'0deg',offset:.88},
    {opacity:1,translate:'0 0',scale:1,rotate:'0deg',transform:'perspective(600px) rotateY(0deg)'}
  ];
}
export function capture(root){
  const cards=[...root.querySelectorAll('.hand .card,.play-area .card')].map(el=>({
    key:el.dataset.face||null,rect:el.getBoundingClientRect(),src:el.querySelector('img')?.src,
    zone:el.closest('.hand')?'hand':'table'
  }));
  const seats=[root.querySelector('.player-info'),...[1,2,3].map(i=>root.querySelector('.s'+i))].map(el=>el?.getBoundingClientRect());
  const hands=[root.querySelector('.player-info'),...[1,2,3].map(i=>root.querySelector('.s'+i+' .opponent-hand'))].map(el=>el?.getBoundingClientRect());
  return {cards,seats,hands,deck:root.querySelector('.deck-stack')?.getBoundingClientRect()};
}
let active=[],ghosts=[];
// Shared beats keep the hand gesture, released cards and recovery in sync.
export function actionTiming(type,fast=false){
  const duration=fast?190:430;
  const release=type==='play'?Math.round(duration*.36):0;
  return {duration,release,stagger:fast?12:28,gesture:release+duration+Math.round(duration*.28)};
}
export function cancelMotion(){
  active.forEach(a=>a.cancel());active=[];ghosts.forEach(e=>e.remove());ghosts=[];
}
export async function animateTable(root, before, action, settings, cue=()=>{}){
  cancelMotion();
  if(settings.reduced)return;
  const timing=actionTiming(action.type,settings.fast);
  const ms=timing.duration, pending=[],myGhosts=[];
  const keepGhost=e=>{ghosts.push(e);myGhosts.push(e);};
  const animate=(el,frames,delay=0,duration=ms)=>{
    const a=el.animate(frames,{duration,delay,fill:'backwards',easing:'cubic-bezier(.2,.75,.25,1)'});
    active.push(a);pending.push(a.finished.catch(()=>{}));return a;
  };
  const current=[...root.querySelectorAll('.hand .card,.play-area .card')];
  const source=before.hands?.[action.seat??0]||before.seats?.[action.seat??0]||root.querySelector('.player-info')?.getBoundingClientRect();
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
    // New rounds can contain the same card: it must still be dealt again.
    const old=!dealing&&key&&before.cards?.find(c=>c.key===key);
    if(old&&old.zone===(el.closest('.hand')?'hand':'table')){
      if(Math.abs(old.rect.x-rect.x)+Math.abs(old.rect.y-rect.y)>1)
        animate(el,[{translate:(old.rect.x-rect.x)+'px '+(old.rect.y-rect.y)+'px'},{translate:'0 0'}],timing.release);
      continue;
    }
    const origin=old?.rect||(['deal','next','hit','double','bet'].includes(action.type)?fallback:source||fallback);
    animate(el,cardFlight(origin,rect,{flip:['bet','hit','double'].includes(action.type)}),timing.release+order++*timing.stagger);
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
    ],old.zone==='hand'?timing.release:0);
  }
  const actor=action.seat===0?root.querySelector('.player-info .table-character'):root.querySelector('.s'+action.seat+' .table-character');
  let posed=false;
  if(actor && action.type==='play'){
    const path=playPosePath(actor.getAttribute('src'));
    if(path){
      const cached=poseCache.get(path),pose=cached?.image;
      if(!cached)void warmPlayPose(path);
      // Optional artwork never blocks a committed turn on a slow connection.
      if(cached?.ready && pose.naturalWidth>0){
        const r=actor.getBoundingClientRect();
        pose.className='motion-card';pose.alt='';pose.setAttribute('aria-hidden','true');
        Object.assign(pose.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',objectPosition:getComputedStyle(actor).objectPosition});
        document.body.append(pose);keepGhost(pose);
        animate(actor,[{opacity:1},{opacity:0,offset:.16},{opacity:0,offset:.76},{opacity:1}],0,timing.gesture);
        animate(pose,[{opacity:0},{opacity:1,offset:.16},{opacity:1,offset:.76},{opacity:0}],0,timing.gesture);
        posed=true;
      }
    }
  }
  if(actor&&!posed)animate(actor,[{translate:'0 0'},{translate:'0 -5px',rotate:'-2deg',offset:.4},{translate:'0 0',rotate:'0deg'}],0,ms*1.2);
  if(dealing){
    // Distribute face-down cards from the deck, alternating seats each beat.
    // Preserve each fan's resting rotation; never use hidden card identities.
    for(const [seat,hand] of [...root.querySelectorAll('.opponent-hand')].entries()){
      for(const [i,el] of [...hand.querySelectorAll('img')].entries()){
        const frames=cardFlight(fallback,el.getBoundingClientRect());
        const rotate=getComputedStyle(el).rotate;
        frames.forEach(frame=>frame.rotate=rotate);
        animate(el,frames,(i*3+seat)*(settings.fast?12:28));
      }
    }
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
