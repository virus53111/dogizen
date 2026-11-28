/* MurdiliMax — published, member-submitted profiles only. */
"use strict";
const GEOS = {
 LV:{name:"Латвия",en:"Latvia",cities:{"Рига":["Центр","Старый город","Пурвциемс","Иманта","Кенгарагс"],"Даугавпилс":["Центр","Новый Форштадт"],"Лиепая":["Центр","Кароста"],"Юрмала":["Майори","Дзинтари"],"Елгава":[],"Резекне":[],"Вентспилс":[],"Валмиера":[],"Огре":[],"Екабпилс":[],"Цесис":[],"Сигулда":[],"Саласпилс":[],"Тукумс":[],"Кулдига":[],"Бауска":[]}},
 EE:{name:"Эстония",en:"Estonia",cities:{"Таллин":["Кесклинн","Ласнамяэ","Мустамяэ"],"Тарту":["Центр"],"Нарва":["Центр"]}},
 LT:{name:"Литва",en:"Lithuania",cities:{"Вильнюс":["Сенаместис","Жирмунай"],"Каунас":["Центр"],"Клайпеда":["Центр"]}},
 DE:{name:"Германия",en:"Germany",cities:{"Берлин":["Митте","Кройцберг","Шарлоттенбург"],"Гамбург":["Альтона","Митте"],"Мюнхен":["Альтштадт"],"Франкфурт":["Инненштадт"],"Кёльн":["Центр"]}},
 NO:{name:"Норвегия",en:"Norway",cities:{"Осло":["Сентрум","Грюнерлёкка","Фрогнер"],"Берген":["Центр"],"Ставангер":["Центр"],"Тронхейм":["Центр"]}},
 SE:{name:"Швеция",en:"Sweden",cities:{"Стокгольм":["Сёдермальм","Норрмальм","Эстермальм"],"Гётеборг":["Центр"],"Мальмё":["Центр"]}},
 FI:{name:"Финляндия",en:"Finland",cities:{"Хельсинки":["Каллио","Камппи"],"Эспоо":["Тапиола"],"Тампере":["Центр"],"Турку":["Центр"]}},
 PL:{name:"Польша",en:"Poland",cities:{"Варшава":["Средместье","Мокотув"],"Краков":["Старый город"],"Гданьск":["Центр"],"Вроцлав":["Центр"]}},
 NL:{name:"Нидерланды",en:"Netherlands",cities:{"Амстердам":["Центр","Де Пейп"],"Роттердам":["Центр"],"Гаага":["Центр"]}},
 FR:{name:"Франция",en:"France",cities:{"Париж":["Маре","Монмартр"],"Лион":["Центр"],"Марсель":["Центр"],"Ницца":["Центр"]}},
 ES:{name:"Испания",en:"Spain",cities:{"Мадрид":["Сентро","Саламанка"],"Барселона":["Эшампле","Готический квартал"],"Валенсия":["Центр"],"Малага":["Центр"]}},
 IT:{name:"Италия",en:"Italy",cities:{"Рим":["Центро","Трастевере"],"Милан":["Брера"],"Флоренция":["Центр"],"Неаполь":["Центр"]}},
 AT:{name:"Австрия",en:"Austria",cities:{"Вена":["Иннере Штадт","Леопольдштадт"],"Зальцбург":["Центр"],"Грац":["Центр"]}},
 CZ:{name:"Чехия",en:"Czechia",cities:{"Прага":["Прага 1","Прага 2"],"Брно":["Центр"],"Острава":["Центр"]}},
 GB:{name:"Великобритания",en:"United Kingdom",cities:{"Лондон":["Сохо","Вестминстер"],"Манчестер":["Центр"],"Бирмингем":["Центр"]}},
 CH:{name:"Швейцария",en:"Switzerland",cities:{"Цюрих":["Альтштадт"],"Женева":["Центр"],"Базель":["Центр"]}},
 DK:{name:"Дания",en:"Denmark",cities:{"Копенгаген":["Индре Бю"],"Орхус":["Центр"],"Оденсе":["Центр"]}},
 BE:{name:"Бельгия",en:"Belgium",cities:{"Брюссель":["Центр"],"Антверпен":["Центр"],"Гент":["Центр"]}},
 PT:{name:"Португалия",en:"Portugal",cities:{"Лиссабон":["Байша"],"Порту":["Центр"],"Фару":["Центр"]}},
 IE:{name:"Ирландия",en:"Ireland",cities:{"Дублин":["Центр"],"Корк":["Центр"]}}
};
const COORDS={"Рига":[56.9496,24.1052],"Даугавпилс":[55.87,26.54],"Лиепая":[56.50,21.01],"Юрмала":[56.97,23.77],"Берлин":[52.52,13.405],"Гамбург":[53.55,10],"Осло":[59.9139,10.7522],"Берген":[60.3929,5.323],"Стокгольм":[59.3293,18.0686],"Хельсинки":[60.1699,24.9384],"Варшава":[52.2297,21.0122],"Амстердам":[52.3676,4.9041],"Париж":[48.8566,2.3522],"Мадрид":[40.4168,-3.7038],"Вена":[48.2082,16.3738],"Лондон":[51.5074,-.1278],"Прага":[50.0755,14.4378],"Вильнюс":[54.6872,25.2797],"Таллин":[59.437,24.7536],"Рим":[41.9028,12.4964],"Копенгаген":[55.6761,12.5683],"Брюссель":[50.8503,4.3517]};
const FLAGS={LV:"🇱🇻",EE:"🇪🇪",LT:"🇱🇹",DE:"🇩🇪",NO:"🇳🇴",SE:"🇸🇪",FI:"🇫🇮",PL:"🇵🇱",NL:"🇳🇱",FR:"🇫🇷",ES:"🇪🇸",IT:"🇮🇹",AT:"🇦🇹",CZ:"🇨🇿",GB:"🇬🇧",CH:"🇨🇭",DK:"🇩🇰",BE:"🇧🇪",PT:"🇵🇹",IE:"🇮🇪"};
// Profiles come exclusively from the approved-listings API.
const translations=window.MM_I18N.translations;
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={lang:document.documentElement.lang||"ru",country:"",city:"",district:"",category:"",q:"",mode:"grid",real:[],visible:[],map:null,markers:null,user:null};
const t=k=>(translations[state.lang]||translations.ru)[k]||translations.ru[k]||k;
const publicCities = new Map();
const radiusCities = new Set();
let countsReady = false;
const balticCityNames = {
 "Рига":"Rīga", "Даугавпилс":"Daugavpils", "Лиепая":"Liepāja", "Юрмала":"Jūrmala",
 "Елгава":"Jelgava", "Резекне":"Rēzekne", "Вентспилс":"Ventspils", "Валмиера":"Valmiera",
 "Огре":"Ogre", "Екабпилс":"Jēkabpils", "Цесис":"Cēsis", "Сигулда":"Sigulda",
 "Саласпилс":"Salaspils", "Тукумс":"Tukums", "Кулдига":"Kuldīga", "Бауска":"Bauska",
 "Таллин":"Tallinn", "Тарту":"Tartu", "Нарва":"Narva", "Вильнюс":"Vilnius",
 "Каунас":"Kaunas", "Клайпеда":"Klaipėda"
};

function countryLabel(code){
 if(!code)return "";
 if(!/^[A-Z]{2}$/.test(code))return code;
 return new Intl.DisplayNames([state.lang],{type:"region"}).of(code);
}
function cityLabel(city){
 const local=balticCityNames[city];
 return typeof local==="string" ? (state.lang==="ru"?city+" · "+local:local+" · "+city) : city;
}
function option(value,label){const el=document.createElement("option");el.value=value;el.textContent=label;return el}
function setOptions(el,data,selected){el.replaceChildren(...data.map(d=>option(d[0],d[1])));el.value=selected||""}
function countryCodes(){
 return [...new Set([...Object.keys(GEOS),...publicCities.keys()])].sort((a,b)=>countryLabel(a).localeCompare(countryLabel(b),state.lang));
}
function fillCountry(){
 const choices=countryCodes().map(c=>[c,(FLAGS[c]||"")+" "+countryLabel(c)]);
 setOptions($("#countryFilter"),[["",t("allCountries")],...choices],state.country);
 setOptions($("#postCountry"),choices,$("#postCountry").value||"LV");
 fillCities(false);
 fillCities(true);
}
function fillCities(forPost){
 const country=forPost?$("#postCountry").value:state.country;
 const el=forPost?$("#postCity"):$("#cityFilter");
 const selected=forPost?el.value:state.city;
 el.replaceChildren();
 if(!forPost)el.append(option("",t("allCities")));
 for(const code of country?[country]:countryCodes()){
  const cities=new Set([...Object.keys(GEOS[code]?.cities||{}),...(publicCities.get(code)?.keys()||[])]);
  const group=country?el:document.createElement("optgroup");
  if(!country){group.label=countryLabel(code);el.append(group)}
  const counts=publicCities.get(code);
  const ordered=[...cities].sort((a,b)=>{
   if(!forPost && countsReady){
    const activeFirst=Number(!!counts?.get(b))-Number(!!counts?.get(a));
    if(activeFirst)return activeFirst;
   }
   return cityLabel(a).localeCompare(cityLabel(b),state.lang);
  });
  for(const city of ordered){
   const count=publicCities.get(code)?.get(city)||0;
   const label=cityLabel(city);
   const item=option(city,!forPost && countsReady ? label+" ("+count+")" : label);
   item.dataset.country=code;
   group.append(item);
  }
 }
 if(selected && [...el.options].some(item=>item.value===selected))el.value=selected;
 else if(forPost)el.value=Object.keys(GEOS[country]?.cities||{})[0]||el.options[0]?.value||"";
 if(!forPost){state.city=el.value;syncRadius();fillDistricts()}
}
function syncRadius(){
 const select=$("#radiusFilter");
 const available=state.country==="LV" && radiusCities.has(state.city);
 select.parentElement.hidden=!available;
 select.disabled=!available;
 if(!available)select.value="";
 $("#districtFilter").disabled=!!select.value;
}
async function loadPublicCities(){
 try{
  const res=await fetch("/api/locations",{cache:"no-store"});
  if(!res.ok)return;
  for(const {country,city,local,count} of (await res.json()).locations){
   if(!publicCities.has(country))publicCities.set(country,new Map());
   publicCities.get(country).set(city,count);
   if(country==="LV" && local){balticCityNames[city]=local;radiusCities.add(city)}
  }
  countsReady=true;
  fillCountry();
 }catch{ /* The built-in city list remains available offline. */ }
}
function fillDistricts(){const districts=GEOS[state.country]?.cities[state.city];const list=Array.isArray(districts)?districts:[];const value=list.includes(state.district)?state.district:"";setOptions($("#districtFilter"),[["",t("allDistricts")],...list.map(x=>[x,x])],value);state.district=value}
function fillCategories(){setOptions($("#categoryFilter"),[["",t("all")],...(window.MM_CATEGORIES||[]).map(c=>[c.id,window.MM_categoryLabel(c.id,state.lang)])],state.category)}
function translate(){document.documentElement.lang=state.lang;$$("[data-t]").forEach(el=>el.textContent=t(el.dataset.t));$$("[data-t-html]").forEach(el=>el.innerHTML=t(el.dataset.tHtml));$$("[data-t-placeholder]").forEach(el=>el.placeholder=t(el.dataset.tPlaceholder));$$("[data-t-title]").forEach(el=>el.title=t(el.dataset.tTitle));fillCountry();fillCategories();$("#language").value=state.lang;updateLogin();render()}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3400)}
const favoriteIds = new Set();
let favoritesReady;
async function loadFavoriteIds() {
 const response = await fetch("/api/favorites", {cache:"no-store"});
 if (response.status === 401) return;
 if (!response.ok) throw new Error(t("error"));
 const {listings} = await response.json();
 favoriteIds.clear();
 for (const item of listings) favoriteIds.add(item.id);
 render();
}
function initializeFavorites() {
 if (!favoritesReady) favoritesReady = loadFavoriteIds().catch(error => {
   favoritesReady = null;
   throw error;
 });
 return favoritesReady;
}
async function toggleFav(id) {
 try {
   await initializeFavorites();
   const remove = favoriteIds.has(id);
   const response = await fetch("/api/favorites", {
     method:"POST", headers:{"Content-Type":"application/json"},
     body:JSON.stringify({listing_id:id, action:remove ? "remove" : "add"})
   });
   if (response.status === 401) {
     location.assign(loginPath({listing:id}));
     return;
   }
   if (!response.ok) throw new Error(t("error"));
   if (remove) favoriteIds.delete(id);
   else favoriteIds.add(id);
   render();
 } catch (error) { toast(error.message); }
}
function presenceLabel(seconds){
 const timestamp=Number(seconds);
 if(!Number.isFinite(timestamp)||timestamp<=0)return "";
 const elapsed=Math.max(0,Math.floor(Date.now()/1000-timestamp));
 const online=elapsed<300;
 const unit=elapsed<3600?"minute":elapsed<86400?"hour":"day";
 const divisor={minute:60,hour:3600,day:86400}[unit];
 const label=online?t("online"):t("lastSeen")+" "+new Intl.RelativeTimeFormat(state.lang,{numeric:"always"}).format(-Math.floor(elapsed/divisor),unit);
 return '<small class="member-presence'+(online?' is-online':'')+'">'+escapeHTML(label)+'</small>';
}
function newMemberLabel(item){
 return item.is_new_member===true?'<small class="member-presence">'+escapeHTML(t("newMemberBadge"))+'</small>':"";
}
function filterLocal(a){const q=state.q.toLowerCase();return (!state.country||a.country===state.country)&&(!state.city||a.city===state.city)&&(!state.district||a.district===state.district)&&(!state.category||a.category===state.category)&&(!q||(a.display_name+" "+a.description).toLowerCase().includes(q))}
let listingRequestSequence=0;
let pendingSearch;
let lastCatalogResponse;
async function loadListings(background=false){
 const requestId=++listingRequestSequence;
 pendingSearch?.abort();
 pendingSearch=new AbortController();
 state.loading=true;state.loadError="";
 if(background!==true){lastCatalogResponse=undefined;state.real=[];state.totalReal=0;render()}
 const query=new URLSearchParams();
 if(window.mmNearby){query.set("near_country",window.mmNearby.country);query.set("near_city",window.mmNearby.city);query.set("near_radius",String(window.mmNearby.radius));}
 if(state.country&&!window.mmNearby)query.set("country",state.country);
 if(state.city&&!window.mmNearby)query.set("city",state.city);
 if(!window.mmNearby&&state.city && $("#radiusFilter").value)query.set("radius",$("#radiusFilter").value);
 if(state.district&&!window.mmNearby)query.set("district",state.district);
 if(state.category)query.set("category",state.category);
 if(state.q)query.set("q",state.q);
 const extra=window.mmExtra||{};
 for(const k of ["min_age","max_age","sort","language","photo","interest","goal","commercial","featured","online","new_member","page"]){
  if(extra[k]!==undefined&&extra[k]!==""&&extra[k]!==null)query.set(k,String(extra[k]));
 }
 if(state.mode==="gallery")query.set("photo","1");
 let catalogChanged=true;
 try{
  const response=await fetch("/api/listings?"+query.toString(),{cache:"no-store",signal:pendingSearch.signal});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const body=await response.text();
  if(requestId!==listingRequestSequence)return;
  if(background===true && body===lastCatalogResponse){catalogChanged=false;return}
  const data=JSON.parse(body);
  lastCatalogResponse=body;
  state.real=(Array.isArray(data.listings)?data.listings:[]).map(x=>({...x,symbol:"✧",color1:"#c6bee7",color2:"#f4dce8"}));
  state.totalReal=Number(data.total)||0;
 }catch(err){
  if(requestId!==listingRequestSequence)return;
  if(background===true){catalogChanged=false;return}
  state.real=[];state.totalReal=0;state.loadError=t("error");
 }finally{
  if(requestId===listingRequestSequence){state.loading=false;if(catalogChanged)render();}
 }
}
function render(){const newSince=typeof myCity==="undefined"?Infinity:myCity.badgeDate();if(typeof myCity!=="undefined")myCity.update();const fav=favoriteIds;/* Profiles fetched from the database only; never fabricate members. */const real=state.real.filter(p=>(state.mode!=="gallery"||!!p.avatar_url));state.visible=real;$("#totalCount").textContent=state.visible.length;$("#resultsDetail").textContent=state.country?((FLAGS[state.country]||"")+" "+countryLabel(state.country)+(state.city?" · "+state.city:"")):t("allCountries");$("#catalogError").textContent=state.loadError||"";$("#catalogError").classList.toggle("hidden",!state.loadError);$("#cards").innerHTML=state.visible.map(p=>{const p1=escapeHTML(p.display_name),loc=escapeHTML(p.city)+(p.district?" · "+escapeHTML(p.district):"");const bg="linear-gradient(145deg,"+p.color1+","+p.color2+")";return '<article class="profile-card" data-id="'+escapeHTML(p.id)+'" tabindex="0" role="button" aria-label="'+p1+'"><div class="card-portrait" style="background:'+bg+'">'+(p.avatar_url?'<img loading="lazy" decoding="async" class="portrait-image" src="'+escapeHTML(p.avatar_url)+'" alt="'+p1+'"> ':'<div class="avatar-flower" aria-hidden="true">'+p.symbol+'</div>')+''+'<button type="button" class="favorite '+(fav.has(p.id)?"active":"")+'" data-fav="'+escapeHTML(p.id)+'" title="'+t("favorite")+'" aria-label="'+t("favorite")+'">'+(fav.has(p.id)?"♥":"♡")+'</button><div class="card-country">'+(FLAGS[p.country]||"🌍")+' '+escapeHTML(countryLabel(p.country))+'</div>'+(p.is_commercial?'<span class="card-commercial-tag">COM</span>':'')+'</div><div class="card-body">'+(Date.parse(p.created_at)>newSince?'<small class="my-city-new">'+myCity.badgeText()+'</small>':'')+'<div class="name-line"><h3>'+p1+', '+Number(p.age)+'</h3><span class="profile-decoration" aria-hidden="true">♡</span></div>'+presenceLabel(p.last_seen)+newMemberLabel(p)+'<div class="card-place">⌖ '+loc+'</div>'+(p.headline?'<div class="card-headline">'+escapeHTML(p.headline)+'</div>':'')+'<div class="card-desc">'+escapeHTML(p.description)+'</div><div class="card-bottom"><span class="type-pill">'+(window.MM_categoryLabel?window.MM_categoryLabel(p.category,state.lang):t(p.category))+'</span><span class="profile-more">'+t("view")+' →</span></div>'+(p.messaging_enabled===true?'<button type="button" class="btn btn-primary mm-card-message" data-message="'+escapeHTML(p.id)+'">✉ '+escapeHTML(window.MM_v4?window.MM_v4("write"):t("login"))+'</button>':'<small class="mm-card-unavailable">'+escapeHTML(window.mmMemberText?window.mmMemberText("unavailable"):"")+'</small>')+'</div></article>'}).join("");
$("#catalogLoading").classList.toggle("hidden",!state.loading);$("#cards").setAttribute("aria-busy",state.loading?"true":"false");$("#emptyState").classList.toggle("hidden",state.visible.length>0||!!state.loadError||!!state.loading);$("#cards").classList.toggle("hidden",state.mode==="map"||!state.visible.length);$("#mapPanel").classList.toggle("hidden",state.mode!=="map");$("#gridViewBtn").classList.toggle("current",state.mode==="grid");$("#mapViewBtn").classList.toggle("current",state.mode==="map");$("#mapCount").textContent=state.visible.length;if(state.mode==="map")drawMap();if(window.mmRenderExtras)window.mmRenderExtras();
}
function showProfile(id){if(window.mmOpenProfile&&window.mmOpenProfile(id))return;const p=state.visible.find(x=>x.id===id);if(!p)return;const e=$("#profileContent");e.innerHTML='<div class="profile-cover" style="background:linear-gradient(125deg,'+p.color1+','+p.color2+')">'+(p.avatar_url?'<img loading="lazy" decoding="async" class="portrait-image" src="'+escapeHTML(p.avatar_url)+'" alt="'+escapeHTML(p.display_name)+'">':p.symbol)+'</div><div class="eyebrow">'+(t(p.category))+'</div><h2>'+escapeHTML(p.display_name)+', '+Number(p.age)+'</h2><div class="profile-modal-geo">⌖ '+(FLAGS[p.country]||"")+' '+escapeHTML(countryLabel(p.country))+' · '+escapeHTML(p.city)+(p.district?' · '+escapeHTML(p.district):"")+'</div><p class="profile-modal-desc">'+escapeHTML(p.description)+'</p><p class="profile-modal-geo">🌐 '+escapeHTML(p.languages||"—")+'</p>'+'<div class="profile-actions"><button type="button" class="btn btn-outline" id="reportThis">'+t("report")+'</button></div>';$("#profileModal").showModal();$("#reportThis").addEventListener("click",()=>{$("#profileModal").close();$("#reportForm").elements.listing_id.value=p.id;$("#reportModal").showModal()})}
let mapLoader;
function loadMapLibrary(){
 if(!mapLoader){
  const css=document.createElement("link");
  css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.append(css);
  mapLoader=new Promise(resolve=>{
   const script=document.createElement("script");
   script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
   script.onload=()=>resolve(!!window.L);script.onerror=()=>resolve(false);document.head.append(script);
  });
 }
 return mapLoader;
}
async function drawMap(){
 if(!window.L && !await loadMapLibrary()){$("#mapCanvas").classList.add("hidden");$("#mapFallback").classList.remove("hidden");return;}
 if(state.mode!=="map")return;
 $("#mapCanvas").classList.remove("hidden");$("#mapFallback").classList.add("hidden");if(!state.map){state.map=L.map("mapCanvas",{scrollWheelZoom:false}).setView([53.5,16],4);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.map);state.markers=L.layerGroup().addTo(state.map)}state.markers.clearLayers();const bounds=[];state.visible.forEach((p,i)=>{const base=COORDS[p.city];if(!base)return;const lat=base[0]+((i%4)-1.5)*.007,lon=base[1]+((i%5)-2)*.009;const icon=L.divIcon({className:"",html:'<div class="mm-map-marker">✦</div>',iconSize:[28,28],iconAnchor:[14,14]});const marker=L.marker([lat,lon],{icon}).addTo(state.markers);marker.bindPopup('<strong>'+escapeHTML(p.display_name)+'</strong><br>'+escapeHTML(p.city)+'<br><small>'+((window.MM_categoryLabel?window.MM_categoryLabel(p.category,state.lang):t(p.category)))+'</small>');bounds.push([lat,lon])});setTimeout(()=>{state.map.invalidateSize();if(bounds.length)state.map.fitBounds(bounds,{padding:[35,35],maxZoom:12});else state.map.setView([53.5,16],4)},90)}
function applyFilter(){state.country=$("#countryFilter").value;state.city=$("#cityFilter").value;state.district=$("#districtFilter").value;state.category=$("#categoryFilter").value;state.q=$("#keyword").value.trim();if(window.mmExtra)window.mmExtra.page=1;loadListings();$("#catalog").scrollIntoView({behavior:"smooth",block:"start"})}
async function getSession(){try{if(window.MM_authReady)await window.MM_authReady;return(await fetch("/api/session",{cache:"no-store"}).then(r=>r.json()))?.user||null}catch{return null}}
function showOwnerLink(){const allowed=state.user?.ownerPanel===true;for(const id of ["ownerNavAdmin","ownerAdminLink","ownerCreateShortcut","ownerPostShortcut"]){const link=$("#"+id);if(link){link.classList.toggle("hidden",!allowed);link.hidden=!allowed}}}
let mmSessionTicket=0;
async function refreshOwnerSession(){const ticket=++mmSessionTicket;const user=await getSession();if(ticket!==mmSessionTicket)return state.user;state.user=user;updateLogin();showOwnerLink();return user}
window.addEventListener("mm:auth-session",()=>refreshOwnerSession());
window.addEventListener("pageshow",e=>{if(e.persisted)refreshOwnerSession()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshOwnerSession()});
function loginPath(params = {}) {
 const back = new URL(location.href);
 for (const [key,value] of Object.entries(params)) back.searchParams.set(key,value);
 return "/login?next=" + encodeURIComponent(back.pathname + back.search + back.hash);
}
function consumeReturnKey(key) {
 const url = new URL(location.href);
 url.searchParams.delete(key);
 history.replaceState(history.state, "", url);
}
function updatePublicationLabels(){
 const existing=state.user?.hasListing===true;
 const listingLabel=({
  ru:"Разместить объявление",en:"Post a listing",de:"Anzeige aufgeben",
  lv:"Ievietot sludinājumu",lt:"Paskelbti skelbimą",et:"Lisa kuulutus"
 })[state.lang];
 const action=existing?listingLabel:t("postProfile");
 $$("#emptyCreateProfile, #ctaPost [data-t], #dashboardPost").forEach(el=>{el.textContent=action});
 $("#postModal h2").textContent=existing?listingLabel:t("createTitle");
 $$("[data-publication-label]").forEach(el=>{el.textContent=existing?listingLabel:el.dataset.publicationLabel});
}
function updateLogin(){const btn=$("#loginBtn");if(state.user){btn.textContent=state.user.email?.split("@")[0]||t("myAds");btn.onclick=e=>{e.preventDefault();showMy()}}else{btn.textContent=t("accountEntry");btn.href=loginPath();btn.onclick=null}updatePublicationLabels()}
window.mmUpdatePublicationLabels=updatePublicationLabels;
async function openPost(){await refreshOwnerSession();if(!state.user){toast(t("loginRequired"));location.assign(loginPath({publish:"1"}));return}$("#postModal").showModal()}
async function showMy(){await refreshOwnerSession();if(!state.user){location.assign(loginPath({panel:"mine"}));return}if(!$("#myModal").open)$("#myModal").showModal();$("#myContent").textContent=t("loading");try{const r=await fetch("/api/mine");if(!r.ok)throw Error();const data=await r.json();$("#myContent").innerHTML=data.listings.length?'<div class="my-list">'+data.listings.map(x=>'<div class="my-item"><div><strong>'+escapeHTML(x.display_name)+'</strong><br><small>'+escapeHTML(x.city)+'</small></div><span class="status '+escapeHTML(x.status)+'">'+t(x.status)+'</span></div>').join("")+'</div>':'<p>'+t("noMy")+'</p>';if(window.mmEnhanceMine)window.mmEnhanceMine(data.listings);if(window.mmMountDashboard)window.mmMountDashboard(data.listings);
if(state.user.ownerPanel){
 const ar=await fetch("/api/legacy/claim");
 if(ar.ok){
  const legacy=await ar.json();
  const labels={
   ru:["Восстановить мою старую анкету","Подтвердить, что это ваша анкета?"],
   en:["Restore my previous profile","Confirm this is your profile?"],
   de:["Mein früheres Profil wiederherstellen","Ist das Ihr eigenes Profil?"],
   lv:["Atjaunot manu iepriekšējo profilu","Apstiprināt, ka šis ir jūsu profils?"]
  };
  const words=labels[state.lang]||labels.ru;
  for(const old of legacy.listings||[]){
   const btn=document.createElement("button");
   btn.type="button";btn.className="btn btn-outline";
   btn.textContent=words[0]+": "+old.display_name;
   btn.style.marginTop="13px";
   btn.onclick=async()=>{
    if(!confirm(words[1]))return;
    btn.disabled=true;
    try{
     const response=await fetch("/api/legacy/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:old.id})});
     const body=await response.json();if(!response.ok)throw Error(body.error||t("error"));
     await loadListings();await showMy();
    }catch(err){toast(err.message);btn.disabled=false}
   };
   $("#myContent").append(btn);
  }
 }
}}catch{$("#myContent").textContent=t("error")}}
function bind(){
 if(localStorage.getItem("mm-over18")==="yes")$("#ageGate").classList.add("dismissed");
 $("#enterAge").onclick=()=>{localStorage.setItem("mm-over18","yes");$("#ageGate").classList.add("dismissed")};
 $("#leaveAge").onclick=()=>location.href="https://www.google.com";
 $("#language").addEventListener("change",e=>{const dest=new URL(location.href);dest.pathname=e.target.value==="ru"?"/":"/"+e.target.value+"/";location.assign(dest)});
 $("#radiusFilter").onchange=()=>{window.mmClearNearby?.();state.district="";fillDistricts();syncRadius();if(window.mmExtra)window.mmExtra.page=1;loadListings()};
 $("#countryFilter").onchange=e=>{window.mmClearNearby?.();$("#radiusFilter").value="";state.country=e.target.value;state.city="";state.district="";if(window.mmExtra)window.mmExtra.page=1;fillCities(false);loadListings()};
 $("#cityFilter").onchange=e=>{window.mmClearNearby?.();$("#radiusFilter").value="";state.city=e.target.value;state.country=e.target.selectedOptions[0]?.dataset.country||state.country;$("#countryFilter").value=state.country;state.district="";if(window.mmExtra)window.mmExtra.page=1;fillCities(false);loadListings()};
 $("#districtFilter").onchange=e=>{window.mmClearNearby?.();state.district=e.target.value;if(window.mmExtra)window.mmExtra.page=1;loadListings()};
 $("#categoryFilter").onchange=e=>{state.category=e.target.value;if(window.mmExtra)window.mmExtra.page=1;loadListings()};
 $("#postCountry").onchange=()=>fillCities(true);
 /* Category chips use one delegated click handler in catalog-v2.js. */
 $("#searchBtn").onclick=applyFilter;$("#keyword").oninput=e=>{state.q=e.target.value.trim();if(window.mmExtra)window.mmExtra.page=1;clearTimeout(bind.timer);bind.timer=setTimeout(loadListings,300)};
 function switchView(mode) {
   const leavingGallery = state.mode === "gallery";
   state.mode = mode;
   if (leavingGallery) { window.mmExtra.page=1; loadListings(); }
   else render();
 }
 $("#gridViewBtn").onclick=()=>switchView("grid");$("#mapViewBtn").onclick=()=>switchView("map");
 $("#resetFilters").onclick=()=>{window.mmClearNearby?.();state.country="";state.city="";state.district="";state.category="";state.q="";state.mode="grid";window.resetAdvancedFilters();$("#keyword").value="";translate();loadListings()};
 $("#cards").onclick=e=>{const m=e.target.closest("[data-message]");if(m){e.stopPropagation();window.mmStartChat?.(m.dataset.message);return}const f=e.target.closest("[data-fav]");if(f){e.stopPropagation();toggleFav(f.dataset.fav);return}const c=e.target.closest("[data-id]");if(c)showProfile(c.dataset.id)};
 $("#cards").onkeydown=e=>{if(e.key==="Enter"&&e.target.classList.contains("profile-card"))showProfile(e.target.dataset.id)};
 ["postBtn","ctaPost","emptyCreateProfile"].forEach(x=>$("#"+x).onclick=openPost);$("#myAdsBtn").onclick=showMy;
 $$("[data-close]").forEach(el=>el.onclick=()=>el.closest("dialog").close());
 $$("dialog").forEach(el=>el.addEventListener("click",e=>{if(e.target===el)el.close()}));
 $("#postForm").onsubmit=async e=>{e.preventDefault();const form=e.target,btn=form.querySelector("[type=submit]");const files=[...(form.querySelector('input[name="photo"]')?.files||[])];const validTypes=["image/jpeg","image/png","image/webp"];const badFiles=files.length>6||files.some(f=>!validTypes.includes(f.type)||f.size===0||f.size>4*1024*1024);if(badFiles){$("#formMessage").textContent=({ru:"Можно загрузить до 6 фотографий JPG, PNG или WebP размером до 4 МБ каждая.",en:"Upload up to 6 JPG, PNG or WebP images, at most 4 MB each.",de:"Bis zu 6 Bilder (JPG, PNG oder WebP) mit höchstens 4 MB pro Bild.",lv:"Augšupielādējiet līdz 6 JPG, PNG vai WebP attēliem, katru līdz 4 MB.",lt:"Įkelkite iki 6 JPG, PNG arba WebP nuotraukų, kiekvieną iki 4 MB.",et:"Laadi üles kuni 6 JPG-, PNG- või WebP-fotot, igaüks kuni 4 MB."})[state.lang]||"Invalid photos";return}btn.disabled=true;$("#formMessage").textContent="";const data=new FormData(form);try{const r=await fetch("/api/create",{method:"POST",body:data});const j=await r.json();if(!r.ok)throw Error(j.code==="profile_policy"?t("profilePolicyError"):(j.error||t("error")));$("#postModal").close();form.reset();toast(j.published?t("submitPublished"):t("submitPending"));void refreshOwnerSession();loadListings()}catch(err){$("#formMessage").textContent=err.message}finally{btn.disabled=false}};
 $("#reportForm").onsubmit=async e=>{e.preventDefault();const form=e.target;const data=Object.fromEntries(new FormData(form).entries());try{const r=await fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok)throw Error();$("#reportModal").close();toast(t("reportSuccess"))}catch{toast(t("error"))}};
}
document.addEventListener("DOMContentLoaded",async()=>{bind();const hasSavedCity=typeof myCity!=="undefined" && myCity.init();
 const landing=new URLSearchParams(location.search), landingCountry=landing.get("country"), landingCity=landing.get("city");
 const explicitCity=!!landingCountry&&Object.hasOwn(GEOS,landingCountry)&&!!landingCity&&Object.hasOwn(GEOS[landingCountry].cities,landingCity);
 if(explicitCity){state.country=landingCountry;state.city=landingCity;state.district="";
  const goal=landing.get("goal");
  if(window.mmExtra){if(["friendship","dating","relationship","activities","open"].includes(goal))window.mmExtra.goal=goal;if(landing.get("commercial")==="0")window.mmExtra.commercial="0";}
 }
 translate();
 if(hasSavedCity&&!explicitCity)myCity.restore();
 else loadListings();
 loadPublicCities();
 function refreshActivity(){
  if(!document.hidden && !state.loading && !document.querySelector("dialog[open]") && !$("#cards").contains(document.activeElement))loadListings(true);
 }
 setInterval(refreshActivity,60000);
 document.addEventListener("visibilitychange",refreshActivity);
 await refreshOwnerSession();if(state.user?.visible&&!document.hidden)fetch("/api/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}).catch(()=>{});updateLogin();showOwnerLink();if (!state.user) return;
 const query = new URLSearchParams(location.search);
 if (query.get("publish")==="1") { consumeReturnKey("publish"); openPost(); }
 else if (query.get("panel")==="mine") { consumeReturnKey("panel"); showMy(); }
});
