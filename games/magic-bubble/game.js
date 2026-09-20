(() => {
  'use strict';
  const c=document.querySelector('#game'),x=c.getContext('2d'),$=s=>document.querySelector(s),R=32,C=9,ROWS=10,OX=360;let OY=735;
  const palette=['ruby','aqua','gold','violet','leaf','orange'];
  const load=src=>{const q=new Image;q.src=src;return q;};
  const art=palette.map(n=>load('../storybook/art-20260920/bubble-'+n+'.webp'));
  const launcher=load('../../assets/characters/cxq-role-dream.webp'),burst=load('../storybook/art-polish/bubble-burst.webp'),rescueArt=load('../../assets/characters/cxq-role-hope.webp');
  let firedAt=-1000,turns=0,offset=0,advanceAt=null,descending=null,difficulty='classic';
  const endless=()=>mode==='endless',locked=()=>!!flight||advanceAt!==null||!!descending;
  const reduced=()=>document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  let grid=[],tokens=new Set,effects=[],mode='classic',chapter=0,score=0,shots=0,skill=0,ball=0,next=0,over=false,aim=null,flight=null,last=0,clock=0,pending=null,collected=0,rescued=0;
  const key=(r,q)=>r+','+q,pos=(r,q)=>({x:56+q*70+((r+offset)%2)*35,y:46+r*61});
  const near=(r,q)=>[[r,q-1],[r,q+1],[r-1,q-((r+offset)%2?0:1)],[r-1,q+((r+offset)%2?1:0)],[r+1,q-((r+offset)%2?0:1)],[r+1,q+((r+offset)%2?1:0)]].filter(([r,q])=>r>=0&&r<ROWS&&q>=0&&q<C);
  const available=()=>[...new Set(grid.flat().filter(v=>v>=0))];
  const random=()=>{const a=available();return a.length?a[Math.floor(Math.random()*a.length)]:0;};
  const goal=()=>endless()?'第 '+turns+' 回合 · 發射後下降一排':chapter%3===0?'清空所有泡泡':chapter%3===1?'收集愛心 '+Math.min(collected,15+chapter*2)+'/'+(15+chapter*2):'救出星願 '+rescued+'/5';
  function reset(){
    clock=0;turns=0;offset=0;advanceAt=null;descending=null;effects=[];tokens=new Set;flight=null;aim=null;pending=null;score=0;collected=0;rescued=0;skill=0;over=false;
    const rows=endless()?3:chapter>=3?6:5,colors=endless()?3:Math.min(6,4+Math.floor(chapter/2));
    grid=Array.from({length:ROWS},(_,r)=>Array.from({length:C},()=>r<rows?Math.floor(Math.random()*colors):-1));
    if(!endless()&&chapter%3===1){const cells=Array.from({length:rows*C},(_,i)=>i).sort(()=>Math.random()-.5);for(const i of cells.slice(0,15+chapter*2))grid[Math.floor(i/C)][i%C]=0;}
    if(!endless()&&chapter%3===2)for(let q=0;q<C;q+=2)tokens.add(key(rows-1,q));
    shots=(difficulty==='relaxed'?42:32)+chapter;ball=random();next=random();$('#result').hidden=true;sync();
    feedback(endless()?'無盡挑戰 · 每次發射後下降一排':'第 '+(chapter+1)+' 關 · '+goal());
  }
  function group(r,q){
    const out=[],seen=new Set([key(r,q)]),todo=[[r,q]],color=grid[r][q];
    while(todo.length){const p=todo.pop();out.push(p);for(const n of near(...p)){const k=key(...n);if(!seen.has(k)&&grid[n[0]][n[1]]===color){seen.add(k);todo.push(n);}}}return out;
  }
  function remove(r,q,fall=false){
    const v=grid[r][q];if(v<0)return;
    if(v===0)collected++;if(tokens.delete(key(r,q)))rescued++;
    effects.push({...pos(r,q),v,fall,born:clock});grid[r][q]=-1;
  }
  function drop(){
    const held=new Set,todo=[];grid[0].forEach((v,q)=>{if(v>=0){held.add(key(0,q));todo.push([0,q]);}});
    while(todo.length)for(const n of near(...todo.pop())){const k=key(...n);if(grid[n[0]][n[1]]>=0&&!held.has(k)){held.add(k);todo.push(n);}}
    let count=0;for(let r=0;r<ROWS;r++)for(let q=0;q<C;q++)if(grid[r][q]>=0&&!held.has(key(r,q))){remove(r,q,true);count++;}
    score+=count*240;return count;
  }
  function collision(px,py){
    for(let r=0;r<ROWS;r++)for(let q=0;q<C;q++)if(grid[r][q]>=0){const p=pos(r,q);if(Math.hypot(p.x-px,p.y-py)<R*2-1)return[r,q];}return null;
  }
  function destination(px,py,hit){
    const options=hit?near(...hit).filter(([r,q])=>grid[r][q]<0):grid[0].map((v,q)=>[0,q]).filter(([r,q])=>grid[r][q]<0);
    options.sort((a,b)=>{const A=pos(...a),B=pos(...b);return Math.hypot(A.x-px,A.y-py)-Math.hypot(B.x-px,B.y-py);});
    return options[0];
  }
  function step(p,d){
    p.x+=p.vx*d;p.y+=p.vy*d;
    if(p.x<R){p.x=2*R-p.x;p.vx=Math.abs(p.vx);}
    if(p.x>c.width-R){p.x=2*(c.width-R)-p.x;p.vx=-Math.abs(p.vx);}
    return collision(p.x,p.y);
  }
  function place(dest){
    flight=null;if(!dest){end(false);return;}
    const [r,q]=dest;grid[r][q]=ball;const hit=group(r,q);
    if(hit.length>=3){for(const p of hit)remove(...p);score+=hit.length*120;skill=Math.min(100,skill+hit.length*9);const fallen=drop();feedback('消除 '+hit.length+' 顆'+(fallen?' · 連帶落下 '+fallen+' 顆':'')+'！');CxQ.sound('match');}else CxQ.sound('miss');
    ball=next;if(!available().includes(ball))ball=random();next=random();sync();if(endless()){advanceAt=clock+(reduced()?80:550);sync();}else check();
  }
  function check(){
    if(endless()){if(grid[ROWS-1].some(v=>v>=0))end(false);return;}
    const clear=!grid.some(row=>row.some(v=>v>=0)),win=clear||(chapter%3===1&&collected>=15+chapter*2)||(chapter%3===2&&rescued>=5);
    if(win||shots<=0||grid[ROWS-1].some(v=>v>=0))end(win);
  }
  function end(win){advanceAt=null;descending=null;over=true;pending={win,at:clock+650};flight=null;aim=null;}
  function result(win){
    if(endless()){
      const best=Math.max(score,CxQ.read('cxq-bubble-endless-best',0)),bestTurns=Math.max(turns,CxQ.read('cxq-bubble-endless-turns',0));
      CxQ.write('cxq-bubble-endless-best',best);CxQ.write('cxq-bubble-endless-turns',bestTurns);
      $('#resultTitle').textContent='無盡挑戰結束';$('#resultText').textContent=score.toLocaleString()+' 分 · 完成 '+turns+' 回合｜最高 '+best.toLocaleString()+' 分 · 最長 '+bestTurns+' 回合';$('#again').textContent='再挑戰一次';$('#again').onclick=reset;$('#result').hidden=false;CxQ.sound('lose');return;
    }
    $('#resultTitle').textContent=win?'星願完成！':'魔力暫時耗盡';$('#resultText').textContent='第 '+(chapter+1)+' 關 · '+score.toLocaleString()+' 分';
    CxQ.write('cxq-bubble-best',Math.max(score,CxQ.read('cxq-bubble-best',0)));
    if(win)CxQ.write('cxq-bubble-chapter',Math.max(chapter+1,CxQ.read('cxq-bubble-chapter',0)));
    $('#again').textContent=win&&chapter<5?'前往下一關':'再挑戰一次';
    $('#again').onclick=()=>{if(win&&chapter<5)chapter++;reset();};$('#result').hidden=false;CxQ.sound(win?'win':'lose');
  }
  function bubble(px,py,v,size=R){if(art[v]?.naturalWidth)x.drawImage(art[v],px-size,py-size,size*2,size*2);}
  function velocity(p){const dx=p.x-OX,dy=Math.min(-80,p.y-OY),l=Math.hypot(dx,dy);return{x:OX,y:OY,vx:dx/l,vy:dy/l};}
  function draw(){
    x.clearRect(0,0,c.width,c.height);
    for(let r=0;r<ROWS;r++)for(let q=0;q<C;q++)if(grid[r]?.[q]>=0){const p=pos(r,q);if(descending)p.y-=61*(1-Math.min(1,(clock-descending.start)/descending.duration));bubble(p.x,p.y,grid[r][q]);if(tokens.has(key(r,q))&&rescueArt.naturalWidth)x.drawImage(rescueArt,p.x-19,p.y-23,38,46);}
    if(endless()){x.save();x.strokeStyle='#ffb7a0';x.lineWidth=3;x.setLineDash([12,9]);x.beginPath();x.moveTo(20,46+9*61+R);x.lineTo(700,46+9*61+R);x.stroke();x.setLineDash([]);x.font='bold 32px sans-serif';x.fillStyle='#fff1d4';x.fillText('危險線',24,46+9*61+R+36);x.restore();}
    if(!locked()&&!over){
      const p=velocity(aim||{x:OX,y:350});x.strokeStyle='#ffe39b';x.lineWidth=3;x.setLineDash([9,10]);x.beginPath();x.moveTo(OX,OY);
      let target=null;for(let k=0;k<450;k++){const hit=step(p,4);x.lineTo(p.x,p.y);if(hit||p.y<=46){target=destination(p.x,p.y,hit);break;}}
      x.stroke();x.setLineDash([]);if(target){const q=pos(...target);x.globalAlpha=.45;bubble(q.x,q.y,ball);x.globalAlpha=1;}
    }
    if(launcher.naturalWidth){const kick=reduced()?0:Math.max(0,1-(clock-firedAt)/260);x.save();x.translate(OX,OY+105);x.rotate(-.08*Math.sin(kick*Math.PI));x.drawImage(launcher,-105,-240+Math.sin(kick*Math.PI)*8,210,255);x.restore();}
    if(!flight)bubble(OX,OY,ball);else{if(!reduced()){for(let i=3;i>0;i--){x.save();x.globalAlpha=.18/i;bubble(flight.x-flight.vx*i*19,flight.y-flight.vy*i*19,ball,R*(1-i*.18));x.restore();}}bubble(flight.x,flight.y,ball);}
    effects=effects.filter(e=>clock-e.born<(e.fall?900:500));
    for(const e of effects){const t=(clock-e.born)/1000;x.save();x.globalAlpha=Math.max(0,1-t/(e.fall?.9:.5));if(e.fall)bubble(e.x,e.y+470*t*t,e.v);else if(burst.naturalWidth){const s=reduced()?70:70+t*90;x.drawImage(burst,e.x-s/2,e.y-s/2,s,s);}x.restore();}
  }
  let feedbackTimer;function feedback(t){clearTimeout(feedbackTimer);$('#aimHint').textContent=t;feedbackTimer=setTimeout(()=>$('#aimHint').textContent=goal()+' · 按住瞄準，放開發射',2200);}
  function sync(){$('#score').textContent=score.toLocaleString();$('#shots').textContent=endless()?turns:shots;$('#shots').previousElementSibling.textContent=endless()?'完成回合':'剩餘發射';c.setAttribute('aria-label',endless()?'無盡泡泡棋盤，第 '+turns+' 回合':'闖關泡泡棋盤，第 '+(chapter+1)+' 關');c.dataset.busy=String(locked());$('#skillFill').style.width=skill+'%';$('#skill').disabled=skill<100||over||locked();$('#skill').textContent=skill>=100?'施放星願魔法':'星願魔法 '+skill+'%';$('#next').style.backgroundImage="url('../storybook/art-20260920/bubble-"+palette[next]+".webp')";}
  const pointer=e=>{const b=c.getBoundingClientRect();return{x:(e.clientX-b.left)*c.width/b.width,y:(e.clientY-b.top)*c.height/b.height};};
  c.onpointerdown=e=>{if(over||locked()||window.CxQSession?.blocked())return;e.preventDefault();aim=pointer(e);c.setPointerCapture(e.pointerId);};
  c.onpointermove=e=>{if(aim)aim=pointer(e);};
  c.onpointerup=e=>{if(!aim)return;const p=pointer(e);aim=null;if(over||locked()||window.CxQSession?.blocked()||p.y>OY-60)return;flight=velocity(p);firedAt=clock;if(!endless())shots--;sync();};
  c.onpointercancel=()=>aim=null;
  function swap(){if(over||locked()||window.CxQSession?.blocked())return;[ball,next]=[next,ball];sync();CxQ.sound('flip');}
  $('#next').tabIndex=0;$('#next').setAttribute('role','button');$('#next').setAttribute('aria-label','交換目前與下一顆泡泡');$('#next').onclick=swap;$('#next').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();swap();}};
  $('#skill').onclick=()=>{if(skill<100||locked()||over||window.CxQSession?.blocked())return;const counts=palette.map((_,i)=>grid.flat().filter(v=>v===i).length),v=counts.indexOf(Math.max(...counts));let n=0;grid.forEach((row,r)=>row.forEach((value,q)=>{if(value===v){remove(r,q);n++;}}));score+=n*150;skill=0;drop();ball=random();next=random();sync();check();CxQ.sound('upgrade');};
  $('#restart').onclick=reset;$('#again').onclick=reset;$('#help').onclick=()=>$('#guide').showModal();$('#guide button').onclick=()=>$('#guide').close();
  const back=document.createElement('button');back.textContent='返回魔法花園';back.onclick=()=>{$('#result').hidden=true;document.querySelector('.game-entry').hidden=false;document.querySelector('main').inert=true;};$('#result>div').append(back);
  window.CxQGame={restart:reset,busy:()=>locked(),home:()=>{advanceAt=null;descending=null;flight=null;aim=null;pending=null;over=true;$('#result').hidden=true;document.querySelector('.game-entry').hidden=false;document.querySelector('main').inert=true;}};
  CxQ.configure({music:'heavenly'});
  addEventListener('cxq-start',e=>{mode=e.detail.mode;difficulty=e.detail.difficulty||e.detail.mode;chapter=0;reset();});
  function frame(t){const dt=last?Math.min(40,t-last):0;last=t;if(!window.CxQSession?.blocked()&&!document.querySelector('.game-entry:not([hidden])')){
    clock+=dt;if(flight){for(let k=0;k<4&&flight;k++){const hit=step(flight,dt*.65/4);if(hit||flight.y<=46)place(destination(flight.x,flight.y,hit));}}
    if(advanceAt!==null&&clock>=advanceAt){advanceAt=null;const shifted=BubbleEndless.advance(grid,turns);grid=shifted.grid;offset=1-offset;descending={start:clock,duration:reduced()?1:420,overflow:shifted.overflow};sync();}
    if(descending&&clock-descending.start>=descending.duration){const overflow=descending.overflow;descending=null;turns++;if(!available().includes(ball))ball=random();next=random();sync();feedback('第 '+turns+' 回合 · 已補入新一排');if(overflow)end(false);else check();}
    if(pending&&clock>=pending.at){const p=pending;pending=null;result(p.win);}
  }draw();requestAnimationFrame(frame);}
  function fit(){const holder=c.parentElement;if(innerHeight>innerWidth&&holder.clientWidth>0){const height=Math.max(820,Math.round((holder.clientHeight-28)*720/holder.clientWidth));if(c.height!==height)c.height=height;OY=height-125;}else{c.height=820;OY=735;}}
  new ResizeObserver(fit).observe(c.parentElement);addEventListener('resize',fit);fit();reset();requestAnimationFrame(frame);
})();
