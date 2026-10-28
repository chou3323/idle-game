/* 曙光 Aurevia 割草大畫面 — front-end-only prototype (spec §9A). All data is fake; no server.
 * Renderer follows 9A.4: Canvas2D, atlas drawImage, pooled objects, bucket y-sort, LOD L0/L1/L2, nameplate de-overlap,
 * cached name bitmaps, glyph-sheet damage numbers, auto quality ladder Q3..Q0. */
(function(){
'use strict';
const $=s=>document.querySelector(s),qs=new URLSearchParams(location.search);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- env ----------
const MOBILE=qs.has('mobile')?qs.get('mobile')==='1':(matchMedia('(max-width:600px)').matches||matchMedia('(pointer:coarse)').matches&&innerWidth<=820);
const CAP={ch:MOBILE?20:40,mob:MOBILE?60:150,l1:MOBILE?8:24,l1r:MOBILE?320:448,nums:MOBILE?24:60,fx:MOBILE?30:80,names:MOBILE?12:40,bub:MOBILE?4:8};
const TARGET_FPS=MOBILE?30:60,BUDGET=MOBILE?26:13;
const QN=['Q0 省電','Q1 低','Q2 中','Q3 高'];
const QMUL=[.3,.5,.75,1];
const DPR=Math.min(MOBILE?2:2,window.devicePixelRatio||1);
let seed=+(qs.get('seed')||0)||((Date.now()&0xffffff)|1);
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const rr=(a,b)=>a+rnd()*(b-a);
// ---------- data ----------
const JOBCOL={kni:'#e0554a',lnc:'#d9803a',mer:'#c8b04a',mnk:'#e0a030',acl:'#f0f0f0',arc:'#a070ff',rgr:'#4ac060',brd:'#e070c0',dnc:'#ff80a0',gun:'#4ab0e0',hsn:'#7a7a8a'};
const NAMES='小法 阿翔 月影 風之子 米粒 暴走豆花 凜冬 夜貓 青蛙王 阿嬤的菜 劍心 小茹 老王 糖糖 雷鳴 笨笨 夏日 流星 阿宅 貓咪 飛鳥 柚子 晨曦 銀狼 小七 阿豪 星塵 白龍 紅豆 墨染 喵喵 豆花哥 夜行 浪人 北風 小滿 大橘 烈焰 秋刀魚 路過'.split(' ');
const MOBTYPES=[{n:'花兔',img:'bunny',h:46,tint:null},{n:'蜜蜂',img:'bee',h:48,tint:null},{n:'甲蟲',img:'beetle',h:58,tint:null},
  {n:'毒花兔',img:'bunny',h:46,tint:'rgba(70,200,90,.45)'},{n:'赤蜂',img:'bee',h:48,tint:'rgba(230,60,60,.4)'},{n:'晶甲蟲',img:'beetle',h:58,tint:'rgba(80,120,255,.42)'}];
const BOSSES=[{n:'石翼龍',img:'cave_boss'},{n:'熔岩龍',img:'magma_boss'},{n:'風嘯獅鷲',img:'hills_boss'}];
const ITEMS=[['紅色藥水',0],['蜂蜜',0],['鐵礦石',0],['軟毛',0],['金幣袋',0],['卡片（原型）',1],['古代武器箱',1]];
const SAY=['衝啊！','割草割草～','補血！','BOSS來了','好多怪','我要升級','收工前再一波','哈哈哈','等我！'];
const CHAR_S=0.58;           // sprites are stored at 50% → 128px cells; drawn ≈ 74px tall
// ---------- state ----------
const cv=$('#scene'),ctx=cv.getContext('2d',{alpha:false});
const mini=$('#mini'),mctx=mini.getContext('2d');
const S={W:600,H:400,zoom:1,zoomMul:1,cx:300,cy:200,rx:200,ry:120,
  want:{ch:Math.min(30,CAP.ch),mob:Math.min(100,CAP.mob),gat:.55},
  opt:{names:true,dmg:true,mini:true,ring:true},qMode:'auto',q:MOBILE?2:3,qSince:0,qUpT:0,paused:false,
  t:0,kills:0,killsSince:0,exp:0,lv:87,expBar:0,killHist:[],wallStart:performance.now(),simStart:0,sheets:null,imgs:{},mobImgs:[],bossImgs:[],boss:null,bossCool:0,nextBossAt:150};
let chars=[],mobs=[];
const tmpl={};   // caches
// ---------- assets ----------
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error(src));i.src=src})}
async function load(){
  S.sheets=await (await fetch('assets/chars/sheets.json')).json();
  await Promise.all(Object.entries(S.sheets).map(async([k,v])=>{S.imgs[k]=await loadImg('assets/chars/'+v.file)}));
  const mi={};await Promise.all(['bunny','bee','beetle'].map(async k=>{mi[k]=await loadImg('assets/mobs/mob_'+k+'.webp')}));
  MOBTYPES.forEach(t=>{const src=mi[t.img];const s=t.h/src.height,w=Math.round(src.width*s*DPR),h=Math.round(t.h*DPR);
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(src,0,0,w,h);
    if(t.tint){x.globalCompositeOperation='source-atop';x.fillStyle=t.tint;x.fillRect(0,0,w,h)}
    t.cv=c;t.w=w/DPR;t.hh=h/DPR});
  for(const b of BOSSES){b.im=await loadImg('assets/mobs/'+b.img+'.webp')}
}
// ---------- sprite helpers ----------
const shadowCv=(()=>{const c=document.createElement('canvas');c.width=48;c.height=20;const x=c.getContext('2d');const g=x.createRadialGradient(24,10,2,24,10,22);g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.save();x.scale(1,.42);x.beginPath();x.arc(24,24,24,0,7);x.fill();x.restore();return c})();
// glyph sheet for damage numbers
const GL={cols:{w:'#ffffff',c:'#ffe14a',r:'#ff6a6a',g:'#62e07a',p:'#d49bff',o:'#ff9d3a'},at:{},gw:0,gh:0};
function buildGlyphs(){
  const px=18*DPR,gw=Math.ceil(px*.78),gh=Math.ceil(px*1.3);GL.gw=gw;GL.gh=gh;const chars='0123456789×,';
  for(const k in GL.cols){const c=document.createElement('canvas');c.width=gw*chars.length;c.height=gh;const x=c.getContext('2d');
    x.font=`900 ${px}px "Arial Black","Noto Sans TC",Impact,sans-serif`;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=Math.max(3,px*.2);x.strokeStyle='rgba(0,0,0,.88)';
    for(let i=0;i<chars.length;i++){x.strokeText(chars[i],gw*i+gw/2,gh/2+1);x.fillStyle=GL.cols[k];x.fillText(chars[i],gw*i+gw/2,gh/2+1)}GL.at[k]=c}
  GL.map={};for(let i=0;i<chars.length;i++)GL.map[chars[i]]=i;
}
function drawNumber(x,sx,sy,text,col,sc,alpha){
  const a=GL.at[col],gw=GL.gw,gh=GL.gh,dw=gw/DPR*sc*.86,dh=gh/DPR*sc;let w=text.length*dw,px=sx-w/2;
  x.globalAlpha=alpha;
  for(let i=0;i<text.length;i++){const gi=GL.map[text[i]];if(gi!=null)x.drawImage(a,gi*gw,0,gw,gh,px+i*dw,sy-dh/2,dw*1.12,dh)}
}
// name bitmap cache (LRU 300)
const LAB=new Map();
function labelBmp(text,col,size,bg){
  const key=text+'|'+col+'|'+size+(bg?'b':'');let e=LAB.get(key);
  if(e){LAB.delete(key);LAB.set(key,e);return e}
  const c=document.createElement('canvas'),x=c.getContext('2d');const f=`${bg?'':'bold '}${size*DPR}px "Noto Sans TC","Microsoft JhengHei",sans-serif`;
  x.font=f;const tw=Math.ceil(x.measureText(text).width),pad=bg?6*DPR:3*DPR;c.width=tw+pad*2;c.height=Math.ceil(size*DPR*1.5);
  x.font=f;x.textAlign='center';x.textBaseline='middle';
  if(bg){x.fillStyle='rgba(255,255,255,.92)';const r=6*DPR;x.beginPath();x.roundRect?x.roundRect(0,0,c.width,c.height-4*DPR,r):x.rect(0,0,c.width,c.height-4*DPR);x.fill();x.fillStyle='#222';x.fillText(text,c.width/2,(c.height-4*DPR)/2+1)}
  else{x.lineJoin='round';x.lineWidth=3*DPR;x.strokeStyle='rgba(0,0,0,.85)';x.strokeText(text,c.width/2,c.height/2+1);x.fillStyle=col;x.fillText(text,c.width/2,c.height/2+1)}
  e={c,w:c.width/DPR,h:c.height/DPR};LAB.set(key,e);if(LAB.size>300)LAB.delete(LAB.keys().next().value);return e;
}
// ---------- pools ----------
const NUMS=Array.from({length:70},()=>({on:0,x:0,y:0,t:0,txt:'',col:'w',sc:1,dur:1}));
const FX=Array.from({length:110},()=>({on:0,k:0,x:0,y:0,t:0,dur:.5,a:0,b:0}));
const PROJ=Array.from({length:90},()=>({on:0,x:0,y:0,sx:0,sy:0,tgt:null,att:null,t:0,dur:.3,kind:0,dmg:0,crit:0}));
const BUB=Array.from({length:10},()=>({on:0,ch:null,txt:'',t:0}));
let numCount=0,fxCount=0;
function pushNum(x,y,txt,col,sc,dur){if(numCount>=CAP.nums*QMUL[S.q]+8)return;for(let i=0;i<NUMS.length;i++){const n=NUMS[i];if(!n.on){n.on=1;n.x=x;n.y=y;n.t=0;n.txt=txt;n.col=col;n.sc=sc;n.dur=dur||.95;numCount++;return}}}
function pushFx(k,x,y,dur,a,b){if(S.q<=1&&k!==1&&k!==4)return;const lim=CAP.fx*(S.q>=3?1:S.q===2?.5:.25);if(fxCount>=lim)return;for(let i=0;i<FX.length;i++){const f=FX[i];if(!f.on){f.on=1;f.k=k;f.x=x;f.y=y;f.t=0;f.dur=dur;f.a=a||0;f.b=b||0;fxCount++;return}}}
// FX kinds: 0 spark, 1 ring(aoe), 2 slash, 3 smoke/puff, 4 boss-warn, 5 beam, 6 heal, 7 flash
// ---------- log ----------
const Log=(function(){
  const T0=15*3600+19*60+6;let mode=MOBILE?'hl':'sum',raw=[],dirty=true,expanded=false,lastRender=0,lastLineN=0;
  const box=$('#logbox');
  const clk=t=>{const s=Math.floor(T0+t);const p=n=>String(n%60).padStart(2,'0');return `[${p(Math.floor(s/3600)%24)}:${p(Math.floor(s/60))}:${p(s)}]`};
  const fmt=n=>n.toLocaleString('en-US');
  function push(ev){ev.t=S.t;raw.push(ev);if(raw.length>3200)raw.splice(0,800);dirty=true}
  function sumBucket(es){
    const out=[];const kills={},dmg={},inc={},loot={};let ke=0,exp=0,hpL=null,sc=0,crit=0;
    for(const e of es){
      if(e.k==='kill'){kills[e.mob]=(kills[e.mob]||0)+1;ke++;exp+=e.exp}
      else if(e.k==='hit'){const d=dmg[e.mob]||(dmg[e.mob]={n:0,d:0,c:0});d.n+=e.n||1;d.d+=e.dmg;if(e.crit)d.c++}
      else if(e.k==='mobhit'){const d=inc[e.mob]||(inc[e.mob]={n:0,d:0});d.n++;d.d+=e.dmg;hpL=e}
      else if(e.k==='loot'&&!e.rare){loot[e.item]=(loot[e.item]||0)+1}
      else out.push(e)}
    const L=[];
    if(ke)L.push(['normal',`擊敗 ${Object.entries(kills).map(([k,v])=>k+' ×'+v).join('、')}。`]);
    for(const m in dmg){const d=dmg[m];L.push(['normal',`對 ${m} ×${d.n} 造成共 ${fmt(d.d)} 點傷害${d.c?'（暴擊 '+d.c+'）':''}。`])}
    for(const m in inc){const d=inc[m];L.push(['mob',`${m} ×${d.n} 對你造成共 ${fmt(d.d)} 點傷害。（HP ${hpL.hp}/${hpL.maxhp}）`])}
    if(ke)L.push(['exp',`獲得 Base EXP ${fmt(exp)} / Job EXP ${fmt(Math.round(exp/2))}（本秒擊殺 ×${ke}）。`]);
    const li=Object.entries(loot);if(li.length)L.push(['loot',`撿取 ${li.map(([k,v])=>k+(v>1?' ×'+v:'')).join('、')}。`]);
    out.forEach(e=>{const s=special(e);if(s)L.push(s)});
    return L;
  }
  function special(e){
    switch(e.k){
      case 'loot':return [e.rare?'gold':'loot',`撿取 ${e.item}${e.n>1?' ×'+e.n:''}。${e.rare?' ★稀有！':''}`];
      case 'levelup':return ['exp',`★ Base Lv 升到 ${e.lv}！`];
      case 'die':return ['mob',`你被 ${e.mob} 打倒了。（${e.map}）`];
      case 'warn':return ['warn',e.text];
      case 'boss':return ['boss',`★ BOSS 出現！${e.name}`];
      case 'bosshit':return ['boss',`BOSS ${e.name} 對你造成 ${e.dmg} 點傷害。`];
      case 'bosskill':return ['boss',`★ BOSS ${e.name} 被擊倒！掉寶光柱！`];
      case 'sys':return ['sys',e.text];
    }return null;
  }
  function lines(){
    const out=[];let i=0;const n=raw.length;
    // bucket by whole simulated second
    let start=Math.max(0,n-(mode==='full'?260:700));let cur=-1,bucket=[];
    const flush=()=>{if(!bucket.length)return;const t=cur;
      if(mode==='sum'){sumBucket(bucket).forEach(l=>out.push([t,l[0],l[1]]))}
      else if(mode==='full'){
        if(bucket.length>30){out.push([t,'gray','（本秒訊息超過 30 行，自動改成摘要）']);sumBucket(bucket).forEach(l=>out.push([t,l[0],l[1]]))}
        else bucket.forEach(e=>{const s=special(e);if(s)return out.push([e.t,s[0],s[1]]);
          if(e.k==='hit')out.push([e.t,'normal',e.n>1?`對 ${e.mob} 等 ${e.n} 隻造成 ${fmt(e.dmg)} 點傷害${e.crit?'（暴擊）':''}。`:`對 ${e.mob} 造成 ${fmt(e.dmg)} 點傷害${e.crit?'（暴擊！）':''}。`]);
          else if(e.k==='mobhit')out.push([e.t,'mob',`${e.mob} 對你造成 ${e.dmg} 點傷害。（HP ${e.hp}/${e.maxhp}）`]);
          else if(e.k==='kill')out.push([e.t,'normal',`擊敗 ${e.mob}。`]),out.push([e.t,'exp',`獲得 Base EXP ${e.exp} / Job EXP ${Math.round(e.exp/2)}。`]);
          else if(e.k==='loot')out.push([e.t,'loot',`撿取 ${e.item}${e.n>1?' ×'+e.n:''}。`])})}
      else{ // highlight
        bucket.forEach(e=>{if(e.k==='kill'){e.tot%10===0&&out.push([e.t,'exp',`累計擊殺 ${fmt(e.tot)}。`])}
          else if(e.k==='loot'){e.rare&&out.push([e.t,'gold',`撿取 ${e.item}。★稀有！`])}
          else if(e.k==='mobhit'){if(e.hp/e.maxhp<.3)out.push([e.t,'warn',`⚠ HP 剩 ${Math.round(e.hp/e.maxhp*100)}%（${e.hp}/${e.maxhp}）`])}
          else{const s=special(e);if(s)out.push([e.t,s[0],s[1]])}})}
      bucket=[]};
    for(let j=start;j<n;j++){const e=raw[j];const b=Math.floor(e.t);if(b!==cur){flush();cur=b}bucket.push(e)}
    flush();return out;
  }
  function render(force){
    const now=performance.now();if(!dirty&&!force)return;if(now-lastRender<400&&!force)return;lastRender=now;dirty=false;
    const L=lines();const keep=MOBILE?(expanded?40:14):(expanded?90:50);const sl=L.slice(-keep);
    let h='';for(const l of sl){h+=`<div class="ln c-${l[1]}"><span class="ts">${clk(l[0])}</span> ${l[2]}</div>`}h+='<div class="ln c-gray">&gt;_</div>';
    const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<30;box.innerHTML=h;if(atBottom||force)box.scrollTop=box.scrollHeight;
    $('#log-n').textContent=L.length+' 行';
  }
  function setMode(m){mode=m;document.querySelectorAll('#logwin [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===m));dirty=true;render(true)}
  function reset(){raw=[];dirty=true;render(true)}
  return {push,render,setMode,reset,get mode(){return mode},setExpanded(v){expanded=v;dirty=true;render(true)}};
})();
// ---------- layout ----------
let bgCv=null,bgKey='';
function layout(){
  const w=cv.clientWidth|0,h=cv.clientHeight|0;if(!w||!h)return;
  const base=MOBILE?.6:clamp(w/1280,.55,1.5);S.zoom=base*S.zoomMul;
  S.W=w/S.zoom;S.H=h/S.zoom;S.cx=S.W/2;S.cy=S.H/2+8;S.rx=Math.max(160,S.W*.43);S.ry=Math.max(110,S.H*.41);
  const pw=Math.round(w*DPR),ph=Math.round(h*DPR);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph}
  $('#z-val').textContent=Math.round(S.zoomMul*100)+'%';
  const key=pw+'x'+ph;if(key!==bgKey){bgKey=key;bakeBg(w,h)}
  chars.forEach(c=>{c.x=clamp(c.x,20,S.W-20);c.y=clamp(c.y,40,S.H-10)});assignAnchors();
}
function bakeBg(w,h){
  const cols=Math.ceil(w/S.zoom/32),rows=Math.ceil(h/S.zoom/32);
  const src=BgArt.render('field',cols,rows);bgCv=document.createElement('canvas');bgCv.width=Math.round(w*DPR);bgCv.height=Math.round(h*DPR);
  const x=bgCv.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,bgCv.width,bgCv.height);
  // subtle vignette, so the arena reads as a stage
  const g=x.createRadialGradient(bgCv.width/2,bgCv.height/2,Math.min(bgCv.width,bgCv.height)*.25,bgCv.width/2,bgCv.height/2,Math.max(bgCv.width,bgCv.height)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,20,0,.38)');x.fillStyle=g;x.fillRect(0,0,bgCv.width,bgCv.height);
}
function assignAnchors(){
  const n=CAP.ch,g=S.want.gat,sc=.95-g*.75;const R=[S.rx*.78*sc,S.ry*.78*sc];const A=[];
  for(let i=0;i<n;i++){const a=rnd()*6.283,r=Math.sqrt(rnd());A.push([S.cx+Math.cos(a)*R[0]*r,S.cy+Math.sin(a)*R[1]*r])}
  const minD=MOBILE?40:56;
  for(let it=0;it<40;it++){for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const dx=A[j][0]-A[i][0],dy=(A[j][1]-A[i][1])*1.25,d=Math.hypot(dx,dy);if(d<minD&&d>.01){const p=(minD-d)/2/d;A[i][0]-=dx*p;A[i][1]-=dy*p/1.25;A[j][0]+=dx*p;A[j][1]+=dy*p/1.25}}}
  chars.forEach((c,i)=>{c.ax=A[i][0];c.ay=A[i][1]});
}
// ---------- entities ----------
const JOBKEYS=['ch_kni_m','ch_arc_f','ch_rgr_m','ch_acl_f','ch_lnc_f','ch_gun_m','ch_mnk_f','ch_hsn_m','ch_dnc_f','ch_brd_m','ch_mer_f','ch_kni_f','ch_rgr_f','ch_arc_m','ch_gun_f','ch_acl_m','ch_lnc_m','ch_mnk_m','ch_hsn_f','ch_mer_m'];
function makeChars(){
  chars=[];const names=NAMES.slice().sort(()=>rnd()-.5);
  for(let i=0;i<CAP.ch;i++){
    const key=i===0?'ch_arc_f':JOBKEYS[(i)%JOBKEYS.length];const sh=S.sheets[key];
    const lv=i===0?S.lv:Math.round(rr(32,99));
    const ranged=sh.atk!=='melee';
    chars.push({id:i,key,sh,img:S.imgs[key],name:i===0?'測試冒險者':names[i%names.length]+(i>=names.length?i:''),lv,
      x:S.cx+rr(-60,60),y:S.cy+rr(-40,40),ax:S.cx,ay:S.cy,face:rnd()<.5?1:-1,st:0,stT:0,hp:900,maxhp:i===0?1400:Math.round(rr(700,1500)),
      tgt:null,cd:rr(0,1),hitDone:true,range:sh.atk==='melee'?(sh.job==='dnc'?62:34):sh.atk==='magic'?210:230,spd:rr(70,96),acl:sh.job==='acl',
      atkDur:sh.attack.n/sh.attack.fps,power:rr(.8,1.25)*(i===0?1.2:1),dmgDone:0,flash:0,lod:2,lab:false,att:0,tOff:rr(0,5),deadT:0,self:i===0,lastNum:0,accD:0,accN:0,blocked:0});
    chars[i].hp=chars[i].maxhp;
  }
}
function makeMobs(){mobs=[];for(let i=0;i<CAP.mob;i++)mobs.push({id:i,on:false,dead:false,ty:MOBTYPES[0],x:0,y:0,hp:1,maxhp:1,face:1,tgt:null,flash:0,hurt:0,dieT:0,cd:0,lod:2,t:rnd()*9,lastNum:0,accD:0,accN:0,respawn:0,spd:40,lv:10})}
function spawnMob(m,fresh){
  m.ty=MOBTYPES[(rnd()*MOBTYPES.length)|0];const a=rnd()*6.283,k=fresh?rr(.35,1.05):rr(.98,1.12);
  m.x=S.cx+Math.cos(a)*S.rx*k;m.y=S.cy+Math.sin(a)*S.ry*k;m.lv=Math.round(rr(8,26));m.maxhp=Math.round(rr(420,760));m.hp=m.maxhp;m.dead=false;m.dieT=0;m.on=true;m.flash=0;m.hurt=0;m.spd=rr(30,52);m.tgt=null;m.cd=rr(0,1.4);m.respawn=0;m.accD=m.accN=0;m.lastNum=0;
}
function aliveMobs(){let n=0;for(let i=0;i<mobs.length;i++)if(mobs[i].on&&!mobs[i].dead)n++;return n}
// effective counts under quality
function eff(){const f=QMUL[S.q];return {ch:Math.max(1,Math.min(S.want.ch,Math.round(CAP.ch*f))),mob:Math.min(S.want.mob,Math.round(CAP.mob*f))}}
// ---------- combat ----------
function mobName(m){return m.ty.n}
function dealDmg(att,m,dmg,crit,aoe){
  if(m.dead)return;m.hp-=dmg;m.flash=.12;m.hurt=3;att.dmgDone+=dmg;
  const self=att.self;
  if(m.lod===0||att.lod===0){if(S.opt.dmg)pushNum(m.x+rr(-6,6),m.y-m.ty.hh-6,String(dmg),crit?'c':'w',crit?1.35:1)}
  else if(m.lod===1&&S.opt.dmg){m.accD+=dmg;m.accN++;const win=S.q<=1?.6:.35;if(S.t-m.lastNum>win){pushNum(m.x+rr(-10,10),m.y-m.ty.hh-6,String(m.accD),crit?'c':'w',.78,.8);if(m.accN>1)pushNum(m.x+16,m.y-m.ty.hh+8,'×'+m.accN,'w',.5,.6);m.accD=m.accN=0;m.lastNum=S.t}}
  if(self)Log.push({k:'hit',mob:mobName(m),dmg,crit,n:1});
  if(m.hp<=0)killMob(m,att);
}
function killMob(m,att){
  m.dead=true;m.dieT=0;S.kills++;S.killsSince++;S.killHist.push(S.t);
  const exp=Math.round(m.lv*rr(.8,1.4));S.exp+=exp;S.expBar+=exp;
  if(att.self||true){ // self gets credit for kills inside its AoE / nearby (fake data)
    if(att.self||dist2(att,chars[0])<260*260){
      Log.push({k:'kill',mob:mobName(m),exp,tot:S.kills});
      if(rnd()<.07){const it=ITEMS[(rnd()*ITEMS.length)|0],rare=it[1]&&rnd()<.5;Log.push({k:'loot',item:it[0],n:1,rare:!!rare});if(rare)pushFx(5,m.x,m.y,1.4)}
      else if(rnd()<.25)Log.push({k:'loot',item:ITEMS[(rnd()*3)|0][0],n:1+((rnd()*3)|0),rare:false});
      if(S.expBar>420+S.lv*12){S.expBar=0;S.lv++;chars[0].lv=S.lv;Log.push({k:'levelup',lv:S.lv});pushFx(1,chars[0].x,chars[0].y,.9,60,2)}
    }
  }
  pushFx(3,m.x,m.y-8,.45);
  m.respawn=rr(.5,1.5);
  if(S.kills>=S.nextBossAt&&!S.boss){S.nextBossAt+=150;spawnBoss(true)}
}
function dist2(a,b){const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy}
function spawnBoss(auto){
  if(S.boss&&!S.boss.dead)return;const def=BOSSES[(rnd()*BOSSES.length)|0],im=def.im;const sc=1.9*(MOBILE?.8:1);
  const n=eff().ch;const max=Math.max(40000,n*4800);
  S.boss={def,x:S.cx+rr(-S.rx*.4,S.rx*.4),y:S.cy-S.ry*.75,hp:max,maxhp:max,w:im.width*sc*(120/im.height),h:120*sc,face:1,dead:false,dieT:0,flash:0,warnT:-1,wx:0,wy:0,cd:3,lod:0,lock:0,t:0};
  const b=S.boss;b.w=im.width/im.height*b.h;
  $('#bossbar').classList.remove('hidden');$('#bossname').textContent=def.n+'（BOSS）';
  const bn=$('#banner');bn.textContent='BOSS 出現！'+def.n;bn.classList.remove('hidden');bn.style.animation='none';bn.offsetHeight;bn.style.animation='';
  setTimeout(()=>bn.classList.add('hidden'),2200);
  Log.push({k:'boss',name:def.n});pushFx(7,0,0,.5);S.bossCool=60;
}
function bossDmg(att,dmg,crit){
  const b=S.boss;if(!b||b.dead)return;b.hp-=dmg;b.flash=.1;att.dmgDone+=dmg;
  if(S.opt.dmg&&(att.lod<=1||rnd()<.4))pushNum(b.x+rr(-30,30),b.y-b.h-4,String(dmg),crit?'c':'o',crit?1.5:1.15);
  if(att.self)Log.push({k:'hit',mob:b.def.n+'（BOSS）',dmg,crit,n:1});
  if(b.hp<=0){b.dead=true;b.dieT=0;pushFx(7,0,0,.7,1);for(let i=0;i<3;i++)pushFx(5,b.x+rr(-60,60),b.y,1.8);Log.push({k:'bosskill',name:b.def.n});S.nextBossAt=Math.max(S.nextBossAt,S.kills+150)}
}
function attackStart(c,tgt,isBoss){
  c.st=2;c.stT=0;c.hitDone=false;c.cd=rr(.85,1.25);c.tgt=tgt;c.tgtBoss=isBoss;c.face=tgt.x>=c.x?1:-1;
}
function attackHit(c){
  const t=c.tgt;if(!t)return;const isBoss=!!c.tgtBoss;if(!isBoss&&(t.dead||!t.on))return;if(isBoss&&(!S.boss||S.boss.dead))return;
  const base=(c.lv*1.1+30)*c.power;
  if(c.sh.atk==='melee'){
    if(isBoss){const d=Math.round(base*rr(.8,1.3)),cr=rnd()<.15;bossDmg(c,cr?d*2:d,cr)} else {const d=Math.round(base*rr(.8,1.3)),cr=rnd()<.12;dealDmg(c,t,cr?d*2:d,cr);pushFx(c.sh.job==='dnc'?2:0,t.x,t.y-18,.22,c.face)}
  }else{ // ranged / magic → projectile
    for(let i=0;i<PROJ.length;i++){const p=PROJ[i];if(!p.on){p.on=1;p.x=c.x+c.face*14;p.y=c.y-34;p.sx=p.x;p.sy=p.y;p.tgt=t;p.tb=isBoss;p.att=c;p.t=0;p.kind=c.sh.atk==='magic'?1:0;const d=Math.hypot(t.x-p.x,t.y-18-p.y);p.dur=clamp(d/(p.kind?360:560),.12,.7);
      const dm=Math.round(base*rr(.8,1.3)),cr=rnd()<.15;p.dmg=cr?dm*2:dm;p.crit=cr;break}}
  }
}
function projHit(p){
  const c=p.att,t=p.tgt;if(p.tb){if(S.boss&&!S.boss.dead)bossDmg(c,p.dmg,p.crit);if(p.kind)pushFx(1,S.boss.x,S.boss.y-30,.45,70,1);return}
  if(!t||t.dead||!t.on){return}
  if(p.kind){ // magic AoE: hits up to 12 nearby mobs
    pushFx(1,t.x,t.y-14,.5,64,0);let n=0,tot=0;
    dealDmg(c,t,p.dmg,p.crit,true);n++;
    for(let i=0;i<mobs.length&&n<12;i++){const m=mobs[i];if(m===t||!m.on||m.dead)continue;const dx=m.x-t.x,dy=m.y-t.y;if(dx*dx+dy*dy<70*70){dealDmg(c,m,Math.round(p.dmg*rr(.45,.7)),false,true);n++}}
    if(S.boss&&!S.boss.dead&&dist2(S.boss,t)<80*80)bossDmg(c,Math.round(p.dmg*.5),false);
  }else{dealDmg(c,t,p.dmg,p.crit);pushFx(0,t.x,t.y-20,.2,c.face)}
}
// ---------- update ----------
let frameNo=0;
function update(dt){
  S.t+=dt;frameNo++;const E=eff();
  // mobs count control
  let alive=0;for(let i=0;i<mobs.length;i++){const m=mobs[i];if(m.on&&!m.dead)alive++}
  // soft-remove surplus (quality/slider), spawn missing
  if(alive>E.mob){for(let i=mobs.length-1;i>=0&&alive>E.mob;i--){const m=mobs[i];if(m.on&&!m.dead){m.on=false;alive--}}}
  for(let i=0;i<mobs.length;i++){const m=mobs[i];
    if(m.on&&m.dead){m.dieT+=dt;if(m.dieT>.55){m.on=false;m.respawn=Math.max(0,m.respawn-.55)}}
    if(!m.on&&alive<E.mob&&m.respawn<=0){spawnMob(m,S.t<.3);alive++}
    else if(!m.on&&m.respawn>0)m.respawn-=dt}
  const nCh=E.ch;
  // char AI
  const boss=S.boss&&!S.boss.dead?S.boss:null;
  for(let i=0;i<chars.length;i++){const c=chars[i];c.act=i<nCh;if(!c.act)continue;
    if(c.hp<=0){c.deadT+=dt;c.st=4;if(c.deadT>2.2){c.hp=c.maxhp*.6;c.deadT=0;c.st=0;c.x=c.ax;c.y=c.ay}continue}
    c.stT+=dt;c.cd-=dt;if(c.flash>0)c.flash-=dt;if(c.hp<c.maxhp)c.hp=Math.min(c.maxhp,c.hp+c.maxhp*.03*dt);
    // retarget (staggered)
    if((frameNo+i)%10===0&&c.st!==2){
      let best=null,bd=1e12,bb=false;const R=c.range+(c.sh.atk==='melee'?90:0),R2=R*R;
      if(boss){const d=dist2(c,boss);if(d<(R+120)*(R+120)&&(c.sh.atk==='melee'?true:true)){best=boss;bd=d;bb=true}}
      if(!bb||rnd()<.35)for(let j=0;j<mobs.length;j++){const m=mobs[j];if(!m.on||m.dead)continue;const d=dist2(c,m);if(d<R2&&d<bd){bd=d;best=m;bb=false}}
      c.tgt=best;c.tgtBoss=bb&&best===boss;
    }
    const t=c.tgt;let mx=0,my=0,want=false;
    if(t&&((c.tgtBoss&&boss)||(!c.tgtBoss&&t.on&&!t.dead))){
      const tx=t.x,ty=t.y,dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy),reach=c.range*(c.sh.atk==='melee'?1:.9)+(c.tgtBoss?boss.h*.25:0);
      if(c.st!==2){c.face=dx>=0?1:-1}
      if(d>reach){if(c.st!==2){mx=dx/d;my=dy/d;want=true}}
      else if(c.cd<=0&&c.st!==2){attackStart(c,t,c.tgtBoss)}
    }else{c.tgt=null;const dx=c.ax-c.x,dy=c.ay-c.y,d=Math.hypot(dx,dy);if(d>6&&c.st!==2){mx=dx/d;my=dy/d;want=true;if(Math.abs(dx)>3)c.face=dx>=0?1:-1}}
    if(c.st===2){ // attack anim
      if(!c.hitDone&&c.stT>=c.atkDur*.55){c.hitDone=true;attackHit(c)}
      if(c.stT>=c.atkDur)c.st=0,c.stT=0;
    }else{c.st=want?1:0}
    if(want){const sp=c.spd*dt;c.x+=mx*sp;c.y+=my*sp}
    // healer ability
    if(c.acl&&(frameNo+i)%90===0&&rnd()<.5){pushFx(6,c.x,c.y-30,.8);for(let j=0;j<nCh;j++){const o=chars[j];if(dist2(c,o)<140*140)o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.2)}}
  }
  // char separation (O(n^2), n<=40)
  for(let i=0;i<nCh;i++){const a=chars[i];if(a.hp<=0)continue;for(let j=i+1;j<nCh;j++){const b=chars[j];if(b.hp<=0)continue;const dx=b.x-a.x,dy=(b.y-a.y)*1.3,d2=dx*dx+dy*dy,mn=MOBILE?30:40;if(d2<mn*mn&&d2>.01){const d=Math.sqrt(d2),p=(mn-d)*.45/d;a.x-=dx*p;a.y-=dy*p/1.3;b.x+=dx*p;b.y+=dy*p/1.3}}}
  // mobs
  for(let i=0;i<chars.length;i++)chars[i].att=0;
  const gx=Math.max(1,Math.ceil(S.W/40)),gy=Math.max(1,Math.ceil(S.H/40));
  if(!update.head||update.head.length<gx*gy){update.head=new Int16Array(gx*gy)}update.head.fill(-1);if(!update.next)update.next=new Int16Array(300);
  for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on||m.dead)continue;const k=clamp((m.x/40)|0,0,gx-1)+clamp((m.y/40)|0,0,gy-1)*gx;update.next[i]=update.head[k];update.head[k]=i}
  for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on)continue;m.t+=dt;if(m.flash>0)m.flash-=dt;if(m.hurt>0)m.hurt-=dt;if(m.dead)continue;
    if((frameNo+i)%14===0||!m.tgt||m.tgt.hp<=0||!m.tgt.act){let best=null,bd=1e12;for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const d=dist2(m,c);if(d<bd){bd=d;best=c}}m.tgt=best}
    const c=m.tgt;if(!c)continue;const dx=c.x-m.x,dy=c.y-m.y,d=Math.hypot(dx,dy)||1;
    let moving=false;
    if(d>30){const sp=m.spd*dt;m.x+=dx/d*sp;m.y+=dy/d*sp;moving=true;if(Math.abs(dx)>2)m.face=dx>0?1:-1}
    else{m.face=dx>0?1:-1;if(c.att<5){c.att++;m.cd-=dt;if(m.cd<=0){m.cd=rr(1.1,1.8);const dmg=Math.round(rr(6,20)*(1+c.lv/150));c.hp-=dmg;c.flash=.12;
        if(c.self){Log.push({k:'mobhit',mob:mobName(m),dmg,hp:Math.max(0,Math.round(c.hp)),maxhp:c.maxhp});if(S.opt.dmg)pushNum(c.x,c.y-76,String(dmg),'r',1)}
        if(c.hp<=0){c.deadT=0;c.st=4;if(c.self)Log.push({k:'die',mob:mobName(m),map:'霧沼濕地 08'});}}}}
    // separation via grid neighbours
    const k0=clamp((m.x/40)|0,0,gx-1),k1=clamp((m.y/40)|0,0,gy-1);
    for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const kx=k0+ox,ky=k1+oy;if(kx<0||ky<0||kx>=gx||ky>=gy)continue;let j=update.head[kx+ky*gx],n=0;
      while(j>=0&&n++<6){if(j!==i){const o=mobs[j],ddx=m.x-o.x,ddy=m.y-o.y,dd=ddx*ddx+ddy*ddy;if(dd<18*18&&dd>.01){const q=Math.sqrt(dd),p=(18-q)*.4/q;m.x+=ddx*p;m.y+=ddy*p}}j=update.next[j]}}
  }
  // boss
  if(S.boss){const b=S.boss;b.t+=dt;if(b.flash>0)b.flash-=dt;if(b.dead){b.dieT+=dt;if(b.dieT>1.4){S.boss=null;$('#bossbar').classList.add('hidden')}}
    else{ // walk towards nearest char, slam with warning ring
      let best=null,bd=1e12;for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const d=dist2(b,c);if(d<bd){bd=d;best=c}}
      if(best){const dx=best.x-b.x,dy=best.y-b.y,d=Math.hypot(dx,dy)||1;if(d>b.h*.5){b.x+=dx/d*34*dt;b.y+=dy/d*34*dt}b.face=dx>0?1:-1;}
      b.lock+=dt;b.cd-=dt;
      if(b.warnT<0&&b.cd<=0){b.warnT=0;b.wx=best?best.x:b.x;b.wy=best?best.y:b.y;b.cd=rr(4,6)}
      if(b.warnT>=0){b.warnT+=dt;if(b.warnT>=.8){b.warnT=-1;pushFx(1,b.wx,b.wy,.55,100,2);S.shake=.3;
        for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const dx=c.x-b.wx,dy=c.y-b.wy;if(dx*dx+dy*dy<100*100){const dmg=Math.round(rr(120,260));c.hp-=dmg;c.flash=.2;
          if(c.self){Log.push({k:'bosshit',name:b.def.n,dmg});if(S.opt.dmg)pushNum(c.x,c.y-76,String(dmg),'r',1.3);Log.push({k:'warn',text:'⚠ BOSS 範圍攻擊！'})}
          if(c.hp<=0){c.deadT=0;c.st=4}}}}}
      $('#bossfill').style.width=Math.max(0,b.hp/b.maxhp*100)+'%'}}
  // projectiles
  for(let i=0;i<PROJ.length;i++){const p=PROJ[i];if(!p.on)continue;p.t+=dt;const u=p.t/p.dur;const t=p.tgt;
    if(p.tb&&S.boss){p.ex=S.boss.x;p.ey=S.boss.y-S.boss.h*.5}else if(t){p.ex=t.x;p.ey=t.y-18}
    p.x=p.sx+(p.ex-p.sx)*Math.min(1,u);p.y=p.sy+(p.ey-p.sy)*Math.min(1,u)-(p.kind?Math.sin(Math.min(1,u)*Math.PI)*16:0);
    if(u>=1){p.on=0;projHit(p)}}
  // nums, fx
  numCount=0;for(let i=0;i<NUMS.length;i++){const n=NUMS[i];if(!n.on)continue;n.t+=dt;if(n.t>=n.dur)n.on=0;else numCount++}
  fxCount=0;for(let i=0;i<FX.length;i++){const f=FX[i];if(!f.on)continue;f.t+=dt;if(f.t>=f.dur)f.on=0;else fxCount++}
  if(S.shake>0)S.shake=Math.max(0,S.shake-dt);
  for(let i=0;i<BUB.length;i++){const b=BUB[i];if(b.on){b.t+=dt;if(b.t>4)b.on=0}}
  if(S.t>S.nextBub){S.nextBub=S.t+rr(.6,1.8);let n=0;for(const b of BUB)if(b.on)n++;const lim=CAP.bub*(S.q>=2?1:S.q===1?.5:0);if(n<lim){const c=chars[(rnd()*Math.min(nCh,12))|0];if(c&&c.hp>0){for(const b of BUB)if(!b.on){b.on=1;b.ch=c;b.t=0;b.txt=SAY[(rnd()*SAY.length)|0];break}}}}
  if(S.bossCool>0)S.bossCool-=dt;
  // LOD retier every 250ms
  if(S.t-S.lodT>=.25||S.lodT===undefined)retier();
}
S.nextBub=2;S.lodT=-1;
function retier(){
  S.lodT=S.t;const E=eff(),f=QMUL[S.q];const R=CAP.l1r*(S.q>=3?1:S.q===2?.7:S.q===1?.5:0),N=Math.round(CAP.l1*(S.q>=3?1:S.q===2?.7:S.q===1?.5:0));
  // chars: L0 = self; L1 nearest N; rest L2
  const cl=retier.cl||(retier.cl=[]);cl.length=0;
  for(let i=0;i<E.ch;i++){const c=chars[i];c.lod=2;if(c.self){c.lod=0;continue}const dx=c.x-S.cx,dy=c.y-S.cy;c.dc=dx*dx+dy*dy;cl.push(c)}
  cl.sort((a,b)=>a.dc-b.dc);for(let i=0;i<cl.length;i++){if(i<N&&cl[i].dc<R*R*2.2)cl[i].lod=1}
  const ml=retier.ml||(retier.ml=[]);ml.length=0;
  for(let i=0;i<mobs.length;i++){const m=mobs[i];m.lod=2;if(!m.on||m.dead)continue;const dx=m.x-S.cx,dy=m.y-S.cy;m.dc=dx*dx+dy*dy;ml.push(m)}
  ml.sort((a,b)=>a.dc-b.dc);for(let i=0;i<ml.length;i++){if(i<N&&ml[i].dc<R*R*2.2)ml[i].lod=1}
}
// ---------- draw ----------
const BK=256,bhead=new Int16Array(BK),bnext=new Int16Array(400),blist=new Array(400);
function drawChar(c,T){
  const sh=c.sh,a=c.st===2?sh.attack:c.st===1?sh.act.walk:c.st===4?sh.act.down:sh.act.idle;
  const t=c.st===2||c.st===4?c.stT:S.t+c.tOff;let i;
  if(c.lod===2){i=a.n>1?(Math.floor(t*4)%2)*(a.n>2?2:1):0;if(c.st===2)i=Math.min(a.n-1,Math.floor(c.stT*a.fps))}
  else{const fps=c.lod===1&&c.st===0?Math.min(a.fps,4):Math.min(a.fps,c.lod===1?8:a.fps);i=Math.floor(t*fps);i=(c.st===2||c.st===4)?Math.min(i,a.n-1):i%a.n}
  const cw=sh.cw,ch=sh.ch,sx=(a.s+i)*cw,S_=CHAR_S;
  if(S.q>=2)ctx.drawImage(shadowCv,0,0,48,20,c.x-cw*S_*.42,c.y-5,cw*S_*.84,cw*S_*.84*20/48);
  ctx.setTransform(c.face*T,0,0,T,c.x*T,c.y*T);
  ctx.drawImage(c.img,Math.round(sx),0,Math.round(cw),Math.round(ch),-cw*S_/2,-sh.base*S_,cw*S_,ch*S_);
  if(c.flash>0&&c.lod<2||c.flash>0&&S.q>=1){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;ctx.drawImage(c.img,Math.round(sx),0,Math.round(cw),Math.round(ch),-cw*S_/2,-sh.base*S_,cw*S_,ch*S_);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
  ctx.setTransform(T,0,0,T,0,0);
}
function drawMob(m,T){
  const ty=m.ty,k=m.dead?1-m.dieT/.55:1;const bob=m.dead?0:(m.lod===2?0:Math.sin(m.t*5+m.id)*-1.4);
  if(S.q>=2)ctx.drawImage(shadowCv,m.x-ty.w*.45,m.y-4,ty.w*.9,ty.w*.9*20/48);
  const sc=m.dead?.6+.4*k:1;const sz=m.lod===2&&!m.dead?1:1;
  ctx.setTransform((m.face>0?-1:1)*T*sc,0,0,T*sc,m.x*T,(m.y+bob)*T);
  if(m.dead)ctx.globalAlpha=k;
  ctx.drawImage(ty.cv,-ty.w/2,-ty.hh,ty.w,ty.hh);
  if(m.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(m.dead?k:1)*.6;ctx.drawImage(ty.cv,-ty.w/2,-ty.hh,ty.w,ty.hh);ctx.globalCompositeOperation='source-over'}
  ctx.globalAlpha=1;ctx.setTransform(T,0,0,T,0,0);
}
function drawBoss(T){
  const b=S.boss,im=b.def.im;let k=b.dead?1-b.dieT/1.4:1;
  ctx.drawImage(shadowCv,b.x-b.w*.5,b.y-8,b.w,b.w*.32);
  ctx.setTransform((b.face>0?-1:1)*T,0,0,T,b.x*T,b.y*T);ctx.globalAlpha=Math.max(0,k);
  ctx.drawImage(im,-b.w/2,-b.h,b.w,b.h);
  if(b.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*k;ctx.drawImage(im,-b.w/2,-b.h,b.w,b.h);ctx.globalCompositeOperation='source-over'}
  ctx.globalAlpha=1;ctx.setTransform(T,0,0,T,0,0);
}
const stats={fps:0,p95:0,work:[],frames:0,lastFpsT:performance.now(),drawn:{ch:0,mob:0}};
function draw(){
  const T=DPR*S.zoom;ctx.setTransform(1,0,0,1,0,0);
  if(bgCv)ctx.drawImage(bgCv,0,0);else{ctx.fillStyle='#4c7a38';ctx.fillRect(0,0,cv.width,cv.height)}
  ctx.setTransform(T,0,0,T,0,0);
  const shk=S.shake>0&&S.q>=2?(rnd()-.5)*8*S.shake:0;if(shk)ctx.translate(shk,shk*.6);
  // arena ring decoration
  if(S.opt.ring){ctx.strokeStyle='rgba(235,245,200,.28)';ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.beginPath();ctx.ellipse(S.cx,S.cy,S.rx,S.ry,0,0,7);ctx.stroke();ctx.setLineDash([])}
  // ground decals: boss lock + warning
  const boss=S.boss;
  if(boss&&!boss.dead){ctx.save();ctx.translate(boss.x,boss.y);ctx.scale(1,.42);ctx.strokeStyle='#ff3b3b';ctx.lineWidth=5;ctx.shadowColor='#f00';ctx.shadowBlur=S.q>=2?8:0;ctx.beginPath();ctx.arc(0,0,boss.w*.42*(1+.05*Math.sin(boss.lock*6)),0,7);ctx.stroke();ctx.restore();
    if(boss.warnT>=0){const u=boss.warnT/.8;ctx.save();ctx.translate(boss.wx,boss.wy);ctx.scale(1,.5);ctx.fillStyle=`rgba(255,40,40,${.12+.2*u})`;ctx.strokeStyle=`rgba(255,80,60,${.5+.4*u})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,100,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,0,100*u,0,7);ctx.stroke();ctx.restore()}}
  // y-bucket sort
  bhead.fill(-1);let n=0;const H=S.H+200;
  const E=eff();let dc=0,dm=0;
  for(let i=0;i<E.ch;i++){const c=chars[i];const b=clamp(((c.y+100)/H*(BK-1))|0,0,BK-1);blist[n]=c;bnext[n]=bhead[b];bhead[b]=n++;dc++}
  for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on)continue;const b=clamp(((m.y+100)/H*(BK-1))|0,0,BK-1);blist[n]=m;bnext[n]=bhead[b];bhead[b]=n++;dm++}
  if(boss){const b=clamp(((boss.y+100)/H*(BK-1))|0,0,BK-1);blist[n]=boss;bnext[n]=bhead[b];bhead[b]=n++}
  stats.drawn.ch=dc;stats.drawn.mob=dm;
  for(let b=0;b<BK;b++){let j=bhead[b];while(j>=0){const e=blist[j];if(e.sh)drawChar(e,T);else if(e.ty)drawMob(e,T);else drawBoss(T);j=bnext[j]}}
  // fx (world) 
  drawFx(T);
  // overlays in screen space
  ctx.setTransform(DPR,0,0,DPR,0,0);const Z=S.zoom;
  // mob hp bars (hurt, L0/L1)
  if(S.opt.names&&S.q>=1){for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on||m.dead||m.hurt<=0||m.lod===2)continue;const x=m.x*Z,y=(m.y-m.ty.hh)*Z-4,w=26,f=m.hp/m.maxhp;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-w/2-1,y-1,w+2,5);ctx.fillStyle=f>.5?'#4ee05a':f>.25?'#e7d13b':'#e04a3b';ctx.fillRect(x-w/2,y,w*Math.max(0,f),3)}}
  nameplates(Z);
  // damage numbers
  for(let i=0;i<NUMS.length;i++){const nm=NUMS[i];if(!nm.on)continue;const u=nm.t/nm.dur;const rise=30*(1-Math.pow(1-Math.min(1,u*2),3));
    drawNumber(ctx,nm.x*Z,nm.y*Z-rise,nm.txt,nm.col,nm.sc*(MOBILE?.9:1)*(nm.t<.12?1+(.12-nm.t)*3:1),clamp((1-u)*3,0,1))}
  ctx.globalAlpha=1;
  if(boss&&boss.dead&&boss.dieT<.4){ctx.fillStyle=`rgba(255,255,255,${.7*(1-boss.dieT/.4)})`;ctx.fillRect(0,0,cv.width/DPR,cv.height/DPR)}
}
function drawFx(T){
  for(let i=0;i<FX.length;i++){const f=FX[i];if(!f.on)continue;const u=f.t/f.dur;
    switch(f.k){
      case 0:{ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=1-u;const r=3+u*14;ctx.beginPath();for(let a=0;a<5;a++){const an=a*1.257+f.a;ctx.moveTo(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r);ctx.lineTo(f.x+Math.cos(an)*(r+6),f.y+Math.sin(an)*(r+6))}ctx.stroke();break}
      case 1:{const r=(f.a||60)*(.3+.7*Math.min(1,u*1.6));ctx.save();ctx.translate(f.x,f.y);ctx.scale(1,.55);ctx.globalAlpha=(1-u)*.9;ctx.strokeStyle=f.b===2?'#ff6a4a':f.b===1?'#a070ff':'#ffcf5a';ctx.lineWidth=5*(1-u)+1;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();if(S.q>=2){ctx.globalAlpha=(1-u)*.25;ctx.fillStyle=f.b===2?'#ff3a2a':'#ffe9a0';ctx.fill()}ctx.restore();break}
      case 2:{ctx.strokeStyle='#fff';ctx.globalAlpha=1-u;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,16,-1.2+u*2.2,-.2+u*2.4);ctx.stroke();break}
      case 3:{ctx.globalAlpha=(1-u)*.5;ctx.fillStyle='#eef';ctx.beginPath();ctx.arc(f.x,f.y-u*12,4+u*9,0,7);ctx.fill();break}
      case 5:{const a=Math.max(0,1-f.t/f.dur);const g=ctx.createLinearGradient(0,f.y-140,0,f.y);g.addColorStop(0,'rgba(255,230,120,0)');g.addColorStop(1,`rgba(255,226,90,${a})`);ctx.fillStyle=g;ctx.fillRect(f.x-6,f.y-140,12,140);break}
      case 6:{ctx.fillStyle='#8dffa0';ctx.globalAlpha=1-u;for(let k=0;k<6;k++){ctx.fillRect(f.x+Math.sin(k*1.1+u*4)*20,f.y-u*40-k*4,3,3)}break}
    }ctx.globalAlpha=1}
  // projectiles
  for(let i=0;i<PROJ.length;i++){const p=PROJ[i];if(!p.on)continue;
    if(p.kind){ctx.fillStyle='#c9a8ff';ctx.beginPath();ctx.arc(p.x,p.y,5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,7);ctx.fill()}
    else{const dx=p.ex-p.sx,dy=p.ey-p.sy,d=Math.hypot(dx,dy)||1;ctx.strokeStyle='#f2e6b0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-dx/d*12,p.y-dy/d*12);ctx.stroke()}}
}
const grid={cw:96,ch:64,cnt:null,cols:0};
function nameplates(Z){
  const W=cv.width/DPR,H=cv.height/DPR;const gc=Math.ceil(W/grid.cw)+1,gr=Math.ceil(H/grid.ch)+1;if(!grid.cnt||grid.cnt.length<gc*gr)grid.cnt=new Uint8Array(gc*gr);grid.cnt.fill(0);grid.cols=gc;
  const per=MOBILE?1:3,E=eff();const maxLab=Math.round(CAP.names*(S.q>=3?1:S.q===2?.75:S.q===1?.5:.1));
  const cand=nameplates.c||(nameplates.c=[]);cand.length=0;
  for(let i=0;i<E.ch;i++){const c=chars[i];if(c.hp<=0&&c.st!==4)continue;c.lab=false;
    let pr=c.lod===0?0:c.lod===1?100+(c.hp/c.maxhp)*50+Math.sqrt(c.dc||0)*.1:1000;if(S.q===0&&!c.self)pr=5000;cand.push(c);c.pr=pr}
  cand.sort((a,b)=>a.pr-b.pr);let shown=0;const RX=nameplates.rx||(nameplates.rx=new Float32Array(160));let nr=0;
  const fs=MOBILE?10:11;
  for(let i=0;i<cand.length;i++){const c=cand[i],sx=c.x*Z,sy=c.y*Z+4;
    const gx=clamp((sx/grid.cw)|0,0,gc-1),gy=clamp((sy/grid.ch)|0,0,gr-1),k=gx+gy*gc;
    const hp=c.hp/c.maxhp;
    let okLab=S.opt.names&&c.pr<1000&&shown<maxLab&&grid.cnt[k]<per,lb=null,x1=0,y1=0,x2=0,y2=0;
    if(okLab){lb=labelBmp(c.name+' Lv.'+c.lv,c.self?'#ffe27a':'#fff',fs);x1=sx-lb.w/2-1;x2=sx+lb.w/2+1;y1=sy;y2=sy+lb.h+5;
      for(let q=0;q<nr;q+=4){if(x1<RX[q+2]&&x2>RX[q]&&y1<RX[q+3]&&y2>RX[q+1]){okLab=false;break}}}
    if(okLab){RX[nr]=x1;RX[nr+1]=y1;RX[nr+2]=x2;RX[nr+3]=y2;nr+=4;grid.cnt[k]++;shown++;c.lab=true;
      ctx.drawImage(lb.c,sx-lb.w/2,sy+1,lb.w,lb.h);
      const bw=MOBILE?26:34,by=sy+lb.h;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(sx-bw/2-1,by-1,bw+2,5);ctx.fillStyle=hp>.5?'#e0554a':hp>.25?'#e8a13a':'#f06060';ctx.fillRect(sx-bw/2,by,bw*Math.max(0,hp),3);
      if(c.self){ctx.fillStyle='#4a86e0';ctx.fillRect(sx-bw/2,by+4,bw,2)}
    }else if(S.opt.names){ // hidden label → job-colour dot
      ctx.fillStyle=JOBCOL[c.sh.job];ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy-(CHAR_S*c.sh.ch*.82)*Z-3,3,0,7);ctx.fill();ctx.stroke()}
  }
  // boss plate
  const b=S.boss;if(b&&!b.dead&&S.opt.names){const lb=labelBmp(b.def.n+' Lv.60','#ff8a7a',12);ctx.drawImage(lb.c,b.x*Z-lb.w/2,(b.y-b.h)*Z-lb.h-4,lb.w,lb.h)}
  // chat bubbles
  for(let i=0;i<BUB.length;i++){const bb=BUB[i];if(!bb.on||!bb.ch||bb.ch.hp<=0)continue;if(!bb.ch.lab&&!bb.ch.self&&bb.ch.lod===2)continue;const lb=labelBmp(bb.txt,'#222',11,true);const a=bb.t>3.6?(4-bb.t)/.4:1;ctx.globalAlpha=a;ctx.drawImage(lb.c,bb.ch.x*Z-lb.w/2,(bb.ch.y-CHAR_S*bb.ch.sh.ch*.9)*Z-lb.h,lb.w,lb.h);ctx.globalAlpha=1}
}
// ---------- minimap & hud ----------
function drawMini(){
  if(!S.opt.mini){mini.style.display='none';return}mini.style.display='block';const w=mini.width,h=mini.height;mctx.clearRect(0,0,w,h);
  const kx=w/S.W,ky=h/S.H;mctx.fillStyle='rgba(60,110,50,.5)';mctx.beginPath();mctx.ellipse(S.cx*kx,S.cy*ky,S.rx*kx,S.ry*ky,0,0,7);mctx.fill();
  mctx.fillStyle='#ff6a5a';for(const m of mobs){if(m.on&&!m.dead)mctx.fillRect(m.x*kx-1,m.y*ky-1,2,2)}
  const E=eff();for(let i=0;i<E.ch;i++){const c=chars[i];mctx.fillStyle=c.self?'#fff':JOBCOL[c.sh.job];mctx.fillRect(c.x*kx-1.5,c.y*ky-1.5,3,3)}
  if(S.boss&&!S.boss.dead){mctx.fillStyle='#f00';mctx.beginPath();mctx.arc(S.boss.x*kx,S.boss.y*ky,4,0,7);mctx.fill()}
}
function hud(){
  const now=S.t;while(S.killHist.length&&S.killHist[0]<now-60)S.killHist.shift();
  const kph=Math.round(S.killHist.length*(now<60?60/Math.max(10,now):1)*60),eph=Math.round(kph*(S.exp/Math.max(1,S.kills)));
  const E=eff(),up=Math.floor(now),fmt=n=>n.toLocaleString('en-US');
  const clock=`${String(Math.floor(up/3600)).padStart(2,'0')}:${String(Math.floor(up/60)%60).padStart(2,'0')}:${String(up%60).padStart(2,'0')}`;
  $('#hud-tl').innerHTML=MOBILE?
   `<span class="chip">擊殺 ${fmt(S.kills)} · ${fmt(kph)}/時</span><br><span class="chip">掛機 ${clock}</span>`:
   `<span class="chip">霧沼濕地 08（割草）</span><br><span class="chip">本場擊殺 ${fmt(S.kills)}</span><br><span class="chip">擊殺/時 ${fmt(kph)} · EXP/時 ${fmt(eph)}</span><br><span class="chip">掛機時間 ${clock}</span><br><span class="chip">距離 BOSS ${Math.max(0,S.nextBossAt-S.kills)} 殺</span>`;
  const rank=chars.slice(0,E.ch).slice().sort((a,b)=>b.dmgDone-a.dmgDone).slice(0,5);
  const bad=stats.fps<TARGET_FPS*.85;
  $('#hud-tr').innerHTML=`<span class="chip fps ${bad?'bad':''}">FPS ${stats.fps} · ${stats.p95.toFixed(1)}ms · ${QN[S.q]}${S.qMode==='auto'?'（自動）':'（鎖定）'}</span><br><span class="chip">同圖 ${E.ch}/${S.want.ch}　怪 ${aliveMobs()}/${S.want.mob}</span>`+
   (MOBILE?'':`<br><div class="rank">${rank.map((c,i)=>`<div><span>${i+1}. ${c.name}</span><b>${fmt(c.dmgDone)}</b></div>`).join('')}</div>`);
  $('#cap-note').innerHTML=`目前畫質 <b>${QN[S.q]}</b>${S.qMode==='auto'?'（自動）':'（手動鎖定）'}：實際顯示 角色 <b>${E.ch}</b>／怪物上限 <b>${E.mob}</b>${E.ch<S.want.ch||E.mob<S.want.mob?'（已因畫質降階縮減）':''}`;
  $('#v-ch').textContent=S.want.ch+' / '+CAP.ch;$('#v-mob').textContent=S.want.mob+' / '+CAP.mob;$('#v-gat').textContent=Math.round(S.want.gat*100)+'%';
  $('#b-boss').textContent=S.boss&&!S.boss.dead?'BOSS 戰鬥中…':S.bossCool>0?`召喚 BOSS（冷卻 ${Math.ceil(S.bossCool)}s）`:'召喚 BOSS';
  $('#b-boss').disabled=!!(S.boss&&!S.boss.dead);
}
// ---------- auto quality ----------
function autoQuality(now){
  const w=stats.work;if(w.length<40)return;const s=w.slice().sort((a,b)=>a-b);stats.p95=s[Math.floor(s.length*.95)];
  if(S.qMode!=='auto')return;
  const tgt=S.q===0?15:TARGET_FPS;const slow=stats.p95>BUDGET||stats.fps<tgt*.85;const fast=stats.p95<BUDGET*(S.q===0?.35:.6)&&stats.fps>=tgt*.95;
  if(slow&&S.q>0&&now-S.qSince>10000){setQ(S.q-1);S.qSince=now;S.qUpT=0}
  else if(fast){if(!S.qUpT)S.qUpT=now;if(now-S.qUpT>20000&&S.q<3&&now-S.qSince>10000){setQ(S.q+1);S.qSince=now;S.qUpT=0}}else S.qUpT=0;
}
function setQ(q){S.q=q;S.lodT=-1;stats.work.length=0}
// ---------- loop ----------
let last=performance.now(),lastDraw=0,hudT=0,miniT=0,fpsN=0,fpsT=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const iv=1000/(S.q===0?15:TARGET_FPS);if(now-lastDraw<iv-3)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;lastDraw=now;
  const t0=performance.now();
  if(!S.paused)update(dt);
  draw();
  const w=performance.now()-t0;stats.work.push(w);if(stats.work.length>120)stats.work.shift();
  fpsN++;if(now-fpsT>=500){stats.fps=Math.round(fpsN*1000/(now-fpsT));fpsN=0;fpsT=now;autoQuality(now)}
  if(now-miniT>200){miniT=now;drawMini()}
  if(now-hudT>400){hudT=now;hud();Log.render()}
}
// ---------- controls ----------
function bind(){
  const rch=$('#r-ch'),rmob=$('#r-mob'),rg=$('#r-gat');
  rch.max=CAP.ch;rmob.max=CAP.mob;rch.value=S.want.ch;rmob.value=S.want.mob;rg.value=Math.round(S.want.gat*100);
  rch.oninput=()=>{S.want.ch=+rch.value;hud()};rmob.oninput=()=>{S.want.mob=+rmob.value;hud()};rg.oninput=()=>{S.want.gat=rg.value/100;assignAnchors();hud()};
  $('#b-boss').onclick=()=>{if(S.bossCool<=0||!S.boss)spawnBoss(false)};
  $('#b-pause').onclick=e=>{S.paused=!S.paused;e.target.textContent=S.paused?'繼續':'暫停';document.body.classList.toggle('paused',S.paused)};
  $('#b-reset').onclick=()=>{S.kills=0;S.killHist.length=0;S.exp=0;S.t=0;S.nextBossAt=150;S.boss=null;$('#bossbar').classList.add('hidden');makeChars();assignAnchors();makeMobs();NUMS.forEach(n=>n.on=0);FX.forEach(n=>n.on=0);PROJ.forEach(n=>n.on=0);Log.reset();chars.forEach(c=>{c.x=c.ax+rr(-30,30);c.y=c.ay+rr(-30,30)})};
  const tog=(id,k)=>{const b=$(id);b.onclick=()=>{S.opt[k]=!S.opt[k];b.classList.toggle('on',S.opt[k])}};tog('#t-names','names');tog('#t-dmg','dmg');tog('#t-mini','mini');
  $('#b-ring').onclick=e=>{S.opt.ring=!S.opt.ring;e.target.classList.toggle('on',S.opt.ring)};$('#b-ring').classList.add('on');
  $('#s-q').onchange=e=>{const v=e.target.value;if(v==='auto'){S.qMode='auto';S.qSince=performance.now()}else{S.qMode='lock';setQ(+v)}};
  $('#z-in').onclick=()=>{S.zoomMul=clamp(S.zoomMul+.1,.6,1.8);layout()};$('#z-out').onclick=()=>{S.zoomMul=clamp(S.zoomMul-.1,.6,1.8);layout()};
  const setBig=v=>{document.body.classList.toggle('big',v);$('#t-big').textContent=v?'還原':'⛶ 放大';if(!v)document.body.classList.remove('showside');setTimeout(layout,30)};
  const isBig=()=>document.body.classList.contains('big');
  $('#t-big').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();setBig(!isBig())};$('#b-big').onclick=$('#t-big').onclick;
  $('#t-full').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen();return}setBig(true);const el=document.documentElement;if(el.requestFullscreen)el.requestFullscreen().catch(()=>{})};
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&isBig()&&S.fsAuto){setBig(false)}S.fsAuto=!!document.fullscreenElement;setTimeout(layout,60)});
  $('#b-gear').onclick=$('#t-gear').onclick=()=>document.body.classList.toggle('showside');$('#b-closeside').onclick=()=>document.body.classList.remove('showside');
  document.querySelectorAll('#logwin [data-m]').forEach(b=>b.onclick=()=>Log.setMode(b.dataset.m));
  const lw=$('#logwin');$('#log-exp').onclick=()=>{const v=!lw.classList.contains('big');lw.classList.toggle('big',v);lw.classList.remove('min');Log.setExpanded(v)};
  $('#log-min').onclick=()=>lw.classList.toggle('min');
  $('#logbox').addEventListener('click',()=>{if(MOBILE&&!lw.classList.contains('big'))$('#log-exp').onclick()});
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='f')$('#t-full').onclick();else if(e.key==='b')$('#b-boss').click();else if(e.key==='Escape'&&isBig()&&!document.fullscreenElement)setBig(false)});
  new ResizeObserver(()=>layout()).observe($('#wrap'));addEventListener('resize',layout);
}
// ---------- init ----------
async function init(){
  if(qs.has('chars'))S.want.ch=clamp(+qs.get('chars'),1,CAP.ch);if(qs.has('mobs'))S.want.mob=clamp(+qs.get('mobs'),0,CAP.mob);if(qs.has('gather'))S.want.gat=clamp(+qs.get('gather'),0,1);
  if(qs.has('q')){S.qMode='lock';S.q=clamp(+qs.get('q'),0,3);$('#s-q').value=String(S.q)}
  if(qs.get('log'))Log.setMode(qs.get('log'));else Log.setMode(Log.mode);
  if(qs.get('zoom'))S.zoomMul=+qs.get('zoom');
  if(MOBILE)document.body.classList.add('mobile');
  await load();buildGlyphs();makeChars();makeMobs();bind();layout();
  if(qs.has('big')){document.body.classList.add('big');$('#t-big').textContent='還原';layout()}
  if(qs.has('side'))document.body.classList.add('showside');
  // optional fast-forward for deterministic screenshots
  const ff=+(qs.get('ff')||0);if(ff>0){for(let i=0;i<ff*20;i++){update(.05)}}
  if(qs.has('boss'))spawnBoss(false);
  if(qs.has('ffb')){const f=+qs.get('ffb');for(let i=0;i<f*20;i++)update(.05)}
  stats.work.length=0;S.qSince=performance.now();hud();Log.render(true);
  window.__horde={S,stats,chars:()=>chars,mobs:()=>mobs,setQ,spawnBoss,eff,CAP,MOBILE,update,draw,hud,Log};
  requestAnimationFrame(t=>{last=t;frame(t)});
}
init().catch(e=>{document.body.insertAdjacentHTML('beforeend','<pre style="position:fixed;top:0;left:0;background:#fff;color:#c00;z-index:9999;padding:8px">'+e.stack+'</pre>');console.error(e)});
})();
