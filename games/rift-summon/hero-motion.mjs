export const HERO_FPS=30;
export const HERO_DURATION=3000;
export const HERO_FRAME_COUNT=HERO_DURATION*HERO_FPS/1000;

// Region centers and radii are measured on each original standing sprite.
const movements={
  hope:[[.75,.61,.19,.23,-.027,-.049,-.10],[.53,.38,.27,.21,.012,.017,.035]],
  trust:[[.13,.46,.17,.48,.017,-.04,.08],[.51,.29,.25,.18,0,.018,-.04]],
  growth:[[.20,.59,.17,.31,.026,-.033,-.1],[.50,.31,.28,.23,-.012,.028,-.04]],
  healing:[[.46,.54,.25,.19,0,-.032,0],[.49,.27,.34,.24,.014,.027,.065]],
  joy:[[.21,.52,.23,.23,-.035,-.068,-.21],[.48,.30,.23,.16,0,.014,-.04]],
  luck:[[.60,.52,.20,.18,.026,-.066,.22],[.40,.31,.28,.22,.012,.012,.055]],
  memory:[[.23,.63,.21,.23,.029,-.047,.11],[.50,.32,.29,.20,-.01,.025,-.055]],
  night:[[.15,.56,.23,.33,.036,-.049,.10],[.43,.32,.25,.22,-.012,.023,-.06]],
  sadness:[[.47,.61,.23,.19,.024,-.029,.14],[.53,.36,.28,.22,.013,.023,.044]],
  dream:[[.19,.45,.20,.24,-.022,-.056,-.17],[.46,.29,.28,.22,0,.02,-.04]],
};

const vertexSource=`
attribute vec2 point;
uniform vec4 regions[2];
uniform vec3 motion[2];
varying vec2 uv;
void main(){
  vec2 position=point;
  for(int i=0;i<2;i++){
    vec2 local=point-regions[i].xy;
    vec2 relative=local/regions[i].zw;
    float radius=length(relative);
    float weight=1.0-smoothstep(i==0 ? .20 : .48,1.17,radius);
    float theta=motion[i].z;
    vec2 rotated=vec2(cos(theta)*local.x-sin(theta)*local.y,sin(theta)*local.x+cos(theta)*local.y);
    position+=(motion[i].xy+rotated-local)*weight*(1.0-smoothstep(.81,.98,point.y));
  }
  uv=point;
  gl_Position=vec4(position.x*2.0-1.0,1.0-position.y*2.0,0.0,1.0);
}`;
const fragmentSource=`
precision mediump float;
uniform sampler2D sprite;
varying vec2 uv;
void main(){gl_FragColor=texture2D(sprite,uv);}
`;

function compile(gl,type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function smooth(value){
  const x=Math.max(0,Math.min(1,value));
  return x*x*(3-2*x);
}

export function motionFrame(glCanvas,image,hero){
  const regions=movements[hero];
  const gl=glCanvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl||!regions)return null;
  glCanvas.width=image.naturalWidth;glCanvas.height=image.naturalHeight;
  gl.viewport(0,0,glCanvas.width,glCanvas.height);
  const program=gl.createProgram();
  const shaders=[compile(gl,gl.VERTEX_SHADER,vertexSource),compile(gl,gl.FRAGMENT_SHADER,fragmentSource)];
  for(const shader of shaders)gl.attachShader(program,shader);
  gl.linkProgram(program);
  for(const shader of shaders)gl.deleteShader(shader);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const mesh=[];
  const size=32;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=x/size,b=y/size,c=(x+1)/size,d=(y+1)/size;
    mesh.push(a,b,c,b,a,d,c,b,c,d,a,d);
  }
  const points=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
  const point=gl.getAttribLocation(program,'point');
  gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  gl.uniform4fv(gl.getUniformLocation(program,'regions[0]'),regions.flatMap(row=>row.slice(0,4)));
  const motion=gl.getUniformLocation(program,'motion[0]');
  return {
    paint(frame){
      const t=frame/(HERO_FRAME_COUNT-1);
      const gesture=smooth((t-.15)/.29)*smooth((1-t)/.29);
      const attention=smooth(t/.24)*smooth((1-t)/.34);
      const accent=hero==='joy'?.25*Math.sin(t*19):hero==='trust'?.19*Math.sin(t*13):.09*Math.sin(t*10);
      gl.uniform3fv(motion,regions.flatMap((row,i)=>row.slice(4).map(value=>value*(i?attention*.50:gesture*(1+accent)))));
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,mesh.length/2);
    },
    dispose(){gl.deleteTexture(texture);gl.deleteBuffer(points);gl.deleteProgram(program);},
  };
}
