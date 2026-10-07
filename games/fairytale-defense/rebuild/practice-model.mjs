import {createBattle,deploy,startWave,advance,pointAt,PATH_LENGTH,towerStats} from './core.mjs?v=20261007-names1';
import {UNITS,UNIT_BRANCHES} from './army.mjs?v=20261007-names1';
export function createPractice({id,level=1,branch=null,target='single',training=0}={}){
 if(!UNITS[id]||!Number.isInteger(level)||level<1||level>10||!['single','group','armor','air'].includes(target))throw Error('請選擇兵種與演練目標');
 if(level>=3&&!UNIT_BRANCHES[id].some(b=>b.id===branch))throw Error('請選擇進階分支');
 const helper=['artisan','blossom'].includes(id),s=createBattle({hero:'growth',loadout:helper?[id,'archer']:[id],training:{[id]:training}});s.hero=null;s.gold=10000;
 deploy(s,4,id);Object.assign(s.towers[0],{level,branch:level>=3?branch:null});s.towers[0].blockBudget=towerStats(s.towers[0],s).blockStamina||0;
 if(helper)deploy(s,3,'archer');
 s.practice={id,target,started:false,ended:false};return s;
}
export function beginPractice(s){if(s.practice.started)return false;if(!startWave(s))return false;s.practice.started=true;let nearest=0,best=Infinity;for(let d=0;d<PATH_LENGTH;d+=2){const p=pointAt(d,s),distance=Math.hypot(p.x-195,p.y-183);if(distance<best){best=distance;nearest=d;}}
 const kind=s.practice.target==='armor'?'armored':s.practice.target==='air'?'moth':'walker',count=s.practice.target==='group'?8:1;
 s.queue=Array.from({length:count},(_,i)=>({kind,at:s.time+i*.13,distance:nearest+i*10}));return true;
}
export function tickPractice(s,dt){if(s.practice.ended)return;advance(s,dt);for(const e of s.enemies)if(!e.practiceTarget){e.practiceTarget=true;e.hp=e.maxHp=s.practice.id==='artisan'?85:600;e.speed=s.practice.target==='single'?0:10;e.reward=0;}
 if(s.phase==='intermission'||s.time>=24){s.practice.ended=true;s.paused=true;}return s;
}
