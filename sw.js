// 版本號每次部署更新 → 舊快取自動清除、頁面自動刷新
const V='xy-fusion-v1.7.5-20261015c';
const ASSETS=['./','./index.html','./manifest.json?v=141','./icons/icon-192.png?v=141','./icons/icon-512.png?v=141','./icons/maskable-192.png?v=141','./icons/maskable-512.png?v=141','./icons/apple-touch-icon.png?v=141','./icons/favicon-64.png?v=141'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
// HTML：網路優先（拿到最新版並更新快取），離線時用快取；其他：快取優先
self.addEventListener('fetch',e=>{const r=e.request;const U=new URL(r.url);if(r.method!=='GET'||U.origin!==location.origin||U.pathname.includes('/api/')||U.pathname.endsWith('/ws')||U.pathname.endsWith('version.json'))return;
 if(r.mode==='navigate'||r.url.endsWith('.html')){e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put('./index.html',c));return res}).catch(()=>caches.match('./index.html')));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res})))});
