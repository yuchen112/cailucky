export const DUNGEONS={training:{name:'兵種演練',map:'dawn',description:'完成三波演練，取得可合成高階書的一般兵種訓練書。'},money:{name:'星露運送',map:'forest',description:'守住三波掠奪者，保護星露運送路線。'},mastery:{name:'指揮試煉',map:'moon',description:'守住三波混合敵軍，讓出戰英雄累積指揮經驗。'}};
export function validateDungeon(value){
 if(value==null)return null;
 if(!Object.hasOwn(DUNGEONS,value.type)||!Number.isInteger(value.difficulty)||value.difficulty<1||value.difficulty>3)throw Error('副本設定不正確');
 return {type:value.type,difficulty:value.difficulty};
}
export function dungeonReward(value){const d=validateDungeon(value);return {coins:d.type==='money'?120*d.difficulty:30*d.difficulty,xp:d.type==='mastery'?60*d.difficulty:0,books:d.type==='training'?100*d.difficulty:0};}
export function dungeonWave(d,wave){
 const amount=5+d.difficulty*2+wave*2,types=d.type==='money'?['walker','runner','walker','armored']:['walker','armored','runner'];
 return Array.from({length:amount},(_,i)=>wave===3&&i===amount-1?(d.difficulty===3?({training:'clocklord',money:'emberlord',mastery:'frostlord'})[d.type]:'boss'):d.difficulty>=2&&wave>=2&&i%9===3?'medic':d.difficulty===3&&i%6===4?'shieldling':d.difficulty===3&&i%7===2?'berserker':types[(i+wave)%types.length]);
}
