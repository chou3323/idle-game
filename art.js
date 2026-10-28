/* Aurevia horde — art helpers: manifest loader (+ optional assets/custom/manifest.json overlay), recolor pipeline, procedural item & skill icons. */
window.HD=window.HD||{};
HD.Art=(function(){
const DPR=2;
// ---------- manifest ----------
async function getJSON(u,opt){try{const r=await fetch(u,{cache:'no-cache'});if(!r.ok)return null;return await r.json()}catch(e){if(opt)return null;throw e}}
function merge(a,b){if(!b)return a;for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=merge(a[k]&&typeof a[k]==='object'?a[k]:{},b[k])}else a[k]=b[k]}return a}
async function loadManifest(){
  const base=await getJSON('assets/manifest.json');if(!base)throw new Error('assets/manifest.json missing');
  const custom=await getJSON('assets/custom/manifest.json',true);   // optional: chou's drop-in overrides (same schema, merged on top)
  const m=merge(base,custom);m.hasCustom=!!custom;return m;
}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('image '+src));i.src=src})}
// ---------- recolor ----------
// opt: {hue:deg shift, sat:mul, bri:mul, con:mul, tint:'#rrggbb', tintA:0..1}. Works on any image/canvas, returns a new canvas (same size).
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
function hsl2rgb(h,s,l){h=((h%360)+360)%360/360;if(!s){const v=l*255;return[v,v,v]}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=t=>{t<0&&(t+=1);t>1&&(t-=1);return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[f(h+1/3)*255,f(h)*255,f(h-1/3)*255]}
function recolor(src,opt){
  const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0);
  if(!opt)return c;const id=x.getImageData(0,0,w,h),d=id.data;const hue=opt.hue||0,sat=opt.sat==null?1:opt.sat,bri=opt.bri==null?1:opt.bri,con=opt.con==null?1:opt.con;
  let tr=0,tg=0,tb=0,ta=0;if(opt.tint){const t=parseInt(opt.tint.slice(1),16);tr=t>>16&255;tg=t>>8&255;tb=t&255;ta=opt.tintA==null?.3:opt.tintA}
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;let r=d[i],g=d[i+1],b=d[i+2];
    if(hue){const [hh,ss,ll]=rgb2hsl(r,g,b);const o=hsl2rgb(hh+hue,Math.min(1,ss*sat),ll);r=o[0];g=o[1];b=o[2]}
    else if(sat!==1){const L=r*.3+g*.59+b*.11;r=L+(r-L)*sat;g=L+(g-L)*sat;b=L+(b-L)*sat}
    if(bri!==1||con!==1){r=(r-128)*con+128;g=(g-128)*con+128;b=(b-128)*con+128;r*=bri;g*=bri;b*=bri}
    if(ta){r+=(tr-r)*ta;g+=(tg-g)*ta;b+=(tb-b)*ta}
    d[i]=r<0?0:r>255?255:r;d[i+1]=g<0?0:g>255?255:g;d[i+2]=b<0?0:b>255?255:b}
  x.putImageData(id,0,0);return c}
// ---------- procedural icons (32x32 css px, drawn at 2x) ----------
const METAL=['#c49a62','#cfd6e2','#8fd0ff','#ff9a5a','#ffd86a'],GEM=['#9a7a52','#62e07a','#6fc3ff','#d49bff','#ffb04a'],OL='#2a2540';
const ICACHE=new Map();
function mkc(sz){const c=document.createElement('canvas');c.width=c.height=sz*DPR;const x=c.getContext('2d');x.scale(DPR,DPR);x.lineJoin='round';x.lineCap='round';return[c,x]}
function sf(x,fill,w){x.fillStyle=fill;x.strokeStyle=OL;x.lineWidth=w||1.6;x.fill();x.stroke()}
const DRAW={
 sword(x,m,g){x.translate(16,16);x.rotate(.785);x.beginPath();x.moveTo(0,-15);x.lineTo(3,-10);x.lineTo(3,5);x.lineTo(-3,5);x.lineTo(-3,-10);x.closePath();sf(x,m);x.fillStyle='rgba(255,255,255,.55)';x.fillRect(-1.2,-11,1.2,15);
   x.beginPath();x.rect(-7,5,14,3);sf(x,g);x.beginPath();x.rect(-1.6,8,3.2,6);sf(x,'#7a4a2a');x.beginPath();x.arc(0,15,2,0,7);sf(x,g)},
 dagger(x,m,g){x.translate(16,16);x.rotate(.785);x.beginPath();x.moveTo(0,-10);x.lineTo(2.6,-5);x.lineTo(2.6,4);x.lineTo(-2.6,4);x.lineTo(-2.6,-5);x.closePath();sf(x,m);x.beginPath();x.rect(-5,4,10,2.6);sf(x,g);x.beginPath();x.rect(-1.5,6.6,3,7);sf(x,'#7a4a2a')},
 spear(x,m,g){x.translate(16,16);x.rotate(.785);x.beginPath();x.rect(-1.2,-8,2.4,24);sf(x,'#9a6a3a',1.4);x.beginPath();x.moveTo(0,-17);x.lineTo(4.5,-7);x.lineTo(0,-9);x.lineTo(-4.5,-7);x.closePath();sf(x,m);x.beginPath();x.rect(-2,-6,4,2.4);sf(x,g,1.2)},
 bow(x,m,g){x.beginPath();x.arc(10,16,13,Math.PI*.58,Math.PI*1.42);x.strokeStyle=OL;x.lineWidth=5;x.stroke();x.strokeStyle=m;x.lineWidth=2.8;x.stroke();x.beginPath();x.moveTo(14,5.5);x.lineTo(14,26.5);x.strokeStyle='#fff';x.lineWidth=1;x.stroke();x.beginPath();x.arc(6.3,16,2.2,0,7);sf(x,g,1.2)},
 staff(x,m,g){x.translate(16,16);x.rotate(.785);x.beginPath();x.rect(-1.5,-5,3,21);sf(x,'#9a6a3a',1.4);x.beginPath();x.arc(0,-9,5.2,0,7);sf(x,m,1.6);x.beginPath();x.arc(0,-9,2.6,0,7);sf(x,g,1.2)},
 axe(x,m,g){x.translate(16,16);x.rotate(.785);x.beginPath();x.rect(-1.5,-9,3,25);sf(x,'#9a6a3a',1.4);x.beginPath();x.moveTo(1,-13);x.quadraticCurveTo(12,-12,10,-1);x.lineTo(1,-4);x.closePath();sf(x,m);x.beginPath();x.moveTo(-1,-13);x.quadraticCurveTo(-9,-11,-8,-3);x.lineTo(-1,-5);x.closePath();sf(x,m);x.beginPath();x.arc(0,-8.6,1.6,0,7);sf(x,g,1)},
 fist(x,m,g){x.beginPath();x.roundRect?x.roundRect(8,12,16,13,4):x.rect(8,12,16,13);sf(x,m);for(let i=0;i<4;i++){x.beginPath();x.arc(10.5+i*3.7,11,2.4,0,7);sf(x,m,1.3)}x.beginPath();x.ellipse(7.5,18,2.6,4,-.3,0,7);sf(x,m,1.3);x.beginPath();x.rect(9,24,14,4);sf(x,g,1.3)},
 harp(x,m,g){x.beginPath();x.moveTo(9,26);x.quadraticCurveTo(5,6,17,5);x.quadraticCurveTo(25,5,24,12);x.lineTo(24,26);x.closePath();sf(x,m);for(let i=0;i<4;i++){x.beginPath();x.moveTo(12+i*3,8+i*2);x.lineTo(12+i*3,25);x.strokeStyle=OL;x.lineWidth=.9;x.stroke()}x.beginPath();x.arc(8,25,2.2,0,7);sf(x,g,1.2)},
 whip(x,m,g){x.beginPath();x.moveTo(8,26);x.bezierCurveTo(2,14,22,16,14,6);x.bezierCurveTo(12,3,20,2,24,7);x.strokeStyle=OL;x.lineWidth=4.4;x.stroke();x.strokeStyle=m;x.lineWidth=2.4;x.stroke();x.beginPath();x.rect(5,22,6,8);sf(x,'#7a4a2a',1.3);x.beginPath();x.arc(24,7,2,0,7);sf(x,g,1.2)},
 gun(x,m,g){x.beginPath();x.rect(4,10,22,7);sf(x,m);x.beginPath();x.moveTo(8,17);x.lineTo(15,17);x.lineTo(13,27);x.lineTo(7,27);x.closePath();sf(x,'#7a4a2a');x.beginPath();x.rect(25,11,4,5);sf(x,g,1.2);x.beginPath();x.rect(10,7,5,3);sf(x,g,1.2)},
 helm(x,m,g){x.beginPath();x.arc(16,18,10,Math.PI,0);x.lineTo(26,23);x.lineTo(6,23);x.closePath();sf(x,m);x.beginPath();x.rect(5,22,22,3.5);sf(x,g,1.3);x.beginPath();x.moveTo(16,5);x.lineTo(19,11);x.lineTo(13,11);x.closePath();sf(x,g,1.2);x.fillStyle='rgba(255,255,255,.4)';x.fillRect(9,13,3,5)},
 shield(x,m,g){x.beginPath();x.moveTo(16,4);x.lineTo(27,8);x.quadraticCurveTo(27,22,16,29);x.quadraticCurveTo(5,22,5,8);x.closePath();sf(x,m);x.beginPath();x.moveTo(16,8);x.lineTo(23,10.5);x.quadraticCurveTo(23,20,16,25);x.quadraticCurveTo(9,20,9,10.5);x.closePath();x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=1.2;x.stroke();x.beginPath();x.arc(16,15,3.6,0,7);sf(x,g,1.3)},
 armor(x,m,g){x.beginPath();x.moveTo(11,5);x.lineTo(6,9);x.lineTo(2,16);x.lineTo(7,18);x.lineTo(9,14);x.lineTo(9,28);x.lineTo(23,28);x.lineTo(23,14);x.lineTo(25,18);x.lineTo(30,16);x.lineTo(26,9);x.lineTo(21,5);x.quadraticCurveTo(16,10,11,5);x.closePath();sf(x,m);x.beginPath();x.rect(9,23,14,2.6);sf(x,g,1.2);x.beginPath();x.arc(16,15,2.2,0,7);sf(x,g,1.1)},
 cloak(x,m,g){x.beginPath();x.moveTo(10,5);x.lineTo(22,5);x.lineTo(28,27);x.quadraticCurveTo(24,25,21,28);x.quadraticCurveTo(18,25,16,28);x.quadraticCurveTo(13,25,11,28);x.quadraticCurveTo(8,25,4,27);x.closePath();sf(x,m);x.beginPath();x.arc(16,7,2.6,0,7);sf(x,g,1.2);x.strokeStyle='rgba(255,255,255,.45)';x.lineWidth=1.2;x.beginPath();x.moveTo(14,12);x.lineTo(11,25);x.moveTo(19,12);x.lineTo(22,25);x.stroke()},
 boots(x,m,g){x.beginPath();x.moveTo(10,5);x.lineTo(19,5);x.lineTo(19,18);x.lineTo(27,21);x.quadraticCurveTo(29,27,24,27);x.lineTo(8,27);x.lineTo(8,19);x.closePath();sf(x,m);x.beginPath();x.rect(9,5,10,4);sf(x,g,1.2);x.fillStyle='#2a2540';x.fillRect(8,25,19,2.4)},
 ring(x,m,g){x.beginPath();x.arc(16,19,8,0,7);x.strokeStyle=OL;x.lineWidth=5.4;x.stroke();x.strokeStyle=m;x.lineWidth=3;x.stroke();x.beginPath();x.moveTo(16,6);x.lineTo(20.5,10.5);x.lineTo(16,15);x.lineTo(11.5,10.5);x.closePath();sf(x,g,1.4)},
 amulet(x,m,g){x.beginPath();x.moveTo(6,4);x.quadraticCurveTo(16,24,26,4);x.strokeStyle=OL;x.lineWidth=3.6;x.stroke();x.strokeStyle=m;x.lineWidth=1.8;x.stroke();x.beginPath();x.moveTo(16,15);x.lineTo(22,21);x.lineTo(16,29);x.lineTo(10,21);x.closePath();sf(x,g,1.5);x.beginPath();x.moveTo(16,17.5);x.lineTo(19,21);x.lineTo(16,25);x.lineTo(13,21);x.closePath();x.fillStyle='rgba(255,255,255,.55)';x.fill()}
};
function itemIcon(it,manifest){
  const ov=manifest&&manifest.icons&&manifest.icons[it.id];
  const key=ov?'id|'+it.id:it.kind+'|'+it.tier;let e=ICACHE.get(key);if(e)return e;
  const [c,x]=mkc(32);
  if(ov){const im=new Image();im.onload=()=>{x.clearRect(0,0,32,32);x.drawImage(im,0,0,32,32)};im.src=ov}
  else{x.save();DRAW[it.kind](x,METAL[it.tier],GEM[it.tier]);x.restore();
    if(it.tier>=3){x.save();x.globalCompositeOperation='lighter';const g=x.createRadialGradient(24,8,0,24,8,8);g.addColorStop(0,it.tier===4?'rgba(255,230,140,.9)':'rgba(255,170,110,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(12,0,20,18);x.restore()}}
  ICACHE.set(key,c);return c}
// skill icons: element-coloured badge + glyph
const SC=new Map();
function skillIcon(sk,EL){
  const key=sk.id;let e=SC.get(key);if(e)return e;const el=EL[sk.el]||EL.phys;const [c,x]=mkc(32);
  const g=x.createRadialGradient(12,10,2,16,16,17);g.addColorStop(0,'#fff');g.addColorStop(.35,el.c1);g.addColorStop(1,'#2a2850');x.beginPath();x.arc(16,16,14.5,0,7);x.fillStyle=g;x.fill();x.lineWidth=2;x.strokeStyle='#22214a';x.stroke();
  x.save();x.translate(16,16);x.strokeStyle='#fff';x.fillStyle='#fff';x.shadowColor='rgba(20,20,60,.8)';x.shadowBlur=2;x.lineWidth=2.4;
  switch(sk.kind){
   case 'bolt':x.beginPath();x.moveTo(-8,5);x.lineTo(7,-5);x.stroke();x.beginPath();x.arc(8,-6,3.4,0,7);x.fill();break;
   case 'nova':for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(Math.cos(a)*3,Math.sin(a)*3);x.lineTo(Math.cos(a)*9,Math.sin(a)*9);x.stroke()}x.beginPath();x.arc(0,0,2.2,0,7);x.fill();break;
   case 'pillar':x.beginPath();x.moveTo(0,-10);x.lineTo(-3,2);x.lineTo(2,0);x.lineTo(-1,10);x.stroke();x.beginPath();x.ellipse(0,9,7,2.4,0,0,7);x.stroke();break;
   case 'meteor':x.beginPath();x.arc(4,3,5,0,7);x.fill();x.beginPath();x.moveTo(-1,-1);x.lineTo(-9,-9);x.moveTo(1,-3);x.lineTo(-4,-10);x.stroke();break;
   case 'arrows':for(const dx of[-6,0,6]){x.beginPath();x.moveTo(dx+2,-9);x.lineTo(dx-2,8);x.stroke();x.beginPath();x.moveTo(dx-2,8);x.lineTo(dx-4.4,3.5);x.lineTo(dx+1,5);x.fill()}break;
   case 'wave':x.beginPath();x.arc(-3,0,10,-1.1,1.1);x.stroke();x.beginPath();x.arc(1,0,7,-1,1);x.stroke();break;
   case 'heal':x.beginPath();x.moveTo(0,-8);x.lineTo(0,8);x.moveTo(-8,0);x.lineTo(8,0);x.lineWidth=4;x.stroke();break;
   case 'buff':x.beginPath();x.moveTo(0,-9);x.lineTo(7,0);x.lineTo(2.4,0);x.lineTo(2.4,8);x.lineTo(-2.4,8);x.lineTo(-2.4,0);x.lineTo(-7,0);x.closePath();x.fill();break}
  x.restore();SC.set(key,c);return c}
// ---------- window-skin overrides (manifest "ui") ----------
// "ui":{"vars":{"--ro-tb1":"#9bb"...},"images":{"win":"ui/win.png","tb":"ui/titlebar.png","btn":..,"slot":..,"tab":..,"close":..,"hp":..,"sp":..,"body":..},"base":"assets/custom/"}
// Every image key sets --ro-img-<key>; vars may re-colour the whole skin. Relative paths resolve against ui.base (default assets/custom/).
function applyUI(ui){if(!ui)return 0;const r=document.documentElement;let n=0;
  const vars=ui.vars||{};for(const k in vars){r.style.setProperty(k.indexOf('--')===0?k:'--ro-'+k,vars[k]);n++}
  const imgs=ui.images||{},base=ui.base||'assets/custom/';
  for(const k in imgs){const v=imgs[k];if(!v)continue;r.style.setProperty('--ro-img-'+k,/^(url|linear-|radial-|none)/.test(v)?v:'url("'+(/^(https?:|assets\/|\/|data:)/.test(v)?v:base+v)+'")');n++}
  return n}
return {loadManifest,loadImg,recolor,itemIcon,skillIcon,merge,applyUI};
})();
