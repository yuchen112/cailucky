import {installInventory} from './inventory-ui.mjs';
import {installUnitGallery} from './unit-gallery.mjs';
import {bookInventory,BOOK_GRADES,BOOK_NAMES} from './training-books.mjs?v=20261005-complete1';
import {RECRUIT_UNITS} from './recruitment.mjs?v=20261005-complete1';
import {installRecruitment} from './recruitment-ui.mjs?v=20261005-complete1';
export function installJourney({getProfile,commit,show,syncPause,audio,onMotion,onTrial}){
 const $=id=>document.getElementById(id);
 function dialog(id,title){const d=document.createElement('dialog');d.id=id;d.className='journey-dialog';d.innerHTML=`<h2>${title}</h2><div class="journey-body"></div><button class="journey-close">返回營地</button>`;d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',syncPause);document.body.append(d);return d;}
 const collection=dialog('collection','星露招募'),unitDialog=dialog('unit-guide','部隊介紹');
 const wallet=document.createElement('p');wallet.id='camp-wallet';wallet.className='camp-wallet';$('camp').querySelector('.camp-links').before(wallet);
 const summon=document.createElement('button');summon.id='open-collection';summon.textContent='星露招募';$('camp').querySelector('.camp-links').append(summon);
 const settings=document.createElement('button');settings.id='camp-settings';settings.textContent='設定與備份';$('camp').querySelector('.camp-links').append(settings);settings.onclick=()=>show('options');
 const coverSettings=document.createElement('button');coverSettings.id='cover-options';coverSettings.textContent='設定';$('cover').append(coverSettings);coverSettings.onclick=()=>show('options');
 function updateWallet(){const p=getProfile();wallet.textContent=`星露 ${p.collection.coins} · 訓練書 ${Object.values(bookInventory(p)).reduce((a,b)=>a+b,0)} · 主線 ${p.campaign.cleared.length} / 15`;}

 const unitGallery=installUnitGallery({dialog:unitDialog,getProfile,commit,show,onTrial,audio});
 const openUnit=(id,tab)=>unitGallery.openUnit(id,tab);
 installInventory({getProfile,commit,show,syncPause,audio,openUnit,updateWallet});
 const recruitment=installRecruitment({dialog:collection,getProfile,commit,audio,updateWallet,openUnit});summon.onclick=()=>{recruitment.render();show('collection');};$('camp').addEventListener('focusin',updateWallet);
 $('squad').querySelectorAll('figure').forEach((f,i)=>{const b=document.createElement('button');b.className='unit-detail';b.textContent='能力與升級';b.onclick=()=>openUnit(RECRUIT_UNITS[i]);f.append(b);});
 const controls=document.createElement('div');controls.className='audio-controls';controls.innerHTML='<label><input type="checkbox" id="music-enabled"> 背景音樂</label><label><input type="checkbox" id="sound-enabled"> 操作與戰鬥音效</label><label>音樂曲目<select id="music-track"><option value="auto">隨區域切換</option><option value="forest">翠林 · Back to Nature</option><option value="moon">月露 · Fairy Lights</option><option value="dawn">晨曦 · Jaunt</option></select></label><label>音量<input id="audio-volume" type="range" min="0" max="1" step="0.05"></label><label><input type="checkbox" id="motion-reduced"> 減少動態效果</label><details><summary>音樂與音效來源</summary><p>音樂：troubadour；音效：Kenney。皆採 CC0 授權。</p><a href="audio/CREDITS.md" target="_blank" rel="noopener">完整授權紀錄</a></details>';$('options').querySelector('p').after(controls);
 const prefs=audio.preferences;$('music-enabled').checked=prefs.music;$('sound-enabled').checked=prefs.sound;$('music-track').value=prefs.track;$('audio-volume').value=prefs.volume;$('motion-reduced').checked=prefs.reducedMotion;
 controls.onchange=()=>{audio.set({music:$('music-enabled').checked,sound:$('sound-enabled').checked,track:$('music-track').value,volume:Number($('audio-volume').value),reducedMotion:$('motion-reduced').checked});onMotion();};
 const optionsBody=document.createElement('div');optionsBody.className='options-body';const close=$('options').querySelector('[data-close]');for(const child of [...$('options').children])if(child.tagName!=='H2'&&child!==close&&child.id!=='home')optionsBody.append(child);close.before(optionsBody,$('home'));
 updateWallet();return {updateWallet,openUnit};
}
