/* species drawers: fn(f,P,v,E) ; f={kind,i,ph,a,s}; P=palette; v=variant flags; E={base}. All face LEFT. */
const SP={};
const R=(a,b)=>a; // placeholder
function gel(cx2,B,col,core){ // inner gel bubbles
  cx2.save();for(const [fx,fy,r,al] of [[.7,.62,.07,.35],[.55,.74,.045,.3],[.78,.45,.04,.28]]){cx2.fillStyle=css(lit(col,.7),al);cx2.beginPath();cx2.arc(B.x0+B.w*fx,B.y0+B.h*fy,B.w*r,0,TAU);cx2.fill()}cx2.restore()}
// ---------------- SLIME ----------------
SP.slime=function(f,P,v,E){
  const t=f.kind,s=f.s,B=E.base;let sx=1,sy=1,lift=0,lunge=0,tilt=0,op=0;
  if(t==='idle'){sy=1+.055*s;sx=1-.04*s}
  else if(t==='walk'){const u=Math.sin(f.ph*TAU);lift=Math.max(0,u)*10;sy=u>0?1+.1*u:1+.16*u;sx=1/Math.pow(sy,.7);lunge=0}
  else{const a=f.a;sy=a<0?1+a*.3:1-.06*a;sx=a<0?1-a*.25:1+.12*a;lunge=a>0?-a*15:a*-5;op=Math.max(0,a);lift=a>0.5?3:0}
  const W=31*sx,H=52*sy,cxm=50+lunge,top=B-lift-H;
  shadow(50+lunge*.4,B+1,W*.95*(1-lift*.018),4.2,.3-lift*.012);
  const pts=[];for(let i=0;i<56;i++){const a=i/56*TAU,c=Math.cos(a),sn=Math.sin(a);const rr=sn<0?.62:.38;pts.push([cxm+c*W*(sn>0?1+.04*sn:1),B-lift-H*.38+sn*H*rr])}
  // lean tip toward the front (left) like a droplet
  const body=pts.map(([x,y])=>{const k=clamp((B-lift-y)/H,0,1);return[x-(k*k)*3-lunge*0*k,y]});
  // sprout / crown behind
  const tx=cxm-5-(op*2),ty=top+3;
  if(v.tier===1){ // leaf sprout
    part(blob([[tx,ty+2],[tx-5,ty-7],[tx-12,ty-9],[tx-10,ty-2]]),P.acc,{ol:2,sh:.7});
    part(blob([[tx,ty+2],[tx+4,ty-8],[tx+11,ty-12],[tx+10,ty-4]]),mixc(P.acc,P.acc2,.3),{ol:2,sh:.7});
  }else if(v.tier===2){ // ice shards
    for(const [dx,h,w] of [[-9,15,5],[0,22,6],[9,14,5]]) part([[tx+dx-w,ty+4],[tx+dx,ty-h],[tx+dx+w,ty+4]],P.acc2,{ol:2,sh:.6,bev:1});
  }else{ // flame crown
    for(const [dx,h,w] of [[-9,13,5],[0,21,6],[9,12,5]]) part(blob([[tx+dx-w,ty+5],[tx+dx-w*.6,ty-h*.4],[tx+dx,ty-h],[tx+dx+w*.4,ty-h*.4],[tx+dx+w,ty+5]]),mixc(P.acc2,P.acc,.35+dx*.01),{ol:2,sh:.5});
  }
  part(body,P.body,{ol:3,a:v.tier===2?.96:1,gr:1.0,fx:(c,Bx)=>{
    // belly tint + gel bubbles + rim translucency
    const g=c.createLinearGradient(0,Bx.y0,0,Bx.y1);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.62,css(P.belly,0));g.addColorStop(1,css(P.belly,.55));c.fillStyle=g;c.fillRect(Bx.x0,Bx.y0,Bx.w,Bx.h);
    gel(c,Bx,P.body);
    if(v.tier===3){glow(cxm+6,B-lift-H*.4,W*.55,P.acc2,.55);c.strokeStyle=css(P.acc2,.9);c.lineWidth=1.4;c.beginPath();c.moveTo(cxm+8,B-lift-H*.7);c.lineTo(cxm+14,B-lift-H*.52);c.lineTo(cxm+9,B-lift-H*.38);c.moveTo(cxm+14,B-lift-H*.52);c.lineTo(cxm+19,B-lift-H*.46);c.stroke()}
    if(v.tier===2){c.fillStyle=css(P.acc2,.55);c.beginPath();c.moveTo(cxm+10,B-lift-H*.62);c.lineTo(cxm+14,B-lift-H*.38);c.lineTo(cxm+10,B-lift-H*.18);c.lineTo(cxm+6,B-lift-H*.4);c.fill()}
  },hl:1.05});
  // face
  const ey=B-lift-H*.5,ex=cxm-15,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(ex,ey,6.4,7.6,{look:-.5,col:P.eye,lid,body:P.body,ang:v.tier===3||op>0?.5:0,angSide:-1});
  eye(ex+17,ey+.5,5.6,7,{look:-.5,col:P.eye,lid,body:P.body,ang:v.tier===3||op>0?.5:0,angSide:1});
  blush(ex-5,ey+9,5,3,P.blush,.6);blush(ex+22,ey+9,5,3,P.blush,.6);
  if(op>.3)mouth(ex+8,ey+11,9,'open',5.5+op*3,{teeth:true});else mouth(ex+8,ey+10,8,'w',2.6);
}
// ---------------- BUNNY (Lunatic-ish) ----------------
SP.bunny=function(f,P,v,E){
  const t=f.kind,B=E.base;let lift=0,lunge=0,sq=1,earSw=0,hd=0,legSw=0;
  if(t==='idle'){sq=1+.035*f.s;earSw=Math.sin(f.ph*TAU)*2.5;hd=f.s*.8}
  else if(t==='walk'){const u=Math.sin(f.ph*TAU);lift=Math.max(0,u)*8;sq=u>0?1+.05*u:1+.1*u;earSw=-u*4;legSw=u}
  else{const a=f.a;lunge=a>0?-a*14:a*-6;sq=a<0?1+a*.2:1-.04*a;lift=a>.5?4:0;earSw=a*4;legSw=a}
  const bx=54+lunge*.7,by=B-lift-19*sq,hx=39+lunge,hy=B-lift-45*sq+(f.kind==='atk'&&f.a>0?3:0)+hd*0;
  shadow(50+lunge*.4,B+1,26-lift*.3,4,.28-lift*.01);
  // tail
  part(ell(bx+21,by+2,7.5,7.5),P.belly,{ol:2.2,sh:.5,hl:.6});
  // far hind foot
  part(ell(bx+10,B-lift-2.5,10,4.6,legSw*.2),P.belly,{ol:2.2,sh:.6,hl:0});
  // ear far
  const eb=[hx+9,hy-13];
  const earF=[[eb[0],eb[1]],[eb[0]+3+earSw*.3,eb[1]-10],[eb[0]+7+earSw*.8,eb[1]-19],[eb[0]+11+earSw*1.4,eb[1]-24+Math.abs(earSw)*.4]];
  part(tube(earF,10,8),mixc(P.body,P.acc,.35),{ol:2.4,sh:.9,hl:0});
  line(earF.map(p=>[p[0]+.2,p[1]]).slice(0,4).map((p,i,a)=>[p[0],p[1]+(i?1:2)]),P.acc,3,{a:.7});
  // body
  part(blob([[bx-21,by],[bx-17,by-14*sq],[bx-4,by-18*sq],[bx+12,by-15*sq],[bx+24,by-3],[bx+23,by+10],[bx+12,by+18],[bx-8,by+19],[bx-19,by+13]]),P.body,{ol:2.8,fx:(c,Bx)=>{c.fillStyle=css(P.belly,.9);c.beginPath();c.ellipse(Bx.x0+Bx.w*.3,Bx.y1-Bx.h*.18,Bx.w*.3,Bx.h*.3,0,0,TAU);c.fill();
      if(v.tier===2){for(let k=0;k<6;k++){c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.moveTo(Bx.x1-4,Bx.y0+4+k*5);c.lineTo(Bx.x1-9,Bx.y0+7+k*5);c.lineTo(Bx.x1-4,Bx.y0+9+k*5);c.fill()}}
      if(v.tier===3){c.fillStyle=css(P.acc,.55);c.beginPath();c.ellipse(Bx.x1-6,by-2,4,12,0,0,TAU);c.fill()}}});
  // front hind foot
  part(ell(bx-2+legSw*-3,B-lift-3,11,5.2,-legSw*.15),P.body,{ol:2.4,sh:.7,hl:0});
  dot(bx-2+legSw*-3-3,B-lift-3,1,P.blush,.5);dot(bx-2+legSw*-3+1,B-lift-3,1,P.blush,.5);
  // front paw
  const paw=[hx-1+lunge*.2,hy+19+legSw*2];part(ell(paw[0],paw[1],5,4.2),P.belly,{ol:2.2,sh:.5,hl:0});
  // head ears (near)
  const eb2=[hx-5,hy-14];
  const earN=[[eb2[0],eb2[1]],[eb2[0]-2+earSw*.2,eb2[1]-10],[eb2[0]-3+earSw*.8,eb2[1]-19],[eb2[0]-1+earSw*1.6,eb2[1]-25+Math.abs(earSw)*.5]];
  part(tube(earN,11,8.5),P.body,{ol:2.4,hl:0});
  line(earN.map((p,i)=>[p[0],p[1]+(i?2:3)]),P.acc,3.4,{a:.85});
  // head
  part(blob([[hx-20,hy+2],[hx-15,hy-13],[hx,hy-18],[hx+15,hy-13],[hx+21,hy+3],[hx+16,hy+15],[hx,hy+19],[hx-15,hy+14]]),P.body,{ol:2.8,hl:1.1});
  part(ell(hx-12,hy+7,10,7.4),P.belly,{ol:0,sh:.2,hl:0,bev:0});
  // decorations per tier
  if(v.tier===2){for(const [dx,h] of [[-6,10],[2,13],[10,10]]) part([[hx+dx-3,hy-15],[hx+dx,hy-15-h],[hx+dx+3,hy-15]],'#e8f6ff',{ol:1.6,sh:.4,hl:0})}
  if(v.tier===3){for(const [dx,h] of [[-7,10],[1,15],[9,11]]) part(blob([[hx+dx-4,hy-14],[hx+dx-1,hy-14-h*.6],[hx+dx,hy-14-h],[hx+dx+4,hy-14]]),mixc(P.acc2,P.acc,(dx+7)/16),{ol:1.8,sh:.4,hl:0})}
  // face
  const ey=hy-1;
  const lid=(t==='idle'&&f.i===2)?.85:0,ang=(t==='atk'&&f.a>.3)?.45:(v.tier===3?.3:0);
  eye(hx-9,ey,5.6,7.4,{look:-.5,col:P.eye,lid,body:P.body,ang,angSide:-1});
  eye(hx+6,ey+.5,5.1,6.9,{look:-.5,col:P.eye,lid,body:P.body,ang,angSide:1});
  // nose + mouth
  part(blob([[hx-19,hy+4],[hx-16,hy+1],[hx-13,hy+4],[hx-16,hy+7]]),P.blush,{ol:1.4,sh:.3,hl:0,bev:0});
  if(t==='atk'&&f.a>.3){mouth(hx-12,hy+12,9,'open',6,{teeth:true})}else mouth(hx-12,hy+10,8,'w',2.6);
  blush(hx-3,hy+10,5,3,P.blush,.55);blush(hx+14,hy+9,4,2.6,P.blush,.45);
  // whiskers
  line([[hx-14,hy+6],[hx-23,hy+4]],[90,60,80],.8,{a:.55});line([[hx-14,hy+8],[hx-23,hy+10]],[90,60,80],.8,{a:.55});
  // buck teeth
  part([[hx-14,hy+12],[hx-14,hy+17],[hx-10.4,hy+17],[hx-10.4,hy+12]],'#fff',{ol:1.2,sh:.2,hl:0,bev:0});
  // paw in front over mouth? (cute): tiny front arm
  part(tube([[hx+4,hy+16],[hx-4+lunge*.1,hy+20+legSw*2]],6,5),P.body,{ol:2,hl:0,sh:.6});
}
// ---------------- BEE (hornet) ----------------
SP.bee=function(f,P,v,E){
  const t=f.kind;let flap,bob=0,lunge=0,curl=0;
  if(t==='atk'){flap=[.1,.7,.2,-.3][f.i];curl=f.a;lunge=f.a>0?-f.a*12:f.a*-5}
  else{flap=t==='idle'?[1,.1,-1,.1][f.i]:Math.sin(f.ph*TAU);bob=t==='idle'?Math.sin(f.ph*TAU)*1.6:Math.sin(f.ph*TAU*2)*1.4}
  const cx0=50+lunge,cy=58+bob;
  shadow(50,E.base+1,16,3.4,.2);
  // far wings
  const wg=(x,y,rot,len,w,al)=>part(ell(len*.5,0,len*.5,w,0,28).map(p=>{const c=Math.cos(rot),s=Math.sin(rot);return[x+p[0]*c-p[1]*s,y+p[0]*s+p[1]*c]}),P.wing,{ol:1.7,a:al,sh:.3,hl:.8,olc:mixc(P.wing,P.dark,.55),fx:(c,B)=>{c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(rot)*len,y+Math.sin(rot)*len);c.stroke()}});
  wg(cx0+6,cy-9,-2.35-flap*.45,22,7.5,.78);wg(cx0+10,cy-9,-1.15+flap*.5,20,6.5,.7);
  // legs
  for(const [dx,k] of [[-4,0],[3,1],[10,2]]) part(tube([[cx0+dx,cy+9],[cx0+dx-2,cy+15+(t==='walk'?Math.sin(f.ph*TAU+k)*1.5:0)],[cx0+dx-4,cy+19]],2.6,2),P.dark,{ol:1.4,hl:0,sh:.2,bev:0});
  // abdomen
  const ab=[cx0+19+curl*-6,cy+4+curl*10],rot=curl*.9;
  const abP=ell(0,0,16,12,0,40).map(p=>{const c=Math.cos(-rot),s=Math.sin(-rot);return[ab[0]+p[0]*c-p[1]*s,ab[1]+p[0]*s+p[1]*c]});
  const stg=[[16,0],[26,2],[16,4]].map(p=>{const c=Math.cos(-rot),s=Math.sin(-rot);return[ab[0]+p[0]*c-p[1]*s,ab[1]+p[0]*s+p[1]*c]});
  part(stg,P.dark,{ol:1.8,sh:.4,hl:0,bev:.4});
  part(abP,P.body,{ol:2.8,fx:(c,B)=>{c.save();c.translate(ab[0],ab[1]);c.rotate(-rot);c.fillStyle=css(P.dark);for(const x of[-5,2,9]){c.beginPath();c.moveTo(x,-15);c.quadraticCurveTo(x+3.5,0,x,15);c.lineTo(x+3.4,15);c.quadraticCurveTo(x+7,0,x+3.4,-15);c.fill()}c.restore()}});
  // thorax (fuzzy)
  part(blob([[cx0-10,cy-1],[cx0-6,cy-11],[cx0+6,cy-12],[cx0+13,cy-2],[cx0+10,cy+9],[cx0,cy+12],[cx0-9,cy+8]]),P.acc,{ol:2.8,fx:(c,B)=>{c.fillStyle='rgba(255,255,255,.18)';for(let k=0;k<9;k++){c.beginPath();c.arc(B.x0+4+(k*7)%B.w,B.y0+3+((k*5)%B.h),1.3,0,TAU);c.fill()}}});
  // head
  const hx=cx0-17,hy=cy+1;
  part(tube([[hx+2,hy-9],[hx-3,hy-19],[hx-9,hy-24]],1.8,1.6),P.dark,{ol:1,hl:0,bev:0,sh:.1});
  part(tube([[hx+7,hy-9],[hx+7,hy-19],[hx+2,hy-25]],1.8,1.6),P.dark,{ol:1,hl:0,bev:0,sh:.1});dot(hx-9,hy-24,2.2,P.acc2);dot(hx+2,hy-25,2.2,P.acc2);
  part(ell(hx,hy,13,12),P.body,{ol:2.8,hl:1});
  eye(hx-3,hy-1,6,7.4,{look:-.45,col:P.eye,ang:t==='atk'?.5:0,angSide:-1,body:P.body});eye(hx+9,hy,4.6,6.2,{look:-.45,col:P.eye,ang:t==='atk'?.5:0,angSide:1,body:P.body});
  blush(hx-8,hy+7,4.2,2.6,P.blush,.6);
  if(t==='atk'&&f.a>.3)mouth(hx-2,hy+8,6,'open',4);else mouth(hx-1,hy+8,5,'w',2);
  if(v.tier===3){glow(ab[0],ab[1],18,P.acc2,.35)}
  if(v.tier===2){for(const dx of[-4,1,6]) part([[hx+dx-2.2,hy-11],[hx+dx,hy-17-Math.abs(dx)*.2],[hx+dx+2.2,hy-11]],'#ecf8ff',{ol:1.2,sh:.3,hl:0,bev:.3})}
}
