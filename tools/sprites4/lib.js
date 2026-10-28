/* Aurevia v4 sprite toolkit — original procedural "hand-painted" chibi sprites (Canvas2D, supersampled).
   Every shape is a polygon (splines/ellipses sampled), drawn as: dark outline -> radial-shaded fill -> inner bevel crescents -> highlight.
   No external / official art is read or traced. */
const SS=4;                      // supersample
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, sm=t=>t*t*(3-2*t);
function rgb(c){if(Array.isArray(c))return c;c=c.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]}
function mixc(a,b,t){a=rgb(a);b=rgb(b);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function css(c,a){c=rgb(c);return a==null||a>=1?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`}
const INK=[38,26,58];
const lit=(c,t=.4)=>mixc(mixc(c,[255,248,226],t),[255,255,255],0);
const dk=(c,t=.42)=>mixc(c,[52,36,104],t);
const olc=(c,t=.8)=>mixc(c,INK,t);
let cx;                          // current 2D context (already scaled by SS and translated to cell origin)
function setCtx(c){cx=c}
// ---------- geometry ----------
function ell(x,y,rx,ry,rot=0,n=44){const o=[],cr=Math.cos(rot),sr=Math.sin(rot);for(let i=0;i<n;i++){const a=i/n*TAU,px=Math.cos(a)*rx,py=Math.sin(a)*ry;o.push([x+px*cr-py*sr,y+px*sr+py*cr])}return o}
function crSample(P,closed,seg=7){ // Catmull-Rom through P
  const n=P.length,o=[];const g=i=>closed?P[(i%n+n)%n]:P[clamp(i,0,n-1)];const m=closed?n:n-1;
  for(let i=0;i<m;i++){const p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);for(let s=0;s<seg;s++){const t=s/seg,t2=t*t,t3=t2*t;
    o.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
            .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}
  if(!closed)o.push(P[n-1]);return o}
const blob=(P)=>crSample(P,true);
function tube(P,w0,w1,o={}){ // variable-width tube along open spline; w can be fn(t)
  const S=crSample(P,false,o.seg||8),n=S.length,L=[],R=[];const wf=typeof w0==='function'?w0:(t=>lerp(w0,w1,t));
  for(let i=0;i<n;i++){const a=S[Math.max(0,i-1)],b=S[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const w=wf(i/(n-1))/2;
    L.push([S[i][0]-dy*w,S[i][1]+dx*w]);R.push([S[i][0]+dy*w,S[i][1]-dx*w])}
  const cap=(c,dir,w,from,to)=>{const o2=[];const a0=Math.atan2(from[1]-c[1],from[0]-c[0]);for(let k=1;k<6;k++){const a=a0+(k/6)*Math.PI*(dir);o2.push([c[0]+Math.cos(a)*w,c[1]+Math.sin(a)*w])}return o2};
  const wE=wf(1)/2,wS=wf(0)/2;
  const pts=[...L,...(o.capEnd===false?[]:cap(S[n-1],-1,wE,L[n-1],R[n-1])),...R.reverse(),...(o.capStart===false?[]:cap(S[0],-1,wS,R[R.length-1],L[0]))];
  return pts}
function poly(P){return P}
const bb=P=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}return{x0,y0,x1,y1,w:x1-x0,h:y1-y0}};
function pth(P){cx.beginPath();cx.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)cx.lineTo(P[i][0],P[i][1]);cx.closePath()}
// ---------- the painter ----------
/* part(points,color,{ol:outline width,sh:shade strength,hl:highlight size(0=off),fx:fn(cx,bb) painted inside clip,a:alpha,lx,ly:light origin fractions}) */
function part(P,col,o={}){
  const B=bb(P),ol=o.ol==null?2.6:o.ol,sh=o.sh==null?1:o.sh,a=o.a==null?1:o.a,c=rgb(col);
  cx.save();cx.globalAlpha=a;cx.lineJoin='round';cx.lineCap='round';
  pth(P);
  if(ol>0){cx.lineWidth=ol;cx.strokeStyle=css(o.olc||olc(c));cx.stroke()}
  const gx=B.x0+B.w*(o.lx==null?.34:o.lx),gy=B.y0+B.h*(o.ly==null?.26:o.ly),r=Math.max(B.w,B.h)*(o.gr||.95);
  const g=cx.createRadialGradient(gx,gy,0,gx,gy,r);g.addColorStop(0,css(lit(c,.34*sh+.06)));g.addColorStop(.34,css(c));g.addColorStop(.78,css(mixc(c,dk(c),.55*sh)));g.addColorStop(1,css(dk(c,.5*sh+.1)));
  cx.fillStyle=g;pth(P);cx.fill();
  cx.save();pth(P);cx.clip();
  const d=o.bev==null?1.5:o.bev;
  if(d>0&&sh>0){ // lower-right crescent shadow
    cx.beginPath();cx.rect(B.x0-6,B.y0-6,B.w+12,B.h+12);cx.moveTo(P[0][0]-d,P[0][1]-d*1.15);for(let i=1;i<P.length;i++)cx.lineTo(P[i][0]-d,P[i][1]-d*1.15);cx.closePath();
    cx.fillStyle=css(dk(c,.8),.3*sh);cx.fill('evenodd');
    // upper-left rim light
    cx.beginPath();cx.rect(B.x0-6,B.y0-6,B.w+12,B.h+12);cx.moveTo(P[0][0]+d*.9,P[0][1]+d);for(let i=1;i<P.length;i++)cx.lineTo(P[i][0]+d*.9,P[i][1]+d);cx.closePath();
    cx.fillStyle=css(lit(c,.8),.34*sh);cx.fill('evenodd');
    // bounce light on lower-left edge
    cx.beginPath();cx.rect(B.x0-6,B.y0-6,B.w+12,B.h+12);cx.moveTo(P[0][0]+d*.8,P[0][1]-d*.9);for(let i=1;i<P.length;i++)cx.lineTo(P[i][0]+d*.8,P[i][1]-d*.9);cx.closePath();
    cx.fillStyle=css(mixc(c,[255,230,190],.5),.16*sh);cx.fill('evenodd')}
  if(o.fx)o.fx(cx,B);
  if(o.hl!==0&&B.w>7){const hs=(o.hl||1)*Math.min(B.w,B.h);const hx=B.x0+B.w*.27,hy=B.y0+B.h*.2;
    cx.save();cx.translate(hx,hy);cx.rotate(-.5);cx.fillStyle='rgba(255,255,255,.62)';cx.beginPath();cx.ellipse(0,0,hs*.17,hs*.085,0,0,TAU);cx.fill();
    cx.fillStyle='rgba(255,255,255,.5)';cx.beginPath();cx.ellipse(hs*.2,hs*.1,hs*.04,hs*.03,0,0,TAU);cx.fill();cx.restore()}
  cx.restore();cx.restore();return B}
function line(P,col,w,o={}){ // open stroked curve (with outline)
  const S=o.raw?P:crSample(P,false,8);cx.save();cx.lineJoin='round';cx.lineCap='round';cx.beginPath();cx.moveTo(S[0][0],S[0][1]);for(let i=1;i<S.length;i++)cx.lineTo(S[i][0],S[i][1]);
  if(o.ol){cx.strokeStyle=css(o.olc||olc(col));cx.lineWidth=w+o.ol;cx.stroke()}cx.strokeStyle=css(col,o.a);cx.lineWidth=w;cx.stroke();cx.restore()}
function dot(x,y,r,col,a){cx.save();cx.fillStyle=css(col,a);cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill();cx.restore()}
let NOSHADOW=true;function shadow(x,y,rx,ry,a=.28){if(NOSHADOW)return;cx.save();cx.fillStyle=`rgba(30,20,50,${a})`;cx.beginPath();cx.ellipse(x,y,rx,ry,0,0,TAU);cx.fill();cx.restore()}
function glow(x,y,r,col,a=.6){cx.save();const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,css(col,a));g.addColorStop(1,css(col,0));cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill();cx.restore()}
/* big shiny RO-style eye. o:{look:-1..1 x offset, lookY, lid:0..1, ang:-1..1 (angry slant), col:iris colour, body:lid colour, blink} */
function eye(x,y,rx,ry,o={}){
  const lk=o.look==null?-.25:o.look,ly=o.lookY==null?.1:o.lookY,iris=o.col||[40,30,60],lid=o.lid||0;
  cx.save();cx.translate(x,y);
  const P=ell(0,0,rx,ry,0,30);
  part(P,o.white||[255,255,255],{ol:o.ol==null?1.7:o.ol,sh:.25,hl:0,bev:.7,olc:o.eol});
  cx.save();pth(P);cx.clip();
  // iris + pupil
  const ix=lk*rx*.42,iy=ly*ry*.4;
  const ir=Math.min(rx,ry)*(o.ir||.86);
  let g=cx.createRadialGradient(ix-ir*.2,iy-ir*.3,0,ix,iy,ir*1.15);g.addColorStop(0,css(mixc(iris,[255,255,255],o.irisLit==null?.12:o.irisLit)));g.addColorStop(.7,css(iris));g.addColorStop(1,css(mixc(iris,INK,.5)));
  cx.fillStyle=g;cx.beginPath();cx.ellipse(ix,iy,ir*(o.sq||.88),ir*1.08,0,0,TAU);cx.fill();
  if(!o.noPupil){cx.fillStyle='rgba(15,10,30,.92)';cx.beginPath();cx.ellipse(ix,iy+ir*.1,ir*.5*(o.sq||.88),ir*.62,0,0,TAU);cx.fill()}
  // catch-lights
  cx.fillStyle='#fff';cx.beginPath();cx.ellipse(ix-ir*.3,iy-ir*.42,ir*.3,ir*.27,0,0,TAU);cx.fill();
  cx.globalAlpha=.85;cx.beginPath();cx.arc(ix+ir*.34,iy+ir*.38,ir*.14,0,TAU);cx.fill();cx.globalAlpha=1;
  // lid (blink / angry / sleepy)
  const lc=o.body||[200,200,200];
  if(lid>0||o.ang){cx.fillStyle=css(lc);cx.beginPath();const ang=(o.ang||0)*ry*.9,top=-ry-1,ld=lid*ry*2;
    cx.moveTo(-rx-2,top);cx.lineTo(rx+2,top);cx.lineTo(rx+2,top+ld+(o.angSide>0?ang:-ang)*.5+ang*.0);cx.lineTo(-rx-2,top+ld+(o.angSide>0?-ang:ang)*.5);cx.closePath();cx.fill();
    cx.strokeStyle=css(olc(lc));cx.lineWidth=1.4;cx.beginPath();cx.moveTo(rx+2,top+ld+(o.angSide>0?ang:-ang)*.5);cx.lineTo(-rx-2,top+ld+(o.angSide>0?-ang:ang)*.5);cx.stroke()}
  cx.restore();
  cx.restore()}
/* simple expressive mouth: kind 'smile' | 'open' (open amount m) | 'fang' | 'w' */
function mouth(x,y,w,kind,m,o={}){
  cx.save();cx.translate(x,y);cx.lineCap='round';cx.lineJoin='round';const ink=css(o.ink||[70,34,50]);
  if(kind==='open'){const P=blob([[-w/2,0],[-w*.3,-m*.3],[0,-m*.45],[w*.3,-m*.3],[w/2,0],[w*.32,m*.7],[0,m],[-w*.32,m*.7]]);
    cx.beginPath();cx.moveTo(P[0][0],P[0][1]);for(const p of P)cx.lineTo(p[0],p[1]);cx.closePath();cx.fillStyle=css(o.in||[120,36,52]);cx.fill();cx.strokeStyle=ink;cx.lineWidth=1.5;cx.stroke();
    cx.save();cx.clip();cx.fillStyle=css(o.tongue||[255,120,140]);cx.beginPath();cx.ellipse(0,m*.85,w*.3,m*.38,0,0,TAU);cx.fill();
    if(o.teeth){cx.fillStyle='#fff';for(const s of[-1,1]){cx.beginPath();cx.moveTo(s*w*.2-1.5,-m*.4);cx.lineTo(s*w*.2+1.5,-m*.4);cx.lineTo(s*w*.2,-m*.4+Math.min(5,m*.6));cx.fill()}}cx.restore()}
  else if(kind==='w'){cx.strokeStyle=ink;cx.lineWidth=1.4;cx.beginPath();cx.moveTo(-w/2,0);cx.quadraticCurveTo(-w/4,m,0,0);cx.quadraticCurveTo(w/4,m,w/2,0);cx.stroke()}
  else{cx.strokeStyle=ink;cx.lineWidth=1.5;cx.beginPath();cx.moveTo(-w/2,0);cx.quadraticCurveTo(0,m==null?3:m,w/2,0);cx.stroke()}
  cx.restore()}
function blush(x,y,rx,ry,col=[255,120,140],a=.55){cx.save();const g=cx.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,css(col,a));g.addColorStop(1,css(col,0));cx.translate(0,0);cx.fillStyle=g;cx.beginPath();cx.ellipse(x,y,rx,ry,0,0,TAU);cx.fill();cx.restore()}
// ---------- sheet builder ----------
const FW=96,FH=96,BASE=88;
const ANIMS={idle:{n:4,row:0},walk:{n:6,row:1},atk:{n:4,row:2}};
const ATK_CURVE=[-.55,1,.6,.12];            // windup, strike, hold, recover
function frameParams(kind,i){
  if(kind==='idle')return{kind,i,ph:i/4,a:0,s:Math.sin(i/4*TAU)};
  if(kind==='walk')return{kind,i,ph:i/6,a:0,s:Math.sin(i/6*TAU)};
  return{kind,i,ph:i/4,a:ATK_CURVE[i],s:ATK_CURVE[i]}}
function renderSheet(drawFn,pal,v,cols=6,W=FW,H=FH,base=BASE,anims=ANIMS,rows=3){
  const c=document.createElement('canvas');c.width=cols*W*SS;c.height=rows*H*SS;const x=c.getContext('2d');
  for(const k of Object.keys(anims)){const a=anims[k];for(let i=0;i<a.n;i++){
    x.save();x.translate(i*W*SS,a.row*H*SS);x.beginPath();x.rect(0,0,W*SS,H*SS);x.clip();x.scale(SS,SS);setCtx(x);
    drawFn(frameParams(k,i),pal,v,{W,H,base});x.restore()}}
  const o=document.createElement('canvas');o.width=cols*W;o.height=rows*H;const ox=o.getContext('2d');ox.imageSmoothingEnabled=true;ox.imageSmoothingQuality='high';
  // 2-step downsample (4x -> 2x -> 1x) keeps edges clean
  const m=document.createElement('canvas');m.width=c.width/2;m.height=c.height/2;const mx=m.getContext('2d');mx.imageSmoothingQuality='high';mx.drawImage(c,0,0,m.width,m.height);
  ox.drawImage(m,0,0,o.width,o.height);return o}
function dome(x,y,rx,rt,rb,n=52,pw=1){const o=[];for(let i=0;i<n;i++){const a=i/n*TAU,c=Math.cos(a),s=Math.sin(a);const sx=Math.sign(c)*Math.pow(Math.abs(c),pw);o.push([x+sx*rx,y+s*(s<0?rt:rb)])}return o}
function rotP(P,x,y,a){const c=Math.cos(a),s=Math.sin(a);return P.map(p=>{const dx=p[0]-x,dy=p[1]-y;return[x+dx*c-dy*s,y+dx*s+dy*c]})}
function rpt(p,x,y,a){return rotP([p],x,y,a)[0]}
function spike(x,y,dir,len,w,col,o={}){ // triangular spike from (x,y) pointing at angle dir
  const tx=x+Math.cos(dir)*len,ty=y+Math.sin(dir)*len,nx=-Math.sin(dir)*w/2,ny=Math.cos(dir)*w/2;return part(o.curve?blob([[x-nx,y-ny],[x+Math.cos(dir)*len*.5+nx*.5-ny*0,y+Math.sin(dir)*len*.5+ny*.5],[tx,ty],[x+nx,y+ny]]):[[x-nx,y-ny],[tx,ty],[x+nx,y+ny]],col,Object.assign({ol:1.8,sh:.5,hl:0,bev:.8},o))}
function flame(x,y,h,w,c1,c2,o={}){ // little flame tongue pointing up
  const P=blob([[x-w,y],[x-w*.8,y-h*.35],[x-w*.25,y-h*.55],[x+(o.lean||0),y-h],[x+w*.35,y-h*.5],[x+w*.85,y-h*.3],[x+w,y]]);
  part(P,c1,{ol:o.ol==null?1.6:o.ol,sh:.4,hl:0,bev:.7,olc:mixc(c1,[90,20,10],.6)});part(blob([[x-w*.5,y],[x-w*.4,y-h*.3],[x+(o.lean||0)*.6,y-h*.62],[x+w*.45,y-h*.28],[x+w*.5,y]]),c2,{ol:0,sh:.2,hl:0,bev:0})}
