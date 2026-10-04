import {installFormation} from './formation-ui.mjs?v=20261005-story1';
import {UNITS,UNIT_GUIDES,UNIT_RARITY} from './army.mjs?v=20261005-story1';
import {GRADES,unitLevel} from './recruitment.mjs?v=20261005-story1';
import {MAPS} from './expedition.mjs?v=20261005-story1';
export function installExpedition({getProfile,commit,show,syncPause,openUnit,startEndless}){
 const $=id=>document.getElementById(id),body=$('squad').querySelector('.dialog-content');
 const formation=installFormation({dialog:$('squad'),body,getProfile,commit,openUnit});const render=()=>formation.render();
 $('squad-info').onclick=()=>{render();show('squad');};
 const endless=document.createElement('button');endless.id='start-endless';endless.textContent='無盡守城';$('start').after(endless);
 const mapDialog=document.createElement('dialog');mapDialog.id='endless-maps';mapDialog.className='journey-dialog';mapDialog.innerHTML='<h2>無盡守城 · 選擇戰場</h2><div class="journey-body"></div><button class="journey-close">返回營地</button>';mapDialog.querySelector('button').onclick=()=>mapDialog.close();mapDialog.addEventListener('close',syncPause);document.body.append(mapDialog);
 endless.onclick=()=>{const contents=mapDialog.querySelector('.journey-body');contents.replaceChildren();for(const [id,m] of Object.entries(MAPS)){const b=document.createElement('button');b.dataset.map=id;b.innerHTML=`<img loading="lazy" src="art/${id==='forest'?'road':'road-'+id}.webp" alt="${m.name}道路預覽"><strong>${m.name}</strong><small>${m.tag} · 最高 ${Math.min(99,getProfile().endless[id])} / 99 層</small>`;b.onclick=()=>{mapDialog.close();startEndless(id);};contents.append(b);}const p=document.createElement('p');p.textContent='最高99層；每兩層選擇強化，每五層可安全撤離並獲得訓練書。每次過層都有基本收益，每層當日首次另給加碼，台灣時間00:00重置。失敗保留已完成層數收益。';contents.append(p);show('endless-maps');};
 return {render};
}
