/* MobArt — original procedural pixel-art monsters (plan A13.4). 88 designs: 46 regular(48px) + 28 elite(64px) + 14 boss(128px).
   Render at 4x supersample -> nearest sample to native px -> snap to the design palette -> 1px coloured outline.
   Palette per design: <=3/4/5 hues x 4 tones (+eye, +outline) => <=14 / 18 / 22 colours (caps 16 / 20 / 28). All designs are original (no official art). */
(function(root){'use strict';
const SS=4;
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const toHex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function tones(h){const b=hex(h);return{dark:toHex(mix(b,[20,10,40],.42)),base:h,light:toHex(mix(b,[255,250,225],.30)),high:toHex(mix(b,[255,255,245],.68))}}
function mkPal(d){const P={};for(const k in d.hues)P[k]=tones(d.hues[k]);P.eye=d.eye||'#fff8e8';P.out=toHex(mix(hex(d.hues[Object.keys(d.hues)[0]]),[8,6,24],.78));return P}
function palList(P){const l=[];for(const k in P){if(typeof P[k]==='string')l.push(P[k]);else for(const t in P[k])l.push(P[k][t])}return l}
// ---------- path helpers (native px; y down)
const E=(cx,cy,rx,ry,rot=0)=>{const p=new Path2D();p.ellipse(cx,cy,Math.max(.1,rx),Math.max(.1,ry),rot,0,6.2832);return p};
const RR=(x,y,w,h,r)=>{const p=new Path2D();p.roundRect(x,y,w,h,r);return p};
const PG=(pts)=>{const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p};
function cel(g,path,hue,o){o=o||{};const c=g.c,t=g.P[hue];c.save();c.fillStyle=t.dark;c.fill(path);c.clip(path);
 const cx=o.cx||0,cy=o.cy||0,k=o.k||1;c.fillStyle=t.base;c.save();c.translate(-1.1*k,-1.3*k);c.fill(path);c.restore();
 if(!o.flat){c.fillStyle=t.light;c.save();c.translate(cx-1.9*k,cy-2.3*k);c.scale(.6,.58);c.translate(-cx,-cy);c.fill(path);c.restore();
  if(o.hi!==false){c.fillStyle=t.high;c.beginPath();c.ellipse(cx-(o.rx||4)*.38,cy-(o.ry||4)*.4,Math.max(.6,(o.rx||4)*.14),Math.max(.5,(o.ry||4)*.11),-.5,0,6.3);c.fill()}}
 c.restore()}
const part=(g,hue,kind,cx,cy,rx,ry,o)=>{o=Object.assign({cx,cy,rx,ry},o||{});const p=kind==='e'?E(cx,cy,rx,ry,o.rot||0):RR(cx-rx,cy-ry,rx*2,ry*2,o.r!=null?o.r:Math.min(rx,ry)*.5);cel(g,p,hue,o)};
const flat=(g,col,path)=>{g.c.fillStyle=col;g.c.fill(path)};
function eye(g,x,y,r,look){const c=g.c;r=r||1.6;flat(g,g.P.eye,E(x,y,r,r*1.15));flat(g,g.P.out,E(x+(look||.35)*r*.5,y+.2,r*.55,r*.7));c.fillStyle=g.P.eye;c.fillRect(x+(look||.35)*r*.5-.3,y-.5,.7,.7)}
function limb(g,hue,x0,y0,x1,y1,w){const c=g.c,t=g.P[hue];c.lineCap='round';c.strokeStyle=t.dark;c.lineWidth=w+.9;c.beginPath();c.moveTo(x0+.5,y0+.5);c.lineTo(x1+.5,y1+.5);c.stroke();c.strokeStyle=t.base;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}
// ---------- archetypes. origin = ground anchor; y negative is up. z = pose {ph,lg,at,wf}
const A={};
A.blob=(g,d,z)=>{const s=d.s||1,w=15*s,h=(d.h||12)*s;const c=g.c;
 const body=new Path2D();body.moveTo(-w,0);body.bezierCurveTo(-w*1.05,-h*.45,-w*.55,-h*1.02,0,-h*1.02);body.bezierCurveTo(w*.55,-h*1.02,w*1.05,-h*.45,w,0);body.bezierCurveTo(w*.5,2.2,-w*.5,2.2,-w,0);
 if(d.spikes)for(let i=0;i<d.spikes;i++){const a=-2.6+i*(2.1/Math.max(1,d.spikes-1)),bx=Math.cos(a)*w*.8,by=Math.sin(a)*h*.8;cel(g,PG([[bx-2,by+2],[bx+Math.cos(a)*4,by+Math.sin(a)*5-1],[bx+2,by+2]]),d.acc||'b',{flat:true})}
 cel(g,body,'a',{cx:0,cy:-h*.5,rx:w*.8,ry:h*.5});
 if(d.core){flat(g,g.P[d.core].light,E(0,-h*.42,3.2*s,3.2*s));flat(g,g.P[d.core].high,E(-.6,-h*.5,1.4*s,1.4*s))}
 const ey=-h*.55;eye(g,-w*.38,ey,2.1*s);eye(g,w*.28,ey,2.1*s);
 g.c.strokeStyle=g.P.out;g.c.lineWidth=.9;g.c.beginPath();g.c.arc(-w*.05,ey+3.6*s,2.1*s,.15,2.9);g.c.stroke();
 if(d.sprout){const sx=-w*.1;limb(g,'b',sx,-h*1.0,sx+1,-h-4*s,1.2);cel(g,E(sx+3.4,-h-5.5*s,3.6*s,1.9*s,-.5),'b',{hi:false});cel(g,E(sx-2.6,-h-4.2*s,3*s,1.6*s,.6),'b',{hi:false})}
 if(d.crown){cel(g,PG([[-6,-h*.98],[-5,-h-5],[-2.5,-h-1.5],[0,-h-6],[2.5,-h-1.5],[5,-h-5],[6,-h*.98]]),'b',{flat:true})}
 if(d.horn){cel(g,PG([[-w*.55,-h*.9],[-w*.7,-h-5],[-w*.3,-h*.95]]),'b',{flat:true});cel(g,PG([[w*.55,-h*.9],[w*.7,-h-5],[w*.3,-h*.95]]),'b',{flat:true})}
 if(d.drip){cel(g,E(w*.7,2,2.2,2.8),'a',{flat:true})}};
A.beast=(g,d,z)=>{const s=d.s||1,L=13*s,H=9*s;const sw=Math.sin(z.lg)*3*s,sw2=Math.sin(z.lg+3.14)*3*s;
 // back legs, tail, body, front legs, head
 if(d.tail==='bush'){cel(g,E(-L*.95,-H*1.2,5*s,3.4*s,-.6),'b',{})}else if(d.tail==='whip'){limb(g,'a',-L*.8,-H*1.1,-L*1.5,-H*1.8+Math.sin(z.ph*6.28)*2,2*s)}else limb(g,'a',-L*.85,-H*1.1,-L*1.2,-H*1.5,2.2*s);
 limb(g,'a',-L*.55+sw2*.4,-H*.6,-L*.55+sw2,-1,3.4*s);limb(g,'a',L*.5+sw2*.4,-H*.6,L*.5+sw2,-1,3.4*s);
 part(g,'a','e',0,-H*1.05,L,H,{});
 if(d.stripes)for(let i=0;i<3;i++){g.c.fillStyle=g.P.b.dark;g.c.fillRect(-L*.45+i*L*.45,-H*1.9,1.6*s,H*.8)}
 if(d.mane)cel(g,E(L*.6,-H*1.3,H*.95,H*.95),'b',{});
 limb(g,'a',-L*.3+sw*.4,-H*.6,-L*.3+sw,-1,3.4*s);limb(g,'a',L*.72+sw*.4,-H*.6,L*.72+sw,-1,3.4*s);
 const hx=L*.95+(z.at||0)*3,hy=-H*1.6;
 if(d.ear==='long'){cel(g,E(hx-1.5,hy-9*s,2*s,6.5*s,-.18),'a',{});cel(g,E(hx+3,hy-8.4*s,1.9*s,6*s,.2),'a',{})}
 else if(d.ear==='point'){cel(g,PG([[hx-3.5,hy-2],[hx-2,hy-8*s],[hx,hy-2.5]]),'a',{flat:true});cel(g,PG([[hx+.5,hy-2.5],[hx+3,hy-8*s],[hx+4.5,hy-1.5]]),'a',{flat:true})}
 else{cel(g,E(hx-2,hy-4.4*s,2.2*s,2.2*s),'a',{hi:false});cel(g,E(hx+3,hy-4.2*s,2.2*s,2.2*s),'a',{hi:false})}
 part(g,'a','e',hx,hy,6.2*s,5.4*s,{});part(g,'b','e',hx+4.6*s,hy+1.8*s,3.6*s,2.8*s,{hi:false});
 flat(g,g.P.out,E(hx+7.4*s,hy+.8*s,1,.9));eye(g,hx+1.4*s,hy-1.2*s,1.7*s,.6);
 if(d.tusk){cel(g,PG([[hx+4*s,hy+3],[hx+7.5*s,hy+1],[hx+5*s,hy+5.5*s]]),'b',{flat:true})}
 if(d.horn){cel(g,PG([[hx-1,hy-4.5*s],[hx+1.5,hy-10*s],[hx+3,hy-4]]),'b',{flat:true})}
 if(d.armor)cel(g,E(-L*.1,-H*1.7,L*.8,H*.55),'b',{})};
A.bug=(g,d,z)=>{const s=d.s||1,k=d.kind||'beetle';const sw=Math.sin(z.lg)*2.4;
 if(k==='spider'){for(let i=0;i<4;i++){const o=(i-1.5)*3.4,ph=Math.sin(z.lg+i*1.3)*2;for(const sd of [-1,1]){limb(g,'b',sd*3,-9*s,sd*(8+i)*s,-14*s+ph,1.5);limb(g,'b',sd*(8+i)*s,-14*s+ph,sd*(12+i*1.5)*s,0,1.5)}}
  part(g,'a','e',-5*s,-10*s,7*s,6.5*s,{});part(g,'a','e',3.5*s,-10.5*s,4.6*s,4.2*s,{});for(let i=0;i<3;i++)eye(g,4+i*1.8,-12*s+i%2,1.1);if(d.mark){flat(g,g.P.b.base,PG([[-8*s,-12*s],[-5*s,-6*s],[-2*s,-12*s]]))}return}
 if(k==='crab'){for(const sd of [-1,1]){for(let i=0;i<3;i++)limb(g,'b',sd*(4+i*2.4),-5*s,sd*(9+i*2.8)*s,-1+Math.sin(z.lg+i)*1.4,1.4);
   limb(g,'b',sd*8*s,-9*s,sd*(14*s),-14*s-z.at*3,2);cel(g,E(sd*15*s,-15*s-z.at*3,4.4*s,3.4*s,sd*.5),'b',{hi:false});flat(g,g.P.out,PG([[sd*16*s,-15*s-z.at*3],[sd*20*s,-17*s-z.at*3],[sd*19*s,-13*s-z.at*3]]))}
  part(g,'a','e',0,-7*s,11*s,6.4*s,{});for(const sd of [-1,1]){limb(g,'b',sd*3,-12*s,sd*4,-16*s,1);eye(g,sd*4,-17*s,1.5)}return}
 if(k==='scorpion'){for(let i=0;i<4;i++)for(const sd of [-1,1])limb(g,'b',(i-1.5)*3.2,-5*s,(i-1.5)*3.4+sd*3,-1+Math.sin(z.lg+i*1.6)*1.3,1.1);
  const tp=[[-8,-6],[-13,-10],[-14,-17],[-10,-22],[-5,-21]];for(let i=0;i<tp.length-1;i++)limb(g,'a',tp[i][0]*s,tp[i][1]*s,tp[i+1][0]*s,tp[i+1][1]*s,3.4-i*.4);cel(g,PG([[-5*s,-21*s],[-1*s,-19*s],[-4*s,-17*s]]),'b',{flat:true});
  part(g,'a','e',0,-6*s,8.5*s,5*s,{});part(g,'a','e',8*s,-6*s,3.6*s,3.2*s,{});eye(g,9*s,-7.4*s,1.2);limb(g,'a',8*s,-6*s,14*s,-10*s-z.at*3,2);cel(g,E(15*s,-10.5*s-z.at*3,3.4*s,2.6*s),'b',{hi:false});return}
 // beetle
 for(let i=0;i<3;i++)for(const sd of [-1,1])limb(g,'b',(i-1)*4*s+1,-5*s,(i-1)*4.6*s+sd*0+sd*1,-1+Math.sin(z.lg+i*2.1+(sd>0?0:3.1))*1.6,1.3);
 part(g,'a','e',-1*s,-8.5*s,11*s,8*s,{});g.c.strokeStyle=g.P.a.dark;g.c.lineWidth=.9;g.c.beginPath();g.c.moveTo(-1*s,-16*s);g.c.lineTo(-1*s,-1);g.c.stroke();
 if(d.dots)for(const p of [[-6,-9],[4,-10],[-4,-4],[2,-5]]){flat(g,g.P.b.light,E(p[0]*s-1,p[1]*s,1.6*s,1.6*s))}
 part(g,'b','e',9*s,-5.4*s,4.4*s,3.8*s,{});eye(g,10.4*s,-6.4*s,1.3,.7);if(d.horn){cel(g,PG([[10*s,-8*s],[15*s,-14*s-z.at*2],[12.5*s,-7*s]]),'b',{flat:true})}
 limb(g,'b',12*s,-4*s,15*s,-3*s+z.at*2,1.2)};
A.flyer=(g,d,z)=>{const s=d.s||1,k=d.kind||'bat';const fl=Math.sin(z.ph*6.283*(d.fl||1))*(k==='bee'?7:9)*s;const by=-17*s+Math.sin(z.ph*6.283)*1.2;
 flat(g,'rgba(0,0,0,0)',new Path2D());
 const wingCol=d.wing||'b';
 for(const sd of [-1,1]){const wx=sd*3*s;const p=new Path2D();if(k==='bat'||k==='moth'){p.moveTo(wx*.2,by);p.bezierCurveTo(wx+sd*10*s,by-8*s-fl*.9,wx+sd*16*s,by-4*s-fl,wx+sd*17*s,by+2*s-fl*.8);p.bezierCurveTo(wx+sd*13*s,by+0*s,wx+sd*10*s,by+3*s,wx+sd*7*s,by+2*s);p.bezierCurveTo(wx+sd*4*s,by+4*s,wx+sd*2*s,by+3*s,0,by+3*s)}
   else{p.ellipse(wx+sd*5*s,by-5*s-fl*.5,8*s,3.6*s,sd*(-.6)+(fl>0?-.3:.3)*sd,0,6.28)}cel(g,p,wingCol,{hi:false,k:.6})}
 if(k==='bird'||k==='hawk'){part(g,'a','e',0,by,8*s,5.6*s,{});part(g,'a','e',7*s,by-3*s,4.2*s,3.8*s,{});flat(g,g.P.b.base,PG([[10*s,by-3.5*s],[15*s,by-2*s],[10*s,by-.8*s]]));eye(g,8.4*s,by-4*s,1.2,.7);cel(g,PG([[-6*s,by+1],[-14*s,by+3*s],[-6*s,by+4*s]]),'b',{flat:true})}
 else if(k==='bee'){part(g,'a','e',0,by,8*s,5.4*s,{});for(let i=0;i<3;i++){g.c.fillStyle=g.P.b.dark;g.c.fillRect(-4*s+i*3.4*s,by-5*s,1.8*s,10*s)}part(g,'a','e',7.4*s,by-1,3.8*s,3.5*s,{});eye(g,8.6*s,by-1.8,1.3,.7);flat(g,g.P.b.dark,PG([[-8*s,by],[-12*s,by+1.5],[-8*s,by+2.4]]));limb(g,'b',9*s,by-4*s,11*s,by-8*s,.9)}
 else if(k==='orb'){part(g,'a','e',0,by,6*s,6*s,{});eye(g,-1,by-1,1.7);eye(g,3,by-1,1.7);flat(g,g.P.b.light,E(0,by+8*s,3*s,2*s))}
 else{part(g,'a','e',0,by,5.6*s,6*s,{});part(g,'a','e',5*s,by-3.4*s,3.6*s,3.4*s,{});cel(g,PG([[3.2*s,by-6*s],[2.8*s,by-10*s],[5.2*s,by-6.5*s]]),'a',{flat:true});cel(g,PG([[6*s,by-6*s],[8.2*s,by-10*s],[8.6*s,by-5.6*s]]),'a',{flat:true});eye(g,6.3*s,by-3.8*s,1.2,.7);if(d.fang)flat(g,g.P.eye,PG([[6*s,by-.7],[6.8*s,by+1.8],[7.6*s,by-.7]]))}
 flat(g,'rgba(0,0,0,.0)',new Path2D())};
A.plant=(g,d,z)=>{const s=d.s||1,k=d.kind||'mush';const sw=Math.sin(z.ph*6.283)*1.2;
 if(k==='mush'){part(g,'b','e',0,-6*s,4.6*s,6*s,{});
  const cap=new Path2D();cap.ellipse(0+sw*.4,-13*s,12*s,8*s,0,Math.PI,0);cap.bezierCurveTo(10*s,-12*s,-10*s,-12*s,-12*s,-13*s);cel(g,cap,'a',{cx:0,cy:-16*s,rx:10*s,ry:5*s});
  for(const p of [[-6,-15],[2,-18],[7,-14],[-1,-13]])flat(g,g.P.b.high,E(p[0]*s,p[1]*s,1.7*s,1.4*s));eye(g,-2.4*s,-6.6*s,1.6*s);eye(g,2.4*s,-6.6*s,1.6*s);limb(g,'b',-3*s,0,-3*s,-3,2.4);limb(g,'b',3*s,0,3*s,-3,2.4);return}
 if(k==='flower'){limb(g,'b',0,0,0,-10*s,2.6*s);cel(g,E(-5*s,-5*s,4.4*s,2*s,-.6),'b',{hi:false});for(let i=0;i<6;i++){const a=i*1.047+sw*.05;cel(g,E(Math.cos(a)*7.8*s,-16*s+Math.sin(a)*7.8*s,4.6*s,3*s,a),'a',{hi:false})}
  part(g,'c','e',0,-16*s,5.4*s,5.4*s,{});eye(g,-2,-17*s,1.5);eye(g,2.4,-17*s,1.5);g.c.strokeStyle=g.P.out;g.c.lineWidth=.8;g.c.beginPath();g.c.arc(.2,-14.4*s,1.6,.2,2.9);g.c.stroke();return}
 if(k==='thorn'){for(let i=0;i<7;i++){const a=-3.1+i*.52,r=(8+((i*5)%4)*2)*s;cel(g,PG([[Math.cos(a)*3,-8*s+Math.sin(a)*3],[Math.cos(a)*r*1.3+sw,-8*s+Math.sin(a)*r*1.1],[Math.cos(a+.45)*3.4,-8*s+Math.sin(a+.45)*3.4]]),'b',{flat:true})}
  part(g,'a','e',0,-7*s,8*s,7*s,{});eye(g,-3*s,-8*s,1.7);eye(g,3*s,-8*s,1.7);flat(g,g.P.out,E(0,-3.6*s,2.4,1.2));return}
 // reed / treant
 limb(g,'a',-4*s,0,-4*s,-9*s,4*s);limb(g,'a',4*s,0,4*s,-9*s,4*s);part(g,'a','r',0,-17*s,8*s,10*s,{r:4*s});
 limb(g,'a',-8*s,-18*s,-13*s,-10*s+sw+z.at*-3,2.8*s);limb(g,'a',8*s,-18*s,13*s,-10*s-sw,2.8*s);
 for(const p of [[-8,-30],[0,-33],[8,-29],[-3,-28],[4,-27]])cel(g,E(p[0]*s,p[1]*s,6*s,4.4*s,p[0]*.05),'b',{hi:false});
 eye(g,-3*s,-19*s,1.9*s);eye(g,3.2*s,-19*s,1.9*s);flat(g,g.P.out,E(0,-13*s,3*s,1.4*s))};
A.biped=(g,d,z)=>{const s=d.s||1,k=d.kind||'imp';const sw=Math.sin(z.lg)*3*s;const sk=k==='skel';
 const bodyH=k==='knight'?'a':'a';
 limb(g,'a',-3*s,-11*s,-3*s+sw,-1,3.2*s);limb(g,'a',3*s,-11*s,3*s-sw,-1,3.2*s);
 if(d.tail)limb(g,'b',-5*s,-11*s,-12*s,-13*s+Math.sin(z.ph*6.28)*2,1.6);
 if(d.wing){for(const sd of [-1,1])cel(g,PG([[sd*3*s,-18*s],[sd*13*s,-27*s-Math.sin(z.ph*6.28)*3],[sd*10*s,-16*s]]),'b',{flat:true})}
 part(g,'a','r',0,-17*s,5.6*s,6.4*s,{r:3*s});
 if(sk){for(let i=0;i<4;i++){g.c.fillStyle=g.P.a.dark;g.c.fillRect(-4*s,-21*s+i*3*s,8*s,1)}}
 if(k==='mummy'){for(let i=0;i<4;i++){g.c.fillStyle=g.P.b.base;g.c.fillRect(-5.6*s,-21*s+i*3.2*s,11.2*s,1.4)}}
 if(k==='knight'||d.armor){cel(g,E(0,-21*s,7*s,3*s),'b',{})}
 limb(g,'a',-5*s,-20*s,-9*s,-12*s+sw*.5,2.8*s);
 const ax=z.at*7;limb(g,'a',5*s,-20*s,10*s+ax,-14*s,2.8*s);
 // weapon
 const wx=11*s+ax,wy=-14*s;
 if(d.weapon==='club'){limb(g,'b',wx,wy,wx+3,wy-11*s,2.6*s);cel(g,E(wx+3,wy-12*s,3.6*s,3.6*s),'b',{})}
 else if(d.weapon==='sword'){limb(g,'b',wx,wy,wx+2+z.at*3,wy-12*s,1.6);flat(g,g.P.eye,PG([[wx+.5,wy-12*s],[wx+2.5+z.at*3,wy-15*s],[wx+3.5+z.at*3,wy-12*s]]))}
 else if(d.weapon==='staff'){limb(g,'b',wx,wy+6,wx,wy-14*s,1.4);flat(g,g.P.c?g.P.c.light:g.P.b.light,E(wx,wy-15*s,2.4*s,2.4*s))}
 else if(d.weapon==='spear'){limb(g,'b',wx-2,wy+4,wx+3,wy-15*s,1.3);flat(g,g.P.eye,PG([[wx+2,wy-15*s],[wx+4,wy-19*s],[wx+5,wy-15*s]]))}
 // head
 part(g,'a','e',0,-27*s,5.8*s,5.2*s,{});
 if(sk){flat(g,g.P.out,E(-2*s,-27*s,1.6*s,1.9*s));flat(g,g.P.out,E(2.6*s,-27*s,1.6*s,1.9*s));flat(g,g.P.out,RR(-2,-23.4*s,5,1.2,.4))}else{eye(g,-2*s,-27.4*s,1.7*s);eye(g,2.8*s,-27.4*s,1.7*s)}
 if(k==='imp'||d.horns){cel(g,PG([[-4*s,-30*s],[-6*s,-37*s],[-1.5*s,-31*s]]),'b',{flat:true});cel(g,PG([[4*s,-30*s],[6.4*s,-37*s],[1.5*s,-31*s]]),'b',{flat:true})}
 if(k==='gob'){cel(g,PG([[-5*s,-28*s],[-11*s,-31*s],[-5*s,-25*s]]),'a',{flat:true});cel(g,PG([[5*s,-28*s],[11*s,-31*s],[5*s,-25*s]]),'a',{flat:true})}
 if(k==='knight'){cel(g,E(0,-29*s,6.4*s,4.4*s),'b',{});flat(g,g.P.out,RR(-3,-28*s,7,1.5,.4));g.c.fillStyle=g.P.c?g.P.c.base:g.P.b.light;g.c.fillRect(-1,-35*s,2,5*s)}
 if(d.hood)cel(g,E(0,-28*s,7*s,6.2*s),'b',{})};
A.golem=(g,d,z)=>{const s=d.s||1,sw=Math.sin(z.lg)*1.6;
 cel(g,RR(-9*s,-9*s+sw,7*s,9*s,2.2*s),'a',{});cel(g,RR(2*s,-9*s-sw,7*s,9*s,2.2*s),'a',{});
 cel(g,RR(-11*s,-26*s,22*s,19*s,5*s),'a',{cx:0,cy:-17*s,rx:9*s,ry:8*s});
 if(d.core)flat(g,g.P[d.core].high,E(0,-17*s,3.4*s,3.4*s));if(d.core){flat(g,g.P[d.core].light,E(0,-17*s,5*s,5*s));flat(g,g.P[d.core].high,E(-.6,-17.6*s,2.2*s,2.2*s))}
 if(d.cracks){g.c.strokeStyle=g.P.a.dark;g.c.lineWidth=1;g.c.beginPath();g.c.moveTo(-8*s,-24*s);g.c.lineTo(-4*s,-18*s);g.c.lineTo(-7*s,-12*s);g.c.moveTo(6*s,-25*s);g.c.lineTo(8*s,-19*s);g.c.stroke()}
 const ax=z.at*7;cel(g,E(-14*s-ax*.3,-14*s,5*s,7.4*s),'a',{});cel(g,E(14*s+ax,-12*s,5.6*s,7.4*s),'a',{});
 cel(g,RR(-6*s,-34*s,12*s,10*s,3*s),'a',{});
 if(d.visor){flat(g,g.P.b.light,RR(-4.4*s,-30.5*s,9*s,2.4*s,1));}else{eye(g,-2.4*s,-30*s,1.6*s);eye(g,2.8*s,-30*s,1.6*s)}
 if(d.spikes){for(const p of [[-8,-27],[0,-30],[8,-27],[-12,-20],[12,-20]])cel(g,PG([[p[0]*s-2,p[1]*s],[p[0]*s,p[1]*s-7*s],[p[0]*s+2,p[1]*s]]),'b',{flat:true})}};
A.ghost=(g,d,z)=>{const s=d.s||1,k=d.kind||'wraith';const fl=Math.sin(z.ph*6.283)*1.6;const by=-3*s+fl;
 const p=new Path2D();p.moveTo(-8*s,by);p.bezierCurveTo(-11*s,by-14*s,-6*s,by-24*s,0,by-24*s);p.bezierCurveTo(6*s,by-24*s,11*s,by-14*s,8*s,by);
 for(let i=0;i<4;i++){const x0=8*s-i*4*s;p.quadraticCurveTo(x0-1*s,by+(i%2?-3:5)*s+Math.sin(z.ph*6.28+i)*1.5,x0-4*s,by)}p.closePath();
 cel(g,p,'a',{cx:0,cy:by-12*s,rx:7*s,ry:9*s});
 if(k==='wraith'){flat(g,g.P.out,E(-3*s,by-16*s,2*s,2.6*s));flat(g,g.P.out,E(3.4*s,by-16*s,2*s,2.6*s));flat(g,g.P.b.light,E(-3*s,by-16*s,.8*s,1.2*s));flat(g,g.P.b.light,E(3.4*s,by-16*s,.8*s,1.2*s));flat(g,g.P.out,E(0,by-10*s,2*s,2.2*s));
  limb(g,'a',-7*s,by-12*s,-12*s,by-5*s+z.at*-3,2.4*s);limb(g,'a',7*s,by-12*s,12*s+z.at*5,by-8*s,2.4*s)}else{eye(g,-2.6*s,by-14*s,1.9*s);eye(g,2.8*s,by-14*s,1.9*s);flat(g,g.P.out,E(0,by-9*s,1.6*s,1.1*s))}
 if(d.hood)cel(g,PG([[-7*s,by-14*s],[0,by-30*s],[7*s,by-14*s],[0,by-19*s]]),'b',{flat:true})};
A.serpent=(g,d,z)=>{const s=d.s||1,n=d.seg||7;g.c.translate(n*1.7*s-5,0);const pts=[];for(let i=0;i<n;i++){const x=-i*4.6*s+12*s,y=-5*s-Math.sin(z.ph*6.283*(d.sp||1)-i*.8)*3.2*s-(i===0?5*s:0);pts.push([x,y,(5.2-i*.42)*s])}
 for(let i=n-1;i>=0;i--)part(g,i%2?'a':'a','e',pts[i][0],pts[i][1],pts[i][2],pts[i][2]*.9,{hi:i<2});
 if(d.belly)for(let i=1;i<n-1;i++)flat(g,g.P.b.light,E(pts[i][0],pts[i][1]+pts[i][2]*.4,pts[i][2]*.7,pts[i][2]*.4));
 const h=pts[0];eye(g,h[0]+1.4*s,h[1]-1.6*s,1.5*s,.7);if(d.fangs){flat(g,g.P.eye,PG([[h[0]+4*s,h[1]+1],[h[0]+4.8*s,h[1]+4*s],[h[0]+5.6*s,h[1]+1]]))}
 if(d.crest)cel(g,PG([[h[0]-3*s,h[1]-4*s],[h[0]-1*s,h[1]-10*s],[h[0]+1*s,h[1]-4*s]]),'b',{flat:true});
 if(d.maw){flat(g,g.P.out,E(h[0]+5*s,h[1]+1,2,1.4+z.at*1.8))}};
A.toad=(g,d,z)=>{const s=d.s||1,sq=Math.sin(z.ph*6.283)*.6;
 limb(g,'a',-8*s,-5*s,-12*s,-1,3.4*s);limb(g,'a',8*s,-5*s,12*s,-1,3.4*s);
 part(g,'a','e',0,-8*s,12*s,8*s-sq,{});flat(g,g.P.b.light,E(0,-4*s,8*s,3.6*s));
 part(g,'a','e',-5*s,-16*s+sq,3.4*s,3.4*s,{});part(g,'a','e',5*s,-16*s+sq,3.4*s,3.4*s,{});eye(g,-5*s,-16.4*s,2*s);eye(g,5*s,-16.4*s,2*s);
 g.c.strokeStyle=g.P.out;g.c.lineWidth=1;g.c.beginPath();g.c.moveTo(-8*s,-9*s);g.c.quadraticCurveTo(0,-5*s+z.at*4,8*s,-9*s);g.c.stroke();
 if(d.warts)for(const p of [[-6,-11],[2,-12],[7,-8]])flat(g,g.P.b.base,E(p[0]*s,p[1]*s,1.5*s,1.2*s));if(d.crown)cel(g,PG([[-4,-19*s],[-3,-24*s],[0,-20*s],[3,-24*s],[4,-19*s]]),'b',{flat:true})};
A.drake=(g,d,z)=>{const s=d.s||1,sw=Math.sin(z.lg)*2.2,fl=Math.sin(z.ph*6.283)*6;
 for(const sd of [-1,1])cel(g,PG([[sd*4*s,-26*s],[sd*30*s,-44*s-fl],[sd*26*s,-22*s+fl*.3],[sd*14*s,-20*s]]),'b',{hi:false,k:.8});
 limb(g,'a',-14*s,-14*s,-26*s,-10*s+Math.sin(z.ph*6.28)*3,6*s);limb(g,'a',-26*s,-10*s,-34*s,-18*s,3*s);
 limb(g,'a',-8*s,-10*s,-8*s+sw,-1,6.4*s);limb(g,'a',8*s,-10*s,8*s-sw,-1,6.4*s);
 part(g,'a','e',-2*s,-18*s,17*s,11*s,{});flat(g,g.P.b.light,E(2*s,-12*s,11*s,5*s));
 limb(g,'a',10*s,-24*s,17*s,-34*s,7*s);
 const hx=19*s+z.at*5,hy=-38*s;part(g,'a','e',hx,hy,8*s,6.4*s,{});part(g,'a','e',hx+7*s,hy+2*s,5*s,3.6*s,{});eye(g,hx+2*s,hy-1.8*s,2.2*s,.7);
 cel(g,PG([[hx-4*s,hy-5*s],[hx-9*s,hy-14*s],[hx-1*s,hy-6*s]]),'b',{flat:true});cel(g,PG([[hx+1*s,hy-6*s],[hx+0*s,hy-15*s],[hx+4*s,hy-5*s]]),'b',{flat:true});
 for(let i=0;i<5;i++)cel(g,PG([[-12*s+i*5*s-2,-29*s],[-12*s+i*5*s,-34*s-(i%2)*2],[-12*s+i*5*s+2,-29*s]]),'b',{flat:true});
 if(d.fire){flat(g,g.P.c.light,E(hx+13*s,hy+3*s,4*s+z.at*5,2.4*s));flat(g,g.P.c.high,E(hx+12*s,hy+3*s,2*s+z.at*3,1.2*s))}};
// rider: original armored knight on a skeletal warhorse wreathed in elemental flame (hues a=armor b=bone c=flame d=cloth e=trim)
A.rider=(g,d,z)=>{const s=d.s||1,c=g.c,L=z.lg,gal=k=>Math.sin(L+k)*4*s;
 // flame mane/tail behind
 for(let i=0;i<5;i++){const fx=-20*s-i*2.2*s,fy=-24*s+i*2*s,h=(7+((i*5)%3)*2)*s+Math.sin(z.ph*12.6+i)*2;flat(g,g.P.c.light,PG([[fx-2.4*s,fy+3*s],[fx-5*s-i,fy-h],[fx+2.4*s,fy+2*s]]))}
 // far legs
 limb(g,'b',-11*s,-20*s,-14*s+gal(2),-1,2.2*s);limb(g,'b',9*s,-20*s,11*s+gal(3),-1,2.2*s);
 // tattered barding cloth
 cel(g,PG([[-15*s,-26*s],[13*s,-26*s],[15*s,-16*s],[9*s,-13*s],[5*s,-17*s],[0,-12*s],[-5*s,-17*s],[-10*s,-12*s],[-16*s,-17*s]]),'d',{flat:true});
 // ribcage torso
 cel(g,E(-1*s,-24*s,15*s,6.2*s),'b',{cx:-1*s,cy:-24*s,rx:15*s,ry:6*s});
 for(let i=0;i<6;i++){c.fillStyle=g.P.b.dark;c.fillRect((-11+i*4)*s,-27*s,1.1*s,7*s)}
 flat(g,g.P.c.base,E(-1*s,-24*s,4*s,2.2*s));flat(g,g.P.c.high,E(-1*s,-24.4*s,2*s,1*s));
 // near legs
 limb(g,'b',-9*s,-20*s,-7*s-gal(0),-1,2.6*s);limb(g,'b',11*s,-20*s,8*s-gal(1),-1,2.6*s);
 for(const hx of[-7*s-gal(0),8*s-gal(1)])flat(g,g.P.e.base,E(hx,-1,2.4*s,1.2*s));
 // neck + skull head
 limb(g,'b',12*s,-26*s,18*s,-35*s,4.4*s);
 const hx=21*s+z.at*3,hy=-37*s;cel(g,PG([[hx-6*s,hy-6*s],[hx+11*s,hy-1*s],[hx+11*s,hy+4*s],[hx-4*s,hy+5*s]]),'b',{cx:hx,cy:hy,rx:6*s,ry:4*s});
 flat(g,g.P.c.high,E(hx,hy-1*s,1.6*s,1.4*s));c.fillStyle=g.P.b.dark;for(let i=0;i<3;i++)c.fillRect(hx+(3+i*1.6)*s,hy+2*s,.8*s,1.6*s);
 cel(g,PG([[hx-2*s,hy-4*s],[hx-5*s,hy-10*s],[hx+1*s,hy-5*s]]),'e',{flat:true});
 // flame mane on neck
 for(let i=0;i<4;i++){const mx=10*s+i*2.6*s,my=-30*s-i*2.2*s,h=(6+i)*s+Math.sin(z.ph*12.6+i*1.7)*2;flat(g,g.P.c.base,PG([[mx-2*s,my+2*s],[mx-4*s,my-h],[mx+2*s,my+1*s]]));flat(g,g.P.c.high,PG([[mx-1*s,my+1*s],[mx-2.4*s,my-h*.55],[mx+1*s,my]]))}
 // rider: legs, torso armor, pauldrons, cape
 cel(g,PG([[-6*s,-32*s],[-14*s,-24*s+Math.sin(z.ph*6.28)*1.5],[-12*s,-30*s],[-4*s,-40*s]]),'d',{flat:true});
 limb(g,'a',0,-31*s,3*s,-22*s,3.4*s);
 part(g,'a','r',0,-38*s,5.4*s,7*s,{r:2.5*s});
 cel(g,E(0,-38*s,3.2*s,4*s),'e',{flat:true});flat(g,g.P.c.light,E(0,-38*s,1.2*s,1.6*s));
 part(g,'a','e',-4.5*s,-44*s,4*s,2.8*s,{});part(g,'a','e',4.5*s,-44*s,4*s,2.8*s,{});
 for(const sd of[-1,1])cel(g,PG([[sd*6*s,-46*s],[sd*9*s,-50*s],[sd*8*s,-44*s]]),'e',{flat:true});
 // lance arm
 const ax=z.at*8;limb(g,'a',4*s,-42*s,10*s+ax,-36*s,2.8*s);
 limb(g,"e",8*s+ax,-28*s,14*s+ax*1.4,-62*s,1.5*s);flat(g,g.P.e.high,PG([[12.6*s+ax*1.4,-62*s],[14.6*s+ax*1.5,-70*s],[15.6*s+ax*1.4,-61*s]]));
 flat(g,g.P.c.light,E(14.6*s+ax*1.5,-69*s,1.8*s+z.at*2,1.8*s+z.at*2));
 // shield arm
 limb(g,'a',-4*s,-42*s,-8*s,-35*s,2.6*s);cel(g,RR(-12*s,-40*s,6*s,9*s,2.4*s),'e',{cx:-9*s,cy:-35*s,rx:3*s,ry:4*s});flat(g,g.P.c.base,E(-9*s,-35.5*s,1.2*s,1.8*s));
 // helm with visor glow + horns + flame plume
 part(g,'a','e',0,-51*s,4.8*s,5*s,{});flat(g,g.P.out,RR(-3*s,-51*s,7*s,1.6*s,.5));flat(g,g.P.c.high,RR(.5*s,-50.8*s,3.4*s,.9*s,.4));
 for(const sd of[-1,1])cel(g,PG([[sd*3.5*s,-54*s],[sd*8*s,-60*s],[sd*5*s,-53*s]]),'b',{flat:true});
 for(let i=0;i<3;i++){const h=(7+i*2)*s+Math.sin(z.ph*12.6+i*2)*2;flat(g,g.P.c.light,PG([[-2.2*s-i*1.5*s,-55*s],[-4*s-i*3*s,-55*s-h],[1.5*s-i*1.5*s,-55*s]]))}
};
// ---------- extras (applied to elites/bosses): crown / aura / armor plates
function extras(g,d,z,sz){const s=sz/48;if(d.aura){const c=g.c;c.save();c.globalAlpha=.0;c.restore()}}
const ARCH=A;
// ---------- pose
function pose(act,i,n){const ph=n>1?i/n:0,k=n>1?i/(n-1):0;const z={ph,lg:ph*6.283,at:0,bob:0,sx:1,sy:1,lean:0,lunge:0,wf:0,die:0};
 if(act==='idle'){z.bob=Math.sin(ph*6.283)*.8;z.sy=1+Math.sin(ph*6.283)*.03;z.sx=1-Math.sin(ph*6.283)*.02}
 else if(act==='walk'){z.bob=Math.abs(Math.sin(ph*6.283))*1.6;z.lean=.04*Math.sin(ph*6.283)}
 else if(act==='atk'){z.at=k<.4?-.4*(k/.4):k<.7?-.4+1.4*((k-.4)/.3):1-1*((k-.7)/.3);z.lunge=z.at*5;z.sx=1+z.at*.1;z.sy=1-z.at*.06;z.lean=z.at*.1}
 else if(act==='charge'){z.at=-.6;z.sx=1+.06*Math.sin(ph*12.5);z.sy=1-.05*Math.sin(ph*12.5);z.bob=-Math.abs(Math.sin(ph*12.5))*.8;z.lean=-.05}
 else if(act==='hurt'){z.lean=-.14;z.lunge=-3.5*(k===0?1:.7);z.sy=.92;z.sx=1.06}
 else if(act==='die'){z.sy=1-.5*k;z.sx=1+.18*k;z.lean=-.3*k;z.die=k;z.lunge=-2*k}
 return z}
const ACTS={reg:[['idle',4,6],['walk',6,10],['atk',4,10],['hurt',2,8],['die',4,8]],elite:[['idle',6,6],['walk',6,10],['atk',6,10],['hurt',2,8],['die',4,8]],boss:[['idle',8,6],['walk',6,8],['atk',8,10],['charge',6,10],['hurt',2,8],['die',6,6]]};
const SIZE={reg:48,elite:64,boss:128};const PALCAP={reg:16,elite:20,boss:28};
function drawBig(d,tier,act,i,n,fs,dx){const fw=SIZE[tier],P=d._P||(d._P=mkPal(d));const big=document.createElement('canvas');big.width=big.height=fw*SS;const c=big.getContext('2d');
 c.scale(SS,SS);const scale=(tier==='boss'?fw/48*0.9:tier==='elite'?fw/48*.92:1)*fs;const z=pose(act,i,n);
 c.translate(fw/2+dx+z.lunge*scale,fw-3);c.scale(scale*z.sx,scale*z.sy);c.rotate(z.lean);c.translate(0,-z.bob);
 try{ARCH[d.arch]({c,P},d,z)}catch(e){console.error('mobart',d.id,e)}return big}
function bounds(cv){const w=cv.width,x=cv.getContext('2d').getImageData(0,0,w,w).data;let x0=w,x1=0,y0=w;for(let y=0;y<w;y++)for(let xx=0;xx<w;xx++)if(x[(y*w+xx)*4+3]>140){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y}return[x0/SS,x1/SS,y0/SS]}
function fit(d,tier){if(d._fit)return d._fit;const fw=SIZE[tier];let ux0=1e9,ux1=-1e9,uy0=1e9;for(const[a,i,n]of[['idle',0,4],['walk',1,6],['walk',4,6],['atk',2,4],['atk',3,4],['charge',2,6]]){const b=bounds(drawBig(d,tier,a,i,n,1,0));ux0=Math.min(ux0,b[0]);ux1=Math.max(ux1,b[1]);uy0=Math.min(uy0,b[2])}
 const m=3,cx=fw/2;let fs=1;const wd=Math.max(cx-ux0,ux1-cx),ht=fw-3-uy0;fs=Math.min(1,(fw/2-m)/Math.max(1,wd),(fw-3-m)/Math.max(1,ht));
 // after scaling about the anchor (cx,fw-3), re-centre horizontally
 const nx0=cx+(ux0-cx)*fs,nx1=cx+(ux1-cx)*fs;const dx=Math.max(-(nx0-m),Math.min(fw-m-nx1,0))+((nx0+nx1)/2<cx-1?0:0);
 const mid=(nx0+nx1)/2;let off=cx-mid;off=Math.max(m-nx0,Math.min(fw-m-nx1,off));return d._fit={fs,dx:off}}
function renderFrame(d,tier,act,i,n){const fw=SIZE[tier],P=d._P||(d._P=mkPal(d));const f=fit(d,tier);const big=drawBig(d,tier,act,i,n,f.fs,f.dx);const c=big.getContext('2d');
 // nearest-sample to native
 const src=c.canvas.getContext('2d');const sd=src.getImageData(0,0,fw*SS,fw*SS).data;const out=document.createElement('canvas');out.width=out.height=fw;const oc=out.getContext('2d');const od=oc.createImageData(fw,fw);
 const pl=palList(P).map(hex);const pls=palList(P);
 for(let y=0;y<fw;y++)for(let x=0;x<fw;x++){const o=((y*SS+SS/2)*fw*SS+(x*SS+SS/2))*4;const a=sd[o+3];if(a>=140){let r=sd[o],gg=sd[o+1],b=sd[o+2],best=0,bd=1e9;for(let k=0;k<pl.length;k++){const dr=pl[k][0]-r,dg=pl[k][1]-gg,db=pl[k][2]-b,dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;best=k}}const q=pl[best];const j=(y*fw+x)*4;od.data[j]=q[0];od.data[j+1]=q[1];od.data[j+2]=q[2];od.data[j+3]=255}}
 // outline pass (1px, coloured)
 const oC=hex(P.out);const W=fw,H=fw;const res=new Uint8ClampedArray(od.data);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=(y*W+x)*4;if(od.data[j+3])continue;let n_=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&od.data[(yy*W+xx)*4+3]){n_=true;break}}if(n_){res[j]=oC[0];res[j+1]=oC[1];res[j+2]=oC[2];res[j+3]=255}}
 od.data.set(res);oc.putImageData(od,0,0);return out}
const cache={};
function sheet(d,tier){const key=d.id;if(cache[key])return cache[key];const acts=ACTS[tier],fw=SIZE[tier];const maxN=Math.max(...acts.map(a=>a[1]));const cv=document.createElement('canvas');cv.width=maxN*fw;cv.height=acts.length*fw;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;
 const rows={};acts.forEach((a,r)=>{rows[a[0]]={r,n:a[1],fps:a[2]};for(let i=0;i<a[1];i++)x.drawImage(renderFrame(d,tier,a[0],i,a[1]),i*fw,r*fw)});
 const cnt=new Set();const id=x.getImageData(0,0,cv.width,cv.height).data;for(let i=0;i<id.length;i+=4)if(id[i+3])cnt.add(id[i]<<16|id[i+1]<<8|id[i+2]);
 return cache[key]={cv,fw,fh:fw,rows,colors:cnt.size,cap:PALCAP[tier],frames:acts.reduce((a,b)=>a+b[1],0),tier,id:d.id}}
root.MobArt={sheet,ARCH:A,ACTS,SIZE,PALCAP,mkPal};
})(window);
