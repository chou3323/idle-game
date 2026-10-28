const pp=require('/workspace/tools/pp/node_modules/puppeteer-core');const fs=require('fs');
(async()=>{const ids=process.argv[2]?process.argv[2].split(','):null;const out=process.argv[3]||'/workspace/work/h4/gen';fs.mkdirSync(out,{recursive:true});
const b=await pp.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--allow-file-access-from-files']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/gen.html');
const all=ids||await p.evaluate(()=>allIds());
for(const id of all){const r=await p.evaluate(i=>renderIds([i])[0].url,id);fs.writeFileSync(out+'/'+id+'.png',Buffer.from(r.split(',')[1],'base64'))}
for(const id of await p.evaluate(()=>bossIds())){const u=await p.evaluate(i=>renderBoss(i),id);fs.writeFileSync(out+'/'+id+'.png',Buffer.from(u.split(',')[1],'base64'))}
if(errs.length)console.log('ERR',errs.slice(0,5));console.log('ok',all.length);await b.close()})();
