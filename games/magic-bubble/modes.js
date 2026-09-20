(() => {
 const entry=document.querySelector('.game-entry'),select=entry.querySelector('select'),start=entry.querySelector('article>button');
 select.innerHTML='<option value="campaign">闖關模式</option><option value="endless">無盡模式</option>';
 const dialog=document.createElement('dialog');dialog.id='bubble-difficulty';dialog.innerHTML='<h2>闖關難度</h2><p>標準：第一關 32 次發射。<br>輕鬆：每關多 10 次發射。</p><div class="dialog-actions"><button data-level="classic">標準難度</button><button data-level="relaxed">輕鬆難度</button><button data-cancel>返回選擇</button></div>';
 document.body.append(dialog);
 const begin=difficulty=>{dialog.close();entry.hidden=true;document.querySelector('main').inert=false;dispatchEvent(new CustomEvent('cxq-start',{detail:{mode:select.value,difficulty}}));};
 dialog.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>begin(b.dataset.level));dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
 start.onclick=()=>select.value==='endless'?begin('classic'):dialog.showModal();
})();
