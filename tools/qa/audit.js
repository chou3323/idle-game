// Layout audit: node audit.js <baseUrl> <outDir> [tag]
const pp=require('/workspace/tools/pp/node_modules/puppeteer-core');
const fs=require('fs');
const [base,out,tag='a',only]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const PROFILES=[
 {n:'d1280',w:1280,h:800,touch:false},
 {n:'d1024',w:1024,h:700,touch:false},
 {n:'t768',w:768,h:1024,touch:true},
 {n:'t768n',w:768,h:1024,touch:false},
 {n:'m390',w:390,h:844,touch:true},
 {n:'m360',w:360,h:640,touch:true},
 {n:'ml844',w:844,h:390,touch:true},
];
const STATES=['base','stage','equip','skills','map','drops','help','log','big','bigside','perk','result','xp'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CHECK=`(function(touch){
  const vw=innerWidth,vh=innerHeight,res=[];
  const vis=e=>{const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return null;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return null;
    for(let p=e;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden')return null}return r};
  const name=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'')||e.tagName;
  const label=e=>name(e)+'['+(e.textContent||e.getAttribute('aria-label')||e.title||'').trim().slice(0,14)+']';
  if(document.documentElement.scrollWidth>vw+1)res.push({k:'hscroll',d:document.documentElement.scrollWidth+'>'+vw});
  // tap targets
  const minT=touch?40:23;
  document.querySelectorAll('button,select,input,[data-w],.hs,.bi,.slot,.mp,.pv,summary,a[href]').forEach(e=>{const r=vis(e);if(!r)return;
    if(e.closest('.hidden'))return;
    if(e.type==='range'){if(r.height<minT-6)res.push({k:'tap',d:label(e)+' '+Math.round(r.width)+'x'+Math.round(r.height)});return}
    if(e.type==='checkbox'){const l=e.closest('label');const rr=l&&vis(l)||r;if(Math.min(rr.width,rr.height)<minT)res.push({k:'tap',d:label(l||e)+' '+Math.round(rr.width)+'x'+Math.round(rr.height)});return}
    if(Math.min(r.width,r.height)<minT)res.push({k:'tap',d:label(e)+' '+Math.round(r.width)+'x'+Math.round(r.height)})});
  // out of viewport
  document.querySelectorAll('#app *,body>.fw').forEach(e=>{const r=vis(e);if(!r)return;if(e.closest('canvas'))return;
    const cs=getComputedStyle(e);if(!/button|select|input|label/i.test(e.tagName)&&!e.matches('.fw,#logwin,#hotbar,#mini,#menubar,.scene-tools,#side>.win'))return;
    if(r.right>vw+1||r.left<-1)res.push({k:'offscreen-x',d:label(e)+' '+Math.round(r.left)+'..'+Math.round(r.right)})});
  // clipped text
  document.querySelectorAll('#app *,body>.fw').forEach(e=>{const r=vis(e);if(!r||e.children.length>3)return;if(!e.textContent.trim())return;
    if(e.scrollWidth>e.clientWidth+2&&e.clientWidth>0){const cs=getComputedStyle(e);if(cs.overflowX!=='visible'||cs.textOverflow==='ellipsis')res.push({k:'clip',d:label(e)+' '+e.scrollWidth+'>'+e.clientWidth+(cs.textOverflow==='ellipsis'?' ellipsis':'')})}});
  // overlaps among HUD pieces
  const ids=['#logwin','#hotbar','#mini','#hud-tl','#hud-tr','#bossbar','#stagehud','#combo','.scene-tools','#menubar'];
  const rs=ids.map(s=>{const e=document.querySelector(s);if(!e)return null;const r=vis(e);return r&&{s,r}}).filter(Boolean);
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i].r,b=rs[j].r;const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(ox>4&&oy>4){const mini=rs[i].s==='#mini'&&document.querySelector('#mini')&&getComputedStyle(document.querySelector('#mini')).display==='none';if(!mini)res.push({k:'overlap',d:rs[i].s+' x '+rs[j].s+' '+Math.round(ox)+'x'+Math.round(oy)})}}
  // HUD vs scene rect: hud pieces outside scene-wrap
  const wr=vis(document.querySelector('#wrap'));
  if(wr)['#logwin','#hotbar','#mini'].forEach(s=>{const e=document.querySelector(s);const r=e&&vis(e);if(r&&(r.right>wr.right+1||r.bottom>wr.bottom+1||r.left<wr.left-1||r.top<wr.top-1))res.push({k:'outside-scene',d:s+' '+JSON.stringify([r.left,r.top,r.right,r.bottom].map(Math.round))+' wrap '+JSON.stringify([wr.left,wr.top,wr.right,wr.bottom].map(Math.round))})});
  // scene visible area
  if(wr)res.push({k:'info',d:'scene '+Math.round(wr.width)+'x'+Math.round(wr.height)});
  const tools=document.querySelector('.scene-tools'),tr=tools&&vis(tools);if(tr&&wr)res.push({k:'info',d:'tools '+Math.round(tr.width)+'x'+Math.round(tr.height)+' '+(tr.top>wr.top?'below':'above')+' scene'});
  const mb=document.querySelector('#menubar'),mr=mb&&vis(mb);if(mr)res.push({k:'info',d:'menubar h'+Math.round(mr.height)});
  // open windows beyond viewport / bigger than viewport
  document.querySelectorAll('.fw').forEach(e=>{const r=vis(e);if(!r)return;if(r.bottom>vh+1||r.top<-1)res.push({k:'win-off',d:e.id+' '+Math.round(r.top)+'..'+Math.round(r.bottom)+' vh'+vh});
    if(e.querySelector('.fwb')){const b=e.querySelector('.fwb');if(b.scrollHeight>b.clientHeight+2){res.push({k:'info',d:e.id+' scrolls '+b.scrollHeight+'/'+b.clientHeight})}}});
  return res})`;
(async()=>{
 const b=await require('/workspace/tools/pp/node_modules/puppeteer-core').launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--hide-scrollbars']});
 const report={};
 for(const P of PROFILES){if(only&&!only.split(',').includes(P.n))continue;
  for(const st of STATES){
   const p=await b.newPage();const errs=[];p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
   await p.setViewport({width:P.w,height:P.h,deviceScaleFactor:1,isMobile:P.touch,hasTouch:P.touch});
   let url=base+'/index.html?fresh=1&seed=5'+(st==='xp'?'&theme=xp':'');
   if(st==='stage')url+='&stage=0,0';
   await p.goto(url,{waitUntil:'load'});await sleep(1800);
   const act=async()=>{
    if(['equip','skills','map','drops','help'].includes(st)){await p.evaluate(s=>document.querySelector('#menubar [data-w="'+s+'"]').click(),st)}
    if(st==='stage'){await p.evaluate(()=>document.querySelector('#menubar [data-w="stage"]').click())}
    if(st==='log'){await p.evaluate(()=>document.querySelector('#log-exp').click())}
    if(st==='big'||st==='bigside'){await p.evaluate(()=>document.querySelector('#t-big').click())}
    if(st==='bigside'){await p.evaluate(()=>document.querySelector('#t-gear').click())}
    if(st==='perk'){await p.evaluate(()=>{const h=window.__horde;h.stageStart(0,0).then(()=>{})});await sleep(500);await p.evaluate(()=>{const h=window.__horde;for(let i=0;i<400&&h.ST.state!=='perk';i++)h.update(.1)})}
    if(st==='result'){await p.evaluate(async()=>{const h=window.__horde;await h.stageStart(0,0);h.ME.hp=1;for(let i=0;i<3000&&h.ST.state!=='result'&&h.ST.state!=='perk';i++)h.update(.1)})}
   };
   await act();await sleep(700);
   const res=await p.evaluate(CHECK+'('+P.touch+')');
   await p.screenshot({path:`${out}/${tag}_${P.n}_${st}.png`});
   const fps=await p.evaluate(()=>window.__horde&&window.__horde.stats.fps);
   report[P.n+'/'+st]={res,errs,fps};
   await p.close();
  }
 }
 await b.close();
 fs.writeFileSync(`${out}/${tag}_report.json`,JSON.stringify(report,null,1));
 let tot=0;for(const k in report){const r=report[k].res.filter(x=>x.k!=='info');tot+=r.length;if(r.length||report[k].errs.length){console.log('## '+k);const seen={};r.forEach(x=>{const key=x.k+x.d;if(seen[key])return;seen[key]=1;console.log('  '+x.k+': '+x.d)});report[k].errs.slice(0,3).forEach(e=>console.log('  ERR '+e))}}
 console.log('TOTAL issues',tot);
})();
