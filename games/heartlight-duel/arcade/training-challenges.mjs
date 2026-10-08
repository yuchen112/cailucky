export const TRAINING_CHALLENGES=Object.freeze({
 combo:{name:'三段連擊',description:'由你操作，在同一次連段內命中三下。示範演出不計入。'},
 technique:{name:'高低招式練習',description:'分別以低掃與上挑實際命中，再接一次空中攻擊。'},
 throw:{name:'破解防守',description:'接近格擋木樁，以投技成功命中兩次。輕重同按可投技。'}
});
export function challengeState(id,eventId=0){if(!TRAINING_CHALLENGES[id])throw Error('Unknown exercise');return {id,eventId,combo:0,throws:0,moves:[],complete:false};}
export function updateChallenge(s,events,{demonstrating=false}={}){if(!s)return null;for(const e of events){if(e.id<=s.eventId)continue;s.eventId=e.id;if(demonstrating||s.complete||e.type!=='hit'||e.fighter!==0||e.damage<=0)continue;s.combo=Math.max(s.combo,e.combo||1);if(e.key==='throw')s.throws++;if(['sweep','launcher','air'].includes(e.key)&&!s.moves.includes(e.key))s.moves.push(e.key);}s.complete=s.id==='combo'?s.combo>=3:s.id==='throw'?s.throws>=2:s.moves.length===3;return s;}
export function challengeText(s){const task=TRAINING_CHALLENGES[s.id],progress=s.id==='combo'?Math.min(3,s.combo)+'/3 段':s.id==='throw'?Math.min(2,s.throws)+'/2 次':s.moves.length+'/3 招';return task.name+' · '+progress+' · '+(s.complete?'完成！可到訓練工具選下一項':task.description);}
