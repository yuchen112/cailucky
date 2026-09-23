(() => {
  'use strict';
  const $=s=>document.querySelector(s),c=$('#field'),x=c.getContext('2d');
  const load=s=>{const i=new Image;i.src=s;return i;},A='../storybook/art-20260914/',B='../storybook/art-20260920-batch/';
  const bg=load(A+'tower-ground.webp'),road=load(A+'road-tile.webp'),burst=load(A+'explosion.webp');
  const kinds=['growth','dream','luck','trust'],names={growth:'成長',dream:'夢想',luck:'幸運',trust:'信任'};
  const chars=Object.fromEntries(kinds.map(k=>[k,load('../../assets/characters/cxq-role-'+k+'.webp')]));
  const towersArt=Object.fromEntries(kinds.map(k=>[k,load(k==='trust'?B+'tower-trust.webp':A+'tower-'+k+'.webp')]));
  const bullets=Object.fromEntries(kinds.map((k,i)=>[k,load(A+'gem-'+[4,3,2,1][i]+'.webp')]));
  const enemyArt=Array.from({length:4},(_,i)=>load(A+'enemy-'+i+'.webp'));
  const defs={
    growth:{cost:80,range:170,rate:.55,damage:20,description:'快速單體'},
    dream:{cost:120,range:155,rate:1.1,damage:29,splash:65,description:'範圍魔法'},
    luck:{cost:100,range:175,rate:.85,damage:12,slow:.5,description:'緩速控制'},
    trust:{cost:100,range:185,rate:1,damage:0,support:true,description:'附近攻擊增幅'}
  };
  const maps=[
    {name:'花園入口',path:[[0,205],[145,185],[285,270],[440,315],[610,300],[765,355],[930,375],[1100,285]],pads:[[210,105],[352,180],[145,300],[500,435],[650,190],[365,425],[710,470],[920,255]]},
    {name:'蜿蜒林徑',path:[[0,160],[330,160],[330,480],[730,480],[730,200],[1100,200]],pads:[[180,260],[430,260],[210,410],[460,385],[615,580],[830,410],[630,285],[920,300]]},
    {name:'城堡防線',path:[[0,420],[200,420],[200,185],[530,185],[530,435],[860,435],[860,180],[1100,180]],pads:[[100,300],[305,290],[405,90],[635,310],[410,410],[740,535],[965,315],[760,100]]}
  ];
  const enemyTypes=[{name:'漫步夢魘',hp:1,speed:1,armor:1},{name:'疾走夢魘',hp:.65,speed:1.65,armor:1},{name:'重甲夢魘',hp:1.85,speed:.72,armor:.68},{name:'夢魘首領',hp:4.5,speed:.55,armor:.85}];
  let map=0,mode='classic',towers=[],enemies=[],shots=[],effects=[],coins=0,life=0,wave=0,running=false,selected=-1,speed=1,clock=0,last=0,spawnLeft=0,spawnAt=0,over=false,kills=0,path,pads,lengths;
  const supportButton=document.createElement('button');supportButton.className='tower';supportButton.dataset.kind='trust';supportButton.innerHTML='<img src="../../assets/characters/cxq-role-trust-thumb.webp" alt=""><span><b>守護支援</b><small>範圍增幅／修復城堡</small><em>100 星幣</em></span>';$('#selected').before(supportButton);
  const pauseBtn=document.createElement('button');pauseBtn.textContent='暫停';pauseBtn.id='battlePause';$('.hud').append(pauseBtn);
  const pausePanel=document.createElement('dialog');pausePanel.innerHTML='<h2>防線已暫停</h2><p>敵人、守護者與技能時間都停在這一刻。</p><button data-resume>繼續守護</button><button data-home>返回守護入口</button>';document.body.append(pausePanel);pauseBtn.onclick=()=>pausePanel.showModal();pausePanel.querySelector('[data-resume]').onclick=()=>pausePanel.close();pausePanel.querySelector('[data-home]').onclick=()=>{pausePanel.close();home();};
  function home(){running=false;over=true;$('#result').hidden=true;document.querySelector('.game-entry').hidden=false;document.querySelector('main').inert=true;}
  function reset(){
    layoutMap();
    towers=Array(8).fill(null);enemies=[];shots=[];effects=[];coins=mode==='relaxed'?380:280;life=mode==='relaxed'?30:20;wave=0;running=false;selected=-1;speed=1;clock=0;spawnLeft=0;over=false;kills=0;$('#result').hidden=true;
    document.querySelector('header p').textContent=maps[map].name+' · 八波守護';sync();draw();
  }
  function layoutMap(){path=maps[map].path.map(p=>[...p]);pads=maps[map].pads.map(p=>[...p]);lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));}
  const total=()=>lengths.reduce((a,b)=>a+b,0);
  function route(p){let rest=p;for(let i=0;i<lengths.length;i++){if(rest<=lengths[i]){const t=rest/lengths[i];return[path[i][0]+(path[i+1][0]-path[i][0])*t,path[i][1]+(path[i+1][1]-path[i][1])*t];}rest-=lengths[i];}return path.at(-1);}
  function stats(t){const d=defs[t.kind],power=1+(t.level-1)*.35;return{...d,damage:d.damage*power*(t.branch==='power'?1.4:1),range:d.range+(t.branch==='reach'?65:0),rate:d.rate*(t.branch==='reach'?.8:1),splash:(d.splash||0)*(t.branch==='power'?1.4:1)};}
  function sync(){
    $('#life').textContent=Math.max(0,life);$('#coin').textContent=coins;$('#wave').textContent=wave+' / 8';$('#speed').textContent='速度 ×'+speed;
    $('#startWave').textContent=running?'夢魘來襲中':'開始第 '+Math.min(8,wave+1)+' 波';$('#startWave').disabled=running||over||wave>=8;
    $('.canvasWrap p').textContent=running?'留意疾走與重甲，搭配緩速和範圍攻擊。':'下一波：'+(wave>=6?'首領＋重甲混合':wave>=3?'重甲＋疾走':wave>=1?'疾走＋漫步':'漫步夢魘')+' · 點守護台部署';
    document.querySelectorAll('.tower').forEach(b=>{b.disabled=selected<0||!!towers[selected]||coins<defs[b.dataset.kind].cost||over;b.classList.toggle('active',towers[selected]?.kind===b.dataset.kind);});
    const t=towers[selected],panel=$('#selected');document.querySelector('aside').classList.toggle('has-tower',!!t);
    if(!t){panel.innerHTML='<h3>'+(selected<0?'點選地圖守護台':'第 '+(selected+1)+' 座守護台')+'</h3><p>選擇上方夥伴部署。信任可增幅附近夥伴。</p>';return;}
    const d=stats(t),branch=t.branch==='power'?'強化專精':t.branch==='reach'?'廣域專精':'尚未專精';
    panel.innerHTML='<h3>'+names[t.kind]+' Lv.'+t.level+' · '+branch+'</h3><p>'+(d.support?'範圍內攻擊增幅 '+Math.round((.2+t.level*.08)*100)+'%':'攻擊 '+Math.round(d.damage)+' · 射程 '+d.range)+'<br>累計貢獻 '+Math.round(t.dealt)+'</p>';
    const sell=document.createElement('button');sell.className='sell-tower';const refund=Math.floor((t.invested??defs[t.kind].cost)*.7);sell.textContent='拆除 · 返還 '+refund+' 星幣';sell.onclick=()=>{if(over||window.CxQSession?.blocked())return;const dialog=document.createElement('dialog');dialog.innerHTML='<h2>拆除這座守護塔？</h2><p>返還 '+refund+' 星幣，位置可重新建造。</p><button data-cancel>保留</button><button data-sell>確認拆除</button>';document.body.append(dialog);dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.querySelector('[data-sell]').onclick=()=>{coins+=refund;towers[selected]=null;dialog.close();sync();CxQ.sound('flip');};dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();};panel.append(sell);
    if(t.level<3){
      const choices=t.level===1?[['power',d.support?'修復專精':'強化專精'],['reach','廣域專精']]:[[t.branch,'升至 Lv.3']];
      for(const [branch,title]of choices){const b=document.createElement('button');b.textContent=title+' · '+70*t.level+' 星幣';b.disabled=coins<70*t.level;b.onclick=()=>upgrade(branch);panel.append(b);}
    }
  }
  window.CxQGame={home,restart:reset};
  function start(){if(running||over||wave>=8||window.CxQSession?.blocked())return;wave++;running=true;spawnLeft=5+wave*2;spawnAt=clock;sync();CxQ.sound('upgrade');}
  function spawn(){const count=5+wave*2-spawnLeft,type=wave===8&&count===0?3:wave>=4&&count%3===0?2:wave>=2&&count%3===1?1:0,D=enemyTypes[type],hp=(32+wave*15)*(1+map*.13)*D.hp;enemies.push({p:0,hp,max:hp,speed:(33+wave*2)*D.speed,slow:1,slowUntil:0,reward:12+wave*2,type,flash:0});}
  function damage(t,e,n){const amount=Math.min(Math.max(0,e.hp),n*(t.kind==='dream'?1:enemyTypes[e.type].armor));e.hp-=amount;t.dealt+=amount;e.flash=.1;}
  function update(dt){
    if(running&&spawnLeft&&clock>=spawnAt){spawn();spawnLeft--;spawnAt=clock+Math.max(.4,.95-wave*.045);}
    for(const e of enemies){if(clock>=e.slowUntil)e.slow=1;e.p+=e.speed*e.slow*dt;e.flash=Math.max(0,e.flash-dt);}
    const escaped=enemies.filter(e=>e.p>=total());if(escaped.length){life-=escaped.reduce((n,e)=>n+(e.type===3?5:1),0);enemies=enemies.filter(e=>e.p<total());sync();if(life<=0){finish(false);return;}}
    for(let i=0;i<towers.length;i++){
      const t=towers[i];if(!t)continue;const d=stats(t);if(d.support||clock<t.ready)continue;
      const P=pads[i],targets=enemies.filter(e=>e.hp>0&&Math.hypot(...route(e.p).map((v,j)=>v-P[j]))<d.range).sort((a,b)=>b.p-a.p);if(!targets.length)continue;
      const e=targets[0],q=route(e.p),support=towers.reduce((boost,s,j)=>s?.kind==='trust'&&Math.hypot(pads[j][0]-P[0],pads[j][1]-P[1])<stats(s).range?Math.max(boost,.2+s.level*.08):boost,0),n=d.damage*(1+support);
      shots.push({a:[...P],b:q,target:e,tower:t,damage:n,splash:d.splash,slow:d.slow?(t.branch==='power'?.3:d.slow):0,kind:t.kind,t:0,duration:.24});t.fired=clock;
      t.ready=clock+d.rate;
    }
    // Resolve homing projectiles only when their visible flight reaches the target.
    for(const shot of shots){
      shot.t+=dt;
      if(enemies.includes(shot.target))shot.b=route(shot.target.p);
      if(shot.t<shot.duration)continue;
      if(shot.splash){
        for(const e of enemies){const q=route(e.p);if(e.hp>0&&Math.hypot(q[0]-shot.b[0],q[1]-shot.b[1])<=shot.splash)damage(shot.tower,e,shot.damage);}
      }else if(enemies.includes(shot.target)&&shot.target.hp>0){
        damage(shot.tower,shot.target,shot.damage);
        if(shot.slow){shot.target.slow=shot.slow;shot.target.slowUntil=clock+1.7;}
      }
      effects.push({x:shot.b[0],y:shot.b[1],t:0,impact:true});
    }
    if(shots.some(s=>s.t>=s.duration))CxQ.sound('hit');
    const dead=enemies.filter(e=>e.hp<=0);for(const e of dead){coins+=e.reward;kills++;const p=route(e.p);effects.push({x:p[0],y:p[1],t:0});}
    enemies=enemies.filter(e=>e.hp>0);shots=shots.filter(s=>s.t<s.duration);effects.forEach(e=>e.t+=dt);effects=effects.filter(e=>e.t<.4);
    if(dead.length)sync();
    if(running&&!spawnLeft&&!enemies.length&&!shots.length){running=false;coins+=45;towers.forEach(t=>{if(t?.kind==='trust'&&t.branch==='power')life=Math.min(mode==='relaxed'?30:20,life+t.level);});if(wave>=8){finish(true);return;}CxQ.sound('match');sync();}
  }
  function sprite(im,px,py,w,h){if(im?.naturalWidth)x.drawImage(im,px,py,w,h);}
  function draw(){
    x.clearRect(0,0,c.width,c.height);if(bg.naturalWidth){const scale=Math.max(c.width/bg.naturalWidth,c.height/bg.naturalHeight),w=bg.naturalWidth*scale,h=bg.naturalHeight*scale;sprite(bg,(c.width-w)/2,(c.height-h)/2,w,h);}
    for(let d=0;d<=total();d+=30){const p=route(d);sprite(road,p[0]-38,p[1]-38,76,76);}
    pads.forEach((p,i)=>{
      const t=towers[i];if(!t){sprite(road,p[0]-48,p[1]-36,96,72);x.fillStyle='#233924';x.font='bold 25px sans-serif';x.textAlign='center';x.fillText(i+1,p[0],p[1]+8);}
      if(selected===i){x.strokeStyle='#fff0a0';x.lineWidth=3;x.setLineDash([8,8]);x.beginPath();x.arc(p[0],p[1],t?stats(t).range:48,0,Math.PI*2);x.stroke();x.setLineDash([]);}
      if(t){const recoil=clock-t.fired<.12?4:0;const scale=1+(t.level-1)*.09;sprite(towersArt[t.kind],p[0]-52*scale,p[1]-45*scale,104*scale,116*scale);sprite(chars[t.kind],p[0]-38,p[1]-76-recoil,76,88);if(t.branch)sprite(bullets[t.branch==='power'?'dream':'luck'],p[0]+25,p[1]-70,30,30);x.fillStyle='#fff7cd';x.font='bold 18px sans-serif';x.textAlign='center';x.fillText('Lv.'+t.level,p[0],p[1]+63);}
    });
    for(const e of enemies){const p=route(e.p),size=e.type===3?90:62,bob=Math.sin(clock*9+e.p)*3;x.save();if(e.flash)x.filter='brightness(1.8)';sprite(enemyArt[e.type],p[0]-size/2,p[1]-size/2+bob,size,size);x.restore();sprite(road,p[0]-27,p[1]-43,54,12);x.save();x.beginPath();x.rect(p[0]-25,p[1]-41,50*Math.max(0,e.hp/e.max),8);x.clip();sprite(bullets.growth,p[0]-25,p[1]-41,50,8);x.restore();}
    for(const s of shots){const t=s.t/s.duration,px=s.a[0]+(s.b[0]-s.a[0])*t,py=s.a[1]+(s.b[1]-s.a[1])*t;sprite(bullets[s.kind],px-15,py-15,30,30);}
    for(const e of effects){x.globalAlpha=1-e.t/.4;sprite(burst,e.x-40,e.y-40,80,80);}x.globalAlpha=1;
  }
  c.onclick=e=>{if(over||window.CxQSession?.blocked())return;const b=c.getBoundingClientRect(),scale=Math.min(b.width/c.width,b.height/c.height),px=(e.clientX-b.left-(b.width-c.width*scale)/2)/scale,py=(e.clientY-b.top-(b.height-c.height*scale)/2)/scale;let best=-1,dist=Math.max(60,24/scale);pads.forEach((p,i)=>{const d=Math.hypot(p[0]-px,p[1]-py);if(d<dist){best=i;dist=d;}});if(best>=0){selected=best;sync();}};
  document.querySelectorAll('.tower').forEach(b=>b.onclick=()=>{if(over||window.CxQSession?.blocked()||selected<0||towers[selected])return;const kind=b.dataset.kind,d=defs[kind];if(coins<d.cost)return;coins-=d.cost;towers[selected]={kind,invested:d.cost,level:1,branch:null,ready:0,fired:-1,dealt:0};sync();CxQ.sound('match');});
  function upgrade(branch){const t=towers[selected];if(!t||t.level>=3||coins<70*t.level||window.CxQSession?.blocked())return;t.invested=(t.invested??defs[t.kind].cost)+70*t.level;coins-=70*t.level;t.level++;t.branch=branch;sync();CxQ.sound('upgrade');}
  function finish(win){over=true;running=false;$('#resultTitle').textContent=win?'花園守住了！':'再調整一次防線';const top=towers.filter(Boolean).sort((a,b)=>b.dealt-a.dealt)[0];$('#resultText').textContent=maps[map].name+' · 第 '+wave+' 波 · 擊退 '+kills+' 隻'+(top?' · 最佳貢獻：'+names[top.kind]:'');$('#result').hidden=false;CxQ.write('cxq-defense-best',Math.max(wave,CxQ.read('cxq-defense-best',0)));CxQ.sound(win?'win':'lose');}
  const back=document.createElement('button');back.textContent='返回守護入口';back.onclick=home;$('#result section').append(back);
  $('#startWave').onclick=start;$('#speed').onclick=()=>{speed=speed===1?2:1;sync();};$('#again').onclick=reset;$('#guideBtn').onclick=()=>$('#guide').showModal();$('#guide button').onclick=()=>$('#guide').close();
  $('#guide p').textContent='點守護台部署：成長快速單體、夢想範圍攻擊並穿透重甲、幸運緩速、信任增幅附近夥伴。升級時選擇強化或廣域專精；信任的修復專精會在每波結束補充城堡生命。守住八波獲勝。';
  CxQ.configure({music:'sherwood'});addEventListener('cxq-start',e=>{mode=e.detail.mode;map=Math.max(0,Math.min(2,Number(e.detail.chapter)||0));reset();});
  c.width=1100;c.height=650;reset();new ResizeObserver(()=>draw()).observe(c);function frame(t){const dt=last?Math.min(.04,(t-last)/1000)*speed:0;last=t;if(!over&&!window.CxQSession?.blocked()&&!document.querySelector('.game-entry:not([hidden])')){clock+=dt;update(dt);}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
