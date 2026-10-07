import {BY_ID} from './data.mjs?v=20261007-names1';
const SURFACES=['table','desk','cabinet','shelf','vanity'];
const SMALL=['tea','flower','toy-bear','clock','basket','plant'];
export function size(p){const i=BY_ID[p.item];return {w:i.w,h:i.h}}
export function supports(base,item){return (SURFACES.includes(base)||BY_ID[base]?.category==='surface')&&(SMALL.includes(item)||BY_ID[item]?.category==='small')||(['bed','sofa','chair','ottoman','stool'].includes(base)||['bed','seat'].includes(BY_ID[base]?.category))&&(['cushion','pillow','toy-bear'].includes(item)||BY_ID[item]?.category==='cushion')}
export function canPlace(room,p,ignore=p.uid){if(p.onTop){const parent=room.items.find(x=>x.uid===p.onTop);return !!parent&&!parent.onTop&&supports(parent.item,p.item)&&parent.x===p.x&&parent.y===p.y&&!room.items.some(x=>x.uid!==ignore&&x.onTop===p.onTop)}const {w,h}=size(p);return p.x>=0&&p.y>=0&&p.x+w<=room.size&&p.y+h<=room.size&&!room.items.some(q=>{if(q.uid===ignore||q.onTop)return false;const b=size(q);return p.x<q.x+b.w&&p.x+w>q.x&&p.y<q.y+b.h&&p.y+h>q.y})}
export function move(room,p,next){Object.assign(p,next);if(!next.onTop)delete p.onTop;if(!next.onTop)delete p.onTop;for(const child of room.items.filter(x=>x.onTop===p.uid)){child.x=p.x;child.y=p.y}}
