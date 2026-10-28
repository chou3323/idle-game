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
  return {CELL,R,render:(name,w,h)=>name==='town'?town(w,h):field(w,h)};
})();
