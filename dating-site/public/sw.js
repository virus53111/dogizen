/* Network-only service worker: never cache profiles, private messages, auth or media. */
const CACHE="mm-offline-v1";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/offline.html","/app-icon.svg"])).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("mm-offline-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.origin!==self.location.origin||e.request.mode!=="navigate"||!["/","/en/","/de/","/lv/","/lt/","/et/"].includes(u.pathname))return;
 e.respondWith(fetch(e.request).catch(()=>caches.match("/offline.html")));
});

const MM_PUSH_TEXT={"ru":"Новое сообщение","en":"New message","de":"Neue Nachricht","lv":"Jauna ziņa","lt":"Nauja žinutė","et":"Uus sõnum"};
self.addEventListener('push',event=>{let lang='en';try{const d=event.data?.json();if(Object.hasOwn(MM_PUSH_TEXT,d?.lang))lang=d.lang}catch{}
 event.waitUntil(self.registration.showNotification('MurdiliMax',{body:MM_PUSH_TEXT[lang],icon:'/app-icon-192.png',tag:'mm-new-message',renotify:false,data:{lang}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();const lang=event.notification.data?.lang;const target=new URL((Object.hasOwn(MM_PUSH_TEXT,lang)&&lang!=='ru'?'/'+lang+'/':'/')+'?panel=inbox',self.location.origin).href;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const c=clients.find(x=>new URL(x.url).origin===self.location.origin);if(c){await c.navigate(target);return c.focus()}return self.clients.openWindow(target)}));
});
