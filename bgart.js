/* Procedural placeholder arenas (spec §9.3 option B). 34x18 cells, rendered at 2x into an offscreen canvas. */
window.BgArt=(function(){
  const CELL=32,R=2;
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function mk(w,h){const c=document.createElement('canvas');c.width=w*CELL*R;c.height=h*CELL*R;const x=c.getContext('2d');x.scale(R,R);return [c,x]}
  function tree(x,px,py,s,rnd,pal){
    x.save();x.translate(px,py);
    x.fillStyle='rgba(20,40,10,.28)';x.beginPath();x.ellipse(s*.15,2,s*.62,s*.2,0,0,7);x.fill();
    x.fillStyle='#5b3d22';x.fillRect(-s*.07,-s*.5,s*.14,s*.52);
    const blobs=[[0,-s*1.0,s*.46],[-s*.3,-s*.7,s*.36],[s*.3,-s*.72,s*.36],[0,-s*.62,s*.4],[-s*.12,-s*1.28,s*.3],[s*.18,-s*1.1,s*.28]];
    blobs.forEach(([bx,by,br],i)=>{x.fillStyle=pal[i%3];x.beginPath();x.arc(bx,by,br,0,7);x.fill()});
    x.fillStyle='rgba(255,255,170,.18)';blobs.forEach(([bx,by,br])=>{x.beginPath();x.arc(bx-br*.3,by-br*.35,br*.45,0,7);x.fill()});
    x.fillStyle='rgba(0,30,0,.18)';x.beginPath();x.arc(s*.1,-s*.5,s*.3,0,Math.PI);x.fill();
    x.restore();
  }
  function grass(x,W,H,rnd,base){
    x.fillStyle=base;x.fillRect(0,0,W,H);
    for(let i=0;i<260;i++){const px=rnd()*W,py=rnd()*H,r=24+rnd()*60;
      x.fillStyle=rnd()<.5?'rgba(150,200,90,.14)':'rgba(40,110,40,.13)';x.beginPath();x.ellipse(px,py,r,r*.6,0,0,7);x.fill()}
    const cols=['#4f8a35','#86b95a','#3f7a30','#9ccb68'];
    x.lineWidth=1.2;
    for(let i=0;i<5200;i++){const px=rnd()*W,py=rnd()*H;x.strokeStyle=cols[(rnd()*4)|0];x.beginPath();x.moveTo(px,py);x.lineTo(px+(rnd()-.5)*3,py-3-rnd()*3);x.stroke()}
  }
  function field(w,h){
    const [c,x]=mk(w,h),W=w*CELL,H=h*CELL,rnd=rng(77);
    grass(x,W,H,rnd,'#6ca447');
    // dirt road: bottom-left → top-right with noisy edges
    const pts=[[-60,H*.86],[W*.2,H*.78],[W*.4,H*.9],[W*.62,H*.7],[W*.82,H*.45],[W+60,H*.3]];
    for(let pass=0;pass<2;pass++){
      for(let s=0;s<pts.length-1;s++){const [a,b]=[pts[s],pts[s+1]];const n=60;
        for(let i=0;i<=n;i++){const u=i/n,px=a[0]+(b[0]-a[0])*u,py=a[1]+(b[1]-a[1])*u;
          const r=(pass?34:48)+rnd()*10;x.fillStyle=pass?(rnd()<.5?'#c9a96a':'#bf9f60'):'rgba(120,96,50,.55)';
          x.beginPath();x.ellipse(px+(rnd()-.5)*10,py+(rnd()-.5)*10,r,r*.55,0,0,7);x.fill()}}}
    for(let i=0;i<700;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(120,90,45,.25)';x.fillRect(px,py,2,1.5)}
    // flowers / rocks
    for(let i=0;i<70;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle=['#fff','#ffe36b','#ff9ac2','#c7b3ff'][(rnd()*4)|0];x.beginPath();x.arc(px,py,1.6,0,7);x.fill()}
    for(let i=0;i<14;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(px+2,py+3,9,4,0,0,7);x.fill();x.fillStyle='#8f9296';x.beginPath();x.ellipse(px,py,8,5.5,0,0,7);x.fill();x.fillStyle='#b9bcc0';x.beginPath();x.ellipse(px-2,py-2,4,2.5,0,0,7);x.fill()}
    // trees: dense border, sparse inside (keeps the central hunting lane open)
    const T=[];const inLane=(px,py)=>px>3*CELL&&px<27*CELL&&py>5.5*CELL&&py<15*CELL;
    for(let i=0;i<150;i++){const px=rnd()*W,py=rnd()*H;const edge=px<2.5*CELL||px>W-2.5*CELL||py<3.2*CELL||py>H-1.2*CELL;
      if(inLane(px,py))continue;if(!edge&&rnd()<.55)continue;T.push([px,py,40+rnd()*26])}
    T.sort((a,b)=>a[1]-b[1]).forEach(([px,py,s])=>tree(x,px,py,s,rnd,['#2f6b2c','#3d8137','#4c9a43']));
    // light vignette
    const g=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.65);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,20,0,.28)');x.fillStyle=g;x.fillRect(0,0,W,H);
    return c;
  }
  function town(w,h){
    const [c,x]=mk(w,h),W=w*CELL,H=h*CELL,rnd=rng(5);
    grass(x,W,H,rnd,'#6ca447');
    // paved plaza
    const px0=2*CELL,px1=W-2*CELL,py0=3*CELL;
    for(let ty=py0;ty<H;ty+=CELL)for(let tx=px0;tx<px1;tx+=CELL){
      const v=(Math.floor(tx/CELL)+Math.floor(ty/CELL))&1;x.fillStyle=v?'#cbbf9d':'#d6cba9';x.fillRect(tx,ty,CELL,CELL);
      x.fillStyle='rgba(255,255,255,.12)';x.fillRect(tx,ty,CELL,1.5);x.fillStyle='rgba(90,70,30,.22)';x.fillRect(tx,ty+CELL-1,CELL,1);x.fillRect(tx+CELL-1,ty,1,CELL);
      if(rnd()<.2){x.fillStyle='rgba(90,70,30,.08)';x.fillRect(tx+3,ty+3,CELL-6,CELL-6)}}
    // wall + gate
    const wh=3*CELL;x.fillStyle='#9c9a97';x.fillRect(0,0,W,wh);
    for(let by=0;by<wh;by+=14){for(let bx=-(by/14%2)*14;bx<W;bx+=28){x.fillStyle=((bx+by)/14|0)%3?'#a7a5a2':'#b3b1ae';x.fillRect(bx+1,by+1,26,12)}}
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,wh-5,W,5);
    for(let bx=0;bx<W;bx+=22){x.fillStyle='#8f8d8a';x.fillRect(bx,-2,14,10)}
    const gx=W/2-70;x.fillStyle='#7d7b78';x.fillRect(gx,0,140,wh+6);x.fillStyle='#34495e';x.beginPath();x.moveTo(gx+30,wh+6);x.lineTo(gx+30,34);x.quadraticCurveTo(W/2,-8,gx+110,34);x.lineTo(gx+110,wh+6);x.fill();
    x.fillStyle='#244a35';x.beginPath();x.moveTo(W/2,14);x.lineTo(W/2+22,24);x.lineTo(W/2+18,46);x.lineTo(W/2,56);x.lineTo(W/2-18,46);x.lineTo(W/2-22,24);x.closePath();x.fill();
    x.strokeStyle='#d9c36a';x.lineWidth=2;x.stroke();
    // stall at (26,6)
    const sx=26*CELL,sy=6*CELL;x.fillStyle='rgba(0,0,0,.2)';x.beginPath();x.ellipse(sx,sy+4,34,9,0,0,7);x.fill();
    x.fillStyle='#8a5a2b';x.fillRect(sx-28,sy-26,56,26);for(let i=0;i<7;i++){x.fillStyle=i&1?'#e84b4b':'#fff2d9';x.fillRect(sx-30+i*8.6,sy-52,8.6,24)}
    x.fillStyle='#5b3d22';x.fillRect(sx-30,sy-52,3,52);x.fillRect(sx+27,sy-52,3,52);
    x.fillStyle='#f5d58c';x.fillRect(sx-22,sy-22,44,6);
    // trees & fountain-ish planters
    const T=[[1.2,5],[1.2,12],[W/CELL-1.6,4.5],[W/CELL-1.4,12.5],[4,17.5],[30,17.4],[8.2,3.7],[25.8,3.8]];
    T.sort((a,b)=>a[1]-b[1]).forEach(([cx,cy])=>tree(x,cx*CELL,cy*CELL,46,rnd,['#2f6b2c','#3d8137','#4c9a43']));
    return c;
  }

  // ---------- themed arenas (original procedural art; replace any via manifest maps.<id>.bg image) ----------
  const TH={
   desert:{base:'#e6c987',bl:['rgba(255,235,170,.22)','rgba(190,140,70,.16)'],st:['#d2ad62','#f2dc9c','#c49a52','#ecd08a'],road:null},
   cave:  {base:'#4a4a62',bl:['rgba(150,150,200,.10)','rgba(10,10,30,.22)'],st:['#3c3c52','#5c5c78','#34344a','#6a6a88'],road:null},
   snow:  {base:'#e4eef8',bl:['rgba(255,255,255,.35)','rgba(150,180,220,.16)'],st:['#cfe0f2','#ffffff','#bcd2ea','#f4faff'],road:null},
   lava:  {base:'#3a2a30',bl:['rgba(120,60,40,.18)','rgba(0,0,0,.25)'],st:['#2a1c22','#4a3238','#241820','#5a3c3c'],road:null},
   ruins: {base:'#8f9a92',bl:['rgba(210,220,210,.14)','rgba(40,60,60,.16)'],st:['#7a867e','#a8b4aa','#6c786e','#b8c4b8'],road:null}};
  function ground(x,W,H,rnd,t){
    x.fillStyle=t.base;x.fillRect(0,0,W,H);
    for(let i=0;i<260;i++){const px=rnd()*W,py=rnd()*H,r=24+rnd()*60;x.fillStyle=t.bl[rnd()<.5?0:1];x.beginPath();x.ellipse(px,py,r,r*.6,0,0,7);x.fill()}
    x.lineWidth=1.1;for(let i=0;i<3600;i++){const px=rnd()*W,py=rnd()*H;x.strokeStyle=t.st[(rnd()*4)|0];x.beginPath();x.moveTo(px,py);x.lineTo(px+(rnd()-.5)*5,py-1-rnd()*3);x.stroke()}
  }
  function shadow(x,px,py,rx,ry){x.fillStyle='rgba(0,0,0,.26)';x.beginPath();x.ellipse(px,py+2,rx,ry,0,0,7);x.fill()}
  function cactus(x,px,py,s){shadow(x,px,py,s*.4,s*.12);x.fillStyle='#4f9a52';x.strokeStyle='#2f6a36';x.lineWidth=1.4;
    const rr=(a,b,c,d)=>{x.beginPath();x.roundRect?x.roundRect(a,b,c,d,c/2):x.rect(a,b,c,d);x.fill();x.stroke()};rr(px-s*.12,py-s,s*.24,s,0);rr(px-s*.4,py-s*.65,s*.16,s*.4,0);rr(px-s*.4,py-s*.5,s*.3,s*.14,0);rr(px+s*.24,py-s*.8,s*.16,s*.45,0);rr(px+s*.1,py-s*.45,s*.3,s*.14,0)}
  function rock(x,px,py,s,c1,c2){shadow(x,px,py,s*.7,s*.22);x.fillStyle=c1;x.beginPath();x.ellipse(px,py-s*.3,s*.6,s*.42,0,0,7);x.fill();x.fillStyle=c2;x.beginPath();x.ellipse(px-s*.18,py-s*.45,s*.32,s*.2,0,0,7);x.fill()}
  function stalag(x,px,py,s,c1,c2){shadow(x,px,py,s*.5,s*.14);x.fillStyle=c1;x.beginPath();x.moveTo(px-s*.4,py);x.lineTo(px-s*.1,py-s*1.1);x.lineTo(px+s*.12,py-s*.8);x.lineTo(px+s*.38,py);x.closePath();x.fill();x.fillStyle=c2;x.beginPath();x.moveTo(px-s*.4,py);x.lineTo(px-s*.1,py-s*1.1);x.lineTo(px-s*.02,py);x.closePath();x.fill()}
  function crystal(x,px,py,s,c1,c2){shadow(x,px,py,s*.5,s*.14);x.save();x.shadowColor=c1;x.shadowBlur=14;for(const [dx,h,w] of [[-.28,.75,.2],[0,1.1,.26],[.3,.6,.18]]){x.fillStyle=c1;x.beginPath();x.moveTo(px+dx*s-w*s,py);x.lineTo(px+dx*s,py-h*s);x.lineTo(px+dx*s+w*s,py);x.closePath();x.fill();x.fillStyle=c2;x.beginPath();x.moveTo(px+dx*s-w*s,py);x.lineTo(px+dx*s,py-h*s);x.lineTo(px+dx*s-w*s*.2,py);x.closePath();x.fill()}x.restore()}
  function pine(x,px,py,s,snow){shadow(x,px,py,s*.5,s*.14);x.fillStyle='#5b3d22';x.fillRect(px-s*.06,py-s*.3,s*.12,s*.3);
    for(let i=0;i<3;i++){const y=py-s*.2-i*s*.32,w=s*(.55-i*.13);x.fillStyle=['#2f6a52','#3a7d62','#468f72'][i];x.beginPath();x.moveTo(px-w,y);x.lineTo(px,y-s*.5);x.lineTo(px+w,y);x.closePath();x.fill();
      if(snow){x.fillStyle='#f4faff';x.beginPath();x.moveTo(px-w*.9,y-s*.03);x.lineTo(px,y-s*.5);x.lineTo(px+w*.9,y-s*.03);x.quadraticCurveTo(px+w*.3,y-s*.2,px,y-s*.12);x.quadraticCurveTo(px-w*.3,y-s*.2,px-w*.9,y-s*.03);x.fill()}}}
  function pillar(x,px,py,s,broken){shadow(x,px,py,s*.45,s*.14);const h=broken?s*.6:s*1.2;x.fillStyle='#b4bdb2';x.fillRect(px-s*.2,py-h,s*.4,h);x.fillStyle='#d4dcd2';x.fillRect(px-s*.2,py-h,s*.1,h);x.fillStyle='#8a948a';x.fillRect(px+s*.1,py-h,s*.1,h);
    x.fillStyle='#c8d0c6';x.fillRect(px-s*.3,py-s*.12,s*.6,s*.12);if(!broken){x.fillRect(px-s*.3,py-h-s*.1,s*.6,s*.12)}else{x.fillStyle='#8a948a';x.beginPath();x.moveTo(px-s*.2,py-h);x.lineTo(px-s*.05,py-h-s*.15);x.lineTo(px+s*.2,py-h);x.fill()}
    x.strokeStyle='rgba(60,80,60,.4)';x.lineWidth=1;x.beginPath();x.moveTo(px-s*.05,py-h*.7);x.lineTo(px+s*.04,py-h*.4);x.stroke()}
  function themed(name,w,h){
    const [c,x]=mk(w,h),W=w*CELL,H=h*CELL,rnd=rng(name.length*131+7),t=TH[name];ground(x,W,H,rnd,t);
    const lane=(px,py)=>px>3*CELL&&px<W-4*CELL&&py>5.5*CELL&&py<H-3*CELL;
    const edgeOf=(px,py)=>px<2.5*CELL||px>W-2.5*CELL||py<3.2*CELL||py>H-1.2*CELL;
    const place=(n,fn,keepLane)=>{const P=[];for(let i=0;i<n;i++){const px=rnd()*W,py=rnd()*H;if(!keepLane&&lane(px,py)&&rnd()<.8)continue;if(keepLane&&lane(px,py)&&!edgeOf(px,py)&&rnd()<.5)continue;P.push([px,py,rnd()])}P.sort((a,b)=>a[1]-b[1]).forEach(p=>fn(p[0],p[1],p[2]))};
    if(name==='desert'){
      for(let i=0;i<40;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(185,135,60,.20)';x.beginPath();x.ellipse(px,py,60+rnd()*80,10+rnd()*14,0,0,7);x.fill();x.fillStyle='rgba(255,240,190,.28)';x.beginPath();x.ellipse(px-8,py-5,50+rnd()*60,6+rnd()*8,0,0,7);x.fill()}
      for(let i=0;i<24;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(120,90,40,.3)';x.fillRect(px,py,3,1.6)}
      place(120,(px,py,r)=>{if(r<.5)cactus(x,px,py,30+r*40);else rock(x,px,py,10+r*14,'#b89a66','#d8c08a')},1);
      for(let i=0;i<10;i++){const px=rnd()*W,py=rnd()*H;x.strokeStyle='#f4efe0';x.lineWidth=2.4;x.beginPath();x.moveTo(px,py);x.lineTo(px+9,py-3);x.stroke();x.beginPath();x.arc(px+10,py-3,2.2,0,7);x.fillStyle='#f4efe0';x.fill()}
    }else if(name==='cave'){
      for(let i=0;i<46;i++){let px=rnd()*W,py=rnd()*H;x.strokeStyle='rgba(15,15,35,.35)';x.lineWidth=1.6;x.beginPath();x.moveTo(px,py);for(let k=0;k<5;k++){px+=(rnd()-.4)*22;py+=(rnd()-.5)*14;x.lineTo(px,py)}x.stroke()}
      for(let i=0;i<9;i++){const px=rnd()*W,py=rnd()*H,r=30+rnd()*50;const g=x.createRadialGradient(px,py,2,px,py,r);g.addColorStop(0,'rgba(80,120,200,.35)');g.addColorStop(1,'rgba(80,120,200,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}
      place(170,(px,py,r)=>{if(r<.6)stalag(x,px,py,28+r*60,'#34344c','#52526e');else if(r<.85)crystal(x,px,py,18+r*18,'#6a8aff','#c8d6ff');else crystal(x,px,py,16+r*12,'#c06aff','#ecc8ff')},1);
    }else if(name==='snow'){
      for(let i=0;i<60;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(px,py,28+rnd()*60,6+rnd()*10,0,0,7);x.fill();x.fillStyle='rgba(150,180,220,.2)';x.beginPath();x.ellipse(px+6,py+5,26+rnd()*50,5+rnd()*8,0,0,7);x.fill()}
      for(let i=0;i<8;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(150,220,255,.35)';x.beginPath();x.ellipse(px,py,40+rnd()*50,14+rnd()*14,0,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=1.4;x.beginPath();x.moveTo(px-20,py);x.lineTo(px+10,py-4);x.stroke()}
      place(150,(px,py,r)=>{if(r<.78)pine(x,px,py,40+r*50,true);else rock(x,px,py,9+r*14,'#9aa6b8','#e8eef8')},1);
    }else if(name==='lava'){
      for(let k=0;k<5;k++){const pts=[];let px=rnd()*W,py=(k*.22+.05)*H;for(let i=0;i<9;i++){pts.push([px,py]);px+=40+rnd()*70;py+=(rnd()-.5)*60}
        for(const [lw,col] of [[26,'rgba(255,90,20,.18)'],[14,'#ff5a1a'],[7,'#ffb43a'],[3,'#fff0a0']]){x.strokeStyle=col;x.lineWidth=lw;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke()}}
      for(let i=0;i<90;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle=rnd()<.5?'rgba(255,170,60,.7)':'rgba(255,90,30,.6)';x.fillRect(px,py,2,2)}
      place(150,(px,py,r)=>{if(r<.55)stalag(x,px,py,26+r*50,'#2a1c22','#6a4a4a');else rock(x,px,py,12+r*18,'#3c2a30','#7a5a5a')},1);
    }else{ // ruins
      for(let ty=0;ty<H;ty+=CELL*2)for(let tx=0;tx<W;tx+=CELL*2){const v=((tx+ty)/CELL/2)&1;x.fillStyle=v?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)';x.fillRect(tx,ty,CELL*2,CELL*2);x.strokeStyle='rgba(40,60,50,.28)';x.lineWidth=1.2;x.strokeRect(tx+.5,ty+.5,CELL*2,CELL*2);
        if(rnd()<.2){x.beginPath();x.moveTo(tx+rnd()*60,ty);x.lineTo(tx+rnd()*60,ty+CELL*2);x.stroke()}}
      for(let i=0;i<50;i++){const px=rnd()*W,py=rnd()*H;x.fillStyle='rgba(100,160,80,.4)';x.beginPath();x.ellipse(px,py,10+rnd()*12,4+rnd()*4,0,0,7);x.fill()}
      place(150,(px,py,r)=>{if(r<.3)pillar(x,px,py,40+r*50,r<.15);else if(r<.55)crystal(x,px,py,22+r*20,'#a46aff','#e6d0ff');else rock(x,px,py,10+r*16,'#7a867e','#b4c0b4')},1);
    }
    const g=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.65);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,name==='snow'?'rgba(40,70,120,.22)':'rgba(0,0,20,.30)');x.fillStyle=g;x.fillRect(0,0,W,H);
    return c;
  }
  return {CELL,R,render:(name,w,h)=>name==='town'?town(w,h):TH[name]?themed(name,w,h):field(w,h)};
})();
