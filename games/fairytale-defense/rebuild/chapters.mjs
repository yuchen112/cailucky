export const CHAPTERS=[
 {id:'lantern',number:1,name:'熄滅的引路燈',tag:'尋回森林的方向',cover:'chapter-lantern',first:1,last:5,intro:'森林的引路燈接連熄滅，迷路的伙伴被暗影困在林間。指揮隊伍沿著最後一道光，尋回失落的燈芯。',end:'燈芯重新亮起，光芒映出沿河流失的星露。新的線索指向月露河谷。'},
 {id:'stardew',number:2,name:'失落的星露',tag:'守住兩河的希望',cover:'chapter-stardew',first:6,last:10,intro:'星露被暗影引向兩條不同的河道。伙伴們必須守住匯流處，讓夢境核心重新獲得力量。',end:'兩道星露終於匯流，晨曦高地的信號塔在遠處回應。'},
 {id:'dreamgate',number:3,name:'重啟夢境之門',tag:'跨越高地與遺跡',cover:'chapter-dreamgate',first:11,last:15,intro:'隊伍先沿晨曦山路點亮信號塔，再深入星環遺跡。這次旅程跨越不同戰場，只為重新開啟夢境之門。',end:'夢境之門重新開啟。伙伴們把引路光留在各地，繼續守護每一個新的夢。'}
];
export function chapterFor(stage){const chapter=CHAPTERS.find(c=>stage>=c.first&&stage<=c.last);if(!chapter)throw Error('Unknown story stage');return {...chapter,part:stage-chapter.first+1,label:chapter.number+'-'+(stage-chapter.first+1)};}
