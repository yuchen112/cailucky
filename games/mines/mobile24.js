(() => {
 const q=s=>document.querySelector(s),play=q('#play'),notes=q('.field-notes'),tools=q('.tools');
 notes.append(q('.hud'));play.append(tools);tools.append(q('#hint'));
 notes.querySelectorAll(':scope > :not(.settings-dock):not(.hud)').forEach(e=>e.hidden=true);
 const zoom=q('#zoom');zoom.querySelector('[value="38"]').textContent='標準';zoom.value='46';zoom.dispatchEvent(new Event('change'));
 const label=tools.querySelector('label');label.firstChild.textContent='格子';
 q('#reveal-mode').textContent='翻格';q('#flag-mode').textContent='插旗';
 q('#hint').textContent='推理提示';q('#hint').addEventListener('click',()=>{const text=q('#hint-text').textContent;G.dialog('推理提示','<p>'+text.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</p>',[['繼續探索']]);});
})();
