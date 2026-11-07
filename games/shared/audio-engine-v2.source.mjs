import {installAudioEngine} from './audio-engine-core.mjs';
const root=new URL('.',document.currentScript.src);
const scored=new Set(['dino','flappy','merge','mines','whack','dream-match','magic-bubble','2048','brick-breaker','click-core','link','memory','tetris','fortune','poker','richman','lucky-town','heartlight-duel','fairytale-defense']);
installAudioEngine({root,
 normalizeTracks({id},next){
  if(!next.length||!scored.has(id))return next;
  const score=new URL('audio-v3/'+id+'.mp3?v=20261009-refresh1',root).href;
  const original=next.filter(p=>!String(p).includes('/audio-v3/'));
  const regional=['poker','fairytale-defense','heartlight-duel'].includes(id)&&original[0]&&!String(original[0]).includes('audio-v2/'+id+'.mp3');
  return regional?[original[0],score,...original.slice(1)]:[score,...original];
 }
});
