// Native overflow scrolling remains available on all content, not just a scrollbar.
export function installCommanderTabs(dialog,body){
 let selected='guide';const positions={guide:0,build:0,weapon:0},nav=document.createElement('nav');nav.className='commander-tabs';nav.setAttribute('aria-label','英雄指揮所分頁');
 const buttons=[];
 function refresh(){let first=true;for(const child of body.children){const tab=child.dataset.commanderTab||(first?'guide':'build');first=false;child.hidden=tab!==selected;}for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.tab===selected));body.scrollTop=positions[selected];}
 for(const [id,label] of [['guide','技能與熟練度'],['build','能力配置'],['weapon','專屬武器']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.tab=id;button.onclick=()=>{positions[selected]=body.scrollTop;selected=id;refresh();};buttons.push(button);nav.append(button);}
 body.before(nav);body.addEventListener('scroll',()=>positions[selected]=body.scrollTop,{passive:true});dialog.addEventListener('close',()=>positions[selected]=body.scrollTop);
 const note=document.createElement('p');note.className='commander-save-note';note.textContent='能力配置已保存 · 下次出戰生效';nav.after(note);
 return {refresh};
}
