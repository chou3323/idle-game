// ---------------- GOLEM ----------------
SP.golem=function(f,P,v,E){
  const t=f.kind,B=E.base;let la=0,ra=0,bob=0,lunge=0,lift=0,sq=0;
  if(t==='idle'){bob=f.s*.9;la=f.s*.12;ra=-f.s*.12}
  else if(t==='walk'){const s=Math.sin(f.ph*TAU);la=s*.5;ra=-s*.5;bob=-Math.abs(s)*2.2;}
  else{const a=f.a;lift=a<0?-a:0;la=ra=a<0?a*1.5:-a*1.2;lunge=a>0?-a*5:0;bob=a>0?a*2:a*1.5;sq=a>0?a:0}
  const cx0=48+lunge,ty=B-34+bob;
  const rock=(x,y,rx,ry,seed,n=9)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*TAU,r=1+((Math.sin(seed*7.1+i*2.3)+1)*.5-.5)*.28;o.push([x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r])}return o};
  const facets=(c,Bx)=>{c.strokeStyle=css(dk(P.body,.55),.5);c.lineWidth=1.2;c.beginPath();c.moveTo(Bx.x0+Bx.w*.2,Bx.y0+Bx.h*.1);c.lineTo(Bx.x0+Bx.w*.45,Bx.y0+Bx.h*.5);c.lineTo(Bx.x0+Bx.w*.8,Bx.y0+Bx.h*.3);c.moveTo(Bx.x0+Bx.w*.45,Bx.y0+Bx.h*.5);c.lineTo(Bx.x0+Bx.w*.35,Bx.y1);c.stroke();
    c.strokeStyle='rgba(255,255,255,.22)';c.beginPath();c.moveTo(Bx.x0+Bx.w*.2,Bx.y0+Bx.h*.14);c.lineTo(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.08);c.stroke()};
  const arm=(sx,sy,ang,near)=>{
    const L=15,ex=sx+Math.sin(ang)*-9+(near?-5:5),ey=sy+Math.cos(ang)*L*.55;
    const fx=sx+Math.sin(ang)*-17+(near?-8:8),fy=sy+Math.cos(ang)*L*1.5+2-lift*10*(ang<0?1:0);
    part(tube([[sx,sy],[ex,ey],[fx,fy]],11,9),near?P.body:mixc(P.body,P.dark,.25),{ol:2.8,hl:.6,sh:.9});
    part(rock(fx,fy+3,10.5,10,sx+ang),near?P.body:mixc(P.body,P.dark,.2),{ol:2.8,hl:.9,sh:.9,fx:facets})};
  // legs
  for(const dx of[-10,10]){const lf=t==='walk'?Math.max(0,Math.sin(f.ph*TAU+(dx>0?Math.PI:0)))*4:0;part(blob(rock(cx0+dx,B-9-lf,9.5,10,dx+3,8)),dx<0?P.body:mixc(P.body,P.dark,.15),{ol:2.8,hl:.7,sh:.9,fx:facets})}
  arm(cx0+19,ty-12,ra,false);
  // torso
  part(blob(rock(cx0,ty+2,22,20,1.7,11)),P.body,{ol:3.2,hl:1,sh:1,gr:1,fx:(c,Bx)=>{facets(c,Bx);
    if(v.tier===3){c.strokeStyle=css(P.acc2,.95);c.lineWidth=2;c.beginPath();c.moveTo(Bx.x0+Bx.w*.3,Bx.y0+Bx.h*.3);c.lineTo(Bx.x0+Bx.w*.45,Bx.y0+Bx.h*.55);c.lineTo(Bx.x0+Bx.w*.38,Bx.y1-3);c.moveTo(Bx.x0+Bx.w*.45,Bx.y0+Bx.h*.55);c.lineTo(Bx.x0+Bx.w*.75,Bx.y0+Bx.h*.65);c.stroke();glow(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.55,18,P.acc2,.35)}
    if(v.tier===1){c.fillStyle=css(P.acc,.9);c.beginPath();c.ellipse(Bx.x0+Bx.w*.7,Bx.y0+Bx.h*.18,9,4.5,0,0,TAU);c.ellipse(Bx.x0+Bx.w*.25,Bx.y1-6,6,3,0,0,TAU);c.fill()}}});
  // head
  const hy=ty-24-lift*2,hx=cx0-3-lunge*.2;
  if(v.tier===3){for(const [dx,h] of[[-6,16],[0,22],[6,15]]) flame(hx+dx,hy-8,h,5,P.acc,P.acc2,{lean:dx*.3})}
  part(blob(rock(hx,hy,15,12.5,4.2,9)),P.body,{ol:3,hl:1,sh:1,fx:facets});
  if(v.tier===2){for(const [dx,h,a] of[[-9,13,-2.2],[0,16,-1.57],[9,12,-.9]]) spike(hx+dx,hy-8,a,h,6,P.acc2,{ol:1.7,sh:.4,hl:.2})}
  // face
  const ang=(t==='atk'&&f.a>0)||v.tier===3?.35:.1,lid=(t==='idle'&&f.i===3)?.85:0;
  const glowc=P.acc2;
  glow(hx-5,hy+1,10,glowc,.35);glow(hx+6,hy+1,9,glowc,.35);
  eye(hx-5.5,hy+.5,4.6,5.2,{look:-.4,col:P.eye,ang,angSide:-1,body:P.body,lid,iris:glowc});eye(hx+6,hy+.5,4.2,4.8,{look:-.4,col:P.eye,ang,angSide:1,body:P.body,lid,iris:glowc});
  line([[hx-6,hy+8],[hx-2,hy+9.4],[hx+3,hy+9.2],[hx+7,hy+8]],P.dark,1.4,{raw:true,a:.85});
  if(v.tier===1){// moss tufts
    for(const [dx,dy] of[[-9,-9],[2,-12],[9,-8]]) part(blob([[hx+dx-3,hy+dy+2],[hx+dx-2,hy+dy-4],[hx+dx+1,hy+dy-8],[hx+dx+3,hy+dy-3],[hx+dx+3,hy+dy+2]]),P.acc,{ol:1.4,sh:.4,hl:.4,bev:.5})}
  arm(cx0-19,ty-12,la,true);
  if(v.tier===2){for(const [dx,dy,a,h] of[[-13,-17,-2.4,13],[12,-16,-.7,14],[-3,-19,-1.7,11]]) spike(cx0+dx,ty+dy,a,h,5.5,P.acc2,{ol:1.6,sh:.4,hl:.3})}
}
// ---------------- PLANT ----------------
SP.plant=function(f,P,v,E){
  const t=f.kind,B=E.base;let sw=0,gape=0,lunge=0,flare=0,bob=0,hop=0;
  if(t==='idle'){sw=Math.sin(f.ph*TAU)*2.6;gape=.12+f.s*.1;bob=Math.abs(Math.sin(f.ph*TAU*.5))*-1;flare=f.s*1.5}
  else if(t==='walk'){const s=Math.sin(f.ph*TAU);sw=s*3;hop=Math.abs(Math.sin(f.ph*TAU))*5;gape=.1;flare=Math.cos(f.ph*TAU*2)*1.2}
  else{const a=f.a;lunge=a>0?-a*14:-a*-6;gape=a>0?a:0;flare=a>0?a*3:-1;hop=a>0?a*3:0;sw=a<0?-a*5:0}
  const B2=B-hop,hx=46+sw+lunge,hy=B2-47+bob+(gape>.6?3:0);
  // roots
  for(const dx of[-9,9]){const ld=t==='walk'?Math.max(0,Math.sin(f.ph*TAU+(dx>0?Math.PI:0)))*3:0;part(tube([[48+dx*.4,B-9],[48+dx*.9,B-6],[48+dx*1.3,B-2-ld]],6.5,3),P.dark,{ol:1.9,hl:0,sh:.6,bev:.5});}
  // leaves (arms)
  const leafL=(dir,ang)=>{const sx=48+dir*3+sw*.3,sy=B2-24,L=24,a=ang;const tip=[sx+dir*Math.cos(a)*L,sy-Math.sin(a)*L];
    const mid=[(sx+tip[0])/2,(sy+tip[1])/2],nx=-(tip[1]-sy)/L*.0,perp=[-(tip[1]-sy),(tip[0]-sx)].map(q=>q/L);
    part(blob([[sx,sy],[mid[0]+perp[0]*9,mid[1]+perp[1]*9],tip,[mid[0]-perp[0]*7,mid[1]-perp[1]*7]]),P.leaf,{ol:2.4,hl:.7,sh:.8,fx:(c,Bx)=>{c.strokeStyle=css(dk(P.leaf,.6),.6);c.lineWidth=1.2;c.beginPath();c.moveTo(sx,sy);c.lineTo(tip[0],tip[1]);c.stroke()}})};
  const la=.5+f.s*.1+(t==='walk'?Math.sin(f.ph*TAU)*.3:0)+(t==='atk'?(f.a>0?.9:-.1):0);
  leafL(1,la*.9);
  // stem
  part(tube([[48,B2-6],[48+sw*.4,B2-20],[hx+3,hy+14]],9,7),P.stem,{ol:2.5,hl:.6,sh:.8});
  leafL(-1,la);
  // flower back petals
  const n=v.tier===3?10:8,R=17+flare;
  for(let i=0;i<n;i++){const a=i/n*TAU+(v.tier===2?.2:0);const px=hx+Math.cos(a)*R,py=hy+Math.sin(a)*R*.95;
    part(ell(px,py,v.tier===3?5.2:6.5,v.tier===3?10:11.5,a+Math.PI/2,22),P.petal,{ol:2.3,hl:.8,sh:.8,fx:(c,Bx)=>{c.fillStyle=css(P.petal2,.5);c.beginPath();c.ellipse(Bx.x0+Bx.w*.5,Bx.y0+Bx.h*.5,Bx.w*.14,Bx.h*.3,0,0,TAU);c.fill()}})}
  // head disc
  part(ell(hx,hy,16.5,15.5),P.body,{ol:3,hl:1,sh:1,gr:1});
  // mouth (big maw)
  const mo=3+gape*10;
  part(ell(hx-1,hy+7,10.5,mo*1.0+1.5),[100,20,45],{ol:2.1,hl:0,sh:.3,bev:.3,fx:(c,Bx)=>{c.fillStyle=css([240,100,120],.9);c.beginPath();c.ellipse(Bx.x0+Bx.w*.5,Bx.y1-1.5,Bx.w*.3,Bx.h*.28,0,0,TAU);c.fill()}});
  for(let i=0;i<5;i++){const x=hx-8+i*4,up=i%2===0;part(up?[[x-1.6,hy+7-mo*.95],[x,hy+7-mo*.95+4.6],[x+1.6,hy+7-mo*.95]]:[[x-1.5,hy+7+mo*.9],[x,hy+7+mo*.9-4.2],[x+1.5,hy+7+mo*.9]],'#fff',{ol:.8,hl:0,sh:0,bev:0})}
  // eyes
  const ang=(t==='atk'&&f.a>0)||v.tier===3?.45:0,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(hx-6,hy-5,5.4,6.6,{look:-.4,col:P.eye,ang,angSide:-1,body:P.body,lid});eye(hx+6,hy-5,5,6.2,{look:-.4,col:P.eye,ang,angSide:1,body:P.body,lid});
  blush(hx-12,hy+1,3.4,2,P.blush,.55);blush(hx+12,hy+1,3.4,2,P.blush,.55);
  if(v.tier===2){for(const [dx,dy] of[[-8,-14],[8,-14]]) spike(hx+dx,hy+dy,-Math.PI/2+(dx<0?-.3:.3),9,5,P.acc2,{ol:1.4})}
  if(v.tier===3){for(const dx of[-4,3]) flame(hx+dx,hy-14,12+Math.abs(dx),4,P.acc2,[255,240,160],{lean:dx*.3})}
}
// ---------------- WOLF (id: fox) ----------------
SP.fox=function(f,P,v,E){
  const t=f.kind,B=E.base;let lunge=0,jaw=0,tw=0,ls=0,bob=0,hup=0,spr=0;
  if(t==='idle'){bob=f.s*.8;tw=Math.sin(f.ph*TAU)*.14;hup=f.s*.6}
  else if(t==='walk'){ls=f.ph*TAU;bob=-Math.abs(Math.sin(ls*2))*1.3;tw=Math.sin(ls)*.12}
  else{const a=f.a;lunge=a>0?-a*12:-a*-5;jaw=a>0?a:0;spr=a>0?a:0;bob=a>0?-a*3:a*2;tw=a>0?.3:-.1}
  const bx=58+lunge*.6,by=B-31+bob;
  const legP=(hx,sx,far,k)=>{const ph=ls+k*Math.PI+(far?Math.PI*.5:0),sw=t==='walk'?Math.sin(ph)*9:0,li=t==='walk'?Math.max(0,Math.cos(ph))*6:0;
    const ext=t==='atk'?(k===0?-spr*8:spr*7):0;
    const foot=[sx+sw+ext-(k===0?0:0),B-2.5-li-(t==='atk'&&k===0?spr*5:0)],knee=[hx+(k===1?7:-2)+sw*.35,by+13+(k===1?0:2)];
    const col=far?mixc(P.dark,P.body,.4):P.body;
    part(tube([[hx,by+5],knee,foot],k===1?9.5:8.2,4.4),col,{ol:2.3,hl:.4,sh:.7,bev:.6});
    part(ell(foot[0]-2,foot[1]+.5,5.2,3.4),P.belly,{ol:1.8,hl:0,sh:.5,bev:.5})};
  legP(bx-16,bx-18,true,0);legP(bx+17,bx+22,true,1);
  // tail
  const tb=[bx+26,by-5],TR=rotP([[tb[0],tb[1]],[tb[0]+10,tb[1]-4],[tb[0]+17,tb[1]-14],[tb[0]+16,tb[1]-24],[tb[0]+10,tb[1]-30]],tb[0],tb[1],tw-.1);
  part(tube(TR,5,11,{}),P.body,{ol:2.6,hl:.6,sh:.8,fx:(c,Bx)=>{c.fillStyle=css(P.belly,.9);c.beginPath();c.ellipse(Bx.x1-3,Bx.y0+4,5,6,0,0,TAU);c.fill()}});
  if(v.tier===3){const q=TR[4];flame(q[0],q[1]+2,14,5,P.acc2,[255,240,160],{lean:-2})}
  // body
  part(blob([[bx-26,by-3],[bx-22,by-14],[bx-6,by-17],[bx+14,by-15],[bx+28,by-9],[bx+30,by+3],[bx+20,by+12],[bx,by+13],[bx-18,by+12]]),P.body,{ol:3.1,hl:1,sh:1,gr:1,fx:(c,Bx)=>{c.fillStyle=css(P.belly,.95);c.beginPath();c.ellipse(Bx.x0+Bx.w*.46,Bx.y1-2,Bx.w*.38,Bx.h*.3,0,0,TAU);c.fill();c.fillStyle=css(P.dark,.22);c.beginPath();c.ellipse(Bx.x0+Bx.w*.62,Bx.y0+4,Bx.w*.3,Bx.h*.2,.0,0,TAU);c.fill();
    if(v.tier===3){c.strokeStyle=css(P.acc2,.9);c.lineWidth=1.5;for(const q of[.45,.6,.75]){c.beginPath();c.moveTo(Bx.x0+Bx.w*q,Bx.y0+3);c.lineTo(Bx.x0+Bx.w*(q+.03),Bx.y0+Bx.h*.5);c.stroke()}}}});
  // near legs
  legP(bx-9,bx-10,false,0);legP(bx+24,bx+28,false,1);
  // mane/ruff
  const rx=bx-23,ry=by-6;
  const hx=bx-31+lunge*.2,hy=by-14+hup+(spr?spr*3:0);
  part(blob([[rx+5,ry-16],[rx-4,ry-12],[rx-8,ry-3],[rx-5,ry+6],[rx,ry+13],[rx+6,ry+6],[rx+12,ry+8],[rx+14,ry-4],[rx+12,ry-12]]),v.tier===1?P.belly:P.mane,{ol:2.6,hl:.8,sh:.8});
  if(v.tier>=2) for(let i=0;i<5;i++){const a=-2.2+i*.33;spike(rx+6+Math.cos(a)*7,ry-2+Math.sin(a)*12,a,9,5,v.tier===2?[225,245,255]:P.acc2,{ol:1.3,curve:true,sh:.3,hl:.2})}
  if(v.tier===3){for(const [dx,h] of[[2,12],[8,17],[14,11]]) flame(rx+dx,ry-14,h,4.4,P.acc2,[255,236,150],{lean:2})}
  // head
  const jr=jaw*.8;
  // ear far
  part([[hx+6,hy-9],[hx+9,hy-23],[hx+16,hy-10]],P.dark,{ol:2.2,hl:0,sh:.5});
  // lower jaw
  const jp=rotP([[hx-8,hy+4],[hx-22,hy+7],[hx-24,hy+10],[hx-11,hy+13],[hx+4,hy+11]],hx+4,hy+8,jr);
  part(blob(jp),P.belly,{ol:2.3,hl:0,sh:.7,bev:.6});
  // skull+snout
  part(blob([[hx+11,hy-3],[hx+8,hy-12],[hx-2,hy-14],[hx-11,hy-8],[hx-25,hy-1],[hx-27,hy+4],[hx-22,hy+6],[hx-8,hy+5],[hx+6,hy+9],[hx+12,hy+5]]),P.body,{ol:3,hl:1,sh:.9});
  if(jaw>.3){part(blob([[hx-21,hy+5.5],[hx-10,hy+5],[hx+2,hy+8],[hx-6,hy+7+jr*14],[hx-20,hy+7+jr*15]]),[110,22,45],{ol:0,hl:0,sh:0,bev:0});
    for(const dx of[-20,-14]) part([[hx+dx-1.8,hy+5],[hx+dx,hy+10.5],[hx+dx+1.8,hy+5]],'#fff',{ol:.9,hl:0,sh:0,bev:0})}
  part(ell(hx-26,hy+.5,2.8,2.5),P.dark,{ol:1.2,hl:.4,sh:0,bev:0});
  // ear near
  part([[hx+2,hy-10],[hx+1,hy-26],[hx+11,hy-11]],P.body,{ol:2.4,hl:.6,sh:.7});part([[hx+3.5,hy-12],[hx+3,hy-21],[hx+8,hy-12]],P.blush,{ol:0,hl:0,sh:0,bev:0,a:.7});
  const ang=jaw>.3||v.tier===3?.45:.1,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(hx-6,hy-4,5.2,6,{look:-.5,col:P.eye,ang,angSide:-1,body:P.body,lid,iris:P.iris});
  if(!(jaw>.3)) line([[hx-20,hy+5.4],[hx-14,hy+6.6],[hx-8,hy+6]],P.dark,1.2,{raw:true,a:.8});
  if(v.tier===3){spike(hx+4,hy-11,-1.9,10,5,P.acc2,{ol:1.4,curve:true})}
}
{const _fox=SP.fox;SP.fox=function(f,P,v,E){cx.save();cx.translate(50,E.base);cx.scale(.8,.8);cx.translate(-50,-E.base);_fox(f,P,v,E);cx.restore()}}
