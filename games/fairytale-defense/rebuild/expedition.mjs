import {chapterFor} from './chapters.mjs?v=20261007-names1';
export const MAPS={
 forest:{name:'翠林入口',tag:'彎道集中火力',stage:1,intro:'森林裡的引路光一盞盞熄滅。伙伴們決定守住入口，找出讓夢境失去方向的原因。',end:'入口的燈重新亮起，卻照出通往月露河谷的破碎足跡。'},
 moon:{name:'月露雙河',tag:'雙路匯合防守',stage:6,intro:'散落的星露沿兩條河道流失。必須同時保住左右路，才能讓月露重新匯入夢境核心。',end:'兩道星露終於匯流；伙伴們發現晨曦高地的信號塔仍然沉默。'},
 dawn:{name:'晨曦高地',tag:'長路接力攔截',stage:11,intro:'晨光被濃霧困住，補給只能沿曲折山路前進。守住每段轉彎，讓信號再次抵達遠方。',end:'信號塔照亮遺跡，失落的夢境之門終於顯露出來。'},
 ruins:{name:'星環遺跡',tag:'外環與內環接力',stage:13,intro:'夢境之門就在環形遺跡深處。敵群繞行外環後將切入內圈，最後的守護不能留下空隙。',end:'夢境之門重新開啟。伙伴們把引路光留在各地，繼續守護每一個新的夢。'}
};
export const storyMap=stage=>stage<=5?'forest':stage<=10?'moon':stage<=12?'dawn':'ruins';
export function storyFor(stage){const chapter=chapterFor(stage);return {...chapter,text:chapter.intro+' '+['先建立防線，觀察敵人的進場路線。','快速敵人開始試探缺口，準備攔截。','重甲部隊逼近，調整破甲與範圍火力。','敵人從不同方向接力進攻，守住最後的線索。','頭目阻擋旅程，集中火力完成本章守護。'][chapter.part-1]};}
