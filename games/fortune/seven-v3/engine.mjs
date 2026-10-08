import {tarot,runes,hexagrams,numbers,characters,lots,signs,houses,topics} from './content.mjs';
import {planetReadings} from './cycles.mjs';
export function randomInt(n){if(!Number.isInteger(n)||n<1)throw Error('無效範圍');const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n;}
export function sample(deck,count,rng=randomInt){const d=deck.slice();for(let i=d.length-1;i>0;i--){const j=rng(i+1);[d[i],d[j]]=[d[j],d[i]];}return d.slice(0,count);}
export function taiwanDay(date=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).map(v=>[v.type,v.value]));return p.year+'-'+p.month+'-'+p.day;}
export function periodStart(key,weekly=false){const d=new Date(key+'T12:00:00+08:00');if(Number.isNaN(+d))throw Error('日期無效');if(weekly){const wd=new Date(key+'T00:00:00Z').getUTCDay();d.setUTCDate(d.getUTCDate()-((wd+6)%7));}return d;}
export function reduceNumber(n,masters=false){while(n>9&&!(masters&&[11,22,33].includes(n)))n=String(n).split('').reduce((s,c)=>s+ +c,0);return n;}
export function birthday(value,day=taiwanDay()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('請輸入完整出生日期。');const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));if(y<1900||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d||value>day)throw Error('請輸入有效且不晚於今天的生日（1900 年起）。');
 const sum=value.replaceAll('-','').split('').reduce((s,c)=>s+ +c,0),life=reduceNumber(sum,true),[year,month]=day.split('-').map(Number),personalYear=reduceNumber(reduceNumber(m)+reduceNumber(d)+reduceNumber(year)),personalMonth=reduceNumber(personalYear+month);return {life,sum,personalYear,personalMonth,year,month,detail:[life,personalYear,personalMonth].map(v=>numbers.find(n=>n.value===v))};
}
export function coinCast(rng=randomInt){return [0,1,2].reduce(s=>s+2+rng(2),0);}
export function readHex(lines){if(lines.length!==6||lines.some(n=>![6,7,8,9].includes(n)))throw Error('需要六爻');const bits=lines.map(n=>n%2?'1':'0').join(''),changed=lines.map(n=>n===6?'1':n===9?'0':n%2?'1':'0').join('');return {primary:hexagrams.find(h=>h.bits===bits),relating:changed===bits?null:hexagrams.find(h=>h.bits===changed),moving:lines.flatMap((n,i)=>n===6||n===9?[i+1]:[]),lines};}
export const spreads={single:['當下提醒'],three:['處境','阻力','方向'],relationship:['我的狀態','互動模式','可以調整之處'],choice:['選項 A 的課題','選項 B 的課題','共同需要面對的事']};
export function shuffleTarot(rng=randomInt){return sample(tarot,tarot.length,rng).map(c=>({...c,reversed:!!rng(2)}));}
export function drawTarot(spread='single',rng=randomInt){return shuffleTarot(rng).slice(0,spreads[spread].length).map((c,i)=>({...c,position:spreads[spread][i]}));}
export function drawRunes(count=1,rng=randomInt){return sample(runes,count,rng).map((r,i)=>({...r,position:count===1?'當下的提醒':['當前力量','需要面對的阻力','可採取的方向'][i]}));}
export function drawLot(rng=randomInt){return lots[rng(lots.length)];}
export function drawCharacter(rng=randomInt){return characters[rng(characters.length)];}
export function longitude(A,body,date){return A.Ecliptic(A.GeoVector(body,date,true)).elon;}
const planetWords={Sun:['太陽','意志與方向'],Moon:['月亮','情緒與日常需要'],Mercury:['水星','交流與學習'],Venus:['金星','關係與價值'],Mars:['火星','行動與界線'],Jupiter:['木星','拓展與機會'],Saturn:['土星','責任與結構']};
export function zodiac(signIndex,key,weekly,A){if(!A||!Number.isInteger(signIndex)||signIndex<0||signIndex>11)throw Error('星象資料尚未準備好');const start=periodStart(key,weekly),days=weekly?7:1,tracks=[];
 for(let i=0;i<days;i++){const date=new Date(+start+i*86400000),positions=Object.entries(planetWords).map(([body,words])=>{const lon=longitude(A,body,date),sign=Math.floor(lon/30),house=(sign-signIndex+12)%12;return {body,name:words[0],theme:words[1],lon,sign,house};});tracks.push({day:taiwanDay(date),positions});}
 const first=tracks[0],last=tracks.at(-1),aspects=[];for(let i=0;i<first.positions.length;i++)for(let j=i+1;j<first.positions.length;j++){const p=first.positions[i],q=first.positions[j],diff=Math.abs(p.lon-q.lon),angle=Math.min(diff,360-diff);for(const [target,name,tone] of [[0,'合相','兩種主題集中，適合整合，也要避免只看單一角度。'],[60,'六分相','較容易找到配合的切入點，仍需主動行動。'],[90,'四分相','不同需求可能拉扯，先分清優先順序。'],[120,'三分相','相互支持的條件值得使用，別只停在舒適區。'],[180,'對分相','兩端需要協調，留意自己與他人的不同立場。']]){const orb=Math.abs(angle-target);if(orb<=5)aspects.push({a:p.name,b:q.name,name,orb,tone});}}
 aspects.sort((a,b)=>a.orb-b.orb);const entries=Object.entries(planetWords).map(([body])=>{const p=first.positions.find(p=>p.body===body),q=last.positions.find(p=>p.body===body),h=houses[p.house];return {title:p.name+'・'+h[0],text:p.theme+'的閱讀焦點落在「'+h[0]+'」。'+planetReadings[body][p.house]+(p.house!==q.house?' 本週後段轉向「'+houses[q.house][0]+'」，可相應調整重點。':''),...p,end:q};});return {sign:signs[signIndex],start:first.day,end:last.day,weekly,entries,aspects,tracks};}
export function contextual(topic='self'){return topics[topic]||topics.self;}
