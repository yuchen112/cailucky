const clamp=level=>Math.min(10,Math.max(1,level));
export function heroSkillProfile(id,level=1){
 const n=clamp(level),ratio=n-1,advanced=n>=5,master=n===10;
 const p={level:n,ratio,advanced,master,strike:2+Math.floor((n-1)/3),threshold:n+1,spiritAttack:1+Math.floor((n-1)/3)+Number(master),spiritHealth:n+1+3*Number(master)};
 const shield=ratio?`2 點＋目標最大生命的 ${ratio}% 護盾`:'2 點護盾';
 const heroAmount=ratio?`3 點＋英雄最大生命的 ${ratio}%`:'3 點';
 const healAmount=ratio?`3 點＋其最大生命的 ${ratio}%`:'3 點';
 const power=ratio?`1 點＋當前攻擊的 ${ratio*2}%`:'1 點';
 const descriptions={
  hope:`首次半血且存活時，獲得 ${heroAmount} 護盾。${advanced?'另回復英雄 2 點生命。':''}${master?'再為最虛弱友軍加 2 點護盾。':''}`,
  trust:`首次部署的友軍獲得 ${shield}。${advanced?'下一張部署的友軍再獲得 1 點＋其最大生命 2% 的護盾。':''}${master?'主目標護盾首次受擊破裂且存活時，回復 2 點生命。':''}`,
  growth:`第 2 回合起首次有未就緒手牌時，使一張手牌倒數減 ${master?2:1}${ratio?'，並加其最大生命 '+ratio+'% 的護盾。':'。'}${advanced?'再讓另一張未就緒手牌倒數減 1。':''}`,
  healing:`攻擊開始時，首次治療傷勢最重友軍 ${healAmount}。${advanced?'再治療另一名受傷友軍 1 點＋其最大生命 2%。':''}${master?'主目標另獲得 2 點護盾。':''}`,
  joy:`首次部署第 3 名友軍時，增加其攻擊 ${power}。${advanced?'另一名相鄰友軍攻擊再加 1。':''}${master?'主目標另獲得 1 點＋最大生命 3% 的護盾。':''}`,
  luck:`攻擊開始時，首次對生命不超過 ${p.threshold} 的最虛弱敵軍造成 ${p.strike} 點傷害。${advanced?'若擊退主目標，再對敵方英雄造成 1 點傷害。':''}${master?'另追擊一名符合條件的敵軍，最多追加一次。':''}`,
  memory:`首次友軍退場且原位空出時，留下 ${p.spiritAttack} 攻 ${p.spiritHealth} 血靈體。${advanced?'靈體自帶 1 點護盾。':''}${master?'再為一名相鄰友軍加 2 點護盾。':''}`,
  night:`首次半血且存活時，回復 ${heroAmount} 生命。${advanced?'再替最虛弱的受傷友軍回復 2 點生命。':''}${master?'英雄另獲得 2 點護盾。':''}`,
  sadness:`攻擊開始時，首次替半血以下最虛弱友軍加 ${shield}。${advanced?'主目標另回復 1 點＋最大生命 2% 的生命。':''}${master?'另一名相鄰友軍再獲得 1 點＋最大生命 2% 的護盾。':''}`,
  dream:`第 2 回合起首次有牌可抽時，額外抽 ${advanced?2:1} 張${ratio?'；抽到的牌各獲得最大生命 '+ratio+'% 的護盾。':'。'}${master?'這些牌的倒數再各減 1。':''}`,
 };
 p.detail=descriptions[id]??'';return p;
}
export const scaledHeroAmount=(base,max,ratio)=>base+Math.floor(max*ratio/100);
