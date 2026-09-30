// Explicit six-wave encounters. No mastery-dependent enemy scaling.
const entries=[
 ['林間入口','認識部署與波次間升級。',['wwwww','wwrwww','wwawwww','wrrwwaww','aawwrrww','wwarwwb']],
 ['溪岸急行','快腳敵人開始成群，留意彎道覆蓋。',['wrwrww','rrwwwrr','wwaawwwr','rrwrrwaw','aarrwwrr','rrwawawb']],
 ['苔石哨站','重甲較多，穿甲與緩速能減輕壓力。',['awwwwaw','aawwrww','waawaaww','rraawwar','aawaawaa','aawwarrb']],
 ['雙線節奏','快慢敵人交替，避免火力全壓前段。',['rrwwaaww','aarrrwww','rrraawwr','awaarrwa','rrrwaaaw','aarrrwwb']],
 ['林冠守門','第一區域守門戰，第三與第六波有頭目。',['waarrrww','aawwaarrr','wwarrwb','rrraaaaww','aaarrraaw','aarrwwbb']],
 ['月露小徑','快速敵群密集，範圍傷害開始重要。',['rrrwwrrw','wrrrwwrr','aarrrwww','rrrarrraw','aaarrrwww','rrrwaawb']],
 ['霧鐘渡口','重甲保護快腳敵人，配置後段防線。',['awrrwraw','aarraarr','raarraaw','aaarrrraa','rrraaaarr','aarrarrb']],
 ['銀葉回廊','混合敵群逐波增密。',['wrawrawr','aarwrraa','rrarraar','aarraarrw','rrraaarrr','aarrwabb']],
 ['夜光哨塔','中場頭目後仍有追兵，不要提前撤防。',['rrrarrww','aarrraaw','bwwrrraa','rrrraaar','aaaarrraw','rraaarbb']],
 ['月庭守門','第二區域決戰，頭目與重甲交錯。',['aarrraarr','rrraaarrr','abrrwaaw','aaarrraaa','rrrraaarr','barraaab']],
 ['晨曦前線','高速先鋒壓境，提早準備技能。',['rrrrwarrr','aarrrraar','rrrraaarr','abrrrraa','rrrraaaarr','rrrbaarb']],
 ['晶石防壁','大量護甲敵群，選擇合適的升級分支。',['aaawaaawr','aarraaaar','aaaarraaa','braaawaar','aaaarrraaa','aabaarab']],
 ['日輪長廊','持續混合壓力，需覆蓋完整路線。',['rraarraar','aarrraarr','brraarrr','rrrraaaarr','aarrrraaar','brrraaab']],
 ['王座外庭','兩次頭目波，保留應急技能與金幣。',['aaarrraarr','rrraaaarrr','baarrraab','rrrraaarrr','aaaarrraaa','baarrrabb']],
 ['最後守護','三段頭目考驗，全線部署再迎戰。',['arrarrarra','baarrraar','rrrraaaarr','abrrraaab','aaaarrrraaa','barabarrb']]
];
const kinds={w:'walker',r:'runner',a:'armored',b:'boss'};
export const CAMPAIGN=entries.map(([name,tip,waves],i)=>Object.freeze({stage:i+1,name,tip,region:['翠林','月露','晨曦'][Math.floor(i/5)],waves:waves.map(s=>Object.freeze([...s].map(c=>kinds[c]))),interval:Math.max(.65,.98-i*.02)}));
export function encounterWave(stage,wave){const level=CAMPAIGN[stage-1];if(!level||wave<1||wave>6)throw Error('Invalid encounter');return [...level.waves[wave-1]];}
