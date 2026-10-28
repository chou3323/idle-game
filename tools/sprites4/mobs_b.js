// ---------------- BEETLE ----------------
SP.beetle=function(f,P,v,E){
  const t=f.kind,B=E.base;let lunge=0,hr=0,bob=0,lp=0,up=0;
  if(t==='idle'){bob=f.s*.9;hr=f.s*.04}
  else if(t==='walk'){lp=f.ph*TAU;bob=-Math.abs(Math.sin(lp))*1.4}
  else{lunge=f.a>0?-f.a*13:-f.a*-5;hr=f.a*.55;up=Math.max(0,f.a)*2}
  const bx=57+lunge*.55,by=B-23+bob;
  // legs (3 pairs)
  for(let k=0;k<3;k++){for(const far of[1,0]){const x0=bx-14+k*13+(far?3:0),ph=lp+k*2.1+(far?Math.PI:0),sw=t==='walk'?Math.sin(ph)*5:0,lift=t==='walk'?Math.max(0,Math.cos(ph))*3:0;
    const foot=[x0-4+sw+(k===0?-5:k===2?5:0),B-1.5-lift];
    part(tube([[x0,by+6],[x0+(k===0?-8:k===2?4:-3),B-12+(far?1:0)],foot],5,3.2),far?mixc(P.dark,P.body,.25):P.dark,{ol:1.8,hl:0,sh:.5,bev:.6})}}
  // shell (elytra)
  const sh=dome(bx+2,by,27,22+up,13,60,1.0);
  part(sh,P.acc,{ol:3,gr:1.05,fx:(c,Bx)=>{
    c.strokeStyle=css(dk(P.acc,.6),.8);c.lineWidth=1.3;c.beginPath();c.moveTo(Bx.x0+Bx.w*.5,Bx.y0+1);c.quadraticCurveTo(Bx.x0+Bx.w*.46,Bx.y0+Bx.h*.5,Bx.x0+Bx.w*.5,Bx.y1);c.stroke();
    if(v.tier===1){c.fillStyle=css(P.acc2,.8);for(const [fx,fy,r] of [[.25,.45,3.2],[.72,.4,3.6],[.38,.7,2.8],[.82,.68,2.6]]){c.beginPath();c.ellipse(Bx.x0+Bx.w*fx,Bx.y0+Bx.h*fy,r,r*.85,0,0,TAU);c.fill()}}
    if(v.tier===2){c.strokeStyle=css(dk(P.acc,.7),.7);c.lineWidth=1;for(const q of[.2,.74]){c.beginPath();c.moveTo(Bx.x0+Bx.w*q,Bx.y0+4);c.lineTo(Bx.x0+Bx.w*(q+.1),Bx.y1);c.stroke()}
      c.fillStyle=css(P.acc2,.55);c.beginPath();c.moveTo(Bx.x0+Bx.w*.1,Bx.y1-3);c.lineTo(Bx.x0+Bx.w*.25,Bx.y0+Bx.h*.4);c.lineTo(Bx.x0+Bx.w*.4,Bx.y1-3);c.fill()}
    if(v.tier===3){c.fillStyle=css([30,12,14],.9);for(const [fx,fy,r] of [[.22,.5,3.4],[.7,.34,3.8],[.5,.66,3],[.84,.66,2.8]]){c.beginPath();c.ellipse(Bx.x0+Bx.w*fx,Bx.y0+Bx.h*fy,r,r*.9,0,0,TAU);c.fill()}
      glow(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.55,Bx.w*.4,P.acc2,.35)}
  }});
  if(v.tier===2){for(const [dx,h] of[[-14,9],[-4,12],[7,12],[17,9]]) spike(bx+dx,by-18+Math.abs(dx)*.12,-Math.PI/2+dx*.02,h,7,P.acc2,{ol:1.6})}
  // head (pivots at neck)
  const nx=bx-23,ny=by+1;
  const hdraw=(PP)=>rotP(PP,nx,ny,-hr);
  const hx=nx-9,hy=ny+1;
  part(hdraw(ell(nx+4,ny,10,12)),P.dark,{ol:2.4,hl:0,sh:.7}); // collar
  // horns
  if(v.tier===1) part(hdraw(tube([[hx+1,hy-8],[hx-8,hy-15],[hx-12,hy-25]],6,2.4)),P.dark,{ol:2,hl:0,sh:.5});
  if(v.tier===2){for(const s of[-1,1]) part(hdraw(tube([[hx+2,hy-7],[hx-5,hy-14+s*0],[hx-9,hy-22]],6,2.4)),P.acc2,{ol:2,hl:0,sh:.4});}
  if(v.tier===3){part(hdraw(tube([[hx+3,hy-8],[hx-6,hy-15],[hx-6,hy-27]],7,2)),P.acc,{ol:2,hl:0,sh:.4});part(hdraw(tube([[hx,hy-4],[hx-12,hy-10],[hx-19,hy-6]],6,2)),P.acc2,{ol:2,hl:0,sh:.4})}
  part(hdraw(blob([[hx-12,hy+2],[hx-9,hy-9],[hx+2,hy-12],[hx+11,hy-3],[hx+10,hy+8],[hx,hy+12],[hx-9,hy+9]])),P.body,{ol:2.8,hl:1});
  // mandibles
  const open=t==='atk'?Math.max(0,f.a)*5:Math.sin(f.ph*TAU)*1;
  part(hdraw(tube([[hx-8,hy+8],[hx-15,hy+11+open],[hx-17,hy+5+open]],4.4,1.6)),P.dark,{ol:1.8,hl:0,sh:.4,bev:.5});
  part(hdraw(tube([[hx-4,hy+10],[hx-10,hy+16-open*.3],[hx-13,hy+11-open*.3]],4,1.6)),P.dark,{ol:1.8,hl:0,sh:.4,bev:.5});
  const E1=rpt([hx-6,hy-1],nx,ny,-hr),E2=rpt([hx+5,hy-.5],nx,ny,-hr),ang=(t==='atk'&&f.a>0)||v.tier===3?.42:0;
  eye(E1[0],E1[1],5.6,6.8,{look:-.5,col:P.eye,ang,angSide:-1,body:P.body,lid:(t==='idle'&&f.i===3)?.8:0});eye(E2[0],E2[1],4.8,6,{look:-.5,col:P.eye,ang,angSide:1,body:P.body,lid:(t==='idle'&&f.i===3)?.8:0});
  const bl=rpt([hx-9,hy+5],nx,ny,-hr);blush(bl[0],bl[1],4,2.4,[255,140,150],.45);
  // antennae
  for(const [ax,ay,bxx,byy] of [[hx+3,hy-10,hx-4,hy-20],[hx+7,hy-8,hx+4,hy-19]]){const a1=rpt([ax,ay],nx,ny,-hr),a2=rpt([bxx,byy],nx,ny,-hr);line([a1,a2],P.dark,1.8,{raw:true,ol:1});dot(a2[0],a2[1],1.8,P.acc2)}
}
// ---------------- MUSHROOM ----------------
SP.mush=function(f,P,v,E){
  const t=f.kind,B=E.base;let tilt=0,sq=1,lunge=0,lift=0,armUp=0,fl=0,fr=0,puff=0;
  if(t==='idle'){sq=1+.04*f.s;tilt=f.s*.02;armUp=f.s*2}
  else if(t==='walk'){const u=Math.sin(f.ph*TAU);tilt=u*.06;lift=Math.abs(u)*2;fl=Math.max(0,u)*4;fr=Math.max(0,-u)*4}
  else{const a=f.a;sq=a<0?1-a*.12:1-a*.1;tilt=-a*.08;lunge=a>0?-a*5:0;armUp=a*9;puff=Math.max(0,a)}
  const mx=50+lunge,top=B-lift-62*sq;
  // feet
  part(ell(mx-8,B-2.6-fl,8,4.2),P.belly,{ol:2.2,hl:0,sh:.6});part(ell(mx+9,B-2.6-fr,8,4.2),P.belly,{ol:2.2,hl:0,sh:.6});
  // stalk (body)
  const sb=B-lift-4;
  part(blob([[mx-14,sb],[mx-15,sb-14],[mx-13,sb-30*sq],[mx+13,sb-30*sq],[mx+15,sb-14],[mx+14,sb]]),P.belly,{ol:2.8,fx:(c,Bx)=>{c.fillStyle=css(dk(P.belly,.6),.18);c.fillRect(Bx.x0,Bx.y1-6,Bx.w,6)}});
  // arms
  part(tube([[mx+11,sb-18],[mx+17,sb-14-armUp*.4],[mx+19,sb-8-armUp]],5.4,4.4),P.belly,{ol:2,hl:0,sh:.6});
  part(tube([[mx-11,sb-18],[mx-17,sb-14-armUp*.5],[mx-19,sb-9-armUp*1.3]],5.4,4.4),P.belly,{ol:2,hl:0,sh:.6});
  // face (on stalk)
  const ey=sb-19,lid=(t==='idle'&&f.i===1)?.8:0;
  eye(mx-7,ey,5.6,6.8,{look:-.45,col:P.eye,lid,body:P.belly,ang:puff>.3||v.tier===3?.35:0,angSide:-1});eye(mx+7,ey+.4,5.2,6.4,{look:-.45,col:P.eye,lid,body:P.belly,ang:puff>.3||v.tier===3?.35:0,angSide:1});
  blush(mx-13,ey+7,3.6,2.2,P.blush,.6);blush(mx+13,ey+7,3.6,2.2,P.blush,.6);
  if(puff>.3)mouth(mx,ey+10,7,'open',4.6);else mouth(mx,ey+9,6,'smile',2.6);
  // spores
  if(puff>0){for(let k=0;k<7;k++){const d=puff*(4+k*4.5),yy=top+14+Math.sin(k*2.1)*9+k*1.2;dot(mx-20-d*.8,yy,2.8+k%3*.9,P.v2||P.acc2,.7*(1-k/9))}}
  // cap
  cx.save();cx.translate(mx,top+20);cx.rotate(tilt);cx.translate(-mx,-(top+20));
  const cap=blob([[mx-34,top+22],[mx-31,top+8],[mx-19,top-2],[mx,top-5],[mx+19,top-2],[mx+31,top+8],[mx+34,top+22],[mx+27,top+27],[mx+16,top+24],[mx+6,top+28],[mx-6,top+24],[mx-16,top+28],[mx-27,top+26]]);
  part(cap,P.acc,{ol:3,gr:1.05,fx:(c,Bx)=>{
    c.fillStyle=css(P.acc2,.95);for(const [fx,fy,r] of [[.22,.42,5.6],[.52,.2,6.8],[.78,.46,5.4],[.4,.62,3.6],[.66,.7,3.2],[.12,.74,2.8]]){c.beginPath();c.ellipse(Bx.x0+Bx.w*fx,Bx.y0+Bx.h*fy,r,r*.78,-.2,0,TAU);c.fill();c.strokeStyle=css(dk(P.acc,.5),.35);c.lineWidth=.8;c.stroke()}
    if(v.tier===2){glow(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.4,Bx.w*.35,P.acc2,.28)}
    if(v.tier===3){glow(Bx.x0+Bx.w*.5,Bx.y1,Bx.w*.4,P.acc2,.4)}
  }});
  // gill line
  line([[mx-30,top+25],[mx-16,top+27],[mx,top+25],[mx+16,top+27],[mx+30,top+24]],dk(P.acc,.6),1.2,{a:.5});
  if(v.tier===3){for(const [dx,h] of [[-14,13],[-2,19],[11,12]]) flame(mx+dx,top+1,h,5,P.acc2,[255,244,170],{lean:-2})}
  if(v.tier===2){for(const [dx,h] of [[-12,9],[0,13],[12,9]]) spike(mx+dx,top+1,-Math.PI/2,h,6,[225,240,255],{ol:1.4})}
  cx.restore();
}
// ---------------- GHOST / UNDEAD ----------------
SP.ghost=function(f,P,v,E){
  const t=f.kind;let bob=0,lunge=0,arm=0,jaw=0,wv=f.ph*TAU;
  if(t==='idle'){bob=Math.sin(f.ph*TAU)*2.2}
  else if(t==='walk'){bob=Math.sin(f.ph*TAU*2)*1.6}
  else{const a=f.a;lunge=a>0?-a*12:-a*-5;arm=a;jaw=Math.max(0,a);bob=a>0?-1:2;wv=f.ph*TAU}
  const hx=50+lunge,hy=56+bob,skull=v.tier>=2;
  // hem (tattered cloak / sheet) with wave
  const hem=[];const n=7;for(let i=0;i<=n;i++){const x=hx-23+i*(46/n);const w=Math.sin(wv+i*1.4)*3+(i%2?-2:5);hem.push([x,hy+30+w+(i%2?5:0)])}
  const body=blob([[hx-22,hy+6],[hx-20,hy-12],[hx-8,hy-26],[hx+8,hy-26],[hx+20,hy-12],[hx+24,hy+8],...hem.slice().reverse().map(p=>[p[0],p[1]])]);
  // tail wisp
  part(blob([[hx+14,hy+10],[hx+30,hy+8],[hx+40,hy+14],[hx+33,hy+20],[hx+18,hy+24]]),P.body,{ol:2.4,a:.88,hl:0,sh:.7});
  if(v.tier===3){for(const [dx,h] of [[10,20],[20,26]]) flame(hx+dx+16,hy+26,h*.9,5,P.acc,P.acc2,{lean:2})}
  part(body,P.body,{ol:3,a:skull?1:.93,gr:1.0,fx:(c,Bx)=>{
    c.fillStyle=css(P.belly,.55);c.beginPath();c.ellipse(Bx.x0+Bx.w*.4,Bx.y0+Bx.h*.45,Bx.w*.3,Bx.h*.34,0,0,TAU);c.fill();
    if(skull){c.strokeStyle=css(P.acc,.8);c.lineWidth=1.3;c.beginPath();c.moveTo(Bx.x0+4,Bx.y0+Bx.h*.62);c.quadraticCurveTo(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.8,Bx.x1-4,Bx.y0+Bx.h*.6);c.stroke()}
  }});
  // arms
  const ay=hy+10;
  const ar1=[[hx-17,ay],[hx-24-arm*8,ay+4-arm*4],[hx-30-arm*13,ay+6-arm*7]];
  part(tube(ar1,7.5,5.6),skull?P.body:P.body,{ol:2.2,hl:0,sh:.6,a:skull?1:.95});
  if(skull){for(let k=0;k<3;k++){const q=ar1[2];part(tube([[q[0],q[1]],[q[0]-4,q[1]+(k-1)*3.4],[q[0]-8-arm*2,q[1]+(k-1)*5.6]],2.6,1.2),P.belly,{ol:1.1,hl:0,sh:.2,bev:0})}}
  else part(ell(ar1[2][0]-1,ar1[2][1],4.2,3.6),P.belly,{ol:1.6,hl:0,sh:.4});
  part(tube([[hx+14,ay+2],[hx+20,ay+6],[hx+24,ay+10]],7,5),P.body,{ol:2.2,hl:0,sh:.6,a:skull?1:.95});
  // face
  if(!skull){
    eye(hx-9,hy-3,6.2,8,{look:-.4,col:P.eye,white:[250,252,255],body:P.body,lid:(t==='idle'&&f.i===2)?.8:0});eye(hx+8,hy-2.5,5.6,7.4,{look:-.4,col:P.eye,white:[250,252,255],body:P.body,lid:(t==='idle'&&f.i===2)?.8:0});
    blush(hx-15,hy+7,4.6,2.6,P.blush,.6);blush(hx+14,hy+7,4.6,2.6,P.blush,.6);
    if(jaw>.3)mouth(hx-1,hy+11,9,'open',6+jaw*3);else mouth(hx-1,hy+10,8,'w',3);
  }else{
    // skull face
    const sf=ell(hx,hy-2,18,15,0,40);
    part(sf,P.belly,{ol:2.6,hl:.9,sh:.9});
    part(blob([[hx-8,hy+10],[hx-9,hy+18+jaw*5],[hx,hy+21+jaw*6],[hx+9,hy+18+jaw*5],[hx+8,hy+10]]),mixc(P.belly,P.body,.1),{ol:2,hl:0,sh:.7,bev:.8});
    for(const sx of[-1,1]){const ex=hx+sx*8-(sx>0?1:3),ey=hy-3;
      part(ell(ex,ey,5.6,6.6),[26,18,46],{ol:1.5,hl:0,sh:.2,bev:0});glow(ex,ey,10,v.tier===3?[255,90,150]:[110,230,255],.55);dot(ex,ey+.5,2.4,v.tier===3?[255,170,210]:[210,255,255]);dot(ex-1.4,ey-1.6,1.1,[255,255,255])}
    part([[hx-2.6,hy+4.5],[hx+.2,hy+1],[hx+3,hy+4.5],[hx+.2,hy+7]],[40,28,60],{ol:1,hl:0,bev:0});
    line([[hx-7,hy+13+jaw*2],[hx+7,hy+13+jaw*2]],P.dark,1.2,{raw:true});for(const dx of[-4,0,4])line([[hx+dx,hy+10+jaw],[hx+dx,hy+16+jaw*4]],P.dark,.9,{raw:true,a:.8});
    // hood
    part(blob([[hx-22,hy+6],[hx-21,hy-14],[hx-9,hy-27],[hx+8,hy-27],[hx+21,hy-14],[hx+22,hy+6],[hx+17,hy-8],[hx+8,hy-18],[hx-8,hy-18],[hx-17,hy-8]]),P.body,{ol:2.8,hl:.6});
    if(v.tier===3){spike(hx-14,hy-20,-2.2,15,6,P.belly,{ol:1.8,curve:true});spike(hx+13,hy-20,-.95,15,6,P.belly,{ol:1.8,curve:true})}
    if(v.tier===2){for(const dx of[-9,0,9])spike(hx+dx,hy-24,-Math.PI/2,9,5,[235,248,255],{ol:1.3})}
  }
}
// ---------------- BAT (front-facing, symmetrical wings) ----------------
SP.bat=function(f,P,v,E){
  const t=f.kind;let fl,bob=0,bite=0,tuck=0,drop=0;
  if(t==='atk'){fl=[.5,-.9,-.3,.4][f.i];bite=Math.max(0,f.a);tuck=bite;bob=f.a>0?3:-2;drop=f.a>0?f.a*4:0}
  else{fl=t==='idle'?[1,.2,-1,.2][f.i]:Math.sin(f.ph*TAU);bob=t==='idle'?Math.sin(f.ph*TAU)*1.8:Math.sin(f.ph*TAU*2)*1.5}
  const bx=48,by=60+bob;
  const wingL=(dir,far)=>{
    const sx=bx+dir*9,sy=by-7,ang=-fl*.62*dir+(tuck?dir*.35*tuck:0);
    const L=(x,y)=>[x*dir*.92,y*.96];
    const raw=[[0,0],[16,-15],[40,-17],[36,-3],[31,-7],[34,10],[27,8],[26,20],[17,13],[12,19],[4,13]];
    // scalloped membrane: points between finger tips pulled inward
    const pts=[[0,-3],[17,-16],[40,-18],[33,-6],[36,8],[26,6],[26,19],[15,11],[10,17],[3,12]].map(p=>L(p[0],p[1]));
    const R=rotP(pts.map(p=>[sx+p[0],sy+p[1]]),sx,sy,ang);
    part(blob(R),far?mixc(P.acc,P.dark,.3):P.acc,{ol:2.2,hl:0,sh:.8,fx:(c,B)=>{c.strokeStyle=css(dk(P.acc,.7),.65);c.lineWidth=1.2;for(const k of[2,4,6]){c.beginPath();c.moveTo(R[0][0],R[0][1]);c.lineTo(R[k][0],R[k][1]);c.stroke()}
      c.fillStyle=css(mixc(P.acc,P.acc2,.35),.35);c.beginPath();c.ellipse(B.x0+B.w*.45,B.y0+B.h*.55,B.w*.2,B.h*.18,0,0,TAU);c.fill()}});
    // wrist claw
    const w=R[1];dot(w[0],w[1],1.7,P.dark)};
  wingL(1,true);wingL(-1,false);
  // feet
  for(const dx of[-5,5]) part(tube([[bx+dx,by+12],[bx+dx,by+18+drop*.3],[bx+dx+(dx>0?2:-2),by+22+drop*.5]],3.8,2.8),P.dark,{ol:1.6,hl:0,sh:.4,bev:.4});
  // ears
  part([[bx-14,by-9],[bx-16,by-28],[bx-4,by-14]],P.body,{ol:2.2,sh:.7,hl:0});part([[bx-12.5,by-13],[bx-13.5,by-23],[bx-7,by-15]],P.blush,{ol:0,sh:0,hl:0,bev:0,a:.65});
  part([[bx+14,by-9],[bx+16,by-28],[bx+4,by-14]],P.body,{ol:2.2,sh:.7,hl:0});part([[bx+12.5,by-13],[bx+13.5,by-23],[bx+7,by-15]],P.blush,{ol:0,sh:0,hl:0,bev:0,a:.65});
  if(v.tier>=2){spike(bx-6,by-15,-2.2,10,5,P.acc2,{ol:1.5,curve:true});spike(bx+6,by-15,-.95,10,5,P.acc2,{ol:1.5,curve:true})}
  // body
  part(blob([[bx-17,by],[bx-14,by-12],[bx,by-16],[bx+14,by-12],[bx+17,by],[bx+11,by+13],[bx,by+16],[bx-11,by+13]]),P.body,{ol:2.9,fx:(c,B)=>{c.fillStyle=css(P.belly,.9);c.beginPath();c.ellipse(B.x0+B.w*.5,B.y1-B.h*.26,B.w*.3,B.h*.24,0,0,TAU);c.fill();
    c.fillStyle='rgba(255,255,255,.12)';for(let k=0;k<14;k++){c.beginPath();c.arc(B.x0+3+(k*7)%B.w,B.y0+2+(k*5)%B.h,1,0,TAU);c.fill()}}});
  const ey=by-2,ang=bite>0||v.tier===3?.42:0,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(bx-7.5,ey,6,7.4,{look:.25,col:P.eye,ang,angSide:-1,body:P.body,lid});eye(bx+7.5,ey,6,7.4,{look:-.25,col:P.eye,ang,angSide:1,body:P.body,lid});
  blush(bx-13,ey+8,3.6,2.2,P.blush,.55);blush(bx+13,ey+8,3.6,2.2,P.blush,.55);
  const my=by+8;
  if(bite>.2){mouth(bx,my,10,'open',5+bite*3,{teeth:true})}else{mouth(bx,my,6,'smile',2);for(const dx of[-3,3]) part([[bx+dx-1.4,my+.4],[bx+dx,my+4.4],[bx+dx+1.4,my+.4]],'#fff',{ol:.9,hl:0,sh:0,bev:0})}
}
