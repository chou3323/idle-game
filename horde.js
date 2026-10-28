/* 曙光 Aurevia 割草大畫面 v2 — front-end-only prototype (spec §9A). All data is fake; no server. Data: data.js, art/manifest: art.js + assets/manifest.json, UI windows: ui.js.
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
const D=HD.D,Art=HD.Art;
const SAY=['衝啊！','割草割草～','補血！','BOSS來了','好多怪','我要升級','收工前再一波','哈哈哈','等我！','這張圖不錯','掉寶掉寶','裝備來一件'];
const CHAR_S=0.58;           // sprites are stored at 50% → 128px cells; drawn ≈ 74px tall
// ---------- state ----------
const cv=$('#scene'),ctx=cv.getContext('2d',{alpha:false});
const mini=$('#mini'),mctx=mini.getContext('2d');
const S={W:600,H:400,zoom:1,zoomMul:1,cx:300,cy:200,rx:200,ry:120,
  want:{ch:Math.min(30,CAP.ch),mob:Math.min(100,CAP.mob),gat:.55},
  opt:{names:true,dmg:true,mini:true,ring:true},qMode:'auto',q:MOBILE?2:3,qSince:0,qUpT:0,paused:false,
  t:0,kills:0,killsSince:0,exp:0,killHist:[],wallStart:performance.now(),simStart:0,sheets:null,imgs:{},types:{},mapTypes:[],wsum:1,mapId:'f1',bossImgs:{},bossMeta:{},mf:null,freshUntil:.3,boss:null,bossCool:0,nextBossAt:150,auraT:0};
let chars=[],mobs=[];
const tmpl={};   // caches
// ---------- stage / combo / perks (roguelite layer on top of the free horde) ----------
const ST={mode:'free',d:0,si:0,w:0,state:'idle',timer:0,wk:0,wt:1,elapsed:0,waveT:0,kills:0,elites:0,peak:0,perks:{},choices:null,res:null,bossUp:false,potT:0,enr:1,rageT:0,rageN:0,sweep:false,mhp:0,autoPerk:false,hpMin:1};
const CB={n:0,t:0,max:0};
const KALLY=.5;           // allies' damage share while in stage mode (the player's own build has to carry the run)
const P=id=>ST.mode==='stage'?(ST.perks[id]||0):0;
const PV=id=>{const l=P(id);if(!l)return 0;return D.PERKS.find(x=>x.id===id).v[l-1]};
let curEl=null,boomD=0;

// ---------- player profile (fake, saved to localStorage) ----------
const SAVE_KEY='aur_horde_v2';let uidN=1;
const ME={job:'arc',g:'f',lv:45,exp:0,jlv:12,jexp:0,zeny:12500,sp:236,maxsp:236,hp:1,maxhp:1000,equip:{},bag:[],mats:{},drops:[],buffs:[],auto:[1,1,1,1],cdT:[0,0,0,0],totalDrops:0,zenyGain:0,mapId:'f1',
  st:{atk:0,matk:0,def:0,hp:0,crit:0,aspd:0},atk:0,matk:0,def:0,crit:0,aspd:0,aura:0,skl:{},clr:[0,0,0,0],autoPot:true};
const expNext=lv=>Math.round(400+lv*lv*2.2),jexpNext=jl=>Math.round(150+jl*90);
function mkInst(id,ref){return {u:uidN++,id,ref:ref||0}}
function gearStats(){const s={atk:0,matk:0,def:0,hp:0,crit:0,aspd:0};let top=0;
  for(const sl in ME.equip){const inst=ME.equip[sl];if(!inst)continue;const it=D.ITEMS[inst.id];if(!it)continue;top=Math.max(top,it.tier);const rm=1+(inst.ref||0)*.07;
    for(const k in it.s){s[k]+=(k==='atk'||k==='matk'||k==='def')?Math.round(it.s[k]*rm):it.s[k]}}
  s.top=top;return s}
function buffMul(){let m=1;for(const b of ME.buffs)m*=b.mul;return m}
function calcMe(){
  const g=gearStats();ME.st=g;ME.aura=g.top;const bm=buffMul();
  ME.atk=Math.round((ME.lv*1.1+30+g.atk)*bm);ME.matk=Math.round((ME.lv*1.1+24+g.matk+g.atk*.2)*bm);ME.def=Math.round(ME.lv*.7+10+g.def);
  ME.crit=Math.round((8+g.crit+PV('crit'))*10)/10;ME.aspd=g.aspd;ME.maxhp=Math.round(900+ME.lv*9+g.hp+g.def*4)+(ST.mode==='stage'?ST.mhp:0);ME.maxsp=Math.round(120+ME.lv*2+ME.jlv*2);
  const c=chars[0];if(c){const f=c.maxhp?c.hp/c.maxhp:1;c.maxhp=ME.maxhp;c.hp=Math.min(ME.maxhp,Math.max(1,ME.maxhp*f))}
  return ME}
function addToBag(id,ref){const it=D.ITEMS[id];const inst=mkInst(id,ref);ME.bag.push(inst);
  if(ME.bag.length>70){ // overflow: auto-sell the cheapest non-equipped item
    let bi=-1,bv=1e9;ME.bag.forEach((x,i)=>{const v=D.sellValue(Object.assign({},D.ITEMS[x.id],{ref:x.ref}));if(inst!==x&&v<bv){bv=v;bi=i}});if(bi>=0){ME.zeny+=bv;ME.bag.splice(bi,1)}}
  return inst}
function equipItem(inst){
  const it=D.ITEMS[inst.id];let sl=it.slot;if(sl==='acc')sl=!ME.equip.acc1?'acc1':!ME.equip.acc2?'acc2':'acc1';
  const bi=ME.bag.indexOf(inst);if(bi<0)return;ME.bag.splice(bi,1);const old=ME.equip[sl];if(old)ME.bag.push(old);ME.equip[sl]=inst;calcMe();save();UI('refresh')}
function unequip(sl){const x=ME.equip[sl];if(!x)return;ME.equip[sl]=null;ME.bag.push(x);calcMe();save();UI('refresh')}
function sellInst(inst){const bi=ME.bag.indexOf(inst);if(bi<0)return 0;const v=D.sellValue(Object.assign({},D.ITEMS[inst.id],{ref:inst.ref}));ME.bag.splice(bi,1);ME.zeny+=v;save();return v}
function sellCommon(maxTier){let n=0,z=0;for(const x of ME.bag.slice()){if(D.ITEMS[x.id].tier<=maxTier){z+=sellInst(x);n++}}return {n,z}}
function initKit(){
  ME.equip={weapon:mkInst('wp_'+D.JOBS[ME.job].wk+'_0'),armor:mkInst('ar_0'),shoes:mkInst('sw_0'),head:mkInst('hd_0')};
  ME.bag=[mkInst('wp_'+D.JOBS[ME.job].wk+'_2',2),mkInst('ar_2'),mkInst('ck_1'),mkInst('rg_3'),mkInst('sh_1'),mkInst('hd_3',1),mkInst('sw_2')];
  ME.mats={'紅色藥水':20,'蜂蜜':4,'軟毛':6}}
function save(){try{if(qs.has('fresh'))return;const o={v:2,job:ME.job,g:ME.g,lv:ME.lv,exp:ME.exp,jlv:ME.jlv,jexp:ME.jexp,zeny:ME.zeny,mapId:S.mapId,auto:ME.auto,tot:ME.totalDrops,
  equip:Object.fromEntries(Object.entries(ME.equip).map(([k,v])=>[k,v&&[v.id,v.ref]])),bag:ME.bag.map(v=>[v.id,v.ref]),mats:ME.mats,drops:ME.drops.slice(0,60),skl:ME.skl,clr:ME.clr,ap:ME.autoPot};localStorage.setItem(SAVE_KEY,JSON.stringify(o))}catch(e){}}
function loadSave(){try{if(qs.has('fresh'))return false;const o=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!o||o.v!==2)return false;
  const ok=id=>D.ITEMS[id];Object.assign(ME,{job:D.JOBS[o.job]?o.job:'arc',g:o.g==='m'?'m':'f',lv:o.lv|0||45,exp:o.exp|0,jlv:o.jlv|0||12,jexp:o.jexp|0,zeny:o.zeny|0,auto:o.auto||[1,1,1,1],totalDrops:o.tot|0,mats:o.mats||{},drops:o.drops||[],skl:o.skl||{},clr:Array.isArray(o.clr)?o.clr.slice(0,4):[0,0,0,0],autoPot:o.ap!==false});
  ME.equip={};for(const k in o.equip||{}){const v=o.equip[k];if(v&&ok(v[0]))ME.equip[k]=mkInst(v[0],v[1])}ME.bag=(o.bag||[]).filter(v=>ok(v[0])).map(v=>mkInst(v[0],v[1]));
  if(D.mapById(o.mapId))ME.mapId=o.mapId;return true}catch(e){return false}}
function UI(fn,a,b){const u=HD.UI;if(u&&u[fn])return u[fn](a,b)}
// ---------- assets ----------
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error(src));i.src=src})}
  function selfKey(job,g){const k='ch_'+job+'_'+g;if(S.sheets[k])return k;const k2='ch_'+job+'_'+(g==='m'?'f':'m');return S.sheets[k2]?k2:'ch_arc_f'}
async function load(){
  const mf=S.mf=await Art.loadManifest();if(mf.ui)Art.applyUI(mf.ui);
  try{const bj=await (await fetch('data/aur_mobs.json')).json();D.BAL=bj;for(const id in bj.mobs){const d=D.MOBS[id];if(!d)continue;d.bal=bj.mobs[id];d.hpMul=+(bj.mobs[id].hp*.6+d.hpMul*.4).toFixed(2)}}catch(e){console.warn('balance json missing — using template stats',e.message)}
  S.sheets=await (await fetch(mf.chars.sheets)).json();
  const grade=mf.chars.grade;
  await Promise.all(Object.entries(S.sheets).map(async([k,v])=>{const im=await Art.loadImg(mf.chars.dir+v.file);S.imgs[k]=grade&&!qs.has('nograde')?Art.recolor(im,grade):im}));
  // monsters: every type from data.js, sprite/recolor/size from the manifest (so chou's drop-in sprites replace the originals)
  await Promise.all(Object.values(D.MOBS).map(async def=>{
    const e=mf.mobs[def.id];if(!e){console.warn('no manifest entry for '+def.id);return}
    try{const im=await Art.loadImg(e.src);const cv=e.recolor?Art.recolor(im,e.recolor):im;
      const fw=e.fw||im.width/(e.frames||1),fh=e.fh||im.height,h=e.h||70*def.scale;
      S.types[def.id]=Object.assign({},def,{cv,frames:e.frames||Math.max(1,Math.round(im.width/fw)),fw,fh,h,k:h/fh,base:e.base!=null?e.base:fh*.9,fps:e.fps||3,flip:e.flip?-1:1,anim:e.anim||null,box:e.box||null,
        hh:h*(e.base!=null?e.base:fh*.9)/fh*.86,w:fw*(h/fh)})}
    catch(err){console.warn('mob sprite failed',def.id,err.message)}}));
  for(const k in mf.bosses){const b=mf.bosses[k];try{const im=await Art.loadImg(b.src);S.bossImgs[k]=b.recolor?Art.recolor(im,b.recolor):im;if(b.fw){S.bossMeta[k]=b}}catch(e){console.warn('boss img',k)}}
}
// ---------- sprite helpers ----------
const shadowCv=(()=>{const c=document.createElement('canvas');c.width=48;c.height=20;const x=c.getContext('2d');const g=x.createRadialGradient(24,10,2,24,10,22);g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.save();x.scale(1,.42);x.beginPath();x.arc(24,24,24,0,7);x.fill();x.restore();return c})();
// glyph sheet for damage numbers
const GL={cols:{w:'#ffffff',c:'#ffe14a',r:'#ff6a6a',g:'#62e07a',p:'#d49bff',o:'#ff9d3a',b:'#7ad8ff',k:'#ff9ad0',x:'#9aa8c4'},at:{},gw:0,gh:0};
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
  let api={auto:true};const T0=15*3600+19*60+6;let mode=MOBILE?'hl':'sum',raw=[],dirty=true,expanded=false,lastRender=0,lastLineN=0;
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
      case 'jlevelup':return ['exp',`★ Job Lv 升到 ${e.lv}！`];
      case 'skill':return e.buff?['sys',`施放 ${e.name}：攻擊力提升！`]:e.heal?['sys',`施放 ${e.name}，治療了 ${e.heal} 名隊友。`]:['skill',`施放 ${e.name}：命中 ${e.n} 隻，共 ${fmt(e.dmg)} 點傷害。`];
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
    const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<30;box.innerHTML=h;if((atBottom||force)&&api.auto!==false)box.scrollTop=box.scrollHeight;
    $('#log-n').textContent=L.length+' 行';
  }
  function setMode(m){mode=m;document.querySelectorAll('#logwin [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===m));dirty=true;render(true)}
  function reset(){raw=[];dirty=true;render(true)}
  return api=Object.assign(api,{push,render,setMode,reset,clk,get mode(){return mode},setExpanded(v){expanded=v;dirty=true;render(true)}});
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
  const mp=D.mapById(S.mapId);const src=S.bgImg||BgArt.render(mp.theme,cols,rows);bgCv=document.createElement('canvas');bgCv.width=Math.round(w*DPR);bgCv.height=Math.round(h*DPR);
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
  chars=[];const names=NAMES.slice().sort(()=>rnd()-.5);const TI=D.TIERS[D.mapById(S.mapId).tier-1];
  for(let i=0;i<CAP.ch;i++){
    const key=i===0?selfKey(ME.job,ME.g):JOBKEYS[(i)%JOBKEYS.length];const sh=S.sheets[key];
    const lv=i===0?ME.lv:Math.round(rr(TI.clv[0],TI.clv[1]));
    chars.push({id:i,key,sh,img:S.imgs[key],name:i===0?'測試冒險者':names[i%names.length]+(i>=names.length?i:''),lv,
      x:S.cx+rr(-60,60),y:S.cy+rr(-40,40),ax:S.cx,ay:S.cy,face:rnd()<.5?1:-1,st:0,stT:0,hp:900,maxhp:i===0?ME.maxhp:Math.round(rr(700,1500)+lv*4),
      tgt:null,cd:rr(0,1),hitDone:true,range:sh.atk==='melee'?(sh.job==='dnc'?62:34):sh.atk==='magic'?210:230,spd:rr(70,96),acl:sh.job==='acl',
      atkDur:sh.attack.n/sh.attack.fps,power:rr(.8,1.25)*(i===0?1.2:1),dmgDone:0,flash:0,lod:2,lab:false,att:0,tOff:rr(0,5),deadT:0,self:i===0,lastNum:0,accD:0,accN:0,blocked:0,skcd:rr(1.5,7),buff:0});
    chars[i].hp=chars[i].maxhp;
  }
}
function setSelfJob(job,g){
  ME.job=job;ME.g=g||ME.g;const key=selfKey(ME.job,ME.g);ME.g=key.slice(-1);const sh=S.sheets[key],c=chars[0];
  Object.assign(c,{key,sh,img:S.imgs[key],range:sh.atk==='melee'?(sh.job==='dnc'?62:34):sh.atk==='magic'?210:230,acl:sh.job==='acl',atkDur:sh.attack.n/sh.attack.fps,st:0,stT:0,tgt:null});
  ME.cdT=[0,0,0,0];ME.buffs.length=0;calcMe();save();UI('refresh');UI('jobChanged')}
function makeMobs(){mobs=[];for(let i=0;i<CAP.mob;i++)mobs.push({id:i,on:false,dead:false,ty:null,x:0,y:0,hp:1,maxhp:1,face:1,tgt:null,flash:0,hurt:0,dieT:0,cd:0,lod:2,t:rnd()*9,lastNum:0,accD:0,accN:0,respawn:0,spd:40,lv:10,dash:0,dashT:rr(1,3),ph:rnd()*6})}
function pickType(){let r=rnd()*S.wsum;const L=S.mapTypes;for(let i=0;i<L.length;i++){r-=L[i].w;if(r<=0)return L[i].ty}return L[L.length-1].ty}
function spawnMob(m,fresh){
  const ty=pickType();if(!ty)return;const T=D.TIERS[ty.tier-1];m.ty=ty;const a=rnd()*6.283,k=fresh?rr(.35,1.05):rr(.98,1.12);
  m.x=S.cx+Math.cos(a)*S.rx*k;m.y=S.cy+Math.sin(a)*S.ry*k;m.lv=Math.round(rr(T.lv[0],T.lv[1]));const wm=wmul(),el=ST.mode==='stage'&&ST.w>=2&&rnd()<D.DIFFS[ST.d].elite*(1+.15*(ST.w-1));m.elite=el;
  m.maxhp=Math.round((ST.mode==='stage'?stageHp():T.hp)*ty.hpMul*rr(.8,1.25)*wm.hp*(el?4.5:1));m.hp=m.maxhp;m.def=ty.bal?ty.bal.def:0;m.am=(ty.bal?ty.bal.atk:1)*wm.atk*(ST.mode==='stage'?stageAtk()/T.atk:1)*(el?1.5:1)*ST.enr;m.xm=(ty.bal?ty.bal.exp:1)*wm.exp*(el?3:1);m.dead=false;m.dieT=0;m.on=true;m.flash=0;m.hurt=0;
  m.spd=rr(30,52)*(ty.spdMul||1);m.tgt=null;m.cd=rr(0,1.4);m.respawn=0;m.accD=m.accN=0;m.lastNum=0;m.dash=0;m.dashT=rr(1,3.5);m.ph=rnd()*6;
}
function wmul(){if(ST.mode!=='stage')return {hp:1,atk:1,exp:1};const d=D.DIFFS[ST.d],w=Math.max(1,ST.w),sm=1+(ST.si%2)*.3;
  return {hp:sm*(1+.14*(w-1)),atk:(1+.1*(w-1)),exp:d.exp*sm}}
const stIdx=()=>ST.d*6+ST.si,calOf=(k)=>{const c=(D.CAL||[])[stIdx()];return c?c[k]:1};
const stageHp=()=>420*Math.pow(1.12,stIdx())*calOf(0),stageAtk=()=>.9*Math.pow(1.07,stIdx())*calOf(1);
function mobCap(){const E=eff();if(ST.mode!=='stage')return E.mob;if(ST.state!=='run')return 0;return Math.min(E.mob,ST.w>=D.WAVES?58:22+ST.w*14)}
function aliveMobs(){let n=0;for(let i=0;i<mobs.length;i++)if(mobs[i].on&&!mobs[i].dead)n++;return n}
// effective counts under quality
function eff(){const f=QMUL[S.q];return {ch:Math.max(1,Math.min(S.want.ch,Math.round(CAP.ch*f))),mob:Math.min(S.want.mob,Math.round(CAP.mob*f))}}
// ---------- combat ----------
const FLY=14;
function mobName(m){return m.ty.n}
const mtop=m=>m.y-m.ty.hh*(m.elite?1.28:1)-(m.ty.beh==='flyer'?FLY:0);
function elMul(el,m){const ro=D.EL2RO[el],b=m.ty.bal;if(!ro||!b)return 1;const v=b.tbl[ro];return v==null?1:Math.max(.25,Math.min(2,v/100))}
function comboMul(){return 1+Math.min(.35,CB.n*.0025*(P('combo')?2:1))}
function gpow(){const c=chars[0],v=(c&&c.sh&&c.sh.atk==='magic'?ME.matk:ME.atk)/100;return Math.pow(Math.max(.4,v),GPE)}
const GPE=1.7;
function selfMul(){return gpow()*comboMul()*(1+(ST.rageT>0?PV('rage')/100*ST.rageN:0))}
function healSelf(h){const c=chars[0];if(!c||c.hp<=0)return;c.hp=Math.min(c.maxhp,c.hp+h)}
function dealDmg(att,m,dmg,crit,aoe,ncol){
  if(m.dead)return;const self=att.self;
  if(m.def)dmg=dmg*100/(100+m.def*1.2);
  let em=1;if(curEl){em=elMul(curEl,m);dmg*=em}
  if(self)dmg*=selfMul();else if(ST.mode==='stage')dmg*=KALLY;
  dmg=Math.max(1,Math.round(dmg));
  m.hp-=dmg;m.flash=.12;m.hurt=3;att.dmgDone+=dmg;
  if(self&&P('vamp'))healSelf(dmg*PV('vamp')/100);
  const wk=em>=1.3,rs=em<=.7;const big=dmg>=m.maxhp*.4;
  const col=wk?'o':rs?'x':(ncol||(crit?'c':'w')),sc=(crit?1.35:1)*(wk?1.25:rs?.85:1)*(big?1.2:1)*(self?1+Math.min(.45,Math.log10(Math.max(1,dmg/400))*.3):1);
  if(m.lod===0||att.lod===0){if(S.opt.dmg)pushNum(m.x+rr(-6,6),mtop(m)-6,String(dmg),col,sc)}
  else if(m.lod===1&&S.opt.dmg){m.accD+=dmg;m.accN++;const win=S.q<=1?.6:.35;if(S.t-m.lastNum>win){pushNum(m.x+rr(-10,10),mtop(m)-6,String(m.accD),col,.78*(wk?1.2:1),.8);if(m.accN>1)pushNum(m.x+16,mtop(m)+8,'×'+m.accN,'w',.5,.6);m.accD=m.accN=0;m.lastNum=S.t}}
  if(self&&!aoe)Log.push({k:'hit',mob:mobName(m),dmg,crit,n:1});
  if(m.hp<=0)killMob(m,att);
}
function gainExp(exp){
  ME.exp+=exp;ME.jexp+=Math.round(exp*.6);
  while(ME.exp>=expNext(ME.lv)){ME.exp-=expNext(ME.lv);ME.lv++;chars[0].lv=ME.lv;Log.push({k:'levelup',lv:ME.lv});pushFx(1,chars[0].x,chars[0].y,.9,60,2);calcMe();UI('levelUp');save()}
  while(ME.jlv<50&&ME.jexp>=jexpNext(ME.jlv)){ME.jexp-=jexpNext(ME.jlv);ME.jlv++;Log.push({k:'jlevelup',lv:ME.jlv});calcMe()}
  if(ME.jlv>=50)ME.jexp=0;
}
function rollGear(T){
  const base=[.6,2,3.2][T.id-1]+(ST.mode==='stage'?ST.d*.6:0),tier=clamp(Math.round(base+rr(-1.3,1.3)),0,4);let id;const r=rnd();
  if(r<.3){const kinds=Object.keys(D.WK);const wk=rnd()<.7?D.JOBS[ME.job].wk:kinds[(rnd()*kinds.length)|0];id='wp_'+wk+'_'+tier}
  else{const L=['hd_','sh_','ar_','ck_','sw_','rg_','am_'];id=L[(rnd()*L.length)|0]+tier}
  return {id,ref:rnd()<.3?((rnd()*5)|0):0}}
function dropRec(name,n,grade,m,pop){
  ME.drops.unshift({t:S.t,mob:m.ty.n,name,n,g:grade});if(ME.drops.length>80)ME.drops.pop();ME.totalDrops+=n;
  Log.push({k:'loot',item:name,n,rare:grade>=3});UI('dirty');
  if(S.opt.dmg)pushPop(m.x,mtop(m),(grade>=0?'':'+')+name+(n>1?' ×'+n:''),grade>=0?D.GRADES[grade].c:'#e9f3ff',pop)}
function rollDrops(m,T){
  const ty=m.ty,dr=ty.bal&&ty.bal.drops,stg=ST.mode==='stage',df=stg?D.DIFFS[ST.d]:null,gm=1+PV('gold')/100,el=m.elite?3:1;
  const dm=(df?df.drop:1)*gm*(m.elite?2.2:1);
  const z=Math.round(rr(T.zeny[0],T.zeny[1])*(df?df.zeny:1)*gm*el);ME.zeny+=z;ME.zenyGain+=z;
  if(rnd()<(dr?dr.mat:.26)*dm){const n=1+((rnd()*2)|0);ME.mats[ty.mat]=(ME.mats[ty.mat]||0)+n;dropRec(ty.mat,n,-1,m)}
  if(dr&&rnd()<dr.mat2*dm){ME.mats[dr.ess]=(ME.mats[dr.ess]||0)+1;dropRec(dr.ess,1,-1,m)}
  if(rnd()<(dr?dr.pot:.06)*dm){const nm=rnd()<.75?'紅色藥水':'藍色藥水';ME.mats[nm]=(ME.mats[nm]||0)+1;dropRec(nm,1,-1,m)}
  if(rnd()<(dr?dr.gear:.05)*dm||m.elite){const g=rollGear(T),it=D.ITEMS[g.id];addToBag(g.id,g.ref);dropRec((g.ref?'+'+g.ref+' ':'')+it.n,1,it.tier,m,Art.itemIcon(it,S.mf));if(it.tier>=3)pushFx(5,m.x,m.y,1.4)}
  if(rnd()<(dr?dr.card:.01)*dm){ME.mats[ty.n+'卡片']=(ME.mats[ty.n+'卡片']||0)+1;dropRec(ty.n+'卡片',1,3,m);pushFx(5,m.x,m.y,1.4)}
}
function killMob(m,att){
  m.dead=true;m.dieT=0;S.kills++;S.killsSince++;S.killHist.push(S.t);
  const T=D.TIERS[m.ty.tier-1],exp=Math.round(m.lv*T.exp*rr(.8,1.4)*1.6*(m.xm||1));S.exp+=exp;
  if(ST.mode==='stage'){ST.kills++;if(m.elite){ST.elites++;pushFx(1,m.x,m.y,.7,90,0);pushFx(5,m.x,m.y,1.2);if(S.opt.dmg)pushPop(m.x,mtop(m)-16,'精英擊破！','#ffd24a')}if(ST.state==='run'&&!ST.sweep)ST.wk++}
  comboAdd();
  if(att.self||dist2(att,chars[0])<260*260){gainExp(exp);Log.push({k:'kill',mob:mobName(m),exp,tot:S.kills});rollDrops(m,T)}
  pushFx(3,m.x,m.y-8,.45);
  if(P('rage')){ST.rageT=3;ST.rageN=Math.min(5,ST.rageN+1)}
  if(P('boom')&&boomD<3&&rnd()<PV('boom')/100){boomD++;const pe=curEl;curEl=null;pushFx(1,m.x,m.y-10,.4,58,2);aoeHit(chars[0],m.x,m.y,60,skillBase(chars[0])*1.1,7,'o');curEl=pe;boomD--}
  m.respawn=rr(.5,1.5);
  if(ST.mode!=='stage'&&S.kills>=S.nextBossAt&&!S.boss){S.nextBossAt+=150;spawnBoss(true)}
}
const STREAK_T=['連殺！','暴走！','虐殺！','無雙！','神之領域！','毀滅！','傳說降臨！','超越神話！'],STREAK_N=[10,25,50,100,200,350,500,800];
function comboWin(){return 3+PV('combo')}
function comboAdd(){const c0=CB.n;if(S.t-CB.t>comboWin())CB.n=0;CB.n++;CB.t=S.t;if(CB.n>CB.max)CB.max=CB.n;if(CB.n>ST.peak)ST.peak=CB.n;
  for(let i=0;i<STREAK_N.length;i++)if(c0<STREAK_N[i]&&CB.n>=STREAK_N[i]){const c=chars[0];UI('streak',STREAK_N[i]+' 連殺 '+STREAK_T[i],i);S.flash=Math.min(.35,.12+.03*i);S.shake=Math.max(S.shake||0,.15+.05*Math.min(i,4));pushFx(1,c.x,c.y,.8,120+i*10,0)}}
function dist2(a,b){const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy}
function spawnBoss(auto,stage){
  if(S.boss&&!S.boss.dead)return;const mp=D.mapById(S.mapId),def=mp.boss,key=def.img+(def.hue?'@'+def.hue:'');
  let im=S.bossImgs[key];if(!im){const b0=S.bossImgs[def.img];if(!b0)return;im=def.hue?Art.recolor(b0,{hue:def.hue}):b0;S.bossImgs[key]=im}
  const sc=1.9*(MOBILE?.8:1);const n=eff().ch;let max=Math.max(40000,n*4800)*[1,2.2,4][mp.tier-1];if(ST.mode==='stage'){const d=D.DIFFS[ST.d];max=stageHp()*55*(1+(ST.si%2)*.3);ST.bossUp=true}
  S.boss={tbl:(D.BAL&&D.BAL.bossEl&&D.BAL.bossEl[mp.id]&&D.BAL.bossEl[mp.id].tbl)||null,def:{n:def.n,im,meta:S.bossMeta[def.img]||null},x:S.cx+rr(-S.rx*.4,S.rx*.4),y:S.cy-S.ry*.75,hp:max,maxhp:max,w:im.width*sc*(120/im.height),h:120*sc,face:1,dead:false,dieT:0,flash:0,warnT:-1,wx:0,wy:0,cd:3,lod:0,lock:0,t:0};
  const b=S.boss;{const mt=b.def.meta;b.w=mt?mt.fw/mt.fh*b.h:im.width/im.height*b.h;b.slamT=0}
  $('#bossbar').classList.remove('hidden');$('#bossname').textContent=def.n+'（BOSS）';
  const bn=$('#banner');bn.textContent='BOSS 出現！'+def.n;bn.classList.remove('hidden');bn.style.animation='none';bn.offsetHeight;bn.style.animation='';
  setTimeout(()=>bn.classList.add('hidden'),2200);
  Log.push({k:'boss',name:def.n});pushFx(7,0,0,.5);S.bossCool=60;S.flash=.2;S.shake=.4;b.am=ST.mode==='stage'?stageAtk()/D.TIERS[mp.tier-1].atk*(1+(ST.si%2)*.3):1;
}
function bossDmg(att,dmg,crit,ncol){
  const b=S.boss;if(!b||b.dead)return;if(curEl&&b.tbl){const v=b.tbl[D.EL2RO[curEl]];if(v!=null)dmg=Math.round(dmg*clamp(v/100,.25,2))}if(att.self)dmg=Math.round(dmg*selfMul());else if(ST.mode==='stage')dmg=Math.round(dmg*KALLY);b.hp-=dmg;b.flash=.1;att.dmgDone+=dmg;if(att.self&&P('vamp'))healSelf(dmg*PV('vamp')/100);
  if(S.opt.dmg&&(att.lod<=1||rnd()<.4))pushNum(b.x+rr(-30,30),b.y-b.h-4,String(dmg),ncol||(crit?'c':'o'),crit?1.5:1.15);
  if(att.self&&!ncol)Log.push({k:'hit',mob:b.def.n+'（BOSS）',dmg,crit,n:1});
  if(b.hp<=0){b.dead=true;b.dieT=0;S.flash=.35;S.shake=.5;comboAdd();pushFx(7,0,0,.7,1);for(let i=0;i<3;i++)pushFx(5,b.x+rr(-60,60),b.y,1.8);Log.push({k:'bosskill',name:b.def.n});S.nextBossAt=Math.max(S.nextBossAt,S.kills+150);
    const T=D.TIERS[D.mapById(S.mapId).tier-1];if(att.self||dist2(att,chars[0])<400*400){gainExp(Math.round(2500*T.exp));ME.zeny+=Math.round(rr(2000,5000)*T.id);
      for(let i=0;i<2;i++){const g=rollGear({id:Math.min(3,T.id+1)}),it=D.ITEMS[g.id];addToBag(g.id,g.ref);dropRec((g.ref?'+'+g.ref+' ':'')+it.n,1,it.tier,{ty:{n:b.def.n}},Art.itemIcon(it,S.mf))}}}
}
const critM=()=>P('crit')?D.PERKS.find(x=>x.id==='crit').v2[P('crit')-1]:2;
function splash(c,t,d){let n=0;for(let i=0;i<mobs.length&&n<5;i++){const m=mobs[i];if(m===t||!m.on||m.dead)continue;const dx=m.x-t.x,dy=m.y-t.y;if(dx*dx+dy*dy<52*52){dealDmg(c,m,Math.round(d*rr(.8,1.1)),false,true);n++}}}
function attackStart(c,tgt,isBoss){
  c.st=2;c.stT=0;c.hitDone=false;c.cd=rr(.85,1.25)/(c.self?1+ME.aspd/100:1);c.tgt=tgt;c.tgtBoss=isBoss;c.face=tgt.x>=c.x?1:-1;
}
function attackHit(c){
  const t=c.tgt;if(!t)return;const isBoss=!!c.tgtBoss;if(!isBoss&&(t.dead||!t.on))return;if(isBoss&&(!S.boss||S.boss.dead))return;
  const base=(c.self?(c.sh.atk==='magic'?ME.matk:ME.atk)*c.power:(c.lv*1.4+30)*c.power)*(c.buff>0?1.3:1),CR=c.self?.04+ME.crit/100:.13;
  if(c.sh.atk==='melee'){
    if(isBoss){const d=Math.round(base*rr(.8,1.3)),cr=rnd()<CR;bossDmg(c,cr?d*critM():d,cr)} else {const d=Math.round(base*rr(.8,1.3)),cr=rnd()<CR;dealDmg(c,t,cr?d*critM():d,cr);pushFx(c.sh.job==='dnc'?2:0,t.x,t.y-18,.22,c.face);if(c.self&&P('splash'))splash(c,t,d*PV('splash')/100)}
  }else{ // ranged / magic → projectile
    for(let i=0;i<PROJ.length;i++){const p=PROJ[i];if(!p.on){p.on=1;p.x=c.x+c.face*14;p.y=c.y-34;p.sx=p.x;p.sy=p.y;p.tgt=t;p.tb=isBoss;p.att=c;p.t=0;p.kind=c.sh.atk==='magic'?1:0;const d=Math.hypot(t.x-p.x,t.y-18-p.y);p.dur=clamp(d/(p.kind?360:560),.12,.7);
      const dm=Math.round(base*rr(.8,1.3)),cr=rnd()<CR;p.dmg=cr?dm*critM():dm;p.crit=cr;break}}
  }
}
function projHit(p){
  const c=p.att,t=p.tgt;if(p.tb){if(S.boss&&!S.boss.dead)bossDmg(c,p.dmg,p.crit);if(p.kind&&S.boss)pushFx(1,S.boss.x,S.boss.y-30,.45,70,1);return}
  if(!t||t.dead||!t.on){return}
  if(p.kind){ // magic AoE: hits up to 12 nearby mobs
    pushFx(1,t.x,t.y-14,.5,64,0);let n=0,tot=0;
    dealDmg(c,t,p.dmg,p.crit,false);n++;
    for(let i=0;i<mobs.length&&n<12;i++){const m=mobs[i];if(m===t||!m.on||m.dead)continue;const dx=m.x-t.x,dy=m.y-t.y;if(dx*dx+dy*dy<70*70){dealDmg(c,m,Math.round(p.dmg*rr(.45,.7)),false,true);n++}}
    if(S.boss&&!S.boss.dead&&dist2(S.boss,t)<80*80)bossDmg(c,Math.round(p.dmg*.5),false);
  }else{dealDmg(c,t,p.dmg,p.crit);pushFx(0,t.x,t.y-20,.2,c.face)}
}
// ---------- mob projectiles (ranged / static monsters) ----------
const ATKK=1.6;
const MPROJ=Array.from({length:40},()=>({on:0,x:0,y:0,sx:0,sy:0,tgt:null,t:0,dur:.5,dmg:1,col:'#fff',tier:1}));
const MPCOL={mush:['#ffb0b0','#a8b8ff','#ffb060'],plant:['#ff8ab8','#7af0d0','#ff7a4a']};
function mobShoot(m,c){for(const p of MPROJ)if(!p.on){const T=D.TIERS[m.ty.tier-1];p.on=1;p.x=p.sx=m.x;p.y=p.sy=m.y-m.ty.hh*.6;p.tgt=c;p.t=0;p.dur=clamp(Math.hypot(c.x-m.x,c.y-m.y)/230,.2,.8);
  p.dmg=Math.round(rr(8,18)*(1+c.lv/150)*T.atk*ATKK*(m.am||1));p.col=(MPCOL[m.ty.tpl]||MPCOL.mush)[m.ty.tier-1];p.mn=mobName(m);return}}
function mprojHit(p){const c=p.tgt;if(!c||c.hp<=0)return;const dm=c.self?Math.max(1,Math.round(p.dmg*(1-PV('wall')/100)*(ST.mode==='stage'?60/(60+ME.def*.6):1))):p.dmg;c.hp-=dm;c.flash=.12;pushFx(0,c.x,c.y-30,.2,1);
  if(c.self){Log.push({k:'mobhit',mob:p.mn,dmg:dm,hp:Math.max(0,Math.round(c.hp)),maxhp:c.maxhp});if(S.opt.dmg)pushNum(c.x,c.y-76,String(dm),'r',1)}
  if(c.hp<=0){c.deadT=0;c.st=4;if(c.self)Log.push({k:'die',mob:p.mn,map:D.mapById(S.mapId).n})}}
// ---------- skills ----------
const SKS=Array.from({length:100},()=>({on:0}));let skN=0;
const CALL=Array.from({length:14},()=>({on:0,ch:null,txt:'',col:'#fff',t:0}));
const POP=Array.from({length:18},()=>({on:0,x:0,y:0,t:0,txt:'',col:'#fff',ic:null}));
const skLimit=()=>S.q>=3?96:S.q===2?56:S.q===1?28:12;
function pushCall(c,txt,col){if(S.q<1||!(c.self||c.lod<2))return;for(const o of CALL)if(!o.on){o.on=1;o.ch=c;o.txt=txt;o.col=col;o.t=0;return}}
function pushPop(x,y,txt,col,ic){if(S.q<1)return;for(const o of POP)if(!o.on){o.on=1;o.x=x;o.y=y;o.t=0;o.txt=txt;o.col=col;o.ic=ic||null;return}}
function nearestMob(c,R){let best=null,bd=R*R;for(let j=0;j<mobs.length;j++){const m=mobs[j];if(!m.on||m.dead)continue;const d=dist2(c,m);if(d<bd){bd=d;best=m}}return best}
function skillBase(c){return (c.self?(c.sh.atk==='magic'?ME.matk:ME.atk):(c.lv*1.4+30))*c.power*(c.buff>0?1.3:1)}
function allyLow(c,r){for(let j=0;j<chars.length;j++){const o=chars[j];if(o.act&&o.hp>0&&o.hp<o.maxhp*.7&&dist2(c,o)<r*r)return true}return false}
const SKMAX=8,slv=sk=>ME.skl[sk.id]||1,skCost=lv=>Math.round(450*lv*lv);
function cdOf(sk){return Math.max(.6,sk.cd*(1-.035*(slv(sk)-1))*(1-PV('haste')/100))}
function upgradeSkill(i){const sk=D.SKILLS[ME.job][i],lv=slv(sk);if(lv>=SKMAX)return false;const c=skCost(lv);if(ME.zeny<c)return false;ME.zeny-=c;ME.skl[sk.id]=lv+1;save();UI('refresh');return true}
function castSkill(c,sk){
  const kind=sk.kind,el=D.EL[sk.el]||D.EL.phys;let tgt=null,tb=false,tx=c.x,ty=c.y;
  const lvl=c.self?slv(sk):1,cnt=sk.cnt+(c.self?((lvl-1)>>1):0),rad=sk.r*(1+(lvl-1)*.05);
  if(kind!=='buff'&&kind!=='heal'){
    const R=(kind==='wave'||(kind==='nova'&&sk.el==='phys'))?Math.max(120,c.range+95):(c.sh.atk==='melee'?190:290),boss=S.boss&&!S.boss.dead?S.boss:null,bR=boss?(R+boss.h*.4)*(R+boss.h*.4):0;
    if(boss&&dist2(c,boss)<bR&&rnd()<.5){tgt=boss;tb=true}else tgt=nearestMob(c,R);
    if(!tgt&&boss&&dist2(c,boss)<bR){tgt=boss;tb=true}
    if(!tgt)return false;tx=tgt.x;ty=tb?tgt.y-tgt.h*.3:tgt.y;c.face=tx>=c.x?1:-1}
  if(c.st!==4){c.st=2;c.stT=0;c.hitDone=true;c.cd=Math.max(c.cd,.5)}
  pushCall(c,sk.n,el.c1);
  const dmg=skillBase(c)*sk.mul*(1+.2*(lvl-1))*(c.self?1+PV('power')/100:1),B={el:sk.el,att:c,name:sk.n,nc:el.num,r:rad,seed:(rnd()*1e6)|0,tgt,tb,tx,ty:ty,sx:c.x+c.face*12,sy:c.y-34};
  switch(kind){
   case 'bolt':{const n=cnt;for(let i=0;i<n;i++)emitSk(Object.assign({k:'bolt',dly:i*.09,dur:.55,hitAt:.52,dmg:dmg*(n>1?.62:1),n:sk.el==='fire'?5:2},B));break}
   case 'nova':{const atCaster=sk.el==='phys'||sk.el==='pink'||sk.el==='dark';emitSk(Object.assign({k:'nova',x:atCaster?c.x:tx,y:atCaster?c.y:ty,dly:0,dur:.8,hitAt:.2,dmg,n:14},B));break}
   case 'pillar':emitSk(Object.assign({k:'pillar',x:tx,y:ty,dly:0,dur:.95,hitAt:.4,dmg,n:10},B));break;
   case 'meteor':for(let i=0;i<cnt;i++){const a=rnd()*6.283,d=rnd()*sk.r*.9;emitSk(Object.assign({k:'meteor',x:tx+Math.cos(a)*d,y:ty+Math.sin(a)*d*.6,dly:i*.17,dur:.95,hitAt:.5,dmg:dmg/Math.max(1,cnt*.55),n:10},B))}break;
   case 'arrows':emitSk(Object.assign({k:'arrows',x:tx,y:ty,dly:0,dur:1,hitAt:.45,dmg,n:8},B));break;
   case 'wave':{const dx=tx-c.x,dy=ty-(c.y-14),d=Math.hypot(dx,dy)||1;emitSk(Object.assign({k:'wave',x:c.x+dx/d*10,y:c.y-14,ang:Math.atan2(dy,dx)*.6,L:sk.el==='pink'?170:150,dly:0,dur:.55,hitAt:.3,dmg,n:12},B));break}
   case 'chain':{const path=[];let cur=tb?null:tgt;const seen=new Set();
     if(tb)path.push({b:1,x:tgt.x,y:tgt.y-tgt.h*.4});
     while(cur&&path.length<cnt){path.push({m:cur,x:cur.x,y:cur.y-16});seen.add(cur);let best=null,bd=rad*rad*1.3;for(let j=0;j<mobs.length;j++){const m=mobs[j];if(!m.on||m.dead||seen.has(m))continue;const d=dist2(cur,m);if(d<bd){bd=d;best=m}}cur=best}
     emitSk(Object.assign({k:'chain',path,dly:0,dur:.3+path.length*.05,hitAt:9,dmg,n:path.length,hop:0,x:c.x,y:c.y},B));break}
   case 'heal':emitSk(Object.assign({k:'heal',x:c.x,y:c.y,dly:0,dur:1.1,hitAt:.2,dmg:0},B));break;
   case 'buff':{c.buff=12;if(c.self){ME.buffs=ME.buffs.filter(b=>b.id!==sk.id);ME.buffs.push({id:sk.id,n:sk.n,left:12,mul:1.3+.04*(lvl-1),el:sk.el});calcMe();Log.push({k:'skill',name:sk.n,buff:1})}emitSk(Object.assign({k:'buff',x:c.x,y:c.y,dly:0,dur:1.2,hitAt:2,dmg:0},B));break}
  }
  if(c.self&&(sk.mul>=2.4||kind==='meteor')){S.flash=Math.max(S.flash||0,.1);S.shake=Math.max(S.shake||0,.28)}
  return true}
function emitSk(o){
  if(skN>=skLimit()||S.q===0&&o.k!=='bolt'&&o.k!=='nova'&&o.k!=='pillar'){doHit(o,true);return}
  for(let i=0;i<SKS.length;i++){const s=SKS[i];if(!s.on){for(const k in o)s[k]=o[k];s.on=1;s.t=0;s.hits=0;s.logged=0;s.tot=0;skN++;return}}
  doHit(o,true)}
function aoeHit(att,x,y,r,dmg,maxN,ncol,first){let n=0,tot=0;const r2=r*r;
  if(first&&first.on&&!first.dead){const d=Math.round(dmg*rr(.9,1.1));dealDmg(att,first,d,false,true,ncol);tot+=d;n++}
  for(let i=0;i<mobs.length&&n<maxN;i++){const m=mobs[i];if(!m.on||m.dead||m===first)continue;const dx=m.x-x,dy=(m.y-y)*1.5;if(dx*dx+dy*dy<r2){const d=Math.round(dmg*rr(.75,1.1));dealDmg(att,m,d,false,true,ncol);tot+=d;n++}}
  const b=S.boss;if(b&&!b.dead){const dx=b.x-x,dy=(b.y-y)*1.5,R=r+b.w*.35;if(dx*dx+dy*dy<R*R){const d=Math.round(dmg*rr(.8,1.1));bossDmg(att,d,false,ncol);tot+=d;n++}}
  return [tot,n]}
function skLog(c,s,r){if(c.self&&r[1]>0)Log.push({k:'skill',name:s.name,n:r[1],dmg:r[0]})}
function doHit(s,inst,mx){const pe=curEl;curEl=s.el==='heal'?null:s.el;try{doHit0(s,inst,mx)}finally{curEl=pe}}
function hop(s,i){const c=s.att,q=s.path[i];if(!q)return;const pe=curEl;curEl=s.el;const d=Math.round(s.dmg*Math.max(.55,1-i*.07)*rr(.9,1.1));
  if(q.b){if(S.boss&&!S.boss.dead)bossDmg(c,d,false,s.nc)}else if(q.m&&q.m.on&&!q.m.dead){dealDmg(c,q.m,d,false,true,s.nc);if(i&&S.q>=1)pushFx(0,q.m.x,q.m.y-18,.22,1)}
  curEl=pe;s.tot=(s.tot||0)+d}
function doHit0(s,inst,mx){const c=s.att,m=mx||1;let r;
  switch(s.k){
   case 'bolt':{const t=s.tgt;
     if(s.tb){if(S.boss&&!S.boss.dead){const d=Math.round(s.dmg*rr(.9,1.1));bossDmg(c,d,false,s.nc);r=[d,1]}}
     else if(t&&t.on&&!t.dead)r=aoeHit(c,t.x,t.y,s.r,s.dmg,(s.el==='fire'||s.el==='holy')?5:1,s.nc,t);
     else r=aoeHit(c,s.tx,s.ty,s.r+10,s.dmg,2,s.nc);
     if(r)skLog(c,s,r);break}
   case 'nova':case 'pillar':r=aoeHit(c,s.x,s.y,s.r,s.dmg*m,s.n,s.nc);skLog(c,s,r);break;
   case 'meteor':r=aoeHit(c,s.x,s.y,s.r,s.dmg*m,s.n,s.nc);skLog(c,s,r);S.shake=Math.max(S.shake||0,.1);break;
   case 'arrows':r=aoeHit(c,s.x,s.y,s.r,s.dmg*.55*(mx||1),s.n,s.nc);skLog(c,s,r);break;
   case 'wave':{const dx=Math.cos(s.ang)*(c.face<0?-1:1),dy=Math.sin(s.ang);if(c.face<0)s.dirx=-1;else s.dirx=1;let n=0,tot=0;
     const hitL=(e,isb)=>{const rx=e.x-s.x,ry=(e.y-(isb?e.h*.3:0))-s.y,al=rx*s.dirx*Math.cos(s.ang)+ry*Math.sin(s.ang),pe=Math.abs(-rx*s.dirx*Math.sin(s.ang)+ry*Math.cos(s.ang)*s.dirx*s.dirx),w=34+(isb?e.w*.3:0);return al>-12&&al<s.L+(isb?e.w*.3:0)&&pe<w};
     for(let i=0;i<mobs.length&&n<s.n;i++){const e=mobs[i];if(!e.on||e.dead)continue;if(hitL(e,false)){const d=Math.round(s.dmg*rr(.8,1.1));dealDmg(c,e,d,false,true,s.nc);tot+=d;n++}}
     const b=S.boss;if(b&&!b.dead&&hitL(b,true)){const d=Math.round(s.dmg*rr(.8,1.1));bossDmg(c,d,false,s.nc);tot+=d;n++}
     skLog(c,s,[tot,n]);break}
   case 'chain':{for(let i=s.hop;i<s.path.length;i++)hop(s,i);s.hop=s.path.length;skLog(c,s,[s.tot||0,s.path.length]);break}
   case 'heal':{let n=0;for(let j=0;j<chars.length;j++){const o=chars[j];if(!o.act||o.hp<=0||dist2(c,o)>s.r*s.r)continue;const h=Math.round(o.maxhp*.28);o.hp=Math.min(o.maxhp,o.hp+h);n++;if(n<=6&&S.opt.dmg&&S.q>=2)pushNum(o.x,o.y-70,'+'+h,'g',.85);if(S.q>=2&&n<=10)pushFx(6,o.x,o.y-26,.8)}
     if(c.self&&n)Log.push({k:'skill',name:s.name,heal:n});break}
  }}
function updateSk(dt){
  skN=0;
  for(let i=0;i<SKS.length;i++){const s=SKS[i];if(!s.on)continue;s.t+=dt;const u=(s.t-s.dly)/s.dur;if(u<0){skN++;continue}
    if(s.k==='bolt'&&!s.hits&&s.tgt){const t=s.tgt;if(s.tb){if(S.boss&&!S.boss.dead){s.tx=S.boss.x;s.ty=S.boss.y-S.boss.h*.4}}else if(t.on&&!t.dead){s.tx=t.x;s.ty=t.y-16}}
    if(s.k==='chain'){while(s.hop<s.path.length&&s.t-s.dly>=s.hop*.05){hop(s,s.hop);s.hop++}if(s.hop>=s.path.length&&!s.logged){s.logged=1;skLog(s.att,s,[s.tot||0,s.path.length])}}
    if(s.hits===0&&u>=s.hitAt){s.hits=1;doHit(s)}
    if(s.k==='arrows'&&s.hits===1&&u>=.85){s.hits=2;doHit(s,false,.9)}
    if(u>=1){s.on=0;continue}skN++}
  for(const o of CALL)if(o.on){o.t+=dt;if(o.t>1.1)o.on=0}
  for(const o of POP)if(o.on){o.t+=dt;if(o.t>1.5)o.on=0}
}
function autoSelf(c,dt){
  ME.sp=Math.min(ME.maxsp,ME.sp+ME.maxsp*.035*dt*(1+PV('mind')/100));if(ST.potT>0)ST.potT-=dt;if(ST.rageT>0){ST.rageT-=dt;if(ST.rageT<=0)ST.rageN=0}
  for(let i=0;i<4;i++)if(ME.cdT[i]>0)ME.cdT[i]-=dt;
  if(ME.buffs.length){let ch=false;for(const b of ME.buffs){b.left-=dt;if(b.left<=0)ch=true}if(ch){ME.buffs=ME.buffs.filter(b=>b.left>0);calcMe()}}
  if(c.buff>0)c.buff-=dt;
  if(c.st===2||c.hp<=0)return;
  const L=D.SKILLS[ME.job];
  for(let i=0;i<4;i++){const sk=L[i];if(!ME.auto[i]||ME.cdT[i]>0||ME.sp<sk.sp)continue;
    if(sk.kind==='buff'&&ME.buffs.some(b=>b.id===sk.id))continue;
    if(sk.kind==='heal'&&!allyLow(c,sk.r))continue;
    if(castSkill(c,sk)){ME.sp-=sk.sp;const cd=cdOf(sk);ME.cdT[i]=cd;UI('onCast',i,cd);break}}
}
function castSelf(i){const c=chars[0],sk=D.SKILLS[ME.job][i];if(!c||c.hp<=0||ME.cdT[i]>0||ME.sp<sk.sp)return false;
  if(castSkill(c,sk)){ME.sp-=sk.sp;const cd=cdOf(sk);ME.cdT[i]=cd;UI('onCast',i,cd);return true}
  Log.push({k:'warn',text:'沒有可攻擊的目標。'});return false}
function autoOther(c,dt){
  if(c.buff>0)c.buff-=dt;c.skcd-=dt;if(c.skcd>0||c.st===2||S.q<1)return;
  c.skcd=rr(4.5,9)*(S.q>=3?1:1.5);const L=D.SKILLS[c.sh.job];const sk=L[(rnd()*L.length)|0];
  if(sk.kind==='buff'&&c.buff>0)return;if(sk.kind==='heal'&&!allyLow(c,sk.r))return;castSkill(c,sk)}
// ---------- stage machine ----------
function drinkPotion(){const c=chars[0];if(!c||c.hp<=0||c.hp>=c.maxhp||ST.potT>0||!(ME.mats['紅色藥水']>0))return false;ME.mats['紅色藥水']--;ST.potT=6;const h=Math.round(c.maxhp*.4);c.hp=Math.min(c.maxhp,c.hp+h);pushNum(c.x,c.y-76,'+'+h,'g',1.1);pushFx(6,c.x,c.y-26,.8);Log.push({k:'sys',text:'使用 紅色藥水，回復 '+h+' HP。'});UI('dirty');UI('potion');return true}
function buyPotions(n){const cost=60*n;if(ME.zeny<cost)return false;ME.zeny-=cost;ME.mats['紅色藥水']=(ME.mats['紅色藥水']||0)+n;save();UI('refresh');return true}
function isUnlocked(d,si){return (d===0||ME.clr[d-1]>=3)&&si<=ME.clr[d]}
function sweepAll(hard){mobs.forEach(m=>{if(m.on&&!m.dead){m.dead=true;m.dieT=0;m.respawn=9}});MPROJ.forEach(p=>p.on=0);if(hard&&S.boss){S.boss=null;$('#bossbar').classList.add('hidden')}}
async function stageStart(d,si){
  const mp=D.MAPS[si];if(!mp||!D.DIFFS[d])return;ST.mode='stage';ST.d=d;ST.si=si;ST.state='intro';
  await setMap(mp.id,true);
  ST.perks={};ST.mhp=0;ST.kills=ST.elites=ST.peak=0;ST.elapsed=0;ST.res=null;ST.choices=null;ST.rageT=0;ST.rageN=0;ST.potT=0;ST.hpMin=1;ST.dtk=0;ST.lastHp=ME.maxhp;ST.w=0;ST.wk=0;ST.timer=1.8;ST.sweep=false;ST.bossUp=false;ST.enr=1;CB.n=0;CB.max=0;CB.t=-99;
  S.paused=false;document.body.classList.remove('paused');S.flash=0;
  calcMe();chars.forEach((c,i)=>{c.maxhp=i?c.maxhp:ME.maxhp;c.hp=c.maxhp;c.st=0;c.deadT=0;c.x=c.ax;c.y=c.ay;c.tgt=null});
  ME.sp=ME.maxsp;ME.cdT=[0,0,0,0];ME.buffs.length=0;calcMe();[NUMS,FX,PROJ,SKS].forEach(a=>a.forEach(o=>o.on=0));numCount=fxCount=0;
  Log.push({k:'sys',text:'討伐開始：'+D.DIFFS[d].n+' '+(si+1)+' · '+mp.n+'。'});UI('stage');UI('stageStarted')}
function beginWave(w){ST.w=w;ST.wk=0;ST.waveT=0;ST.sweep=false;ST.enr=1;ST.state='run';ST.wt=w>=D.WAVES?0:18+w*8;
  if(w>=D.WAVES){spawnBoss(true,true)}
  UI('banner','WAVE '+w+(w>=D.WAVES?' · BOSS':''),w>=D.WAVES?2:0);UI('stage')}
function clearWave(){ST.state='break';ST.timer=2.2;ST.sweep=true;sweepAll();const c=chars[0];healSelf(c.maxhp*.1);
  if(P('regen')){ST.mhp+=Math.round(ME.maxhp*.03);calcMe();healSelf(c.maxhp*PV('regen')/100)}
  UI('banner','WAVE '+ST.w+' 清除！',1);S.flash=.14;UI('stage')}
function offerPerks(){const pool=D.PERKS.filter(p=>(ST.perks[p.id]||0)<3),ch=[];while(ch.length<3&&pool.length)ch.push(pool.splice((rnd()*pool.length)|0,1)[0].id);ST.choices=ch;ST.state='perk';
  if(ST.autoPerk){pickPerk(ch[0]);return}S.paused=true;UI('perk')}
function pickPerk(id){if(ST.state!=='perk'||!ST.choices||ST.choices.indexOf(id)<0)return;ST.perks[id]=(ST.perks[id]||0)+1;ST.choices=null;calcMe();S.paused=false;UI('perk');beginWave(ST.w+1)}
function clearStage(){const d=D.DIFFS[ST.d];ST.state='clear';sweepAll();
  const z=Math.round(1500*(1+ST.si*.7)*d.zeny),ex=Math.round(1200*(1+ST.si*.5)*d.exp*(1+ME.lv/50)),pots=6+ST.d*2;ME.zeny+=z;gainExp(ex);ME.mats['紅色藥水']=(ME.mats['紅色藥水']||0)+pots;
  const drops=[],T=D.TIERS[Math.min(2,D.MAPS[ST.si].tier)];for(let i=0;i<2+ST.d;i++){const g=rollGear(T),it=D.ITEMS[g.id];addToBag(g.id,g.ref);drops.push({n:(g.ref?'+'+g.ref+' ':'')+it.n,t:it.tier,id:it.id})}
  const first=ME.clr[ST.d]<ST.si+1;if(first)ME.clr[ST.d]=ST.si+1;
  ST.res={win:true,d:ST.d,si:ST.si,zeny:z,exp:ex,drops,kills:ST.kills,elites:ST.elites,peak:ST.peak,time:ST.elapsed,first,pots};save();S.flash=.3;UI('result');UI('stage')}
function failStage(){ST.state='fail';sweepAll(true);const pots=ME.mats['紅色藥水']||0;
  ST.res={win:false,d:ST.d,si:ST.si,w:ST.w,kills:ST.kills,elites:ST.elites,peak:ST.peak,time:ST.elapsed,pots,hint:pots<=0?'藥水用完了：到「討伐」視窗購買，或打怪補貨。':ST.enr>1?'波次拖太久觸發狂暴：提升輸出（技能升級／巨力、連鎖類技能）。':ST.d>0?'難度偏高：先升級技能與裝備，或降一級難度再來。':'升級技能、換更高階裝備，並在升級時選擇鐵壁／嗜血／復甦。'};
  Log.push({k:'warn',text:'討伐失敗：第 '+ST.w+' 波被擊倒。'});save();UI('result');UI('stage')}
function setFree(){ST.mode='free';ST.state='idle';ST.perks={};ST.mhp=0;ST.res=null;ST.choices=null;CB.n=0;sweepAll(true);S.paused=false;const c=chars[0];calcMe();if(c){c.hp=c.maxhp;c.deadT=0;c.st=0}S.nextBossAt=S.kills+150;UI('result');UI('perk');UI('stage')}
const retryStage=()=>stageStart(ST.d,ST.si);
function nextStage(){let d=ST.d,si=ST.si+1;if(si>=D.MAPS.length){d++;si=0}if(isUnlocked(d,si))return stageStart(d,si)}
function stageUpdate(dt){
  if(ST.mode!=='stage')return;const c=chars[0];
  if(ST.state==='intro'){ST.timer-=dt;if(ST.timer<=0)beginWave(1);return}
  if(c.hp<ST.lastHp)ST.dtk+=ST.lastHp-c.hp;ST.lastHp=c.hp;
  if(ST.state==='run'){ST.elapsed+=dt;ST.waveT+=dt;ST.enr=1+Math.max(0,Math.floor((ST.waveT-80)/20))*.35;
    if(c.hp<=0){failStage();return}
    if(ME.autoPot&&c.hp<c.maxhp*.38)drinkPotion();
    if(ST.w<D.WAVES){if(ST.wk>=ST.wt)clearWave()}
    else if(ST.bossUp&&S.boss&&S.boss.dead&&S.boss.dieT>.9){clearStage()}
  }else if(ST.state==='break'){ST.timer-=dt;if(c.hp<=0){failStage();return}if(ST.timer<=0)offerPerks()}
}
// ---------- maps ----------
async function setMap(id,quiet){
  const mp=D.mapById(id);if(!mp)return;S.mapId=id;ME.mapId=id;const T=D.TIERS[mp.tier-1];
  S.mapTypes=D.ORDER.map((tpl,i)=>({ty:S.types['t'+T.id+'_'+(tpl==='blob'?'slime':tpl)],w:mp.w[i]})).filter(x=>x.ty);S.wsum=S.mapTypes.reduce((a,b)=>a+b.w,0);
  S.bgImg=null;const bg=S.mf&&S.mf.maps&&S.mf.maps[id]&&S.mf.maps[id].bg;if(bg){try{S.bgImg=await Art.loadImg(bg)}catch(e){console.warn('map bg failed',bg)}}
  mobs.forEach(m=>{m.on=false;m.dead=false;m.respawn=rr(0,.5)});S.boss=null;$('#bossbar').classList.add('hidden');S.freshUntil=S.t+.4;S.nextBossAt=S.kills+150;
  PROJ.forEach(p=>p.on=0);MPROJ.forEach(p=>p.on=0);SKS.forEach(p=>p.on=0);NUMS.forEach(p=>p.on=0);
  chars.forEach((c,i)=>{if(i>0){c.lv=Math.round(rr(T.clv[0],T.clv[1]));c.maxhp=Math.round(rr(700,1500)+c.lv*4);c.hp=c.maxhp}});
  bgKey='';layout();$('#scene-title').textContent='戰鬥場景 - '+mp.n+'（割草）';
  if(!quiet)Log.push({k:'sys',text:'移動到 '+mp.n+'（'+T.name+'）。'});save();UI('refresh');UI('mapChanged')}
// ---------- update ----------
let frameNo=0;
function update(dt){
  S.t+=dt;frameNo++;const E=eff();stageUpdate(dt);
  if(S.flash>0)S.flash-=dt;if(CB.n&&S.t-CB.t>comboWin())CB.n=0;if(S.t-S.cbT>.1){S.cbT=S.t;UI('combo',CB.n,Math.max(0,1-(S.t-CB.t)/comboWin()))}
  // mobs count control
  let alive=0;for(let i=0;i<mobs.length;i++){const m=mobs[i];if(m.on&&!m.dead)alive++}
  // soft-remove surplus (quality/slider), spawn missing
  if(alive>E.mob){for(let i=mobs.length-1;i>=0&&alive>E.mob;i--){const m=mobs[i];if(m.on&&!m.dead){m.on=false;alive--}}}
  for(let i=0;i<mobs.length;i++){const m=mobs[i];
    if(m.on&&m.dead){m.dieT+=dt;if(m.dieT>.55){m.on=false;m.respawn=Math.max(0,m.respawn-.55)}}
    if(!m.on&&alive<mobCap()&&m.respawn<=0&&S.wsum>0){spawnMob(m,S.t<S.freshUntil);alive++}
    else if(!m.on&&m.respawn>0)m.respawn-=dt}
  const nCh=E.ch;
  // char AI
  const boss=S.boss&&!S.boss.dead?S.boss:null;
  for(let i=0;i<chars.length;i++){const c=chars[i];c.act=i<nCh;if(!c.act)continue;
    if(c.hp<=0){c.deadT+=dt;c.st=4;if(c.deadT>2.2&&!(c.self&&ST.mode==='stage')){c.hp=c.maxhp*.6;c.deadT=0;c.st=0;c.x=c.ax;c.y=c.ay}continue}
    c.stT+=dt;c.cd-=dt;if(c.flash>0)c.flash-=dt;if(c.hp<c.maxhp)c.hp=Math.min(c.maxhp,c.hp+c.maxhp*(c.self?(ST.mode==='stage'?.004:.03+ME.st.def*.0002):.03)*dt);
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
    if(c.self)autoSelf(c,dt);else autoOther(c,dt);
  }
  // char separation (O(n^2), n<=40)
  for(let i=0;i<nCh;i++){const a=chars[i];if(a.hp<=0)continue;for(let j=i+1;j<nCh;j++){const b=chars[j];if(b.hp<=0)continue;const dx=b.x-a.x,dy=(b.y-a.y)*1.3,d2=dx*dx+dy*dy,mn=MOBILE?30:40;if(d2<mn*mn&&d2>.01){const d=Math.sqrt(d2),p=(mn-d)*.45/d;a.x-=dx*p;a.y-=dy*p/1.3;b.x+=dx*p;b.y+=dy*p/1.3}}}
  // mobs
  for(let i=0;i<chars.length;i++)chars[i].att=0;
  const gx=Math.max(1,Math.ceil(S.W/40)),gy=Math.max(1,Math.ceil(S.H/40));
  if(!update.head||update.head.length<gx*gy){update.head=new Int16Array(gx*gy)}update.head.fill(-1);if(!update.next)update.next=new Int16Array(300);
  for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on||m.dead)continue;const k=clamp((m.x/40)|0,0,gx-1)+clamp((m.y/40)|0,0,gy-1)*gx;update.next[i]=update.head[k];update.head[k]=i}
  for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on)continue;m.t+=dt;if(m.atkT>0)m.atkT-=dt;if(m.flash>0)m.flash-=dt;if(m.hurt>0)m.hurt-=dt;if(m.dead)continue;if(m.elite)m.hurt=3;
    if((frameNo+i)%14===0||!m.tgt||m.tgt.hp<=0||!m.tgt.act){let best=null,bd=1e12;for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const d=dist2(m,c);if(d<bd){bd=d;best=c}}m.tgt=best}
    const c=m.tgt;if(!c)continue;const dx=c.x-m.x,dy=c.y-m.y,d=Math.hypot(dx,dy)||1,ty=m.ty,beh=ty.beh,TI=D.TIERS[ty.tier-1];
    let sp=m.spd*dt,mvx=0,mvy=0;
    if(beh==='static'||beh==='ranged'){
      const R=beh==='static'?175:150;m.face=dx>0?1:-1;
      if(d<=R){m.cd-=dt;if(m.cd<=0){m.cd=rr(1.7,2.7);m.atkT=.4;mobShoot(m,c)}}
      else if(beh==='ranged'){mvx=dx/d;mvy=dy/d}
    }else{
      if(beh==='charger'){m.dashT-=dt;if(m.dash>0){m.dash-=dt;sp*=3.4}else if(m.dashT<=0&&d>80&&d<260){m.dash=.4;m.atkT=.4;m.dashT=rr(2.6,4.4);pushFx(3,m.x,m.y-4,.3)}}
      if(beh==='flyer'){m.ph+=dt*(3+ty.spdMul);const px=-dy/d,py=dx/d,w=Math.sin(m.ph)*.9;mvx+=px*w;mvy+=py*w}
      if(d>30){mvx+=dx/d;mvy+=dy/d;if(Math.abs(dx)>2)m.face=dx>0?1:-1}
      else{m.face=dx>0?1:-1;if(c.att<(c.self?7:5)){c.att++;m.cd-=dt;if(m.cd<=0){m.cd=rr(1.1,1.8)*(beh==='tank'?1.4:1);m.atkT=.4;
        let stg=ST.mode==='stage',def=c.self?ME.def*(stg?.6:1):c.lv*.6,dmg=Math.max(1,Math.round(rr(6,20)*(1+c.lv/150)*TI.atk*ATKK*(m.am||1)*(beh==='tank'?1.5:1)*(60/(60+def))*(c.self?1-PV('wall')/100:1)));if(c.self&&stg)dmg=Math.min(dmg,Math.round(c.maxhp*.2));c.hp-=dmg;c.flash=.12;if(c.self&&ST.hpMin>c.hp/c.maxhp)ST.hpMin=c.hp/c.maxhp;
        if(c.self){Log.push({k:'mobhit',mob:mobName(m),dmg,hp:Math.max(0,Math.round(c.hp)),maxhp:c.maxhp});if(S.opt.dmg)pushNum(c.x,c.y-76,String(dmg),'r',1)}
        if(c.hp<=0){c.deadT=0;c.st=4;if(c.self)Log.push({k:'die',mob:mobName(m),map:D.mapById(S.mapId).n})}}}}
    }
    if(mvx||mvy){const l=Math.hypot(mvx,mvy)||1;m.x+=mvx/l*sp;m.y+=mvy/l*sp;m.mv=1}else m.mv=0
    // separation via grid neighbours
    const k0=clamp((m.x/40)|0,0,gx-1),k1=clamp((m.y/40)|0,0,gy-1);
    for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const kx=k0+ox,ky=k1+oy;if(kx<0||ky<0||kx>=gx||ky>=gy)continue;let j=update.head[kx+ky*gx],n=0;
      while(j>=0&&n++<6){if(j!==i){const o=mobs[j],ddx=m.x-o.x,ddy=m.y-o.y,dd=ddx*ddx+ddy*ddy;if(dd<18*18&&dd>.01){const q=Math.sqrt(dd),p=(18-q)*.4/q;m.x+=ddx*p;m.y+=ddy*p}}j=update.next[j]}}
  }
  // boss
  if(S.boss){const b=S.boss;b.t+=dt;if(b.slamT>0)b.slamT-=dt;if(b.flash>0)b.flash-=dt;if(b.dead){b.dieT+=dt;if(b.dieT>1.4){S.boss=null;$('#bossbar').classList.add('hidden')}}
    else{ // walk towards nearest char, slam with warning ring
      let best=null,bd=1e12;for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const d=dist2(b,c);if(d<bd){bd=d;best=c}}
      if(best){const dx=best.x-b.x,dy=best.y-b.y,d=Math.hypot(dx,dy)||1;if(d>b.h*.5){b.x+=dx/d*34*dt;b.y+=dy/d*34*dt}b.face=dx>0?1:-1;}
      b.lock+=dt;b.cd-=dt;
      if(b.warnT<0&&b.cd<=0){b.warnT=0;b.wx=best?best.x:b.x;b.wy=best?best.y:b.y;b.cd=rr(4,6)}
      if(b.warnT>=0){b.warnT+=dt;if(b.warnT>=.8){b.warnT=-1;b.slamT=.5;pushFx(1,b.wx,b.wy,.55,100,2);S.shake=.3;
        for(let j=0;j<nCh;j++){const c=chars[j];if(c.hp<=0)continue;const dx=c.x-b.wx,dy=c.y-b.wy;if(dx*dx+dy*dy<100*100){const dmg=Math.round(rr(120,260)*D.TIERS[D.mapById(S.mapId).tier-1].atk*(b.am||1)*(c.self?(60/(60+ME.def*(ST.mode==='stage'?.6:1)))*(1-PV('wall')/100):1));c.hp-=dmg;c.flash=.2;
          if(c.self){Log.push({k:'bosshit',name:b.def.n,dmg});if(S.opt.dmg)pushNum(c.x,c.y-76,String(dmg),'r',1.3);Log.push({k:'warn',text:'⚠ BOSS 範圍攻擊！'})}
          if(c.hp<=0){c.deadT=0;c.st=4}}}}}
      $('#bossfill').style.width=Math.max(0,b.hp/b.maxhp*100)+'%'}}
  // projectiles
  for(let i=0;i<PROJ.length;i++){const p=PROJ[i];if(!p.on)continue;p.t+=dt;const u=p.t/p.dur;const t=p.tgt;
    if(p.tb&&S.boss){p.ex=S.boss.x;p.ey=S.boss.y-S.boss.h*.5}else if(t){p.ex=t.x;p.ey=t.y-18}
    p.x=p.sx+(p.ex-p.sx)*Math.min(1,u);p.y=p.sy+(p.ey-p.sy)*Math.min(1,u)-(p.kind?Math.sin(Math.min(1,u)*Math.PI)*16:0);
    if(u>=1){p.on=0;projHit(p)}}
  for(let i=0;i<MPROJ.length;i++){const p=MPROJ[i];if(!p.on)continue;p.t+=dt;const u=p.t/p.dur,t=p.tgt;if(t){p.ex=t.x;p.ey=t.y-26}p.x=p.sx+(p.ex-p.sx)*Math.min(1,u);p.y=p.sy+(p.ey-p.sy)*Math.min(1,u)-Math.sin(Math.min(1,u)*Math.PI)*10;if(u>=1){p.on=0;mprojHit(p)}}
  updateSk(dt);
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
S.nextBub=2;S.lodT=-1;S.cbT=0;S.flash=0;
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
  if(c.self&&ME.aura>=1){const al=.55+.2*Math.sin(S.t*3);ctx.globalAlpha=al;ctx.drawImage(auraFor(ME.aura),c.x-34,c.y-14,68,28);ctx.globalAlpha=1}
  if(c.buff>0&&(c.self||c.lod<2)){ctx.globalAlpha=.5;ctx.drawImage(auraFor(2),c.x-26,c.y-12,52,22);ctx.globalAlpha=1}
  ctx.setTransform(c.face*T,0,0,T,c.x*T,c.y*T);
  ctx.drawImage(c.img,Math.round(sx),0,Math.round(cw),Math.round(ch),-cw*S_/2,-sh.base*S_,cw*S_,ch*S_);
  if(c.flash>0&&c.lod<2||c.flash>0&&S.q>=1){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;ctx.drawImage(c.img,Math.round(sx),0,Math.round(cw),Math.round(ch),-cw*S_/2,-sh.base*S_,cw*S_,ch*S_);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
  ctx.setTransform(T,0,0,T,0,0);
}
const auraCv={};
function auraFor(g){if(auraCv[g])return auraCv[g];const c=document.createElement('canvas');c.width=96;c.height=40;const x=c.getContext('2d'),col=D.GRADES[g].c;const gr=x.createRadialGradient(48,20,2,48,20,46);gr.addColorStop(0,col);gr.addColorStop(.55,col+'88');gr.addColorStop(1,col+'00');x.save();x.translate(0,0);x.scale(1,.42);x.translate(0,20/.42-20);x.fillStyle=gr;x.beginPath();x.arc(48,20,46,0,7);x.fill();x.restore();return auraCv[g]=c}
function drawMob(m,T){
  const ty=m.ty,kk=m.dead?1-m.dieT/.55:1,fly=ty.beh==='flyer'?FLY+(m.dead?0:Math.sin(m.t*3+m.id)*3):0;
  const bob=m.dead?0:(m.lod===2?0:Math.sin(m.t*5+m.id)*-1.4);
  if(S.q>=2||ty.beh==='flyer')ctx.drawImage(shadowCv,m.x-ty.w*.4,m.y-4,ty.w*.8,ty.w*.8*20/48);
  if(m.elite&&!m.dead){ctx.globalAlpha=.55+.2*Math.sin(S.t*5+m.id);ctx.drawImage(auraFor(4),m.x-38,m.y-16,76,32);ctx.globalAlpha=1}
  const sc=(m.dead?.6+.4*kk:1)*(m.elite?1.28:1);let fi=0,sy=0;const an=ty.anim;
  if(an){ // state sheet: row0 idle(4) / row1 walk(6) / row2 attack(4)
    if(m.lod===2||m.dead){fi=0}
    else if(m.atkT>0){const a=an.atk;sy=a.row*ty.fh;fi=Math.min(a.n-1,((1-m.atkT/a.t)*a.n)|0)}
    else if(m.mv){const a=an.walk;sy=a.row*ty.fh;fi=((m.t*a.fps+m.id)|0)%a.n}
    else{const a=an.idle;fi=((m.t*a.fps+m.id)|0)%a.n}
  }else fi=(m.lod===2||m.dead||ty.frames<2)?0:((m.t*ty.fps+m.id)|0)%ty.frames;
  const sx=fi*ty.fw;
  ctx.setTransform((m.face>0?-1:1)*ty.flip*T*sc,0,0,T*sc,m.x*T,(m.y-fly+bob)*T);
  if(m.dead)ctx.globalAlpha=kk;
  const dw=ty.fw*ty.k,dh=ty.fh*ty.k,dy=-ty.base*ty.k;
  ctx.drawImage(ty.cv,sx,sy,ty.fw,ty.fh,-dw/2,dy,dw,dh);
  if(m.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(m.dead?kk:1)*.6;ctx.drawImage(ty.cv,sx,sy,ty.fw,ty.fh,-dw/2,dy,dw,dh);ctx.globalCompositeOperation='source-over'}
  ctx.globalAlpha=1;ctx.setTransform(T,0,0,T,0,0);
}
function drawBoss(T){
  const b=S.boss,im=b.def.im,mt=b.def.meta;let k=b.dead?1-b.dieT/1.4:1;
  ctx.drawImage(shadowCv,b.x-b.w*.5+b.w*.08,b.y-8,b.w*.84,b.w*.26);
  ctx.setTransform((b.face>0?-1:1)*T,0,0,T,b.x*T,b.y*T);ctx.globalAlpha=Math.max(0,k);
  if(mt){ // 4-frame idle row / 4-frame attack row (windup while the warning ring charges, strike on the slam)
    let row=0,fi=((b.t*mt.idle.fps)|0)%mt.idle.n;
    if(!b.dead){if(b.slamT>0){row=1;fi=b.slamT>.3?1:b.slamT>.15?2:3}else if(b.warnT>=0){row=1;fi=0}}
    const sx=fi*mt.fw,sy=row*mt.fh,bh=b.h*(1+(b.warnT>=0?.02*Math.sin(b.t*30):0));
    ctx.drawImage(im,sx,sy,mt.fw,mt.fh,-b.w/2,-b.h,b.w,bh);
    if(b.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*k;ctx.drawImage(im,sx,sy,mt.fw,mt.fh,-b.w/2,-b.h,b.w,b.h);ctx.globalCompositeOperation='source-over'}
  }else{
    ctx.drawImage(im,-b.w/2,-b.h,b.w,b.h);
    if(b.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*k;ctx.drawImage(im,-b.w/2,-b.h,b.w,b.h);ctx.globalCompositeOperation='source-over'}
  }
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
  drawFx(T);drawSk();
  // overlays in screen space
  ctx.setTransform(DPR,0,0,DPR,0,0);const Z=S.zoom;
  // mob hp bars (hurt, L0/L1)
  if(S.opt.names&&S.q>=1){for(let i=0;i<mobs.length;i++){const m=mobs[i];if(!m.on||m.dead||m.hurt<=0||m.lod===2)continue;const x=m.x*Z,y=mtop(m)*Z-4,w=26,f=m.hp/m.maxhp;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-w/2-1,y-1,w+2,5);ctx.fillStyle=f>.5?'#4ee05a':f>.25?'#e7d13b':'#e04a3b';ctx.fillRect(x-w/2,y,w*Math.max(0,f),3)}}
  nameplates(Z);drawOverlaySk(Z);
  // damage numbers
  for(let i=0;i<NUMS.length;i++){const nm=NUMS[i];if(!nm.on)continue;const u=nm.t/nm.dur;const rise=30*(1-Math.pow(1-Math.min(1,u*2),3));
    drawNumber(ctx,nm.x*Z,nm.y*Z-rise,nm.txt,nm.col,nm.sc*(MOBILE?.9:1)*(nm.t<.12?1+(.12-nm.t)*3:1),clamp((1-u)*3,0,1))}
  ctx.globalAlpha=1;
  if(S.flash>0){ctx.fillStyle=`rgba(255,246,210,${Math.min(.55,S.flash*2.2)})`;ctx.fillRect(0,0,cv.width/DPR,cv.height/DPR)}
  if(boss&&boss.dead&&boss.dieT<.4){ctx.fillStyle=`rgba(255,255,255,${.7*(1-boss.dieT/.4)})`;ctx.fillRect(0,0,cv.width/DPR,cv.height/DPR)}
}
// ---------- skill effects (world space) ----------
function glowDot(x,y,r,c1,a){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;
  if(S.q>=2){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.3,c1);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  else{ctx.fillStyle=c1;ctx.beginPath();ctx.arc(x,y,r*.5,0,7);ctx.fill()}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
function hsh(a,b){let h=(a*2654435761+b*40503)>>>0;h^=h>>>13;h=Math.imul(h,1274126177)>>>0;return (h&1023)/1023}
function ringE(x,y,rx,ry,col,w,a){ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(0,0,rx,0,7);ctx.stroke();ctx.restore();ctx.globalAlpha=1}
function diamond(x,y,len,w,ang,fill,stroke){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(0,-w);ctx.lineTo(-len*.35,0);ctx.lineTo(0,w);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}ctx.restore()}
function burst(el,x,y,w,r){ // impact at t=w (0..1)
  const E=D.EL[el]||D.EL.phys,a=1-w,hi=S.q>=2;
  switch(el){
    case 'fire':glowDot(x,y,r*(.6+w*.9),E.c1,a);ringE(x,y,r*(.4+w),r*(.4+w)*.6,E.c2,3*a+1,a);if(hi)for(let i=0;i<6;i++){const an=i*1.05+.4,d=8+w*r;ctx.fillStyle=i%2?'#ffd24a':'#ff6a2a';ctx.globalAlpha=a;ctx.fillRect(x+Math.cos(an)*d,y+Math.sin(an)*d*.7-w*10,3,3)}ctx.globalAlpha=1;break;
    case 'ice':ringE(x,y,r*(.3+w*.9),r*(.3+w*.9)*.6,'#dff6ff',2.5,a);if(hi)for(let i=0;i<6;i++){const an=i*1.047,d=6+w*r*.9;diamond(x+Math.cos(an)*d,y+Math.sin(an)*d*.7-w*8,7*a+2,2.4,an,'#eaf9ff','#6ab8ee')}glowDot(x,y,r*.7,E.c1,a*.7);break;
    case 'bolt':ctx.globalAlpha=a;ctx.strokeStyle='#fff7a0';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<4;i++){const an=i*1.57+.78;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(an)*r*(.6+w),y+Math.sin(an)*r*(.6+w)*.7)}ctx.stroke();ctx.globalAlpha=1;glowDot(x,y,r*.8,E.c1,a);break;
    case 'holy':glowDot(x,y,r*1.1,'#fff2b0',a);ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<8;i++){const an=i*.785+w;ctx.moveTo(x+Math.cos(an)*6,y+Math.sin(an)*4);ctx.lineTo(x+Math.cos(an)*(r*(.5+w)),y+Math.sin(an)*r*(.5+w)*.7)}ctx.stroke();ctx.globalAlpha=1;break;
    default:glowDot(x,y,r*.8,E.c1,a);ringE(x,y,r*(.3+w),r*(.3+w)*.6,E.c2,2.5,a);
  }}
function drawBolt(s,u){
  const E=D.EL[s.el]||D.EL.phys,mt=s.hitAt;
  if(u>=mt){burst(s.el,s.tx,s.ty,(u-mt)/(1-mt),s.r);return}
  const v=u/mt,px=s.sx+(s.tx-s.sx)*v,py=s.sy+(s.ty-s.sy)*v-(s.el==='fire'?Math.sin(v*Math.PI)*10:0),ang=Math.atan2(s.ty-s.sy,s.tx-s.sx);
  switch(s.el){
    case 'bolt':{ctx.lineJoin='round';const seg=7,fr=Math.floor(S.t*30);for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?'#fffbd0':'rgba(255,220,60,.55)';ctx.lineWidth=pass?1.6:5;ctx.beginPath();ctx.moveTo(s.sx,s.sy);
      for(let i=1;i<=seg;i++){const f=i/seg,x=s.sx+(px-s.sx)*f,y=s.sy+(py-s.sy)*f,j=i===seg?0:(hsh(s.seed+fr,i)-.5)*16;ctx.lineTo(x-Math.sin(ang)*j,y+Math.cos(ang)*j)}ctx.stroke()}glowDot(px,py,12,E.c1,.9);break}
    case 'fire':{for(let k=5;k>=0;k--){const vv=Math.max(0,v-k*.05),x=s.sx+(s.tx-s.sx)*vv,y=s.sy+(s.ty-s.sy)*vv-Math.sin(vv*Math.PI)*10;ctx.globalAlpha=1-k*.15;ctx.fillStyle=k%2?E.c2:E.c1;ctx.beginPath();ctx.arc(x,y,6-k*.7,0,7);ctx.fill()}ctx.globalAlpha=1;glowDot(px,py,15,E.c1,.9);break}
    case 'ice':{for(let k=3;k>=1;k--){const vv=Math.max(0,v-k*.06);ctx.fillStyle='rgba(255,255,255,'+(.6-k*.15)+')';ctx.fillRect(s.sx+(s.tx-s.sx)*vv-1,s.sy+(s.ty-s.sy)*vv+Math.sin(k*3+S.t*20)*3-1,2.5,2.5)}diamond(px,py,13,4.5,ang,'#eafaff','#4aa8ee');glowDot(px,py,9,E.c1,.6);break}
    case 'wind':{ctx.strokeStyle=E.c1;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();const bx=px-Math.cos(ang)*22,by=py-Math.sin(ang)*22;ctx.moveTo(bx,by);ctx.quadraticCurveTo((bx+px)/2-Math.sin(ang)*6,(by+py)/2+Math.cos(ang)*6,px,py);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();break}
    case 'holy':case 'gold':case 'pink':case 'poison':case 'dark':case 'earth':{for(let k=3;k>=1;k--){const vv=Math.max(0,v-k*.07);glowDot(s.sx+(s.tx-s.sx)*vv,s.sy+(s.ty-s.sy)*vv,8-k*1.4,E.c1,.55)}glowDot(px,py,13,E.c1,.95);break}
    default:{ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(px-Math.cos(ang)*20,py-Math.sin(ang)*20);ctx.lineTo(px,py);ctx.stroke();ctx.strokeStyle=E.c1;ctx.lineWidth=1;ctx.stroke();if(v<.12)glowDot(s.sx,s.sy,12,'#ffe9a0',1-v*8)}
  }}
function drawNova(s,u){
  const E=D.EL[s.el]||D.EL.phys,r=s.r,e=1-Math.pow(1-Math.min(1,u*1.6),2),a=1-u*u,hi=S.q>=2;
  switch(s.el){
    case 'fire':{glowDot(s.x,s.y,r*(.4+.7*e),E.c1,a*.8);ringE(s.x,s.y,r*e,r*e*.6,E.c2,5*a+1,a);if(hi)for(let i=0;i<10;i++){const an=i*.628+s.seed,d=r*e*.95,fx=s.x+Math.cos(an)*d,fy=s.y+Math.sin(an)*d*.6,hh=(14+hsh(s.seed,i)*12)*a;ctx.fillStyle=i%2?'#ffd24a':'#ff5a2a';ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(fx-4,fy);ctx.lineTo(fx,fy-hh);ctx.lineTo(fx+4,fy);ctx.fill();ctx.globalAlpha=1}break}
    case 'ice':{ringE(s.x,s.y,r*e,r*e*.6,'#d6f3ff',3,a);glowDot(s.x,s.y,r*.8*e,E.c1,a*.5);if(hi)for(let i=0;i<10;i++){const an=i*.628+s.seed,d=r*e*.85,fx=s.x+Math.cos(an)*d,fy=s.y+Math.sin(an)*d*.6,hh=(10+hsh(s.seed,i)*16)*Math.min(1,u*5)*(1-Math.max(0,u-.6)*2.5);ctx.fillStyle='#eefaff';ctx.strokeStyle='#58b0ee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx-3.5,fy);ctx.lineTo(fx,fy-hh);ctx.lineTo(fx+3.5,fy);ctx.closePath();ctx.fill();ctx.stroke()}break}
    case 'holy':{glowDot(s.x,s.y,r*.9,'#fff2b0',a*.7);ringE(s.x,s.y,r*e,r*e*.6,'#ffe27a',3,a);ringE(s.x,s.y,r*e*.6,r*e*.36,'#fff',2,a);ctx.globalAlpha=a;ctx.strokeStyle='#fff7c0';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<8;i++){const an=i*.785+u*3,rr1=r*.2,rr2=r*(i%2?.5:.8)*e;ctx.moveTo(s.x+Math.cos(an)*rr1,s.y+Math.sin(an)*rr1*.6);ctx.lineTo(s.x+Math.cos(an)*rr2,s.y+Math.sin(an)*rr2*.6)}ctx.stroke();ctx.globalAlpha=1;break}
    case 'poison':{ringE(s.x,s.y,r*e,r*e*.6,E.c1,4,a);if(hi)for(let i=0;i<12;i++){const an=i*.52+s.seed,d=r*e*hsh(s.seed,i+3),bx=s.x+Math.cos(an)*d,by=s.y+Math.sin(an)*d*.6-u*30*(.5+hsh(s.seed,i)),br=3+hsh(s.seed,i+9)*3;ctx.globalAlpha=a*.85;ctx.fillStyle=i%2?'#9bff7a':'#5adf6a';ctx.beginPath();ctx.arc(bx,by,br,0,7);ctx.fill()}ctx.globalAlpha=1;break}
    case 'earth':{ringE(s.x,s.y,r*e,r*e*.6,'#a98a5a',4,a);if(hi)for(let i=0;i<9;i++){const an=i*.7+s.seed,d=r*e*.85,fx=s.x+Math.cos(an)*d,fy=s.y+Math.sin(an)*d*.6,hh=(8+hsh(s.seed,i)*12)*Math.sin(Math.min(1,u*1.6)*Math.PI);ctx.fillStyle=i%2?'#b79a6a':'#8b7048';ctx.beginPath();ctx.moveTo(fx-5,fy);ctx.lineTo(fx-1,fy-hh);ctx.lineTo(fx+5,fy);ctx.fill()}break}
    case 'dark':{glowDot(s.x,s.y,r*.8,'#6a3aa8',a*.6);ringE(s.x,s.y,r*e,r*e*.6,'#b080ff',3,a);ctx.globalAlpha=a;ctx.strokeStyle='#d0a8ff';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();for(let i=0;i<14;i++){const an=k*2.09+i*.3+u*5,d=i/14*r*e;ctx[i?'lineTo':'moveTo'](s.x+Math.cos(an)*d,s.y+Math.sin(an)*d*.6)}ctx.stroke()}ctx.globalAlpha=1;break}
    case 'wind':{ringE(s.x,s.y,r*e,r*e*.6,E.c1,2,a);ctx.globalAlpha=a;ctx.strokeStyle='#e8fff0';ctx.lineWidth=2.5;for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(s.x,s.y-k*5,r*e*(.5+k*.2),r*e*(.5+k*.2)*.6,0,u*8+k*2,u*8+k*2+3.8);ctx.stroke()}ctx.globalAlpha=1;break}
    case 'pink':{ringE(s.x,s.y,r*e,r*e*.6,E.c1,3,a);if(hi)for(let i=0;i<12;i++){const an=i*.52+s.seed+u*2,d=r*e*(.4+hsh(s.seed,i)*.6),px=s.x+Math.cos(an)*d,py=s.y+Math.sin(an)*d*.6-u*14;ctx.globalAlpha=a;ctx.fillStyle=i%2?'#ffc0e0':'#ff7ab8';ctx.save();ctx.translate(px,py);ctx.rotate(an);ctx.beginPath();ctx.ellipse(0,0,5,2.4,0,0,7);ctx.fill();ctx.restore()}ctx.globalAlpha=1;break}
    default:{ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=4*a+1;ctx.lineCap='round';for(let k=0;k<2;k++){ctx.beginPath();ctx.ellipse(s.x,s.y-8,r*e,r*e*.6,0,u*6+k*3.14,u*6+k*3.14+2.2);ctx.stroke()}ctx.globalAlpha=1;ringE(s.x,s.y,r*e,r*e*.6,E.c1,2,a*.7)}
  }}
function drawPillar(s,u){
  const E=D.EL[s.el]||D.EL.phys,wt=s.hitAt,r=s.r;
  if(u<wt){const v=u/wt;ringE(s.x,s.y,r*(1.3-.3*v),r*(1.3-.3*v)*.6,E.c1,2.5,.4+.5*v);ringE(s.x,s.y,r*.5,r*.3,E.c2,1.5,v);return}
  const w=(u-wt)/(1-wt),a=1-w*w,bw=r*.42*(1-w*.45);
  if(s.el==='bolt'){const fr=Math.floor(S.t*25);ctx.lineJoin='round';for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?'#fff':'rgba(255,225,70,.55)';ctx.lineWidth=pass?2.2:8*a+1;ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(s.x,s.y-250);for(let i=1;i<=9;i++){const f=i/9,j=i===9?0:(hsh(s.seed+fr,i)-.5)*34;ctx.lineTo(s.x+j,s.y-250+250*f)}ctx.stroke()}ctx.globalAlpha=1;glowDot(s.x,s.y,r*.9,E.c1,a);ringE(s.x,s.y,r*(.5+w*.6),r*(.5+w*.6)*.6,'#fff7a0',3,a);return}
  const top=s.y-240,g=ctx.createLinearGradient(0,top,0,s.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,E.c1);g.addColorStop(1,'#fff');
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.85;ctx.fillStyle=g;ctx.fillRect(s.x-bw,top,bw*2,s.y-top);ctx.globalAlpha=a*.5;ctx.fillRect(s.x-bw*.4,top,bw*.8,s.y-top);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ringE(s.x,s.y,r*(.55+w*.5),r*(.55+w*.5)*.6,E.c1,3,a);glowDot(s.x,s.y,r*.7,E.c1,a*.8);
  if(S.q>=2)for(let i=0;i<8;i++){const px=s.x+(hsh(s.seed,i)-.5)*bw*2,py=s.y-((w*90+i*17)%110);ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.fillRect(px,py,2,2)}ctx.globalAlpha=1}
function drawMeteor(s,u){
  const E=D.EL[s.el]||D.EL.fire,mt=s.hitAt,r=s.r;
  if(u<mt){const v=u/mt,px=s.x+90*(1-v),py=s.y-250*(1-v);ringE(s.x,s.y,r*.6,r*.36,E.c2,2,.25+.5*v);
    ctx.strokeStyle=E.c2;ctx.globalAlpha=.55;ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(px+36,py-80);ctx.lineTo(px,py);ctx.stroke();ctx.strokeStyle='#fff3c0';ctx.lineWidth=4;ctx.globalAlpha=.8;ctx.stroke();ctx.globalAlpha=1;
    glowDot(px,py,22,E.c1,.95);ctx.fillStyle='#fff6d0';ctx.beginPath();ctx.arc(px,py,6,0,7);ctx.fill();return}
  const w=(u-mt)/(1-mt),a=1-w;
  ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,.5);ctx.globalAlpha=.4*(1-w*.6);ctx.fillStyle='#2a1208';ctx.beginPath();ctx.arc(0,0,r*.7,0,7);ctx.fill();ctx.restore();ctx.globalAlpha=1;
  glowDot(s.x,s.y-6,r*(.7+w*.6),E.c1,a);ringE(s.x,s.y,r*(.3+w*.9),r*(.3+w*.9)*.6,E.c2,4*a+1,a);
  if(S.q>=2)for(let i=0;i<7;i++){const an=i*.9+s.seed,d=r*.8*w,fx=s.x+Math.cos(an)*d,fy=s.y+Math.sin(an)*d*.55-Math.sin(w*3.14)*16*(1+hsh(s.seed,i)),hh=(12+hsh(s.seed,i+4)*10)*(1-w);ctx.globalAlpha=a;ctx.fillStyle=i%2?'#ffd24a':'#ff6a2a';ctx.beginPath();ctx.moveTo(fx-3,fy+4);ctx.lineTo(fx,fy-hh);ctx.lineTo(fx+3,fy+4);ctx.fill()}
  ctx.globalAlpha=1}
function drawArrows(s,u){
  const E=D.EL[s.el]||D.EL.phys;ringE(s.x,s.y,s.r*.9,s.r*.55,E.c1,1.5,.35*(1-u));
  for(let i=0;i<10;i++){const ox=(hsh(s.seed,i)-.5)*2*s.r*.85,oy=(hsh(s.seed,i+20)-.5)*s.r*.7,l=(u-i*.045)/.3;if(l<0||l>1.6)continue;
    if(l<1){const x=s.x+ox,y=s.y+oy-(1-l)*170;ctx.strokeStyle='#f6ecc8';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-1.5,y-15);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=E.c1;ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x-2.5,y-4);ctx.lineTo(x+2.5,y-4);ctx.fill()}
    else{const w=l-1;ringE(s.x+ox,s.y+oy,3+w*9,2+w*5,'#fff',1.5,1-w/.6)}}}
function drawWave(s,u){
  const E=D.EL[s.el]||D.EL.phys,v=Math.min(1,u/.75),fade=1-Math.max(0,(u-.6)/.4),dir=s.att.face<0?-1:1,ang=s.ang;
  for(let k=0;k<3;k++){const d=s.L*v-k*13;if(d<0)continue;const px=s.x+Math.cos(ang)*d*dir,py=s.y+Math.sin(ang)*d;ctx.save();ctx.translate(px,py);ctx.scale(dir,1);ctx.rotate(ang*dir);ctx.globalAlpha=fade*(1-k*.32);ctx.lineCap='round';
    ctx.strokeStyle=E.c1;ctx.lineWidth=9-k*2.5;ctx.beginPath();ctx.arc(-22,0,30,-1.05,1.05);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3-k*.8;ctx.beginPath();ctx.arc(-22,0,30,-.9,.9);ctx.stroke();ctx.restore()}
  ctx.globalAlpha=1}
function drawChainFx(s,u){const E=D.EL[s.el]||D.EL.phys,fr=Math.floor(S.t*30),Pa=s.path;let px=s.sx,py=s.sy;ctx.lineJoin='round';
  for(let i=0;i<Math.min(Pa.length,s.hop);i++){const q=Pa[i];let qx=q.x,qy=q.y;if(q.m){qx=q.m.x;qy=q.m.y-16}
    const a=Math.max(0,1-(s.t-s.dly-i*.05)/.32);if(a<=0){px=qx;py=qy;continue}
    for(let pass=0;pass<2;pass++){ctx.globalAlpha=a*(pass?1:.6);ctx.strokeStyle=pass?'#fff':E.c1;ctx.lineWidth=pass?1.6:5;ctx.beginPath();ctx.moveTo(px,py);const ang=Math.atan2(qy-py,qx-px);
      for(let k=1;k<=4;k++){const f=k/4,j=k===4?0:(hsh(s.seed+fr,i*7+k)-.5)*14;ctx.lineTo(px+(qx-px)*f-Math.sin(ang)*j,py+(qy-py)*f+Math.cos(ang)*j)}ctx.stroke()}
    glowDot(qx,qy,14,E.c1,a*.9);px=qx;py=qy}
  ctx.globalAlpha=1}
function drawHealFx(s,u){
  const E=D.EL.heal||D.EL.holy,c=s.att,e=Math.min(1,u*1.5),a=1-u;
  ringE(c.x,c.y,s.r*e,s.r*e*.55,'#8dffa0',3,a);ringE(c.x,c.y,s.r*e*.6,s.r*e*.33,'#fff',1.5,a);glowDot(c.x,c.y-20,40,'#8dffa0',a*.35);
  if(S.q>=2)for(let i=0;i<8;i++){const an=i*.8+s.seed,d=s.r*.7*hsh(s.seed,i),px=c.x+Math.cos(an)*d,py=c.y+Math.sin(an)*d*.5-u*50-hsh(s.seed,i+7)*14;ctx.globalAlpha=a;ctx.fillStyle='#b8ffc8';ctx.fillRect(px-1,py-4,2,8);ctx.fillRect(px-4,py-1,8,2)}ctx.globalAlpha=1}
function drawBuffFx(s,u){
  const c=s.att,E=D.EL[s.el]||D.EL.holy;for(let k=0;k<3;k++){const l=(u+k*.18)%1;ringE(c.x,c.y-l*50,22+l*4,10,E.c1,2.5,(1-l)*.9)}
  if(S.q>=2)for(let i=0;i<4;i++){const px=c.x+(i-1.5)*9,py=c.y-10-((u*80+i*17)%64);ctx.globalAlpha=1-u;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(px,py-5);ctx.lineTo(px-3.5,py);ctx.lineTo(px+3.5,py);ctx.fill()}ctx.globalAlpha=1}
function drawSk(){
  for(let i=0;i<SKS.length;i++){const s=SKS[i];if(!s.on)continue;const u=(s.t-s.dly)/s.dur;if(u<0)continue;
    switch(s.k){case 'bolt':drawBolt(s,u);break;case 'nova':drawNova(s,u);break;case 'pillar':drawPillar(s,u);break;case 'meteor':drawMeteor(s,u);break;case 'arrows':drawArrows(s,u);break;case 'wave':drawWave(s,u);break;case 'chain':drawChainFx(s,u);break;case 'heal':drawHealFx(s,u);break;case 'buff':drawBuffFx(s,u);break}}
  // mob projectiles
  for(let i=0;i<MPROJ.length;i++){const p=MPROJ[i];if(!p.on)continue;glowDot(p.x,p.y,10,p.col,.9);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,7);ctx.fill()}}
function drawOverlaySk(Z){
  for(const o of CALL){if(!o.on)continue;const c=o.ch;if(!c||c.hp<=0)continue;const u=o.t/1.1,a=u<.15?u/.15:u>.7?(1-u)/.3:1,lb=labelBmp(o.txt+'！',o.col,c.self?13:11);ctx.globalAlpha=a;ctx.drawImage(lb.c,c.x*Z-lb.w/2,(c.y-CHAR_S*c.sh.ch*.95)*Z-lb.h-10-u*14,lb.w,lb.h);ctx.globalAlpha=1}
  for(const o of POP){if(!o.on)continue;const u=o.t/1.5,a=u<.1?u/.1:u>.65?(1-u)/.35:1,lb=labelBmp(o.txt,o.col,10);const x=o.x*Z,y=o.y*Z-22-u*26;ctx.globalAlpha=a;
    if(o.ic){ctx.drawImage(o.ic,x-lb.w/2-17,y-4,16,16);ctx.drawImage(lb.c,x-lb.w/2+2,y,lb.w,lb.h)}else ctx.drawImage(lb.c,x-lb.w/2,y,lb.w,lb.h);ctx.globalAlpha=1}}
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
  const b=S.boss;if(b&&!b.dead&&S.opt.names){const lb=labelBmp(b.def.n+' Lv.'+(60+D.mapById(S.mapId).tier*10),'#ff8a7a',12);ctx.drawImage(lb.c,b.x*Z-lb.w/2,(b.y-b.h)*Z-lb.h-4,lb.w,lb.h)}
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
   `<span class="chip">${D.mapById(S.mapId).n}（${ST.mode==='stage'?D.DIFFS[ST.d].n+'討伐':'練功'}）</span><br><span class="chip">本場擊殺 ${fmt(S.kills)}</span><br><span class="chip">擊殺/時 ${fmt(kph)} · EXP/時 ${fmt(eph)}</span><br><span class="chip">掛機時間 ${clock}</span><br>${ST.mode==='stage'?'':'<span class="chip">距離 BOSS '+Math.max(0,S.nextBossAt-S.kills)+' 殺</span>'}`;
  const rank=chars.slice(0,E.ch).slice().sort((a,b)=>b.dmgDone-a.dmgDone).slice(0,5);
  const bad=stats.fps<TARGET_FPS*.85;
  $('#hud-tr').innerHTML=`<span class="chip fps ${bad?'bad':''}">FPS ${stats.fps} · ${stats.p95.toFixed(1)}ms · ${QN[S.q]}${S.qMode==='auto'?'（自動）':'（鎖定）'}</span><br><span class="chip">同圖 ${E.ch}/${S.want.ch}　怪 ${aliveMobs()}/${S.want.mob}</span>`+
   (MOBILE?'':`<br><div class="rank">${rank.map((c,i)=>`<div><span>${i+1}. ${c.name}</span><b>${fmt(c.dmgDone)}</b></div>`).join('')}</div>`);
  $('#cap-note').innerHTML=`目前畫質 <b>${QN[S.q]}</b>${S.qMode==='auto'?'（自動）':'（手動鎖定）'}：實際顯示 角色 <b>${E.ch}</b>／怪物上限 <b>${E.mob}</b>${E.ch<S.want.ch||E.mob<S.want.mob?'（已因畫質降階縮減）':''}`;
  $('#v-ch').textContent=S.want.ch+' / '+CAP.ch;$('#v-mob').textContent=S.want.mob+' / '+CAP.mob;$('#v-gat').textContent=Math.round(S.want.gat*100)+'%';
  $('#b-boss').textContent=ST.mode==='stage'?'討伐中':S.boss&&!S.boss.dead?'BOSS 戰鬥中…':S.bossCool>0?`召喚 BOSS（冷卻 ${Math.ceil(S.bossCool)}s）`:'召喚 BOSS';
  $('#b-boss').disabled=!!(S.boss&&!S.boss.dead)||ST.mode==='stage';
  UI('hud');
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
  $('#b-boss').onclick=()=>{if(ST.mode==='stage')return;if(S.bossCool<=0||!S.boss)spawnBoss(false)};
  $('#b-pause').onclick=e=>{S.paused=!S.paused;e.target.textContent=S.paused?'繼續':'暫停';document.body.classList.toggle('paused',S.paused)};
  $('#b-reset').onclick=()=>{if(ST.mode==='stage'){retryStage();return}S.freshUntil=.3;S.kills=0;S.killHist.length=0;S.exp=0;S.t=0;S.nextBossAt=150;S.boss=null;$('#bossbar').classList.add('hidden');makeChars();assignAnchors();makeMobs();NUMS.forEach(n=>n.on=0);FX.forEach(n=>n.on=0);PROJ.forEach(n=>n.on=0);Log.reset();chars.forEach(c=>{c.x=c.ax+rr(-30,30);c.y=c.ay+rr(-30,30)})};
  const tog=(id,k)=>{const b=$(id);b.onclick=()=>{S.opt[k]=!S.opt[k];b.classList.toggle('on',S.opt[k])}};tog('#t-names','names');tog('#t-dmg','dmg');tog('#t-mini','mini');
  $('#b-ring').onclick=e=>{S.opt.ring=!S.opt.ring;e.target.classList.toggle('on',S.opt.ring)};$('#b-ring').classList.add('on');
  $('#s-q').onchange=e=>{const v=e.target.value;if(v==='auto'){S.qMode='auto';S.qSince=performance.now()}else{S.qMode='lock';setQ(+v)}};
  $('#z-in').onclick=()=>{S.zoomMul=clamp(S.zoomMul+.1,.6,1.8);layout()};$('#z-out').onclick=()=>{S.zoomMul=clamp(S.zoomMul-.1,.6,1.8);layout()};
  const setBig=v=>{document.body.classList.toggle('big',v);$('#t-big').textContent=v?'還原':'⛶ 放大';if(!v)document.body.classList.remove('showside');setTimeout(layout,30)};
  const isBig=()=>document.body.classList.contains('big');
  $('#t-big').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();setBig(!isBig())};$('#b-big').onclick=$('#t-big').onclick;
  $('#t-full').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen();return}setBig(true);const el=document.documentElement;if(el.requestFullscreen)el.requestFullscreen().catch(()=>{})};
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&isBig()&&S.fsAuto){setBig(false)}S.fsAuto=!!document.fullscreenElement;setTimeout(layout,60)});
  const thEl=$('#t-theme'),thSync=()=>{const x=document.documentElement.getAttribute('data-theme')==='xp';thEl.textContent='外觀：'+(x?'Windows XP':'舊版 RO')};thSync();
  thEl.onclick=()=>{const d=document.documentElement,n=d.getAttribute('data-theme')==='xp'?'ro':'xp';d.setAttribute('data-theme',n);try{localStorage.setItem('aur_theme',n)}catch(e){}thSync();setTimeout(layout,30)};
  $('#b-gear').onclick=$('#t-gear').onclick=()=>document.body.classList.toggle('showside');$('#b-closeside').onclick=()=>document.body.classList.remove('showside');
  document.querySelectorAll('#logwin [data-m]').forEach(b=>b.onclick=()=>Log.setMode(b.dataset.m));
  {const lb=$('#logbox'),lf=document.getElementById('lg-f');if(lf)lf.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;lf.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));lb.className=lb.className.replace(/\bf-\w+/g,'').trim();if(b.dataset.f!=='all')lb.classList.add('f-'+b.dataset.f);lb.scrollTop=lb.scrollHeight};
   const cl=document.getElementById('lg-clear');if(cl)cl.onclick=()=>Log.reset();
   const au=document.getElementById('lg-auto');if(au)au.onchange=()=>{Log.auto=au.checked};
   const fs=document.getElementById('lg-fs');if(fs)fs.onchange=()=>{lb.style.fontSize=fs.value+'px'}}
  const lw=$('#logwin');$('#log-exp').onclick=()=>{const v=!lw.classList.contains('big');lw.classList.toggle('big',v);lw.classList.remove('min');Log.setExpanded(v)};
  $('#log-min').onclick=()=>lw.classList.toggle('min');
  $('#logbox').addEventListener('click',()=>{if(MOBILE&&!lw.classList.contains('big'))$('#log-exp').onclick()});
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='f')$('#t-full').onclick();else if(e.key==='b')$('#b-boss').click();else if(e.key==='q'){drinkPotion()}else if(e.key==='Escape'&&isBig()&&!document.fullscreenElement)setBig(false)});
  new ResizeObserver(()=>layout()).observe($('#wrap'));addEventListener('resize',layout);
}
// ---------- init ----------
async function init(){
  if(qs.has('chars'))S.want.ch=clamp(+qs.get('chars'),1,CAP.ch);if(qs.has('mobs'))S.want.mob=clamp(+qs.get('mobs'),0,CAP.mob);if(qs.has('gather'))S.want.gat=clamp(+qs.get('gather'),0,1);
  if(qs.has('q')){S.qMode='lock';S.q=clamp(+qs.get('q'),0,3);$('#s-q').value=String(S.q)}
  if(qs.get('log'))Log.setMode(qs.get('log'));else Log.setMode(Log.mode);
  if(qs.get('zoom'))S.zoomMul=+qs.get('zoom');
  if(MOBILE)document.body.classList.add('mobile');
  const had=loadSave();if(!had)initKit();
  if(qs.get('map')&&D.mapById(qs.get('map')))ME.mapId=qs.get('map');if(qs.get('job')&&D.JOBS[qs.get('job')])ME.job=qs.get('job');if(qs.get('g'))ME.g=qs.get('g')==='m'?'m':'f';
  if(qs.get('job')&&!had&&D.JOBS[ME.job]){ME.equip.weapon=mkInst('wp_'+D.JOBS[ME.job].wk+'_0');ME.bag=ME.bag.filter(x=>!x.id.startsWith('wp_'));ME.bag.unshift(mkInst('wp_'+D.JOBS[ME.job].wk+'_2',2))}
  await load();ME.g=selfKey(ME.job,ME.g).slice(-1);S.mapId=ME.mapId;calcMe();buildGlyphs();makeChars();makeMobs();calcMe();bind();layout();await setMap(ME.mapId,true);
  S.freshUntil=.3;S.t=0;
  if(qs.has('big')){document.body.classList.add('big');$('#t-big').textContent='還原';layout()}
  if(qs.has('side'))document.body.classList.add('showside');
  // optional fast-forward for deterministic screenshots
  const ff=+(qs.get('ff')||0);if(ff>0){for(let i=0;i<ff*20;i++){update(.05)}}
  if(qs.get('stage')){const [sd,ss]=qs.get('stage').split(',').map(Number);ST.autoPerk=qs.has('autoperk');await stageStart(sd|0,ss|0)}
  if(qs.has('boss')&&ST.mode!=='stage')spawnBoss(false);
  if(qs.has('ffb')){const f=+qs.get('ffb');for(let i=0;i<f*20;i++)update(.05)}
  stats.work.length=0;S.qSince=performance.now();
  HD.core={S,ME,D,Art,Log,CAP,MOBILE,chars:()=>chars,mobs:()=>mobs,castSelf,setMap,setSelfJob,calcMe,equipItem,unequip,sellInst,sellCommon,save,expNext,jexpNext,spawnBoss,setQ,gearStats,addToBag,mkInst,layout,ST,CB,stageStart,retryStage,nextStage,setFree,pickPerk,drinkPotion,buyPotions,isUnlocked,upgradeSkill,skCost,SKMAX,slv,cdOf};
  UI('init',HD.core);hud();Log.render(true);
  window.__horde={ST,CB,stageStart,pickPerk,drinkPotion,upgradeSkill,S,ME,stats,chars:()=>chars,mobs:()=>mobs,setQ,spawnBoss,eff,CAP,MOBILE,update,draw,hud,Log,castSelf,setMap,setSelfJob};
  setInterval(save,15000);
  requestAnimationFrame(t=>{last=t;frame(t)});
}
init().catch(e=>{document.body.insertAdjacentHTML('beforeend','<pre style="position:fixed;top:0;left:0;background:#fff;color:#c00;z-index:9999;padding:8px">'+e.stack+'</pre>');console.error(e)});
})();
