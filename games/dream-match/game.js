(() => {
  'use strict';
  const R=DreamRules,M=DreamMotion,N=R.N,$=s=>document.querySelector(s),board=$('#board');
  const names=['愛心','水滴','星光','月光','葉芽','暖陽'],art='../storybook/art-studio/',newArt='../storybook/art-20260920-batch/';
  let mode='classic',chapter=0,a=[],special={},selected=null,moves=0,score=0,charge=0,shuffle=2,goals=[],busy=false,ended=false,lastInput=0;
  const rnd=()=>Math.floor(Math.random()*6),wait=async ms=>{await new Promise(r=>setTimeout(r,ms));await window.CxQSession?.waitReady();};
  const chapters=['星光花園','月影圖書室','雲端鐘樓','極光夢境'];
  function fresh(){
    if(busy)return;
    do{a=Array.from({length:N*N},rnd);}while(R.match(a).size||!R.move(a));
    special={};selected=null;ended=false;moves=(mode==='relaxed'?34:26)-chapter;score=0;charge=0;shuffle=2;
    goals=[0,1,2].map((_,i)=>({color:(i+chapter)%6,need:(mode==='relaxed'?10:12)+chapter*3,got:0}));
    $('#result').hidden=true;document.querySelector('header p').textContent='第 '+(chapter+1)+' 章 · '+chapters[chapter];
    lastInput=performance.now();render();
  }
  const reduced=()=>document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(pop=new Set){
    board.setAttribute('aria-busy',String(busy));
    board.replaceChildren();
    a.forEach((v,i)=>{
      const cell=document.createElement('button');cell.className='cell'+(i===selected?' selected':'')+(pop.has(i)?' pop':'');
      cell.dataset.i=i;cell.setAttribute('aria-label',names[v]+' '+(special[i]==='prism'?'彩虹魔晶':special[i]?'直線魔晶':'')+' 第'+(Math.floor(i/N)+1)+'列第'+(i%N+1)+'格');
      const gem=document.createElement('img');gem.className='gem';gem.alt='';gem.draggable=false;
      gem.src=special[i]==='prism'?newArt+'dream-prism.webp':art+'dream-gem-'+v+'.webp';cell.append(gem);
      if(special[i]&&special[i]!=='prism'){const mark=new Image();mark.src=newArt+'dream-line.webp';mark.className='special-mark '+special[i];mark.alt='';cell.append(mark);}
      board.append(cell);
    });
    $('#score').textContent=score.toLocaleString();$('#moves').textContent=moves;$('#charge').style.width=charge+'%';
    $('#burst').disabled=charge<100||busy||ended;$('#shuffle').disabled=shuffle<=0||busy||ended;$('#shuffleCount').textContent='剩餘 '+shuffle+' 次';$('#shuffle small').textContent='剩餘 '+shuffle+' 次';$('#burst small').textContent=charge>=100?'點擊施放':'能量 '+charge+'%';
    $('#goals').innerHTML=goals.map(g=>'<div class="goal"><img class="gemMini" src="'+art+'dream-gem-'+g.color+'.webp" alt="'+names[g.color]+'"><b>'+Math.min(g.got,g.need)+'/'+g.need+'</b></div>').join('');
  }
  function exchange(i,j){[a[i],a[j]]=[a[j],a[i]];const si=special[i],sj=special[j];delete special[i];delete special[j];if(si)special[j]=si;if(sj)special[i]=sj;}
  async function animateSwap(i,j){
    await M.swap(board,i,j);await window.CxQSession?.waitReady();
  }
  async function click(i){
    if(busy||ended||window.CxQSession?.blocked())return;
    lastInput=performance.now();
    if(selected===null){selected=i;render();return;}
    const j=selected;
    if(i===j){selected=null;render();return;}
    if(Math.abs(Math.floor(i/N)-Math.floor(j/N))+Math.abs(i%N-j%N)!==1){selected=i;render();return;}
    busy=true;render();await animateSwap(i,j);exchange(i,j);selected=null;
    let m=R.match(a),combo=false;
    if(special[i]==='prism'||special[j]==='prism'){
      combo=true;const both=special[i]==='prism'&&special[j]==='prism',color=special[i]==='prism'?a[j]:a[i];
      a.forEach((v,k)=>{if(both||v===color)m.add(k);});m.add(i);m.add(j);
    }else if(special[i]&&special[j]){combo=true;m.add(i);m.add(j);}
    if(!m.size){render();await animateSwap(i,j);exchange(i,j);busy=false;render();toast('需要三個相同圖案連成一線');CxQ.sound('miss');return;}
    moves--;await cascade(m,combo?[]:[i,j],combo);busy=false;render();await check();
  }
  async function cascade(initial,preferred=[],forced=false){
    let m=initial,combo=1;
    while(m.size){
      const activated={...special},made=forced?{}:R.specials(a,special,preferred);
      m=R.expand(a,special,m);
      for(const key of Object.keys(made)){special[key]=made[key];m.delete(+key);}
      render(m);toast((combo>1?combo+' 連鎖！':'消除 '+m.size+' 個')+' · +'+m.size*100*combo);
      await M.clear(board,m,made,activated,a,goals);await wait(reduced()?60:30);
      for(const i of m){const g=goals.find(g=>g.color===a[i]);if(g)g.got++;a[i]=-1;delete special[i];}
      score+=m.size*100*combo;charge=Math.min(100,charge+m.size*5);
      const nextSpecial={},fall={};
      for(let c=0;c<N;c++){
        const kept=[];for(let r=N-1;r>=0;r--){const i=r*N+c;if(a[i]>=0)kept.push({v:a[i],s:special[i],row:r});}
        for(let r=N-1;r>=0;r--){const i=r*N+c,p=kept[N-1-r];a[i]=p?p.v:rnd();fall[i]=p?r-p.row:N-kept.length;if(p?.s)nextSpecial[i]=p.s;}
      }
      special=nextSpecial;CxQ.sound('match');render();await M.fall(board,fall);await wait(reduced()?60:70);
      m=R.match(a);combo++;preferred=[];forced=false;
    }
    lastInput=performance.now();
  }
  function reshuffle(){
    const pieces=a.map((v,i)=>({v,s:special[i]}));
    let tries=0;
    do{for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
      a=pieces.map(p=>p.v);special={};pieces.forEach((p,i)=>{if(p.s)special[i]=p.s;});
      if(++tries>200){a=Array.from({length:N*N},rnd);special={};pieces.splice(0,pieces.length,...a.map(v=>({v})));}
    }while(R.match(a).size||!R.move(a,special));selected=null;lastInput=performance.now();
  }
  async function animateReshuffle(){
    busy=true;render();await M.shuffle(board,true);await window.CxQSession?.waitReady();reshuffle();render();await M.shuffle(board,false);await window.CxQSession?.waitReady();busy=false;render();
  }
  async function check(){
    const win=goals.every(g=>g.got>=g.need);
    if(win||moves<=0){
      ended=true;$('#resultTitle').textContent=win?chapters[chapter]+'修復完成！':'再試一次，夢境等著你';
      $('#resultText').textContent='獲得 '+score.toLocaleString()+' 分 · 剩餘 '+moves+' 步';
      const best=Math.max(score,CxQ.read('cxq-match-best',0));CxQ.write('cxq-match-best',best);
      if(win)CxQ.write('cxq-match-chapter',Math.max(chapter+1,CxQ.read('cxq-match-chapter',0)));
      $('#again').textContent='再挑戰一次';
      $('#again').onclick=()=>fresh();$('#result').hidden=false;CxQ.sound(win?'win':'lose');return;
    }
    if(!R.move(a,special)){toast('沒有可消除的組合，免費重整中');await animateReshuffle();toast('夢境重整完成，不扣步數');}
  }
  let toastTimer;function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;M.feedback($('#toast'));toastTimer=setTimeout(()=>$('#toast').textContent='',1900);}
  board.onclick=e=>{const c=e.target.closest('.cell');if(c)click(+c.dataset.i);};
  $('#burst').onclick=async()=>{if(charge<100||busy||ended||window.CxQSession?.blocked())return;busy=true;render();const counts=names.map((_,v)=>a.filter(x=>x===v).length),v=counts.indexOf(Math.max(...counts));charge=0;await cascade(new Set(a.map((x,i)=>x===v?i:-1).filter(i=>i>=0)),[],true);busy=false;render();await check();};
  $('#shuffle').onclick=async()=>{if(!shuffle||busy||ended||window.CxQSession?.blocked())return;shuffle--;toast('重整夢境中');CxQ.sound('flip');await animateReshuffle();toast('重整完成，不扣步數');};
  $('#restart').onclick=()=>fresh();$('#again').onclick=()=>fresh();
  $('#guideBtn').onclick=()=>$('#guide').showModal();$('#guide button').onclick=()=>$('#guide').close();
  const home=document.createElement('button');home.textContent='返回夢境入口';home.onclick=()=>{if(busy)return;$('#result').hidden=true;document.querySelector('.game-entry').hidden=false;document.querySelector('main').inert=true;};$('#result section').append(home);
  setInterval(()=>{if(busy||ended||window.CxQSession?.blocked()||!document.querySelector('.game-entry[hidden]')||performance.now()-lastInput<6500)return;const hint=R.move(a,special);if(hint)M.hint(board,hint);lastInput=performance.now();},1200);
  window.CxQGame={restart:fresh,busy:()=>busy,home:()=>{ended=true;$('#result').hidden=true;document.querySelector('.game-entry').hidden=false;document.querySelector('main').inert=true;}};
  CxQ.configure({music:'heavenly'});
  addEventListener('cxq-start',e=>{mode=e.detail.mode;chapter=0;fresh();});
  fresh();
})();
