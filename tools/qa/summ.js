const r=require(process.argv[2]);const filt=process.argv[3]||'';const g={};
for(const k in r){const [p,s]=k.split('/');if(filt&&!p.startsWith(filt))continue;for(const x of r[k].res){if(x.k==='info')continue;const key=p+' | '+x.k+' | '+x.d.replace(/\s\d+\.\.\d+/,'');(g[key]=g[key]||new Set()).add(s)}
 r[k].errs.forEach(e=>{const key=p+' | ERR | '+e.slice(0,100);(g[key]=g[key]||new Set()).add(s)})}
Object.entries(g).sort().forEach(([k,v])=>console.log(k+'  ['+[...v].join(',')+']'));
