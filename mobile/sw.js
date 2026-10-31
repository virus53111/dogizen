/* Offline access only to the mobile companion app shell. */
const CACHE='murdilimax-mobile-v1';
const SHELL=['/mobile/','/mobile/mobile.css?v=1','/mobile/mobile.js?v=1','/mobile/manifest.webmanifest','/mobile/icon-192.png','/mobile/icon-512.png','/assets/murdilimax-icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'&&new URL(req.url).pathname==='/mobile/'){
  e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/mobile/',copy))}return r}).catch(()=>caches.match('/mobile/')));return;
 }
 if(new URL(req.url).pathname.startsWith('/mobile/')||new URL(req.url).pathname==='/assets/murdilimax-icon.svg')
  e.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});