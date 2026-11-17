const PHOTO={
  width:378,height:550,
  arm:[[0,235],[52,220],[73,238],[82,282],[95,309],[99,339],[92,365],[75,386],[47,399],[13,385],[1,359],[5,309],[0,285]],
  prop:null,pivot:[83,329],
  under:[[27,362],[54,348],[94,347],[91,375],[75,404],[33,411]],
  donor:36,
  angles:[0,-4,20,24,22,14,-3,0],
  shift:[0,1,-4,-8,-7,-4,1,0],
};
const LANTERN={
  width:468,height:517,
  arm:[[0,194],[65,196],[86,211],[101,229],[123,251],[125,273],[113,293],[98,322],[73,339],[51,384],[0,392]],
  prop:[[0,226],[41,226],[54,227],[59,239],[53,254],[61,270],[56,290],[91,313],[95,347],[84,369],[62,384],[0,390]],
  pivot:[102,280],propPivot:[47,228],
  under:[[66,283],[99,271],[129,267],[120,326],[91,385],[56,393]],
  donor:58,
  angles:[0,-6,27,33,26,15,-3,0],
  shift:[0,2,-10,-15,-10,-7,1,0],
  swing:[0,0,-9,13,-8,4,-2,0],
};
const rigs={memory:PHOTO,night:LANTERN};
const beats=[0,.16,.35,.47,.60,.73,.91,1];

function path(ctx,polygon){
  ctx.beginPath();
  polygon.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.closePath();
}
function sample(values,t){
  const i=beats.findIndex(value=>value>=t);
  if(i<=0)return values[i===0?0:values.length-1];
  const fraction=(t-beats[i-1])/(beats[i]-beats[i-1]);
  const amount=fraction*fraction*(3-2*fraction);
  return values[i-1]+(values[i]-values[i-1])*amount;
}
function layer(image,rig,include,exclude){
  const surface=document.createElement('canvas');
  surface.width=image.naturalWidth;surface.height=image.naturalHeight;
  const ctx=surface.getContext('2d');
  ctx.scale(surface.width/rig.width,surface.height/rig.height);
  if(include){path(ctx,include);ctx.clip();}
  ctx.drawImage(image,0,0,rig.width,rig.height);
  if(exclude.length){ctx.globalCompositeOperation='destination-out';for(const polygon of exclude){path(ctx,polygon);ctx.fill();}}
  return surface;
}

export function articulatedMotion(canvas,image,hero,frameCount){
  const rig=rigs[hero];
  if(!rig)return null;
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  const torso=layer(image,rig,null,rig.prop?[rig.arm,rig.prop]:[rig.arm]);
  const arm=layer(image,rig,rig.arm,rig.prop?[rig.prop]:[]);
  const prop=rig.prop?layer(image,rig,rig.prop,[]):null;
  const backing=torso.getContext('2d');
  backing.save();backing.globalCompositeOperation='destination-over';
  path(backing,rig.under);backing.clip();
  backing.drawImage(image,-rig.donor,0,rig.width,rig.height);backing.restore();
  const radians=Math.PI/180;
  const draw=asset=>ctx.drawImage(asset,0,0,rig.width,rig.height);
  return {
    paint(frame){
      const t=frame/(frameCount-1);
      ctx.setTransform(canvas.width/rig.width,0,0,canvas.height/rig.height,0,0);
      ctx.clearRect(0,0,rig.width,rig.height);
      if(t===0||t===1){draw(image);return;}
      const angle=sample(rig.angles,t)*radians;
      const dy=sample(rig.shift,t);
      draw(torso);
      ctx.save();
      ctx.translate(rig.pivot[0],rig.pivot[1]+dy);
      ctx.rotate(angle);
      ctx.translate(-rig.pivot[0],-rig.pivot[1]);
      draw(arm);
      if(prop){
        const [x,y]=rig.propPivot;
        ctx.translate(x,y);
        ctx.rotate(sample(rig.swing,t)*radians-angle*.75);
        ctx.translate(-x,-y);
        draw(prop);
      }
      ctx.restore();
    },
    dispose(){},
  };
}
