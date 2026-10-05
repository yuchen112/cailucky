// Descriptions consume the same resolved combat stats; never separate balancing constants.
export function upgradeDetails(a,b){
 const fields=[['splash','波及半徑',''],['bounces','額外連鎖目標',' 名'],['poison','每層持續傷害','／秒'],['zoneRadius','區域半徑',''],['zoneDamage','區域基礎傷害','／秒'],['blockCapacity','阻擋上限',' 名'],['blockStamina','每波阻擋預算',' 敵秒'],['heal','波次恢復',' 生命']];
 const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(2);
 const lines=fields.filter(([k])=>(a[k]||b[k])&&a[k]!==b[k]).map(([k,label,unit])=>`${label} ${fmt(a[k]||0)} → ${fmt(b[k]||0)}${unit}`);
 if(a.aura!==b.aura&&(a.aura||b.aura))lines.push(`傷害光環 +${Math.round(((a.aura||1)-1)*100)}% → +${Math.round(((b.aura||1)-1)*100)}%`);
 if(a.haste!==b.haste)lines.push(`光環攻擊間隔 ×${fmt(a.haste||1)} → ×${fmt(b.haste||1)}`);
 if(a.pierce!==b.pierce)lines.push(b.pierce?'新增：無視護甲':'不再無視護甲');
 if(a.rootEvery!==b.rootEvery||a.rootDuration!==b.rootDuration)lines.push(b.rootEvery?`定身：每 ${b.rootEvery} 擊 ${fmt(b.rootDuration)} 秒`:'取消定身');
 return lines;
}
