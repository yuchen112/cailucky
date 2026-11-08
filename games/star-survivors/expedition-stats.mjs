
const value=(state,key)=>Math.max(0,Number(state[key])||0);
export function rolePerformance(game){
 const s=game.roleState||{};
 if(!Number.isFinite(s.statsStart))return {partial:true,rows:[]};
 const row=(label,key,unit='')=>({label,value:value(s,key),unit});
 const specific={
 joy:[row('節拍生效時間','rhythmSeconds','秒'),{label:'最高節拍冷卻縮減',value:Math.min(.24,value(s,'peakRhythm')*.012)*(1+game.traitLevel*.1)*100,unit:'%'}],
 dream:[row('星願強化施法','empoweredCasts','次'),row('天賦額外有效傷害','traitDamage')],
 night:[row('凝月連擊命中','focusHits','次'),row('天賦額外有效傷害','traitDamage')],
 sadness:[row('成功冰凍','freezes','次'),row('追加冰凍時間','freezeSeconds','秒')],
 trust:[row('天賦成功抵擋','blocks','次'),row('天賦抵擋傷害','blockedDamage'),row('護盾實際吸收','shieldAbsorbed')],
 memory:[row('昨日回聲觸發','replays','次'),row('培育追加有效傷害','traitDamage')],
 growth:[row('召喚攻擊','summonAttacks','次'),row('召喚有效傷害','summonDamage'),row('共生與號令追加傷害','traitDamage')],
 healing:[row('有效治療','healing'),row('有效獲得護盾','shieldGranted'),row('護盾實際吸收','shieldAbsorbed'),row('花瓣強化追加傷害','traitDamage')],
 luck:[row('幸運強擊施法','luckyCasts','次'),row('強擊追加有效傷害','traitDamage')],
 hope:[row('破曉印記命中','markHits','次'),row('破甲與印記追加傷害','traitDamage')]
 };
 return {partial:s.statsStart>1,rows:[...(specific[game.roleId]||[]),row('主動技能使用','actives','次')]};
}
