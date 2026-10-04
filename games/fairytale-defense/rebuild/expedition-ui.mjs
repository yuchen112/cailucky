import {installFormation} from './formation-ui.mjs?v=20261004-army3';
import {UNITS,UNIT_GUIDES,UNIT_RARITY} from './army.mjs?v=20261004-army3';
import {GRADES,unitLevel} from './recruitment.mjs?v=20261004-army3';
import {MAPS} from './expedition.mjs?v=20261004-army3';
export function installExpedition({getProfile,commit,show,syncPause,openUnit,startEndless}){
 const $=id=>document.getElementById(id),body=$('squad').querySelector('.dialog-content');
 const formation=installFormation({dialog:$('squad'),body,getProfile,commit,openUnit});const render=()=>formation.render();
 $('squad-info').onclick=()=>{render();show('squad');};
 const endless=document.createElement('button');endless.id='start-endless';endless.textContent='無盡守城';$('start').after(endless);
 const mapDialog=document.createElement('dialog');mapDialog.id='endless-maps';mapDialog.className='journey-dialog';mapDialog.innerHTML='<h2>無盡守城 · 選擇戰場</h2><div class="journey-body"></div><button class="journey-close">返回營地</button>';mapDialog.querySelector('button').onclick=()=>mapDialog.close();mapDialog.addEventListener('close',syncPause);document.body.append(mapDialog);
 endless.onclick=()=>{const contents=mapDialog.querySelector('.journey-body');contents.replaceChildren();for(const [id,m] of Object.entries(MAPS)){const b=document.createElement('button');b.dataset.map=id;b.innerHTML=`<img loading="lazy" src="art/${id==='forest'?'road':'road-'+id}.webp" alt="${m.name}道路預覽"><strong>${m.name}</strong><small>${m.tag} · 最高 ${getProfile().endless[id]} 波</small>`;b.onclick=()=>{mapDialog.close();startEndless(id);};contents.append(b);}const p=document.createElement('p');p.textContent='每兩波選擇強化；每五波可安全撤離。獎勵逐波保存。離開或失敗不扣除已取得星露。';contents.append(p);show('endless-maps');};
 return {render};
}
