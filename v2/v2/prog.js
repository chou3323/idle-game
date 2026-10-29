/* it22: 角色建立 + 等級/經驗 + 區域解鎖進度 + 裝備影響戰力 + 新手引導 + 通關/失敗流程。
   Client-side (localStorage hd.prog / hd.g0; also sent as data.prog in account save). Engine untouched: only team[0].power. */
;(function(){
const W=()=>window.__v2,$=id=>document.getElementById(id);
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const TIERS=['normal','hard','nightmare','hell'],TZ={normal:'普通',hard:'困難',nightmare:'惡夢',hell:'地獄'},TM={normal:1,hard:1.6,nightmare:2.4,hell:3.5};
const ROLE_ZH={tank:'坦克',subtank:'副坦',bruiser:'鬥士',std:'輸出',glass:'爆發輸出',healer:'治療',support:'輔助'};
const GRP=r=>r==='tank'||r==='subtank'?'t':r==='healer'?'h':r==='support'?'s':'d';
const NREG=14,TIER_UNLOCK=5,ROOMKILLS=1300;
let P=ld('hd.prog',null),G=ld('hd.g0',null),E0=null,run=null,lastSave='',toastQ=[];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const expLv=r=>1+(r-1)*6;
const need=lv=>Math.round(30*Math.pow(lv,1.5)+20);
function perKill(r,t){let s=0;for(let l=expLv(r);l<expLv(r+1);l++)s+=need(l);return s*.85/ROOMKILLS*(TM[t]||1)}
function on(){return !!P}
function save(){if(!P)return;sv('hd.prog',P);if(E0){const g={gear:E0.gear,inv:(E0.inv||[]).map(x=>{const y={...x};delete y.nw;return y})};const s=JSON.stringify(g);if(s!==lastSave){lastSave=s;sv('hd.g0',g)}}}
// ---------- power: level + gear vs what the region expects
function atk0(r){const v=W();return v.T.regions.rows[r-1].dStd/1.84}
function gearPow(){if(!E0)return 0;return Object.values(E0.gear).reduce((a,x)=>a+(x?x.power:0),0)}
function power(r){r=r||W().C.region;const lvM=Math.max(.6,Math.min(1.6,Math.pow(1.035,P.lv-expLv(r))));const g=gearPow()/(atk0(r)*22.8);const gM=Math.max(.75,Math.min(1.5,Math.sqrt(g||1)));return Math.max(.5,Math.min(2.2,lvM*gM))}
function recPower(r){return Math.round(atk0(r)*22.8*1.0+expLv(r)*40)}
function myPower(){return Math.round(gearPow()+P.lv*40)}
// ---------- team: you are slot 0 with your chosen job
function team(arr){if(!P)return arr;const v=W(),J=v.JOBS,g=GRP(J[P.job].role);let i=arr.findIndex(m=>!m.ai&&J[m.job]&&GRP(J[m.job].role)===g);if(i<0)i=arr.findIndex(m=>!m.ai&&GRP(J[m.job].role)==='d');if(i<0)i=0;
 const me=arr.splice(i,1)[0];me.job=P.job;me.name=P.name;me.power=power(v.C.region);const NN=['阿','小','大','莉','凱','諾','米','朵','布','晴','嵐','夏','雪','風','雲'];arr.forEach((m,k)=>{m.name=NN[k%15]+J[m.job].name.slice(0,2)});arr.unshift(me);return arr}
// ---------- persistent gear for you (slot 0)
function newGear(p){const v=W(),B=v.T.equip_budget,gear={};for(const s of Object.keys(B.slots)){if(p.job==='arc'&&s==='off')continue;const it=v.genItem(p,s,(Date.now()%1e5)+s.length*7,0);
 Object.assign(it,{q:'SR',qm:B.qualityMul[2],refine:0,stars:0,asc:0,am:1,sm:1,rm:1,aff:it.aff.slice(0,1),set:null,uid:Math.random().toString(36).slice(2)});it.power=Math.round(it.base*it.qm);gear[s]=it}return gear}
function E(p){if(!E0){if(G&&G.gear&&Object.keys(G.gear).length)E0={gear:G.gear,inv:G.inv||[],bag:{}};else E0={gear:newGear(p),inv:[],bag:{}};for(const s of Object.keys(W().T.equip_budget.slots))if(!(s in E0.gear))E0.gear[s]=null;window.HDX&&HDX.refreshBest(E0)}return E0}
// ---------- exp / level
function addExp(n,quiet){if(!P||!(n>0))return;P.exp+=n;let up=0;while(P.exp>=need(P.lv)&&P.lv<200){P.exp-=need(P.lv);P.lv++;up++}if(up){if(!quiet)lvUp();applyPow()}hud()}
function lvUp(){const v=W();try{v.sigBanner('等級提升  Lv.'+P.lv,2,'intro')}catch(e){}const p=v.room&&v.room.players[0];if(p)try{v.floatText(p.x,p.y-2.6,'LEVEL UP','#ffe680',1.5,0,'sup')}catch(e){}toast('等級提升到 Lv.'+P.lv+'，攻擊與生命提升')}
function applyPow(){const v=W(),p=v&&v.room&&v.room.players[0];if(!p||!P)return;const nw=power(v.C.region),k=nw/(p.power||1);if(Math.abs(k-1)<.002)return;p.atk*=k;p.maxhp*=k;p.hp=Math.min(p.maxhp,p.hp*k);p.power=nw}
function lvOf(p){if(p.id===0)return P.lv;return Math.max(1,P.lv+((p.id*7)%5)-2)}
// ---------- per-run tracking (kills -> exp, gold delta)
function flush(){const v=W();if(!v||!v.room||!P||!run||run.room!==v.room)return;const k=v.room.stats.kills||0,d=k-run.k0;run.k0=k;if(d>0){const x=d*perKill(v.C.region,v.C.tier);run.exp+=x;addExp(x)}}
function onRoom(room){run={room,k0:0,exp:0,gold0:window.HDX?HDX.st.coins:0,inv0:run&&E0?Math.min(run.inv0,E0.inv.length):E0?E0.inv.length:0,t:Date.now()};P.region=W().C.region;P.tier=W().C.tier;save();lockSel();hud()}
setInterval(()=>{const v=W();if(!v||!v.room||!P||!run)return;const r=v.room;if(run.room!==r)return;const k=r.stats.kills||0,d=k-run.k0;run.k0=k;if(d>0&&d<2000){const x=d*perKill(v.C.region,v.C.tier);run.exp+=x;addExp(x)}
 if(E0&&E0.inv.length>run.inv0){for(let i=run.inv0;i<E0.inv.length;i++){const it=E0.inv[i];if(!it)continue;const cur=E0.gear[it.slot];if(P.autoEq!==0&&it.slot in E0.gear&&(!cur||it.power>cur.power)){E0.gear[it.slot]=it;E0.inv.splice(i,1);if(cur)E0.inv.push(cur);i--;toast(`自動換上 <b class="q-${it.q}t">[${it.q}] ${esc(it.name)}</b> 戰力 ▲${v.fmt(it.power-(cur?cur.power:0))}`);window.HDX&&HDX.refreshBest(E0);try{v.buildEquip()}catch(e){}}else toast(`獲得 <b class="q-${it.q}t">[${it.q}] ${esc(it.name)}</b>`)}}if(E0)run.inv0=E0.inv.length;applyPow()},1000);
setInterval(save,5000);addEventListener('pagehide',save);
// ---------- unlocks
function maxR(t){return (P.max&&P.max[t])||0}
function tierOpen(t){const i=TIERS.indexOf(t);return i<=0||maxR(TIERS[i-1])>TIER_UNLOCK}
function lockSel(){const v=W(),sr=$('selRegion'),st=$('selTier');if(sr)[...sr.options].forEach(o=>{const n=+o.value,ok=n<=Math.min(NREG,maxR(v.C.tier)||1);o.disabled=!ok;o.textContent=n+'. '+v.T.regions.rows[n-1].name+(ok?'':'（未解鎖）')});
 if(st)[...st.options].forEach(o=>{const ok=tierOpen(o.value);o.disabled=!ok;o.textContent=TZ[o.value]+(ok?'':'（通關普通第 '+TIER_UNLOCK+' 區解鎖）'.replace('普通',TZ[TIERS[TIERS.indexOf(o.value)-1]]||''))});
 const sm=$('selTeam');if(sm)sm.title='隊伍組成（測試用）'}
function go(r,t){const v=W();v.C.region=r;if(t)v.C.tier=t;v.C.startStage=1;v.C.seed++;const sr=$('selRegion'),st=$('selTier');if(sr)sr.value=r;if(st)st.value=v.C.tier;v.newRoom();try{v.fitCam&&v.fitCam()}catch(e){}}
// ---------- HUD: level / exp / goal
function hud(){const v=W();if(!v||!P)return;let h=$('hdGoal');if(!h){h=document.createElement('div');h.id='hdGoal';$('stage').append(h);h.onclick=()=>guide(0,1)}
 const r=v.room,reg=v.C.region,t=v.C.tier,nx=reg<NREG?v.T.regions.rows[reg].name:null,isB=r&&r.isBoss,pct=Math.min(100,P.exp/need(P.lv)*100),pw=power(reg);
 const goal=reg<maxR(t)?'練等中 · 已解鎖到第 '+maxR(t)+' 區':isB?'擊敗區域王 → '+(nx?'解鎖 '+nx:'全區通關'):'第 '+(r?r.stage:1)+'/10 關 → 第 10 關區域王'+(nx?' → 解鎖 '+nx:'');
 const warn=pw<.85?'<em class="lo">戰力偏低</em>':pw>1.25?'<em class="hi">戰力充足</em>':'';
 h.innerHTML=`<div class="gl"><b>Lv.${P.lv}</b><span>${esc(P.name)}</span>${warn}</div><div class="gx"><i style="width:${pct.toFixed(1)}%"></i></div><div class="gg">${goal}</div>`}
setInterval(hud,1000);
// ---------- toast
let tbusy=0;function toast(html){toastQ.push(html);if(toastQ.length>4)toastQ.shift();if(!tbusy)nextT()}
function nextT(){const h=toastQ.shift();if(!h){tbusy=0;return}tbusy=1;let d=$('hdToast');if(!d){d=document.createElement('div');d.id='hdToast';document.body.append(d)}d.innerHTML=h;d.className='on';setTimeout(()=>{d.className='';setTimeout(nextT,250)},1800)}
// ---------- end of run: clear / wipe
let cdT=null;
function end(res){flush();const v=W(),o=$('overlay');o.hidden=false;clearInterval(cdT);const reg=v.C.region,t=v.C.tier,win=res==='clear';const gold=Math.round((v.room.stats.kills||0)*(2+v.C.region));
 const cell=(ic,n,val)=>`<div class="rwt"><img src="v2/ic/${ic}.webp" alt=""><b>${val}</b><span>${n}</span></div>`;
 const fmt=v.fmt;let body='',btns='',auto=null,label='';
 const cards=`<div class="endc">${cell('ic_skill','擊殺',fmt(v.room.stats.kills))}${cell('ic_char','經驗','+'+fmt(run?run.exp:0))}${cell('ic_bag','金幣','+'+fmt(gold))}${cell('ic_char','等級','Lv.'+P.lv)}</div>`;
 if(win){P.fails={};let first=false,tierMsg='';if(reg>=maxR(t)){first=reg>=maxR(t)&&!(P.cleared&&P.cleared[t+reg]);P.max=P.max||{};P.max[t]=Math.min(NREG,Math.max(maxR(t),reg+1));if(reg===NREG)P.max[t]=NREG}
  P.cleared=P.cleared||{};const firstClear=!P.cleared[t+reg];P.cleared[t+reg]=1;if(reg===TIER_UNLOCK&&firstClear&&TIERS[TIERS.indexOf(t)+1])tierMsg=`<div class="endu">解鎖新難度：${TZ[TIERS[TIERS.indexOf(t)+1]]}</div>`;
  // real boss relic
  const p=v.room.players[0],slots=Object.keys(E0.gear).filter(s=>E0.gear[s]!==undefined),s=slots[Math.floor(Math.random()*slots.length)];const it=v.genItem({id:0,atk:atk0(reg)*(TM[t]>1?1.1:1),power:1},s,Date.now()%1e6,firstClear?1.25:.9);it.refine=0;it.stars=0;it.rm=1;it.sm=1;it.power=Math.round(it.base*it.qm*it.am);it.uid=Math.random().toString(36).slice(2);it.nw=1;
  let relic;if(E0.inv.length<40){E0.inv.push(it);relic=`<div class="endd"><span>王之遺物${firstClear?'（首次通關）':''}</span><div class="eqt q-${it.q}">${v.SLOT_IC[it.slot]}</div><b class="q-${it.q}t">[${it.q}] ${esc(it.name)}</b><small>戰力 ${fmt(it.power)} · 已放入背包</small></div>`}else{const g=Math.round(it.power*.5);HDX.st.coins+=g;relic=`<div class="endd"><span>背包已滿，王之遺物換成金幣 +${fmt(g)}</span></div>`}
  window.HDX&&HDX.refreshBest(E0);save();
  const nx=reg<NREG?reg+1:null;label=nx?'前往 '+nx+'. '+v.T.regions.rows[nx-1].name:'再挑戰一次';auto=()=>nx?go(nx):go(reg);
  body=`<div class="endT win">◆ 區域通關 ◆</div>${cards}${relic}${nx&&first?`<div class="endu">已解鎖：${nx}. ${v.T.regions.rows[nx-1].name}</div>`:''}${tierMsg}`;
  btns=`<button class="mbtn acgo" id="hdNext">${label} <i id="hdCd"></i></button><button class="mbtn" id="hdStay">留在本區繼續練等</button>`}
 else{P.fails=P.fails||{};const f=(P.fails[t+reg]=(P.fails[t+reg]||0)+1);const pw=power(reg);const back=reg>1&&(f>=2||pw<.8);
  const tip=pw<.95?`你的等級 Lv.${P.lv}，這區建議 Lv.${expLv(reg)} 以上。先回上一區練等、換上背包裡更好的裝備，或到「裝備」強化。`:'王的範圍技能會留下紅圈，隊伍多撐一下就能過。也可以到「技能」換上更多治療或防禦技能。';
  label=back?'回 '+(reg-1)+' 區練等':'重新挑戰';auto=back?()=>go(reg-1):()=>go(reg);
  body=`<div class="endT lose">${res==='timeout'?'時間到':'全隊倒下'}</div>${cards}<div class="endtip">${tip}</div><div class="endu">已失敗 ${f} 次${back?' · 自動回上一區練等':''}</div>`;
  btns=`<button class="mbtn acgo" id="hdNext">${label} <i id="hdCd"></i></button>`+(back?`<button class="mbtn" id="hdStay">再挑戰一次</button>`:'')}
 o.innerHTML=`<div class="endbox">${body}<div class="endb">${btns}</div></div>`;save();
 let n=8;const tick=()=>{const c=$('hdCd');if(c)c.textContent='（'+n+'）';if(n--<=0){clearInterval(cdT);auto()}};tick();cdT=setInterval(tick,1000);
 $('hdNext').onclick=()=>{clearInterval(cdT);auto()};const st=$('hdStay');if(st)st.onclick=()=>{clearInterval(cdT);go(reg)}}
// ---------- character creation
function create(){const v=W(),J=v.JOBS;let sel=P?P.job:'kni';const o=document.createElement('div');o.id='hdNew';
 const por=j=>{try{const k=v.sheetKey(j,'m'),sh=v.imgs.sheets[k];if(!sh)return '';const S=52,sc=S/sh.ch,n=Math.round(2816/sh.cw);return `<div class="por" style="background-image:url(assets/chars/${sh.file});background-size:${Math.round(n*sh.cw*sc)}px ${S}px;width:${Math.round(sh.cw*sc)}px;height:${S}px"></div>`}catch(e){return ''}};
 const draw=()=>{o.innerHTML=`<div class="ob acb hdnb"><div class="ot">建立角色</div><div class="acin"><div class="mnote">選一個職業開始冒險。職業決定定位與基礎能力，技能之後可以自由搭配，不綁職業。</div>
 <div class="jg">${Object.keys(J).map(j=>`<button class="jb${j===sel?' on':''}" data-j="${j}">${por(j)}<b>${J[j].name}</b><small class="rb r-${J[j].role}">${ROLE_ZH[J[j].role]||''}</small></button>`).join('')}</div>
 <label>角色名稱<input id="hdName" maxlength="8" placeholder="最多 8 個字" value="${esc(P?P.name:'')}"></label><div class="acmsg" id="hdMsg"></div><button class="mbtn acgo" id="hdGo">開始冒險</button></div></div>`;
  o.querySelectorAll('.jb').forEach(b=>b.onclick=()=>{const nm=$('hdName').value;sel=b.dataset.j;draw();$('hdName').value=nm});
  $('hdGo').onclick=()=>{const nm=$('hdName').value.trim();if(!nm){$('hdMsg').textContent='請輸入角色名稱';return}
   const fresh=!P;P=P||{lv:1,exp:0,max:{normal:1},cleared:{},fails:{}};const chg=P.job&&P.job!==sel;P.job=sel;P.name=nm;if(fresh){E0=null;G=null;localStorage.removeItem("hd.g0")}save();o.remove();go(fresh?1:v.C.region,fresh?'normal':v.C.tier);if(fresh)guide(0)}};
 document.body.append(o);draw()}
// ---------- first-time guide
const STEPS=[['ic_skill','自動戰鬥','隊伍會一直自動打怪，不需要操作。打倒怪物會得到經驗、金幣、強化材料和裝備。'],['ic_party','關卡目標','每區 10 關，第 10 關是區域王。打倒區域王就會解鎖下一區，左上角隨時顯示目前目標。'],['ic_equip','變強','升級會提高攻擊與生命。新裝備放在「背包」，有 ▲ 代表比身上的好；到「裝備」可以強化和升星。'],['ic_bag','打不過時','全隊倒下會告訴你原因，並自動回上一區練等。離線時隊伍會繼續掛機，回來可以領取離線收益。']];
function guide(i,re){let o=$('hdGuide');if(!o){o=document.createElement('div');o.id='hdGuide';document.body.append(o)}if(i>=STEPS.length){o.remove();P.guided=1;save();return}const s=STEPS[i];
 o.innerHTML=`<div class="ob acb gdb"><div class="gdh"><img src="v2/ic/${s[0]}.webp" alt=""><b>${s[1]}</b><small>${i+1}/${STEPS.length}</small></div><div class="gdt">${s[2]}</div><div class="endb"><button class="mbtn acgo" id="gdN">${i+1<STEPS.length?'下一步':'開始'}</button>${i+1<STEPS.length?'<button class="acln" id="gdS">略過</button>':''}</div></div>`;
 $('gdN').onclick=()=>guide(i+1);const sk=$('gdS');if(sk)sk.onclick=()=>guide(STEPS.length)}
// ---------- boot: wait for game + login dialog to close
const w=setInterval(()=>{const v=W();if(!v||!v.ready)return;const ab=$('acctBox');if(ab&&!ab.hidden)return;if($('offline')&&!$('offline').hidden)return;clearInterval(w);setRow();if(!P){create();return}lockSel();hud();if(!P.guided)guide(0)},400);
function setRow(){const sp=$('setPanel');if(!sp||$('hdSetRow'))return;const r=document.createElement('div');r.className='mrow acrowset';r.id='hdSetRow';r.innerHTML='<span>角色</span><b id="hdSetNm"></b><button class="mbtn acsm" id="hdChg">更換職業／名稱</button>';sp.insertBefore(r,sp.children[1]||null);$('hdChg').onclick=()=>create();setInterval(()=>{const n=$('hdSetNm');if(n&&P)n.textContent=P.name+' · Lv.'+P.lv},1500)}
function fromServer(d){if(d&&d.prog&&d.prog.job&&(!P||(d.prog.lv||0)*1e9+(d.prog.exp||0)>(P.lv||0)*1e9+(P.exp||0))){P=d.prog;save();const n=$('hdNew');if(n){n.remove()}go(P.region||1,P.tier||'normal')}}
window.HDG={perKill,on,team,E,lvOf,end,onRoom,addExp,power,fromServer,create,guide,get P(){return P},need,expLv};
})();
