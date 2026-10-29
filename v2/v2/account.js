/* it19: 帳號登入 / 註冊（沿用仙境冒險既有帳號系統）+ 伺服器存檔 + 離線收益領取。未登入時沿用本機 localStorage。 */
;(function(){
const API='https://api.ragnarokidle.app',WSU='wss://api.ragnarokidle.app/ws?rob=1';
const W=()=>window.__v2,X=()=>window.HDX,F=()=>window.HDF;
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
let tok=LS.get('hd.tok'),acc=LS.get('hd.acc'),rev=0,ready=false,busy=false,srv=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(0)+'K':Math.round(n||0);
function rpc(msg){return new Promise((res,rej)=>{let w;try{w=new WebSocket(WSU)}catch(e){return rej('無法連線伺服器')}const t=setTimeout(()=>{try{w.close()}catch(e){}rej('連線逾時，請稍後再試')},12000);
 w.onopen=()=>w.send(JSON.stringify({...msg,id:1}));w.onerror=()=>{clearTimeout(t);rej('無法連線伺服器')};
 w.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}if(m.t==='r'&&m.id===1){clearTimeout(t);try{w.close()}catch(e){}m.e?rej(m.e):res(m)}}})}
let api=async function(m,p,b){const r=await fetch(API+p,{method:m,headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:b?JSON.stringify(b):undefined,keepalive:m==='POST'});let j={};try{j=await r.json()}catch(e){}return[r.status,j]}
function selP(){const v=W();return v&&v.room&&v.room.players[window.HDG&&HDG.on()?0:v.C.sel]}
function invOf(){const p=selP();if(!p||!W().equipOf)return null;const E=W().equipOf(p);if(!E.inv)E.inv=Object.values(E.bag).filter(Boolean).map(x=>({...x,uid:Math.random().toString(36).slice(2)}));return E}
function snapshot(imp){const st=X()&&X().st,E=invOf();const d={gold:Math.floor(st?st.coins:0),stone:Math.floor(st?st.mats:0),dust:Math.floor(F()?F().M.dust:0),region:W()?W().C.region:1,tier:W()?W().C.tier:'normal'};
 if(E){let b=E.inv.slice(0,40).map(x=>{const y={...x};delete y.nw;return y});while(b.length&&JSON.stringify(b).length>38000)b.pop();d.bagx=b}if(E){const g={};for(const k in E.gear)if(E.gear[k])g[k]=E.gear[k];d.gearx=g}const p=selP();if(p&&p.atk)d.heroAtk=Math.round(p.atk);if(window.HDG&&HDG.on())d.prog=HDG.P;if(imp)d.import=1;return d}
function applySrv(d){if(!d)return;window.HDG&&HDG.fromServer(d);const st=X()&&X().st;if(st){st.coins=d.gold||0;st.mats=d.stone||0}if(F())F().M.dust=d.dust||0;
 const E=invOf();if(E){if(Array.isArray(d.bagx)&&d.bagx.length)E.inv=d.bagx.map(x=>({...x}));if(d.gearx)for(const k in d.gearx)if(d.gearx[k]&&k in E.gear)E.gear[k]={...d.gearx[k]};X().refreshBest&&X().refreshBest(E)}}
// ---- 登入畫面 ----
function box(){let o=document.getElementById('acctBox');if(!o){o=document.createElement('div');o.id='acctBox';document.body.append(o)}return o}
function showLogin(msg,mode){mode=mode||'login';const o=box();o.hidden=false;
 o.innerHTML=`<div class="ob acb"><div class="ot">${mode==='reg'?'註冊帳號':'登入帳號'}</div><div class="acin">
 <div class="aclogo"><img src="v2/ic/ic_char.webp" alt=""><div><b>仙境冒險</b><small>帳號存檔 · 離線掛機 · 換手機也能接著玩</small></div></div>
 <label>帳號<input id="acU" autocomplete="username" maxlength="16" value="${esc(acc||'')}" placeholder="${mode==='reg'?'4–16 字英數或底線':'帳號'}"></label>
 <label>密碼<input id="acP" type="password" autocomplete="${mode==='reg'?'new-password':'current-password'}" placeholder="${mode==='reg'?'至少 8 字':'密碼'}"></label>
 ${mode==='reg'?'<label>確認密碼<input id="acP2" type="password" autocomplete="new-password" placeholder="再輸入一次"></label>':''}
 <div class="acmsg ${msg&&msg.ok?'ok':''}">${msg?esc(msg.t||msg):''}</div>
 <button class="mbtn acgo" id="acGo">${mode==='reg'?'註冊並登入':'登入'}</button>
 <div class="acrow"><button class="acln" id="acSw">${mode==='reg'?'已有帳號？登入':'還沒有帳號？註冊'}</button><button class="acln" id="acSkip">先不登入</button></div>
 <div class="mnote">與仙境冒險共用同一組帳號。未登入時進度只存在這台裝置。</div></div></div>`;
 const go=async()=>{if(busy)return;const u=o.querySelector('#acU').value.trim(),pw=o.querySelector('#acP').value,m=o.querySelector('.acmsg');
  if(mode==='reg'){if(!/^[A-Za-z0-9_]{4,16}$/.test(u)){m.textContent='帳號需 4–16 字英數或底線';return}if(pw.length<8){m.textContent='密碼至少 8 字';return}if(pw!==o.querySelector('#acP2').value){m.textContent='兩次密碼不一致';return}}
  else if(!u||!pw){m.textContent='請輸入帳號與密碼';return}
  busy=true;m.className='acmsg';m.textContent='連線中…';o.querySelector('#acGo').disabled=true;
  try{const r=await rpc(mode==='reg'?{op:'reg',acc:u,pw}:{op:'acct',acc:u,pw});tok=r.tok;acc=r.acc||u;LS.set('hd.tok',tok);LS.set('hd.acc',acc);o.hidden=true;await boot(true)}
  catch(e){m.textContent=typeof e==='string'?e:'登入失敗，請稍後再試'}busy=false;const b=o.querySelector('#acGo');b&&(b.disabled=false)};
 o.querySelector('#acGo').onclick=go;o.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')go()});
 o.querySelector('#acSw').onclick=()=>showLogin('',mode==='reg'?'login':'reg');o.querySelector('#acSkip').onclick=()=>{LS.set('hd.acctSkip','1');o.hidden=true}}
// ---- 離線收益 ----
function showClaim(off){const o=document.getElementById('offline');if(!o)return;const h=Math.floor(off.secs/3600),m=Math.floor(off.secs%3600/60);
 const cell=(ic,n,v)=>`<div class="rw"><img src="v2/ic/${ic}.webp" alt=""><small>${n}</small><b>${v}</b></div>`;
 o.innerHTML=`<div class="ob acclaim"><div class="ot">離線收益</div><div class="acin"><div class="mnote">${esc(acc)} 的隊伍在你離線時持續割草 ${h?h+' 小時 ':''}${m} 分鐘${off.secs>=43200?'（上限 12 小時）':''}</div>
 <div class="rwg">${cell('ic_skill','擊殺',fmt(off.kills))}${cell('ic_char','經驗','+'+fmt(window.HDG&&HDG.on()?Math.round((off.kills||0)*HDG.perKill(W().C.region,W().C.tier)*.5):off.exp))}${cell('ic_bag','金幣','+'+fmt(off.gold))}${cell('ic_equip','強化石','+'+fmt(off.stone))}${cell('ic_settings','星塵','+'+fmt(off.dust))}${cell('ic_bag','裝備',off.items+' 件')}</div>
 <div class="acmsg"></div><button class="mbtn acgo" id="acClaim">領取</button><div class="mnote">已存入帳號，換裝置登入也看得到。每段離線只能領一次。</div></div></div>`;o.hidden=false;
 o.querySelector('#acClaim').onclick=async ev=>{ev.target.disabled=true;const [s,j]=await api('POST','/api/hd/claim',{}).catch(()=>[0,{}]);
  if(s===200&&j.data){rev=j.rev;if(window.HDG&&HDG.on()){const v=W();HDG.addExp(Math.round((off.kills||0)*HDG.perKill(v.C.region,v.C.tier)*.5),1)}applySrv(j.data);addDrops(j.drops||[]);o.hidden=true;save()}else if(s===200&&j.none){o.hidden=true}else{o.querySelector('.acmsg').textContent=j.error||'領取失敗，請稍後再試';ev.target.disabled=false}}}
function addDrops(ds){const E=invOf();if(!E)return;for(const d of ds){if(E.inv.length>=40)break;if(!E.inv.find(x=>x.uid===d.uid))E.inv.push({...d,nw:1})}X().refreshBest&&X().refreshBest(E)}
// ---- 同步 ----
async function boot(fresh){if(!tok)return;const [s,j]=await api('GET','/api/hd/state').catch(()=>[0,{}]);
 if(s===401){tok=null;LS.set('hd.tok',null);ready=false;return showLogin('登入已過期，請重新登入')}if(s!==200){ready=false;return}
 srv=j;rev=j.rev;const d=j.data||{};const blank=!d._imported&&!(d.gold||d.stone||d.dust)&&!(d.bagx&&d.bagx.length);
 if(blank){const [s2,j2]=await api('POST','/api/hd/save',{rev,data:snapshot(1)}).catch(()=>[0,{}]);if(s2===200)rev=j2.rev}else applySrv(d);
 ready=true;paint();if(j.offline)showClaim(j.offline);else if(fresh)toast('已登入 '+acc+'，進度會存到帳號')}
let saving=false;async function save(){if(!tok||!ready||saving)return;saving=true;try{let [s,j]=await api('POST','/api/hd/save',{rev,data:snapshot()});
 if(s===200)rev=j.rev;else if(s===409||s===400){const [s2,j2]=await api('GET','/api/hd/state');if(s2===200){rev=j2.rev;if(s===400)applySrv(j2.data);else{[s,j]=await api('POST','/api/hd/save',{rev,data:snapshot()});if(s===200)rev=j.rev}}}else if(s===401){tok=null;LS.set('hd.tok',null);ready=false}}catch(e){}saving=false}
function toast(t){const d=document.createElement('div');d.className='actoast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2600)}
function logout(){const t=tok;tok=null;ready=false;LS.set('hd.tok',null);rpc({op:'logout',tok:t}).catch(()=>{});paint();toast('已登出，進度改存在這台裝置')}
// 設定面板裡的帳號列
function paint(){const sp=document.getElementById('setPanel');if(!sp)return;let r=sp.querySelector('.acrowset');if(!r){r=document.createElement('div');r.className='mrow acrowset';sp.insertBefore(r,sp.children[1]||null)}
 r.innerHTML=tok?`<span>帳號</span><b>${esc(acc)}</b><button class="mbtn acsm" data-ac="out">登出</button>`:`<span>帳號</span><b class="acoff">未登入（本機存檔）</b><button class="mbtn acsm" data-ac="in">登入 / 註冊</button>`;
 r.querySelector('button').onclick=()=>tok?logout():showLogin()}
setInterval(save,30000);setInterval(()=>{if(tok&&ready)api('POST','/api/hd/heartbeat',{}).catch(()=>{})},120000);
addEventListener('pagehide',()=>save());document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else if(tok)boot()});
const w=setInterval(()=>{if(W()&&W().ready&&X()){clearInterval(w);paint();if(tok)boot();else if(LS.get('hd.acctSkip')!=='1'||new URLSearchParams(location.search).get('login'))showLogin()}},300);
// 本機截圖用（只在 localhost）：?acdemo=claim
{const q=new URLSearchParams(location.search).get('acdemo');if(q&&q!=='login'&&/^(localhost|127\.)/.test(location.hostname))LS.set('hd.acctSkip','1');if(q&&/^(localhost|127\.)/.test(location.hostname))setTimeout(()=>{if(q==='party'){tok='demo';pty={id:1042,cap:15,members:[{acc:'chou',leader:true,online:true},{acc:'hdqa01',online:false},{acc:'miko77',online:true}]};api=async()=>[200,{party:pty}];document.querySelector('#mnav button[data-p="party"]').click()}else if(q==='claim'){acc=acc||'hdqa01';box().hidden=true;showClaim({secs:5*3600+23*60,kills:4180,exp:92160,gold:31540,stone:612,dust:88,items:40})}else showLogin()},3500)}

// ---- 線上掉落（伺服器產生裝備）----
let dk=-1,kq=0;setInterval(()=>{const v=W();if(!v||!v.room)return;const r=v.room,k=(r.totalKills||0)+r.killed+(r.stage||0)*1000;if(dk<0){dk=k;return}const d=k-dk;dk=k;if(d>0&&d<=500)kq+=d},1000);
setInterval(async()=>{if(!tok||!ready||kq<1)return;const n=kq;kq=0;await save();const [s,j]=await api('POST','/api/hd/drop',{kills:n}).catch(()=>[0,{}]);if(s===200){rev=j.rev;if(j.drops&&j.drops.length){addDrops(j.drops);toast('獲得 '+j.drops.length+' 件裝備（'+j.drops.map(x=>x.q).join('、')+'）')}}else kq+=n},20000);
// ---- 強化／升星（伺服器擲骰、扣材料）----
async function forge(op,it){await save();const [s,j]=await api('POST','/api/hd/forge',{op,uid:it.uid});if(s!==200)return{ok:0,error:j.error};rev=j.rev;Object.assign(it,j.item);const st=X().st;st.coins=j.gold;st.mats=j.stone;F().M.dust=j.dust;
 const E=invOf();if(E){for(const k in E.gear)if(E.gear[k]&&E.gear[k].uid===it.uid)Object.assign(E.gear[k],j.item);const b=E.inv.find(x=>x.uid===it.uid);if(b)Object.assign(b,j.item)}return{ok:j.ok,msg:j.msg}}
function refreshSheet(){try{W().buildEquip()}catch(e){}const b=document.querySelector('#mnav button.on'),sh=document.getElementById('msheet');if(b&&sh&&!sh.hidden){b.click();b.click()}}
// ---- 線上隊伍 ----
let pty=null;async function loadParty(){if(!tok)return null;const [s,j]=await api('POST','/api/hd/party',{op:'get'}).catch(()=>[0,{}]);pty=s===200?j.party:null;return pty}
function partyUI(body){const d=document.createElement('div');d.className='acparty';body.append(d);const teamN=()=>{const v=W();return v&&v.room?v.room.players.length:4};
 const draw=msg=>{if(!tok){d.innerHTML=`<div class="acph">線上隊伍</div><div class="mnote">登入後可以和其他玩家組隊（最多 15 人），離線也會留在隊伍裡持續拿經驗與裝備。</div><button class="mbtn acgo" data-pa="login">登入 / 註冊</button>`;return}
  if(!pty){d.innerHTML=`<div class="acph">線上隊伍</div><div class="mnote">目前沒有隊伍。建立隊伍後把隊伍編號給朋友，或輸入朋友的隊伍編號加入。</div>
   <div class="acrow2"><button class="mbtn" data-pa="create">建立隊伍</button></div><div class="acrow2"><input id="acPid" inputmode="numeric" placeholder="隊伍編號"><button class="mbtn" data-pa="join">加入</button></div><div class="acmsg">${msg?esc(msg):''}</div>`;return}
  const m=pty.members,real=m.length,ai=Math.max(0,Math.max(teamN(),real)-real);
  d.innerHTML=`<div class="acph">線上隊伍 <b>#${pty.id}</b><small>${real}/${pty.cap} 人</small></div><div class="acml">${m.map(x=>`<div class="acm"><i class="${x.online?'on':''}"></i><b>${esc(x.acc)}</b>${x.leader?'<span class="acl">隊長</span>':''}<small>${x.online?'線上':'離線掛機中'}</small></div>`).join('')}
   ${ai?`<div class="acm ai"><i></i><b>AI 隊員 × ${ai}</b><small>空位自動補上 AI</small></div>`:''}</div>
   <div class="mnote">離線的隊員不會被移出隊伍，下線期間照樣分到經驗與裝備。只有按「離開隊伍」才會退出。</div><div class="acmsg">${msg?esc(msg):''}</div>
   <div class="acrow2"><button class="mbtn" data-pa="copy">複製隊伍編號</button><button class="mbtn acwarn" data-pa="leave">離開隊伍</button></div>`};
 d.onclick=async e=>{const b=e.target.closest('[data-pa]');if(!b)return;const a=b.dataset.pa;if(a==='login')return showLogin();
  if(a==='copy'){try{await navigator.clipboard.writeText(String(pty.id));draw('已複製隊伍編號 '+pty.id)}catch(_){draw('隊伍編號：'+pty.id)}return}
  if(a==='leave'&&!confirm('確定離開隊伍？'))return;b.disabled=true;const body2=a==='join'?{op:'join',id:+(d.querySelector('#acPid').value||0)}:{op:a};
  const [s,j]=await api('POST','/api/hd/party',body2).catch(()=>[0,{error:'連線失敗'}]);await loadParty();draw(s===200?(a==='create'?'隊伍已建立':a==='join'?'已加入隊伍':'已離開隊伍'):j.error||'操作失敗')};
 draw();if(tok)loadParty().then(()=>draw())}
window.HDA={on:()=>!!tok,forge,refreshSheet,partyUI,showLogin,showClaim,save,_demo:{showClaim}};
})();
