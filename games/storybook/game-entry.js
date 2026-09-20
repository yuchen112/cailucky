(() => {
  const slug=location.pathname.split('/').filter(Boolean).find(s=>['magic-bubble','dream-match','fairytale-defense'].includes(s));
  if(!slug)return;
  const config={
    'magic-bubble':['魔法泡泡龍','按住瞄準、放開發射。連結三顆同色，讓懸空泡泡掉落。','開始施展魔法'],
    'dream-match':['夢境消除','交換相鄰寶石，連成三顆以上。在步數內完成收集目標。','進入夢境'],
    'fairytale-defense':['童話塔防','先點守護台，再選擇角色部署。成長連射、夢想範圍、幸運緩速、信任增幅，守住八波敵人。','開始守護']
  }[slug];
  const entry=document.createElement('section');entry.className='game-entry';entry.setAttribute('aria-label',config[0]+'遊戲準備');
  const article=document.createElement('article');
  entry.classList.add('director-entry');const heading=document.createElement('header');heading.className='entry-title';heading.innerHTML='<small>CxQ · '+({'magic-bubble':'魔法花園','dream-match':'月光夢劇場','fairytale-defense':'城堡守護戰'})[slug]+'</small><h1>'+config[0]+'</h1>';article.append(heading);const cast=document.createElement('div');cast.className='entry-cast';const img=new Image();img.src='../../assets/characters/cxq-role-'+({'magic-bubble':'dream','dream-match':'night','fairytale-defense':'trust'})[slug]+'.webp';img.alt=({'magic-bubble':'夢想','dream-match':'月夜','fairytale-defense':'信任'})[slug]+'夥伴';cast.append(img);article.append(cast);
  const p=document.createElement('p');p.textContent=config[1];article.append(p);
  const label=document.createElement('label');label.textContent='遊玩方式　';const mode=document.createElement('select');mode.setAttribute('aria-label','遊玩方式');mode.innerHTML='<option value="classic">經典挑戰</option><option value="relaxed">輕鬆遊玩</option>';label.append(mode);article.append(label);const start=document.createElement('button');start.textContent=config[2];article.append(start);entry.append(article);document.body.append(entry);
  const main=document.querySelector('main');main.inert=true;
  const chapters=slug==='fairytale-defense'?['花園入口','蜿蜒林徑','城堡防線']:[];
  const chapterLabel=document.createElement('label');chapterLabel.textContent=slug==='fairytale-defense'?'守護地圖　':'冒險章節　';
  const chapter=document.createElement('select');chapter.setAttribute('aria-label',chapterLabel.textContent.trim());
  chapters.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' · '+name;chapter.append(option);});chapterLabel.append(chapter);if(chapters.length)article.insertBefore(chapterLabel,start);
  start.onclick=()=>{entry.hidden=true;main.inert=false;dispatchEvent(new CustomEvent('cxq-start',{detail:{mode:mode.value,chapter:Number(chapter.value)||0}}));document.querySelector('canvas,#board')?.focus();};

})();
