import {UNITS} from './army.mjs?v=20261005-growth1';
export function installVictoryGallery(dialog,getBattle,reduced){
 const strip=document.createElement('div');strip.className='victory-troops';strip.setAttribute('aria-label','出戰伙伴');document.getElementById('result-text').before(strip);let animations=[];
 const cancel=()=>{for(const a of animations)a.cancel();animations=[];strip.replaceChildren();};
 const observer=new MutationObserver(()=>{if(!dialog.open){cancel();return;}cancel();const battle=getBattle();if(battle.phase!=='victory')return;for(const [i,id] of battle.loadout.entries()){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=`art/unit-${id}-victory.webp`;img.alt=UNITS[id].name;caption.textContent=UNITS[id].name;figure.append(img,caption);strip.append(figure);img.decode().then(()=>{if(!dialog.open||!img.isConnected||reduced())return;animations.push(img.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)',offset:.5},{transform:'translateY(0)'}],{duration:850,delay:i*90,iterations:2,easing:'ease-in-out'}));}).catch(()=>{img.src=`art/unit-${id}.webp`;});}});
 observer.observe(dialog,{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',()=>{for(const a of animations)document.hidden?a.pause():a.play();});return {cancel};
}
