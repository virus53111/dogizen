/* Visual enhancements only. All actions delegate to the existing application. */
document.addEventListener("DOMContentLoaded",()=>{
 for(const button of document.querySelectorAll("[data-lux-create]")){
  button.addEventListener("click",()=>document.getElementById("postBtn")?.click());
 }
});

/* Shared navigation and public photo feed. Local preferences only, no tracking. */
(()=>{
 const labels={
 lt:{online:"Prisijungę",photos:"Naujos nuotraukos",light:"Šviesi tema",dark:"Tamsi tema",empty:"Naujų narių nuotraukų dar nėra.",error:"Nepavyko įkelti duomenų.",home:"Katalogas",age:"Man yra bent 18 metų",ageText:"Nuotraukų srautas skirtas tik suaugusiesiems.",leave:"Palikti svetainę"},
 et:{online:"Veebis",photos:"Uued fotod",light:"Hele teema",dark:"Tume teema",empty:"Uusi liikmete fotosid veel pole.",error:"Andmeid ei õnnestunud laadida.",home:"Kataloog",age:"Olen vähemalt 18-aastane",ageText:"Fotovoog on ainult täiskasvanutele.",leave:"Lahku veebisaidilt"},
 ru:{online:"Онлайн",photos:"Новые фото",light:"Светлая тема",dark:"Тёмная тема",empty:"Новых фотографий участников пока нет.",error:"Не удалось загрузить данные.",home:"Каталог",age:"Мне исполнилось 18 лет",ageText:"Лента доступна только совершеннолетним.",leave:"Покинуть сайт"},
 en:{online:"Online",photos:"Recent photos",light:"Light theme",dark:"Dark theme",empty:"No new member photos yet.",error:"Could not load data.",home:"Catalogue",age:"I am 18 or older",ageText:"The feed is for adults only.",leave:"Leave site"},
 de:{online:"Online",photos:"Neue Fotos",light:"Helles Design",dark:"Dunkles Design",empty:"Noch keine neuen Mitgliederfotos.",error:"Daten konnten nicht geladen werden.",home:"Katalog",age:"Ich bin mindestens 18 Jahre alt",ageText:"Die Fotoliste ist nur für Erwachsene.",leave:"Seite verlassen"},
 lv:{online:"Tiešsaistē",photos:"Jaunākie foto",light:"Gaišais motīvs",dark:"Tumšais motīvs",empty:"Pagaidām nav jaunu dalībnieku fotoattēlu.",error:"Neizdevās ielādēt datus.",home:"Katalogs",age:"Man ir vismaz 18 gadu",ageText:"Fotoattēlu sadaļa ir paredzēta tikai pieaugušajiem.",leave:"Pamest vietni"}
 };
 const isFeed=location.pathname==="/photos.html";
 const requested=isFeed?new URLSearchParams(location.search).get("lang"):document.documentElement.lang;
 const lang=Object.hasOwn(labels,requested)?requested:"ru";
 const l=labels[lang],home=lang==="ru"?"/":"/"+lang+"/";
 function read(k){try{return localStorage.getItem(k)}catch{return null}}
 function store(k,v){try{localStorage.setItem(k,v)}catch{}}
 let light=read("mm-theme")==="light";
 function applyTheme(){
  document.documentElement.dataset.mmTheme=light?"light":"dark";
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=light?"#fffaf7":"#100916";
  const b=document.getElementById("mmThemeToggle");if(b){b.textContent=light?"☾":"☀";b.title=light?l.dark:l.light;b.setAttribute("aria-label",b.title);b.setAttribute("aria-pressed",String(light))}
 }
 applyTheme();
 document.addEventListener("DOMContentLoaded",()=>{
  const nav=document.querySelector(".nav-actions");
  if(nav){
   const toolbar=document.createElement("div");toolbar.className="mm-catalog-tools";
   const online=document.createElement("span");online.className="mm-online";online.textContent=l.online+": —";
   const photoLink=document.createElement("a");photoLink.href="/photos.html?lang="+lang;photoLink.textContent=l.photos;
   const theme=document.createElement("button");theme.type="button";theme.id="mmThemeToggle";theme.className="mm-theme-toggle";
   theme.onclick=()=>{light=!light;store("mm-theme",light?"light":"dark");applyTheme()};
   toolbar.append(online,photoLink,theme);nav.append(toolbar);applyTheme();
   let pending=false;
   async function count(){
    if(pending||document.hidden)return;pending=true;
    try{
     const r=await fetch("/api/online-count",{cache:"no-store",...(typeof AbortSignal.timeout==="function"?{signal:AbortSignal.timeout(10000)}:{})});
     if(!r.ok)throw Error();const j=await r.json();
     if(!Number.isSafeInteger(j.online)||j.online<0)throw Error();
     online.textContent=l.online+": "+new Intl.NumberFormat(lang).format(j.online);
    }catch{online.textContent=l.online+": —"}finally{pending=false}
   }
   count();setInterval(count,60000);
   document.addEventListener("visibilitychange",()=>{if(!document.hidden)count()});
  }
  if(!isFeed)return;
  document.documentElement.lang=lang;document.title=l.photos+" · MurdiliMax";
  document.getElementById("mmFeedHeading").textContent=l.photos;
  const back=document.getElementById("mmFeedHome");back.href=home;back.textContent=l.home;
  const gate=document.getElementById("mmFeedGate"),content=document.getElementById("mmFeedContent"),grid=document.getElementById("mmFeedGrid"),status=document.getElementById("mmFeedStatus");
  async function load(){
   gate.hidden=true;content.hidden=false;
   try{
    const r=await fetch("/api/recent-photos",{cache:"no-store",...(typeof AbortSignal.timeout==="function"?{signal:AbortSignal.timeout(10000)}:{})});
    if(!r.ok)throw Error();const data=await r.json();
    if(!Array.isArray(data.photos))throw Error();
    let n=0;
    for(const p of data.photos){
     if(typeof p.photo_url!=="string"||!p.photo_url.startsWith("/media/")||!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(p.listing_id))continue;
     const a=document.createElement("a");a.className="profile-card mm-feed-card";a.href=home+"?listing="+encodeURIComponent(p.listing_id);
     const image=document.createElement("img");image.loading="lazy";image.decoding="async";image.src=p.photo_url;image.alt=String(p.display_name||"");
     const cap=document.createElement("span");cap.textContent=[p.display_name,p.city,p.country].filter(Boolean).join(" · ");
     const date=document.createElement("small"),d=new Date(p.created_at);if(!Number.isNaN(d.getTime()))date.textContent=new Intl.DateTimeFormat(lang,{dateStyle:"medium"}).format(d);
     a.append(image,cap,date);grid.append(a);n++;
    }
    status.textContent=n?"":l.empty;
   }catch{status.textContent=l.error}
  }
  if(read("mm-over18")==="yes"){load();return}
  gate.hidden=false;
  document.getElementById("mmFeedAgeText").textContent=l.ageText;
  const enter=document.getElementById("mmFeedEnter");enter.textContent=l.age;enter.onclick=()=>{store("mm-over18","yes");if(read("mm-over18")==="yes")load();else location.href=home};
  const leave=document.getElementById("mmFeedLeave");leave.textContent=l.leave;leave.href="https://www.google.com/";
 });
})();


/* Mobile shortcuts use the existing catalogue, favorites, chat and posting handlers. */
document.addEventListener("DOMContentLoaded",()=>{
 const catalog=document.getElementById("catalog"), categories=document.getElementById("categoryExplorer");
 if(!catalog||!categories||document.querySelector(".mm-mobile-dock"))return;
 const labels={
 ru:["Каталог","Избранное","Чат","Рубрики","Добавить","Навигация"],
 en:["Explore","Favorites","Chat","Categories","Add","Navigation"],
 de:["Katalog","Favoriten","Chat","Rubriken","Neu","Navigation"],
 lv:["Katalogs","Izlase","Čats","Sadaļas","Pievienot","Navigācija"],
 lt:["Katalogas","Mėgstami","Pokalbiai","Skiltys","Pridėti","Navigacija"],
 et:["Kataloog","Lemmikud","Vestlus","Rubriigid","Lisa","Navigeerimine"]
 };
 const language=document.documentElement.lang;
 const l=Object.hasOwn(labels,language)?labels[language]:labels.ru;
 const nav=document.createElement("nav");nav.className="mm-mobile-dock";nav.style.display="none";nav.setAttribute("aria-label",l[5]);
 const actions=[
  ["catalog","▦",()=>catalog.scrollIntoView({block:"start"})],
  ["favorites","♡",()=>document.getElementById("favoritesBtn")?.click()],
  ["chat","✉",()=>document.getElementById("inboxBtn")?.click()],
  ["categories","☷",()=>{if(categories.classList.contains("collapsed"))document.getElementById("toggleCategories")?.click();categories.scrollIntoView({block:"start"})}],
  ["post","＋",()=>document.getElementById("postBtn")?.click()]
 ];
 let unread;
 actions.forEach(([id,symbol,action],i)=>{
  const b=document.createElement("button");b.type="button";b.dataset.mmAction=id;
  const icon=document.createElement("span");icon.className="mm-dock-icon";icon.setAttribute("aria-hidden","true");icon.textContent=symbol;
  const label=document.createElement("span");label.textContent=l[i];b.append(icon,label);
  if(id==="chat"){unread=document.createElement("span");unread.className="mm-dock-unread";unread.hidden=true;b.append(unread)}
  b.addEventListener("click",action);nav.append(b);
 });
 document.body.append(nav);
 document.body.classList.add("mm-catalog-mobile");
 const ageGate=document.getElementById("ageGate");
 if(ageGate){
  const syncAge=()=>document.body.classList.toggle("mm-age-pending",!ageGate.classList.contains("dismissed"));
  syncAge();new MutationObserver(syncAge).observe(ageGate,{attributes:true,attributeFilter:["class"]});
 }
 const inbox=document.getElementById("inboxBtn");
 if(inbox&&unread){
  const sync=()=>{const badge=document.getElementById("inboxUnreadBadge");const value=badge?.textContent?.trim()||"";unread.hidden=!badge||badge.classList.contains("hidden")||badge.hidden||!value||value==="0";unread.textContent=unread.hidden?"":value};
  new MutationObserver(sync).observe(inbox,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class","hidden"]});sync();
 }
});
