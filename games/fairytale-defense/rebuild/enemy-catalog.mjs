// Authoritative enemy identities shared by combat, intel and save validation.
export const ENEMY_CATALOG=Object.freeze({
 walker:{name:'橡果掠兵',hp:66,speed:33,armor:0,reward:12,leak:1,tip:'普通地面敵人；用穩定火力守住道路。'},
 runner:{name:'疾走葉兔',hp:48,speed:55,armor:0,reward:14,leak:1,tip:'移動快；在轉彎處配置緩速與後段火力。'},
 armored:{name:'橡殼岩龜',hp:125,speed:25,armor:.45,reward:20,leak:2,tip:'45% 護甲；搭配破甲或無視護甲攻擊。'},
 moth:{name:'夜翼飛蛾',hp:52,speed:44,armor:0,reward:16,leak:1,air:true,tip:'飛行，免疫地面區域與阻擋；對空部隊和英雄可攻擊。'},
 shieldling:{name:'晶盾芽衛',hp:155,speed:27,armor:.2,reward:24,leak:2,ability:'shield',tip:'生命首次低於一半時，護甲額外增加 25 個百分點、持續 4 秒；穿甲可反制。'},
 medic:{name:'花燈蝶醫',hp:92,speed:31,armor:0,reward:24,leak:1,air:true,ability:'heal',tip:'每 6 秒為半徑 90 內其他敵人恢復最大生命的 10%；先用對空集火處理。'},
 berserker:{name:'赤葉野豬',hp:185,speed:29,armor:.1,reward:26,leak:2,ability:'rage',tip:'生命低於一半後移速提高 60%；注意後段攔截。'},
 boss:{name:'森冠野豬王',hp:580,speed:21,armor:.2,reward:90,leak:5,boss:true,ability:'ward',tip:'登場 5 秒後預警 1.2 秒，為半徑 100 內敵人增加 25 個百分點護甲、持續 3 秒；之後每 8 秒再施放。'},
 frostlord:{name:'霜冠鹿王',hp:720,speed:20,armor:.15,reward:110,leak:5,boss:true,ability:'chill',tip:'預警 1.2 秒後，使半徑 120 內部隊攻擊間隔增加 30%、持續 4 秒；分散火力或定身打斷。'},
 emberlord:{name:'燈焰龍王',hp:680,speed:24,armor:.2,reward:115,leak:5,boss:true,ability:'summon',tip:'預警 1.2 秒後召喚兩隻赤葉野豬；召喚物也必須消滅才完成波次。定身可打斷蓄力。'},
 clocklord:{name:'發條巨像',hp:850,speed:18,armor:.35,reward:130,leak:6,boss:true,ability:'haste',tip:'預警 1.2 秒後讓半徑 110 內其他敵人加速 35%、持續 4 秒；自身重甲，需穿甲與控場。'}
});
export const isBoss=kind=>ENEMY_CATALOG[kind]?.boss===true;
export const ENEMY_IDS=Object.freeze(Object.keys(ENEMY_CATALOG));
export function enemyArtAssets(kind){return isBoss(kind)?[kind,kind+'-ready',kind+'-cast']:[kind,kind+'-step'];}
export function tickEnemyAbility(s,e,point,emit,spawn,padPoints=[]){
 const ability=ENEMY_CATALOG[e.kind]?.ability;if(!ability)return;
 if(ability==='rage'){if(e.hp<e.maxHp*.5&&!e.enraged){e.enraged=true;e.speed*=1.6;emit('enemy-rage',{enemyId:e.id,...point(e.distance,s,e.route)});}return;}
 if(ability==='shield'){if(e.hp<e.maxHp*.5&&!e.shieldUsed){e.shieldUsed=true;e.wardUntil=s.time+4;emit('enemy-shield',{enemyId:e.id,...point(e.distance,s,e.route)});}return;}
 e.nextSkill??=s.time+(ability==='heal'?6:5);if(e.rootUntil>s.time){if(e.castUntil){e.castUntil=0;e.nextSkill=s.time+6;emit('cast-interrupted',{enemyId:e.id,...point(e.distance,s,e.route)});}return;}
 if(ability==='heal'){if(s.time>=e.nextSkill){const p=point(e.distance,s,e.route);for(const other of s.enemies)if(other!==e&&other.hp>0&&Math.hypot(point(other.distance,s,other.route).x-p.x,point(other.distance,s,other.route).y-p.y)<=90)other.hp=Math.min(other.maxHp,other.hp+other.maxHp*.1);e.nextSkill=s.time+6;emit('enemy-heal',{enemyId:e.id,...p});}return;}
 if(e.castUntil&&s.time>=e.castUntil){const p=point(e.distance,s,e.route);if(ability==='ward')for(const ally of s.enemies)if(ally.hp>0&&Math.hypot(point(ally.distance,s,ally.route).x-p.x,point(ally.distance,s,ally.route).y-p.y)<=100)ally.wardUntil=s.time+3;
 if(ability==='chill')for(const t of s.towers){const at=padPoints[t.pad];if(at&&Math.hypot(at.x-p.x,at.y-p.y)<=120)t.chillUntil=s.time+4;}
 if(ability==='summon'&&s.enemies.length<100)for(let i=0;i<2;i++)spawn({kind:'berserker',route:e.route,distance:Math.max(0,e.distance-18-i*22)});
 if(ability==='haste')for(const ally of s.enemies)if(ally!==e&&ally.hp>0&&Math.hypot(point(ally.distance,s,ally.route).x-p.x,point(ally.distance,s,ally.route).y-p.y)<=110)ally.hasteUntil=s.time+4;
 emit('boss-ward',{enemyId:e.id,kind:e.kind,ability,...p});e.castUntil=0;e.nextSkill=s.time+8;
 }else if(!e.castUntil&&s.time>=e.nextSkill){e.castUntil=s.time+1.2;emit('boss-warning',{enemyId:e.id,kind:e.kind,ability,...point(e.distance,s,e.route)});}
}
