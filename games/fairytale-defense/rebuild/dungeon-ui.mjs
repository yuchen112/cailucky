import {DUNGEONS,dungeonReward} from './dungeons.mjs?v=20261005-growth1';
export function installDungeons({show,syncPause,onChoose}){
 const dialog=document.createElement('dialog');dialog.id='dungeons';dialog.className='journey-dialog';dialog.innerHTML='<h2>資源副本</h2><div class="journey-body dungeon-body"></div><button class="journey-close">返回營地</button>';dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',syncPause);document.body.append(dialog);
 const entry=document.createElement('button');entry.id='start-dungeons';entry.textContent='金錢／熟練度副本';document.getElementById('start-endless').after(entry);
 const body=dialog.querySelector('.journey-body');
 for(const [type,config] of Object.entries(DUNGEONS)){
  const section=document.createElement('section');section.className='dungeon-card';const img=document.createElement('img');img.src=`art/dungeon-${type}.webp`;img.alt=config.name;img.loading='lazy';
  const content=document.createElement('div');content.className='dungeon-card-content';const title=document.createElement('h3'),description=document.createElement('p');title.textContent=config.name;description.textContent=config.description+' 三波通關額外獲得以下獎勵；每波的基本獎勵另計。';content.append(title,description);
  for(let difficulty=1;difficulty<=3;difficulty++){const reward=dungeonReward({type,difficulty}),button=document.createElement('button');button.dataset.dungeon=type;button.dataset.difficulty=difficulty;button.textContent=`${['一般','進階','困難'][difficulty-1]} · ${reward.coins} 星露${reward.xp?'＋'+reward.xp+' 熟練度':''}`;button.onclick=()=>{dialog.close();onChoose({type,difficulty});};content.append(button);}
  section.append(img,content);body.append(section);
 }
 const note=document.createElement('p');note.textContent='沒有體力限制，可重複挑戰。獎勵只結算一次；失敗保留已完成波次的基本收益。出戰會取代上次戰場，永久進度保留。';body.append(note);entry.onclick=()=>show('dungeons');return {open:()=>show('dungeons')};
}
