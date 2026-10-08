import {advance,startWave,chooseBlessing,castHero} from './core.mjs';
import {selectAutoBlessing,shouldAutoSkill} from './assists.mjs';
// Identical fixed simulation steps; no estimated wins or fabricated rewards.
export function runBackgroundBattle(s,seconds,{speed=1,assists={},onBoundary=()=>{},maxSteps=6000,wait=0}={}){let left=seconds,n=0;const realStep=1/(60*speed);s.paused=false;
while(left+1e-10>=realStep&&n<maxSteps&&!['victory','defeat'].includes(s.phase)){
if(s.phase==='intermission'){const choice=selectAutoBlessing(s,{...assists,autoBlessing:true});if(choice){chooseBlessing(s,choice);onBoundary(s)}if(s.blessingChoices.length)break;wait+=realStep;if(wait>=4){onBoundary(s);if(!startWave(s))break;wait=0}}
else if(s.phase==='battle'){const before=s.phase;if(shouldAutoSkill(s,assists))castHero(s);advance(s,1/60);if(before!==s.phase){wait=0;onBoundary(s)}}else break;
left=Math.max(0,left-realStep);n++;}
return {left,wait,steps:n,done:['victory','defeat','planning'].includes(s.phase)};
}
