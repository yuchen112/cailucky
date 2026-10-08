// Each product has one denomination and its own board, rules and award schedule.
export const TICKET_CATALOG=[
 {id:'trio20',cost:20,name:'午茶三連',mode:'trio',theme:'tea',cols:3,rows:2,colors:['#ba697c','#ffe6d5'],desc:'兩排各自找三個相同圖案，兩排獎金可累加。',rules:'每排三個相同才中獎：幸運草 200、星星 100、點心 60、葉子 40、禮物 30、相機 20 金幣。兩排分別計算後相加。',max:400},
 {id:'coins20',cost:20,name:'口袋零錢',mode:'coins',theme:'pocket',cols:3,rows:2,colors:['#307882','#e0f5e3'],desc:'六個口袋藏著零錢，找到金幣就領取該格獎金。',rules:'每格刮出金幣符號，可領取該格標示金額；刮出空口袋為 0。六格獎金全部相加，沒有倍率或連線要求。',max:300},
 {id:'numbers50',cost:50,name:'星願號碼',mode:'numbers',theme:'sky',cols:4,rows:2,colors:['#51559d','#e4e5ff'],desc:'對照兩個幸運號碼，命中的格子各自領獎。',rules:'你的八個號碼與上方兩個幸運號碼比對；每個命中號碼領取該格獎金。不同命中格可累加，未命中格不給獎。',max:1000},
 {id:'keys50',cost:50,name:'雙島尋寶',mode:'keys',theme:'island',cols:4,rows:2,colors:['#97713a','#fff0c0'],desc:'兩座島分開尋寶，每島三把鑰匙開啟自己的寶箱。',rules:'每一橫排代表一座島：前三格全部是鑰匙，才能領取第四格寶箱內標示的金額。兩座島獨立判定，成功的寶箱獎金相加。',max:1000},
 {id:'garden100',cost:100,name:'四季花園',mode:'garden',theme:'garden',cols:4,rows:3,colors:['#437253','#e6f5d1'],desc:'收集十二個花圃中的花朵，依總數兌獎。',rules:'全卡花朵數：0～2 朵未中獎；3 朵 50、4 朵 100、5 朵 200、6 朵 300、7 朵 500、8 朵 800、9 朵 1,200、10 朵 2,000、11 朵 3,000、12 朵 5,000 金幣。只領取總數對應的一個獎項。',max:5000},
 {id:'bags100',cost:100,name:'加倍郵局',mode:'bags',theme:'post',cols:3,rows:2,colors:['#a85735','#fff0d6'],desc:'五封獎金信加總，最後揭曉本張倍率。',rules:'前五格的信封金額相加，再乘上第六格的 ×1／×2／×3／×5；0 金幣信封不計獎。倍率只乘一次，沒有其他加碼。',max:2500},
 {id:'bingo200',cost:200,name:'小鎮賓果夜',mode:'bingo',theme:'bingo',cols:4,rows:4,colors:['#65438b','#f2e3ff'],desc:'十個開獎號碼對照 4×4 棋盤，完整連線領獎。',rules:'上方十個開獎號碼對照棋盤；完整橫排、直排或兩條對角線，每條給 400 金幣，多條可累加。十個開獎號碼最多完成三條線，最高 1,200 金幣。棋盤號碼不重複；只差一格不算連線。',max:1200},
 {id:'trail200',cost:200,name:'森林小徑',mode:'trail',theme:'trail',cols:5,rows:2,colors:['#287169','#e2f2d0'],desc:'兩條小徑由左往右走，連續足跡越多獎金越高。',rules:'每排從最左格開始數連續足跡，遇到石頭停止；2／3／4／5 個足跡分別領 100／200／500／1,000 金幣，0～1 個不給獎。停止後的足跡不計，兩排獎金相加。',max:2000},
 {id:'vault500',cost:500,name:'黃金保險庫',mode:'vault',theme:'vault',cols:3,rows:3,colors:['#7c6024','#fff1b1'],desc:'三座保險庫各自比大小，勝過守衛才能領獎。',rules:'每排依序刮出你的點數、守衛點數、金庫獎金。你的點數大於守衛才領取該排金額；相等或較小皆不給獎。三排成功金額相加。',max:15000},
 {id:'stars500',cost:500,name:'星際五連',mode:'stars',theme:'space',cols:5,rows:3,colors:['#26376e','#e5edff'],desc:'三條星軌各自找相同圖案，三星起獎、五星最高。',rules:'每排同一圖案出現 3／4／5 次，分別領 500／1,500／5,000 金幣，位置不用相鄰。每排只取一個獎項，三排獎金相加；不同圖案不能混算。',max:15000}
].map(t=>({...t,art:'art/ticket-'+t.id+'-v2.webp'}));
export const TICKET_COSTS=[20,50,100,200,500];
export const ticketProduct=id=>TICKET_CATALOG.find(t=>t.id===id);
const pick=(rng,n)=>Math.min(n-1,Math.floor(rng()*n));
const choice=(rng,items)=>items[pick(rng,items.length)];
function shuffled(rng,a){for(let i=a.length-1;i>0;i--){const j=pick(rng,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const rowAwards=[200,100,60,40,30,20],flowers=[0,0,0,50,100,200,300,500,800,1200,2000,3000,5000],trails=[0,0,100,200,500,1000];
export function productAwards(t){const p=ticketProduct(t.kind),out=[],add=(label,coins)=>{if(coins)out.push({label,coins});};if(!p)throw Error('找不到票券');
 if(p.mode==='trio'||p.mode==='stars'){for(let row=0;row<p.rows;row++){const a=t.values.slice(row*p.cols,(row+1)*p.cols),counts=Array.from({length:6},(_,i)=>a.filter(v=>v===i).length),count=Math.max(...counts);if(p.mode==='trio'&&count===3)add('第 '+(row+1)+' 排三同',rowAwards[a[0]]);if(p.mode==='stars'&&count>=3)add('第 '+(row+1)+' 排 '+count+' 同',({3:500,4:1500,5:5000})[count]);}}
 if(p.mode==='coins')t.values.forEach((v,i)=>{if(v===1)add('第 '+(i+1)+' 個口袋',t.prizes[i]);});
 if(p.mode==='numbers')t.values.forEach((v,i)=>{if(t.lucky.includes(v))add('號碼 '+v,t.prizes[i]);});
 if(p.mode==='keys')for(let row=0;row<2;row++)if(t.values.slice(row*4,row*4+3).every(v=>v===1))add('第 '+(row+1)+' 座島寶箱',t.prizes[row*4+3]);
 if(p.mode==='garden'){const count=t.values.filter(v=>v===1).length;add(count+' 朵花',flowers[count]);}
 if(p.mode==='bags')add('五封信加總 ×'+t.values[5],t.prizes.slice(0,5).reduce((a,b)=>a+b,0)*t.values[5]);
 if(p.mode==='bingo'){for(const line of productBingoLines(t))add(line.label,400);}
 if(p.mode==='trail')for(let row=0;row<2;row++){let count=0;for(const v of t.values.slice(row*5,row*5+5)){if(v!==1)break;count++;}add('小徑 '+(row+1)+'・'+count+' 個足跡',trails[count]);}
 if(p.mode==='vault')for(let row=0;row<3;row++)if(t.values[row*3]>t.values[row*3+1])add('保險庫 '+(row+1),t.prizes[row*3+2]);
 return out;
}
export function productBingoLines(t){const lines=[],hit=i=>t.lucky.includes(t.values[i]);for(let i=0;i<4;i++){lines.push({label:'橫排 '+(i+1),cells:[0,1,2,3].map(x=>i*4+x)});lines.push({label:'直排 '+(i+1),cells:[0,1,2,3].map(y=>y*4+i)});}lines.push({label:'左斜線',cells:[0,5,10,15]},{label:'右斜線',cells:[3,6,9,12]});return lines.filter(line=>line.cells.every(hit));}
export function productReward(t){return productAwards(t).reduce((n,a)=>n+a.coins,0);}
export function makeProductTicket(kind,cost,rng){const p=ticketProduct(kind);if(!p||p.cost!==cost)throw Error('票種與面額不一致');const count=p.cols*p.rows,t={id:crypto.randomUUID(),layoutVersion:5,kind,cost,values:Array(count).fill(0),prizes:Array(count).fill(0),lucky:[],revealed:Array(count).fill(false),marks:Array.from({length:count},()=>[])};
 if(p.mode==='trio'||p.mode==='stars'){t.values=t.values.map(()=>pick(rng,6));for(let row=0;row<p.rows;row++)if(rng()<(p.mode==='trio'?.35:.32)){const symbol=pick(rng,6),matches=p.mode==='trio'?3:choice(rng,[3,3,3,4,5]),a=Array.from({length:p.cols},(_,i)=>i<matches?symbol:(symbol+1+pick(rng,5))%6);t.values.splice(row*p.cols,p.cols,...shuffled(rng,a));}}
 if(p.mode==='coins'){t.values=t.values.map(()=>rng()<.27?1:0);t.prizes=t.values.map(()=>choice(rng,[5,10,10,20,50]));}
 if(p.mode==='numbers'){const pool=shuffled(rng,Array.from({length:30},(_,i)=>i+1));t.lucky=pool.slice(0,2);t.values=shuffled(rng,Array.from({length:30},(_,i)=>i+1)).slice(0,8);t.prizes=t.values.map(()=>choice(rng,[25,25,50,100,500]));}
 if(p.mode==='keys'){for(let row=0;row<2;row++){t.values.splice(row*4,4,...Array.from({length:3},()=>rng()<.68?1:0),2);t.prizes[row*4+3]=choice(rng,[25,50,50,100,500]);}}
 if(p.mode==='garden')t.values=t.values.map(()=>rng()<.32?1:0);
 if(p.mode==='bags'){for(let i=0;i<5;i++)t.prizes[i]=choice(rng,[0,0,0,0,10,20,50,100]);t.values[5]=choice(rng,[1,1,1,2,2,3,5]);}
 if(p.mode==='bingo'){t.values=shuffled(rng,Array.from({length:40},(_,i)=>i+1)).slice(0,16);const draw=rng(),indices=draw<.003?[0,1,2,3,12,13,14,15,5,10]:draw<.12?[0,1,2,3,4,5,6,7]:draw<.5?[0,1,2,3]:[];t.lucky=indices.map(i=>t.values[i]);const others=shuffled(rng,Array.from({length:40},(_,i)=>i+1).filter(v=>!t.lucky.includes(v)));t.lucky=shuffled(rng,t.lucky.concat(others.slice(0,10-t.lucky.length)));}
 if(p.mode==='trail')t.values=t.values.map(()=>rng()<.64?1:0);
 if(p.mode==='vault'){for(let row=0;row<3;row++){t.values[row*3]=1+pick(rng,9);t.values[row*3+1]=1+pick(rng,9);t.values[row*3+2]=0;t.prizes[row*3+2]=choice(rng,[100,200,500,1000,5000]);}}
 t.win=productReward(t);validateProductTicket(t);return t;
}
// Individually measured play rectangles for independently illustrated ticket faces.
const PRINTED_RECTS={"trio20":[0.127,0.34,0.737,0.516],"coins20":[0.133,0.28,0.732,0.56],"numbers50":[0.116,0.32,0.77,0.495],"keys50":[0.154,0.384,0.73,0.473],"garden100":[0.139,0.258,0.725,0.638],"bags100":[0.139,0.291,0.736,0.553],"bingo200":[0.126,0.256,0.754,0.628],"trail200":[0.133,0.324,0.735,0.51],"vault500":[0.15,0.282,0.7,0.575],"stars500":[0.085,0.315,0.824,0.544]};
export function productLayout(t){const p=ticketProduct(t.kind),[x,y,w,h]=PRINTED_RECTS[p.id];return Array.from({length:p.cols*p.rows},(_,i)=>({x:x+(i%p.cols)*w/p.cols+.005,y:y+Math.floor(i/p.cols)*h/p.rows+.006,w:w/p.cols-.016,h:h/p.rows-.02}));}

export function validateProductTicket(t){const p=ticketProduct(t.kind),int=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b,count=p?.cols*p?.rows;
 if(!p||t.cost!==p.cost||t.layoutVersion!==5||typeof t.id!=='string'||!t.id||!Array.isArray(t.values)||t.values.length!==count||t.values.some(v=>!int(v,0,99))||!Array.isArray(t.prizes)||t.prizes.length!==count||t.prizes.some(v=>!int(v,0,p.max))||!Array.isArray(t.lucky)||t.lucky.some(v=>!int(v,1,40))||new Set(t.lucky).size!==t.lucky.length||!int(t.win,0,p.max)||!Array.isArray(t.revealed)||t.revealed.length!==count||t.revealed.some(v=>typeof v!=='boolean')||!Array.isArray(t.marks)||t.marks.length!==count||t.marks.some(a=>!Array.isArray(a)||a.length>384||new Set(a).size!==a.length||a.some(v=>!int(v,0,383)))||t.surfaceMarks!==undefined&&(!Array.isArray(t.surfaceMarks)||t.surfaceMarks.length>5184||new Set(t.surfaceMarks).size!==t.surfaceMarks.length||t.surfaceMarks.some(v=>!int(v,0,5183))))throw Error('票券資料不正確');
 const range=(a,lo,hi)=>a.every(v=>int(v,lo,hi));
 if(['trio','stars'].includes(p.mode)&&!range(t.values,0,5))throw Error('圖案資料不正確');
 if(['coins','garden','trail'].includes(p.mode)&&!range(t.values,0,1))throw Error('符號資料不正確');
 if(['numbers','bingo'].includes(p.mode)&&(!range(t.values,1,p.mode==='numbers'?30:40)||new Set(t.values).size!==count||t.lucky.length!==(p.mode==='numbers'?2:10)||p.mode==='numbers'&&!range(t.lucky,1,30)))throw Error('號碼資料不正確');
 if(p.mode==='keys'&&!t.values.every((v,i)=>i%4===3?v===2:int(v,0,1)))throw Error('寶箱資料不正確');
 if(p.mode==='bags'&&(![1,2,3,5].includes(t.values[5])||t.prizes[5]!==0||!t.prizes.slice(0,5).every(v=>[0,10,20,50,100].includes(v))))throw Error('信封資料不正確');
 if(p.mode==='vault'&&!t.values.every((v,i)=>i%3===2?v===0:int(v,1,9)))throw Error('保險庫資料不正確');
 if(!['numbers','bingo'].includes(p.mode)&&t.lucky.length)throw Error('多餘的開獎號碼');
 if(['trio','stars','garden','trail','bingo'].includes(p.mode)&&t.prizes.some(v=>v!==0))throw Error('多餘的獎金格');
 if(p.mode==='coins'&&!t.prizes.every(v=>[5,10,20,50].includes(v)))throw Error('口袋獎金不正確');
 if(p.mode==='numbers'&&!t.prizes.every(v=>[25,50,100,500].includes(v)))throw Error('號碼獎金不正確');
 if(p.mode==='keys'&&!t.prizes.every((v,i)=>i%4===3?[25,50,100,500].includes(v):v===0))throw Error('寶箱獎金不正確');
 if(p.mode==='vault'&&!t.prizes.every((v,i)=>i%3===2?[100,200,500,1000,5000].includes(v):v===0))throw Error('金庫獎金不正確');
 if(productReward(t)!==t.win)throw Error('票面與獎金不一致');return true;
}
