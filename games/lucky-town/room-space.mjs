export const SCENE={width:1400,height:560},FLOOR={x:152,y:273,w:1096,h:227.5};
export function scenePoint(p,room){return{x:FLOOR.x+(p.x+.5)/room.size*FLOOR.w,y:FLOOR.y+(p.y+.8)/room.size*FLOOR.h};}
export function canvasPoint(canvas,e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)/b.width*SCENE.width,y:(e.clientY-b.top)/b.height*SCENE.height};}
export function floorCell(q,room){return{x:Math.floor((q.x-FLOOR.x)/FLOOR.w*room.size),y:Math.floor((q.y-FLOOR.y)/FLOOR.h*room.size)};}
export function background(ctx,bg,drawWindow,room,image,time,reduced){ctx.clearRect(0,0,1400,560);ctx.drawImage(bg,0,0,1400,560);ctx.save();ctx.scale(7/6,.7);drawWindow(ctx,room,image,time,reduced);ctx.restore();}
