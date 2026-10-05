export function installTouchGuard(root=document){
 const editable=e=>e.target instanceof Element&&!!e.target.closest('input,textarea,[contenteditable=true]');
 root.addEventListener('dblclick',e=>{if(!editable(e))e.preventDefault();},true);
 root.addEventListener('dragstart',e=>{if(e.target instanceof Element&&e.target.closest('img,canvas'))e.preventDefault();});
 root.addEventListener('selectstart',e=>{if(!editable(e))e.preventDefault();});
}
