import {modes} from './content.mjs';
const str=(v,max=10000)=>typeof v==='string'&&v.length<=max;
export function validateBackup(raw){
 if(!raw||raw.format!=='cxq-oracle-seven-v3'||raw.version!==1||!Array.isArray(raw.entries)||raw.entries.length>100)throw Error('不是有效的 CxQ 占卜手帳備份。');
 for(const r of raw.entries){
  if(!r||!str(r.id,100)||!r.id||!str(r.title,500)||!str(r.summary)||!str(r.mode,100)||!str(r.meta,2000)||!modes.some(m=>m.id===r.kind)||!Number.isFinite(Date.parse(r.created))||!str(r.note,1000)||r.question!==undefined&&!str(r.question,280)||!Array.isArray(r.sections)||r.sections.length>20||!Array.isArray(r.visuals)||r.visuals.length>6)throw Error('備份內容不完整或格式不正確，未匯入任何資料。');
  for(const s of r.sections)if(!s||!str(s.title,500)||!str(s.text)||s.action!==undefined&&!str(s.action,2000))throw Error('備份解讀格式不正確。');
  for(const v of r.visuals){if(!v||!str(v.name,200)||!['tarot','rune','hex','number','image'].includes(v.kind))throw Error('備份圖像格式不正確。');
   if(v.kind==='image'&&!/^(seven-v3\/art\/[a-z0-9-]+\.webp|\.\.\/\.\.\/assets\/mascot-motion-v2\/(joy|dream|night|sadness|trust|memory|growth|healing|luck|hope|box)-idle\.webp)$/.test(v.src))throw Error('備份包含不支援的圖像路徑。');
   if(v.kind==='hex'&&(!/^[01]{6}$/.test(v.bits)||!Array.isArray(v.moving)||v.moving.some(n=>!Number.isInteger(n)||n<1||n>6)))throw Error('卦象資料無效。');
   if(v.kind==='tarot'&&(!Number.isInteger(v.id)||v.id<0||v.id>77||typeof v.reversed!=='boolean'))throw Error('塔羅資料無效。');
   if(v.kind==='rune'&&(!str(v.glyph,4)||!/^[\u16a0-\u16ff]$/.test(v.glyph)))throw Error('符文資料無效。');
   if(v.kind==='number'&&![1,2,3,4,5,6,7,8,9,11,22,33].includes(v.value))throw Error('數字資料無效。');
  }
 }
 return raw.entries;
}
