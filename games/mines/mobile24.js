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
})();
