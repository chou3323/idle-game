/* Aurevia Horde v2 client (local prototype). Full-screen docked layout, driven by the shared sim (engine.js + tables.js).
   No combo system. Kill progress bar only. AoE ground telegraph + job FX, crit tiers, aggro/taunt/mark visuals, DPS meter, equipment panel (A12.4). */
(()=>{'use strict';
const T=window.HD_T,Sim=window.HDSim,$=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const JOBS=T.jobs_skill.jobs,SK=T.skills.skills;
const TIERS=['normal','hard','nightmare','hell'],TIER_ZH={normal:'普通',hard:'困難',nightmare:'夢魘',hell:'地獄'};
const TEAMS={full4:['標準 4 人（坦＋補＋2 輸出）','lnc,acl,kni,arc'],full6:['6 人（含輔助）','lnc,acl,brd,rgr,mnk,gun'],full10:['10 人滿編','lnc,acl,acl,brd,dnc,kni,arc,rgr,mnk,thf'],noHealer4:['無補師 4 人','lnc,kni,arc,rgr'],noTank4:['無坦克 4 人','acl,kni,arc,rgr'],full15:['15 人滿編','lnc,lnc,acl,acl,acl,brd,dnc,kni,arc,rgr,mnk,thf,gun,msw,nin'],solo:['單人','kni'],ai2:['2 真人＋2 AI 補位(40%)','kni,arc,lnc*,acl*']};
const REGION_ZH=T.regions.rows.map(r=>r.name);
// ---- job -> sprite sheet fallback (jobs without a sheet yet), job FX palette
const SHEET_FB={smg:'mnk',nin:'hsn',thf:'hsn',msw:'arc',brd:'brd',dnc:'dnc'};
const FX={lnc:{c:'#ffd45a',t:'spears'},mer:{c:'#ff9a3c',t:'gears'},kni:{c:'#ffe28a',t:'shock'},mnk:{c:'#ff5a4a',t:'spirit'},smg:{c:'#7be05a',t:'cloud'},gun:{c:'#ffe85a',t:'bullets'},nin:{c:'#b078ff',t:'shuriken'},hsn:{c:'#8a5acb',t:'slash'},arc:{c:'#6ab0ff',t:'rune'},thf:{c:'#ff6a7a',t:'cross'},rgr:{c:'#8de05a',t:'arrows'},msw:{c:'#ff7a2a',t:'flame'},acl:{c:'#fff2b0',t:'pillar'},brd:{c:'#ff8ad0',t:'notes'},dnc:{c:'#ff5ac8',t:'ribbon'}};
const JOB_ROLE_ZH={tank:'坦克',subtank:'副坦',healer:'補師',support:'輔助',bruiser:'鬥士',std:'輸出',glass:'玻璃砲'};
const SLOT_ZH={wpn:'武器',off:'副手',head:'頭部',body:'身體',cape:'披風',boots:'鞋子',acc1:'飾品 I',acc2:'飾品 II'};
const SLOT_IC=Object.fromEntries(Object.entries({wpn:'w_sword',off:'a_shield',head:'a_hat',body:'a_armor',cape:'a_cloak',boots:'a_boots',acc1:'a_ring',acc2:'a_glass'}).map(([k,v])=>[k,`<img class="eqi" src="v2/ic/eq/${v}.webp" alt="">`]));
const QCOL={SR:'#6aa8ff',SSR:'#c07aff',UR:'#ffb43a'};
const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':''+Math.round(n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cv=$('cv'),ctx=cv.getContext('2d');let DPR=1,VW=0,VH=0;const VWIN=()=>window.innerWidth;
const C={region:+qs.get('region')||1,tier:TIERS.includes(qs.get('tier'))?qs.get('tier'):'normal',team:TEAMS[qs.get('team')]?qs.get('team'):'full4',seed:+qs.get('seed')||7,speed:1,startStage:+qs.get('stage')||1,paused:false,dmgMode:'dmg',sel:0,vfx:['auto','mine','party','all'].includes(qs.get('vfx'))?qs.get('vfx'):(localStorage.getItem('hd.vfx')||'auto'),qmode:qs.get('q')||(localStorage.getItem('hd.q')||'auto')};
let bossStart=0,dropPrev={t:0};let room=null,fx=[],nums=[],corpses=[],marks=[],hurtFlash={},banner={t:0,txt:''},acc=0,tNow=0,lastTs=0,prev=new Map(),anim=new Map(),batchDelay=0,eqSel='wpn',killMsg=null;
const imgs={sheets:null,chars:{},mobs:null,mobImg:{}};

// ================= assets
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function loadAssets(){imgs.sheets=await (await fetch('assets/chars/sheets.json')).json();imgs.mobs=await (await fetch('assets/mobs2/manifest.json')).json();
 const need=new Set(Object.keys(JOBS).map(j=>sheetKey(j,'m')));await Promise.all([...need].map(async k=>{if(imgs.sheets[k])imgs.chars[k]=await loadImg('assets/chars/'+imgs.sheets[k].file)}));
 await Promise.all(Object.keys(imgs.mobs.mobs).map(async id=>{imgs.mobImg[id]=await loadImg('assets/mobs2/'+id+'.png')}))}
function sheetKey(job,g){const j=SHEET_FB[job]&&!imgs.sheets?.['ch_'+job+'_m']&&!imgs.sheets?.['ch_'+job+'_f']?SHEET_FB[job]:job;const k='ch_'+j+'_'+g;if(imgs.sheets[k])return k;const k2='ch_'+j+'_'+(g==='m'?'f':'m');return imgs.sheets[k2]?k2:'ch_arc_f'}
const roster=rg=>{const o={reg:[],elite:[],boss:[]};for(const [id,m] of Object.entries(imgs.mobs.mobs))if(m.rg===rg)o[m.tier].push(id);return o};

// ================= room
function parseTeam(key){return TEAMS[key][1].split(',').map((s,i)=>{const ai=s.endsWith('*');const job=s.replace('*','');return{job,ai,name:(['你','阿','小','大','莉','凱','諾','米','朵','布','晴','嵐','夏','雪','風'][i]||'隊')+(JOBS[job].name.slice(0,2)),perfect:false}})}
function newRoom(){fx=[];nums=[];corpses=[];marks=[];prev.clear();anim.clear();hurtFlash={};acc=0;
 room=Sim.create({tables:T,region:C.region,tier:C.tier,seed:C.seed,team:parseTeam(C.team),events:true,dt:.1,startStage:C.startStage});C.sel=clamp(C.sel,0,room.players.length-1);
 room.roster=roster(C.region);EQ.clear();$('overlay').hidden=true;camX=room.arena[0]/2;camY=room.arena[1]/2;buildParty();buildSkills();buildEquip();snapPrev();updVfxNote()}
function snapPrev(){for(const p of room.players)prev.set('p'+p.id,{x:p.x,y:p.y});for(const m of room.mobs)prev.set('m'+m.id,{x:m.x,y:m.y})}
function stepSim(){snapPrev();room.ev.length=0;room.step();handleEvents(room.ev)}

// ================= events -> fx
const A=(id)=>anim.get(id)||(anim.set(id,{st:'idle',t:0,until:0,face:1,lastX:0}),anim.get(id));
function setAnim(id,st,dur){const a=A(id);a.st=st;a.t=tNow;a.until=tNow+dur}
function handleEvents(evs){
 let hasAoe=false;for(const e of evs)if(e.k==='cast'&&e.r>0&&e.shape&&!/heal|taunt/i.test(e.shape))hasAoe=true;
 const delay=hasAoe?.3:0;
 for(const e of evs){switch(e.k){
  case 'cast':{const p=room.players[e.p];const sk=SK[e.s];if(!p)break;setAnim('p'+p.id,sk&&(sk.type==='atk')?'attack':'chant',.45);
   const f=FX[p.job]||FX.kni;
   if(e.shape==='partyHeal'){fxPush({t:'heal',o:p.id,kd:'sup',x:e.x,y:e.y,r:e.r,t0:tNow,dur:.9,c:'#7dffa8'});floatText(e.x,e.y-1.5,sk?sk.name:'治療','#7dffa8',1.1,p.id,'sup')}
   else if(e.shape==='tauntGroup'){fxPush({t:'taunt',o:p.id,kd:'sup',x:e.x,y:e.y,r:e.r,t0:tNow,dur:.8,c:'#ffb040'});floatText(e.x,e.y-1.8,'挑釁！','#ffb040',1.4,p.id,'sup')}
   else if(e.shape==='taunt'){fxPush({t:'taunt',o:p.id,kd:'sup',x:e.x,y:e.y,r:2,t0:tNow,dur:.8,c:'#ffb040'});floatText(e.x,e.y-2.4,'挑釁！','#ffb040',1.3,p.id,'sup')}
   else if(e.r>0){fxPush({t:'tele',o:p.id,x:e.x,y:e.y,r:e.r,t0:tNow,dur:.55,c:f.c,ult:e.ult});fxPush({t:'job',o:p.id,job:p.job,fx:f,x:e.x,y:e.y,r:e.r,t0:tNow+.25,dur:e.ult?1.1:.7,ult:!!e.ult,name:sk?sk.name:''});if(e.ult&&vfxA(p.id)>=1){banner.t=tNow+1.4;banner.txt=(sk?sk.name:'大招')+'！';ultFlash=tNow+.4}}
   else{fxPush({t:'hitspark',o:p.id,x:e.x,y:e.y,t0:tNow+.05,dur:.3,c:f.c})}
   break}
  case 'hit':{const big=e.c||0;if(!big&&e.p!==C.sel&&Math.random()>.18){const m0=room.mobs.find(q=>q.id===e.m);if(m0)hurtFlash['m'+m0.id]=tNow+.14;break}nums.push({x:e.x+(Math.random()-.5)*.8,y:e.y-1.4,v:e.v,c:big,t0:tNow+(e.kind==='aoe'?delay:0),p:e.p,vy:big?2.2:1.6});const m=room.mobs.find(q=>q.id===e.m);if(m)hurtFlash['m'+m.id]=tNow+.14;if(m&&(m.type!=='norm'||Math.random()<.35))setAnim('m'+m.id,'hurt',.18);break}
  case 'mhit':setAnim('m'+e.id,'atk',.4);break;
  case 'die':corpses.push({x:e.x,y:e.y,id:e.id,type:e.t,t0:tNow,face:A('m'+e.id).face,variant:mobVariant(e.id,e.t)});if(e.t!=='norm'){fxPush({t:'burst',x:e.x,y:e.y,r:e.t==='boss'?7:3.5,t0:tNow,dur:.8,c:'#ffe8a0'})}anim.delete('m'+e.id);prev.delete('m'+e.id);break;
  case 'hurt':{hurtFlash['p'+e.p]=tNow+.15;setAnim('p'+e.p,'hit',.25);if(e.v>0)nums.push({x:e.x,y:e.y-1.9,v:e.v,c:-1,t0:tNow,p:e.p,vy:1.4});break}
  case 'heal':nums.push({x:e.x,y:e.y-1.9,v:e.v,c:-2,t0:tNow,p:e.p,vy:1.3});break;
  case 'down':setAnim('p'+e.p,'down',99);floatText(e.x,e.y-2.4,'倒地',  '#ff6a6a',1.4);break;
  case 'revive':setAnim('p'+e.p,'idle',0);fxPush({t:'heal',x:e.x,y:e.y,r:2.5,t0:tNow,dur:1,c:'#fff2b0'});floatText(e.x,e.y-2.4,'復活','#fff2b0',1.4);break;
  case 'mark':{marks.push({p:e.p,until:tNow+3.2});sigBanner('目標轉火：'+room.players[e.p].name,1.6,'sig');break}
  case 'tele':{if(e.t&&e.t.move){const nm=SIG_ZH[e.t.move]||e.t.move;sigBanner('BOSS施放招牌技「'+nm+'」',Math.max(1.6,e.t.dur||1.6),'sig');bossFx.sig=tNow+(e.t.dur||1.5);bossFx.sigM=e.t.move}break}
  case 'move':fxPush({t:'bossmove',x:e.x,y:e.y,m:e.m,t0:tNow,dur:.9});ultFlash=Math.max(ultFlash,tNow+.18);break;
  case 'stage':if(room.isBoss){sigBanner('⚔ 區域王降臨 ⚔',2.4,'intro');dropPrev.t=tNow+5}else sigBanner(room.isElite?'精英隊長關':'第 '+e.i+' 關',1.6,'');bossStart=room.t;break;
  case 'clear':banner.t=tNow+1.3;banner.txt='關卡完成';break;
  case 'end':showEnd(e.r);break;
 }}}
let ultFlash=0;
const SIG_ZH={heavy:'毀滅重擊',mark:'死亡宣告',pulse:'震地爆發',sweep:'橫掃千軍',summon:'眷屬召喚'};
const bossFx={aura:0,sig:0,sigM:null};
function sigBanner(txt,dur,cls){banner.t=tNow+dur;banner.txt=txt;banner.cls=cls||''}
function fxPush(f){if(fx.length>=(LOWQ()?90:180))fx.splice(0,fx.length-(LOWQ()?89:179));fx.push(f)}
function LOWQ(){return VW<900}

const FLOAT=[];function floatText(x,y,txt,c,s,o,kd){nums.push({x,y,txt,c:-3,col:typeof c==='string'?c:'#fff',t0:tNow,vy:1,size:s||1,p:o,kd})}
// ---- skill-effect display filter: auto | mine | party | all. auto: <=5 players -> all, else party. Low quality forces mine.
// party = mine + selected member + everyone's heals/taunts; other players' FX dimmed, their damage numbers hidden. Owner undefined (boss/system) always visible.
function icoShield(x,y,r,c){ctx.save();ctx.translate(x,y);ctx.fillStyle=c||'#5aa8ff';ctx.strokeStyle='#0b1a33';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.85,-r*.6);ctx.quadraticCurveTo(r*.8,r*.5,0,r);ctx.quadraticCurveTo(-r*.8,r*.5,-r*.85,-r*.6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-r*.12,-r*.6,r*.24,r*1.2);ctx.restore()}
function icoSkull(x,y,r,c){ctx.save();ctx.translate(x,y);ctx.fillStyle=c||'#f2f2f2';ctx.strokeStyle='#300';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-r*.15,r*.75,Math.PI*.95,Math.PI*.05);ctx.lineTo(r*.45,r*.7);ctx.lineTo(-r*.45,r*.7);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#300';ctx.beginPath();ctx.arc(-r*.3,-r*.1,r*.2,0,7);ctx.arc(r*.3,-r*.1,r*.2,0,7);ctx.fill();ctx.restore()}
function icoBang(x,y,r,c){ctx.save();ctx.translate(x,y);ctx.fillStyle=c||'#ff4a3a';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,r*.8);ctx.lineTo(-r,r*.8);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font=`900 ${r*1.2|0}px sans-serif`;ctx.textAlign='center';ctx.fillText('!',0,r*.65);ctx.restore()}
function playerLv(p){return 10*C.region+5+((p.id*7)%9)*3}
const VFX_ZH={auto:'自動',mine:'只看自己',party:'自己＋隊伍支援／選定隊員',all:'全部'};
function vfxMode(){if(C.vfx!=='auto')return C.vfx;return room&&room.players.length<=5?'all':'party'}
function vfxA(o,kd,num){if(o==null||o===0)return 1;const m=vfxMode();if(m==='all')return 1;if(m==='party'&&(o===C.sel||kd==='sup'))return 1;return num?0:(m==='party'?.22:0)}
let lowQ=false,fpsAvg=60;
function updVfxNote(){const el=$('vfxNote');if(el)el.textContent='特效：'+VFX_ZH[vfxMode()]+(lowQ?'（低畫質）':C.vfx==='auto'?'（自動）':'')}
function mobVariant(id,type){const r=room.roster;const l=type==='boss'?r.boss:type==='elite'?r.elite:r.reg;return l.length?l[Math.abs(id*2654435761|0)%l.length]:null}
function showEnd(r){const o=$('overlay');o.hidden=false;const win=r==='win'||r==='clear'||r==='victory';o.innerHTML=`<div>${win?'🏆 區域通關':r==='wipe'?'💀 全隊倒下':'⏱ 結束 ('+r+')'}</div><div style="font-size:14px;color:#8d99b8">用時 ${room.t.toFixed(0)} 秒 · 擊殺 ${room.stats.kills} · 倒地 ${room.players.reduce((a,p)=>a+p.deaths,0)} 次</div><button id="btnAgain">再來一次</button>`;$('btnAgain').onclick=()=>{C.seed++;newRoom()}}

// ================= drawing
let PPU=24,OX=0,OY=0;
function resize(){DPR=Math.min(VWIN()<760?1.5:2,window.devicePixelRatio||1);const r=cv.getBoundingClientRect();VW=r.width;VH=r.height;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);fitCam()}
let camX=24,camY=16;const VIEW_W=+qs.get('view')||30;
function fitCam(){const a=room?room.arena:[48,32];PPU=Math.max(VW/VIEW_W,VW/a[0],VH/a[1]);if(VH>VW*1.2)PPU=Math.max(VW/a[0],VH/a[1]*(+qs.get('mz')||.78));camTo(1)}
function camTo(k){if(!room)return;const a=room.arena;let sx=0,sy=0,n=0;for(const p of room.players){if(p.down>0||p.soul>0)continue;sx+=p.x;sy+=p.y;n++}if(n){sx/=n;sy/=n}else{sx=a[0]/2;sy=a[1]/2}const bb=room.boss&&!room.boss.dead?room.boss:null;if(bb&&n){sx=sx*.6+bb.x*.4;sy=sy*.55+bb.y*.45}
 const hw=VW/PPU/2,hh=VH/PPU/2;sx=clamp(sx,hw,a[0]-hw);sy=hh*2>=a[1]?clamp(sy,a[1]*.35,a[1]*.65):clamp(sy,hh,a[1]-hh);camX+=(sx-camX)*k;camY+=(sy-camY)*k;OX=VW/2-camX*PPU;OY=VH/2-camY*PPU}
const S2=(x,y)=>[OX+x*PPU,OY+y*PPU];
// ---- ground per region (procedural placeholder, no copied art)
const GP=[['#6aa04a','#86bf5e','#4d8a3a'],['#4f7a5a','#6fa07a','#3a5f48'],['#3f7a46','#5a9a5e','#2f6038'],['#cfe4ee','#e8f6ff','#a9c8da'],['#d9bd78','#ecd596','#b89a58'],['#2c4a38','#3c6a4c','#20382a'],['#bb7b4e','#d69a68','#9a5f38'],['#8c8470','#a8a088','#6c6454'],['#b6d4e6','#d8eefa','#8eb2c8'],['#6a3a2c','#8c4e38','#4c2a22'],['#5a5658','#74707a','#403c42'],['#3a3466','#564a90','#2a2450'],['#566a8a','#7088b0','#3e4e6c'],['#26223e','#3a3260','#181428']];
const groundCache={};
function ground(rg){if(groundCache[rg])return groundCache[rg];const a=room.arena,S=32,c=document.createElement('canvas');c.width=a[0]*S;c.height=a[1]*S;const x=c.getContext('2d');const p=GP[(rg-1)%GP.length];x.fillStyle=p[0];x.fillRect(0,0,c.width,c.height);
 let s=rg*7919;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 for(let i=0;i<260;i++){x.fillStyle=rnd()<.5?p[1]:p[2];x.globalAlpha=.16;const r=20+rnd()*60;x.beginPath();x.ellipse(rnd()*c.width,rnd()*c.height,r,r*.55,0,0,7);x.fill()}
 x.globalAlpha=.5;for(let i=0;i<2600;i++){x.fillStyle=rnd()<.5?p[1]:p[2];x.fillRect((rnd()*c.width)|0,(rnd()*c.height)|0,2,3)}
 x.globalAlpha=.18;x.strokeStyle='#000';x.lineWidth=1;for(let i=0;i<=a[0];i+=4){x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,c.height);x.stroke()}for(let j=0;j<=a[1];j+=4){x.beginPath();x.moveTo(0,j*S);x.lineTo(c.width,j*S);x.stroke()}
 x.globalAlpha=1;// edge vignette
 const g=x.createRadialGradient(c.width/2,c.height/2,c.height*.3,c.width/2,c.height/2,c.width*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);return groundCache[rg]=c}
function pos(kind,e,k){const p=prev.get(kind+e.id);if(!p)return[e.x,e.y];return[p.x+(e.x-p.x)*k,p.y+(e.y-p.y)*k]}
function drawChar(p,k){const key=sheetKey(p.job,'m');const sh=imgs.sheets[key],im=imgs.chars[key];if(!sh||!im)return;
 const a=A('p'+p.id);const [x,y]=pos('p',p,k);const [sx0,sy0]=S2(x,y);
 let st=a.st,over=tNow>a.until;if(over&&st!=='down'&&st!=='idle')st='idle';
 if(p.down>0)st='down';else if(st==='down'&&p.down<=0)st='idle';
 const moved=Math.hypot(x-(a.lastX||x),y-(a.lastY||y))>.01;a.lastX=x;a.lastY=y;
 let ad;if(st==='attack')ad=sh.attack;else if(st==='chant')ad=sh.act.release||sh.act.chant;else if(st==='hit')ad=sh.act.hit;else if(st==='down')ad=sh.act.down;else if(moved||st==='walk')ad=sh.act.walk;else ad=sh.act.idle;
 if(!ad)ad=sh.act.idle;const nf=ad.n;let fi=Math.floor((tNow-(st==='idle'||st==='walk'?0:a.t))*ad.fps)%nf;if(st==='down')fi=Math.min(nf-1,Math.floor((tNow-a.t)*ad.fps));
 // face nearest mob
 let nm=null,nd=1e9;for(const m of room.mobs){if(m.dead)continue;const d=(m.x-p.x)**2+(m.y-p.y)**2;if(d<nd){nd=d;nm=m}}if(nm&&p.down<=0){const dx=nm.x-p.x;if(Math.abs(dx)>.3)a.face=dx>0?1:-1}
 const H=3.1*PPU,sc=H/sh.ch,dw=sh.cw*sc,dh=sh.ch*sc;
 ctx.save();ctx.translate(sx0,sy0);
 ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(0,0,dw*.26,dw*.09,0,0,7);ctx.fill();
 if(p.soul>0)ctx.globalAlpha=.45;
 // selected ring
 if(p.id===C.sel){ctx.strokeStyle='#7ad0ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,dw*.3,dw*.11,0,0,7);ctx.stroke()}
 ctx.scale(a.face*(sh.flipX?-1:1),1);const sx=Math.round((ad.s+fi)*sh.cw);
 ctx.drawImage(im,sx,0,Math.round(sh.cw),Math.round(sh.ch),-dw/2,-sh.base*sc,dw,dh);
 if(hurtFlash['p'+p.id]>tNow){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5;ctx.drawImage(im,sx,0,Math.round(sh.cw),Math.round(sh.ch),-dw/2,-sh.base*sc,dw,dh)}
 ctx.restore();
 // overhead: name + hp
 const bw=PPU*1.9,bx=sx0-bw/2,by=sy0-H*.98;
 ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(bx-1,by-1,bw+2,6);const f=clamp(p.hp/p.maxhp,0,1);ctx.fillStyle=f>.5?'#46d36a':f>.25?'#e0a030':'#ff5b5b';ctx.fillRect(bx,by,bw*f,4);
 if(p.shield>0){ctx.fillStyle='#8ad8ff';ctx.fillRect(bx,by-2,bw*clamp(p.shield/p.maxhp,0,1),2)}
 ctx.font=`600 ${Math.max(10,PPU*.46)|0}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;const lbl='Lv.'+playerLv(p)+' '+p.name;ctx.strokeText(lbl,sx0,by-4);ctx.fillStyle=p.id===C.sel?'#ffe680':'#fff';ctx.fillText(lbl,sx0,by-4);
 if(p.down>0)icoSkull(sx0,sy0-H*.55,PPU*.5)
 const mk=marks.find(m=>m.p===p.id&&m.until>tNow);if(mk){const bob=Math.sin(tNow*8)*3;icoBang(sx0,by-PPU*1.2+bob,PPU*.5);ctx.strokeStyle='#ff4040';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx0,sy0,PPU*1.4,PPU*.5,0,0,7);ctx.stroke()}
 if(room.boss&&!room.boss.dead&&room.boss.taunt&&room.boss.taunt.by===p.id)icoShield(sx0+bw/2+PPU*.35,by-PPU*.1,PPU*.32,'#ffb040')
 return}
function drawMob(m,k){const id=mobVariant(m.id,m.type);if(!id)return;const man=imgs.mobs.mobs[id],im=imgs.mobImg[id];if(!man||!im)return;
 const a=A('m'+m.id);const [x,y]=pos('m',m,k);const [sx0,sy0]=S2(x,y);const moved=Math.hypot(x-(a.lastX||x),y-(a.lastY||y))>.004;a.lastX=x;a.lastY=y;
 let st=tNow<a.until?a.st:(moved?'walk':'idle');let row=man.rows[st==='atk'?'atk':st==='hurt'?'hurt':st==='walk'?'walk':'idle'];if(st==='atk'&&m.type==='boss'&&m.windup>0&&man.rows.charge)row=man.rows.charge;if(!row)row=man.rows.idle;
 let fi;if(st==='atk'||st==='hurt')fi=Math.min(row.n-1,Math.floor((tNow-a.t)*row.fps));else fi=Math.floor(tNow*row.fps+m.id)%row.n;
 const t=room.tele.length&&m.type==='boss'&&m.windup>0;if(t&&man.rows.charge){row=man.rows.charge;fi=Math.floor(tNow*row.fps)%row.n}
 const tg=m.tgt&&!m.tgt.dead?m.tgt:null;if(tg){const dx=tg.x-m.x;if(Math.abs(dx)>.25)a.face=dx>0?1:-1}
 const cell=(m.type==='boss'?13:m.type==='elite'?5.2:3.2)*PPU,fw=man.fw;
 if(m.type==='boss')drawBossAura(sx0,sy0,cell);
 ctx.save();ctx.translate(sx0,sy0);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,-cell*.01,cell*.25,cell*.07,0,0,7);ctx.fill();
 ctx.imageSmoothingEnabled=false;ctx.scale(a.face,1);const sy=row.r*fw;
 ctx.drawImage(im,fi*fw,sy,fw,fw,-cell/2,-cell*(fw-3)/fw,cell,cell);
 if(hurtFlash['m'+m.id]>tNow){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;ctx.drawImage(im,fi*fw,sy,fw,fw,-cell/2,-cell*(fw-3)/fw,cell,cell)}
 ctx.restore();ctx.imageSmoothingEnabled=true;
 if(m.type!=='norm'||m.hp<m.maxhp){const bw=(m.type==='boss'?5:m.type==='elite'?2.8:1.4)*PPU,by=sy0-cell*(m.type==='norm'?.62:.8);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(sx0-bw/2,by,bw,m.type==='norm'?3:5);if(m.type==='boss'){ctx.font=`800 ${Math.max(12,PPU*.6)|0}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';const nm='【區域王】'+(roster1(room)||'');ctx.strokeText(nm,sx0,by-6);ctx.fillStyle='#c9a2ff';ctx.fillText(nm,sx0,by-6)}ctx.fillStyle=m.type==='norm'?'#e05050':'#ff7a3a';ctx.fillRect(sx0-bw/2,by,bw*clamp(m.hp/m.maxhp,0,1),m.type==='norm'?3:5)}
 if(m.taunt&&m.taunt.until>room.t){if(m.type==='norm'){ctx.strokeStyle='rgba(255,170,60,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx0,sy0,PPU*.7,PPU*.25,0,0,7);ctx.stroke()}else icoShield(sx0,sy0-cell*.92,PPU*.4,'#ffb040')}
 if(m.type==='elite'&&(m.onlyLow||m.onlyHealer))icoBang(sx0+PPU*1.1,sy0-cell*.8,PPU*.35,m.onlyHealer?'#3ad07a':'#ff4a3a')
 if(m.type!=='norm'&&tg){ctx.strokeStyle='rgba(255,90,70,.55)';ctx.setLineDash([4,5]);ctx.lineWidth=1.5;const[tx,ty]=S2(tg.x,tg.y);ctx.beginPath();ctx.moveTo(sx0,sy0-cell*.2);ctx.lineTo(tx,ty-PPU*1.2);ctx.stroke();ctx.setLineDash([])}}
function drawBossAura(x,y,cell){const sig=bossFx.sig>tNow,k=sig?1.6:1;ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';
 const R=cell*.42;ctx.globalAlpha=.28*k;ctx.fillStyle='#3a8cff';ctx.beginPath();ctx.ellipse(0,0,R,R*.32,0,0,7);ctx.fill();
 const n=LOWQ()?14:24;for(let i=0;i<n;i++){const ph=(tNow*(.7+(i%5)*.12)+i*.37)%1,a=i*2.399;const px=Math.cos(a)*R*.8*(.4+((i*13)%7)/10),py=-ph*cell*.7*k;const w=cell*.035*(1-ph)*(1+(i%3)*.4)*k;
  ctx.globalAlpha=(1-ph)*.75;ctx.fillStyle=i%3?'#58b4ff':'#c8ecff';ctx.beginPath();ctx.moveTo(px-w,py);ctx.quadraticCurveTo(px,py-w*5,px+w,py);ctx.quadraticCurveTo(px,py+w,px-w,py);ctx.fill()}
 if(sig){const u=(bossFx.sig-tNow);ctx.globalAlpha=.35+.25*Math.sin(tNow*18);ctx.strokeStyle='#9fe0ff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,R*1.25,R*.42,0,0,7);ctx.stroke()}
 ctx.restore()}
function drawCorpse(c){const a=(tNow-c.t0)/.7;if(a>1)return false;const id=c.variant;if(!id)return false;const man=imgs.mobs.mobs[id],im=imgs.mobImg[id];if(!man||!im)return false;const row=man.rows.die;const fw=man.fw;const fi=Math.min(row.n-1,Math.floor((tNow-c.t0)*row.fps));const cell=(c.type==='boss'?13:c.type==='elite'?4.8:3.2)*PPU;const[sx,sy]=S2(c.x,c.y);
 ctx.save();ctx.translate(sx,sy);ctx.globalAlpha=1-Math.max(0,(a-.5)*2);ctx.scale(c.face||1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,fi*fw,row.r*fw,fw,fw,-cell/2,-cell*(fw-3)/fw,cell,cell);ctx.restore();ctx.imageSmoothingEnabled=true;return true}
// ---- effects
let DIM=1;
function drawFx(f){const u=(tNow-f.t0)/f.dur;if(u<0)return true;if(u>1)return false;DIM=vfxA(f.o,f.kd);if(DIM<=0)return true;const[sx,sy]=S2(f.x,f.y);const R=(f.r||2)*PPU,Ry=R*.6;
 ctx.save();ctx.translate(sx,sy);
 if(f.t==='tele'){ctx.globalAlpha=DIM*.25+.35*Math.sin(u*Math.PI);ctx.fillStyle=f.c;ctx.beginPath();ctx.ellipse(0,0,R,Ry,0,0,7);ctx.fill();ctx.globalAlpha=DIM;ctx.strokeStyle='#fff';ctx.lineWidth=4.5;ctx.beginPath();ctx.ellipse(0,0,R,Ry,0,0,7);ctx.stroke();ctx.strokeStyle=f.c;ctx.lineWidth=3;ctx.setLineDash([10,6]);ctx.lineDashOffset=-tNow*40;ctx.beginPath();ctx.ellipse(0,0,R*(1.08-.08*u),Ry*(1.08-.08*u),0,0,7);ctx.stroke()}
 else if(f.t==='job')jobFx(f,u,R,Ry);
 else if(f.t==='heal'){ctx.globalAlpha=DIM*(1-u)*.8;ctx.strokeStyle=f.c;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,R*u,Ry*u,0,0,7);ctx.stroke();ctx.fillStyle=f.c;for(let i=0;i<7;i++){const a=i*0.9+u*3,rr=R*.8*((i%3)/3+.3);ctx.fillRect(Math.cos(a)*rr-2,-u*PPU*3*(0.5+i%3*.3)+Math.sin(a)*rr*.5-2,4,4)}}
 else if(f.t==='taunt'){ctx.globalAlpha=DIM*(1-u)*.8;ctx.strokeStyle=f.c;ctx.lineWidth=3;for(let i=0;i<2;i++){const uu=clamp(u*1.4-i*.25,0,1);ctx.beginPath();ctx.ellipse(0,0,R*uu,Ry*uu,0,0,7);ctx.stroke()}}
 else if(f.t==='burst'){ctx.globalAlpha=DIM*(1-u);ctx.strokeStyle=f.c;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,-PPU,R*u,R*u*.6,0,0,7);ctx.stroke();ctx.fillStyle=f.c;for(let i=0;i<12;i++){const a=i/12*6.283;ctx.fillRect(Math.cos(a)*R*u*1.1-2,-PPU+Math.sin(a)*R*u*.7-2,5,5)}}
 else if(f.t==='hitspark'){ctx.globalAlpha=DIM*1-u;ctx.strokeStyle=f.c;ctx.lineWidth=2.5;for(let i=0;i<4;i++){const a=i*1.57+.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*PPU*.3,-PPU*1.2+Math.sin(a)*PPU*.3);ctx.lineTo(Math.cos(a)*PPU*(.3+u),-PPU*1.2+Math.sin(a)*PPU*(.3+u));ctx.stroke()}}
 else if(f.t==='bossmove'){const e=Math.min(1,u*2.2);ctx.globalCompositeOperation='lighter';const RR=PPU*(f.m==='pulse'?14:8)*e;ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle='#8fd8ff';ctx.lineWidth=PPU*.5*(1-u)+2;ctx.beginPath();ctx.ellipse(0,0,RR,RR*.6,0,0,7);ctx.stroke();
  const n=LOWQ()?10:18;ctx.fillStyle='#d6f2ff';for(let i=0;i<n;i++){const a=i*6.283/n,d=RR*(.5+.5*((i*7)%5)/5);ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.6);ctx.beginPath();ctx.moveTo(-PPU*.25,0);ctx.lineTo(0,-PPU*2.2*(1-u)-PPU*.3);ctx.lineTo(PPU*.25,0);ctx.closePath();ctx.globalAlpha=(1-u)*.9;ctx.fill();ctx.restore()}ctx.globalCompositeOperation='source-over'}
 ctx.restore();return true}
function jobFx(f,u,R,Ry){const c=f.fx.c,t=f.fx.t,e=1-Math.pow(1-u,2.2),A0=(1-u);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=f.ult?5:3;
 const ring=(s,a)=>{ctx.globalAlpha=DIM*a;ctx.beginPath();ctx.ellipse(0,0,R*s,Ry*s,0,0,7);ctx.stroke()};
 switch(t){
 case 'shock':ring(e,A0);ring(e*.7,A0*.6);ctx.globalAlpha=DIM*A0*.7;for(let i=0;i<10;i++){const a=i*.628;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*e*.4,Math.sin(a)*Ry*e*.4);ctx.lineTo(Math.cos(a+.1)*R*e,Math.sin(a+.1)*Ry*e);ctx.stroke()}break;
 case 'spears':ctx.globalAlpha=DIM*A0;for(let i=0;i<9;i++){const a=i*.7+.2,d=R*(.2+.8*((i*37)%10)/10)*Math.min(1,u*3);const px=Math.cos(a)*d,py=Math.sin(a)*d*.6;const h=PPU*(2.4*Math.sin(Math.min(1,u*2)*Math.PI/1)) ;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-h);ctx.stroke();ctx.beginPath();ctx.moveTo(px-4,py-h+6);ctx.lineTo(px,py-h-3);ctx.lineTo(px+4,py-h+6);ctx.fill()}ring(e,A0*.5);break;
 case 'gears':ctx.globalAlpha=DIM*A0;for(let i=0;i<5;i++){const a=i*1.256+u*4,d=R*(.3+.5*(i%2));ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.6);ctx.rotate(u*8);ctx.lineWidth=3;ctx.beginPath();for(let k=0;k<8;k++){const aa=k*.785;ctx.lineTo(Math.cos(aa)*PPU*.6,Math.sin(aa)*PPU*.6);ctx.lineTo(Math.cos(aa+.39)*PPU*.42,Math.sin(aa+.39)*PPU*.42)}ctx.closePath();ctx.stroke();ctx.restore()}ring(e,A0*.6);break;
 case 'spirit':ctx.globalAlpha=DIM*A0;for(let i=0;i<3;i++){const s=clamp(e*1.3-i*.2,0,1);ctx.beginPath();ctx.ellipse(0,-PPU*.6,R*.4*s,R*.4*s*.9,0,0,7);ctx.lineWidth=5-i;ctx.stroke()}ring(e,A0*.7);break;
 case 'cloud':ctx.globalAlpha=DIM*A0*.55;for(let i=0;i<14;i++){const a=i*.9+u,d=R*.85*((i*13)%10)/10;ctx.beginPath();ctx.ellipse(Math.cos(a)*d,Math.sin(a)*d*.6-u*PPU,PPU*(.6+u),PPU*(.4+u*.5),0,0,7);ctx.fill()}break;
 case 'bullets':ctx.globalAlpha=DIM*A0;ctx.lineWidth=2.5;for(let i=0;i<16;i++){const a=i*.5,d=R*((i*29)%10)/11;const px=Math.cos(a)*d,py=Math.sin(a)*d*.6;const yy=-PPU*7*(1-clamp(u*1.5-i*.02,0,1));ctx.beginPath();ctx.moveTo(px,py+yy-PPU*.8);ctx.lineTo(px,py+yy);ctx.stroke()}ring(clamp(u*1.6,0,1),A0*.5);break;
 case 'shuriken':ctx.globalAlpha=DIM*A0;for(let i=0;i<7;i++){const a=i*.9,d=R*e*(.5+.5*((i*7)%5)/5);ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.6-PPU*.5);ctx.rotate(u*14+i);ctx.beginPath();for(let k=0;k<4;k++){ctx.lineTo(Math.cos(k*1.57)*PPU*.7,Math.sin(k*1.57)*PPU*.7);ctx.lineTo(Math.cos(k*1.57+.78)*PPU*.2,Math.sin(k*1.57+.78)*PPU*.2)}ctx.closePath();ctx.fill();ctx.restore()}ring(e,A0*.5);break;
 case 'slash':ctx.globalAlpha=DIM*A0;ctx.lineWidth=5;for(let i=0;i<4;i++){const s=clamp(u*2-i*.15,0,1),a=-.6+i*.35;ctx.beginPath();ctx.moveTo(-R*.9*Math.cos(a),-R*.5*s*Math.sin(a+1)-PPU);ctx.quadraticCurveTo(0,-PPU*2.2*s,R*.9*Math.cos(a)*s,R*.5*Math.sin(a+1)*s);ctx.stroke()}ring(e,A0*.4);break;
 case 'rune':ctx.globalAlpha=DIM*A0;ring(1,A0);ring(.78,A0);ctx.save();ctx.rotate(0);for(let i=0;i<6;i++){const a=i*1.047+u*3;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*.78,Math.sin(a)*Ry*.78);ctx.lineTo(Math.cos(a+2.09)*R*.78,Math.sin(a+2.09)*Ry*.78);ctx.stroke()}ctx.restore();ctx.globalAlpha=DIM*A0*.35;ctx.beginPath();ctx.ellipse(0,0,R,Ry,0,0,7);ctx.fill();break;
 case 'cross':ctx.globalAlpha=DIM*A0;ctx.lineWidth=6;for(let i=0;i<5;i++){const px=(((i*53)%9)/9-.5)*R*1.5,py=(((i*31)%7)/7-.5)*Ry*1.5,s=clamp(u*2.4-i*.12,0,1)*PPU*1.5;ctx.beginPath();ctx.moveTo(px-s,py-s-PPU);ctx.lineTo(px+s,py+s-PPU);ctx.moveTo(px+s,py-s-PPU);ctx.lineTo(px-s,py+s-PPU);ctx.stroke()}ring(e,A0*.5);break;
 case 'arrows':ctx.globalAlpha=DIM*A0;ctx.lineWidth=2.5;for(let i=0;i<20;i++){const a=i*.77,d=R*((i*17)%10)/10;const px=Math.cos(a)*d,py=Math.sin(a)*d*.6;const yy=-PPU*8*(1-clamp(u*1.6-i*.015,0,1));ctx.beginPath();ctx.moveTo(px-yy*.15,py+yy-PPU*1.2);ctx.lineTo(px,py+yy);ctx.stroke()}ring(1,A0*.4);break;
 case 'flame':ctx.globalAlpha=DIM*A0*.8;for(let i=0;i<18;i++){const a=i*.74,d=R*.9*((i*19)%10)/10;ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.6-u*PPU*2);ctx.fillStyle=i%3?'#ff8a2a':'#ffd24a';ctx.beginPath();ctx.moveTo(-PPU*.4,0);ctx.quadraticCurveTo(0,-PPU*(1.2+(i%3)*.5)*(1-u*.4),PPU*.4,0);ctx.quadraticCurveTo(0,PPU*.3,-PPU*.4,0);ctx.fill();ctx.restore()}ring(e,A0*.6);break;
 case 'pillar':{const h=PPU*9;ctx.globalAlpha=DIM*A0*.8;const g=ctx.createLinearGradient(0,-h,0,0);g.addColorStop(0,'rgba(255,255,220,0)');g.addColorStop(1,c);ctx.fillStyle=g;const w=R*.6*Math.sin(Math.min(1,u*1.5)*Math.PI/1.2);ctx.fillRect(-w,-h*Math.min(1,u*3),w*2,h*Math.min(1,u*3));ring(e,A0);break}
 case 'notes':ctx.globalAlpha=DIM*A0;ctx.font=`${PPU*1.4|0}px sans-serif`;ctx.textAlign='center';for(let i=0;i<10;i++){const a=i*.9,d=R*e*.9*(.4+((i*7)%6)/9);ctx.fillText(i%2?'♪':'♫',Math.cos(a)*d,Math.sin(a)*d*.6-u*PPU*3-PPU*.3)}ring(e,A0*.6);break;
 case 'ribbon':ctx.globalAlpha=DIM*A0;ctx.lineWidth=4;for(let k=0;k<3;k++){ctx.beginPath();for(let i=0;i<=40;i++){const s=i/40,a=s*9+k*2.1+u*5,d=R*s*e;const px=Math.cos(a)*d,py=Math.sin(a)*d*.6-Math.sin(s*3.14)*PPU*.8;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke()}ring(e,A0*.5);break;
 default:ring(e,A0)}
 if(f.ult){ctx.globalAlpha=DIM*A0*.25;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,R*e,Ry*e,0,0,7);ctx.fill()}
 ctx.globalAlpha=DIM*1}
function drawBossTele(){for(const z of room.tele){const u=clamp((room.t-z.t0)/z.dur,0,1);const[sx,sy]=S2(z.x,z.y);ctx.save();ctx.translate(sx,sy);const fillA=.12+.38*u;
  ctx.strokeStyle='rgba(255,70,60,.95)';ctx.fillStyle=`rgba(255,40,40,${fillA})`;ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.lineDashOffset=-tNow*50;
  if(z.type==='circle'){const R=z.r*PPU;ctx.beginPath();ctx.ellipse(0,0,R,R*.6,0,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(255,60,50,.55)';ctx.beginPath();ctx.ellipse(0,0,R*u,R*.6*u,0,0,7);ctx.fill();if(z.move==='mark')icoSkull(0,-PPU*.2,PPU*.55)}
  else if(z.type==='cone'){const R=z.r*PPU;ctx.rotate(0);ctx.beginPath();ctx.moveTo(0,0);const a0=z.a-z.w/2,a1=z.a+z.w/2;for(let i=0;i<=20;i++){const a=a0+(a1-a0)*i/20;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R*.6)}ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([])}
  else{const R=Math.min(z.r,60)*PPU*u;ctx.setLineDash([]);ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,Math.max(4,R),Math.max(3,R*.6),0,0,7);ctx.stroke();if(z.r<20){ctx.beginPath();ctx.ellipse(0,0,z.r*PPU,z.r*PPU*.6,0,0,7);ctx.setLineDash([10,7]);ctx.lineWidth=3;ctx.stroke()}}
  ctx.restore()}}
function drawNums(){const out=[];
 for(const n of nums){const age=tNow-n.t0;if(age<0){out.push(n);continue}const life=n.c>=2?1.5:n.c===1?1.1:.85;if(age>life)continue;out.push(n);if(vfxA(n.p,n.c===-2?'sup':n.kd,1)<=0)continue;
  const[sx,sy0]=S2(n.x,n.y);const u=age/life;let size,col,txt;
  if(n.c===-3){txt=n.txt;size=PPU*.62*(n.size||1);col=n.col}
  else if(n.c===-1){txt='-'+fmt(n.v);size=PPU*.5;col='#ff6a6a'}
  else if(n.c===-2){txt='+'+fmt(n.v);size=PPU*.5;col='#7dffa8'}
  else{txt=fmt(n.v);
   if(n.c===0){size=PPU*.42;col='#ffffff'}
   else if(n.c===1){size=PPU*.82;col='#ffd23a'}
   else if(n.c===2){size=PPU*1.1;col='#ff8a2a'}
   else{size=PPU*1.55;col='#ff3ea0'}}
  const pop=n.c>=1?(u<.15?.6+u/.15*.55:1.15-.15*Math.min(1,(u-.15)/.2)):1;
  const sy=sy0-u*PPU*(n.vy||1.6)*(n.c>=1?1.4:1)-(n.c>=1?PPU*.3:0);
  ctx.save();ctx.translate(sx+(n.c===3?Math.sin(age*60)*2.5*(1-u):0),sy);ctx.scale(pop,pop);ctx.globalAlpha=u>.65?1-(u-.65)/.35:1;
  ctx.font=`${n.c>=1?800:600} ${size|0}px "Noto Sans TC",Impact,sans-serif`;ctx.textAlign='center';ctx.lineJoin='round';
  if(n.c>=1){ctx.lineWidth=Math.max(3,size*.22);ctx.strokeStyle=n.c===3?'#400020':n.c===2?'#5a1800':'#4a3400';ctx.strokeText(txt,0,0);if(n.c>=2){ctx.shadowColor=col;ctx.shadowBlur=size*.5}
   if(n.c>=2){const g=ctx.createLinearGradient(0,-size,0,0);g.addColorStop(0,'#fff');g.addColorStop(.5,col);g.addColorStop(1,n.c===3?'#a01060':'#c04a00');ctx.fillStyle=g}else ctx.fillStyle=col;ctx.fillText(txt,0,0);
   if(n.c>=2&&u<.25){ctx.shadowBlur=0;ctx.font=`700 ${(size*.4)|0}px sans-serif`;ctx.fillStyle='#fff';ctx.fillText(n.c===3?'超級爆擊!':'爆擊!',0,-size*.95)}}
  else{ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText(txt,0,0);ctx.fillStyle=col;ctx.fillText(txt,0,0)}
  ctx.restore()}
 nums=out.length>400?out.slice(-400):out}
function render(k){camTo(.12);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,VW,VH);ctx.fillStyle='#06080e';ctx.fillRect(0,0,VW,VH);
 const g=ground(C.region),a=room.arena;const gw=a[0]*PPU,gh=a[1]*PPU;for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const x0=OX+ix*gw,y0=OY+iy*gh;if(x0>VW||y0>VH||x0+gw<0||y0+gh<0)continue;ctx.drawImage(g,x0,y0,gw,gh)}
 ctx.strokeStyle='rgba(255,255,255,.12)';ctx.strokeRect(OX,OY,a[0]*PPU,a[1]*PPU);
 // ground fx first
 fx=fx.filter(f=>f.t==='tele'||f.t==='job'||f.t==='heal'||f.t==='taunt'?drawFx(f):true);
 drawBossTele();
 for(const c of corpses.slice())if(!drawCorpse(c))corpses.splice(corpses.indexOf(c),1);
 // y-sorted entities
 const ents=[];for(const m of room.mobs)if(!m.dead)ents.push({y:m.y,d:()=>drawMob(m,k)});for(const p of room.players)ents.push({y:p.y,d:()=>drawChar(p,k)});ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
 fx=fx.filter(f=>f.t==='burst'||f.t==='hitspark'||f.t==='bossmove'?drawFx(f):true);
 drawNums();
 if(ultFlash>tNow){ctx.fillStyle=`rgba(255,240,200,${(ultFlash-tNow)*.8})`;ctx.fillRect(0,0,VW,VH)}
 if(room.phase==='rest'){ctx.fillStyle='rgba(10,14,28,.55)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#fff';ctx.font='700 28px sans-serif';ctx.textAlign='center';ctx.fillText('休息站 '+Math.ceil(room.restT)+' 秒',VW/2,VH/2)}
 // low-HP warning vignette (no flashing)
 const me=room.players[C.sel];if(me&&me.hp/me.maxhp<.3&&me.down<=0){const g2=ctx.createRadialGradient(VW/2,VH/2,VH*.4,VW/2,VH/2,VH*.9);g2.addColorStop(0,'rgba(255,0,0,0)');g2.addColorStop(1,'rgba(255,0,0,.22)');ctx.fillStyle=g2;ctx.fillRect(0,0,VW,VH)}}

// ================= HUD
function buildParty(){const el=$('party');el.innerHTML='';room.players.forEach(p=>{const d=document.createElement('div');d.className='pm';d.dataset.i=p.id;d.innerHTML=`<div class="t"><span></span><span></span></div><div class="hb"><i></i></div>`;d.onclick=()=>{C.sel=p.id;buildSkills();buildEquip();hudPartyNow()};el.append(d)})}
function buildSkills(){const el=$('skills');el.innerHTML='';const p=room.players[C.sel];if(!p)return;p.kit.forEach((s,i)=>{const d=document.createElement('div');d.className='sk'+(s.ult?' ult':'');d.dataset.id=s.id;d.innerHTML=`<img class="ski" src="v2/ic/s/${s.id}.webp" alt=""><div class="k">${i+1}${s.ult?' · 大招':''}</div><div class="n">${s.name}</div><div class="m">CD ${s.cd}s</div><div class="cdv"></div><div class="cdt"></div>`;d.onclick=()=>manualCast(p,s);el.append(d)});
 for(let i=p.kit.length;i<8;i++){const d=document.createElement('div');d.className='sk lock';d.innerHTML=`<div class="k">${i+1}</div><div class="n">未解鎖</div><div class="m">${[0,0,0,0,25,50,100,130][i]?'Base '+[0,0,0,0,25,50,100,130][i]:''}</div>`;el.append(d)}}
function manualCast(p,s){if(!room||room.result||p.down>0||p.soul>0||p.cd[s.id]>0||p.lock>0)return;let tgt=null;if(s.type==='atk'||s.fn==='taunt'){let b=1e9;for(const m of room.mobs){if(m.dead)continue;const d=(m.x-p.x)**2+(m.y-p.y)**2;if(d<b){b=d;tgt=m}}if(!tgt)return}room.ev.length=0;room.cast(p,s,tgt);handleEvents(room.ev);room.ev.length=0}
function hudPartyNow(){}
function fmtPct(v){return (v*100).toFixed(0)+'%'}
function updateHud(){
 const r=room;$('rgName').textContent=(REGION_ZH[C.region-1]||'區域 '+C.region);$('stNo').textContent=r.stage+'/'+r.endStage;const tt=$('tierTag');tt.textContent=TIER_ZH[C.tier];tt.className='tag t'+TIERS.indexOf(C.tier);
 const pe=$('pips');if(!pe.children.length){for(let i=1;i<=r.endStage;i++){const d=document.createElement('i');if(T.regions.eliteStages.includes(i))d.className='el';if(i===T.regions.bossStage)d.className='bs';pe.append(d)}}
 [...pe.children].forEach((d,i)=>{d.classList.toggle('done',i+1<r.stage);d.classList.toggle('cur',i+1===r.stage)});
 const q=Math.max(1,r.quota);$('questFill').style.width=Math.min(100,r.killed/q*100)+'%';$('questTxt').textContent=(r.isBoss?'區域王關 · ':r.isElite?'精英關 · ':'')+'擊殺 '+Math.min(r.killed,r.quota)+' / '+r.quota;
 const b=r.boss&&!r.boss.dead?r.boss:null;$('bossWrap').hidden=!b;if(b){$('bossFill').style.width=(b.hp/b.maxhp*100)+'%';$('bossHp').textContent=fmt(b.hp)+' / '+fmt(b.maxhp);$('bossName').textContent=(roster1(r)||'區域王')}
 // DPS panel
 const mode=C.dmgMode;const list=r.players.map(p=>({p,v:mode==='dmg'?p.st.dmg:mode==='heal'?p.st.heal:p.st.taken}));const tot=list.reduce((a,b)=>a+b.v,0)||1;list.sort((a,b)=>b.v-a.v);const mx=list[0].v||1;const el=$('dpsList');
 if(!el._rows)el._rows=new Map();const frag=document.createDocumentFragment();
 list.forEach((it,i)=>{const p=it.p;let row=el._rows.get(p.id);if(!row){row=document.createElement('div');row.className='row';row.innerHTML='<div class="bg"></div><div class="rk"></div><div class="nm"></div><div class="vl"></div>';row.onclick=()=>{C.sel=p.id;buildSkills();buildEquip()};el._rows.set(p.id,row)}
  row.className='row'+(p.id===C.sel?' sel':'');row.children[0].style.width=(it.v/mx*100)+'%';row.children[0].style.background=(FX[p.job]||FX.kni).c;row.children[1].textContent=i+1;
  row.children[2].innerHTML=`${p.name}<small>${JOBS[p.job].name.slice(0,4)} · ${JOB_ROLE_ZH[p.role]||p.role}</small>`;
  const dps=it.v/Math.max(1,r.t);row.children[3].innerHTML=`${fmt(it.v)}<small>${fmt(dps)}/s · ${fmtPct(it.v/tot)}</small>`;frag.append(row)});el.replaceChildren(frag);
 // aggro
 const ag=$('aggro');let h='';const big=r.mobs.find(m=>!m.dead&&m.type==='boss')||r.mobs.find(m=>!m.dead&&m.type==='elite');
 if(big){const tg=big.tgt;h+=`<div>${big.type==='boss'?'王':'精英'}目標：<b>${tg?tg.name:'—'}</b></div>`;if(big.taunt&&big.taunt.until>r.t)h+=`<div><b style="color:#ffb040">◆</b> 挑釁鎖定中（剩 ${Math.max(0,big.taunt.until-r.t).toFixed(0)} 秒）</div>`;else h+='<div>無挑釁，依仇恨權重</div>';if(big.curMove)h+=`<div style="color:#ff8a7a">▲ 蓄力：${({heavy:'重擊',mark:'點名',pulse:'全場脈衝',sweep:'橫掃',summon:'召喚'})[big.curMove]||big.curMove}</div>`}else h+='<div>目前無精英／王</div>';
 const alive=r.mobs.filter(m=>!m.dead).length;h+=`<div style="margin-top:6px">場上怪物 <b>${alive}</b>／上限 ${Math.min(T.party.capMax,Math.round(T.party.mobCap*(1+T.party.capPerExtra*(r.players.length-1))*T.tiers[C.tier].count))}</div><div>治療羽毛 <b>${r.feathers}</b> · 隊員存活 <b>${r.players.filter(p=>p.down<=0&&!p.soul).length}/${r.players.length}</b></div>`;ag.innerHTML=h;
 // party strip
 [...$('party').children].forEach(d=>{const p=r.players[+d.dataset.i];d.classList.toggle('sel',p.id===C.sel);d.classList.toggle('down',p.down>0||p.soul>0);d.children[0].children[0].textContent=p.name+' · '+JOBS[p.job].name.slice(0,3)+(p.ai?' (AI)':'');d.children[0].children[1].textContent=p.down>0?'倒地 '+Math.ceil(p.down):p.soul>0?'靈魂':fmt(p.hp)+'/'+fmt(p.maxhp);const f=clamp(p.hp/p.maxhp,0,1);const i=d.children[1].children[0];i.style.width=f*100+'%';i.className=f<.25?'cr':f<.5?'lo':''});
 // skills
 const sp=r.players[C.sel];[...$('skills').children].forEach(d=>{const id=d.dataset.id;if(!id)return;const s=SK[id],cd=Math.max(0,sp.cd[id]||0),full=s.cd||1;d.classList.toggle('rdy',cd<=0);d.style.setProperty('--p',Math.min(100,cd/full*100).toFixed(1));d.querySelector('.cdt').textContent=cd>0?cd.toFixed(cd<10?1:0):''});
 const bn=$('banner');bn.hidden=!(banner.t>tNow);if(bn.textContent!==banner.txt)bn.textContent=banner.txt;bn.className=banner.cls||'';if(r.boss&&!r.boss.dead&&!r.boss._seen){r.boss._seen=1;dropPrev.t=tNow+6;bossStart=r.t;sigBanner('⚔ 區域王降臨 ⚔',2.4,'intro')}const dp=$('dropPrev');if(dp){const on=dropPrev.t>tNow&&r.boss&&!r.boss.dead;dp.hidden=!on}const bt=$('bossTime');if(bt&&r.boss&&!r.boss.dead){const s2=Math.max(0,r.t-bossStart)|0;bt.textContent=String(s2/60|0).padStart(2,'0')+':'+String(s2%60).padStart(2,'0')}}
function roster1(r){const id=r.boss&&mobVariant(r.boss.id,'boss');return id&&imgs.mobs.mobs[id]?imgs.mobs.mobs[id].zh:''}

// ================= equipment panel (A12.4) — demo gear generated deterministically from the equip/affix budget tables
const EQ=new Map();const AFF=[['破防 %','pen',.25],['爆擊率 %','crit',.35],['爆擊傷害 %','critd',.6],['普攻傷害 %','bas',.35],['冷卻縮減 %','cdr',.2],['範圍 %','radius',.2],['治療效果 %','heal',.5],['承傷 %','tank',-.2],['吸血 %/秒','ls',.03]];
const NAMES={wpn:['晨曦長弓','赤鋼長劍','風語法杖','月影短刃','裂岩戰錘'],off:['守誓盾牌','星砂副手','靈石魔導書'],head:['鷹羽頭盔','寶石額環','鋼鐵護盔'],body:['旅者胸甲','織光長袍','暗影皮衣'],cape:['雲織披風','荊棘斗篷','霜絨披肩'],boots:['疾風之靴','履霜長靴','輕羽便鞋'],acc1:['星砂戒指','赤銅戒環','碧玉指環'],acc2:['月石項鍊','雷紋護符','晨露墜飾']};
function rng(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function genItem(p,slot,seed,bonus){const r=rng(seed*131+slot.length*17+p.id*977),B=T.equip_budget,AB=T.affix_budget;const qi=Math.min(2,Math.floor(r()*r()*3+bonus));const q=['SR','SSR','UR'][qi];const refine=Math.floor(r()*r()*13)+(qi*2),stars=qi>0?Math.floor(r()*4)+(qi===2?1:0):0,asc=qi===2?Math.floor(r()*3.4):0;
 const heroPow=p.atk*20,base=heroPow*B.slots[slot]/1.0*(0.7+r()*.5);const qm=B.qualityMul[qi+2]||1,am=1+(B.ascMul[asc]||0),sm=B.starMul[stars]||1,rm=1+refine*.02;const power=Math.round(base*qm*am*sm*rm);
 const pts=AB.pointsPerPiece[q];let left=pts;const aff=[];const n=qi+1;for(let i=0;i<n;i++){const a=AFF[Math.floor(r()*AFF.length)];if(aff.find(x=>x.n===a[0]))continue;const share=left/(n-i)*(0.7+r()*.6);left-=share;aff.push({n:a[0],v:+(Math.abs(a[2])*share/AB.pointsPerPiece.UR*(a[2]<0?-1:1)*100*1.2).toFixed(1)})}
 const nm=NAMES[slot];return{slot,q,name:nm[Math.floor(r()*nm.length)],refine,stars,asc,power,base:Math.round(base),qm,am,sm,rm,aff,set:r()<.35?'旅行者套裝':null}}
function equipOf(p){if(!EQ.has(p.id)){const gear={},bag={};for(const s of Object.keys(T.equip_budget.slots)){if(p.job==='arc'&&s==='off')continue;gear[s]=genItem(p,s,p.id*10+s.length,.5);bag[s]=genItem(p,s,p.id*10+s.length+99,.9)}EQ.set(p.id,{gear,bag})}return EQ.get(p.id)}
function setCount(g,name){return Object.values(g).filter(x=>x&&x.set===name).length}
function buildEquip(){const p=room.players[C.sel];if(!p)return;const E=equipOf(p);const jn=JOBS[p.job];$('eqTitle').textContent='裝備 · '+p.name+'（'+jn.name.slice(0,5)+'）';const total=Object.values(E.gear).reduce((a,x)=>a+(x?x.power:0),0);$('eqPower').innerHTML='總戰力 <b style="color:#ffc857;font-size:15px">'+fmt(total)+'</b>';
 const el=$('eqSlots');el.innerHTML='';for(const s of Object.keys(T.equip_budget.slots)){const it=E.gear[s],cand=E.bag[s];const d=document.createElement('div');d.className='slot'+(eqSel===s?' sel':'');
  if(!it){d.innerHTML=`<div class="ico q-EMPTY">${SLOT_IC[s]}</div><div class="nm" style="color:#8d99b8">${SLOT_ZH[s]}<small>${JOBS[p.job].name.slice(0,3)}不能裝備${s==='off'?'副手':''}</small></div><div></div>`}
  else{const diff=cand?cand.power-it.power:0;const sc=it.set?setCount(E.gear,it.set):0;
   d.innerHTML=`<div class="ico q-${it.q}">${SLOT_IC[s]}<span class="st">${it.stars?'★'.repeat(Math.min(it.stars,5)):''}${it.asc?' '+['','Ⅰ','Ⅱ','Ⅲ'][it.asc]:''}</span><span class="pl">+${it.refine}</span></div><div class="nm"><span style="color:${QCOL[it.q]}">[${it.q}]</span> ${it.name}<small>${SLOT_ZH[s]}${it.set?' · '+it.set+' '+sc+'/3':''}${cand&&diff>0?` · <span class="up">背包有更好 ▲${fmt(diff)}</span>`:''}</small></div><div class="pw">${fmt(it.power)}<small>戰力</small></div>`}
  d.onclick=()=>{eqSel=s;buildEquip()};el.append(d)}
 detail(p,E)}
function detail(p,E){const it=E.gear[eqSel],cand=E.bag[eqSel];const el=$('eqDetail');if(!it){el.innerHTML='<h4>'+SLOT_ZH[eqSel]+'</h4><div class="note">此職業不可裝備。（A8.9：例如咒術士不能持盾）</div>';return}
 const dl=(a,b,unit)=>{const d=b-a;return d===0?'':`<span class="${d>0?'up':'dn'}"> ${d>0?'▲':'▼'}${typeof d==='number'&&Math.abs(d)<10?Math.abs(d).toFixed(1):fmt(Math.abs(d))}${unit||''}</span>`};
 let h=`<h4><span style="color:${QCOL[it.q]}">[${it.q}] ${it.name}</span>  +${it.refine}</h4>`;
 h+=`<div class="ln main"><span>ATK 基礎 ${fmt(it.base)}</span><span>×${it.qm.toFixed(2)} 品質 ×${it.am.toFixed(2)} 昇華 ×${it.sm.toFixed(2)} 星</span></div>`;
 h+=`<div class="ln main"><span>強化 +${it.refine}</span><span>×${it.rm.toFixed(2)}</span></div>`;
 for(const a of it.aff)h+=`<div class="ln aff"><span>${a.n}</span><span>${a.v>0?'+':''}${a.v}${cand?'':''}</span></div>`;
 if(it.set)h+=`<div class="ln set"><span>${it.set}（${setCount(E.gear,it.set)}/3）</span><span>2 件：冷卻 -3%</span></div>`;
 h+=`<div class="ln"><b>單件戰力</b><b style="color:#ffc857">${fmt(it.power)}</b></div>`;
 if(cand){h+=`<div style="margin-top:8px;border-top:1px solid #2c3753;padding-top:6px"><div style="color:#8d99b8">背包比較 → <span style="color:${QCOL[cand.q]}">[${cand.q}] ${cand.name}</span> +${cand.refine}${dl(it.power,cand.power)}</div>`;h+=`<div class="ln"><span>戰力</span><span>${fmt(cand.power)}${dl(it.power,cand.power)}</span></div>`;for(const a of cand.aff){const o=it.aff.find(x=>x.n===a.n);h+=`<div class="ln aff"><span>${a.n}</span><span>${a.v}${o?dl(o.v,a.v):' <span class="up">▲新增</span>'}</span></div>`}for(const a of it.aff)if(!cand.aff.find(x=>x.n===a.n))h+=`<div class="ln aff"><span>${a.n}</span><span class="dn">▼失去 ${a.v}</span></div>`;h+=`<div class="note">操作：裝備 · 強化 · 昇華 · 覺醒 · 分解 · 鎖定（原型僅示意，不改資料）</div></div>`}
 h+=`<div class="note">${it.q==='UR'?'UR／覺醒材料／卡片可在交易所以「鑽石」交易；SR 以下綁定（A17）':'SR 以下綁定，不可交易（A17）'}</div>`;el.innerHTML=h}

// ================= main loop
function frame(ts){if(!lastTs)lastTs=ts;let dtms=ts-lastTs;lastTs=ts;if(dtms>100)dtms=100;
 if(!C.paused&&room&&!room.result){acc+=dtms/1000*C.speed;const steps=Math.floor(acc/.1);acc-=steps*.1;for(let i=0;i<Math.min(steps,8*C.speed);i++){tNow+=0.1/C.speed*0;stepSim()}}
 fpsAvg=fpsAvg*.95+(1000/Math.max(1,dtms))*.05;const lq=C.qmode==='low'||(C.qmode==='auto'&&fpsAvg<(lowQ?38:28));if(lq!==lowQ){lowQ=lq;updVfxNote()}
 tNow=ts/1000;const k=C.paused?1:clamp(acc/.1,0,1);
 if(room){render(k);if((frameN++%3)===0)updateHud()}
 requestAnimationFrame(frame)}
let frameN=0;
function init(){
 const sr=$('selRegion');REGION_ZH.forEach((n,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=(i+1)+'. '+n;sr.append(o)});sr.value=C.region;
 const st=$('selTier');TIERS.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=TIER_ZH[t];st.append(o)});st.value=C.tier;
 const sm=$('selTeam');Object.entries(TEAMS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v[0];sm.append(o)});sm.value=C.team;
 sr.onchange=()=>{C.region=+sr.value;C.startStage=1;newRoom();fitCam()};st.onchange=()=>{C.tier=st.value;C.startStage=1;newRoom()};sm.onchange=()=>{C.team=sm.value;C.sel=0;C.startStage=1;newRoom()};
 
 
 const sv=$('selVfx');Object.entries(VFX_ZH).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent='技能特效：'+v;sv.append(o)});sv.value=C.vfx;sv.onchange=()=>{C.vfx=sv.value;try{localStorage.setItem('hd.vfx',C.vfx)}catch(e){}updVfxNote()};
 $('btnRestart').onclick=()=>{C.seed++;C.startStage=1;newRoom()};
 document.querySelectorAll('#dpsTabs button').forEach(b=>b.onclick=()=>{C.dmgMode=b.dataset.m;document.querySelectorAll('#dpsTabs button').forEach(x=>x.classList.toggle('on',x===b))});
 addEventListener('keydown',e=>{if(/^[1-8]$/.test(e.key)){const p=room.players[C.sel];const s=p.kit[+e.key-1];if(s)manualCast(p,s)}});
 addEventListener('resize',resize);
 loadAssets().then(()=>{newRoom();resize();requestAnimationFrame(frame);window.__v2={C,get room(){return room},get fx(){return fx},get nums(){return nums},stepSim,newRoom,equipOf,genItem,buildEquip,T,JOBS,SK,SLOT_IC,SLOT_ZH,QCOL,ready:true}});
}
init();
})();
/* mobile r2: collapsible 隊伍輸出 panel (collapsed by default on narrow screens) */
(function(){const L=document.getElementById('left');if(!L)return;const h=L.querySelector('.ph');if(!h)return;let s=null;try{s=localStorage.getItem('hd.dpsCol')}catch(e){}
const col=s===null?innerWidth<=900:s==='1';L.classList.toggle('col',col);
h.addEventListener('click',e=>{if(e.target.closest('#dpsTabs'))return;const c=L.classList.toggle('col');try{localStorage.setItem('hd.dpsCol',c?'1':'0')}catch(_){}});})();

;(function(){const q=document.getElementById('selQ');if(q){q.value=(()=>{let v=new URLSearchParams(location.search).get("q");try{v=v||localStorage.getItem("hd.q")}catch(e){}return ["auto","high","low"].includes(v)?v:"auto"})();q.onchange=()=>{const C=window.__v2&&window.__v2.C;if(C)C.qmode=q.value;try{localStorage.setItem('hd.q',q.value)}catch(e){}}}
const app=document.getElementById('app'),top=document.getElementById('top'),ctl=top.querySelector('.ctl'),sp=document.createElement('div');sp.id='setPanel';sp.innerHTML='<div class="t">設定</div>';top.append(sp);
const ids=['selRegion','selTier','selTeam','selVfx','selQ'],mq=matchMedia('(max-width:900px)');
function place(){const m=mq.matches;ids.forEach(i=>{const e=document.getElementById(i);if(!e)return;if(m)sp.append(e);else ctl.insertBefore(e,document.getElementById('vfxNote'))});if(!m)app.classList.remove('set')}
place();mq.addEventListener?mq.addEventListener('change',place):mq.addListener(place);
document.getElementById('btnSet').onclick=e=>{e.stopPropagation();app.classList.toggle('set')};
document.addEventListener('click',e=>{if(app.classList.contains('set')&&!sp.contains(e.target))app.classList.remove('set')});})();

/* r4: mobile bottom nav + sheets, offline progress (client interim) */
;(function(){const $=i=>document.getElementById(i),app=$('app'),sh=$('msheet'),body=$('msBody'),mq=matchMedia('(max-width:900px)');
const home={};function park(el){if(!el)return;if(!home[el.id])home[el.id]={p:el.parentNode,n:el.nextSibling};body.append(el)}
function unpark(){const L0=$('left');if(L0&&L0.dataset.wc){L0.classList.toggle('col',L0.dataset.wc==='1');delete L0.dataset.wc}for(const id in home){const e=$(id),h=home[id];if(e&&e.parentNode===body)h.p.insertBefore(e,h.n&&h.n.parentNode===h.p?h.n:null)}const sp=$('setPanel');if(sp&&sp.parentNode===body)$('top').append(sp);body.querySelectorAll('.tmp').forEach(e=>e.remove())}
const V=()=>window.__v2,T={char:'角色',equip:'裝備',skill:'技能設定',bag:'背包',party:'隊伍 / 輸出',set:'設定'};
function info(html){const d=document.createElement('div');d.className='tmp mi';d.innerHTML=html;body.append(d)}
function open(k){unpark();const v=V();if(!v)return;const r=v.room,p=r&&r.players[v.C.sel];$('msTitle').textContent=T[k];
 if(k==='char'&&p&&window.HDX)HDX.char(body);
 if(k==='equip'){park($('right'))}
 if(k==='skill'&&p){info('<div class="mnote">技能自動依順序施放，可在下方技能列手動搶時機。</div>'+p.kit.map((s,i)=>`<div class="mrow"><span>${i+1}${s.ult?' · 大招':''} ${s.name}</span><b>CD ${s.cd}s</b></div>`).join(''))}
 if(k==='bag'&&p&&window.HDX)HDX.bag(body);
 if(k==='party'){park($('party'));const L=$('left');L.dataset.wc=L.classList.contains('col')?'1':'0';park(L);L.classList.remove('col')}
 if(k==='set'){const sp=$('setPanel');if(sp)body.append(sp)}
 sh.hidden=false;app.classList.add('msh')}
function close(){document.querySelectorAll('#mnav button').forEach(x=>x.classList.remove('on'));unpark();sh.hidden=true;app.classList.remove('msh','set')}
document.querySelectorAll('#mnav button').forEach(b=>b.onclick=()=>{const k=b.dataset.p;if(!sh.hidden&&sh.dataset.k===k){close();return}sh.dataset.k=k;document.querySelectorAll('#mnav button').forEach(x=>x.classList.toggle('on',x===b));open(k)});$('msClose').onclick=close;
mq.addEventListener&&mq.addEventListener('change',()=>{if(!mq.matches)close()});
// offline progress (interim, client-side only; real version = server party sim)
const KEY='hd.lastSeen',TOT='hd.offTot',MAXS=12*3600;
window.offTotHTML=()=>offTot();function offTot(){let t={};try{t=JSON.parse(localStorage.getItem(TOT)||'{}')}catch(e){}return `<div class="mrow"><span>累計離線收益</span><b>EXP ${fmt(t.exp||0)} · 金幣 ${fmt(t.zeny||0)} · 裝備 ${t.items||0}</b></div>`}
function fmt(n){return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(0)+'K':Math.round(n)}
function seen(){try{localStorage.setItem(KEY,Date.now())}catch(e){}}
function claim(){let last=0;try{last=+localStorage.getItem(KEY)||0}catch(e){}seen();if(!last)return;const sec=Math.min(MAXS,(Date.now()-last)/1000);if(sec<60)return;
 const v=V(),reg=v?v.C.region:1,tierI=v?['normal','hard','nightmare','hell'].indexOf(v.C.tier):0,rate=(1+reg*.6)*(1+tierI*.5)*0.8;
 const exp=Math.round(sec*rate*12),zeny=Math.round(sec*rate*5),kills=Math.round(sec*rate*1.5),items=Math.floor(kills/400);
 let t={};try{t=JSON.parse(localStorage.getItem(TOT)||'{}')}catch(e){}t.exp=(t.exp||0)+exp;t.zeny=(t.zeny||0)+zeny;t.items=(t.items||0)+items;try{localStorage.setItem(TOT,JSON.stringify(t))}catch(e){}
 const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),o=$('offline');o.innerHTML=`<div class="ob"><div class="ot">離線收益</div><div class="mnote">你的角色在隊伍中持續割草 ${h?h+' 小時 ':''}${m} 分鐘${sec>=MAXS?'（上限 12 小時）':''}</div><div class="mrow"><span>擊殺</span><b>${fmt(kills)}</b></div><div class="mrow"><span>經驗</span><b>+${fmt(exp)}</b></div><div class="mrow"><span>金幣</span><b>+${fmt(zeny)}</b></div><div class="mrow"><span>裝備</span><b>+${items}</b></div><button id="offOk">領取</button></div>`;o.hidden=false;$('offOk').onclick=()=>o.hidden=true}
setInterval(seen,15000);addEventListener('pagehide',seen);document.addEventListener('visibilitychange',()=>{if(document.hidden)seen();else claim()});
const w=setInterval(()=>{if(V()&&V().ready){clearInterval(w);claim()}},300);})();
/* r6: real bag/inventory (client-local until server backend) + richer character panel */
;(function(){const ROLE_ZH={tank:'坦克',subtank:'副坦',bruiser:'鬥士',std:'輸出',glass:'玻璃大砲',healer:'治療',support:'輔助'};
const PASS={tank:'鋼鐵意志：嘲諷成功後 4 秒承傷 -25%，仇恨 ×2.5',subtank:'堅守陣地：生命低於 50% 時防禦 +20%',bruiser:'越戰越勇：每擊殺 1 隻 +1% 傷害（上限 20%）',std:'穩定輸出：技能冷卻結束立即施放時傷害 +8%',glass:'孤注一擲：傷害 +25%，但承傷 +20%',healer:'聖光庇護：治療溢出的 30% 轉為護盾',support:'激勵：周圍隊友技能冷卻 -6%'};
const WZ={dagger:'短劍',sword:'單手劍',sword2:'雙手劍',spear1:'單手槍',spear2:'雙手槍',axe1:'單手斧',axe2:'雙手斧',mace:'鈍器',knuckle:'拳套',staff:'法杖',rod:'短杖',bow:'弓',book:'書',whip:'鞭',instrument:'樂器',katar:'拳刃',huuma:'風魔',gun:'槍械',rifle:'步槍'};
const TAGZ={tank:'坦克',support:'輔助',cc:'控制',debuff:'減益',ult:'大招',phys:'物理',magic:'魔法',aoe:'範圍',single:'單體',heal:'治療',buff:'增益',taunt:'嘲諷',fire:'火',water:'水',wind:'風',earth:'地',holy:'聖',dark:'暗',dot:'持續',melee:'近戰',ranged:'遠程'};
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const f=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(0)+'K':Math.round(n);
const W=()=>window.__v2;let lastK=0,coins=ld('hd.coins',0),mats=ld('hd.mats',0),dropAcc=0;
function inv(p){const {equipOf,genItem,buildEquip,T,JOBS,SK,SLOT_IC,SLOT_ZH,QCOL}=W();const E=equipOf(p);if(!E.inv){E.inv=Object.values(E.bag).filter(Boolean).map(x=>({...x,uid:Math.random().toString(36).slice(2)}))}return E}
function refreshBest(E){for(const s in E.bag){const c=E.inv.filter(x=>x.slot===s).sort((a,b)=>b.power-a.power)[0];E.bag[s]=c||null}}
setInterval(()=>{const v=W();if(!v||!v.room)return;const r=v.room,k=(r.totalKills||0)+r.killed+(r.stage||0)*1000;const d=Math.max(0,k-lastK);lastK=k;if(d>500)return;coins+=d*(2+(v.C.region||1));dropAcc+=d;sv('hd.coins',coins);
 while(dropAcc>=60){const {equipOf,genItem,buildEquip,T,JOBS,SK,SLOT_IC,SLOT_ZH,QCOL}=W();dropAcc-=60;const p=r.players[v.C.sel];if(!p)break;const E=inv(p);const ss=Object.keys(E.gear).filter(s=>E.gear[s]);const s=ss[Math.floor(Math.random()*ss.length)];if(E.inv.length<40){E.inv.push({...genItem(p,s,Math.floor(Math.random()*1e6),Math.random()*.9),uid:Math.random().toString(36).slice(2),nw:1});refreshBest(E)}}},1000);
function ar(d){return d>0?`<span class="up">▲${f(d)}</span>`:d<0?`<span class="dn">▼${f(-d)}</span>`:'<span style="color:#8a90a8">＝</span>'}
function bag(body){const {equipOf,genItem,buildEquip,T,JOBS,SK,SLOT_IC,SLOT_ZH,QCOL}=W();const v=W(),p=v.room.players[v.C.sel];const E=inv(p);const d=document.createElement('div');d.className='tmp';body.append(d);
 const draw=()=>{const it=E.inv.slice().sort((a,b)=>(b.power-(E.gear[b.slot]?.power||0))-(a.power-(E.gear[a.slot]?.power||0)));
  d.innerHTML=`<div class="mrow"><span>金幣（遊戲內）</span><b>${f(coins)}</b></div><div class="mrow"><span>分解材料</span><b>${f(mats)}</b></div><div class="mnote">${p.name} 的背包 ${E.inv.length}/40 · 每擊殺 60 隻掉 1 件 · ▲▼ 為與目前穿戴比較</div>`+
  (it.length?it.map(x=>{const g=E.gear[x.slot],df=x.power-(g?g.power:0);return `<div class="bagi"><div class="ico q-${x.q}">${SLOT_IC[x.slot]}</div><div class="bn"><span style="color:${QCOL[x.q]}">[${x.q}]</span> ${x.name} +${x.refine}${x.nw?' <i class="nw">NEW</i>':''}<small>${SLOT_ZH[x.slot]} · 戰力 ${f(x.power)} ${ar(df)}${x.aff.map(a=>' · '+a.n.replace(' %','')+' '+a.v).join('')}</small></div><div class="bb"><button class="mbtn" data-a="eq" data-u="${x.uid}">裝備</button><button data-a="sell" data-u="${x.uid}">賣 ${f(sellP(x))}</button><button data-a="sal" data-u="${x.uid}">分解</button></div></div>`}).join(''):'<div class="mnote">背包是空的，繼續割草會掉裝備。</div>')+
  `<div class="bball"><button data-a="sellw">一鍵賣出較差的 SR</button><button data-a="salw">一鍵分解較差的</button></div><div class="mnote">目前存在這支手機的瀏覽器；伺服器上線後改為帳號存檔。UR 可上交易所（鑽石），SR 以下綁定。</div>`;
  E.inv.forEach(x=>delete x.nw)};
 d.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a,i=E.inv.findIndex(x=>x.uid===b.dataset.u),x=E.inv[i];
  if(a==='eq'&&x){const old=E.gear[x.slot];E.gear[x.slot]=x;E.inv.splice(i,1);if(old)E.inv.push({...old,uid:Math.random().toString(36).slice(2)})}
  if(a==='sell'&&x){coins+=sellP(x);E.inv.splice(i,1)}if(a==='sal'&&x){mats+=salP(x);E.inv.splice(i,1)}
  if(a==='sellw'||a==='salw'){E.inv=E.inv.filter(x=>{const g=E.gear[x.slot];const bad=g&&x.power<=g.power&&(a==='salw'||x.q==='SR');if(bad){if(a==='sellw')coins+=sellP(x);else mats+=salP(x)}return !bad})}
  sv('hd.coins',coins);sv('hd.mats',mats);refreshBest(E);try{W().buildEquip()}catch(_){}draw()};draw()}
const sellP=x=>Math.round(x.power*({SR:.2,SSR:.5,UR:1.5}[x.q])),salP=x=>({SR:1,SSR:4,UR:15}[x.q])+x.refine;
function char(body){const {equipOf,genItem,buildEquip,T,JOBS,SK,SLOT_IC,SLOT_ZH,QCOL}=W();const v=W(),p=v.room.players[v.C.sel],J=JOBS[p.job]||{},R=T.roles[J.role]||{};const E=equipOf(p);const pw=Object.values(E.gear).reduce((a,x)=>a+(x?x.power:0),0);
 const tc={};(J.kit||[]).forEach(id=>((SK[id]||{}).tags||[]).forEach(t=>tc[t]=(tc[t]||0)+1));const aff=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>TAGZ[x[0]]||x[0]);
 const pc=x=>(x>=1?'+':'')+Math.round((x-1)*100)+'%';const d=document.createElement('div');d.className='tmp';
 d.innerHTML=`<div class="chd"><b>${p.name}</b><span>${J.name||p.job} · ${ROLE_ZH[J.role]||J.role}</span></div>
 <div class="ph2">能力值</div><div class="g2"><div class="mrow"><span>生命</span><b>${Math.round(p.hp)} / ${Math.round(p.maxhp)}</b></div><div class="mrow"><span>攻擊</span><b>${Math.round(p.atk||0)}</b></div><div class="mrow"><span>防禦</span><b>${p.def?Math.round(p.def):pc(R.def||1)}</b></div><div class="mrow"><span>爆擊率</span><b>${Math.round((J.crit||0)*100)}%</b></div><div class="mrow"><span>射程</span><b>${J.range||'-'}</b></div><div class="mrow"><span>裝備戰力</span><b>${f(pw)}</b></div></div>
 <div class="ph2">職業定位</div><div class="mrow"><span>生命 / 防禦</span><b>${pc(R.hp||1)} / ${pc(R.def||1)}</b></div><div class="mrow"><span>傷害 / 仇恨</span><b>${pc((R.dmg||1)*((T.roles.classDmgDeal||{})[p.job]||1))} / ×${R.threat||1}</b></div><div class="mrow"><span>承受傷害</span><b>${pc((T.roles.classDmgTaken||{})[p.job]||1)}</b></div>
 <div class="ph2">核心被動</div><div class="mnote" style="color:#262b40">${PASS[J.role]||'—'}</div>
 <div class="ph2">技能親和</div><div class="mnote" style="color:#262b40">${aff.join('、')||'—'} 技能 100% 效果；非親和技能約 70%</div>
 <div class="ph2">可用武器（半綁定）</div><div class="wch">${(J.weap||[]).map(w=>`<span>${WZ[w]||w}</span>`).join('')}</div>
 <div class="ph2">本場</div><div class="mrow"><span>倒地</span><b>${p.deaths||0}</b></div>${typeof offTotHTML==='function'?offTotHTML():''}`;body.append(d)}
window.HDX={bag,char}})();
