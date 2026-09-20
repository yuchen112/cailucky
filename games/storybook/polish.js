(() => {
 'use strict';
 const key=({'magic-bubble':'bubble','dream-match':'dream','fairytale-defense':'tower'})[document.body.dataset.game]||document.body.dataset.game;
 if(!['bubble','dream','tower','whack','merge','flappy','dino','mines'].includes(key))return;
 document.body.style.setProperty('--portrait-panel',`url('../storybook/art-polish/${key}-settings-solid.webp')`);
 const reduced=()=>document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const animate=(el,frames,options)=>{if(el&&!reduced())el.animate(frames,options);};
 const descriptions={tower:'召集夥伴，守住八波敵人。\n點守護台建造、升級或拆除。',bubble:'按住瞄準，放開發射。\n三顆同色相連，即可消除。',dream:'交換寶石，連起三個同色圖案。\n完成收集目標即可過關。'};
 const instruction=document.querySelector('.studio-instructions');if(instruction&&descriptions[key]){instruction.textContent=descriptions[key];instruction.style.whiteSpace='pre-line';}
 document.querySelectorAll('.game-entry .studio-controls>label:has(select)').forEach(label=>{
  const select=label.querySelector('select');if(select.options.length>4)return;
  label.classList.add('polish-choice');const title=document.createElement('span');title.className='polish-choice-title';title.textContent=select.getAttribute('aria-label')||'遊玩方式';
  const choices=document.createElement('div');choices.className='polish-choice-buttons';choices.setAttribute('role','group');choices.setAttribute('aria-label',title.textContent);
  const sync=()=>choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===select.value)));
  for(const option of select.options){const b=document.createElement('button');b.type='button';b.dataset.value=option.value;b.textContent=option.textContent;b.disabled=option.disabled;b.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();};choices.append(b);}
  select.hidden=true;label.replaceChildren(title,select,choices);sync();
 });
 for(const selector of (key==='whack'?['#difficulty']:key==='mines'?['#zoom']:[])){
  const select=document.querySelector(selector);if(!select)continue;const button=document.createElement('button');button.type='button';button.className='polish-select';select.hidden=true;select.after(button);
  const label=key==='whack'?'節奏':'格子大小',sync=()=>{button.textContent=select.selectedOptions[0].textContent;button.setAttribute('aria-label',label+'：'+button.textContent+'，點擊選擇');};sync();select.addEventListener('change',sync);
  button.onclick=()=>{const dialog=document.createElement('dialog'),title=document.createElement('h2');title.textContent='選擇'+label;dialog.append(title);
   for(const option of select.options){const choice=document.createElement('button');choice.type='button';choice.textContent=option.textContent+(select.value===option.value?' ✓':'');choice.disabled=option.disabled;choice.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();dialog.close();};dialog.append(choice);}
   const close=document.createElement('button');close.type='button';close.textContent='取消';close.onclick=()=>dialog.close();dialog.append(close);dialog.className='polish-options';dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  };
 }
 const rangeUpdates=new Map();
 const decorate=()=>document.querySelectorAll('dialog input[type=range]:not([data-polish])').forEach(input=>{
  input.dataset.polish='true';input.setAttribute('aria-label',input.getAttribute('aria-label')||input.closest('label')?.textContent.trim()||'音量');
  const value=document.createElement('output');value.className='volume-value';const sync=()=>{const min=Number(input.min)||0,max=Number(input.max)||1;value.textContent=Math.round((Number(input.value)-min)/(max-min)*100)+'%';input.setAttribute('aria-valuetext',value.textContent);};input.before(value);input.addEventListener('input',sync);rangeUpdates.set(input,sync);sync();
 });
 decorate();addEventListener('DOMContentLoaded',decorate);new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',event=>{requestAnimationFrame(()=>rangeUpdates.forEach(sync=>sync()));const button=event.target.closest('button');if(!button||button.disabled||button.closest('#board'))return;animate(button,[{scale:'1'},{scale:'.96'},{scale:'1'}],{duration:180,easing:'ease-out'});});
 const observed=new WeakSet();const watch=()=>document.querySelectorAll('dialog,.overlay,#result').forEach(el=>{if(observed.has(el))return;observed.add(el);new MutationObserver(()=>{if(el.matches('dialog')?!el.open:el.hidden)return;animate(el,[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:180,easing:'ease-out'});}).observe(el,{attributes:true,attributeFilter:['open','hidden']});});
 watch();new MutationObserver(watch).observe(document.body,{childList:true});
 document.querySelectorAll('#score,#coin,#tier,#lives').forEach(el=>{let value=el.textContent;new MutationObserver(()=>{if(el.textContent===value)return;value=el.textContent;animate(el,[{scale:'1'},{scale:'1.15'},{scale:'1'}],{duration:240,easing:'ease-out'});}).observe(el,{childList:true,subtree:true,characterData:true});});
 if(key==='mines'){const board=document.querySelector('#board');new MutationObserver(records=>{const changed=new Set(records.filter(r=>r.oldValue&&r.oldValue!==r.target.getAttribute('aria-label')).map(r=>r.target));for(const tile of changed)animate(tile,[{scale:'.86',opacity:.55},{scale:'1',opacity:1}],{duration:180,easing:'ease-out'});}).observe(board,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['aria-label']});}
 document.documentElement.dataset.release='20260921-polish1';
})();
