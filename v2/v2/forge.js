/* it18: 強化 / 升星 (enhance + star-up). Materials economy: docs/FORGE_ECONOMY.md. Gold + materials only, never diamonds. */
;(function(){
const W=()=>window.__v2,X=()=>window.HDX;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const TIERM={normal:1,hard:1.6,nightmare:2.4,hell:3.5};
const QM={SR:1,SSR:1.6,UR:2.5};
const MAXREF=15,SAFE=5,KEEP=9; // +0..+5 100%; fail <= +9 keeps level; fail >= +10 drops 1 (never below +10)
const RATE=[1,1,1,1,1,1,.85,.75,.65,.55,.45,.38,.32,.26,.2];
const STARCAP={SR:3,SSR:4,UR:5};
const M={get stone(){return X().st.mats},set stone(v){X().st.mats=v},get dust(){return ld('hd.dust',0)},set dust(v){sv('hd.dust',v)},get coins(){return X().st.coins},set coins(v){X().st.coins=v}};
function reg(){const v=W();return v?v.C.region:1}
function enhCost(it){const n=it.refine+1,r=reg();return {stone:Math.ceil(n*1.5*QM[it.q]),gold:Math.round(120*Math.pow(n,1.6)*QM[it.q]*(1+r*.15))}}
function starCost(it){const n=it.stars+1,r=reg();return {dust:Math.ceil(4*n*n*QM[it.q]),gold:Math.round(800*n*n*QM[it.q]*(1+r*.15))}}
function recalc(it){const B=(W()||{}).T?W().T.equip_budget:{starMul:[1,1.1,1.2,1.33,1.45,1.6]};it.rm=1+it.refine*.02;it.sm=B.starMul[it.stars]||1;it.power=Math.round(it.base*it.qm*it.am*it.sm*it.rm)}
function preview(it,k){const c={...it};if(k==='enh')c.refine++;else c.stars++;recalc(c);return c}
// drops: per kill, scaled by region & difficulty (polled from room kill counter)
let lastK=-1,lastRoom=null,acc={s:0,d:0};
setInterval(()=>{const v=W();if(!v||!v.room)return;const r=v.room;const k=(r.stage||0)*1e4+(r.killed||0);
 if(r!==lastRoom||lastK<0||k<lastK){lastRoom=r;lastK=k;return}const kills=k-lastK>5e3?(r.killed||0):k-lastK;lastK=k;if(kills<=0)return;
 const tm=TIERM[r.tier]||1,rg=1+v.C.region*.12;acc.s+=kills*.08*tm*rg;acc.d+=kills*.012*tm*rg;
 const s=Math.floor(acc.s),d=Math.floor(acc.d);if(s){acc.s-=s;M.stone+=s}if(d){acc.d-=d;M.dust+=d}},1000);
const IC='<img class="fic" src="v2/ic/eq/w_sword.webp" alt="">';
function html(it){if(!it||!W())return '';const f=W().fmt,ec=enhCost(it),sc=starCost(it),cap=STARCAP[it.q];
 const ar=(a,b)=>b>a?`<span class="up">▲${f(b-a)}</span>`:'';
 let h=`<div class="forge"><div class="fgh"><span>鍛造</span><small>強化石 <b>${f(M.stone)}</b> · 星塵 <b>${f(M.dust)}</b> · 金幣 <b>${f(M.coins)}</b></small></div>`;
 if(it.refine<MAXREF){const p=preview(it,'enh'),rt=RATE[it.refine],ok=M.stone>=ec.stone&&M.coins>=ec.gold;
  h+=`<div class="fgr"><div class="fgt">強化 <b>+${it.refine}</b> → <b class="nx">+${it.refine+1}</b></div><div class="fgs"><span>戰力 ${f(it.power)} → ${f(p.power)} ${ar(it.power,p.power)}</span><span>強化倍率 ×${it.rm.toFixed(2)} → ×${p.rm.toFixed(2)}</span></div>
  <div class="fgc"><span class="${M.stone>=ec.stone?'':'lack'}">強化石 ${ec.stone}</span><span class="${M.coins>=ec.gold?'':'lack'}">金幣 ${f(ec.gold)}</span><span class="rt">成功率 ${Math.round(rt*100)}%</span><span class="sf">${it.refine<SAFE?'安全強化':it.refine<KEEP?'失敗不掉級':'失敗 -1（最低 +10）'}</span></div>
  <button class="mbtn fgb" data-fg="enh" ${ok?'':'disabled'}>強化</button></div>`}else h+=`<div class="fgr"><div class="fgt">強化已達上限 +${MAXREF}</div></div>`;
 if(it.stars<cap){const p=preview(it,'star'),ok=M.dust>=sc.dust&&M.coins>=sc.gold;
  h+=`<div class="fgr"><div class="fgt">升星 <b>${it.stars}★</b> → <b class="nx">${it.stars+1}★</b> <small>（${it.q} 上限 ${cap}★）</small></div><div class="fgs"><span>戰力 ${f(it.power)} → ${f(p.power)} ${ar(it.power,p.power)}</span><span>星級倍率 ×${it.sm.toFixed(2)} → ×${p.sm.toFixed(2)}</span></div>
  <div class="fgc"><span class="${M.dust>=sc.dust?'':'lack'}">星塵 ${sc.dust}</span><span class="${M.coins>=sc.gold?'':'lack'}">金幣 ${f(sc.gold)}</span><span class="rt">成功率 100%</span></div>
  <button class="mbtn fgb" data-fg="star" ${ok?'':'disabled'}>升星</button></div>`}else h+=`<div class="fgr"><div class="fgt">星級已滿 ${cap}★（${it.q}）</div></div>`;
 return h+(last?`<div class="fgmsg ${last.ok?'ok':'bad'}">${last.t}</div>`:'')+`<div class="mnote">材料由擊殺怪物掉落，地區與難度越高掉越多；分解裝備也可獲得強化石。不需要鑽石。</div></div>`}
let last=null,busy=0;
function act(k,it){if(!it)return;if(window.HDA&&HDA.on()&&it.srv){if(busy)return;busy=1;last={ok:1,t:'處理中…'};HDA.forge(k,it).then(r=>{last=r.ok?{ok:1,t:r.msg}:{ok:0,t:r.msg||r.error||'失敗'}}).catch(()=>{last={ok:0,t:'連線失敗，請稍後再試'}}).finally(()=>{busy=0;HDA.refreshSheet()});return}if(k==='enh'){const c=enhCost(it);if(it.refine>=MAXREF||M.stone<c.stone||M.coins<c.gold)return;M.stone-=c.stone;M.coins-=c.gold;
  if(Math.random()<RATE[it.refine]){it.refine++;last={ok:1,t:'強化成功！+'+it.refine}}else if(it.refine>=10&&it.refine>10){it.refine--;last={ok:0,t:'強化失敗，降為 +'+it.refine}}else last={ok:0,t:'強化失敗，等級保留 +'+it.refine}}
 if(k==='star'){const c=starCost(it);if(it.stars>=STARCAP[it.q]||M.dust<c.dust||M.coins<c.gold)return;M.dust-=c.dust;M.coins-=c.gold;it.stars++;last={ok:1,t:'升星成功！'+it.stars+'★'}}
 recalc(it);try{X().refreshBest&&0}catch(e){}}
function clear(){last=null}
window.HDF={html,act,clear,enhCost,starCost,RATE,STARCAP,M};
})();
;(function(){const q=new URLSearchParams(location.search),p=q.get('panel');if(!p)return;
 if(q.get('fgdemo')&&/^(localhost|127\.)/.test(location.hostname)){const M=HDF.M;Object.defineProperty(M,'stone',{get:()=>320});Object.defineProperty(M,'dust',{get:()=>90});Object.defineProperty(M,'coins',{get:()=>250000})}
 setTimeout(()=>{const b=document.querySelector('#mnav button[data-p="'+p+'"]');b&&b.click();if(q.get('fgdemo'))setTimeout(()=>{const x=document.querySelector('[data-fg="enh"]');x&&!q.get('noclick')&&x.click();const s=document.querySelector('.forge');s&&s.scrollIntoView()},500)},2500)})();
