(() => {
  const slug=location.pathname.split('/').filter(Boolean).find(s=>['magic-bubble','dream-match','fairytale-defense'].includes(s));
  if(!slug)return;
  const config={
    'magic-bubble':['魔法泡泡龍','按住瞄準，放開發射。連結三顆同色泡泡，讓懸空泡泡一起掉落。','開始施展魔法'],
    'dream-match':['夢境消除','交換相鄰的圖案，連成三個以上。完成三種收集目標，善用洗牌與夢境魔法。','進入夢境'],
    'fairytale-defense':['童話塔防','先點守護台，再選擇角色部署。成長連射、夢想範圍、幸運緩速、信任增幅，守住八波敵人。','開始守護']
  }[slug];
  const entry=document.createElement('section');entry.className='game-entry';entry.setAttribute('aria-label',config[0]+'遊戲準備');
  const article=document.createElement('article');
  const img=new Image();img.src='../../assets/game-covers/'+slug+'.webp';img.alt='CxQ '+config[0];article.append(img);
  const p=document.createElement('p');p.textContent=config[1];article.append(p);
  const label=document.createElement('label');label.textContent='遊玩方式　';const mode=document.createElement('select');mode.setAttribute('aria-label','遊玩方式');mode.innerHTML='<option value="classic">經典挑戰</option><option value="relaxed">輕鬆遊玩</option>';label.append(mode);article.append(label);const start=document.createElement('button');start.textContent=config[2];article.append(start);entry.append(article);document.body.append(entry);
  const main=document.querySelector('main');main.inert=true;
  const chapters=slug==='dream-match'?['星光花園','月影圖書室','雲端鐘樓','極光夢境']:slug==='magic-bubble'?['花園清場','愛心採集','星願救援','水晶清場','深林採集','夜空救援']:['花園入口','蜿蜒林徑','城堡防線'];
  const chapterLabel=document.createElement('label');chapterLabel.textContent=slug==='fairytale-defense'?'守護地圖　':'冒險章節　';
  const chapter=document.createElement('select');chapter.setAttribute('aria-label',chapterLabel.textContent.trim());
  chapters.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' · '+name;chapter.append(option);});chapterLabel.append(chapter);article.insertBefore(chapterLabel,start);
  start.onclick=()=>{entry.hidden=true;main.inert=false;dispatchEvent(new CustomEvent('cxq-start',{detail:{mode:mode.value,chapter:Number(chapter.value)}}));document.querySelector('canvas,#board')?.focus();};
  if(slug==='fairytale-defense'){
    const gate=document.createElement('section');gate.className='orientation-gate';gate.innerHTML='<img src="../../assets/characters/cxq-role-growth.webp" alt="成長"><h2>請橫拿手機</h2><p>橫向展開完整防線。旋轉期間，戰鬥會暫停。</p>';document.body.append(gate);
    const orient=()=>{gate.hidden=innerWidth>=innerHeight;main.inert=!entry.hidden||!gate.hidden;};addEventListener('resize',orient);orient();
  }
})();
