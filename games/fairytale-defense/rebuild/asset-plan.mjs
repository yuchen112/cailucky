import {createBattle,ROLES,UNITS,UNIT_BRANCHES,kindsFor} from './core.mjs?v=20261007-names1';
import {CAMPAIGN} from './encounters.mjs?v=20261007-names1';
import {chapterFor,CHAPTERS} from './chapters.mjs?v=20261007-names1';
import {storyMap} from './expedition.mjs?v=20261007-names1';
import {regionFor} from './routes.mjs?v=20261007-names1';
import {ENEMY_IDS,enemyArtAssets} from './enemy-catalog.mjs?v=20261007-names1';
import {EFFECT_ART} from './animation-state.mjs?v=20261007-names1';
import {SPELL_ART} from './motion.mjs?v=20261007-names1';
import {unitArt} from './unit-presentation.mjs?v=20261007-names1';
import {advancedMotionAssets} from './advanced-motion.mjs?v=20261007-names1';
export const COMMON_ART=['button','pad','seed','impact','target','health-track','health-fill','command-podium','dream-core','hero-dais','range','aura-range','support-range','fx-light','fx-spark','fx-rune','fx-petal','fx-clover','thorn-zone','flame-cone',...EFFECT_ART,...['bolt','spore','frost','glow'].map(x=>'projectile-'+x)];
export const heroAssets=id=>[id,id+'-cast',id+'-ready',id+'-victory',...(id==='growth'?['growth-idle']:[]),SPELL_ART[ROLES[id].kind]];
export function evolutionAssets(id){const ids=new Set();for(let level=1;level<=10;level++)for(const branch of UNIT_BRANCHES[id]){const art=unitArt({role:id,level,branch:branch.id});ids.add(art);ids.add('unit-'+id+'-victory');for(const pose of advancedMotionAssets(art))ids.add(pose);}return [...ids];}
export function battleAssets(s){const region=regionFor(s),enemyKinds=s.mode==='endless'?ENEMY_IDS:[...new Set(Array.from({length:s.maxWaves},(_,i)=>kindsFor(s,i+1)).flat())];return [...new Set([...COMMON_ART,...enemyKinds.flatMap(enemyArtAssets),...s.loadout.flatMap(evolutionAssets),...s.loadout.map(x=>SPELL_ART[UNITS[x].kind]),...heroAssets(s.hero.role),'weapon-'+s.hero.role,region==='forest'?'road':'road-'+region,region==='forest'?'meadow':region==='moon'?'meadow-moon':region==='ruins'?'meadow-ruins-ui':'meadow-dawn'].filter(Boolean))];}
export function chapterAssets(s,chapter=chapterFor(s.stage)){const ids=new Set();for(let stage=chapter.first;stage<=chapter.last;stage++){const draft=createBattle({hero:s.hero.role,loadout:s.loadout,stage,map:storyMap(stage)});for(const id of battleAssets(draft))ids.add(id);}return [...ids];}
export function activeUnitAssets(s){const units=[...s.loadout.map(role=>({role,level:1,branch:null})),...s.towers];return [...new Set(units.flatMap(t=>{const id=unitArt(t);return [id,'unit-'+t.role+'-victory',...advancedMotionAssets(id)];}))];}
export function sessionAssets(s){const units=new Set(s.loadout.flatMap(evolutionAssets));return battleAssets(s).filter(id=>!units.has(id)||activeUnitAssets(s).includes(id));}
export function upcomingUnitAssets(s){return [...new Set(s.towers.filter(t=>t.level<10).flatMap(t=>(t.level===2?UNIT_BRANCHES[t.role].map(b=>b.id):[t.branch]).flatMap(branch=>{const id=unitArt({...t,level:t.level+1,branch});return [id,...advancedMotionAssets(id)];})))];}
export function followingChapter(s){if(s.mode!=='campaign'||s.dungeon)return null;const current=chapterFor(s.stage);return CHAPTERS.find(x=>x.number===current.number+1)||null;}
