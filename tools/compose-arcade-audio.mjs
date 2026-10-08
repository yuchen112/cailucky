import {toolDependency} from './refresh-deps.mjs';
import fs from 'node:fs';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),ffmpeg=toolDependency('ffmpeg-static');
const out='games/heartlight-duel/arcade/audio-v2',tmp='outputs/refresh-audio';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(tmp,{recursive:true});const SR=22050,TAU=Math.PI*2;
function track(seconds){return new Float32Array(Math.ceil(seconds*SR));}
function note(a,t,d,midi,gain=.16,type='bell',pan=0){const f=440*2**((midi-69)/12),start=Math.round(t*SR),n=Math.min(Math.round(d*SR),a.length-start);for(let i=0;i<n;i++){const s=i/SR,p=TAU*f*s,env=Math.min(1,s/.009)*Math.exp(-s/(type==='pad'?d*.9:type==='bass'?.18:d*.32));let v=type==='bell'?Math.sin(p)+.3*Math.sin(2.01*p)+.15*Math.sin(3.98*p):type==='pad'?.55*Math.sin(p)+.2*Math.sin(p*1.002)+.15*Math.sin(p*2):type==='bass'?Math.sin(p)+.2*Math.sin(2*p):.7*Math.sin(p)+.2*Math.sin(2*p)+.12*Math.sin(3*p);a[start+i]+=v*env*gain;}}
function drum(a,t,kind,gain=.15){const d=kind==='kick'?.21:kind==='snare'?.16:.045,start=Math.round(t*SR);let seed=42;for(let i=0;i<d*SR&&start+i<a.length;i++){const s=i/SR;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296*2-1),v=kind==='kick'?Math.sin(TAU*(78*s-110*s*s))*Math.exp(-s*24):kind==='snare'?(noise*.7+Math.sin(TAU*185*s)*.3)*Math.exp(-s*28):noise*Math.exp(-s*100);a[start+i]+=v*gain;}}
function save(a,name,music=false){if(music){const delay=Math.round(SR*.145);for(let i=a.length-1;i>=delay;i--)a[i]+=a[i-delay]*.18;}const peak=Math.max(...Array.from({length:200},(_,k)=>{let p=0;for(let i=k;i<a.length;i+=200)p=Math.max(p,Math.abs(a[i]));return p;})),b=Buffer.alloc(44+a.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(a.length*2,40);for(let i=0;i<a.length;i++)b.writeInt16LE(Math.round(Math.tanh(a[i]/Math.max(.85,peak)*1.25)*26000),44+i*2);const wav=tmp+'/'+name+'.wav';fs.writeFileSync(wav,b);execFileSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',wav,'-codec:a','libmp3lame','-b:a',music?'96k':'80k',out+'/'+name+'.mp3']);return{file:name+'.mp3',seconds:a.length/SR,bytes:fs.statSync(out+'/'+name+'.mp3').size};}
const manifest={originalComposition:true,sampleRate:SR,method:'Original note scores, additive/plucked instruments, deterministic percussion and rendered layered combat cues; no reused shared-game tracks.',music:[],effects:[]};
const arrangements=[['menu',122,60,[0,7,9,5],[0,4,7,11,7,4,2,7]],['festival',138,62,[0,5,7,0],[0,7,12,10,7,5,4,2]],['moon',124,57,[0,8,5,7],[0,3,7,10,7,3,2,5]],['rain',128,59,[0,5,8,7],[0,2,3,7,10,7,5,3]],['workshop',144,64,[0,7,5,9],[0,4,7,12,11,7,9,7]]];
for(const [name,bpm,key,roots,melody] of arrangements){const beat=60/bpm,a=track(beat*64);for(let bar=0;bar<16;bar++){const root=key+roots[bar%4],t=bar*4*beat,minor=['moon','rain'].includes(name);for(const interval of [0,minor?3:4,7])note(a,t,beat*3.8,root+interval,.075,'pad');for(let k=0;k<4;k++){note(a,t+k*beat,beat*.8,root-24+(k===2?7:0),.16,'bass');drum(a,t+k*beat,k%2?'snare':'kick',.16);drum(a,t+(k+.5)*beat,'hat',.045);}for(let k=0;k<8;k++){const m=root+12+melody[(k+bar*2)%melody.length];note(a,t+k*beat/2,beat*.6,m,.11,name==='workshop'?'lead':'bell');if(bar>=8&&k%2===0)note(a,t+k*beat/2,beat*.8,m+12,.055,'bell');}}manifest.music.push({...save(a,'music-'+name,true),bpm,key,measures:16});}
const types=['tap','swing','light','heavy','block','counter','skill','super','jump','dash','throw','shield','break','ready','fight','win','lose'];
function whoosh(a,t,d,gain,seed=73,fall=true){let low=0;const start=Math.round(t*SR);for(let i=0;i<d*SR&&start+i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296*2-1,u=i/(d*SR),cut=fall?.7-.6*u:.08+.55*u;low+=cut*(n-low);a[start+i]+=(n-low)*Math.sin(Math.PI*u)**1.2*gain;}}
for(let k=0;k<types.length;k++){
 const type=types[k],duration={tap:.14,swing:.3,light:.32,heavy:.55,block:.28,counter:.55,skill:.65,super:1.7,jump:.4,dash:.4,throw:.7,shield:.6,break:.75,ready:1.2,fight:1.1,win:1.65,lose:1.65}[type],a=track(duration);
 switch(type){
 case 'tap':note(a,0,.1,84,.14);note(a,.025,.09,91,.08);break;
 case 'swing':whoosh(a,0,.23,.38,61,false);break;
 case 'dash':whoosh(a,0,.34,.3,931,true);note(a,.015,.18,43,.08,'bass');break;
 case 'light':drum(a,0,'snare',.34);drum(a,.004,'kick',.25);note(a,.01,.14,53,.15,'bass');break;
 case 'heavy':drum(a,0,'kick',.6);drum(a,.018,'snare',.35);note(a,.025,.4,33,.28,'bass');whoosh(a,.04,.24,.12,144);break;
 case 'block':[77,84,91].forEach(n=>note(a,0,.23,n,.13));drum(a,0,'hat',.3);break;
 case 'counter':drum(a,0,'kick',.35);[82,94].forEach((n,i)=>note(a,i*.06,.36,n,.19));note(a,.06,.28,46,.23,'bass');break;
 case 'throw':whoosh(a,0,.27,.3,227,false);drum(a,.28,'kick',.58);drum(a,.3,'snare',.22);note(a,.3,.28,35,.26,'bass');break;
 case 'break':for(let i=0;i<5;i++){whoosh(a,i*.05,.2,.17,453+i);note(a,i*.06,.35,98-i*5,.1);}drum(a,0,'snare',.35);break;
 case 'jump':[47,59,71].forEach((n,i)=>note(a,i*.025,.2,n,.14,'lead'));whoosh(a,0,.22,.12,412,false);break;
 case 'shield':[60,67,74,84].forEach((n,i)=>note(a,i*.04,.45,n,.16));break;
 case 'skill':[62,69,78,86].forEach((n,i)=>note(a,i*.04,.4,n,.19));whoosh(a,.08,.38,.2,241,false);break;
 case 'super':for(let i=0;i<8;i++){note(a,i*.09,.5,52+i*4,.17,'lead');drum(a,i*.09,'kick',.12);}whoosh(a,.2,.6,.25,114,false);drum(a,.82,'kick',.6);[60,64,67,72].forEach(n=>note(a,.82,.7,n,.15));break;
 case 'ready':[67,67,74].forEach((n,i)=>note(a,i*.29,.35,n,.22));break;
 case 'fight':drum(a,0,'kick',.55);drum(a,.13,'snare',.3);[48,55,60,67].forEach((n,i)=>note(a,i*.08,.5,n,.2,'lead'));break;
 case 'win':[60,64,67,72,76,79].forEach((n,i)=>note(a,i*.14,.45,n,.2,'lead'));[60,64,67].forEach(n=>note(a,.9,.65,n,.1,'pad'));break;
 case 'lose':[72,68,63,60,55].forEach((n,i)=>note(a,i*.2,.5,n,.18,'bell'));note(a,.7,.8,43,.12,'bass');break;
 }
 manifest.effects.push(save(a,'sfx-'+type));
}
for(let i=0;i<10;i++){const id=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'][i],a=track(.65);[0,4,7].forEach((n,k)=>note(a,k*.055,.4,58+i+n,.14,i%3===0?'lead':'bell'));drum(a,0,'kick',.12);manifest.effects.push({...save(a,'sfx-'+id),character:id});}
fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({music:manifest.music.length,effects:manifest.effects.length,totalBytes:[...manifest.music,...manifest.effects].reduce((n,a)=>n+a.bytes,0)}));
