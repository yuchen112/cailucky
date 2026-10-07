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
// Public save identifiers: never rename these when adding or rearranging chapters.
const STAGE_IDS=['forest-entrance','forest-creek','forest-moss','forest-watch','forest-gate','moon-bank','moon-fork','moon-island','moon-bridge','moon-source','dawn-outpost','dawn-crystal','ruins-corridor','ruins-court','ruins-throne'];
if(STAGE_IDS.length!==entries.length)throw Error('Every authored stage requires a permanent ID');
import {isBoss} from './enemy-catalog.mjs?v=20261007-names1';
const kinds={w:'walker',r:'runner',a:'armored',b:'boss',m:'moth'};
export const CAMPAIGN=entries.map(([name,tip,waves],i)=>Object.freeze({id:STAGE_IDS[i],stage:i+1,name,tip:tip+(i>=5?' 飛蛾從第二波混入；準備對空兵或英雄技能。':''),map:i<5?'forest':i<10?'moon':i<12?'dawn':'ruins',region:i<5?'翠林':i<10?'月露':i<12?'晨曦':'遺跡',waves:waves.map((s,w)=>Object.freeze([...s].map((c,n)=>kinds[i>=5&&w>=1&&c==='r'&&n%4===1?'m':c]))),interval:Math.max(.65,.98-i*.02)}));
export function encounterWave(stage,wave){const level=CAMPAIGN[stage-1];if(!level||wave<1||wave>level.waves.length)throw Error('Invalid encounter');return level.waves[wave-1].map((kind,i)=>isBoss(kind)&&stage>=10?(stage>=15?'clocklord':stage>=13?'emberlord':'frostlord'):stage>=6&&wave>=3&&i%9===3&&kind==='walker'?'medic':stage>=11&&i%5===2&&kind==='armored'?'shieldling':stage>=8&&i%7===4&&kind==='runner'?'berserker':kind);}
