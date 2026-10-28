// ---------------- BOSSES (192x160 cells; 4 cols; row0 idle, row1 attack) ----------------
function wingFan(sx,sy,angs,len,fl,P,o={}){ // feathered wing
  const n=angs.length;
  for(let i=n-1;i>=0;i--){const a=angs[i]-fl*.12*(i-n/2)-fl*.3,L=len*(1-i*.045);
    const ex=sx+Math.cos(a)*L,ey=sy+Math.sin(a)*L,nx=-Math.sin(a),ny=Math.cos(a),W=o.w||13;
    const mid=[sx+Math.cos(a)*L*.55,sy+Math.sin(a)*L*.55];
    part(blob([[sx+nx*5,sy+ny*5],[mid[0]+nx*W,mid[1]+ny*W],[ex+nx*3,ey+ny*3],[ex-nx*3,ey-ny*3],[mid[0]-nx*W*.7,mid[1]-ny*W*.7],[sx-nx*5,sy-ny*5]]),i%2?mixc(P.wing,P.dark,.12):P.wing,{ol:2.4,hl:.5,sh:.8,fx:(c,B)=>{c.strokeStyle=css(dk(P.wing,.6),.5);c.lineWidth=1.1;c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke()}})}
}
SP.griffin=function(f,P,v,E){
  const t=f.kind,B=E.base;let fl,bob=0,lunge=0,jaw=0,tw=0;
  if(t==='idle'){fl=Math.sin(f.ph*TAU);bob=Math.sin(f.ph*TAU)*-2.2;tw=Math.sin(f.ph*TAU)*.09}
  else{const a=f.a;fl=a>0?-1.1:a<0?1.1:.2;lunge=a>0?-a*16:-a*-6;jaw=a>0?a:0;bob=a>0?a*2:a*-1;tw=a>0?.2:-.1}
  const by=B-48+bob,bx=106+lunge*.5;
  // far wing
  const sh=[bx+8,by-14];
  wingFan(sh[0]+6,sh[1]+2,[-2.1,-1.8,-1.5,-1.2,-.9,-.6,-.3].map(a=>a),62,fl,{wing:mixc(P.wing,P.dark,.25),dark:P.dark},{w:12});
  // tail
  const tb=[bx+36,by-2],TR=rotP([[tb[0],tb[1]],[tb[0]+16,tb[1]+3],[tb[0]+26,tb[1]-8],[tb[0]+25,tb[1]-26]],tb[0],tb[1],tw);
  part(tube(TR,9,4),P.body,{ol:2.6,hl:.5,sh:.8});
  const q=TR[3];part(blob([[q[0]-2,q[1]+2],[q[0]-10,q[1]-8],[q[0]-4,q[1]-20],[q[0]+4,q[1]-14],[q[0]+10,q[1]-18],[q[0]+9,q[1]-4]]),P.acc,{ol:2.4,hl:.6,sh:.8});
  // hind legs
  for(const [dx,col] of[[18,mixc(P.body,P.dark,.3)],[2,P.body]]){const lf=t==='atk'?(dx>10?f.a*5:0):0;
    part(blob(ell(bx+dx+8,by+14,17,19,.2,30)),col,{ol:2.6,hl:.6,sh:.9});part(ell(bx+dx+2,B-6+lf,14,6.5),col,{ol:2.4,hl:.4,sh:.7});}
  // body
  part(blob(ell(bx,by,44,26,0,40)),P.body,{ol:3.2,hl:1,sh:1,gr:1,fx:(c,Bx)=>{c.fillStyle=css(P.belly,.9);c.beginPath();c.ellipse(Bx.x0+Bx.w*.42,Bx.y1-3,Bx.w*.4,Bx.h*.28,0,0,TAU);c.fill();
    c.fillStyle=css(P.dark,.16);for(let k=0;k<6;k++){c.beginPath();c.ellipse(Bx.x0+Bx.w*(.4+k*.09),Bx.y0+Bx.h*.28+(k%2)*5,3,6,.4,0,TAU);c.fill()}}});
  // near wing
  wingFan(sh[0]-6,sh[1]+6,[-2.25,-1.95,-1.65,-1.35,-1.05,-.75,-.45].map(a=>a),70,fl,P,{w:14});
  // front legs (eagle)
  const fx0=bx-34;
  for(const [dx,far] of[[10,true],[0,false]]){const lf=t==='atk'?-jaw*6:0;
    part(tube([[fx0+dx+4,by+8],[fx0+dx,by+26],[fx0+dx-2+lf,B-14]],14,10),far?mixc(P.belly,P.dark,.2):P.belly,{ol:2.5,hl:.5,sh:.8});
    for(const k of[-1,0,1]) part(tube([[fx0+dx-2+lf,B-14],[fx0+dx-8+k*6+lf,B-8],[fx0+dx-12+k*8+lf,B-2]],6,3),P.beak,{ol:1.9,hl:0,sh:.5,bev:.5});}
  // head
  const hx=bx-54+lunge*.5,hy=by-30+(t==='atk'?f.a*3:0);
  // ruff
  for(let i=0;i<7;i++){const a=.35+i*.33;spike(hx+16+Math.cos(a)*10,hy+14+Math.sin(a)*8,a-.2,17,10,i%2?P.acc:P.belly,{ol:2,curve:true,sh:.5,hl:.3})}
  part(blob(ell(hx+10,hy+14,25,23,0,34)),P.belly,{ol:2.8,hl:.8,sh:.8});
  // head
  part(blob([[hx+26,hy+6],[hx+22,hy-12],[hx+6,hy-19],[hx-12,hy-12],[hx-16,hy+2],[hx-12,hy+14],[hx+4,hy+22],[hx+20,hy+20]]),P.belly,{ol:3,hl:1,sh:.9,gr:1});
  // crest feathers
  for(let i=0;i<4;i++) spike(hx+16-i*7,hy-14+i*1.5,-1.35-i*.22,19-i*2,8,P.acc,{ol:2,curve:true,sh:.4,hl:.3});
  // beak
  const jo=jaw*8;
  part(blob([[hx-12,hy+13],[hx-27,hy+19+jo],[hx-29,hy+25+jo],[hx-12,hy+23+jo*.8],[hx,hy+19]]),mixc(P.beak,P.dark,.1),{ol:2.3,hl:.5,sh:.8,bev:.7});
  part(blob([[hx-10,hy-2],[hx-26,hy+6],[hx-36,hy+18],[hx-27,hy+17],[hx-22,hy+12],[hx-11,hy+14]]),P.beak,{ol:2.6,hl:.9,sh:.8,bev:.8});
  if(jaw>.3)part(blob([[hx-12,hy+14],[hx-27,hy+19+jo*.1],[hx-12,hy+17+jo*.7]]),[120,30,40],{ol:0,hl:0,sh:0,bev:0});
  part(ell(hx-14,hy+5,2.2,1.8),P.dark,{ol:0,hl:0,sh:0,bev:0});
  // eye
  const ang=.55,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(hx+2,hy-1,8.5,9.8,{look:-.5,col:P.eye,ang,angSide:-1,body:P.belly,lid,iris:P.iris});
  blush(hx+8,hy+11,5,3,P.blush,.5);
}
function dragonWing(sx,sy,fl,P,far,sc,spread){
  const dir=1,ang=-fl*.5-.15;
  const pts=[[0,-3],[22,-30],[60,-48],[52,-24],[66,-12],[48,-6],[54,14],[34,4],[28,22],[14,6],[4,14]].map(p=>[sx+p[0]*sc*spread,sy+p[1]*sc]);
  const R=rotP(pts,sx,sy,ang);
  part(blob(R),far?mixc(P.wing,P.dark,.35):P.wing,{ol:2.8,hl:.5,sh:.9,fx:(c,B)=>{c.strokeStyle=css(dk(P.wing,.55),.7);c.lineWidth=2;for(const k of[2,4,6,8]){c.beginPath();c.moveTo(R[0][0],R[0][1]);c.lineTo(R[k][0],R[k][1]);c.stroke()}}});
  part(tube([R[0],R[1],R[2]],6,3.5),far?P.dark:P.body,{ol:2.2,hl:.3,sh:.6,bev:.5});
}
SP.dragon=function(f,P,v,E){
  const t=f.kind,B=E.base;let fl,bob=0,lunge=0,jaw=0,tw=0,sq=0;
  if(t==='idle'){fl=Math.sin(f.ph*TAU);bob=Math.sin(f.ph*TAU)*-2;tw=Math.sin(f.ph*TAU)*.1}
  else{const a=f.a;fl=a>0?-.9:a<0?.9:.1;lunge=a>0?-a*18:-a*-7;jaw=a>0?a:0;bob=a>0?a*3:a*-2;tw=a>0?.35:-.12;sq=a>0?a:0}
  const bx=108+lunge*.4,by=B-52+bob;
  wingDraw: {
    dragonWing(bx+14,by-22,fl,P,true,1.15,1.0);
  }
  // tail
  const tb=[bx+34,by+14],TR=rotP([[tb[0],tb[1]],[tb[0]+16,tb[1]+8],[tb[0]+34,tb[1]+4],[tb[0]+44,tb[1]-12],[tb[0]+36,tb[1]-30]],tb[0],tb[1],tw);
  part(tube(TR,22,5),P.body,{ol:3,hl:.6,sh:.9});
  const sp=crSample(TR,false,4);
  for(let i=3;i<sp.length-2;i+=4){const u=i/sp.length;spike(sp[i][0],sp[i][1]-lerp(10,3,u),-1.4,lerp(11,6,u),lerp(8,5,u),P.acc,{ol:1.8,sh:.4,hl:.3})}
  const q=TR[4];part(blob([[q[0]-4,q[1]+4],[q[0]-14,q[1]-6],[q[0]-2,q[1]-20],[q[0]+12,q[1]-8],[q[0]+4,q[1]+4]]),P.acc,{ol:2.4,hl:.5,sh:.8});
  // hind leg
  part(blob(ell(bx+22,by+22,22,22,.2,30)),mixc(P.body,P.dark,.2),{ol:2.8,hl:.5,sh:.9});
  part(ell(bx+15,B-6,18,7),mixc(P.body,P.dark,.2),{ol:2.6,hl:.3,sh:.7});for(const k of[-1,0,1])spike(bx+k*7+7,B-4,Math.PI/2+.25*k,-7,0,P.belly,{ol:0});
  // body
  part(blob(ell(bx,by,46,38,0,44)),P.body,{ol:3.4,hl:1,sh:1,gr:1,fx:(c,Bx)=>{
    c.fillStyle=css(P.belly,.95);c.beginPath();c.ellipse(Bx.x0+Bx.w*.36,Bx.y1-Bx.h*.36,Bx.w*.3,Bx.h*.36,.1,0,TAU);c.fill();
    c.strokeStyle=css(dk(P.belly,.55),.5);c.lineWidth=1.4;for(let k=0;k<5;k++){c.beginPath();c.moveTo(Bx.x0+Bx.w*.12,Bx.y0+Bx.h*(.5+k*.1));c.quadraticCurveTo(Bx.x0+Bx.w*.34,Bx.y0+Bx.h*(.56+k*.1),Bx.x0+Bx.w*.58,Bx.y0+Bx.h*(.5+k*.1));c.stroke()}
    if(v.kind==='cave'){c.fillStyle=css(P.dark,.3);for(const [a,b,r] of[[.6,.3,7],[.75,.5,5],[.5,.2,4],[.8,.28,4]]){c.beginPath();c.ellipse(Bx.x0+Bx.w*a,Bx.y0+Bx.h*b,r,r*.8,.3,0,TAU);c.fill()}}
    if(v.kind==='magma'){c.strokeStyle=css(P.acc2,.95);c.lineWidth=2.2;c.beginPath();c.moveTo(Bx.x0+Bx.w*.62,Bx.y0+Bx.h*.1);c.lineTo(Bx.x0+Bx.w*.7,Bx.y0+Bx.h*.35);c.lineTo(Bx.x0+Bx.w*.62,Bx.y0+Bx.h*.55);c.lineTo(Bx.x0+Bx.w*.8,Bx.y0+Bx.h*.7);c.moveTo(Bx.x0+Bx.w*.7,Bx.y0+Bx.h*.35);c.lineTo(Bx.x0+Bx.w*.86,Bx.y0+Bx.h*.3);c.stroke();glow(Bx.x0+Bx.w*.68,Bx.y0+Bx.h*.4,26,P.acc2,.3)}}});
  // back spines
  for(let i=0;i<5;i++){const a=-1.15-i*.22,x=bx+8+i*9-6,y=by-34+i*3.5;spike(x,y+4,a-.2+.35,lerp(18,10,i/4),lerp(13,8,i/4),P.acc,{ol:2,sh:.4,hl:.3,curve:true})}
  // near wing
  dragonWing(bx+4,by-26,fl*.9,P,false,1.2,.95);
  // front legs
  const fx0=bx-34;
  for(const [dx,far] of[[12,true],[0,false]]){const lf=t==='atk'?-jaw*6:0;
    part(tube([[fx0+dx+6,by+8],[fx0+dx,by+28],[fx0+dx-2+lf,B-9]],16,12),far?mixc(P.body,P.dark,.25):P.body,{ol:2.6,hl:.5,sh:.9});
    part(ell(fx0+dx-5+lf,B-5,15,6.5),far?mixc(P.body,P.dark,.25):P.body,{ol:2.4,hl:.4,sh:.7});
    for(const k of[-1,0,1]) spike(fx0+dx-13+k*7+lf,B-4,Math.PI-.15+k*.0,9,6,P.belly,{ol:1.5,sh:.3,hl:.2})}
  // head
  const hx=bx-58+lunge*.55,hy=by-26+(t==='atk'?f.a*4:0),jo=jaw*14;
  // horns (back)
  for(const [dx,dy,a] of[[18,-20,-.95],[8,-22,-1.35]]){const base=[hx+dx,hy+dy];part(tube([base,[base[0]+Math.cos(a)*14+10,base[1]+Math.sin(a)*14],[base[0]+Math.cos(a)*26+26,base[1]+Math.sin(a)*26+2]],9,2.5),P.acc,{ol:2.2,hl:.6,sh:.7,bev:.7})}
  if(v.kind==='cave'){for(const k of[0,1,2]) spike(hx+4+k*9,hy-25-Math.abs(k-1)*(-2),-1.5+(k-1)*.35,14-Math.abs(k-1)*4,8,P.acc2,{ol:1.8,sh:.4,hl:.5})}
  if(v.kind==='magma'){for(const [dx,h] of[[2,14],[11,19],[20,13]])flame(hx+dx,hy-24,h,5.4,P.acc2,[255,240,160],{lean:3})}
  // lower jaw
  part(blob(rotP([[hx-4,hy+12],[hx-36,hy+14],[hx-42,hy+20],[hx-30,hy+30],[hx-6,hy+30],[hx+8,hy+24]],hx+8,hy+18,jo*.016)),P.belly,{ol:2.8,hl:.4,sh:.8,bev:.7});
  if(jaw>.25){part(blob([[hx-38,hy+15],[hx-16,hy+14],[hx+2,hy+17],[hx-12,hy+17+jo*.7],[hx-32,hy+18+jo*.8]]),[120,25,40],{ol:0,hl:0,sh:0,bev:0});
    for(const dx of[-34,-24,-14]) part([[hx+dx-2.4,hy+14],[hx+dx,hy+22],[hx+dx+2.4,hy+14]],'#fff',{ol:1,hl:0,sh:0,bev:0});
    if(v.kind==='magma'&&f.a>.5){glow(hx-46,hy+22,34,P.acc2,.7);for(const [dx,dy,r] of[[-52,22,9],[-64,26,6],[-72,24,4]])dot(hx+dx,hy+dy,r,[255,210,80],.95)}}
  // skull
  part(blob([[hx+26,hy+6],[hx+22,hy-14],[hx+6,hy-22],[hx-12,hy-17],[hx-34,hy-6],[hx-44,hy+3],[hx-43,hy+13],[hx-24,hy+15],[hx-6,hy+14],[hx+14,hy+22],[hx+26,hy+17]]),P.body,{ol:3.2,hl:1,sh:1,gr:1,fx:(c,Bx)=>{if(v.kind==='cave'){c.fillStyle=css(P.dark,.28);c.beginPath();c.ellipse(Bx.x0+Bx.w*.7,Bx.y0+Bx.h*.3,5,4,0,0,TAU);c.ellipse(Bx.x0+Bx.w*.4,Bx.y0+Bx.h*.2,3,2.5,0,0,TAU);c.fill()}}});
  part(ell(hx-37,hy+2,3.6,2.8),P.dark,{ol:1.2,hl:.3,sh:0,bev:0});
  // brow + eye
  const ang=.5,lid=(t==='idle'&&f.i===3)?.8:0;
  eye(hx-12,hy-4,9.4,10.8,{look:-.5,col:P.eye,ang,angSide:-1,body:P.body,lid,iris:P.iris});
  blush(hx-4,hy+10,5.5,3.2,P.blush,.5);
  if(jaw<=.25)line([[hx-40,hy+14],[hx-26,hy+17],[hx-8,hy+15]],P.dark,1.6,{raw:true,a:.85});
  // cheek spikes
  spike(hx+14,hy+6,.35,13,8,P.acc,{ol:2,curve:true,sh:.4,hl:.2});spike(hx+12,hy+14,.9,11,7,P.acc,{ol:2,curve:true,sh:.4,hl:.2});
}
window.BOSSES=[
 {id:'hills_boss',sp:'griffin',P:pal({body:'#d89a56',belly:'#fff4e0',acc:'#f2b45e',wing:'#fbe6c4',beak:'#ffd04a',dark:'#7a4a22',eye:[50,30,20],iris:[255,190,60]}),v:{tier:1,kind:'hills'}},
 {id:'cave_boss',sp:'dragon',P:pal({body:'#8a8a9c',belly:'#d8d8e4',acc:'#b06ae0',acc2:'#e0a8ff',wing:'#6a6a86',dark:'#2c2c3e',eye:[60,30,90],iris:[200,120,255]}),v:{tier:2,kind:'cave'}},
 {id:'magma_boss',sp:'dragon',P:pal({body:'#b83a2a',belly:'#ffc86a',acc:'#4a2224',acc2:'#ffb02a',wing:'#8a2a24',dark:'#2a0e0c',eye:[255,220,80],iris:[255,150,30]}),v:{tier:3,kind:'magma'}}];
{const wrap=(n,k,ox)=>{const o=SP[n];SP[n]=function(f,P,v,E){cx.save();cx.translate(ox,E.base);cx.scale(k,k);cx.translate(-ox-0,-E.base);o(f,P,v,E);cx.restore()}};wrap('griffin',.9,104);wrap('dragon',.82,108)}
