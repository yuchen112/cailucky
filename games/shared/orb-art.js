// Draw the complete individual image. Geometry compensates transparent margins;
// neither source rectangles nor image cropping are used.
(function(root){
 function bounds(meta,cx,cy,radius){
  const scale=radius/meta.radius;
  return {x:cx-meta.cx*scale,y:cy-meta.cy*scale,width:scale,height:scale};
 }
 function draw(ctx,image,meta,cx,cy,radius){
  if(!image?.naturalWidth)return;
  const b=bounds(meta,cx,cy,radius);ctx.drawImage(image,b.x,b.y,b.width,b.height);
 }
 const api={bounds,draw};if(typeof module!=='undefined')module.exports=api;else root.CxQOrbArt=api;
})(globalThis);
