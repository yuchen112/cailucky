export const capsuleCards=['ember','wisp','turtle','raven','stag','lynx','moth','drake','ibis','hare','otter','ram','bat','beetle','crane','yak'];
export const prices={gems:12};
export const maxLevel=5;
export const validRunes=['wall','heal','frost','spark','ward','flame','tide','root','none'];

export function startingWallet() {
  return {gold:80,gems:12,unlocked:[],levels:{}};
}
export function validWallet(wallet) {
  return !!wallet && ['gold','gems'].every(key=>Number.isSafeInteger(wallet[key]) && wallet[key]>=0) &&
    Array.isArray(wallet.unlocked) && new Set(wallet.unlocked).size===wallet.unlocked.length &&
    wallet.unlocked.every(id=>capsuleCards.includes(id)) && wallet.levels &&
    typeof wallet.levels==='object' && !Array.isArray(wallet.levels) &&
    Object.values(wallet.levels).every(level=>Number.isInteger(level) && level>=1 && level<=maxLevel);
}
export function levelCost(level) { return 45+(level-1)*35; }
export function cardLevel(economy,id) { return economy.levels[id]??1; }
export function victoryPay(firstClear) { return firstClear?{gold:100,gems:12}:{gold:30,gems:2}; }
export function unlockedRunes(clears,wallet) {
  return ['wall','heal',...(clears.has(0)?['ward']:[]),...(clears.has(1)?['frost']:[]),...(clears.has(2)?['flame']:[]),...(clears.has(3)?['spark']:[]),
    ...(wallet?.unlocked.length>=3?['tide']:[]),
    ...(Object.values(wallet?.levels??{}).some(level=>level>=3)?['root']:[])];
}
export function openCapsule(wallet,currency,roll=Math.random()) {
  if (!Object.hasOwn(prices,currency) || wallet[currency]<prices[currency] || roll<0 || roll>=1) return null;
  const candidates=capsuleCards.filter(id=>!wallet.unlocked.includes(id));
  const pool=candidates.length?candidates:capsuleCards;
  const id=pool[Math.floor(roll*pool.length)];
  const duplicate=wallet.unlocked.includes(id);
  const refund=duplicate?40:0;
  const next={...wallet,[currency]:wallet[currency]-prices[currency],unlocked:duplicate?wallet.unlocked:[...wallet.unlocked,id]};
  next.gold+=refund;
  return {id,duplicate,refund,wallet:next};
}
export function improveCard(wallet,id) {
  const level=cardLevel(wallet,id);
  const cost=levelCost(level);
  if(level>=maxLevel || wallet.gold<cost) return null;
  return {...wallet,gold:wallet.gold-cost,levels:{...wallet.levels,[id]:level+1}};
}
