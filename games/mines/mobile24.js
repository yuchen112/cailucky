(() => {
 const q=s=>document.querySelector(s),play=q('#play'),notes=q('.field-notes');
 notes.append(q('.hud'));
 notes.querySelectorAll(':scope > :not(.settings-dock):not(.hud)').forEach(e=>e.hidden=true);
 q('.tools').hidden=true;q('#status').hidden=true;
 q('#mode').value='standard';q('#preset').value=['easy','medium','hard'].includes(q('#preset').value)?q('#preset').value:'easy';
 q('#longpress').value='500';
 // Hide obsolete controls in both original settings and generated mobile sheets.
 for(const id of ['mode','longpress']){
   const field=q('#'+id)?.closest('label');if(field)field.hidden=true;
   document.querySelectorAll('[data-field="'+id+'"]').forEach(e=>e.hidden=true);
 }
 q('#custom').hidden=true;
 const settings=q('#audio-dialog'),actions=settings?.querySelector('.session-actions');
 if(actions){const help=document.createElement('button');help.type='button';help.textContent='玩法說明';help.onclick=()=>{settings.close();q('#tutorial').click();};actions.append(help);}
 const zoom=q('#zoom');zoom.value='38';zoom.dispatchEvent(new Event('change'));
 // Fit the beginner board without shrinking the larger boards below readable size.
 const board=q('#board'),scroll=q('#map-scroll');
 function fitBoard(){
   if(play.hidden||!board.children.length)return;
   const cols=Number(board.style.getPropertyValue('--cols')),rows=board.children.length/cols;
   const gap=parseFloat(getComputedStyle(board).gap)||0;
   const available=Math.floor(Math.min((scroll.clientWidth-16-(cols-1)*gap)/cols,(scroll.clientHeight-16-(rows-1)*gap)/rows));
   const size=cols===9&&rows===9?Math.max(30,Math.min(44,available)):Math.max(38,Number(zoom.value)||38);
   board.style.setProperty('--cell',size+'px');
   scroll.setAttribute('aria-label',available<size?'棋盤可拖動；輕點翻格，長按半秒插旗':'完整棋盤；輕點翻格，長按半秒插旗');
 }
 new ResizeObserver(fitBoard).observe(scroll);
 new MutationObserver(fitBoard).observe(board,{childList:true});
 zoom.addEventListener('change',fitBoard);
 addEventListener('orientationchange',fitBoard);
 window.visualViewport?.addEventListener('resize',fitBoard);
 fitBoard();
})();
