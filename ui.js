/* Aurevia horde — UI layer: menu bar, status panel, hotbar, floating XP-style windows (equip / skills / map+codex / drops / help).
 * Talks to horde.js through HD.core (state + actions). All numbers are prototype/fake. */
window.HD=window.HD||{};
HD.UI=(function(){
let C=null,D=null,Art=null,ME=null,S=null;const MOBILE=/mobile/.test(location.search)?/mobile=1/.test(location.search):(matchMedia('(max-width:600px)').matches||(matchMedia('(pointer:coarse)').matches&&innerWidth<=820));
const $=s=>document.querySelector(s),fmt=n=>Math.round(n).toLocaleString('en-US');
const W={};let zTop=60,sel=null,selSlot=null,dirtyDrops=true,stat=null,hb=null,toastT=0;
const GD=t=>D.GRADES[t].d;
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
// ---------- icons ----------
function iconHTML(it,sz){return `<canvas class="ic" data-i="${it.id}" width="${sz*2}" height="${sz*2}" style="width:${sz}px;height:${sz}px"></canvas>`}
function skHTML(sk,sz){return `<canvas class="ic" data-s="${sk.id}" width="${sz*2}" height="${sz*2}" style="width:${sz}px;height:${sz}px"></canvas>`}
function mobHTML(ty,sz){return `<canvas class="ic" data-m="${ty.id}" width="${sz*2}" height="${sz*2}" style="width:${sz}px;height:${sz}px"></canvas>`}
function paint(root){
  root.querySelectorAll('canvas.ic').forEach(cv=>{const x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);x.imageSmoothingEnabled=true;
    if(cv.dataset.i){x.drawImage(Art.itemIcon(D.ITEMS[cv.dataset.i],S.mf),0,0,cv.width,cv.height)}
    else if(cv.dataset.s){const [job,i]=cv.dataset.s.split('_');x.drawImage(Art.skillIcon(D.SKILLS[job][+i],D.EL),0,0,cv.width,cv.height)}
    else if(cv.dataset.m){const ty=S.types[cv.dataset.m];if(!ty)return;x.imageSmoothingEnabled=false;const sc=Math.min(cv.width/ty.fw,cv.height/ty.fh)*.95,dw=ty.fw*sc,dh=ty.fh*sc;x.drawImage(ty.cv,0,0,ty.fw,ty.fh,(cv.width-dw)/2,cv.height-dh-2,dw,dh)}})}
// ---------- window manager ----------
function mk(id,title,ic,w,pos){
  const e=el('div','win fw hidden');e.id='fw-'+id;e.style.width=w+'px';
  e.innerHTML=`<div class="tb"><span class="ic">${ic}</span><span class="ttl">${title}</span><span class="wb"><button data-x aria-label="關閉">✕</button></span></div><div class="bd fwb"></div>`;
  e.addEventListener('pointerdown',()=>front(e),true);e.querySelector('[data-x]').onclick=()=>close(id);
  (MOBILE?document.body:$('#wrap')).appendChild(e);
  const o={id,e,body:e.querySelector('.fwb'),pos,open:false};W[id]=o;
  if(!MOBILE){const tb=e.querySelector('.tb');let dx,dy,drag=false;tb.addEventListener('pointerdown',ev=>{if(ev.target.closest('button'))return;drag=true;dx=ev.clientX-e.offsetLeft;dy=ev.clientY-e.offsetTop;tb.setPointerCapture(ev.pointerId)});
    tb.addEventListener('pointermove',ev=>{if(!drag)return;const wr=$('#wrap');e.style.left=Math.max(0,Math.min(wr.clientWidth-80,ev.clientX-dx))+'px';e.style.top=Math.max(0,Math.min(wr.clientHeight-30,ev.clientY-dy))+'px';e.style.right='auto'});
    tb.addEventListener('pointerup',()=>drag=false)}
  return o}
function front(e){e.style.zIndex=++zTop}
const RENDER={};
function open(id){const o=W[id];if(!o)return;if(MOBILE)Object.values(W).forEach(x=>{if(x!==o&&x.open)close(x.id)});o.open=true;o.e.classList.remove('hidden');front(o.e);
  if(!MOBILE&&!o.placed){o.placed=true;const wr=$('#wrap');o.e.style.left=Math.max(6,Math.min(wr.clientWidth-o.e.offsetWidth-6,o.pos[0]<0?wr.clientWidth+o.pos[0]-o.e.offsetWidth:o.pos[0]))+'px';o.e.style.top=o.pos[1]+'px'}
  RENDER[id]();updMenu()}
function close(id){const o=W[id];if(!o)return;o.open=false;o.e.classList.add('hidden');updMenu()}
function toggle(id){W[id].open?close(id):open(id)}
function updMenu(){document.querySelectorAll('#menubar [data-w]').forEach(b=>b.classList.toggle('on',!!(W[b.dataset.w]&&W[b.dataset.w].open)))}
// ---------- item helpers ----------
const it_=inst=>D.ITEMS[inst.id];
const nm=inst=>(inst.ref?'+'+inst.ref+' ':'')+it_(inst).n;
function statLines(inst,cmp){const it=it_(inst),rm=1+(inst.ref||0)*.07,o=[];
  for(const k in it.s){const v=(k==='atk'||k==='matk'||k==='def')?Math.round(it.s[k]*rm):it.s[k];let d='';
    if(cmp){const c=it_(cmp),cv=c.s[k]!=null?((k==='atk'||k==='matk'||k==='def')?Math.round(c.s[k]*(1+(cmp.ref||0)*.07)):c.s[k]):0;const df=v-cv;d=df?` <i class="${df>0?'up':'dn'}">${df>0?'▲':'▼'}${Math.abs(df)}</i>`:''}
    o.push(`<span>${D.STAT_N[k]} <b>+${v}</b>${d}</span>`)}return o.join('')}
function compareTarget(inst){const sl=it_(inst).slot;if(sl==='acc')return ME.equip.acc1||ME.equip.acc2||null;return ME.equip[sl]||null}
// ---------- equip window ----------
RENDER.equip=function(){
  const o=W.equip,g=ME.st;
  let h='<div class="eq-top"><div class="eq-slots">';
  for(const sl of D.SLOTS){const x=ME.equip[sl.id];h+=`<button class="slot${x?' has':''}${selSlot===sl.id?' sel':''}" data-slot="${sl.id}" style="--gc:${x?GD(it_(x).tier):'#98a2c0'}"><span class="sn">${sl.n}</span>${x?iconHTML(it_(x),30)+`<span class="in" style="color:${GD(it_(x).tier)}">${nm(x)}</span>`:'<span class="empty">—</span>'}</button>`}
  h+=`</div><div class="eq-stats"><div class="eq-h">${D.JOBS[ME.job].n} Lv.${ME.lv}</div>
   <div><span>ATK</span><b>${fmt(ME.atk)}</b></div><div><span>MATK</span><b>${fmt(ME.matk)}</b></div><div><span>DEF</span><b>${fmt(ME.def)}</b></div><div><span>MaxHP</span><b>${fmt(ME.maxhp)}</b></div><div><span>MaxSP</span><b>${fmt(ME.maxsp)}</b></div><div><span>暴擊</span><b>${ME.crit}%</b></div><div><span>攻速</span><b>+${ME.aspd}%</b></div>
   <div class="eq-aura">裝備光環：<b style="color:${GD(ME.aura)}">${D.GRADES[ME.aura].n}</b></div></div></div>`;
  h+=`<div class="bag-h"><b>背包</b> <small>${ME.bag.length}/70</small><span class="sp"></span><button class="mini" data-sell="0">賣普通</button><button class="mini" data-sell="1">賣優良↓</button></div><div class="bag">`;
  const sorted=ME.bag.slice().sort((a,b)=>it_(b).tier-it_(a).tier||it_(a).slot.localeCompare(it_(b).slot));
  for(const x of sorted){const t=it_(x).tier;h+=`<button class="bi${sel===x.u?' sel':''}" data-u="${x.u}" title="${nm(x)}" style="--gc:${GD(t)}">${iconHTML(it_(x),30)}${x.ref?`<i class="rf">+${x.ref}</i>`:''}</button>`}
  if(!ME.bag.length)h+='<div class="note">背包是空的，去打怪吧。</div>';
  h+='</div><div class="eq-detail" id="eq-detail"></div>';
  o.body.innerHTML=h;paint(o.body);detail();
  o.body.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;
    if(b.dataset.slot){selSlot=b.dataset.slot;sel=null;if(ME.equip[selSlot]){RENDER.equip()}else{selSlot=null;RENDER.equip()}}
    else if(b.dataset.u){sel=+b.dataset.u;selSlot=null;RENDER.equip()}
    else if(b.dataset.sell!=null){const r=C.sellCommon(+b.dataset.sell);sel=null;toast(r.n?`賣出 ${r.n} 件，獲得 ${fmt(r.z)} zeny`:'沒有可賣的物品');RENDER.equip();hudTick()}
    else if(b.dataset.act==='equip'){const x=ME.bag.find(v=>v.u===sel);if(x){C.equipItem(x);sel=null}}
    else if(b.dataset.act==='sell'){const x=ME.bag.find(v=>v.u===sel);if(x){const z=C.sellInst(x);toast('賣出 '+nm(x)+' +'+fmt(z)+' z');sel=null;RENDER.equip();hudTick()}}
    else if(b.dataset.act==='unequip'){C.unequip(selSlot);selSlot=null}}
};
function detail(){
  const d=$('#eq-detail');if(!d)return;let inst=null,eq=false;
  if(sel!=null)inst=ME.bag.find(v=>v.u===sel);else if(selSlot){inst=ME.equip[selSlot];eq=true}
  if(!inst){d.innerHTML='<div class="note">點選背包或裝備欄的物品查看詳情。</div>';return}
  const it=it_(inst),cmp=eq?null:compareTarget(inst);
  d.innerHTML=`<div class="dt-h">${iconHTML(it,34)}<div><b style="color:${GD(it.tier)}">${nm(inst)}</b><br><small>${D.GRADES[it.tier].n} · ${(D.SLOTS.find(s=>s.id===(it.slot==='acc'?'acc1':it.slot))||{}).n||''}${it.kind==='helm'||it.kind==='armor'?'':''}</small></div></div><div class="dt-s">${statLines(inst,cmp)}</div>
   <div class="dt-b">${eq?'<button class="btn" data-act="unequip">卸下</button>':`<button class="btn go2" data-act="equip">裝備</button><button class="btn" data-act="sell">出售 ${fmt(D.sellValue(Object.assign({},it,{ref:inst.ref})))} z</button>`}</div>`;
  paint(d)}
// ---------- skill window ----------
const KDESC={bolt:'連續射出 {cnt} 發單體彈道，命中後小範圍爆開。',nova:'以中心點引爆範圍傷害，波及周圍多隻怪物。',pillar:'先標出落點，短暫後落下光柱／雷柱，範圍傷害。',meteor:'召喚 {cnt} 顆隕落物砸向目標周圍，附帶餘燼。',arrows:'箭雨覆蓋目標區域，分兩段命中。',wave:'向前方揮出貫穿斬擊波，打穿一整排。',heal:'治療範圍內的隊友（回復 28% 最大 HP）。',buff:'提升自身攻擊 30%，持續 12 秒。',chain:'閃電般在怪物間連鎖跳躍，最多 {cnt} 隻，適合清群與連殺。'};
const elRow=el_=>{const ro=D.EL2RO[el_];return ro?D.RO_EL_N[ro]:'—'};
RENDER.skills=function(){
  const o=W.skills,L=D.SKILLS[ME.job],J=D.JOBS[ME.job];
  let h=`<div class="jobs">`+Object.keys(D.JOBS).map(j=>`<button class="mini${j===ME.job?' on':''}" data-job="${j}" title="${D.JOBS[j].role}">${D.JOBS[j].n}</button>`).join('')+`</div>
   <div class="job-d"><b>${J.n}</b> <em>${J.role}</em><br><small>${J.d}</small></div>
   <div class="sk-row"><span>外觀</span><button class="mini${ME.g==='f'?' on':''}" data-g="f">♀</button><button class="mini${ME.g==='m'?' on':''}" data-g="m">♂</button><span class="sp"></span><small>Zeny <b>${fmt(ME.zeny)}</b>　SP ${Math.floor(ME.sp)}/${ME.maxsp}</small></div><div class="sk-list">`;
  L.forEach((sk,i)=>{const el_=D.EL[sk.el]||D.EL.phys,lv=C.slv(sk),max=lv>=C.SKMAX,cost=C.skCost(lv),cnt=sk.cnt+((lv-1)>>1);
    h+=`<div class="sk"><div class="sk-i">${skHTML(sk,38)}<span class="k">${i+1}</span></div><div class="sk-m"><b>${sk.n}</b> <em style="background:${el_.c1}">${elRow(sk.el)}</em><small>${D.K[sk.kind]}</small> <span class="lvb">Lv ${lv}/${C.SKMAX}</span>
     <div class="sk-d">${(KDESC[sk.kind]||'').replace('{cnt}',cnt)}</div><div class="sk-s">CD ${C.cdOf(sk).toFixed(1)}s · SP ${sk.sp}${sk.mul?` · 倍率 ×${(sk.mul*(1+.2*(lv-1))).toFixed(2)}`:''}</div></div>
     <div class="sk-c"><label><input type="checkbox" data-auto="${i}" ${ME.auto[i]?'checked':''}> 自動</label><button class="btn" data-cast="${i}">施放</button><button class="btn up${!max&&ME.zeny>=cost?' go2':''}" data-up="${i}" ${max||ME.zeny<cost?'disabled':''}>${max?'已滿級':'升級 '+fmt(cost)+'z'}</button></div></div>`});
  h+='</div><div class="sk-buffs" id="sk-buffs"></div><div class="note small">技能升級：每級傷害 +20%、冷卻縮短、範圍加大，偶數級多一發／一隻。屬性剋制看「地圖與圖鑑」的怪物弱點。換職業不會重置等級與裝備。</div>';
  o.body.innerHTML=h;paint(o.body);buffsHTML();
  o.body.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;
    if(b.dataset.job){C.setSelfJob(b.dataset.job,ME.g);RENDER.skills()}
    else if(b.dataset.g){C.setSelfJob(ME.job,b.dataset.g);RENDER.skills()}
    else if(b.dataset.up!=null){if(C.upgradeSkill(+b.dataset.up))toast('技能升級！')}
    else if(b.dataset.cast!=null)C.castSelf(+b.dataset.cast)};
  o.body.onchange=ev=>{const c=ev.target.closest('[data-auto]');if(c){ME.auto[+c.dataset.auto]=c.checked?1:0;C.save();hbSync()}}}
function buffsHTML(){const e=$('#sk-buffs');if(!e)return;e.innerHTML=ME.buffs.length?'增益中：'+ME.buffs.map(b=>`<span class="bf">${b.n} ${Math.ceil(b.left)}s</span>`).join(''):''}
// ---------- map + codex ----------
RENDER.map=function(){
  const o=W.map,cur=D.mapById(S.mapId),T=D.TIERS[cur.tier-1];
  let h='<div class="maps">';
  for(const mp of D.MAPS){const t=D.TIERS[mp.tier-1];h+=`<button class="mp${mp.id===cur.id?' cur':''}" data-map="${mp.id}"><b>${mp.n}</b><small>${t.name} · Lv ${mp.lv}</small><small>BOSS：${mp.boss.n}</small>${mp.id===cur.id?'<em>目前位置</em>':'<em class="gt">前往</em>'}</button>`}
  h+=`</div><div class="cx-h"><b>怪物圖鑑</b> <small>${cur.n} · ${T.name}（${D.ORDER.length} 種）</small></div><div class="codex">`;
  const wsum=cur.w.reduce((a,b)=>a+b,0);
  D.ORDER.forEach((tpl,i)=>{const id='t'+T.id+'_'+(tpl==='blob'?'slime':tpl),ty=S.types[id],def=D.MOBS[id];if(!def)return;
    const b=def.bal;let wk='',rs='';if(b){const e=Object.entries(b.tbl);wk=e.filter(([k,v])=>v>=130&&k!=='neutral').sort((x,y)=>y[1]-x[1]).map(([k,v])=>D.RO_EL_N[k]+v).join(' ');rs=e.filter(([k,v])=>v<=50).map(([k,v])=>D.RO_EL_N[k]+v).join(' ')}
    h+=`<div class="cx"><div class="cx-i">${ty?mobHTML(ty,44):''}</div><div class="cx-t"><b>${def.n}</b>${b?` <em class="elb">${D.RO_EL_N[b.el]}${b.elLv}</em>`:''}<small>${D.behName[def.beh]}・${def.tag}${b?'・'+({small:'小型',medium:'中型',large:'大型'}[b.size]||'')+' DEF '+b.def:''}</small>
     <small>出現 ${Math.round(cur.w[i]/wsum*100)}% · 掉 ${def.mat} ${b?Math.round(b.drops.mat*100)+'%':''}${b?'・'+b.drops.ess+' '+Math.round(b.drops.mat2*100)+'%':''}</small>${wk?`<small class="wk">弱點：${wk}${rs?'　抗性：'+rs:''}</small>`:''}</div></div>`});
  h+='</div>';o.body.innerHTML=h;paint(o.body);
  o.body.onclick=ev=>{const b=ev.target.closest('[data-map]');if(!b||b.dataset.map===S.mapId)return;C.setMap(b.dataset.map)}}
// ---------- stage window ----------
let stDiff=0;
RENDER.stage=function(){
  const o=W.stage,ST=C.ST,pots=ME.mats['紅色藥水']||0;
  let h=`<div class="stg-top"><div class="stg-mode">${ST.mode==='stage'?`目前：<b style="color:${D.DIFFS[ST.d].c}">${D.DIFFS[ST.d].n}</b> ${ST.si+1} · ${D.MAPS[ST.si].n}（WAVE ${ST.w}/${D.WAVES}）`:'目前：<b>練功模式</b>（無限割草，不會失敗）'}</div>
   <div class="stg-r"><button class="btn${ME.autoPot?' go2':''}" data-act="ap">自動喝水：${ME.autoPot?'開':'關'}</button><span>紅色藥水 <b>${pots}</b></span><button class="btn" data-buy="5">買 5 瓶 300z</button></div></div>
   <div class="stg-tabs">`+D.DIFFS.map(d=>{const lock=!(d.id===0||ME.clr[d.id-1]>=3);return `<button class="mini${stDiff===d.id?' on':''}${lock?' lock':''}" data-d="${d.id}" style="--dc:${d.c}">${lock?'🔒 ':''}${d.n}</button>`}).join('')+`</div>`;
  const dd=D.DIFFS[stDiff],dlock=!(stDiff===0||ME.clr[stDiff-1]>=3);
  h+=`<div class="stg-info">怪物 HP ×${dd.hp}・攻擊 ×${dd.atk}・EXP ×${dd.exp}・掉寶 ×${dd.drop}・精英率 ${Math.round(dd.elite*100)}%+${dlock?`<br><b class="warn">需先通關「${D.DIFFS[stDiff-1].n}」前 3 關</b>`:''}</div><div class="stg-list">`;
  D.MAPS.forEach((mp,si)=>{const un=!dlock&&C.isUnlocked(stDiff,si),cl=ME.clr[stDiff]>si,t=D.TIERS[mp.tier-1];
    h+=`<div class="stg${cl?' cl':''}${un?'':' lk'}"><div class="stg-n"><b>${stDiff===0?'':''}${si+1}. ${mp.n}</b><small>${t.name} · BOSS：${mp.boss.n}</small><small>${D.WAVES} 波（第 ${D.WAVES} 波 BOSS）· 建議裝備：${D.GRADES[Math.min(4,Math.round(si*.5+stDiff*1.1))].n}以上</small></div>
     <div class="stg-b">${cl?'<em class="ok">已通關</em>':''}<button class="btn${un?' go2':''}" data-go="${si}" ${un?'':'disabled'}>${un?(ST.mode==='stage'&&ST.d===stDiff&&ST.si===si?'重新開始':'出擊'):'🔒'}</button></div></div>`});
  h+=`</div><div class="stg-foot"><button class="btn" data-act="free">${ST.mode==='stage'?'放棄討伐，回到練功模式':'練功模式中'}</button></div>
   <div class="note small">規則：只有主角倒下才算失敗（隊友會復活）。每清一波可從 3 張強化中選 1 張（疊至 3 級），通關可得裝備、Zeny、藥水。拖太久怪物會狂暴。熱鍵 <kbd>Q</kbd> 喝藥水。</div>`;
  o.body.innerHTML=h;
  o.body.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.d!=null){stDiff=+b.dataset.d;RENDER.stage()}
    else if(b.dataset.go!=null){C.stageStart(stDiff,+b.dataset.go);close('stage')}
    else if(b.dataset.buy){if(C.buyPotions(5))toast('購買 5 瓶紅色藥水');else toast('Zeny 不足');RENDER.stage()}
    else if(b.dataset.act==='ap'){ME.autoPot=!ME.autoPot;C.save();RENDER.stage()}
    else if(b.dataset.act==='free'){C.setFree();RENDER.stage()}}}
// ---------- drops ----------
RENDER.drops=function(){
  const o=W.drops;dirtyDrops=false;
  let h=`<div class="dr-sum"><span>累計掉落 <b>${fmt(ME.totalDrops)}</b> 件</span><span>Zeny <b>${fmt(ME.zeny)}</b></span><span>擊殺 <b>${fmt(S.kills)}</b></span></div><div class="mats">`;
  const mats=Object.entries(ME.mats).sort((a,b)=>b[1]-a[1]);
  h+=mats.length?mats.map(([k,v])=>`<span class="mt">${k}<b>×${fmt(v)}</b></span>`).join(''):'<span class="note">還沒有素材。</span>';
  h+='</div><div class="dr-list">';
  for(const d of ME.drops.slice(0,60)){h+=`<div class="dr"><span class="ts">${C.Log.clk(d.t)}</span> <span class="mn">${d.mob}</span> → <b style="color:${d.g>=0?GD(d.g):'#2b3558'}">${d.name}</b>${d.n>1?' ×'+d.n:''}${d.g>=3?' ★':''}</div>`}
  if(!ME.drops.length)h+='<div class="note">還沒有掉落紀錄。</div>';
  h+='</div>';o.body.innerHTML=h}
// ---------- help ----------
RENDER.help=function(){
  W.help.body.innerHTML=`<div class="hlp"><p><b>這是什麼？</b> 曙光 Aurevia 的「割草大畫面」原型：一張地圖塞滿角色與怪物，主角自動戰鬥。數值、經驗、掉寶都是假資料，存在你的瀏覽器裡（localStorage）。</p>
   <p><b>怎麼玩</b><br>・畫面下方技能列：<kbd>1</kbd>–<kbd>4</kbd> 手動施放，底下小圓點可切換自動施放。<br>・<kbd>E</kbd> 裝備、<kbd>K</kbd> 技能、<kbd>M</kbd> 地圖／圖鑑、<kbd>L</kbd> 掉落、<kbd>B</kbd> 召喚 BOSS、<kbd>F</kbd> 全螢幕。<br>・地圖分 初／中／高級 三階，每階 12 種怪，行為不同（衝撞、飛行、遠程、固定、厚血…）。</p>
   <p><b>圖像</b> 全部是 Aurevia 原創像素風，不含官方素材。想換成你自己的素材包：把檔案放進 <code>assets/custom/</code> 並寫 <code>manifest.json</code>，詳見 README。</p>
   <p><button class="btn" id="hp-reset">清除存檔重來</button></p></div>`;
  $('#hp-reset').onclick=()=>{if(confirm('清除這個瀏覽器的存檔（等級、裝備、背包）並重新整理？')){try{localStorage.removeItem('aur_horde_v2')}catch(e){}location.reload()}}}
// ---------- stage HUD / combo / banners / perk + result overlays ----------
let sh=null,cmb=null,stk=null,bnr=null,perkov=null,resov=null,lastCb=-1,lastCbF=-1,bT=0,sT=0;
function buildStageUI(){
  const wrap=$('#wrap');
  sh=el('div','hidden','');sh.id='stagehud';wrap.appendChild(sh);
  cmb=el('div','hidden','<div class="cb-n"><span>COMBO</span><b id="cb-n">0</b></div><div class="cb-bar"><i id="cb-f"></i></div><div class="cb-b" id="cb-b"></div>');cmb.id='combo';wrap.appendChild(cmb);
  stk=el('div','hidden','');stk.id='streak';wrap.appendChild(stk);
  bnr=el('div','hidden','');bnr.id='wavebanner';wrap.appendChild(bnr);
  perkov=el('div','hidden','');perkov.id='perkov';wrap.appendChild(perkov);
  resov=el('div','hidden','');resov.id='resultov';wrap.appendChild(resov);
  perkov.onclick=ev=>{const b=ev.target.closest('[data-p]');if(b)C.pickPerk(b.dataset.p)};
  resov.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.act;
    if(a==='retry')C.retryStage();else if(a==='next')C.nextStage();else if(a==='free')C.setFree();else if(a==='skills'){C.setFree();open('skills')}else if(a==='easier'&&C.ST.d>0){C.stageStart(C.ST.d-1,C.ST.si)}
    resov.classList.add('hidden')}}
function perkDesc(pk,l){const a=pk.v[Math.max(0,l-1)],b=pk.v2?pk.v2[Math.max(0,l-1)]:'';return pk.d.replace('{a}',a).replace('{b}',b)}
function stageHud(){
  const ST=C.ST;if(!sh)return;document.body.classList.toggle('stg',ST.mode==='stage'&&ST.state!=='idle');
  if(ST.mode!=='stage'||ST.state==='idle'){sh.classList.add('hidden');cmb.classList.toggle('hidden',!(C.CB.n>=2));return}
  sh.classList.remove('hidden');const d=D.DIFFS[ST.d],mp=D.MAPS[ST.si],boss=ST.w>=D.WAVES;
  const prog=boss?(S.boss?Math.max(0,S.boss.hp/S.boss.maxhp):0):Math.min(1,ST.wk/ST.wt);
  const perks=Object.entries(ST.perks).map(([id,l])=>{const pk=D.PERKS.find(x=>x.id===id);return `<span class="pk" title="${pk.n} Lv${l}：${perkDesc(pk,l)}">${pk.ic}<i>${l}</i></span>`}).join('');
  sh.innerHTML=`<div class="sh-t"><b style="color:${d.c}">${d.n}</b> ${ST.si+1}-${mp.n}<span class="wv">WAVE ${Math.max(1,ST.w)}/${D.WAVES}</span></div>
   <div class="sh-bar${boss?' boss':''}"><i style="width:${prog*100}%"></i><span>${boss?'BOSS 戰':`擊殺 ${Math.min(ST.wk,ST.wt)} / ${ST.wt}`}</span></div>
   <div class="sh-s"><span>精英 ${ST.elites}</span><span>總殺 ${fmt(ST.kills)}</span><span>${Math.floor(ST.elapsed/60)}:${String(Math.floor(ST.elapsed%60)).padStart(2,'0')}</span>${ST.enr>1?`<span class="en">狂暴 ×${ST.enr.toFixed(2)}</span>`:''}${ST.potT>0?`<span>藥水冷卻 ${Math.ceil(ST.potT)}s</span>`:''}</div><div class="sh-p">${perks}</div>`}
function comboUI(n,f){
  if(!cmb)return;const show=n>=2;cmb.classList.toggle('hidden',!show);if(!show){lastCb=-1;return}
  if(n!==lastCb){const b=$('#cb-n');b.textContent=n;lastCb=n;const tier=n>=500?5:n>=200?4:n>=100?3:n>=50?2:n>=25?1:0;cmb.dataset.t=tier;b.classList.remove('pop');b.offsetHeight;b.classList.add('pop');
    const ST=C.ST;$('#cb-b').textContent=`傷害 +${Math.round(Math.min(.35,n*.0025*(ST.perks&&ST.perks.combo&&ST.mode==='stage'?2:1))*100)}%`}
  const q=Math.round(f*20);if(q!==lastCbF){lastCbF=q;$('#cb-f').style.width=(f*100)+'%'}}
function bannerUI(txt,kind){if(!bnr)return;bnr.textContent=txt;bnr.dataset.k=kind||0;bnr.classList.remove('hidden');bnr.style.animation='none';bnr.offsetHeight;bnr.style.animation='';clearTimeout(bT);bT=setTimeout(()=>bnr.classList.add('hidden'),kind===2?2400:1700)}
function streakUI(txt,i){if(!stk)return;stk.textContent=txt;stk.dataset.k=i;stk.classList.remove('hidden');stk.style.animation='none';stk.offsetHeight;stk.style.animation='';clearTimeout(sT);sT=setTimeout(()=>stk.classList.add('hidden'),1500)}
function perkUI(){
  const ST=C.ST;if(!perkov)return;
  if(ST.state!=='perk'||!ST.choices){perkov.classList.add('hidden');return}
  perkov.innerHTML=`<div class="pv-h">WAVE ${ST.w} 清除！選擇一項強化</div><div class="pv-c">`+ST.choices.map(id=>{const pk=D.PERKS.find(x=>x.id===id),l=(ST.perks[id]||0)+1;
    return `<button class="pv" data-p="${id}"><span class="pi">${pk.ic}</span><b>${pk.n}</b><em>Lv ${l}/3</em><small>${perkDesc(pk,l)}</small></button>`}).join('')+`</div><div class="pv-f">本次討伐內有效；已選：${Object.entries(ST.perks).map(([id,l])=>D.PERKS.find(x=>x.id===id).n+l).join('、')||'無'}</div>`;
  perkov.classList.remove('hidden')}
function resultUI(){
  const ST=C.ST,r=ST.res;if(!resov)return;if(!r||ST.mode!=='stage'){resov.classList.add('hidden');return}
  const d=D.DIFFS[r.d],mp=D.MAPS[r.si],tm=`${Math.floor(r.time/60)}:${String(Math.floor(r.time%60)).padStart(2,'0')}`;
  const hasNext=r.win&&(r.si+1<D.MAPS.length?C.isUnlocked(r.d,r.si+1):(r.d<3&&C.isUnlocked(r.d+1,0)));
  resov.innerHTML=`<div class="rs ${r.win?'win':'lose'}"><div class="rs-h">${r.win?'討伐成功！':'討伐失敗'}</div><div class="rs-s"><b style="color:${d.c}">${d.n}</b> ${r.si+1}-${mp.n}${r.win?'':`　止步於 WAVE ${r.w}/${D.WAVES}`}</div>
   <div class="rs-g"><span>擊殺<b>${fmt(r.kills)}</b></span><span>精英<b>${r.elites}</b></span><span>最高連擊<b>${r.peak}</b></span><span>時間<b>${tm}</b></span></div>
   ${r.win?`<div class="rs-r"><div>Zeny <b>+${fmt(r.zeny)}</b>　EXP <b>+${fmt(r.exp)}</b>　紅色藥水 <b>+${r.pots}</b>${r.first?'　<em>首次通關！解鎖下一關</em>':''}</div><div class="rs-d">${r.drops.map(x=>`<span style="color:${GD(x.t)}">${x.n}</span>`).join('、')}</div></div>`:`<div class="rs-r"><div class="hint">💡 ${r.hint}</div></div>`}
   <div class="rs-b">${r.win?(hasNext?'<button class="btn go2" data-act="next">下一關</button>':'')+'<button class="btn" data-act="retry">再挑戰一次</button>':'<button class="btn go2" data-act="retry">重試本關</button>'+(r.d>0?'<button class="btn" data-act="easier">降低難度重試</button>':'')+'<button class="btn" data-act="skills">去強化技能</button>'}<button class="btn" data-act="free">回練功模式</button></div></div>`;
  resov.classList.remove('hidden')}
// ---------- toast ----------
function toast(t){const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),2200)}
// ---------- status panel (sidebar) + hotbar ----------
function buildStat(){
  const w=el('div','win','');w.id='w-stat';
  w.innerHTML=`<div class="tb"><span class="ic">♥</span><span class="ttl">角色狀態</span></div><div class="bd pad st"><div class="st-n" id="st-n"></div>
   <div class="bar hp"><i id="st-hp"></i><span id="st-hpt"></span></div><div class="bar sp"><i id="st-sp"></i><span id="st-spt"></span></div>
   <div class="bar ex"><i id="st-ex"></i><span id="st-ext"></span></div><div class="bar jx"><i id="st-jx"></i><span id="st-jxt"></span></div>
   <div class="st-g" id="st-g"></div><div class="st-z" id="st-z"></div><div class="st-b" id="st-b"></div></div>`;
  $('#side').insertBefore(w,$('#side').firstChild);stat={n:$('#st-n'),hp:$('#st-hp'),hpt:$('#st-hpt'),sp:$('#st-sp'),spt:$('#st-spt'),ex:$('#st-ex'),ext:$('#st-ext'),jx:$('#st-jx'),jxt:$('#st-jxt'),g:$('#st-g'),z:$('#st-z'),b:$('#st-b')}}
function buildHotbar(){
  hb=el('div','','');hb.id='hotbar';
  hb.innerHTML=`<div class="hb-bars"><b id="hb-lv"></b><div class="bar hp"><i id="hb-hp"></i></div><div class="bar sp"><i id="hb-sp"></i></div><div class="bar ex"><i id="hb-ex"></i></div></div><div class="hb-slots" id="hb-slots"></div>`;
  $('#wrap').appendChild(hb);
  hb.addEventListener('click',ev=>{if(ev.target.closest('#hb-pot')){C.drinkPotion();return}const a=ev.target.closest('[data-au]');if(a){ME.auto[+a.dataset.au]=ME.auto[+a.dataset.au]?0:1;C.save();hbSync();return}const s=ev.target.closest('[data-hs]');if(s)C.castSelf(+s.dataset.hs)})}
let ST_pot=null;
function hbSync(){
  const L=D.SKILLS[ME.job],box=$('#hb-slots');box.innerHTML=L.map((sk,i)=>`<div class="hs" data-hs="${i}" title="${sk.n}（SP ${sk.sp}／CD ${sk.cd}s）">${skHTML(sk,MOBILE?36:40)}<i class="cd"></i><span class="k">${i+1}</span><span class="sc">${sk.sp}</span><b class="au${ME.auto[i]?' on':''}" data-au="${i}" title="自動施放">A</b></div>`).join('')+'<div class="hs pot" id="hb-pot" title="紅色藥水（Q）：回復 40% HP"></div>';ST_pot=$('#hb-pot');paint(box)}
function hudTick(){
  if(!stat)return;const c=C.chars()[0];
  stat.n.innerHTML=`<b>測試冒險者</b> <span>${D.JOBS[ME.job].n}</span> <em>Lv ${ME.lv} / Job ${ME.jlv}</em>`;
  const hp=c?Math.max(0,c.hp/c.maxhp):1,sp=ME.sp/ME.maxsp,ex=ME.exp/C.expNext(ME.lv),jx=ME.jlv>=50?1:ME.jexp/C.jexpNext(ME.jlv);
  stat.hp.style.width=hp*100+'%';stat.hp.parentNode.classList.toggle('low',hp<.3);stat.hpt.textContent=`HP ${fmt(c?c.hp:ME.maxhp)} / ${fmt(ME.maxhp)}`;stat.sp.style.width=sp*100+'%';stat.spt.textContent=`SP ${Math.floor(ME.sp)} / ${ME.maxsp}`;
  stat.ex.style.width=ex*100+'%';stat.ext.textContent=`Base ${(ex*100).toFixed(1)}%`;stat.jx.style.width=jx*100+'%';stat.jxt.textContent=ME.jlv>=50?'Job MAX':`Job ${(jx*100).toFixed(1)}%`;
  stat.g.innerHTML=`<span>ATK <b>${fmt(ME.atk)}</b></span><span>MATK <b>${fmt(ME.matk)}</b></span><span>DEF <b>${fmt(ME.def)}</b></span><span>CRI <b>${ME.crit}%</b></span><span>ASPD <b>+${ME.aspd}%</b></span>`;
  stat.z.innerHTML=`Zeny <b>${fmt(ME.zeny)}</b>`;stat.b.innerHTML=ME.buffs.map(b=>`<span class="bf">${b.n} ${Math.ceil(b.left)}s</span>`).join('');
  if(ST_pot){const n=ME.mats['紅色藥水']||0,t=C.ST.potT;ST_pot.innerHTML=`🧪<b>${n}</b>${t>0?`<i>${Math.ceil(t)}</i>`:''}<span class="k">Q</span>`;ST_pot.classList.toggle('cd',t>0||n<1)}
  if($('#hb-lv')){$('#hb-lv').textContent='Lv'+ME.lv;$('#hb-hp').style.width=hp*100+'%';$('#hb-sp').style.width=sp*100+'%';$('#hb-ex').style.width=ex*100+'%'}
  const L=D.SKILLS[ME.job];document.querySelectorAll('#hb-slots .hs[data-hs]').forEach((e,i)=>e.classList.toggle('nosp',ME.sp<L[i].sp))}
function onKey(e){if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();if(k>='1'&&k<='4'){C.castSelf(+k-1);return}
  const m={e:'equip',k:'skills',m:'map',s:'stage',l:'drops',h:'help'}[k];if(m){toggle(m);e.preventDefault()}
  else if(e.key==='Escape')Object.keys(W).forEach(close)}
// ---------- public ----------
function init(core){
  C=core;D=C.D;Art=C.Art;ME=C.ME;S=C.S;
  const mb=el('div','','');mb.id='menubar';mb.innerHTML=[['stage','討伐','S'],['equip','裝備','E'],['skills','技能','K'],['map','地圖','M'],['drops','掉落','L'],['help','說明','H']].map(([w,n,k])=>`<button class="mb" data-w="${w}">${n}<kbd>${k}</kbd></button>`).join('');
  const st=$('.scene-tools');st.parentNode.insertBefore(mb,st);mb.onclick=ev=>{const b=ev.target.closest('[data-w]');if(b)toggle(b.dataset.w)};
  mk('stage','討伐（關卡）','⚑',MOBILE?0:400,[-10,34]);mk('equip','裝備與背包','⚔',MOBILE?0:310,[10,34]);mk('skills','技能','✦',MOBILE?0:350,[-10,34]);mk('map','地圖與圖鑑','◈',MOBILE?0:380,[-10,34]);mk('drops','掉落紀錄','❖',MOBILE?0:340,[10,34]);mk('help','說明','?',MOBILE?0:340,[-10,34]);
  if(MOBILE)Object.values(W).forEach(o=>{o.e.style.width=''});
  const t=el('div','','');t.id='toast';$('#wrap').appendChild(t);
  buildStat();buildStageUI();buildHotbar();hbSync();hudTick();addEventListener('keydown',onKey);
  const q=new URLSearchParams(location.search).get('open');if(q&&W[q])open(q)}
return {init,
  refresh(){if(!stat)return;hbSync();hudTick();for(const id in W)if(W[id].open&&id!=='drops')RENDER[id]()},
  jobChanged(){if(!stat)return;hbSync()},
  mapChanged(){if(!stat)return;toast('移動到 '+D.mapById(S.mapId).n);if(W.map&&W.map.open)RENDER.map()},
  levelUp(){if(!stat)return;toast('★ Base Lv 升到 '+ME.lv+'！')},
  onCast(i,cd){if(!stat)return;const e=document.querySelector(`#hb-slots [data-hs="${i}"] .cd`);if(!e)return;e.style.animation='none';e.offsetHeight;e.style.animation=`hbcd ${cd}s linear forwards`},
  dirty(){dirtyDrops=true},
  banner:bannerUI,streak:streakUI,combo:comboUI,perk:perkUI,result:resultUI,
  stage(){if(!stat)return;stageHud();if(W.stage&&W.stage.open)RENDER.stage()},
  stageStarted(){if(!stat)return;perkUI();resultUI()},
  potion(){if(!stat)return;hudTick()},
  hud(){hudTick();stageHud();if(W.drops&&W.drops.open&&dirtyDrops)RENDER.drops();if(W.skills&&W.skills.open)buffsHTML()},
  open,close,toggle};
})();
