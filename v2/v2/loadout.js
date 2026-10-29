/* r14 skill loadout: library (not job-bound) + 8 slots (slot 8 = ultimate), affinity, local persistence. Client-only. */
;(function(){'use strict';
const TZ={phys:'物理',magic:'魔法',holy:'神聖',aoe:'範圍',single:'單體',tank:'坦克',support:'輔助',rescue:'救援',ultimate:'大招'};
const SH={single:'單體',multi:'多段',aoe_s:'小範圍',aoe_l:'大範圍',ramp:'蓄力',half:'半場',field:'場地',proc:'觸發',trap:'陷阱',line:'直線',burst:'爆發',summon:'召喚'};
const FN={guard:'減傷架勢',taunt:'嘲諷',devotion:'守護隊友',debuff:'削弱敵人',partyBuff:'全隊增益',heal:'治療隊友',partyHeal:'全隊治療',barrier:'護盾',revive:'復活',selfHeal:'自我治療',tauntGroup:'群體嘲諷',cleanse:'淨化'};
const FILT=[['all','全部'],['aff','親和'],['atk','攻擊'],['fn','功能'],['ult','大招'],['phys','物理'],['magic','魔法'],['holy','神聖'],['aoe','範圍'],['single','單體'],['tank','坦克'],['support','輔助'],['rescue','救援']];
let st={slot:0,f:'all',sel:null,q:''};
const V=()=>window.__v2;
let D=null;function T(){return(D||V()).T}function SK(){return(D||V()).SK}function JB(){return(D||V()).JOBS}
function me(){const v=V();return v&&v.room&&v.room.players[0]}
function jobTags(job){const J=JB()[job],o=new Set();(J.kit||[]).forEach(id=>((SK()[id]||{}).tags||[]).forEach(t=>t!=='ultimate'&&o.add(t)));return o}
function aff(s,job){const A=T().skills.affinity||{own:1,sibling:.85,other:.7};if((s.jobs||[]).includes(job))return['own',A.own];const jt=jobTags(job);const sh=(s.tags||[]).filter(t=>t!=='ultimate'&&t!=='single'&&t!=='aoe'&&jt.has(t)).length;return sh?['sib',A.sibling]:['off',A.other]}
const AFZ={own:'本職',sib:'相近',off:'非親和'};
function key(job){return'hd.load.'+job}
function norm(ids){ids=ids.filter(id=>SK()[id]);const u=ids.filter(id=>SK()[id].ult),n=ids.filter(id=>!SK()[id].ult);const out=n.slice(0,7);while(out.length<7)out.push(null);out.push(u[0]||null);return out}
function get(job){let ids=null;try{ids=JSON.parse(localStorage.getItem(key(job))||'null')}catch(e){}if(!Array.isArray(ids)||ids.length!==8)ids=norm(JB()[job].kit||[]);return ids}
function save(job,ids){try{localStorage.setItem(key(job),JSON.stringify(ids))}catch(e){}}
function clone(s,job){const[a,k]=aff(s,job);const c=Object.assign({},s,{_aff:a,_k:k});if(k!==1){if(c.m)c.m*=k;if(c.pct)c.pct*=k;if(c.dr)c.dr*=k;if(c.dmg&&typeof c.dmg==='number')c.dmg*=k}return c}
function apply(room,d){if(d)D=d;const p=room&&room.players[0];if(!p)return;const ids=get(p.job).filter(Boolean);if(!ids.length)return;p.kit=ids.map(id=>clone(SK()[id],p.job));p.cd=p.cd||{};ids.forEach(id=>{if(p.cd[id]==null)p.cd[id]=0})}
function commit(ids){const p=me();if(!p)return;save(p.job,ids);apply(V().room);V().buildSkills&&V().buildSkills()}
function desc(s){const a=[];if(s.type==='atk'){a.push(`對${SH[s.shape]||'敵人'}造成 ${Math.round((s.m||0)*100)}% ${s.scale==='matk'?'魔攻':'攻擊'}傷害${s.f>1?` ×${s.f} 段`:''}`);if(s.radius)a.push(`範圍半徑 ${s.radius} 公尺`)}else{a.push(FN[s.fn]||'特殊效果');if(s.pct)a.push(`回復 ${Math.round(s.pct*100)}% 生命`);if(s.dr)a.push(`減傷 ${Math.round(s.dr*100)}%`);if(s.taken)a.push(`承傷 ${Math.round((1-s.taken)*100)}%↓`);if(typeof s.dmg==='number')a.push(`傷害 +${Math.round(s.dmg*100)}%`);if(s.dur)a.push(`持續 ${s.dur} 秒`);if(s.radius)a.push(`範圍 ${s.radius} 公尺`)}return a.join('，')}
function ic(s){return`<img src="v2/ic/s/${s.id}.webp" alt="" loading="lazy">`}
function power(s){return s.type==='atk'?Math.round((s.m||0)*100)+'%':(s.pct?Math.round(s.pct*100)+'%':s.dr?Math.round(s.dr*100)+'%':'—')}
function render(body){const p=me();if(!p){body.innerHTML='';return}const job=p.job,J=JB()[job],ids=get(job);
 const lib=Object.values(SK()).filter(s=>{const f=st.f;if(f==='all')return true;if(f==='aff')return aff(s,job)[0]!=='off';if(f==='atk'||f==='fn')return s.type===f&&!s.ult;if(f==='ult')return s.ult;return(s.tags||[]).includes(f)}).sort((a,b)=>{const ra={own:0,sib:1,off:2};return ra[aff(a,job)[0]]-ra[aff(b,job)[0]]||(a.ult-b.ult)||a.cd-b.cd});
 const slots=ids.map((id,i)=>{const s=id&&SK()[id];const af=s?aff(s,job)[0]:'';return`<button class="ls${i===7?' u':''}${i===st.slot?' on':''}" data-i="${i}">${s?ic(s):`<span class="ls0">${i===7?'大招':'空'}</span>`}<em>${i+1}</em>${s?`<b>${s.name}</b><i class="af ${af}"></i>`:''}</button>`}).join('');
 const card=st.sel&&SK()[st.sel]?detail(SK()[st.sel],job,ids):'';
 body.innerHTML=`<div class="lo tmp"><div class="loHd"><span class="lj">${J.name}</span><span class="lt">自動施放依格子順序 1→8，第 8 格限大招</span></div>
 <div class="lsg">${slots}</div>
 <div class="loAct"><button data-a="left">◀ 前移</button><button data-a="right">後移 ▶</button><button data-a="clear">卸下</button><button data-a="reset">恢復預設</button></div>
 ${card}
 <div class="lf">${FILT.map(([k,v])=>`<button data-f="${k}" class="${st.f===k?'on':''}">${v}</button>`).join('')}</div>
 <div class="lg">${lib.map(s=>{const[a,k]=aff(s,job);const eq=ids.indexOf(s.id);return`<button class="lc${s.ult?' u':''}${st.sel===s.id?' on':''}" data-s="${s.id}">${ic(s)}<b>${s.name}</b><small>CD ${s.cd}s · ${power(s)}</small><i class="af ${a}">${a==='own'?'本職':Math.round(k*100)+'%'}</i>${eq>=0?`<em class="eq">${eq+1}</em>`:''}</button>`}).join('')}</div></div>`;
 body.querySelectorAll('.ls').forEach(b=>b.onclick=()=>{st.slot=+b.dataset.i;const id=ids[st.slot];if(id)st.sel=id;render(body)});
 body.querySelectorAll('.lf button').forEach(b=>b.onclick=()=>{st.f=b.dataset.f;render(body)});
 body.querySelectorAll('.lc').forEach(b=>b.onclick=()=>{st.sel=b.dataset.s;const s=SK()[st.sel];if(s.ult)st.slot=7;else if(st.slot===7)st.slot=Math.max(0,ids.findIndex(x=>!x));render(body);const c=body.querySelector('.ld');c&&c.scrollIntoView({block:'nearest',behavior:'smooth'})});
 body.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a,i=st.slot,n=ids.slice();
  if(a==='left'&&i>0&&i<7){[n[i-1],n[i]]=[n[i],n[i-1]];st.slot--}
  else if(a==='right'&&i<6){[n[i+1],n[i]]=[n[i],n[i+1]];st.slot++}
  else if(a==='clear'){n[i]=null}
  else if(a==='reset'){try{localStorage.removeItem(key(job))}catch(e){}apply(V().room);V().buildSkills&&V().buildSkills();render(body);return}
  else if(a==='equip'){const s=SK()[st.sel];const t=s.ult?7:(st.slot===7?0:st.slot);const old=n.indexOf(s.id);if(old>=0)n[old]=n[t];n[t]=s.id;st.slot=t}
  else return;
  if(!n.some(Boolean)){toast(body,'至少要裝備 1 個技能');return}
  commit(n);render(body)})}
function detail(s,job,ids){const[a,k]=aff(s,job);const eq=ids.indexOf(s.id);const t=s.ult?7:(st.slot===7?0:st.slot);
 return`<div class="ld"><div class="ldi">${ic(s)}</div><div class="ldt"><div class="ldn">${s.name}<small>${s.ro||''}</small></div>
 <div class="ltg">${s.ult?'<span class="tu">大招</span>':''}<span>${s.type==='atk'?'攻擊':'功能'}</span>${(s.tags||[]).filter(x=>x!=='ultimate').map(x=>`<span>${TZ[x]||x}</span>`).join('')}<span class="af ${a}">${AFZ[a]} ${Math.round(k*100)}%</span></div>
 <div class="lst"><div><i>冷卻</i><b>${s.cd}s</b></div><div><i>${s.type==='atk'?'傷害':'效果'}</i><b>${power(s)}</b></div><div><i>範圍</i><b>${s.radius?s.radius+'m':SH[s.shape]||'—'}</b></div><div><i>施放</i><b>${s.lock||0}s</b></div></div>
 <div class="ldd">${desc(s)}${k<1?`。目前職業效果為 ${Math.round(k*100)}%`:''}</div>
 <button class="leq" data-a="equip">${eq>=0?(eq===t?`已在第 ${eq+1} 格`:`移到第 ${t+1} 格`):`裝備到第 ${t+1} 格`}</button></div></div>`}
function toast(body,m){const d=document.createElement('div');d.className='ltoast';d.textContent=m;body.append(d);setTimeout(()=>d.remove(),1500)}
window.HDL={apply,render,get};
})();
