import {installAudioEngine} from './audio-engine-core.mjs';
import {originalCues} from './original-audio-cues.mjs';
installAudioEngine({root:new URL('.',document.currentScript.src),originalCues,
 normalizeTracks({audioRoot},next){
  if(!audioRoot||!next.length)return next;
  const score=new URL('music-loop.mp3',audioRoot).href;
  return [score,...next.filter(track=>String(track)!==score)];
 }
});
