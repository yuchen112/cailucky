export const VERSION='20261007-duel6';
const rows=[
 ['joy','朵莉','快樂','派對小彩星','快速近戰','#f7a4bc',340,960,1,'彩星突進','慶典大爆發','輕快連擊，靠近後用彩星突進接續攻勢。'],
 ['dream','露緹','夢想','星願魔法師','遠距牽制','#b7a5ed',270,950,3,'星願飛信','星願流星雨','星彈控制距離，對手跳躍時用重擊迎擊。'],
 ['night','米洛','夜晚陪伴','月夜守護者','防守反擊','#8eaddb',280,1000,3,'月影反擊','月夜迴響','技能短暫架起反擊姿態，成功接招才會反打。'],
 ['sadness','汐寧','悲傷','雨天陪伴者','節奏控制','#9ec9da',250,1000,2,'細雨花園','雨後花開','雨幕在前方延遲落下，命中會減緩對手。'],
 ['trust','伯恩','信任','鑰匙守護者','重型近戰','#dcc392',225,1100,2,'金鑰重擊','金鑰封鎖','蓄力技能具有護甲，適合預判對手的出手。'],
 ['memory','緹雅','回憶','回憶收藏家','技術連段','#dcb8a3',275,980,3,'昨日留影','昨日重映','先揮擊再留下延遲回響，製造兩段攻擊。'],
 ['growth','森芽','成長','森林旅伴','均衡入門','#b5d79b',290,1000,1,'藤蔓升擊','森林脈動','木杖擅長中距離，藤蔓升擊能迎擊跳躍。'],
 ['healing','糯糯','療癒','暖心絨絨','耐久防守','#f2c9b1',245,1060,1,'暖心披肩','暖心擁抱','技能獲得護盾；每回合最多兩次回復近期受傷。'],
 ['luck','鈴可','幸運','四葉鈴狐','靈活突襲','#a3e0c2',360,930,2,'四葉滑步','四葉疾風','低姿態突進抓住空檔，打空後要及時防守。'],
 ['hope','曦羽','希望','光線編織者','空間控制','#d7dafa',265,970,3,'織光結界','曙光織界','在前方編織延遲光結，限制對手靠近。']
];
export const CAST=rows.map(([id,name,word,title,style,color,speed,hp,difficulty,skill,superName,tip])=>({id,name,word,title,style,color,speed,hp,difficulty,skill,superName,tip,portrait:`../../assets/characters/cxq-role-${id}.webp`,poses:Object.fromEntries(['ready','cast','victory'].map(p=>[p,`../fairytale-defense/rebuild/art/${id}-${p}.webp`]))}));
export const BY_ID=Object.fromEntries(CAST.map(c=>[c.id,c]));
export const STAGES=[
 {id:'festival',name:'心光慶典廣場',art:'art/arena-festival.webp',tint:'#244842',music:'heavenly'},
 {id:'moon',name:'月夜郵站',art:'art/arena-moon.webp',tint:'#243957',music:'space'},
 {id:'rain',name:'雨中花園',art:'art/arena-rain.webp',tint:'#345060',music:'heavenly'},
 {id:'workshop',name:'星願工坊',art:'art/arena-workshop.webp',tint:'#46365c',music:'heavenly'}
];
export const ENDINGS={joy:'朵莉把勝利徽章掛在廣場上，邀請每一位曾經交手的夥伴加入慶典。她最喜歡的獎勵，是散場後大家仍然記得的笑聲。',dream:'露緹把今天的招式寫進星願信箋。下一封信，不是寄給遠方，而是寄給還不敢踏出第一步的自己。',night:'米洛提起月燈，陪疲倦的夥伴走回家。月夜武鬥祭落幕了，郵站仍為最後一位旅人留著光。',sadness:'汐寧收起雨傘，讓雨後的陽光照進花園。她知道勇敢不必大聲，有時候只是願意再試一次。',trust:'伯恩把金鑰交還會場管理員，並替大家保管約定。勝負可以改變，守護彼此的心意仍然可靠。',memory:'緹雅拍下大家的合照。相片裡有擦傷、笑容和歪掉的徽章，這些不完美讓今天值得收藏。',growth:'森芽在場邊種下一株新芽。她把每一次失誤都寫成路標，下一位初來小鎮的旅人會更容易找到方向。',healing:'糯糯把披肩借給冷得發抖的觀眾。掌聲之後，大家一起坐下喝茶；被好好照顧，也是一種力量。',luck:'鈴可搖響四葉鈴，和夥伴約好明年再見。這份好運來自一路的練習，也來自願意陪她的人。',hope:'曦羽把散落的心光織成一面旗。十種顏色各有方向，卻能共同迎接小鎮的下一個清晨。'};
export const CONTROLS={p1:{left:'KeyA',right:'KeyD',down:'KeyS',jump:'Space',light:'KeyJ',heavy:'KeyK',skill:'KeyL',guard:'KeyI',super:'KeyU'},p2:{left:'ArrowLeft',right:'ArrowRight',down:'ArrowDown',jump:'ArrowUp',light:'Numpad1',heavy:'Numpad2',skill:'Numpad3',guard:'Numpad0',super:'Numpad5'}};
export const ACTION_NAMES={left:'向左',right:'向右',down:'蹲下',jump:'跳躍',light:'輕攻擊',heavy:'重攻擊',skill:'技能',guard:'格擋',super:'必殺'};
