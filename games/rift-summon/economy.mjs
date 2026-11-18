import {exclusiveIds} from './exclusive-cards.mjs?v=combat-2';
import {extraCards,extraRunes,expansionRanks} from './content-expansion.mjs?v=combat-2';
import {materials} from './materials.mjs?v=combat-2';
export const capsuleCards=[...Object.keys(extraCards),'ember','wisp','turtle','raven','stag','lynx','moth','drake','ibis','hare','otter','ram','bat','beetle','crane','yak','seal','boar','swan','crab','gecko','wolf','panda','hedgehog','koi','falcon','mole','lion','badger','lynxguard','robin','frog','yakfire','stork','ferret','beaver','rabbit','eagle'];
export const walletCardIds=[...capsuleCards,...exclusiveIds];
export const maxLevel=5;
export const validRunes=[...Object.keys(extraRunes),'wall','heal','frost','spark','ward','flame','tide','root','mirror','dawn','anchor','shelter','surge','echo','none'];
export const rarityNames=['N','R','SR','S','SS','SSR','UUR','XUR'];
export const starterHeroes=['trust','healing','joy'];
export const heroIds=['hope','trust','growth','healing','joy','luck','memory','night','sadness','dream'];
const rare={
  ...Object.fromEntries(exclusiveIds.map(id=>[id,7])),
  ...expansionRanks,
  guard:0,bomb:1,archer:0,ax:1,ghost:2,healer:1,knight:2,giant:2,bow:1,fang:2,flag:3,moon:3,boss:4,spirit:0,
  ember:3,wisp:4,turtle:3,raven:5,stag:2,lynx:4,moth:3,drake:6,ibis:5,hare:1,otter:2,ram:4,bat:2,beetle:3,crane:4,yak:5,
  wall:0,heal:0,ward:1,flame:2,frost:3,tide:3,root:4,spark:5,
  seal:0,boar:1,swan:4,crab:2,gecko:0,wolf:4,panda:1,hedgehog:0,koi:3,falcon:3,mole:2,lion:6,
  mirror:2,dawn:4,anchor:5,
  badger:1,lynxguard:2,robin:1,frog:3,yakfire:4,stork:4,ferret:0,beaver:2,rabbit:5,eagle:6,
  shelter:2,surge:4,echo:5,
  trust:2,healing:2,joy:2,growth:2,luck:3,memory:3,sadness:3,hope:4,night:4,dream:5,
};
export function rarity(id) {return materials[id]?.tier??rarityNames[rare[id]??0];}
const weights=[36,28,20,12,7,3,1];
export function poolFor(kind,currency) {
  if(!['gold','gems'].includes(currency))return [];
  const ids=kind==='card'?capsuleCards:kind==='rune'?validRunes.filter(id=>id!=='none'):kind==='hero'?heroIds:[];
  const cap=kind==='card'?(currency==='gold'?4:6):(currency==='gold'?3:5);
  const ordinary=ids.filter(id=>(rare[id]??0)<=cap).map(id=>({id,weight:weights[rare[id]??0]}));
  if(kind==='card')for(const [id,book] of Object.entries(materials)){
    const rank=rarityNames.indexOf(book.tier);
    if(rank<=cap)ordinary.push({id,weight:weights[rank]*(book.kind?0.25:0.5)});
  }
  return ordinary;
}
export function pityTier(kind,currency){return Math.max(0,...poolFor(kind,currency).filter(item=>!materials[item.id]).map(item=>rarityNames.indexOf(rarity(item.id))))-1;}
export function pityRemaining(wallet,kind,currency){return 10-(wallet.pity?.[currency+':'+kind]??0);}
export function pullPrice(currency,count) {
  return (currency==='gold'?1200:12)*(count===10?9:1);
}
export function openBatch(wallet,kind,currency,count,roll=Math.random,alreadyOwned=[]) {
  const pool=poolFor(kind,currency);
  const cost=pullPrice(currency,count);
  if(!['gold','gems'].includes(currency)||![1,10].includes(count)||!pool.length||wallet[currency]<cost)return null;
  const key=kind==='card'?'copies':kind==='rune'?'runeCopies':'heroCopies';
  const copies={...wallet[key]};
  const unlocked=[...wallet.unlocked];
  const known=new Set(alreadyOwned);
  const pity={...wallet.pity};const pityKey=currency+':'+kind;let progress=pity[pityKey]??0;
  const guarantee=pityTier(kind,currency);
  const draws=[];
  for(let i=0;i<count;i++){
    const choices=progress>=9?pool.filter(item=>!materials[item.id]&&rarityNames.indexOf(rarity(item.id))>=guarantee):pool;
    const total=choices.reduce((sum,item)=>sum+item.weight,0);
    let point=Math.max(0,Math.min(.999999999,roll()))*total;
    const id=choices.find(item=>(point-=item.weight)<0).id;
    const guaranteed=!materials[id]&&rarityNames.indexOf(rarity(id))>=guarantee;
    progress=guaranteed?0:progress+1;
    if(materials[id]){draws.push({id,kind:'material',duplicate:known.has(id)});known.add(id);continue;}
    const duplicate=known.has(id);
    copies[id]=(copies[id]??(duplicate?1:0))+1;
    if(kind==='card'&&!unlocked.includes(id))unlocked.push(id);
    known.add(id);
    draws.push({id,kind,duplicate});
  }
  pity[pityKey]=progress;
  return {draws,wallet:{...wallet,pity,[currency]:wallet[currency]-cost,[key]:copies,unlocked}};
}
export function improveCollectible(wallet,kind,id,baseOwned) {
  const copyKey=kind==='hero'?'heroCopies':'runeCopies';
  const levelKey=kind==='hero'?'heroLevels':'runeLevels';
  const level=wallet[levelKey]?.[id]??1;
  const copies=wallet[copyKey]?.[id]??(baseOwned?1:0);
  if(level>=maxLevel||copies<2)return null;
  return {...wallet,[copyKey]:{...wallet[copyKey],[id]:copies-1},[levelKey]:{...wallet[levelKey],[id]:level+1}};
}

export function startingWallet() {
  return {gold:1200,gems:12,unlocked:[],levels:{}};
}
export function validWallet(wallet) {
  const record=(obj,ids,max)=>obj===undefined||(obj&&typeof obj==='object'&&!Array.isArray(obj)&&
    Object.entries(obj).every(([id,n])=>ids.includes(id)&&Number.isSafeInteger(n)&&n>=1&&n<=max));
  const pityOk=wallet?.pity===undefined||wallet.pity&&typeof wallet.pity==='object'&&!Array.isArray(wallet.pity)&&Object.entries(wallet.pity).every(([key,n])=>/^(gold|gems):(card|rune|hero)$/.test(key)&&Number.isInteger(n)&&n>=0&&n<=9);
  const exclusiveOk=wallet?.exclusiveUnlocked===undefined||Array.isArray(wallet.exclusiveUnlocked)&&new Set(wallet.exclusiveUnlocked).size===wallet.exclusiveUnlocked.length&&wallet.exclusiveUnlocked.every(id=>exclusiveIds.includes(id));
  return !!wallet && exclusiveOk && pityOk && (wallet.fragments===undefined||Number.isSafeInteger(wallet.fragments)&&wallet.fragments>=0) && ['gold','gems'].every(key=>Number.isSafeInteger(wallet[key]) && wallet[key]>=0) &&
    Array.isArray(wallet.unlocked) && new Set(wallet.unlocked).size===wallet.unlocked.length &&
    wallet.unlocked.every(id=>capsuleCards.includes(id)) && wallet.levels &&
    typeof wallet.levels==='object' && !Array.isArray(wallet.levels) &&
    Object.values(wallet.levels).every(level=>Number.isInteger(level) && level>=1 && level<=maxLevel) &&
    record(wallet.copies,walletCardIds,Number.MAX_SAFE_INTEGER)&&
    record(wallet.runeCopies,validRunes.filter(id=>id!=='none'),Number.MAX_SAFE_INTEGER)&&record(wallet.runeLevels,validRunes.filter(id=>id!=='none'),maxLevel)&&
    record(wallet.heroCopies,heroIds,Number.MAX_SAFE_INTEGER)&&record(wallet.heroLevels,heroIds,50);
}
export function levelCost(level) { return 45+(level-1)*35; }
export function cardLevel(economy,id) { return economy.levels[id]??1; }
export function victoryPay(firstClear,chapter=1) { return firstClear?{gold:500+chapter*100,gems:12+Math.floor(chapter/10)*2}:{gold:150+chapter*20,gems:2}; }
export function unlockedRunes(clears,wallet) {
  return [...new Set([...fixedRunes(clears,wallet),...validRunes.filter(id=>id!=='none'&&wallet?.runeCopies?.[id]>0)])];
}
function fixedRunes(clears,wallet) {
  return ['wall','heal',...(clears.has(0)?['ward']:[]),...(clears.has(1)?['frost']:[]),...(clears.has(2)?['flame']:[]),...(clears.has(3)?['spark']:[]),
    ...(wallet?.unlocked.length>=3?['tide']:[]),
    ...(Object.values(wallet?.levels??{}).some(level=>level>=3)?['root']:[])];
}
export function improveCard(wallet,id) {
  const level=cardLevel(wallet,id);
  const cost=levelCost(level);
  if(level>=maxLevel || wallet.gold<cost) return null;
  return {...wallet,gold:wallet.gold-cost,levels:{...wallet.levels,[id]:level+1}};
}
