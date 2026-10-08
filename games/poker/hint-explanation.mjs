import {big2,bj,card,redScore} from './rules.mjs';
export function explainHint(table,action){
 if(!table||table.turn!==0||!action)return '請等自己的回合，再查看建議。';
 const hand=table.players[0].hand;
 if(table.type==='big2'){if(action.type==='pass')return '目前手牌沒有符合張數、且能壓過桌面牌型的合法組合。跳過不會丟掉手牌。';const type=big2(action.cards,table.rules);return (type?.name||'合法組合')+' · 出 '+action.cards.length+' 張後剩 '+(hand.length-action.cards.length)+' 張。'+(table.last?'這組符合桌面張數，牌力高於上一手。':'這是新一輪領出，可選擇自己的牌型。')+'建議以合法出牌與保留後續組合為考量。';}
 if(table.type==='blackjack'){const value=bj(hand),up=table.dealer?.[0]?card(table.dealer[0]).r:null;return '你的手牌為 '+(value.soft?'軟':'硬')+value.total+' 點，莊家明牌 '+(up===14?'A':Math.min(10,up))+'。'+({hit:'建議補牌：改善目前點數，但仍有爆牌風險。',stand:'建議停牌：保留目前點數，等待莊家完成。',double:'建議加倍：會增加下注且只補一張，確認籌碼足夠再自行選擇。'}[action.type]||'依目前可用動作選擇。');}
 if(table.type==='redpoint')return action.target?'建議用選取的手牌配對桌面牌，先取得 '+redScore(action.target,table.rules?.spadeAce!==false)+' 點桌面紅牌價值。':'目前沒有可配對的桌面牌，選取一張手牌放至桌面，保留之後的配對機會。';
 if(table.type==='sevens')return action.type==='pass'?'目前沒有能接在七點牌列兩端的牌，可跳過。':'選取的牌可合法接在牌列兩端；先釋出手牌，保留其他花色的銜接空間。';
 return action.cards?'已選取目前規則允許的手牌；你仍可改選後再出牌。':'請依牌桌上可使用的動作繼續。';
}
