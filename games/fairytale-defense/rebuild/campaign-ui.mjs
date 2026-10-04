import {MAPS} from './expedition.mjs?v=20261005-growth1';
export function campaignChapters(catalog,progress){
 const groups=new Map();for(const c of catalog){if(!MAPS[c.map])throw Error('Unknown chapter map');if(!groups.has(c.map))groups.set(c.map,{id:c.map,...MAPS[c.map],stages:[],cleared:0});const chapter=groups.get(c.map),cleared=progress.clearedIds?.includes(c.id)??progress.cleared.includes(c.stage);chapter.stages.push({...c,cleared,available:cleared||c.stage<=progress.unlocked});if(cleared)chapter.cleared++;}return [...groups.values()];
}
export function installCampaignSelection({dialog,catalog,getProgress,onChoose}){
 const list=dialog.querySelector('#stages'),heading=dialog.querySelector('h2'),back=dialog.querySelector('#campaign-back');
 const state={chapter:null,scrolls:new Map()};
 const key=()=>state.chapter??'chapters';
 list.addEventListener('scroll',()=>state.scrolls.set(key(),list.scrollTop),{passive:true});
 const restoreScroll=()=>requestAnimationFrame(()=>{list.scrollTop=state.scrolls.get(key())??0;});
 function render(){
  const chapters=campaignChapters(catalog,getProgress());list.replaceChildren();
  if(state.chapter&&!chapters.some(c=>c.id===state.chapter))state.chapter=null;
  back.textContent=state.chapter?'返回章節':'返回營地';
  back.onclick=()=>{if(state.chapter){state.scrolls.set(key(),list.scrollTop);state.chapter=null;render();restoreScroll();}else dialog.close();};
  heading.textContent=state.chapter?chapters.find(c=>c.id===state.chapter).name:'選擇守護章節';
  for(const chapter of chapters){if(state.chapter&&chapter.id!==state.chapter)continue;
   if(!state.chapter){const b=document.createElement('button'),im=document.createElement('img'),title=document.createElement('span'),details=document.createElement('small');b.className='chapter-card';b.dataset.chapter=chapter.id;im.src='art/'+({forest:'meadow',moon:'meadow-moon',dawn:'meadow-dawn',ruins:'meadow-ruins-ui'})[chapter.id]+'.webp';im.alt='';im.loading='lazy';title.textContent=chapter.name;details.textContent=chapter.tag+' · 已通關 '+chapter.cleared+' / '+chapter.stages.length;b.append(im,title,details);b.onclick=()=>{state.scrolls.set(key(),list.scrollTop);state.chapter=chapter.id;render();restoreScroll();};list.append(b);continue;}
   const intro=document.createElement('p');intro.className='chapter-intro';intro.textContent=chapter.intro;list.append(intro);
   for(const c of chapter.stages){const b=document.createElement('button'),title=document.createElement('span'),tip=document.createElement('small');b.dataset.stage=c.stage;b.dataset.stageId=c.id;b.disabled=!c.available;title.textContent='第 '+c.stage+' 關 · '+c.name+(c.cleared?' · 已通關':'');tip.textContent=c.available?c.waves.length+' 波 · '+c.tip:'完成前一關後開放';b.append(title,tip);b.onclick=()=>{state.scrolls.set(key(),list.scrollTop);onChoose(c);};list.append(b);}
  }
 }
 return {render,restoreScroll};
}
