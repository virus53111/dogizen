/* Network-only service worker: never cache profiles, private messages, auth or media. */
const CACHE="mm-offline-v1";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/offline.html","/app-icon.svg"])).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("mm-offline-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.origin!==self.location.origin||e.request.mode!=="navigate"||!["/","/en/","/de/","/lv/","/lt/","/et/"].includes(u.pathname))return;
 e.respondWith(fetch(e.request).catch(()=>caches.match("/offline.html")));
});
