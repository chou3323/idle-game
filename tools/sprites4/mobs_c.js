// ---------------- SNAKE ----------------
SP.snake=function(f,P,v,E){
  const t=f.kind,B=E.base;let wv=0,sw=0,lunge=0,gape=0,tg=0;
  if(t==='idle'){sw=Math.sin(f.ph*TAU)*2.2;wv=.6;tg=f.i===2?1:0}
  else if(t==='walk'){wv=2.6;sw=Math.sin(f.ph*TAU)*1.4;tg=f.i%2}
  else{lunge=f.a>0?f.a:f.a*.4;gape=Math.max(0,f.a);sw=0;tg=f.a>0?0:1}
  const ph=f.ph*TAU,W=(i,k)=>Math.sin(ph*(t==='walk'?1:0)-i*1.1)*wv*k;
  // spine tail -> head
  const hxs=34+sw-lunge*11,hys=B-45+lunge*9;
  const S=[[90,B-5+W(0,.5)],[78,B-7+W(1,1)],[66,B-8+W(2,1.4)],[54,B-10+W(3,1.2)],[44+sw*.2,B-13+W(4,.8)],[40+sw*.5-lunge*3,B-23+lunge*3],[38+sw-lunge*6,B-34+lunge*6],[hxs+3,hys+8]];
  // back coil
  const C=[[80,B-8],[88,B-16],[86,B-26],[74,B-27],[64,B-20]];
  part(tube(C,13,11),mixc(P.body,P.dark,.18),{ol:2.8,hl:0,sh:.8,fx:(c,Bx)=>{c.fillStyle=css(P.acc,.7)}});
  const sp=crSample(S,false,6),w=(u)=>u<.25?lerp(3,16,sm(u/.25)):u<.8?16:lerp(16,13,(u-.8)/.2);
  const body=tube(S,w,0,{seg:6});
  part(body,P.body,{ol:3,hl:.8,fx:(c,Bx)=>{}});
  // diamond pattern + belly
  const n=sp.length;
  for(let i=6;i<n-4;i+=4){const q=sp[i],u=i/(n-1),ww=w(u)*.34;part([[q[0],q[1]-ww],[q[0]+ww*.9,q[1]],[q[0],q[1]+ww],[q[0]-ww*.9,q[1]]].map(p=>[p[0],p[1]-w(u)*.1]),P.acc,{ol:1.1,hl:0,sh:.4,bev:.4})}
  line(sp.slice(8,n-3).map(p=>[p[0],p[1]+3.6]),P.belly,3.3,{raw:true,a:.9});
  if(t==='walk'||t==='idle'){/* scale sheen */}
  // head
  const hx=hxs,hy=hys,tilt=-.12+lunge*.25-gape*.1;
  const HK=1.22,HR=(P2)=>rotP(P2.map(p=>[hx+(p[0]-hx)*HK,hy+(p[1]-hy)*HK]),hx,hy,tilt);
  if(v.tier===2){ // cobra hood
    part(HR(blob([[hx+4,hy-14],[hx+19,hy-8],[hx+22,hy+8],[hx+10,hy+22],[hx+2,hy+16],[hx-2,hy+4]])),P.acc,{ol:2.8,hl:0,sh:.9,fx:(c,Bx)=>{c.fillStyle=css(P.acc2,.7);c.beginPath();c.ellipse(Bx.x0+Bx.w*.6,Bx.y0+Bx.h*.5,Bx.w*.2,Bx.h*.26,0,0,TAU);c.fill()}})}
  if(v.tier===3){for(const [dx,h] of[[2,15],[9,19],[16,13]]) flame(hx+dx+2,hy-9+Math.abs(dx-9)*.2,h,4.4,P.acc,P.acc2,{lean:3})}
  part(HR(blob([[hx-17,hy+4],[hx-14,hy-7],[hx-4,hy-12],[hx+9,hy-9],[hx+14,hy+1],[hx+10,hy+10],[hx-2,hy+12],[hx-13,hy+10]])),P.body,{ol:3,hl:1});
  // lower jaw
  const jw=gape*7;
  part(HR(blob([[hx-17,hy+6],[hx-13,hy+10+jw],[hx-2,hy+12+jw*1.1],[hx+7,hy+9+jw*.5],[hx+5,hy+6]])),P.belly,{ol:2.2,hl:0,sh:.6,bev:.6});
  if(gape>.2){const m=HR([[hx-15,hy+7+jw*.2],[hx-8,hy+6+jw*.6],[hx-1,hy+7]]);part(blob([[m[0][0],m[0][1]],[m[1][0],m[1][1]-2],[m[2][0],m[2][1]]]),[120,30,50],{ol:0,hl:0,sh:0,bev:0});
    for(const dx of[-14,-7]){const q=HR([[hx+dx,hy+6.4]])[0];part([[q[0]-1.5,q[1]],[q[0],q[1]+5.5],[q[0]+1.5,q[1]]],'#fff',{ol:.9,hl:0,sh:0,bev:0})}}
  // tongue
  if(tg&&gape<.2){const a=HR([[hx-16,hy+7],[hx-24,hy+8.5],[hx-29,hy+6],[hx-29,hy+11],[hx-24,hy+8.5]]);line([a[0],a[1],a[2]],[230,60,90],1.5,{raw:true});line([a[1],a[3]],[230,60,90],1.5,{raw:true})}
  const e1=HR([[hx-6,hy-3]])[0],e2=HR([[hx+5,hy-2.5]])[0],ang=gape>.3||v.tier===3?.42:0,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(e1[0],e1[1],5.4,6.8,{look:-.4,col:P.eye,ang,angSide:-1,body:P.body,lid});eye(e2[0],e2[1],4.6,6,{look:-.4,col:P.eye,ang,angSide:1,body:P.body,lid});
  const b1=HR([[hx-12,hy+4]])[0];blush(b1[0],b1[1],3.6,2.2,P.blush,.6);
  if(!(gape>.2)){const m=HR([[hx-12,hy+8.5],[hx-6,hy+9.5]]);line([m[0],m[1]],P.dark,1.1,{raw:true,a:.8})}
  if(v.tier===1){const l=HR([[hx+8,hy-10]])[0];part(blob([[l[0],l[1]],[l[0]+3,l[1]-9],[l[0]+10,l[1]-12],[l[0]+8,l[1]-4]]),P.acc2,{ol:1.7,sh:.5,hl:0})}
  if(v.tier===3){for(const s of[-1,1]){const h=HR([[hx+s*7-2,hy-10]])[0];spike(h[0],h[1],-1.6+s*.55,9,5,P.acc2,{ol:1.5,curve:true})}}
}
// ---------------- SCORPION (id: crab) ----------------
SP.crab=function(f,P,v,E){
  const t=f.kind,B=E.base;let lp=0,bob=0,lunge=0,tailR=0,claw=0,tsw=0;
  if(t==='idle'){bob=f.s*.8;tsw=Math.sin(f.ph*TAU)*.07;claw=.3+f.s*.25}
  else if(t==='walk'){lp=f.ph*TAU;bob=-Math.abs(Math.sin(lp))*1.2;tsw=Math.sin(lp)*.05;claw=.3+Math.sin(lp)*.15}
  else{const a=f.a;lunge=a>0?-a*9:-a*4;tailR=a>0?-a*.8:-a*.4;claw=a>0?-.1:.9}
  const bx=50+lunge*.6,by=B-20+bob;
  const leg=(x0,far,k)=>{const ph=lp+k*1.6+(far?Math.PI:0),sw=t==='walk'?Math.sin(ph)*4:0,li=t==='walk'?Math.max(0,Math.cos(ph))*3:0;
    const sp=(k-1.5)*3.2,foot=[x0+sp+sw,B-1.6-li],knee=[x0+sp*.5-(far?1:0),by+5];
    const col=far?mixc(P.dark,P.body,.25):mixc(P.dark,P.body,.1);
    part(tube([[x0,by+6],[x0+sp*.8,by+11],foot],5.6,3),col,{ol:1.9,hl:0,sh:.5,bev:.5})};
  for(let k=0;k<4;k++)leg(bx-13+k*9,true,k);
  // tail
  const tb=[bx+16,by-6],T=[[tb[0],tb[1]],[tb[0]+11,tb[1]-2],[tb[0]+14,tb[1]-14],[tb[0]+8,tb[1]-26],[tb[0]-3,tb[1]-30],[tb[0]-11,tb[1]-22]];
  const TR=rotP(T,tb[0],tb[1],tailR+tsw),ts=crSample(TR,false,5);
  for(let i=ts.length-1;i>=0;i-=3){const u=i/(ts.length-1),r=lerp(8.2,5,u);part(ell(ts[i][0],ts[i][1],r,r*.95,0,24),P.body,{ol:2.3,hl:u<.5?.8:0,sh:.9,bev:.8})}
  const q=TR[5],q2=TR[4];const dir=Math.atan2(q[1]-q2[1],q[0]-q2[0])+.9;
  spike(q[0],q[1]+1,dir,12,8,P.acc2,{ol:2,curve:true,sh:.6});
  if(v.tier===3)glow(q[0]+3,q[1]+4,10,P.acc2,.6);
  // carapace
  part(dome(bx,by,22,15,11,50,1),P.body,{ol:3,gr:1.0,fx:(c,Bx)=>{
    c.strokeStyle=css(dk(P.body,.6),.5);c.lineWidth=1.1;for(const q of[.5,.64,.78,.9]){c.beginPath();c.moveTo(Bx.x0+Bx.w*q,Bx.y0+1);c.quadraticCurveTo(Bx.x0+Bx.w*(q-.04),Bx.y0+Bx.h*.5,Bx.x0+Bx.w*q,Bx.y1);c.stroke()}
    if(v.tier===3){c.strokeStyle=css(P.acc2,.95);c.lineWidth=1.5;for(const q of[.55,.7,.84]){c.beginPath();c.moveTo(Bx.x0+Bx.w*q,Bx.y0+3);c.lineTo(Bx.x0+Bx.w*(q+.03),Bx.y0+Bx.h*.55);c.stroke()}glow(bx+4,by-3,16,P.acc2,.3)}
  }});
  if(v.tier===2){for(const dx of[2,10,18]) spike(bx+dx,by-13-(dx===10?1:0)+Math.abs(dx-10)*.35,-Math.PI/2,9,6,P.acc2,{ol:1.4})}
  for(let k=0;k<4;k++)leg(bx-13+k*9,false,k);
  // face
  part(ell(bx-14,by-2,12.5,12),P.acc,{ol:2.6,hl:.9,sh:.8});
  const ang=(t==='atk'&&f.a>0)||v.tier===3?.42:0,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(bx-19,by-4,6,7.4,{look:-.5,col:P.eye,ang,angSide:-1,body:P.acc,lid});eye(bx-8,by-3.5,5.2,6.6,{look:-.5,col:P.eye,ang,angSide:1,body:P.acc,lid});
  blush(bx-22,by+4,3.4,2,P.blush||[255,120,130],.55);mouth(bx-14,by+6,6,(t==='atk'&&f.a>0)?'open':'smile',(t==='atk'&&f.a>0)?3.4:2);
  // arm + pincer (near)
  const pincer=(base,elbow,tipc,open)=>{
    part(tube([base,elbow,tipc],6.8,5.6),P.body,{ol:2.2,hl:0,sh:.7});
    const a0=Math.atan2(tipc[1]-elbow[1],tipc[0]-elbow[0])-.2;
    const place=(pts,rot)=>pts.map(p=>{const c=Math.cos(rot),s=Math.sin(rot);return[tipc[0]+p[0]*c-p[1]*s,tipc[1]+p[0]*s+p[1]*c]});
    part(blob(place([[-2,-4],[7,-11],[18,-8],[24,-1],[12,-4],[3,0]],a0-open*.5)),P.acc,{ol:2.4,hl:.6,sh:.7});
    part(blob(place([[-2,4],[7,10],[18,7],[24,0],[12,3],[3,0]],a0+open*.55)),P.acc,{ol:2.4,hl:.4,sh:.7});
    part(ell(tipc[0],tipc[1],6,6),P.acc,{ol:2.4,hl:.5,sh:.7})};
  const reach=t==='atk'?-lunge*.2:0;
  pincer([bx-17,by+4],[bx-28,by+6],[bx-31-lunge*.2,by-9+(t==='atk'&&f.a>0?3:0)+reach],claw);
}
