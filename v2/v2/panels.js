/* r15: rich mobile panels — 裝備 / 背包 / 隊伍 (client UI only) */
;(function(){
const W=()=>window.__v2,X=()=>window.HDX;
const ROLE_ZH={tank:'坦克',subtank:'副坦',bruiser:'鬥士',std:'輸出',glass:'玻璃大砲',healer:'治療',support:'輔助'};
const QN={SR:'稀有',SSR:'史詩',UR:'傳說'};
const f=n=>W().fmt(n);
function stars(n){return n?'<i class="stz">'+'★'.repeat(Math.min(5,n))+'<u>'+'★'.repeat(Math.max(0,5-n))+'</u></i>':'<i class="stz"><u>★★★★★</u></i>'}
function tile(it,s,extra){const v=W();if(!it)return `<div class="eqt q-EMPTY">${v.SLOT_IC[s]}<em>${v.SLOT_ZH[s]}</em></div>`;
 return `<div class="eqt q-${it.q}">${v.SLOT_IC[it.slot]}<span class="pl">+${it.refine}</span>${it.stars?`<span class="sb">${'★'.repeat(Math.min(5,it.stars))}</span>`:''}${extra||''}</div>`}
function portrait(job){const v=W();try{const k=v.sheetKey(job,'m'),sh=v.imgs.sheets[k];if(!sh)return '';const S=46,sc=S/sh.ch,n=Math.round(2816/sh.cw);return `<div class="por" style="background-image:url(assets/chars/${sh.file});background-size:${Math.round(n*sh.cw*sc)}px ${S}px;background-position:${-Math.round((sh.act.idle.s)*sh.cw*sc)}px 0"></div>`}catch(e){return ''}}
function arw(d,dec){if(!d)return '<span class="eq0">＝</span>';const a=Math.abs(d);return `<span class="${d>0?'up':'dn'}">${d>0?'▲':'▼'}${dec?a.toFixed(1):f(a)}</span>`}
// detail card; cmp = item to compare against (or null)
function card(it,cmp,title){const v=W();if(!it)return '';
 const ca={};(cmp?cmp.aff:[]).forEach(a=>ca[a.n]=a.v);const ia={};it.aff.forEach(a=>ia[a.n]=a.v);
 const names=[...new Set([...it.aff.map(a=>a.n),...(cmp?cmp.aff.map(a=>a.n):[])])];
 return `<div class="icard q-${it.q}">${title?`<div class="ict">${title}</div>`:''}<div class="ich">${tile(it,it.slot)}<div class="icn"><b style="color:${v.QCOL[it.q]}">${it.name} <span>+${it.refine}</span></b><small><span class="qb q-${it.q}">${it.q} ${QN[it.q]}</span> ${v.SLOT_ZH[it.slot]}${it.asc?' · 昇華 '+['','Ⅰ','Ⅱ','Ⅲ'][it.asc]:''}</small>${stars(it.stars)}</div><div class="icp"><i>戰力</i><b>${f(it.power)}</b>${cmp?arw(it.power-cmp.power):''}</div></div>
 <div class="ics"><div><span>基礎攻擊</span><b>${f(it.base)}</b>${cmp?arw(it.base-cmp.base):''}</div><div><span>強化 +${it.refine}</span><b>×${it.rm.toFixed(2)}</b>${cmp?arw(it.refine-cmp.refine):''}</div><div><span>品質 ${it.q}</span><b>×${it.qm.toFixed(2)}</b></div><div><span>星級 ${it.stars}★</span><b>×${it.sm.toFixed(2)}</b>${cmp?arw(it.stars-cmp.stars):''}</div></div>
 <div class="ica"><div class="icah">詞綴</div>${names.map(n=>{const a=ia[n],b=ca[n];const has=a!=null;return `<div class="${has?'':'gone'}"><span>◆ ${n.replace(' %','').replace(' %/秒','')}</span><b>${has?(a>0?'+':'')+a+(n.includes('%')?'%':''):'—'}</b>${cmp?arw((a||0)-(b||0),1):''}</div>`}).join('')||'<div class="gone"><span>無</span></div>'}</div>
 ${it.set?`<div class="icset">套裝：${it.set}</div>`:''}</div>`}
const st={eq:'wpn',bagU:null,bagF:'all'};
function E(){const v=W(),p=v.room.players[v.C.sel];return {v,p,E:X().inv(p)}}
function bestInv(Ei,s){return Ei.inv.filter(x=>x.slot===s).sort((a,b)=>b.power-a.power)[0]}
function equip(body){body.scrollTop=0;const d=document.createElement('div');d.className='tmp';body.append(d);
 const draw=()=>{const {v,p,E:Ei}=E();const slots=Object.keys(v.T.equip_budget.slots);const tot=Object.values(Ei.gear).reduce((a,x)=>a+(x?x.power:0),0);
  const it=Ei.gear[st.eq],b=bestInv(Ei,st.eq);
  d.innerHTML=`<div class="eqhd">${portrait(p.job)}<div><b>${p.name}</b><small>${v.JOBS[p.job].name}</small></div><div class="cpw"><i>裝備總戰力</i><b>${f(tot)}</b></div></div>
  <div class="eqg">${slots.map(s=>{const g=Ei.gear[s],bb=bestInv(Ei,s),up=g&&bb&&bb.power>g.power;return `<button class="eqc${st.eq===s?' on':''}" data-s="${s}">${tile(g,s,up?'<span class="upd">▲</span>':'')}<span class="eqn">${v.SLOT_ZH[s]}</span><span class="eqp">${g?f(g.power):'—'}</span></button>`}).join('')}</div>
  ${it?card(it,null,'目前穿戴 · '+v.SLOT_ZH[st.eq])+(window.HDF?HDF.html(it):''):`<div class="mnote">${v.JOBS[p.job].name} 不能裝備${v.SLOT_ZH[st.eq]}。</div>`}
  ${b?card(b,it,'背包最佳 · 與穿戴比較')+`<div class="bball"><button class="mbtn" data-a="eq" data-u="${b.uid}">換上這件 ${arw(b.power-(it?it.power:0))}</button></div>`:it?'<div class="mnote">背包沒有這個部位的裝備，繼續割草會掉落。</div>':''}`};
 d.onclick=e=>{const fg=e.target.closest('[data-fg]');if(fg){const {E:Ei}=E();HDF.act(fg.dataset.fg,Ei.gear[st.eq]);try{W().buildEquip()}catch(_){}draw();return}const c=e.target.closest('[data-s]');if(c){st.eq=c.dataset.s;window.HDF&&HDF.clear();draw();return}const b=e.target.closest('button[data-a]');if(!b)return;const {E:Ei}=E();const i=Ei.inv.findIndex(x=>x.uid===b.dataset.u),x=Ei.inv[i];if(x){const old=Ei.gear[x.slot];Ei.gear[x.slot]=x;Ei.inv.splice(i,1);if(old)Ei.inv.push({...old,uid:old.uid||Math.random().toString(36).slice(2)});X().refreshBest(Ei);try{W().buildEquip()}catch(_){}draw()}};draw()}
function bag(body){body.scrollTop=0;const d=document.createElement('div');d.className='tmp';body.append(d);
 const draw=()=>{const {v,p,E:Ei}=E(),H=X(),S=H.st;const slots=Object.keys(v.T.equip_budget.slots);
  const list=Ei.inv.filter(x=>st.bagF==='all'||x.slot===st.bagF||(st.bagF==='up'&&x.power>(Ei.gear[x.slot]?.power||0))).sort((a,b)=>({UR:3,SSR:2,SR:1}[b.q]-{UR:3,SSR:2,SR:1}[a.q])||b.power-a.power);
  const sel=Ei.inv.find(x=>x.uid===st.bagU);
  d.innerHTML=`<div class="bgs"><div><img src="v2/ic/ic_bag.webp" alt=""><span>金幣</span><b>${f(S.coins)}</b></div><div><img src="v2/ic/ic_equip.webp" alt=""><span>強化石</span><b>${f(S.mats)}</b></div><div><img src="v2/ic/ic_char.webp" alt=""><span>容量</span><b>${Ei.inv.length}/40</b></div></div>
  <div class="lchips">${[['all','全部'],['up','可提升'],...slots.map(s=>[s,v.SLOT_ZH[s]])].map(c=>`<button data-f="${c[0]}" class="${st.bagF===c[0]?'on':''}">${c[1]}</button>`).join('')}</div>
  <div class="bgg">${list.map(x=>{const g=Ei.gear[x.slot],df=x.power-(g?g.power:0);return `<button class="bgc${x.uid===st.bagU?' on':''}" data-u="${x.uid}">${tile(x,x.slot,(df>0?'<span class="upd">▲</span>':'')+(x.nw?'<span class="nwd">N</span>':''))}</button>`}).join('')}${Array.from({length:Math.max(12,Math.ceil(list.length/6)*6)-list.length},()=>'<div class="bgc emp"></div>').join('')}</div>
  ${list.length?'':'<div class="mnote">沒有符合的裝備。</div>'}
  ${sel?card(sel,Ei.gear[sel.slot],'與目前穿戴比較')+`<div class="bgact"><button class="mbtn" data-a="eq">裝備</button><button data-a="sell">賣出 +${f(H.sellP(sel))} 金幣</button><button data-a="sal">分解 +${H.salP(sel)} 強化石</button></div>`:'<div class="mnote">點選裝備查看詳細與比較。▲ = 比目前穿戴更強。</div>'}
  <div class="bball"><button data-a="sellw">一鍵賣出較差 SR</button><button data-a="salw">一鍵分解較差</button></div><div class="mnote">目前存在此瀏覽器；伺服器上線後改為帳號存檔。UR 可上交易所（鑽石），SR 以下綁定。</div>`;
  Ei.inv.forEach(x=>delete x.nw)};
 d.onclick=e=>{const fb=e.target.closest('[data-f]');if(fb){st.bagF=fb.dataset.f;draw();return}const b=e.target.closest('button');if(!b)return;const {E:Ei}=E(),H=X(),S=H.st;
  if(b.dataset.u&&!b.dataset.a){st.bagU=st.bagU===b.dataset.u?null:b.dataset.u;draw();return}
  const a=b.dataset.a,i=Ei.inv.findIndex(x=>x.uid===st.bagU),x=Ei.inv[i];
  if(a==='eq'&&x){const old=Ei.gear[x.slot];Ei.gear[x.slot]=x;Ei.inv.splice(i,1);if(old){const o={...old,uid:old.uid||Math.random().toString(36).slice(2)};Ei.inv.push(o);st.bagU=o.uid}else st.bagU=null}
  if(a==='sell'&&x){S.coins+=H.sellP(x);Ei.inv.splice(i,1);st.bagU=null}if(a==='sal'&&x){S.mats+=H.salP(x);Ei.inv.splice(i,1);st.bagU=null}
  if(a==='sellw'||a==='salw'){Ei.inv=Ei.inv.filter(x=>{const g=Ei.gear[x.slot];const bad=g&&x.power<=g.power&&(a==='salw'||x.q==='SR');if(bad){if(a==='sellw')S.coins+=H.sellP(x);else S.mats+=H.salP(x)}return !bad})}
  H.refreshBest(Ei);try{W().buildEquip()}catch(_){}draw()};draw()}
const VZ=[['auto','自動'],['mine','只看自己'],['party','自己＋隊伍'],['all','全部']];
let ptT=0;
function party(body){body.scrollTop=0;if(window.HDA&&HDA.partyUI)HDA.partyUI(body);const d=document.createElement('div');d.className='tmp';body.append(d);let mode='dmg';
 const draw=()=>{const v=W(),r=v.room;if(!r)return;const vals=r.players.map(p=>mode==='dmg'?p.st.dmg:mode==='heal'?p.st.heal:p.st.taken),tot=vals.reduce((a,b)=>a+b,0)||1,mx=Math.max(1,...vals),t=Math.max(1,r.t);
  d.innerHTML=`<div class="ph2">技能特效顯示</div><div class="seg">${VZ.map(x=>`<button data-v="${x[0]}" class="${v.C.vfx===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>
  <div class="ph2">測試模式</div><div class="seg"><button data-full="1" class="${v.C.team==='full15'?'on':''}">15 人滿編（AI 補位・坦補齊全）</button><button data-full="0" class="${v.C.team!=='full15'?'on':''}">一般 4 人</button></div>
  <div class="ph2">隊員（${r.players.length}/15） · 點選切換操作角色</div><div class="seg sm">${[['dmg','傷害'],['heal','治療'],['taken','承傷']].map(x=>`<button data-m="${x[0]}" class="${mode===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>
  <div class="pmc">${r.players.map((p,i)=>{const J=v.JOBS[p.job]||{},val=vals[i],down=p.down>0||p.soul>0;return `<button class="pmk${p.id===v.C.sel?' on':''}${down?' dn':''}" data-p="${p.id}">${portrait(p.job)}<div class="pmt"><div class="pmn"><b>${p.name}</b><span class="rb r-${J.role}">${ROLE_ZH[J.role]||J.role}</span>${p.ai?'<span class="aib">AI</span>':''}<small>${(J.name||p.job)}</small></div>
   <div class="chp sm"><i style="width:${Math.max(0,Math.round(100*p.hp/p.maxhp))}%"></i><span>${down?'倒地':'HP '+Math.round(100*p.hp/p.maxhp)+'%'}</span></div>
   <div class="dbar m-${mode}"><i style="width:${(val/mx*100).toFixed(1)}%"></i><span>${f(val)} · ${(val/tot*100).toFixed(0)}% · ${f(val/t)}/秒</span></div></div></button>`}).join('')}</div>
  <div class="mnote">伺服器上線後，下線角色仍留在隊伍中由 AI 持續割草。</div>`};
 d.onclick=e=>{const v=W();const b=e.target.closest('button');if(!b)return;if(b.dataset.full){const sm=document.getElementById('selMode')||[...document.querySelectorAll('select')].find(x=>[...x.options].some(o=>o.value==='full15'));const t=b.dataset.full==='1'?'full15':'full4';if(sm){sm.value=t;sm.onchange()}draw();return}if(b.dataset.v){v.C.vfx=b.dataset.v;const s=document.getElementById('selVfx');if(s){s.value=b.dataset.v;s.onchange&&s.onchange()}}if(b.dataset.m)mode=b.dataset.m;if(b.dataset.p!=null&&b.dataset.p!==''){v.C.sel=+b.dataset.p;try{v.buildSkills();v.buildEquip()}catch(_){}}draw()};
 draw();clearInterval(ptT);ptT=setInterval(()=>{if(!d.isConnected){clearInterval(ptT);return}draw()},1000)}
window.HDP={equip,bag,party,card}})();
