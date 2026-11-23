import {cards} from './card-data.mjs?v=rift99-1';
export const combatVersion=2;
export const heroHP=level=>60+6*Math.max(1,Math.min(50,level));
export const skillScale=effect=>.7+.06*Math.max(1,Math.min(10,effect));
const roleFor={護衛:'tank',護盾:'barrier',守蔭:'support',治療:'healer',援護:'medic',追獵:'hunter',橫掃:'sweeper',破甲:'breaker',猛進:'charger',戰吼:'leader',亡靈接替:'revenant',自爆:'bomber','':'fighter'};
const traits={
 counter:['guard','yak','tortoise','capyguard','rampart','tiger'],
 regen:['turtle','stag','koala','bearhoney','hamster','beaver'],
 leech:['bat','wolf','fang','raven','mooncub','sablescout'],
 burn:['ember','crab','yakfire','redpanda','phoenix','humanlamp'],
 poison:['gecko','hedgehog','frog','lizard','dragonfly','octopus'],
 frost:['seal','snowstoat','snowfox','frostelk','humansnow'],
 cleanse:['healer','crane','swan','lotusmouse','catwitch','goatmonk'],
 rally:['flag','lion','eagle','mousebard','sparrow','humanstar'],
 mend:['hare','panda','robin','bunnychef','axolotl','ottermage'],
 pierce:['bow','ibis','badger','puffin','catduelist','humanclock'],
 haste:['falcon','ferret','stork','squirrel','humanwind','owlclock'],
 avenge:['ghost','rabbit','koi','raccoon','crowchap','humanbook'],
 ward:['knight','otter','boar','lynxguard','badgerforge','seahorse','dogpaladin','humanshield'],
 oracle:['wisp','moth','moon','firefly','peacock','pandaoracle','foxscribe','humanmoon','humansea','whalecub'],
 cleave:['ax','ram','drake','wyvern','deerknight','griffin','humanrose','foxranger','lynx','kitsune','fennec'],
};
export const specialNames={my01:'雷翼天威',my02:'瑞麟聖域',my03:'浴火重生',my04:'永冬龍息',my05:'月泉淨化',my06:'九首再生',my07:'星翼疾行',my08:'深海纏縛',my09:'銜尾輪迴',my10:'獅鷲戰歌',an01:'不腐殭身',an02:'紅轎血契',an03:'紙偶替身',an04:'鏡影竊術',an05:'迷燈禁療',an06:'無首追斬',an07:'月下獸化',an08:'血爵夜宴',an09:'報喪緘默',an10:'稻影詛咒',dv01:'天后護航',dv02:'慈航蓮生',dv03:'武聖決鬥',dv04:'蓮火連擊',dv05:'天眼破妄',dv06:'五彩補天',dv07:'雷霆連鎖',dv08:'智盾反擊',dv09:'冥途裁衡',dv10:'日輪聖照',al01:'晶殼適應',al02:'獵肢雙斬',al03:'孢雲脈動',al04:'磁核力場',al05:'稜鏡反射',al06:'重力囚籠',al07:'霜脈寄生',al08:'熔巢孵化',al09:'時隙往返',al10:'虹膜標記'};
export const profiles=Object.fromEntries(Object.entries(cards).map(([id,row])=>{
 const role=roleFor[row[4]]??'fighter',trait=Object.entries(traits).find(([,ids])=>ids.includes(id))?.[0]??'focus';
 return [id,{role,trait,special:specialNames[id]?id:null,name:specialNames[id]??{counter:'堅守反擊',regen:'自然再生',leech:'汲取追擊',burn:'灼熱攻勢',poison:'荊毒侵蝕',frost:'霜痕累積',cleanse:'淨化庇護',rally:'戰線鼓舞',mend:'持續照護',pierce:'穿盾射擊',haste:'前線加速',avenge:'亡者契約',ward:'接續屏障',oracle:'星光祝禱',cleave:'破陣追擊',focus:'專注作戰'}[trait]}];
}));
export function cardStats(id,level=1,effect=1){
 const row=cards[id],p=profiles[id];const attack=row[2]+Math.floor((level-1)*.23),growth=Math.ceil((level-1)*1.15);
 const max=row[3]+Math.ceil((level-1)*(p.role==='tank'?1.44:p.role==='healer'?1.1:1.15));
 return {attack,max,count:row[1],shield:row[4]==='護盾'?Math.round(max*(.1+.01*effect)):0};
}
const percent=n=>Math.round(n*100)+'%';
const specialText={
 my01:'普攻施加雷印；同一目標累積三層後，雷擊最多三名敵軍（各 70% 攻擊）。每三回合降雨，清除友軍燃燒。',
 my02:'存活時相鄰友軍受到的傷害降低 20%；每兩回合回復相鄰友軍最大生命的 15%。同類光環不疊加。',
 my03:'首次陣亡化為可擊破的鳳凰卵（本體最大生命 30%）；經過兩次己方回合開始後，以 60% 生命重生。重生次數與能力冷卻不重置。',
 my04:'普攻累積寒霜，每層降低目標攻擊 10%；三層凍結一次出手。解凍後免疫凍結兩回合。',
 my05:'每兩回合治療生命比例最低的兩名友軍（各最大生命 22%），清除負面狀態並獲得一回合控制免疫。',
 my06:'九首隨剩餘生命變化；每回合回復最大生命 10%，普攻追擊最多兩名敵軍，各造成目前攻擊 25%～50% 傷害。',
 my07:'每兩回合讓一張未就緒手牌倒數減一；每第三次受到普攻時閃避該次攻擊。技能傷害不能閃避。',
 my08:'部署召喚兩條觸手（本體攻擊 45%、生命 35%）；觸手存活時正對敵軍攻擊降低 20%，擊破觸手即可解除。',
 my09:'依序進入攻勢、守勢、回生三種姿態：攻擊提高 30%、獲得最大生命 20% 護盾、回復最大生命 20%，每回合輪換。',
 my10:'部署庇護前兩名友軍；擊殺敵軍後鼓舞全隊，兩回合內攻擊提高 15%，不無限疊加。',
 an01:'首次陣亡後以 35% 生命復活；受到的治療降低 25%，復活不刷新能力。',
 an02:'普攻吸取實際生命傷害的 40%；每三回合使最後方敵軍攻擊降低 20%，持續兩回合。',
 an03:'部署召喚一個紙偶（本體攻擊 35%、生命 45%），紙偶替相鄰友軍減傷 15%，自身不能再召喚。',
 an04:'每兩回合移除敵軍護盾，將移除量的一半轉為自身護盾；普攻優先攻擊最虛弱目標。',
 an05:'普攻附加兩回合燃燒；每三回合對燃燒目標施加一回合禁療。',
 an06:'每兩回合追斬生命低於 30% 的敵軍，造成 160% 攻擊；頭目不受斬殺加成。',
 an07:'首次低於半血時獸化：回復最大生命 20%，本場普攻吸血提高至 45%。',
 an08:'普攻吸取實際生命傷害 50%；吸取量的 20% 同時治療己方英雄。',
 an09:'每三回合沉默攻擊最高的敵軍一回合，阻止其主動能力，仍可普攻；解控後短暫免疫。',
 an10:'陣亡時詛咒最多三名敵軍，施加三回合中毒與兩回合 20% 治療削減。',
 dv01:'存活時己方英雄受到的直擊傷害降低 25%；本場首次英雄受到致命傷害時，護航使其保留最大生命 15%，同類免死每方最多一次。',
 dv02:'每兩回合治療並淨化最多三名友軍；每場一次讓最早陣亡的非召喚友軍以 40% 生命復活。',
 dv03:'挑戰攻擊最高的敵軍，普攻優先與其決鬥；擊殺後獲得最大生命 25% 護盾。',
 dv04:'每兩回合對正面目標連擊兩次，各造成 70% 攻擊，並附加蓮火燃燒。',
 dv05:'普攻穿透一半護盾；每兩回合清除目標護盾及暫時強化。',
 dv06:'友軍受傷時每回合最多累積一顆五色石；滿五顆回復英雄最大生命 15%、全隊最大生命 20%，每場最多兩次。',
 dv07:'每兩回合連鎖雷擊最多三名敵軍，各造成 75% 攻擊；先移除目標護盾的 25%。',
 dv08:'存活時相鄰友軍減傷 20%；自身受到普攻且存活時反擊，傷害為自身攻擊 30%，反擊不再觸發反擊。',
 dv09:'對生命低於 15% 的一般敵軍施加一次裁決；每場最多兩次，頭目改為受到 120% 攻擊傷害。',
 dv10:'每回合日照治療全體友軍最大生命 8%；每三回合清除全隊負面狀態並灼燒敵軍。',
 al01:'每回合第一次受到普攻時生成最大生命 12% 護盾；同回合不重複生成。',
 al02:'普攻改為兩次 65% 攻擊的斬擊，第二擊穿透一半護盾。',
 al03:'每兩回合孢雲治療全隊最大生命 12%，並對一名敵軍施加中毒。',
 al04:'存活時正對敵軍攻擊降低 15%；每兩回合為自己補充最大生命 20% 護盾。',
 al05:'受到技能傷害且存活時反射實際傷害的 25%；反射、反擊、持續傷害不能再次觸發反射。',
 al06:'每三回合延遲敵方一張手牌一回合，並對場上敵軍造成 40% 攻擊傷害。',
 al07:'普攻附加三回合中毒；中毒目標受到的治療降低 20%。',
 al08:'陣亡孵化兩個幼體（本體攻擊 40%、生命 30%），幼體無法再次孵化。',
 al09:'奇數回合加速己方一張手牌；偶數回合延遲敵方一張手牌，最多每回合一次。',
 al10:'每兩回合標記生命最低敵軍兩回合，使其受到傷害提高 20%；標記不疊加。',
};
export function cardDescription(id,level=1,effect=1){
 const p=profiles[id],s=cardStats(id,level,effect),scale=skillScale(effect);
 const main={tank:'存活時相鄰友軍普攻減傷 '+percent(.12+effect*.008)+'。',barrier:`部署護盾 ${s.shield}；每三回合補充自身最大生命 ${percent(.1+.005*effect)} 護盾。`,support:'每兩回合為一名相鄰友軍施加其最大生命 '+percent(.12*scale)+' 護盾。',healer:'每回合治療最虛弱友軍：自身攻擊 '+percent(scale)+'＋目標最大生命 6%。',medic:'每回合治療相鄰受傷友軍各最大生命 '+percent(.1*scale)+'。',hunter:'普攻優先攻擊生命比例最低敵軍，對半血目標傷害提高 '+percent(.1+.01*effect)+'。',sweeper:'普攻同時橫掃相鄰敵軍，各造成自身攻擊 '+percent(.3+.02*effect)+'。',breaker:'普攻前移除目標護盾，最多為自身攻擊 '+percent(scale)+'；普攻穿透 25% 護盾。',charger:'部署後首次普攻傷害提高 '+percent(.3+.03*effect)+'，攻擊比自己血量高的目標時提高 '+percent(.1+.01*effect)+'。',leader:'每三回合鼓舞前兩名友軍，攻擊提高 '+percent(.1+.01*effect)+'，持續兩回合；普攻命中敵軍時追加自身攻擊 12% 的英雄傷害。',revenant:`首次退場留下英靈：繼承本體等級、${Math.round((.5+.01*effect)*100)}% 攻擊與 ${Math.round((.4+.01*effect)*100)}% 最大生命；英靈不能再次接替。`,bomber:'陣亡時爆破正面及相鄰敵軍，造成自身攻擊 '+percent(.9*scale)+' 傷害。',fighter:'專注正面作戰；每第二次普攻傷害提高 '+percent(.15+.015*effect)+'。'}[p.role];
 const trait={counter:'受普攻且存活時，反擊自身攻擊 25%，每回合一次。',regen:'每回合回復自身最大生命 8%。',leech:'普攻吸血 30%，只計實際生命傷害。',burn:'普攻附加兩回合燃燒，每次為施術者攻擊 '+percent(.35*scale)+'。',poison:'普攻附加三回合中毒，每層每次為目標最大生命 3%，最多三層。',frost:'每兩回合施加寒霜，三層凍結一次出手；解凍後兩回合免疫。',cleanse:'每三回合淨化一名受傷友軍，清除燃燒、中毒、沉默及禁療。',rally:'部署時為一名友軍加最大生命 10% 護盾。',mend:'每兩回合額外照護一名友軍，回復最大生命 10%。',pierce:'普攻額外穿透 25% 護盾。',haste:'部署時使一張未就緒手牌倒數減一。',avenge:'每三回合回復己方英雄最大生命 3%。',ward:'部署後第一名相鄰友軍獲得最大生命 12% 護盾。',oracle:'每三回合治療己方英雄最大生命 4%。',cleave:'每第三次普攻額外追擊正面敵軍，造成 35% 攻擊。',focus:'每第三次普攻傷害提高 20%。'}[p.trait];
 return p.special?`${id==='my03'?'':main} ${p.name}｜${id==='my03'?specialText[id].replace('30%',Math.round((.2+.01*effect)*100)+'%').replace('60%',Math.round((.4+.02*effect)*100)+'%'):specialText[id]}`:`${main} ${p.name}｜${trait}`;
}
export const specialDescription=id=>specialText[id]??'';
