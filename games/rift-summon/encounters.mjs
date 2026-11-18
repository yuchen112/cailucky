import {heroHP,profiles} from './combat-rules.mjs?v=bag18-1';
export const factions={
 fortress:['guard','knight','bow','giant','badgerforge','capyguard','humanlamp','rampart'],
 grove:['turtle','stag','hare','frog','beaver','hedgehog','koala','pandaoracle'],
 ember:['ember','crab','beetle','mole','drake','yakfire','redpanda','phoenix'],
 frost:['seal','otter','yak','wolf','falcon','lynxguard','snowstoat','frostelk'],
 tide:['koi','swan','crane','panda','stork','axolotl','dolphin','whalecub'],
 dusk:['bat','ghost','rabbit','raven','moth','gecko','raccoon','crowchap'],
 sky:['eagle','falcon','stork','crane','lion','griffin','sparrow','humanstar'],
 desert:['ferret','badger','ibis','ram','jackal','fennec','platypus','sablescout'],
};
const themes=['fortress','dusk','grove','ember','frost','tide','desert','dusk','sky','sky','tide','grove','fortress','tide','desert','fortress','desert','grove','ember','sky','frost','sky','ember','grove','tide','fortress','grove','sky','grove','fortress','tide','dusk','frost','ember','grove','tide','sky','desert','fortress','fortress','fortress','dusk','frost','sky','dusk','desert','sky','sky','ember','sky'];
const runeSets={fortress:['wall','ward'],grove:['root','cleanse'],ember:['cinder','flame'],frost:['frost','blizzard'],tide:['heal','renewal'],dusk:['venom','harvest'],sky:['valor','comet'],desert:['shadow','echo']};
export function makeEncounter(chapter,step,level){
 const theme=themes[chapter-1]??'sky',roster=factions[theme],count=chapter<10?8:chapter<30?10:12;
 const offset=step%roster.length,deck=Array.from({length:count},(_,i)=>roster[(i+offset)%roster.length]);
 // Each encounter gets actual protection, sustain and pressure, then a specialty.
 if(chapter>=3){deck[0]=roster.find(id=>['tank','barrier'].includes(profiles[id].role))??'knight';deck[1]=roster.find(id=>['healer','medic'].includes(profiles[id].role))??'healer';}
 const heroLevel=Math.min(50,Math.max(1,Math.ceil(level/2))),effect=Math.min(10,Math.max(1,Math.ceil(chapter/8)+Number(step===3&&chapter>=20)));
 const hero={fortress:'trust',grove:'healing',ember:'joy',frost:'sadness',tide:'night',dusk:'memory',sky:'hope',desert:'luck'}[theme];
 return {opponents:deck,opening:step===3?[deck[0]]:[],hp:heroHP(heroLevel),hero,heroLevel,enemyLevel:level,enemyEffect:effect,runeLevel:Math.min(5,Math.ceil(chapter/12)),runes:chapter<3?[]:runeSets[theme].slice(0,chapter>=15?2:1),strategy:{fortress:'護盾與相鄰減傷',grove:'再生與淨化',ember:'燃燒與爆破',frost:'寒霜控制與破盾',tide:'回復與護航',dusk:'英靈接替與中毒',sky:'鼓舞與連鎖攻勢',desert:'追獵與穿盾'}[theme]};
}
