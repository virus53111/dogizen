(()=>{
const words={"ru":["📍 Рядом со мной","Радиус","Выключить поиск рядом","Разрешите доступ к местоположению. GPS остаётся на устройстве; поиск приблизительный, от центра ближайшего города.","Местоположение недоступно. Выберите город вручную.","Приблизительно от центра","🔔 Включить push-уведомления","Выключить push-уведомления","Уведомления включены на этом устройстве","Разрешите уведомления в браузере. На iPhone добавьте сайт на экран Домой и откройте его оттуда.","Не удалось выполнить действие","Новое сообщение","Уведомления не содержат имя или текст сообщения."],"en":["📍 Near me","Radius","Turn off nearby search","Allow location access. GPS stays on your device; search is approximate from the nearest city centre.","Location unavailable. Select a city manually.","Approximate from centre","🔔 Enable push notifications","Disable push notifications","Notifications enabled on this device","Allow notifications in your browser. On iPhone add the site to your Home Screen and open it there.","Action failed","New message","Notifications contain no sender name or message text."],"de":["📍 In meiner Nähe","Radius","Umkreissuche ausschalten","Standort erlauben. GPS bleibt auf deinem Gerät; Suche ungefähr ab dem nächsten Stadtzentrum.","Standort nicht verfügbar. Stadt manuell wählen.","Ungefähr ab Zentrum","🔔 Push-Mitteilungen aktivieren","Push-Mitteilungen deaktivieren","Mitteilungen auf diesem Gerät aktiv","Mitteilungen im Browser erlauben. Auf dem iPhone die Website zum Home-Bildschirm hinzufügen und dort öffnen.","Aktion fehlgeschlagen","Neue Nachricht","Mitteilungen enthalten keinen Namen oder Nachrichtentext."],"lv":["📍 Manā tuvumā","Rādiuss","Izslēgt meklēšanu tuvumā","Atļauj atrašanās vietu. GPS paliek ierīcē; meklēšana ir aptuvena no tuvākās pilsētas centra.","Atrašanās vieta nav pieejama. Izvēlies pilsētu manuāli.","Aptuveni no centra","🔔 Ieslēgt push paziņojumus","Izslēgt push paziņojumus","Paziņojumi šajā ierīcē ieslēgti","Atļauj paziņojumus pārlūkā. iPhone pievieno vietni sākuma ekrānam un atver to tur.","Darbība neizdevās","Jauna ziņa","Paziņojumos nav vārda vai ziņas teksta."],"lt":["📍 Netoli manęs","Spindulys","Išjungti paiešką netoliese","Leiskite naudoti vietą. GPS lieka įrenginyje; paieška apytikslė nuo artimiausio miesto centro.","Vieta nepasiekiama. Pasirinkite miestą rankiniu būdu.","Apytiksliai nuo centro","🔔 Įjungti pranešimus","Išjungti pranešimus","Pranešimai šiame įrenginyje įjungti","Leiskite pranešimus naršyklėje. iPhone pridėkite svetainę prie pradžios ekrano ir atverkite ją ten.","Veiksmas nepavyko","Nauja žinutė","Pranešimuose nėra vardo ar žinutės teksto."],"et":["📍 Minu lähedal","Raadius","Lülita lähiotsing välja","Luba asukoht. GPS jääb seadmesse; otsing on ligikaudne lähima linnakeskuse järgi.","Asukoht pole saadaval. Vali linn käsitsi.","Ligikaudu keskusest","🔔 Luba tõuketeavitused","Keela tõuketeavitused","Teavitused selles seadmes lubatud","Luba teavitused brauseris. iPhone'is lisa sait avakuvale ja ava see sealt.","Toiming ebaõnnestus","Uus sõnum","Teavitustes pole saatja nime ega sõnumi teksti."]};
const W=i=>(words[document.documentElement.lang]||words.en)[i];
const el=(tag,txt)=>{const x=document.createElement(tag);if(txt)x.textContent=txt;return x};
const btn=(txt,fn)=>{const b=el('button',txt);b.type='button';b.className='btn btn-outline';b.onclick=fn;return b};
let status,nearButton,clearButton,generation=0;
window.mmClearNearby=()=>{generation++;window.mmNearby=null;if(status)status.textContent='';if(clearButton)clearButton.hidden=true;if(nearButton)nearButton.disabled=false};
document.addEventListener('DOMContentLoaded',()=>{
 const search=document.getElementById('searchBtn');if(!search)return;
 const box=el('div');box.className='mm-nearby-controls';
 const radius=el('select');radius.setAttribute('aria-label',W(1));for(const n of [25,50,100]){const o=el('option',n+' km');o.value=n;radius.append(o)}
 status=el('small');status.setAttribute('role','status');
 const update=()=>{if(window.mmExtra)window.mmExtra.page=1;loadListings()};
 nearButton=btn(W(0),async()=>{
  if(!navigator.geolocation){status.textContent=W(4);return}
  if(!confirm(W(3)))return;
  const ticket=++generation;nearButton.disabled=true;
  try{
   const {nearestCity}=await import('/nearby-cities.js');
   const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0}));
   if(ticket!==generation)return;
   const city=nearestCity(pos.coords.latitude,pos.coords.longitude);
   if(!city)throw Error();
   window.mmNearby={country:city[0],city:city[1],radius:Number(radius.value)};
   state.country=city[0];state.city=city[1];state.district='';fillCountry();
   status.textContent=W(5)+': '+city[2];clearButton.hidden=false;update();
  }catch{if(ticket===generation)status.textContent=W(4)}finally{if(ticket===generation)nearButton.disabled=false}
 });
 radius.onchange=()=>{if(window.mmNearby){window.mmNearby.radius=Number(radius.value);update()}};
 clearButton=btn(W(2),()=>{window.mmClearNearby();update()});clearButton.hidden=true;
 box.append(nearButton,radius,clearButton,status);const details=document.getElementById('advancedFilters');if(details)details.before(box);else search.after(box);
});
const call=async body=>{const r=await fetch('/api/push',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}:{cache:'no-store'});if(!r.ok)throw Error(W(10));return r.json()};
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
window.mmMountPush=async root=>{
 const box=el('section');box.className='mm-community';const hint=el('p',W(12)),note=el('p');note.setAttribute('role','status');
 let enabled=false,reg;
 const toggle=btn(W(6),async()=>{
  toggle.disabled=true;
  try{
   if(!('Notification' in window)||!('PushManager' in window)||!('serviceWorker' in navigator)){note.textContent=W(9);return}
   if(!enabled&&await Notification.requestPermission()!=='granted'){note.textContent=W(9);return}
   reg=reg||await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
   let sub=await reg.pushManager.getSubscription();
   if(enabled){if(sub){await call({action:'disable',endpoint:sub.endpoint});await sub.unsubscribe()}enabled=false;note.textContent=''}
   else{const key=await call();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(key.publicKey)});await call({action:'enable',subscription:sub.toJSON(),lang:document.documentElement.lang});enabled=true;note.textContent=W(8)}
  }catch{note.textContent=W(10)}finally{toggle.disabled=false;toggle.textContent=enabled?W(7):W(6)}
 });
 box.append(toggle,hint,note);root.prepend(box);toggle.disabled=true;
 try{if('serviceWorker' in navigator&&'PushManager' in window){reg=await navigator.serviceWorker.register('/sw.js');const s=await reg.pushManager.getSubscription();if(s){const d=await call({action:'status',endpoint:s.endpoint});enabled=d.enabled===true;if(enabled){toggle.textContent=W(7);note.textContent=W(8)}}}else note.textContent=W(9)}catch{}finally{toggle.disabled=false}
};
})();
