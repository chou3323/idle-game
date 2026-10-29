// HD room simulation core — shared by hd-sim (Node, headless) and the browser client (window.HDSim).
// Deterministic (seeded), data-driven (tables/*.json). Plan v2 A8–A11. No combo system.
(function(root){'use strict';
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const TIERS=['normal','hard','nightmare','hell'];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ROLE_BOT={tank:'tank',subtank:'tank',healer:'healer',support:'support',bruiser:'dps',std:'dps',glass:'dps'};

function create(o){
 const T=o.tables, RG=T.regions, tune=Object.assign({},RG.tune,o.tune||{});if(o.tune&&o.tune.tierK)tune.tierK=Object.assign({},RG.tune.tierK,o.tune.tierK);
 if(o.tune&&o.tune.regDmgK)tune.regDmgK=Object.assign({},RG.tune.regDmgK||{},o.tune.regDmgK);
 const tierK=((tune.tierK||{})[o.tier||'normal']||1)*(()=>{const c=(tune.tierKByRegion||{})[o.tier||'normal'];if(!c)return 1;const ks=Object.keys(c).map(Number).sort((x,y)=>x-y),r=+o.region||1;if(r<=ks[0])return c[ks[0]];if(r>=ks[ks.length-1])return c[ks[ks.length-1]];for(let i=1;i<ks.length;i++)if(r<=ks[i]){const t=(r-ks[i-1])/(ks[i]-ks[i-1]);return c[ks[i-1]]*(1-t)+c[ks[i]]*t}return 1})();
 const reg=RG.rows[(o.region||1)-1],rk=((tune.regDmgK||{})[o.region||1])||1, tier=T.tiers[o.tier||'normal'], tierIdx=TIERS.indexOf(o.tier||'normal');
 const rnd=mulberry(o.seed||1), R=()=>rnd(); const rr=(a,b)=>a+(b-a)*R();
 const n=o.team.length, P=T.party, dt=o.dt||0.1;
 const SS=(n===1&&P.solo)||{hp:1,dmg:1,cap:1}, BH=(P.bigHpK&&P.bigHpK[n])||1;
 const hpMul=(1+P.hpPerExtra*(n-1))*SS.hp*BH, dmgMul=(1+P.dmgPerExtra*(n-1))*SS.dmg, capN=Math.min(P.capMax,Math.round(P.mobCap*(1+P.capPerExtra*(n-1))*tier.count*SS.cap));
 const room={t:0,dt,reg,tier:o.tier||'normal',tierIdx,n,players:[],mobs:[],tele:[],ev:o.events?[]:null,stage:o.startStage||1,endStage:o.endStage||RG.stages,phase:'fight',result:null,
   killed:0,spawned:0,quota:0,restT:0,feathers:tier.feathers,featherCd:0,wipeT:0,boss:null,mark:null,stats:{kills:0,wipes:0,stageClear:[],finSamples:0,finSum:0,tankUp:0,tankN:0,time:0},stageT:0,idN:1,enemyTaken:{v:0,until:0},buff:{dmg:0,until:0},arena:RG.arena,opts:o,tune};
 const ev=(e)=>{if(room.ev)room.ev.push(e)};
 room.ev_=ev;
 // ---------- players
 const atkBase=reg.dStd/1.84*(o.power||1);
 o.team.forEach((m,i)=>{const jd=T.jobs_skill.jobs[m.job],ro=T.roles[jd.role];const pw=(m.power||1);
  const p={id:i,name:m.name||m.job,job:m.job,jd,role:jd.role,bot:m.bot||ROLE_BOT[jd.role],power:pw,ai:!!m.ai,
   x:room.arena[0]/2+(i%5-2)*1.3,y:room.arena[1]/2+(i<5?1:-1)*1.5,hp:0,maxhp:20*reg.mobAtk*ro.ehpIdx*pw*(m.ai?0.4:1),atk:atkBase*pw*(m.ai?T.party.aiFillPower:1),
   aspdCd:0,lock:0,think:rr(0,.3),react:m.perfect?0.05:rr(.2,.5),err:m.perfect?0:.05,perfect:!!m.perfect,cd:{},kit:[],down:0,soul:0,deaths:0,potCd:0,potions:T.heal.potionMax,
   buffs:{guard:0,guardDr:0,barrier:0,barrierDr:0,devotion:0,silence:0,curse:0,poison:0,poisonStk:0},thr:{d:0,h:0,t:0},st:{dmg:0,heal:0,taken:0,kills:0,deaths:0,casts:0,dmgSingle:0,dmgAoe:0,basic:0,skill:0,absorbed:0},
   dodgeAt:0,moveT:null,tgt:null,fx:null,casting:null};
  p.hp=p.maxhp;
  const ids=(m.skills||jd.kit);for(const id of ids){const s=T.skills.skills[id];if(!s)continue;p.kit.push(s);p.cd[id]=0;}
  if(m.healSkillSwap){const hs=T.skills.skills.heal;p.kit[p.kit.length-1]=hs;p.cd.heal=0;}
  // ult cap
  let u=0;p.kit=p.kit.filter(s=>{if(s.ult){if(++u>2)return false}return true});
  room.players.push(p)});
 room.healers=room.players.filter(p=>p.jd.healEff>0.5);
 room.noHealerFlag=!room.players.some(p=>p.jd.healEff>0);
 // ---------- aggro (port of Aurevia aggro.js semantics, sim-time based)
 const AG=T.aggro,TH=AG.threat,TN=AG.taunt,ROLE_THR=T.roles;
 const win=TH.windowSec||10;
 function noteDmg(m,p,v){const e=m.thr[p.id]||(m.thr[p.id]={v:0,t:room.t});e.v=e.v*Math.exp(-(room.t-e.t)/win)+v;e.t=room.t;const g=p.thr;g.d=g.d*Math.exp(-(room.t-g.t)/win)+v;g.t=room.t}
 function noteHeal(p,v){const g=p.thr;const f=Math.exp(-(room.t-g.t)/win);g.d*=f;g.h=g.h*f+v;g.t=room.t}
 const mobDmgOf=(m,p)=>{const e=m.thr[p.id];return e?e.v*Math.exp(-(room.t-e.t)/win):0};
 const healOf=p=>p.thr.h*Math.exp(-(room.t-p.thr.t)/win);
 const dpsOf=p=>p.thr.d*Math.exp(-(room.t-p.thr.t)/win);
 function capShare(w,cap){const k=w.length;if(k<2)return w;const S=w.reduce((a,b)=>a+b,0);if(!(S>0))return w;let p=w.map(x=>x/S);for(let it=0;it<k;it++){const ov=p.findIndex(x=>x>cap+1e-9);if(ov<0)break;const ex=p[ov]-cap;p[ov]=cap;const rest=[];for(let i=0;i<k;i++)if(i!==ov&&p[i]<cap)rest.push(i);if(!rest.length)break;for(const i of rest)p[i]+=ex/rest.length}return p}
 function pickTarget(m,mode){const c=room.players.filter(p=>p.down<=0&&!p.soul);if(!c.length)return null;
  if(m.onlyHealer){const h=c.filter(p=>p.jd.healEff>.5);if(h.length)return h[(R()*h.length)|0]}
  if(m.onlyLow){let b=c[0];for(const p of c)if(p.hp/p.maxhp<b.hp/b.maxhp)b=p;return b}
  const ds=c.map(p=>mobDmgOf(m,p)),hs=c.map(healOf);const SD=ds.reduce((a,b)=>a+b,0),SH=hs.reduce((a,b)=>a+b,0);
  let w=c.map((p,i)=>{let x=TH.base+TH.kD*(SD>0?ds[i]/SD:0)+TH.kH*(SH>0?hs[i]/SH:0);if(p.failTaunt>room.t)x+=TH.failTauntBonus;x*=(ROLE_THR[p.role]||{}).threat||1;if(p.jd.healEff>0&&p.role==='healer')x*=1;return Math.max(0,x)});
  w=capShare(w,TH.maxShare);const S=w.reduce((a,b)=>a+b,0);let r=R()*S;for(let i=0;i<c.length;i++){r-=w[i];if(r<=0)return c[i]}return c[c.length-1]}
 const kindOf=m=>m.type==='boss'?'stageBoss':'fieldBoss';
 function resist(m){return TN.resist[kindOf(m)]}
 function fatigue(m){const f=m.tFat;if(!f)return 0;return Math.max(0,f.n-Math.floor((room.t-f.t)/TN.fatigueDecaySec))}
 function uptime(m){const W=TN.uptimeWin;m.tUp=m.tUp.filter(x=>x[1]>room.t-W);let u=0;for(const[a,b]of m.tUp)u+=Math.min(b,room.t)-Math.max(a,room.t-W);if(m.taunt)u+=room.t-Math.max(m.taunt.t0,room.t-W);return u/W}
 function endLock(m){if(!m.taunt)return;m.tUp.push([m.taunt.t0,room.t]);if(m.taunt.boss){m.tFat={n:Math.min(TN.fatigueMax,fatigue(m)+1),t:room.t}}m.taunt=null;m.rt=0}
 function tryTaunt(m,p,lv){const big=m.type!=='norm';
  if(m.mark&&m.mark.until>room.t)return false;
  if(m.taunt&&m.taunt.by!==p.id&&m.taunt.until>room.t&&m.taunt.n>0)return false;
  let chance=100;if(big){if(uptime(m)>=TN.uptimeCap)return false;const tp=(T.jobs_skill.tauntPower||{})[p.job]||110;chance=Math.max(TN.chanceMin,Math.min(TN.chanceMax,tp-(resist(m)+fatigue(m)*TN.fatigueR)));if(R()*100>=chance){p.failTaunt=room.t+TH.failTauntSec;return false}}
  const nn=Math.min(TN.nMax,TN.nBase+Math.ceil(Math.min(lv,TN.nLvCap)/TN.nPerLvDiv));
  m.taunt={by:p.id,n:nn,t0:room.t,until:room.t+TN.lockMaxSec,boss:big};m.tgt=p;m.rt=0;return true}
 const lockedBy=m=>{if(!m.taunt)return null;if(m.taunt.n<=0||m.taunt.until<=room.t){endLock(m);return null}return m.taunt.by};
 // ---------- mobs
 function mkMob(type,x,y){const base=reg.mobHp*tier.hp*hpMul*tune.mobHpK;const bossBase=reg.bossHp*(tier.bossHp||tier.hp)*(hpMul/(1+P.hpPerExtra*3))*(tune.bossHpMul||1);const rangedMob=type==='norm'&&R()<RG.rangedFrac;
  const m={id:room.idN++,type,x,y,thr:{},tUp:[],taunt:null,tFat:null,tgt:null,rt:rr(0,TH.retargetSec),atkT:rr(0,RG.mobAtkCd),ranged:rangedMob,range:rangedMob?RG.rangedRange:RG.meleeRange,ang:R()*6.283,ringR:rangedMob?rr(4,RG.rangedRange):rr(.5,2.4),
   spd:RG.mobSpeed*rr(.85,1.15),dead:false,windup:0,stun:0,mark:null,markT:rr(15,25),dr:0,slow:1,hitT:0};
  if(type==='norm'){m.maxhp=base;m.atk=reg.mobAtk*tier.dmg*dmgMul*tune.mobDmgK*tierK*rk}
  else if(type==='elite'){m.maxhp=base*tune.eliteHpK;m.atk=reg.mobAtk*1.5*tier.dmg*dmgMul*tune.eliteDmgK*tierK*rk;m.range=1.6;m.ringR=1;m.spd*=.85;m.aff=R()<.2?'onlyLow':R()<.2?'onlyHealer':null;if(m.aff==='onlyLow'&&tierIdx<1)m.aff=null;if(m.aff==='onlyHealer'&&tierIdx<1)m.aff=null;if(m.aff==='onlyLow')m.onlyLow=true;if(m.aff==='onlyHealer')m.onlyHealer=true;m.cdS=rr(5,9)}
  else{m.maxhp=bossBase;m.atk=reg.mobAtk*RG.bossAtkK*tier.dmg*dmgMul*tune.bossDmgK*tierK*rk*(SS.bossDmg||1);m.range=2.2;m.ringR=1.2;m.spd*=.7;m.moves=reg.bossMoves.slice();m.mcd={};for(const k of m.moves)m.mcd[k]=rr(3,8);m.gap=0;m.summonDr=0}
  m.hp=m.maxhp;room.mobs.push(m);m.tgt=pickTarget(m);return m}
 function spawnGroup(k,type){const cx=avgX(),cy=avgY();const a0=R()*6.283;for(let i=0;i<k;i++){const a=a0+rr(-.5,.5),d=rr(14,20);let x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;x=Math.max(1,Math.min(room.arena[0]-1,x));y=Math.max(1,Math.min(room.arena[1]-1,y));mkMob(type||'norm',x,y);if(!type||type==='norm')room.spawned++}}
 function avgX(){let s=0,c=0;for(const p of room.players)if(p.down<=0&&!p.soul){s+=p.x;c++}return c?s/c:room.arena[0]/2}
 function avgY(){let s=0,c=0;for(const p of room.players)if(p.down<=0&&!p.soul){s+=p.y;c++}return c?s/c:room.arena[1]/2}
 function startStage(i){room.stage=i;room.killed=0;room.spawned=0;room.stageT=0;room.mobs.length=0;room.tele.length=0;room.boss=null;room.phase='fight';room.eliteDone=false;room.bossSpawned=false;room.eliteSpawned=false;room.spawnCd=1;
  const Q=Math.round(100*(1+.12*(reg.id-1))*Math.pow(1+.25*(n-1),.6)*tier.count*tune.quotaScale);room.quota=i===RG.bossStage?Math.round(Q*.5):Q;
  room.isElite=RG.eliteStages.includes(i);room.isBoss=i===RG.bossStage;
  // revive downed at stage start (soul return) handled in rest
  ev({k:'stage',i,q:room.quota,boss:room.isBoss,elite:room.isElite})}
 // ---------- damage / heal
 const critRoll=(p)=>{const c=p.jd.crit+(T.roles[p.role].crit||0);if(R()>=c)return {m:1,t:0};const r=R();if(r<.01)return {m:3,t:3};if(r<.12)return {m:2,t:2};return {m:1.45,t:1}};
 function dmgMult(p,m){let x=1;const big=m.type!=='norm';x*=big?p.jd.bossIdx:p.jd.clearIdx;if(room.buff.until>room.t)x*=1+room.buff.dmg;let td=0;for(const q of room.players)if(q.down<=0&&!q.soul&&q.jd.teamDmg)td=Math.max(td,q.jd.teamDmg);x*=1+td;if(room.enemyTaken.until>room.t)x*=1+room.enemyTaken.v;if(m.stun>0)x*=1.3;if(m.type==='boss'&&m.summonDr>room.t)x*=.3;if(p.buffs.silence>room.t&&false)x*=1;
  if(m.taunt&&m.taunt.by===p.id&&false)x*=.85;return x*tune.dmgK*(p.jd.dpsK||1)}
 function hit(p,m,base,kind,aoeN){const c=critRoll(p);let v=base*dmgMult(p,m)*c.m*(aoeN>12?Math.max(.4,1-.03*(aoeN-12)):1);if(m.dead)return;
  if(m.type==='boss'&&room.t>=m.enrageAt)v*=1;const rv=v;{const ev2=Math.min(v,Math.max(0,m.hp));p.st.raw=(p.st.raw||0)+v;m.hp-=v;v=ev2;}p.st.dmg+=v;if(kind==='aoe')p.st.dmgAoe+=v;else if(kind==='basic')p.st.basic+=v;else p.st.dmgSingle+=v;if(kind!=='basic')p.st.skill+=v;
  noteDmg(m,p,v*(m.type==='norm'?1:1));m.hitT=room.t;if(room.ev&&(m.type!=='norm'||R()<.35))ev({k:'hit',x:m.x,y:m.y,v:Math.round(rv),c:c.t,p:p.id,m:m.id,kind});
  if(m.hp<=0)kill(m,p)}
 function kill(m,p){if(m.dead)return;m.dead=true;room.killed+=m.type==='norm'?1:0;room.stats.kills++;if(p)p.st.kills++;ev({k:'die',x:m.x,y:m.y,t:m.type,id:m.id});
  if(m.taunt)endLock(m);if(m.type==='elite'&&room.isElite)room.eliteDone=true;if(m.type==='boss')room.bossDead=true}
 function hurt(p,v,src){if(p.down>0||p.soul)return;let mul=1;if(p.buffs.guard>room.t)mul*=1-p.buffs.guardDr;if(p.buffs.barrier>room.t)mul*=1-p.buffs.barrierDr;v*=mul;
  // devotion: tank absorbs 30%
  if(p.role!=='tank'){const tk=room.players.find(q=>q.buffs.devotion>room.t&&q.down<=0&&!q.soul&&q!==p&&dist(q,p)<10);if(tk){const ab=v*.3;v-=ab;tk.hp-=ab*(1-(tk.buffs.guard>room.t?tk.buffs.guardDr:0));tk.st.taken+=ab;tk.st.absorbed+=ab;if(tk.hp<=0)die(tk)}}
  p.hp-=v;p.st.taken+=v;room.stats.finSum+=v;ev({k:'hurt',x:p.x,y:p.y,v:Math.round(v),p:p.id});if(p.hp<=0)die(p)}
 function die(p){if(p.down>0||p.soul)return;p.hp=0;p.down=T.heal.downSec;p.deaths++;p.st.deaths++;p.buffs.poisonStk=0;p.buffs.poison=0;ev({k:'down',p:p.id,x:p.x,y:p.y});for(const m of room.mobs)if(m.tgt===p)m.tgt=null}
 const rescueMul=(p,fn,self)=>{const h=p.jd.healEff;if(fn==='revive')return h>=1?1:0;if(fn==='cleanse')return h>=1?1:0;if(h>=1)return 1;if(h>0)return h;const NB=(T.heal.nonHealerByTier||{})[room.tier]||{};return self?(NB.self??T.heal.nonHealer.self):(NB.allies??T.heal.nonHealer.allies)};
 function healTo(p,q,pct,fn){let eff=rescueMul(p,fn,p===q)*tune.healK;if(p.jd.healEff>=1&&T.heal.multiHealerK){const nh=room.players.filter(x=>x.jd.healEff>=1).length;if(nh>1)eff*=T.heal.multiHealerK}if(q.down>0||q.soul)return;const room_=q.maxhp-q.hp;let v=pct*q.maxhp*eff;if(q.buffs.poisonStk>0)v*=.7;const real=Math.min(v,room_);q.hp+=real;if(v>real)q.shield=Math.min(q.maxhp*.2,(q.shield||0)+(v-real)*T.heal.overhealShield);p.st.heal+=real;noteHeal(p,v);ev({k:'heal',x:q.x,y:q.y,v:Math.round(real),p:p.id})}
 // ---------- skill execution
 const alive=p=>p.down<=0&&!p.soul;
 function nearestMob(p,maxd,pred){let b=null,bd=maxd*maxd;for(const m of room.mobs){if(m.dead)continue;if(pred&&!pred(m))continue;const dx=m.x-p.x,dy=m.y-p.y,d=dx*dx+dy*dy;if(d<bd){bd=d;b=m}}return b}
 function bestCluster(p,rng,rad){let best=null,bc=0;const list=[];for(const m of room.mobs){if(m.dead)continue;const dx=m.x-p.x,dy=m.y-p.y;if(dx*dx+dy*dy<=rng*rng)list.push(m)}if(!list.length)return {m:null,c:0};
  const step=Math.max(1,Math.floor(list.length/14));for(let i=0;i<list.length;i+=step){const a=list[i];let c=0;for(const m of list){const dx=m.x-a.x,dy=m.y-a.y;if(dx*dx+dy*dy<=rad*rad)c++}if(c>bc){bc=c;best=a}}return {m:best,c:bc}}
 const skillRange=p=>p.jd.range>=5?8.5:3.6;
 const cdOf=(p,s)=>{let cd=s.cd;const C=T.cooldown_caps;const cap=s.ult?C.ultCap:C.activeCap;const red=Math.min(cap,(p.cdr||0));cd*=1-red;const fl=s.ult?C.floors.ult:s.fn==='heal'?C.floors.heal:s.fn==='taunt'?C.floors.taunt:s.fn==='revive'?C.floors.revive:(s.type==='atk'?C.floors.active:0);return Math.max(fl,cd)};
 function cast(p,s,tgt){p.cd[s.id]=cdOf(p,s);p.lock=s.lock||1.2;p.st.casts++;let ok=true;
  if(s.type==='atk'){const m=tgt;const sc=s.m*p.atk;
   if(s.shape==='single'||s.shape==='multi'||s.shape==='ramp'||s.shape==='proc'||s.shape==='half'||s.shape==='burst'){hit(p,m,sc*(m.type!=='norm'?tune.singleBigMul:1),'single',1);ev({k:'cast',p:p.id,s:s.id,shape:s.shape,x:m.x,y:m.y,r:0})}
   else{const rad=s.radius||3;const cx=m.x,cy=m.y;let cnt=0;const hits=[];for(const q of room.mobs){if(q.dead)continue;const dx=q.x-cx,dy=q.y-cy;if(dx*dx+dy*dy<=rad*rad)hits.push(q)}cnt=hits.length;
    // ultimate = big multi-wave burst; aoe shape damage per target
    const per=s.ult?sc/Math.max(1,Math.min(cnt,s.f))*1.0:sc;
    for(const q of hits)hit(p,q,per,'aoe',cnt);ev({k:'cast',p:p.id,s:s.id,shape:s.shape,x:cx,y:cy,r:rad,ult:s.ult,job:p.job,n:cnt})}
   if(s.ult)for(const q of room.players)if(q!==p&&q.down<=0)for(const k of q.kit)if(k.ult)q.cd[k.id]=Math.max(0,q.cd[k.id]-cdOf(q,k)*T.cooldown_caps.relay.ultShare)}
  else switch(s.fn){
   case 'heal':{let b=null,bv=2;for(const q of room.players)if(alive(q)&&dist(p,q)<=T.heal.healRange){const v=q.hp/q.maxhp;if(v<bv){bv=v;b=q}}if(b)healTo(p,b,T.heal.singlePct*(s.pct/(.08*2.6)),'heal');break}
   case 'partyHeal':{for(const q of room.players)if(alive(q)&&dist(p,q)<=T.heal.partyRadius)healTo(p,q,T.heal.partyPct*(s.pct/(.05*2.4)),'heal');ev({k:'cast',p:p.id,s:s.id,shape:'partyHeal',x:p.x,y:p.y,r:T.heal.partyRadius});break}
   case 'selfHeal':healTo(p,p,s.pct,'heal');break;
   case 'revive':{const d=room.players.filter(q=>q.down>0&&dist(p,q)<=T.heal.healRange).sort((a,b)=>a.down-b.down)[0];if(d&&rescueMul(p,'revive')>0){p.reviving={q:d,t:T.heal.reviveCast};p.lock=T.heal.reviveCast}else{p.cd[s.id]=0;ok=false}break}
   case 'cleanse':{for(const q of room.players)if(alive(q)&&dist(p,q)<=T.heal.partyRadius&&(q===p||rescueMul(p,'cleanse')>0)){q.buffs.poison=0;q.buffs.poisonStk=0;q.buffs.curse=0;q.buffs.silence=0}break}
   case 'taunt':{const m=tgt;if(m){const lv=10;tryTaunt(m,p,lv);ev({k:'cast',p:p.id,s:s.id,shape:'taunt',x:m.x,y:m.y,r:0})}break}
   case 'tauntGroup':{for(const m of room.mobs)if(!m.dead&&m.type==='norm'&&dist(m,p)<=s.radius)tryTaunt(m,p,10);ev({k:'cast',p:p.id,s:s.id,shape:'tauntGroup',x:p.x,y:p.y,r:s.radius});break}
   case 'guard':p.buffs.guard=room.t+s.dur;p.buffs.guardDr=s.dr;break;
   case 'barrier':{let b=p;let bv=p.hp/p.maxhp;for(const q of room.players)if(alive(q)&&dist(p,q)<=10&&q.hp/q.maxhp<bv){bv=q.hp/q.maxhp;b=q}b.buffs.barrier=room.t+s.dur;b.buffs.barrierDr=s.dr;break}
   case 'devotion':p.buffs.devotion=room.t+s.dur;break;
   case 'partyBuff':if(s.dmg>=room.buff.dmg||room.buff.until<room.t){room.buff.dmg=s.dmg;room.buff.until=room.t+s.dur}break;
   case 'debuff':room.enemyTaken={v:s.taken,until:room.t+s.dur};break;
   default:break}
  return ok}
 // ---------- bots
 function ready(p,s){return p.cd[s.id]<=0&&!(p.buffs.silence>room.t)}
 function weakest(p,r){let b=null,bv=2;for(const q of room.players)if(alive(q)&&dist(p,q)<=r){const v=q.hp/q.maxhp;if(v<bv){bv=v;b=q}}return {q:b,v:bv}}
 function lowCount(p,th){let c=0;for(const q of room.players)if(alive(q)&&dist(p,q)<=T.heal.partyRadius&&q.hp/q.maxhp<th)c++;return c}
 function botThink(p){
  const myFns=p.kit.filter(s=>s.type==='fn'),atks=p.kit.filter(s=>s.type==='atk');
  // potion / feather
  if(p.hp/p.maxhp<.5&&p.potCd<=0&&p.potions>0&&!(p.buffs.curse>room.t)){p.hp=Math.min(p.maxhp,p.hp+tier.potion.pct*p.maxhp);p.potCd=tier.potion.cd;p.potions--}
  if(room.feathers>0&&room.featherCd<=0&&!(p.role==='healer')){const d=room.players.find(q=>q.down>0&&dist(p,q)<12);if(d&&p.lock<=0){room.feathers--;room.featherCd=T.heal.featherCd;reviveP(d,T.heal.featherHp);p.lock=1}}
  if(p.lock>0||p.reviving)return;
  const bossNear=room.boss&&!room.boss.dead;
  // role functions
  if(p.bot==='healer'){
   const rv=myFns.find(s=>s.fn==='revive');if(rv&&ready(p,rv)&&room.players.some(q=>q.down>0&&dist(p,q)<10)){cast(p,rv);return}
   const cl=myFns.find(s=>s.fn==='cleanse');if(cl&&ready(p,cl)&&room.players.some(q=>alive(q)&&(q.buffs.poisonStk>0||q.buffs.curse>room.t||q.buffs.silence>room.t))){cast(p,cl);return}
   const ph=myFns.find(s=>s.fn==='partyHeal');if(ph&&ready(p,ph)&&lowCount(p,.8)>=2){cast(p,ph);return}
   const h=myFns.find(s=>s.fn==='heal');const w=weakest(p,T.heal.healRange);if(h&&ready(p,h)&&w.q&&w.v<.85){cast(p,h);return}
   const bar=myFns.find(s=>s.fn==='barrier');if(bar&&ready(p,bar)&&(w.v<.6||(bossNear&&room.boss.windup>0))){cast(p,bar);return}
  }else if(p.bot==='tank'){
   const near=nearestMob(p,7);
   // peel: mobs targeting others
   const tg=myFns.find(s=>s.fn==='tauntGroup');if(tg&&ready(p,tg)){let c=0;for(const m of room.mobs)if(!m.dead&&m.type==='norm'&&dist(m,p)<=tg.radius&&m.tgt!==p)c++;if(c>=3){cast(p,tg);return}}
   const ta=myFns.find(s=>s.fn==='taunt');if(ta&&ready(p,ta)){const big=nearestMob(p,7,m=>m.type!=='norm'&&m.tgt!==p&&(!m.mark||m.mark.until<room.t));const any=near&&near.tgt&&near.tgt!==p&&near.type==='norm'?near:null;const t=big||any;if(t){cast(p,ta,t);return}}
   const gd=myFns.find(s=>s.fn==='guard'||s.fn==='barrier');if(gd&&ready(p,gd)&&(p.hp/p.maxhp<.6||(bossNear&&room.boss.windup>0&&room.boss.curMove==='heavy'))){cast(p,gd);return}
   const dv=myFns.find(s=>s.fn==='devotion');if(dv&&ready(p,dv)&&room.players.some(q=>q!==p&&alive(q)&&q.hp/q.maxhp<.5)){cast(p,dv);return}
   const dv2=myFns.find(s=>s.fn==='guard'&&s!==gd);if(dv2&&ready(p,dv2)&&p.hp/p.maxhp<.5){cast(p,dv2);return}
  }else if(p.bot==='support'){
   const pb=myFns.find(s=>s.fn==='partyBuff'&&ready(p,s));if(pb&&room.mobs.length>2){cast(p,pb);return}
   const db=myFns.find(s=>s.fn==='debuff'&&ready(p,s));if(db&&bossNear){cast(p,db);return}
  }
  // generic function skills (guard etc. for others)
  for(const s of myFns){if(s.fn==='guard'&&p.bot==='dps'&&ready(p,s)&&p.hp/p.maxhp<.5){cast(p,s);return}if(s.fn==='partyBuff'&&ready(p,s)&&p.bot!=='support'&&room.mobs.length>4){cast(p,s);return}}
  // non-healer carrying heal skill swap
  if(p.kit.some(s=>s.fn==='heal')&&p.bot!=='healer'){const h=p.kit.find(s=>s.fn==='heal');if(ready(p,h)){const w=weakest(p,T.heal.healRange);if(w.q&&w.v<.5){cast(p,h);return}}}
  // attacks
  const rng=skillRange(p);const rdy=atks.filter(s=>ready(p,s));
  if(rdy.length){
   const big=nearestMob(p,rng,m=>m.type!=='norm');
   // ultimates: boss/elite present or big cluster
   for(const s of rdy)if(s.ult){const cl=bestCluster(p,rng,s.radius||3);if((big&&big.hp>big.maxhp*.15)||cl.c>=14){cast(p,s,cl.m&&cl.c>=14?cl.m:big);return}}
   const best=bestCluster(p,rng,3);
   for(const s of rdy.filter(s=>!s.ult&&s.f>1).sort((a,b)=>b.f-a.f)){const cl=best.c>=3?bestCluster(p,rng,s.radius||3):best;if(cl.m&&cl.c>=3){cast(p,s,cl.m);return}if(big&&cl.c>=1&&R()<.5){cast(p,s,big);return}}
   for(const s of rdy.filter(s=>!s.ult&&s.f===1)){const t=big||nearestMob(p,rng);if(t){cast(p,s,t);return}}
   for(const s of rdy.filter(s=>!s.ult)){const t=nearestMob(p,rng);if(t){cast(p,s,t);return}}
  }
 }
 function reviveP(q,pct){q.down=0;q.soul=0;q.hp=q.maxhp*pct;ev({k:'revive',p:q.id,x:q.x,y:q.y})}
 // ---------- boss moves
 function bossAct(b,dt_){
  if(b.stun>0){b.stun-=dt_;return}
  for(const k in b.mcd)b.mcd[k]-=dt_;
  if(b.windup>0){b.windup-=dt_;const tl=b.tele_;if(tl){if(b.curMove==='heavy'&&b.tgt){tl.x=b.tgt.x;tl.y=b.tgt.y}}if(b.windup<=0)resolveMove(b);return}
  b.gap-=dt_;
  if(b.gap<=0){const ready_=b.moves.filter(k=>b.mcd[k]<=0);if(ready_.length){const k=ready_[(R()*ready_.length)|0];beginMove(b,k);return}}
 }
 const CD_MOVE={heavy:11,mark:14,pulse:12,sweep:13,summon:45};
 function beginMove(b,k){b.curMove=k;b.windup=rr(1.5,2.5);b.mcd[k]=CD_MOVE[k]*(1-.04*tierIdx)+b.windup;b.gap=3;const al=room.players.filter(alive);if(!al.length)return;
  let tg=b.tgt&&alive(b.tgt)?b.tgt:al[0];
  if(k==='heavy'){let top=al[0],tv=-1;for(const p of al){const v=mobDmgOf(b,p)*((ROLE_THR[p.role]||{}).threat||1)+(b.taunt&&b.taunt.by===p.id?1e9:0);if(v>tv){tv=v;top=p}}b.moveTgt=top;b.tele_={type:'circle',x:top.x,y:top.y,r:2.8,t0:room.t,dur:b.windup,move:k}}
  else if(k==='mark'){const mk=room.mark_alt=!room.mark_alt;let c=al[0];if(mk){for(const p of al)if(p.hp/p.maxhp<c.hp/c.maxhp)c=p}else{for(const p of al)if(dpsOf(p)>dpsOf(c))c=p}b.moveTgt=c;b.tele_={type:'circle',x:c.x,y:c.y,r:3.2,t0:room.t,dur:b.windup,move:k};if(R()>.15||true)dodgeOrder(c,b.tele_)}
  else if(k==='sweep'){const a=Math.atan2(tg.y-b.y,tg.x-b.x);b.tele_={type:'cone',x:b.x,y:b.y,r:7,a,w:2.1,t0:room.t,dur:b.windup,move:k}}
  else if(k==='pulse'){b.tele_={type:'ring',x:b.x,y:b.y,r:99,t0:room.t,dur:b.windup,move:k}}
  else if(k==='summon'){b.tele_={type:'ring',x:b.x,y:b.y,r:4,t0:room.t,dur:b.windup,move:k}}
  ev({k:'tele',t:b.tele_,boss:b.id});room.tele.push(b.tele_);
  if(k==='sweep'||k==='mark'||k==='heavy')for(const p of al)if(p.bot!=='tank'||k==='sweep')dodgeOrder(p,b.tele_)}
 function inZone(p,z){if(z.type==='circle')return Math.hypot(p.x-z.x,p.y-z.y)<=z.r;if(z.type==='cone'){const dx=p.x-z.x,dy=p.y-z.y;const d=Math.hypot(dx,dy);if(d>z.r)return false;let da=Math.abs(Math.atan2(dy,dx)-z.a);if(da>Math.PI)da=2*Math.PI-da;return da<=z.w/2}return false}
 function dodgeOrder(p,z){if(p.bot==='tank'&&z.move!=='mark')return;if(!inZone(p,z))return;if(R()<p.err+(p.ai?.3:0))return;const d=p.react+.15;p.dodgeAt=room.t+d;p.dodgeZone=z}
 function resolveMove(b){const z=b.tele_;room.tele=room.tele.filter(x=>x!==z);b.tele_=null;const k=b.curMove;b.curMove=null;const al=room.players.filter(alive);let any=0;
  if(k==='heavy'){const t=b.moveTgt;if(t&&alive(t)&&inZone(t,z)){hurtBoss(b,t,3.0);any=1;if(tierIdx>=1&&R()<.5)addStatus(t,'poison')}}
  else if(k==='mark'){for(const p of al)if(inZone(p,z)){hurtBoss(b,p,2.5);any=1;if(tierIdx>=2)addStatus(p,R()<.5?'curse':'poison')}}
  else if(k==='sweep'){for(const p of al)if(inZone(p,z)){hurtBoss(b,p,1.8);any=1}}
  else if(k==='pulse'){const f=.12*tier.pulse*(1+P.bossMechPerExtra*(n-1));for(const p of al){hurt(p,p.maxhp*f);if(tierIdx>=1&&R()<.4)addStatus(p,'silence')}any=1}
  else if(k==='summon'){spawnAround(b,Math.round(6+n*.8));b.summonDr=room.t+15;any=1}
  if(!any&&(k==='heavy'||k==='mark')){b.stun=5;ev({k:'stun',id:b.id})}
  ev({k:'move',m:k,x:b.x,y:b.y,id:b.id});b.gap=2.5}
 function hurtBoss(b,p,k){hurt(p,b.atk*k)}
 function spawnAround(b,k){for(let i=0;i<k;i++){const a=R()*6.283,d=rr(2,5);const m=mkMob('norm',b.x+Math.cos(a)*d,b.y+Math.sin(a)*d);room.spawned++;m.summoned=true}}
 function addStatus(p,s){if(s==='poison'){p.buffs.poison=room.t+10;p.buffs.poisonStk=Math.min(3,p.buffs.poisonStk+1)}else if(s==='curse')p.buffs.curse=room.t+10;else if(s==='silence')p.buffs.silence=room.t+4}
 // ---------- main step
 function step(){
  const t=room.t,d=dt;room.t+=d;room.stageT+=d;
  if(room.result)return;
  // players tick
  for(const p of room.players){
   for(const k in p.cd)if(p.cd[k]>0)p.cd[k]-=d;
   if(p.potCd>0)p.potCd-=d;if(p.lock>0)p.lock-=d;if(p.aspdCd>0)p.aspdCd-=d;
   if(p.down>0){p.down-=d;if(p.down<=0){p.soul=tier.soul+20*Math.max(0,p.deaths-1)}continue}
   if(p.soul>0){p.soul-=d;if(p.soul<=0){p.soul=0;p.hp=p.maxhp*T.heal.respawnHp;p.x=room.arena[0]/2;p.y=room.arena[1]/2}continue}
   if(p.buffs.poisonStk>0&&p.buffs.poison>room.t){const dm=p.maxhp*.008*p.buffs.poisonStk*d;p.hp-=dm;p.st.taken+=dm;if(p.hp<=0)die(p)}else if(p.buffs.poisonStk>0&&p.buffs.poison<=room.t)p.buffs.poisonStk=0;
   if(p.shield>0&&p.hp>=p.maxhp){p.hp=p.maxhp}
   if(p.reviving){p.reviving.t-=d;if(p.reviving.t<=0){const q=p.reviving.q;p.reviving=null;if(q.down>0)reviveP(q,T.heal.reviveHp)}continue}
   p.think-=d;if(p.think<=0&&room.phase==='fight'){p.think=p.perfect?.05:rr(.15,.4)+p.react*.2;botThink(p)}
   // movement + basic attack
   if(room.phase==='fight'&&p.lock<=0){
    const rng=p.jd.range;let tgt=nearestMob(p,Math.max(rng+1,6));
    if(p.dodgeAt&&room.t>=p.dodgeAt){const z=p.dodgeZone;p.dodgeAt=0;if(z&&inZone(p,z)){let dx=p.x-(z.x),dy=p.y-(z.y);const L=Math.hypot(dx,dy)||1;if(z.type==='cone'){const a=z.a+Math.PI/2*(R()<.5?1:-1);dx=Math.cos(a);dy=Math.sin(a);p.x+=dx*3.2;p.y+=dy*3.2}else{p.x+=dx/L*(z.r+.6-L+Math.min(L,0));p.y+=dy/L*(z.r+.6-L)}}}
    else{
     const cl0=nearestMob(p,60);const cx=avgX(),cy=avgY();
     const tk_=room.players.find(q=>(q.role==='tank'||q.bot==='tank')&&alive(q));
     // r13: during boss fights anchor formation on the boss (not the nearest add) so adds piling in don't collapse the party onto one spot
     const bb=room.boss&&!room.boss.dead&&tk_&&dist(tk_,room.boss)<14?room.boss:null;
     const cl=(bb&&p.role!=='tank'&&p.bot!=='tank'&&!(cl0&&dist(p,cl0)<1.2&&p.hp<p.maxhp*.35))?bb:cl0;
     // formation (r11): tank front toward enemy; healers/support/ranged in an arc behind the tank; spread by party index
     const fslot=(q,back)=>{const ux0=tk_.x-cl.x,uy0=tk_.y-cl.y,L=Math.hypot(ux0,uy0)||1,ux=ux0/L,uy=uy0/L;const i=room.players.indexOf(q),n=room.players.length;const lat=((i%7)-3)*1.8,b=back+((i/7)|0)*1.8+(cl.type==='boss'?2:0);return[tk_.x+ux*b-uy*lat,tk_.y+uy*b+ux*lat]};
     if(p.bot==='healer'||p.bot==='support'){if(tk_&&tk_!==p&&cl){const[ax,ay]=fslot(p,4.2);moveTo(p,ax,ay,d,.6)}else{const tk=tk_||p;moveTo(p,tk.x-Math.cos(0.6)*5,tk.y+4,d,3.5)}}
     else if(p.role==='tank'||p.bot==='tank'){const c=cl;if(c)moveTo(p,c.x,c.y,d,Math.max(.8,rng-.5))}
     else if(cl&&rng<5&&cl.type!=='norm'&&tk_&&tk_!==p){const i=room.players.indexOf(p),ux0=tk_.x-cl.x,uy0=tk_.y-cl.y,L=Math.hypot(ux0,uy0)||1,a0=Math.atan2(uy0,ux0),a=a0+((i%2?1:-1)*(0.6+((i>>1)%4)*0.35)),R=Math.max(rng*.85,1.8);moveTo(p,cl.x+Math.cos(a)*R,cl.y+Math.sin(a)*R,d,.4)}
     else if(cl&&rng>=5&&tk_&&tk_!==p&&dist(tk_,cl)<rng*.6&&!(p.hp<p.maxhp*.5&&dist(p,cl)<rng*.25)){const[ax,ay]=fslot(p,2.6);moveTo(p,ax,ay,d,.6)}
     else if(cl){const dd=dist(p,cl);const want=rng>=5?rng*.8:rng;if(dd>want+.3)moveTo(p,cl.x,cl.y,d,want);else if(rng>=5&&dd<rng*.25&&p.hp<p.maxhp*.5){moveTo(p,p.x-(cl.x-p.x),p.y-(cl.y-p.y),d,0)}}
    }
    // r13: soft separation between party members (min spacing 1.1) to avoid stacking
    for(const q of room.players){if(q===p||!alive(q))continue;const sx=p.x-q.x,sy=p.y-q.y,sl=Math.hypot(sx,sy);if(sl<1.1){const k=(1.1-sl)*.5,ux=sl>1e-3?sx/sl:Math.cos(room.players.indexOf(p)),uy=sl>1e-3?sy/sl:Math.sin(room.players.indexOf(p));p.x+=ux*k;p.y+=uy*k}}
    p.x=Math.max(.5,Math.min(room.arena[0]-.5,p.x));p.y=Math.max(.5,Math.min(room.arena[1]-.5,p.y));
    tgt=nearestMob(p,rng+.4);
    if(tgt&&p.aspdCd<=0){p.aspdCd=1/Math.min(1.6,p.jd.aspd*(1+(T.cooldown_caps.basicAspdBonus&&p.basicAspd||0)));hit(p,tgt,p.atk,'basic',1)}
   }
  }
  const living=room.players.filter(alive);
  // wipe
  if(room.phase==='fight'){
   if(!living.length&&!room.players.some(q=>q.down>0&&room.feathers>0)){room.wipeT+=d;if(room.wipeT>=T.party.wipeGraceSec){room.result='wipe';room.stats.wipes++;finish()}}else if(!living.length){room.wipeT+=d;if(room.wipeT>=T.party.wipeGraceSec+3){room.result='wipe';finish()}}else room.wipeT=0;
   if(room.featherCd>0)room.featherCd-=d;
  }
  if(room.result)return;
  if(room.phase==='fight'){
   // spawn
   room.spawnCd-=d;
   const aliveMobs=room.mobs.reduce((a,m)=>a+(m.dead?0:1),0);
   if(room.spawnCd<=0){room.spawnCd=rr(1.8,3);
    if(room.isElite&&!room.eliteSpawned&&room.killed>=room.quota*.3){spawnGroup(1,'elite');room.eliteSpawned=true}
    if(room.isBoss&&!room.bossSpawned&&room.killed>=room.quota*.45){spawnGroup(1,'boss');room.bossSpawned=true;room.boss=room.mobs[room.mobs.length-1];room.boss.enrageAt=room.t+RG.enrageSec;room.bossDead=false}
    const need=Math.min(capN-aliveMobs,room.quota-room.spawned-(room.isBoss&&!room.bossSpawned?0:0));
    if(need>=4||(need>0&&room.quota-room.spawned<=need)){spawnGroup(Math.min(need,rr(6,12)|0||6))}
   }
   // mobs
   const engaged=new Map();
   for(const m of room.mobs){if(m.dead)continue;
    if(m.stun>0&&m.type!=='boss'){m.stun-=d;continue}
    // retarget
    m.rt-=d;const lk=lockedBy(m);let tgt=m.tgt;
    if(m.mark&&m.mark.until>room.t){tgt=m.mark.p;m.tgt=tgt}
    else if(lk!=null){tgt=room.players[lk];m.tgt=tgt}
    else if(m.rt<=0||!tgt||!alive(tgt)){m.rt=TH.retargetSec*rr(.8,1.2);tgt=pickTarget(m);m.tgt=tgt}
    // big mob mark (switch)
    if(m.type!=='norm'&&tierIdx>=1){m.markT-=d;if(m.markT<=0){const sw=tier.switchSec;m.markT=rr(sw[0],sw[1]);const al=living;if(al.length>1){m.markAlt=!m.markAlt;let c=al[0];if(m.markAlt){for(const p of al)if(p.hp/p.maxhp<c.hp/c.maxhp)c=p}else{for(const p of al)if(dpsOf(p)>dpsOf(c))c=p}m.mark={p:c,until:room.t+4};ev({k:'mark',id:m.id,p:c.id})}}}
    if(!tgt||!alive(tgt)){continue}
    if(m.type==='boss'){bossAct(m,d);m.tgt=tgt;if(room.t>=m.enrageAt)m.atk*=1+.1*d/60}
    if(m.type==='boss'&&(m.windup>0||m.stun>0))continue;
    const dx=tgt.x-m.x,dy=tgt.y-m.y;const ddist=Math.hypot(dx,dy)||.001;const want=m.ranged?m.ringR:Math.max(.9,m.ringR*.6);
    if(ddist>m.range+.2){const sp=m.spd*d;m.x+=dx/ddist*Math.min(sp,ddist-want>0?ddist-want:0.0);m.y+=dy/ddist*Math.min(sp,ddist-want>0?ddist-want:0.0)}
    m.atkT-=d;
    if(ddist<=m.range+.6&&m.atkT<=0){const key=tgt.id;const c=engaged.get(key)||0;if(c<8||m.ranged||m.type!=='norm'){engaged.set(key,c+1);m.atkT=(m.type==='boss'?2:RG.mobAtkCd)*rr(.9,1.1);
      let v=m.atk*(m.type==='boss'?1.0:1)*rr(.85,1.15);if(lk!=null&&lk===tgt.id&&m.taunt){m.taunt.n--;if(m.taunt.n<=0)endLock(m)}
      if(tgt.shield>0){const ab=Math.min(tgt.shield,v);tgt.shield-=ab;v-=ab}
      hurt(tgt,v,m);if(m.type!=='norm'&&tierIdx>=2&&R()<.12)addStatus(tgt,'poison');ev({k:'mhit',x:m.x,y:m.y,id:m.id})}
    }
    if(tgt.role==='tank'&&m.type==='norm'){room.stats.tankN++;if(lk!=null||m.tgt===tgt)room.stats.tankUp++}
   }
   // cleanup
   if(room.mobs.length>400||(room.t*10|0)%50===0)room.mobs=room.mobs.filter(m=>!m.dead||room.t-(m.diedAt||(m.diedAt=room.t))<.3);
   // stage clear
   const cleared=room.killed>=room.quota&&(!room.isElite||room.eliteDone||!room.eliteSpawned&&false)&&(!room.isBoss||room.bossDead);
   if(cleared&&(!room.isElite||room.eliteDone)){stageDone()}
   if(room.boss&&!room.boss.dead&&room.t>=room.boss.enrageAt+120){room.result='timeout';finish()}
   if(room.stageT>1500){room.result='timeout';finish()}
  }else if(room.phase==='rest'){
   room.restT-=d;if(room.restT<=0){for(const p of room.players){if(p.down>0||p.soul>0)reviveP(p,.3);p.hp=Math.min(p.maxhp,p.hp+p.maxhp*tier.rest);p.shield=0;p.buffs.poisonStk=0;p.buffs.curse=0;p.buffs.silence=0}
    if(room.stage>=room.endStage){room.result='clear';finish()}else startStage(room.stage+1)}
  }
 }
 function moveTo(p,x,y,d,stop){const dx=x-p.x,dy=y-p.y,L=Math.hypot(dx,dy);if(L<=stop)return;const sp=4.5*d,st=Math.min(sp,L-stop);p.x+=dx/L*st;p.y+=dy/L*st}
 function stageDone(){room.stats.stageClear.push({stage:room.stage,t:room.stageT,alive:room.players.filter(alive).length});ev({k:'clear',i:room.stage});
  for(const m of room.mobs)m.dead=true;room.phase='rest';room.restT=(o.restSec!=null?o.restSec:15)}
 function finish(){room.stats.time=room.t;const tot=room.players.reduce((a,p)=>a+p.maxhp,0);room.stats.fin=room.stats.time>0?room.stats.finSum/tot/room.stats.time:0;ev({k:'end',r:room.result})}
 room.step=step;room.startStage=startStage;room.mkMob=mkMob;room.pickTarget=pickTarget;room.reviveP=reviveP;room.cast=cast;room.hurt=hurt;
 startStage(room.stage);
 return room}
function run(o,maxSteps){const r=create(o);let k=0;maxSteps=maxSteps||400000;while(!r.result&&k++<maxSteps)r.step();if(!r.result){r.result='timeout'}return r}
const api={create,run,TIERS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HDSim=api;
})(typeof window!=='undefined'?window:globalThis);
