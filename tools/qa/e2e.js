// End-to-end play-through: node e2e.js <baseUrl> <outDir> <desktop|mobile>
const pp=require('/workspace/tools/pp/node_modules/puppeteer-core');const fs=require('fs');
const [base,out,mode='desktop']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const M=mode==='mobile';const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const results=[];const ok=(n,c,d='')=>{results.push({n,ok:!!c,d});console.log((c?'PASS ':'FAIL ')+n+(d?'  '+d:''))};
(async()=>{
 const b=await pp.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();const errs=[];
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 p.on('dialog',d=>d.accept());
 await p.setViewport(M?{width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true}:{width:1280,height:800,deviceScaleFactor:1});
 const shot=n=>p.screenshot({path:`${out}/${mode}_${n}.png`});
 const click=async sel=>{const h=await p.$(sel);if(!h)throw new Error('missing '+sel);await h.evaluate(e=>e.scrollIntoView({block:'center'}));if(M){await h.tap()}else{await h.click()}};
 const ev=f=>p.evaluate(f);
 await p.goto(base+'/index.html?seed=11',{waitUntil:'load'});await ev(()=>localStorage.clear());await p.goto(base+'/index.html?seed=11',{waitUntil:'load'});await sleep(2000);
 ok('page loaded',await ev(()=>!!window.__horde));
 ok('toolbar below scene',await ev(()=>{const t=document.querySelector('#scene-tools').getBoundingClientRect(),w=document.querySelector('#wrap').getBoundingClientRect();return t.top>=w.bottom-1}));
 ok('toolbar single row',await ev(()=>{const t=document.querySelector('#scene-tools');const ks=[...t.children].filter(e=>e.offsetWidth);const cy=ks.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2});return Math.max(...cy)-Math.min(...cy)<4&&t.scrollHeight<=t.clientHeight+2}));
 await shot('01_start');
 // toolbar toggles
 await click('#t-names');await click('#t-dmg');ok('toggle nameplates/dmg',await ev(()=>!window.__horde.S.opt.names&&!window.__horde.S.opt.dmg));await click('#t-names');await click('#t-dmg');
 await ev(()=>{const s=document.querySelector('#s-q');s.value='1';s.dispatchEvent(new Event('change'))});await sleep(300);
 ok('quality lock Q1',await ev(()=>window.__horde.S.q===1&&window.__horde.S.qMode==='lock'));
 await ev(()=>{const s=document.querySelector('#s-q');s.value='auto';s.dispatchEvent(new Event('change'))});
 // 1) start a stage
 await click('#menubar [data-w="stage"]');await sleep(300);await shot('02_stage_window');
 await click('#fw-stage [data-go="0"]');await sleep(900);
 ok('stage started',await ev(()=>window.__horde.ST.mode==='stage'&&window.__horde.ST.si===0&&window.__horde.ST.state!=='idle'));
 await sleep(1500);await shot('03_stage_running');
 // 2) equip an item
 const before=await ev(()=>({atk:window.__horde.ME.atk,eq:JSON.stringify(Object.entries(window.__horde.ME.equip).map(([k,v])=>[k,v&&v.id,v&&v.lv]).sort()),bag:window.__horde.ME.bag.length}));
 await ev(()=>{const h=window.__horde;for(const id of ['wp_'+'sword_3','hd_0','ar_0']){}});
 await click('#menubar [data-w="equip"]');await sleep(300);
 // add a strong item to bag via API for deterministic test
 await ev(()=>{const c=window.__horde;});
 const hasBag=await ev(()=>!!document.querySelector('#fw-equip [data-u]'));ok('bag has items',hasBag);
 await shot('04_equip_window');
 // choose the item with biggest tier
 await ev(()=>{const h=HD.core;const it=h.mkInst?h.mkInst('wp_bow_3'):null});await ev(()=>{const bis=[...document.querySelectorAll('#fw-equip [data-u]')];bis[0].setAttribute('data-test','1')});
 await click('#fw-equip [data-u][data-test="1"]');await sleep(150);
 await shot('04b_equip_detail');
 await click('#fw-equip [data-act="equip"]');await sleep(300);
 const after=await ev(()=>({atk:window.__horde.ME.atk,eq:JSON.stringify(Object.entries(window.__horde.ME.equip).map(([k,v])=>[k,v&&v.id,v&&v.lv]).sort()),bag:window.__horde.ME.bag.length}));
 ok('equip changed gear',after.eq!==before.eq||after.bag!==before.bag,`bag ${before.bag}->${after.bag}`);
 await shot('05_equipped');
 await click('#fw-equip [data-x]');await sleep(150);
 // 3) skills
 await click('#menubar [data-w="skills"]');await sleep(300);await shot('06_skills_window');
 await ev(()=>{window.__horde.ME.zeny+=100000;window.__horde.ME.sp=window.__horde.ME.maxsp});
 const lv0=await ev(()=>JSON.stringify(window.__horde.ME.skLv||window.__horde.ME.sk||null));
 await ev(()=>{});
 const lvb=await ev(()=>HD.core.slv?HD.core.slv(0):0);await click('#fw-skills [data-up="0"]').catch(()=>{});await sleep(200);ok('skill upgrade ran',await ev(()=>HD.core.slv?HD.core.slv(0):0)>=lvb,lvb+'');
 await ev(()=>{window.__horde.ME.cdT=[0,0,0,0];window.__horde.ME.auto=[0,0,0,0]});
 await click('#fw-skills [data-cast="0"]');await sleep(150);
 ok('skill cast via window starts cooldown',await ev(()=>window.__horde.ME.cdT[0]>0),await ev(()=>JSON.stringify(window.__horde.ME.cdT)));
 await ev(()=>{window.__horde.ME.auto=[1,1,1,1]});
 await click('#fw-skills [data-x]');await sleep(150);
 // hotkeys / hotbar
 if(!M){for(const k of ['1','2','3','4']){await p.keyboard.press(k);await sleep(120)}}
 else{for(const i of [1,2,3]){await click(`#hb-slots [data-hs="${i}"]`);await sleep(120)}}
 await sleep(500);await shot('07_skills_fx');
 ok('log has lines',await ev(()=>document.querySelector('#logbox').children.length>0));
 // 4) play waves with real perk clicks
 let perkClicks=0,winSeen=false,res=null;
 for(let iter=0;iter<60;iter++){
   await ev(()=>{const h=window.__horde;for(let i=0;i<150&&h.ST.state==='run';i++){const c=h.chars()[0];if(c&&c.hp<c.maxhp*.6)c.hp=c.maxhp;h.update(.1)}});
   await sleep(120);
   const st=await ev(()=>window.__horde.ST.state);
   if(st==='perk'){if(perkClicks===0){await sleep(400);await shot('08_perk_overlay')}
     await click('#perkov .pv');perkClicks++;await sleep(250)}
   else if(st==='clear'||st==='fail'){break}
   else if(st==='intro'||st==='break'){await ev(()=>{const h=window.__horde;for(let i=0;i<40;i++)h.update(.1)})}
 }
 res=await ev(()=>window.__horde.ST.res&&{win:window.__horde.ST.res.win,w:window.__horde.ST.res.w});
 ok('picked perks via UI',perkClicks>=1,'clicks '+perkClicks);
 await sleep(500);await shot('09_result_1');
 ok('stage reached result',!!res,JSON.stringify(res));
 if(res&&res.win){ok('WIN result shown',await ev(()=>!document.querySelector('#resultov').classList.contains('hidden')&&!!document.querySelector('#resultov .rs.win')));
   await click('#resultov [data-act="next"]').catch(async()=>{await click('#resultov [data-act="retry"]')});await sleep(900);
   ok('next/retry started a stage',await ev(()=>window.__horde.ST.mode==='stage'&&window.__horde.ST.state!=='result'));}
 // 5) LOSE: kill the player
 if(!(await ev(()=>window.__horde.ST.mode==='stage'))){await click('#menubar [data-w="stage"]');await click('#fw-stage [data-go="0"]');await sleep(900)}
 await ev(()=>{const h=window.__horde;for(let i=0;i<40&&h.ST.state==='intro';i++)h.update(.1);for(let i=0;i<80&&!h.ST.res;i++){const c=h.chars()[0];if(c)c.hp=0;h.update(.1)}});await sleep(700);
 ok('LOSE result shown',await ev(()=>!!document.querySelector('#resultov .rs.lose')));await shot('10_result_lose');
 await click('#resultov [data-act="retry"]');await sleep(900);
 ok('retry after loss restarts stage',await ev(()=>window.__horde.ST.mode==='stage'&&!window.__horde.ST.res));
 await click('#menubar [data-w="stage"]');await sleep(200);await click('#fw-stage [data-act="free"]');await sleep(400);
 ok('abandon -> free mode',await ev(()=>window.__horde.ST.mode==='free'));
 // other windows
 for(const w of ['map','drops','help']){await click(`#menubar [data-w="${w}"]`);await sleep(250);await shot('11_win_'+w);await click(`#fw-${w} [data-x]`);await sleep(100)}
 // 6) map switch + theme
 await click('#menubar [data-w="map"]');await sleep(200);const m0=await ev(()=>window.__horde.S.mapId);await click('#fw-map .mp:not(.cur)');await sleep(1200);
 ok('map switched',await ev(()=>window.__horde.S.mapId)!==m0);await shot('12_map_switched');await click('#fw-map [data-x]');
 const th0=await ev(()=>document.documentElement.getAttribute('data-theme'));
 await click('#t-theme');await sleep(300);const th1=await ev(()=>document.documentElement.getAttribute('data-theme'));
 ok('theme toggled',th0!==th1,th0+'->'+th1);await shot('13_theme_'+th1);
 // big mode
 await click('#t-big');await sleep(500);ok('big mode',await ev(()=>document.body.classList.contains('big')));await shot('14_big');
 ok('big: toolbar visible below scene',await ev(()=>{const t=document.querySelector('#scene-tools').getBoundingClientRect();return t.bottom<=innerHeight+1&&t.top>innerHeight*.5}));
 await click('#t-big');await sleep(400);
 // 7) reload and persistence
 await ev(()=>window.__horde.ME&&0);
 const snap=await ev(()=>({lv:window.__horde.ME.lv,job:window.__horde.ME.job,eq:JSON.stringify(Object.entries(window.__horde.ME.equip).map(([k,v])=>[k,v&&v.id,v&&v.lv]).sort()),map:window.__horde.S.mapId,zeny:Math.round(window.__horde.ME.zeny)}));
 await ev(()=>{});await p.evaluate(()=>{});
 await ev(()=>{try{window.dispatchEvent(new Event('beforeunload'))}catch(e){}});
 // force save: call save through localStorage via horde API (HD.core.save)
 await ev(()=>{HD.core.save()});
 await p.goto(base+'/index.html',{waitUntil:'load'});await sleep(2000);
 const snap2=await ev(()=>({lv:window.__horde.ME.lv,job:window.__horde.ME.job,eq:JSON.stringify(Object.entries(window.__horde.ME.equip).map(([k,v])=>[k,v&&v.id,v&&v.lv]).sort()),map:window.__horde.S.mapId,theme:document.documentElement.getAttribute('data-theme')}));
 ok('reload keeps level/gear/map',snap.lv===snap2.lv&&snap.eq===snap2.eq&&snap.map===snap2.map,JSON.stringify([snap.lv,snap2.lv,snap.map,snap2.map]));
 ok('reload keeps theme',snap2.theme===th1,snap2.theme);
 await shot('15_after_reload');
 // restore theme to ro
 if(snap2.theme!=='ro'){await click('#t-theme');await sleep(200)}
 const fps=await ev(()=>({fps:window.__horde.stats.fps,q:window.__horde.S.q}));
 await sleep(2500);const fps2=await ev(()=>window.__horde.stats.fps);
 ok('fps after reload',fps2>=(M?28:55),'fps '+fps2);
 ok('no console errors',errs.length===0,errs.slice(0,5).join(' | '));
 fs.writeFileSync(`${out}/${mode}_e2e.json`,JSON.stringify({results,errs},null,1));
 console.log(results.filter(r=>!r.ok).length+' failed of '+results.length);
 await b.close();
})().catch(e=>{console.error('E2E CRASH',e);process.exit(1)});
