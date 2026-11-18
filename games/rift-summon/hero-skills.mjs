import {skillScale} from './combat-rules.mjs?v=combat-4';
export function heroSkillProfile(id,level=1){
 const n=Math.max(1,Math.min(10,level)),cooldown=n>=10?2:3,scale=skillScale(n),pct=x=>Math.round(x*scale*100)+'%';
 const descriptions={hope:`英雄低於 65% 生命時，獲得最大生命 ${pct(.12)} 護盾。英雄護盾最多為最大生命 30%。`,trust:`為最虛弱友軍施加其最大生命 ${pct(.16)} 護盾。${n>=5?'另回復該友軍最大生命 6%。':''}`,growth:`讓未就緒手牌倒數減一，依序加速 ${n>=5?2:1} 次；無符合手牌時不進入冷卻。`,healing:`治療生命比例最低的 ${n>=5?2:1} 名友軍，各回復最大生命 ${pct(.2)}。`,joy:`至少兩名友軍時，鼓舞前 ${n>=5?3:2} 名友軍，攻擊提高 ${10+n}%，持續兩回合，同類不疊加。`,luck:`對生命最低的敵軍造成己方場上平均基礎攻擊 ${pct(.6)} 傷害；目標低於 35% 生命時提高為 ${pct(1.2)}。`,memory:`將最早陣亡的非召喚友軍轉為英靈，繼承其等級、${Math.round((.5+.02*n)*100)}% 攻擊與 ${Math.round((.35+.015*n)*100)}% 生命；本場最多兩次，英靈不能再次接替。`,night:`英雄低於 65% 生命時，回復最大生命 ${pct(.13)} 生命。`,sadness:`至少一名友軍低於或等於半血時，為最虛弱的 ${n>=5?2:1} 名受傷友軍施加最大生命 ${pct(.14)} 護盾。${n>=5?'另清除其燃燒與中毒。':''}`,dream:`從牌庫額外抽一張牌，該牌倒數減 ${n>=5?2:1}；手牌五張以上時不發動。`};
 return {level:n,cooldown,advanced:n>=5,master:n===10,detail:(descriptions[id]??'')+` 冷卻 ${cooldown} 回合；符合條件可再次發動。`};
}
export const scaledHeroAmount=(base,max,ratio)=>Math.round(base+max*ratio/100);
