import {reduce} from './engine.mjs?v=20260929-switch1';
import * as R from './rules.mjs';

// Dry-run the actual engine on its immutable clone: no second set of UI rules,
// no storage writes, and no speculative result is shown to the player.
export function selectionFeedback(profile, cards, target=null) {
 const t=profile.table;
 if(!t || !['big2','sevens','redpoint'].includes(t.type))return null;
 if(['roundEnd','tableEnd'].includes(t.phase))return null;
 const action={type:'play',seat:0,cards:[...cards],target};
 if(t.turn!==0)return {ok:false,message:'等待其他角色出牌',action};
 if(!cards.length)return {ok:false,message:t.type==='big2'?'請選手牌，可按「提示」選取建議牌':'請先選一張手牌',action};
 if(t.type==='redpoint' && !target && cards.length===1){
  const matches=t.board.filter(c=>R.redMatch(cards[0],c));
  if(matches.length===1)action.target=matches[0];
  if(matches.length>1)return {ok:false,message:'有多張可配對桌牌，請點選其中一張',action};
 }
 try{
  reduce(profile,action,()=>{throw Error('選牌預覽不能發新牌');});
  const label=t.type==='big2'?R.big2(cards,t.rules).name:t.type==='sevens'?'可接牌':action.target?'可撿取 '+R.card(action.target).label:'無配對，將手牌放到桌面';
  return {ok:true,message:`已選 ${cards.length} 張 · ${label}`,action};
 }catch(error){
  let reason=error.message;
  if(t.type==='big2' && reason==='這組牌無法出牌'){
   const combo=R.big2(cards,t.rules);
   if(!combo)reason=cards.length===2?'對子需要兩張同點數的牌':cards.length===3?'三條需要三張同點數的牌':cards.length===5?'五張牌尚未組成有效牌型':'請選單張、對子、三條或五張牌型';
   else if(t.last && t.last.n!==cards.length)reason=`需與桌面相同，選 ${t.last.n} 張牌`;
   else reason='牌型成立，但必須大於桌面牌';
  }
  return {ok:false,message:`已選 ${cards.length} 張 · ${reason}`,action};
 }
}
