import {heroSkillProfile} from './hero-skills.mjs?v=hero-50-1';
export const heroes = [
  {id:'hope', name:'曦羽', skill:'曙光庇護', trigger:'danger', effect:'shield', detail:'英雄首次降至半血時，獲得 3 點護盾。'},
  {id:'trust', name:'伯恩', skill:'信約之盾', trigger:'deploy', effect:'armor', detail:'首次部署時，為該角色加 2 點護盾。'},
  {id:'growth', name:'森芽', skill:'新芽甦醒', trigger:'round', effect:'haste', detail:'首次進入第二回合時，讓一張尚未就緒的牌倒數減 1。'},
  {id:'healing', name:'糯糯', skill:'柔光復原', trigger:'attack', effect:'heal', detail:'攻擊開始時，首次替受傷最重的友軍治療 3 點生命。'},
  {id:'joy', name:'朵莉', skill:'彩光登場', trigger:'deploy', effect:'power', detail:'首次部署第 3 名友軍時，讓該角色增加 1 點攻擊。'},
  {id:'luck', name:'鈴可', skill:'幸運追擊', trigger:'attack', effect:'strike', detail:'攻擊開始時，首次對生命不超過 2 的敵方角色造成 2 點傷害。'},
  {id:'memory', name:'緹雅', skill:'回憶之燈', trigger:'death', effect:'summon', detail:'首次有友軍退場且原位空出時，留下 1 攻 2 血靈體。'},
  {id:'night', name:'米洛', skill:'月夜回護', trigger:'danger', effect:'recover', detail:'英雄首次降至半血且仍存活時，回復 3 點生命。'},
  {id:'sadness', name:'汐寧', skill:'雨幕護航', trigger:'attack', effect:'armor', detail:'攻擊開始時，首次替半血以下的友軍加 2 點護盾。'},
  {id:'dream', name:'露緹', skill:'星夢先鋒', trigger:'round', effect:'draw', detail:'首次進入第二回合時，多抽一張牌。'},
];

for(const hero of heroes)hero.detail=heroSkillProfile(hero.id,1).detail;
