/* Scene composition only. Game state remains owned by each game's controller. */
(() => {
  const id=document.body.dataset.game;
  const key=({'magic-bubble':'bubble','dream-match':'dream','fairytale-defense':'tower'})[id]||id;
  if(!['merge','bubble','dream','tower','whack','flappy','dino','mines'].includes(key))return;
  document.body.classList.add('studio');
  const q=s=>document.querySelector(s);
  const title=q('#home h1,.game-entry h1');
  if(title){const image=new Image();image.src='../storybook/art-studio/'+key+'-title.webp';image.alt=title.textContent;image.className='studio-title';title.replaceChildren(image);}
  const append=(parent,selector)=>{const el=q(selector);if(el)parent.append(el);return el;};
  const home=q('#home');
  if(home?.classList.contains('director-home')){
    const stage=document.createElement('section');stage.className='studio-showcase';
    append(stage,'.home-title');append(stage,'.cast-stage');append(stage,'.cast-caption');
    const controls=document.createElement('section');controls.className='studio-controls';
    append(controls,'.mode-ticket');append(controls,'.lobby-start');append(controls,'.lobby-dock');home.append(stage,controls);
    q('.home-title p').hidden=true;
    q('.home-title small').textContent='CxQ · '+({merge:'收藏工坊',flappy:'飛行郵局',dino:'森林快遞',mines:'探險手札'})[id];
    if(id==='merge')q('.studio-controls').classList.add('simple-start');
    if(id==='dino')q('.mode-ticket small').textContent='一般模式 · 選擇難度';
  }
  const entry=q('.game-entry article');
  if(entry){
    const showcase=document.createElement('section');showcase.className='studio-showcase';
    append(showcase,'.entry-title');append(showcase,'.entry-cast');
    const controls=document.createElement('section');controls.className='studio-controls';
    const description=entry.querySelector(':scope > p');description.className='studio-instructions';controls.append(description);
    entry.querySelectorAll(':scope > label').forEach(el=>controls.append(el));
    const start=entry.querySelector(':scope > button');start.classList.add('studio-start');controls.append(start);
    const help=document.createElement('button');help.className='studio-help';help.textContent='玩法說明';help.onclick=()=>{const guide=q('#guide');if(guide)guide.showModal();};controls.append(help);
    entry.append(showcase,controls);
  }
  if(id==='whack'){
    const showcase=document.createElement('section');showcase.className='studio-showcase';
    append(showcase,'#home > .eyebrow');append(showcase,'#home > h1');append(showcase,'#home > .mascot');
    const controls=q('#home > .paper');controls.classList.add('studio-controls');home.prepend(showcase);
    q('#rule').classList.add('studio-instructions');
  }
  if(id==='mines'){
    const notes=q('.field-notes'),hud=q('.map-area .hud'),tools=q('.map-area .tools');
    ['旗幟','時間','安全格'].forEach((text,i)=>{hud.querySelectorAll('small')[i].textContent=text;});
    notes.prepend(hud,tools);
    q('#hint-text').classList.add('studio-mines-hint');
    const status=q('#status');let statusTimer;
    status.setAttribute('role','status');
    new MutationObserver(()=>{status.classList.add('studio-feedback');clearTimeout(statusTimer);statusTimer=setTimeout(()=>status.classList.remove('studio-feedback'),2800);}).observe(status,{childList:true,characterData:true,subtree:true});
  }
  // Art-backed readable feedback; never select text or pan the document during play.
  document.addEventListener('contextmenu',e=>{if(e.target.closest('canvas,button,.board,.cast-stage'))e.preventDefault();});
  document.addEventListener('dragstart',e=>{if(e.target.tagName==='IMG')e.preventDefault();});
  document.querySelectorAll('canvas').forEach(c=>c.style.touchAction='none');
  // Scroll content inside the illustrated frame, never across its border.
  const dialogObservers=new WeakSet();
  function frameDialog(d){
    if(dialogObservers.has(d))return;dialogObservers.add(d);
    const wrap=()=>{if(d.children.length===1&&d.firstElementChild.classList.contains('studio-dialog-body'))return;
      const inner=document.createElement('div');inner.className='studio-dialog-body';
      while(d.firstChild)inner.append(d.firstChild);d.append(inner);
    };
    wrap();new MutationObserver(wrap).observe(d,{childList:true});
  }
  document.querySelectorAll('dialog').forEach(frameDialog);
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&node.matches('dialog'))frameDialog(node);}).observe(document.body,{childList:true});
  // Named source roles are the website IP; no accessory is used as a character name.
  document.documentElement.dataset.release='20260920-studio1';
})();
