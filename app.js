(()=>{
"use strict";
const HOST="https://murdilimax.hatchable.site";
const ON_APP=location.hostname==="murdilimax.hatchable.site";
const API=ON_APP?"":HOST;
const M=window.MURDI_I18N||{},LANGS=["ru","lv","en"];
const urlLang=new URLSearchParams(location.search).get("lang");
let lang=LANGS.includes(urlLang)?urlLang:LANGS.includes(localStorage.getItem("murdilimax_language"))?localStorage.getItem("murdilimax_language"):"ru";
let backendReady=false,lastSearch=null,layout="list",listMap=null,listMarkers=null,postMap=null,postMarker=null,detailMap=null,toastTimer=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const t=k=>M[lang]?.[k]||M.ru?.[k]||k;
const catKeys={realty:"catRealty",cars:"catCars",electronics:"catElectronics",jobs:"catJobs",services:"catServices",home:"catHome",other:"catOther"};
const catIcons={realty:"⌂",cars:"🚙",electronics:"▣",jobs:"▤",services:"⚒",home:"◈",other:"✦"};
const dealKeys={sell:"sale",rent:"rent",buy:"buy",offer:"offer"};
const localeTag={ru:"ru-RU",lv:"lv-LV",en:"en-GB"};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function euro(n){const p=Number(n);return Number.isFinite(p)?new Intl.NumberFormat(localeTag[lang],{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(p):"—";}
function displayPrice(a){if(a.category==="jobs"&&Number(a.price)===0)return t("advSalaryUnknown");if(a.category==="services"&&Number(a.price)===0)return t("advNegotiable");return euro(a.price);}
function date(x){return new Date(x).toLocaleDateString(localeTag[lang],{day:"numeric",month:"short",year:"numeric"});}
function cat(k){return t(catKeys[k]||"catOther");}
function params(){return new URLSearchParams(location.search);}
function route(view,extra={}){const p=new URLSearchParams({view,lang});Object.entries(extra).forEach(([k,v])=>{if(v!==null&&v!==undefined)p.set(k,String(v));});return "/?"+p.toString();}
function appLink(view,extra){if(view==="mine")return HOST+"/account.html?lang="+lang;if(view==="admin")return HOST+"/admin.html";return (ON_APP?"":HOST)+route(view,extra);}
function go(view,extra={}){if(!ON_APP&&(view==="post"||view==="mine"||view==="admin")){location.href=appLink(view,extra);return;}history.pushState({}, "",route(view,extra));sync();}
function toast(text){const el=$("#toast");el.textContent=text;el.hidden=false;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},4700);}
async function fetchJSON(path,options={}){const resp=await fetch(API+path,options);let data;try{data=await resp.json();}catch{data={error:t("errorDesc")};}if(!resp.ok)throw Error(data.error||t("unknownError"));return data;}
function applyStatic(){
  document.documentElement.lang=lang;
  document.title="MURDILIMAX · "+t("navAll")+" · "+t("catRealty");
  $$("[data-i18n]").forEach(x=>x.textContent=t(x.dataset.i18n));
  $$("[data-i18n-html]").forEach(x=>x.innerHTML=t(x.dataset.i18nHtml));
  $$("[data-i18n-placeholder]").forEach(x=>x.placeholder=t(x.dataset.i18nPlaceholder));
  $$(".language").forEach(x=>{const active=x.dataset.lang===lang;x.classList.toggle("active",active);x.setAttribute("aria-pressed",String(active));});
  $("#nav-all").href=route("home");$("#nav-realty").href=route("home",{category:"realty"});$("#nav-mine").href=appLink("mine");
  $("#post-link").href=appLink("post");$$("[data-post-link]").forEach(a=>a.href=appLink("post"));
  $("#promo-realty").href=route("home",{category:"realty"});
  $("#footer-all").href=route("home");$("#footer-post").href=appLink("post");$("#footer-about").href=route("about");
  const routes={realty:{ru:"/ru/nedvizhimost/",lv:"/lv/nekustamais-ipasums/",en:"/en/real-estate/"},cars:{ru:"/ru/avtomobili/",lv:"/lv/auto/",en:"/en/cars/"},electronics:{ru:"/ru/elektronika/",lv:"/lv/elektronika/",en:"/en/electronics/"},jobs:{ru:"/ru/rabota/",lv:"/lv/darbs/",en:"/en/jobs/"},services:{ru:"/ru/uslugi/",lv:"/lv/pakalpojumi/",en:"/en/services/"},home:{ru:"/ru/dom-i-sad/",lv:"/lv/maja-un-darzs/",en:"/en/home-and-garden/"},other:{ru:"/ru/raznoe/",lv:"/lv/citi/",en:"/en/other/"}};
  $$("[data-seo-category]").forEach(a=>{const key=a.dataset.seoCategory;a.href=routes[key]?.[lang]||routes[key]?.ru;a.textContent=cat(key);});
  $("#sign-in").href=HOST+"/account.html?lang="+lang;$("#footer-admin").href=appLink("admin");
  $$(".cat").forEach(x=>x.classList.toggle("active",x.dataset.category===params().get("category")));
}
function setLanguage(next){if(!LANGS.includes(next)||next===lang)return;localStorage.setItem("murdilimax_language",next);const p=params();p.set("lang",next);location.search=p.toString();}
const districts=["Centrs","Purvciems","Imanta","Āgenskalns","Teika","Ziepniekkalns","Mežciems","Ķengarags","Zolitūde","Vecmīlgrāvis"];
const carMakes=["Volkswagen","BMW","Toyota","Volvo","Audi","Mercedes-Benz","Škoda","Honda","Ford","Nissan","Hyundai","Opel","Mazda","Kia"];
const professionOptions=[["driver","jobDriver"],["seller","jobSeller"],["cook","jobCook"],["cleaner","jobCleaner"],["builder","jobBuilder"],["administrator","jobAdministrator"],["programmer","jobProgrammer"],["electrician","jobElectrician"],["cashier","jobCashier"],["dispatcher","jobDispatcher"],["teacher","jobTeacher"],["nurse","jobNurse"]];
const conditions=[["new","condNew"],["used","condUsed"],["repair","condRepair"]];
const catalogSpecs={
 realty:[["district","advDistrict","select",districts.map(x=>[x,x])],["property_type","advType","select",[["apartment","placeApart"],["house","placeHouse"],["land","placeLand"],["commercial","placeCommercial"]]],["rooms","advRooms","number"],["area_min","advAreaMin","number"]],
 cars:[["make","advMake","select",carMakes.map(x=>[x,x])],["year_min","advYearMin","number"],["condition","advCondition","select",conditions]],
 jobs:[["profession","advProfession","select",professionOptions],["schedule","advSchedule","select",[["Darbadienas","shiftWeekdays"],["Maiņās","shiftShift"],["Pēc izvēles","shiftFlexible"]]]],
 electronics:[["subcategory","advSubcategory","select",[["phones","subPhones"],["computers","subComputers"],["appliances","subAppliances"]]],["condition","advCondition","select",conditions]],
 home:[["subcategory","advSubcategory","select",[["furniture","subFurniture"],["sofas","subSofas"],["tables","subTables"]]],["condition","advCondition","select",conditions]],
 services:[["service_type","advService","select",[["construction","serviceConstruction"],["other","serviceOther"]]]],
 other:[["condition","advCondition","select",conditions]]
};
const advancedKeys=[...new Set(Object.values(catalogSpecs).flat().map(x=>x[0]))];
function advancedFieldHTML(spec,value="",forPost=false){
 const [key,label,type,options]=spec;
 const name=forPost?"a_"+(key==="year_min"?"vehicle_year":key):key;
 const actualKey=forPost&&key==="year_min"?"vehicle_year":key;
 let field="";
 if(type==="select"){
  field='<select name="'+esc(name)+'" data-filter-key="'+esc(actualKey)+'"><option value="">'+esc(t("advAny"))+'</option>'+
   (options||[]).map(([v,lab])=>'<option value="'+esc(v)+'"'+(String(value)===String(v)?' selected':'')+'>'+esc(t(lab))+'</option>').join("")+'</select>';
 }else{
  const min=key==="year_min"?1950:0;
  field='<input type="number" name="'+esc(name)+'" data-filter-key="'+esc(actualKey)+'" min="'+min+'"'+(key==="year_min"?' max="2030"':"")+' value="'+esc(value||"")+'" placeholder="'+esc(t("advAny"))+'">';
 }
 return '<label class="advanced-field"><span>'+esc(t(label))+'</span>'+field+'</label>';
}
function renderAdvancedFilters(){
 const root=$("#advanced-filters");if(!root)return;
 const category=$("#filter-category").value,specs=catalogSpecs[category]||[];
 root.hidden=!specs.length;
 if(!specs.length){root.innerHTML="";return;}
 const p=params();
 root.innerHTML='<div class="advanced-heading"><strong>'+esc(t("advFilters"))+'</strong><button type="button" id="clear-advanced">'+esc(t("advClear"))+' ↺</button></div>'+
 '<div class="advanced-grid">'+specs.map(x=>advancedFieldHTML(x,p.get(x[0])||"")).join("")+'</div>';
 $("#clear-advanced").addEventListener("click",()=>{root.querySelectorAll("[data-filter-key]").forEach(x=>x.value="");});
}
function renderPostCategoryFields(){
 const form=$("#post-form");if(!form)return;
 const category=form.querySelector('[name="category"]').value;
 const specs=(catalogSpecs[category]||[]).filter(spec=>!["rooms","area_min"].includes(spec[0]));
 const target=$("#post-category-fields");if(target)target.innerHTML=specs.map(x=>advancedFieldHTML(x,"",true)).join("");
 const priceLabel=form.querySelector('[name="price"]')?.closest("label");
 if(priceLabel&&priceLabel.firstChild)priceLabel.firstChild.textContent=t(category==="jobs"?"postSalary":category==="services"?"postServicePrice":"postPrice");
 form.querySelectorAll("[data-property-field]").forEach(x=>x.hidden=category!=="realty");
}
function filterQuery(){
 const p=new URLSearchParams({lang,view:"home"});
 const q=$("#hero-q").value.trim(),cat=$("#filter-category").value,city=$("#filter-city").value.trim(),min=$("#filter-min").value,max=$("#filter-max").value,sort=$("#filter-sort").value;
 if(q)p.set("q",q);if(cat!=="all")p.set("category",cat);if(city)p.set("city",city);
 if(min!=="")p.set("min",min);if(max!=="")p.set("max",max);if(sort!=="new")p.set("sort",sort);
 $$("#advanced-filters [data-filter-key]").forEach(el=>{if(String(el.value).trim())p.set(el.dataset.filterKey,String(el.value).trim());});
 return p;
}
function readFilters(){
 const p=params(),map={q:"#hero-q",category:"#filter-category",city:"#filter-city",min:"#filter-min",max:"#filter-max",sort:"#filter-sort"};
 Object.entries(map).forEach(([key,sel])=>{const el=$(sel);if(el)el.value=p.get(key)||(key==="category"?"all":key==="sort"?"new":"");});
 $$(".cat").forEach(el=>el.classList.toggle("active",el.dataset.category===(p.get("category")||"")));
 const c=p.get("category");$("#results-title").textContent=catKeys[c]?cat(c):t("fresh");
 renderAdvancedFilters();
}
function loading(){return '<div class="loading"><span class="loading-spinner"></span>'+esc(t("loading"))+'</div>';}
function errorState(){return '<div class="fetch-error"><strong>'+esc(t("errorTitle"))+'</strong><p>'+esc(t("errorDesc"))+'</p><button type="button" data-retry>'+esc(t("retry"))+'</button></div>';}
function noResults(filtered){return '<div class="empty"><span class="empty-icon">✧</span><strong>'+esc(t(filtered?"emptyFiltered":"emptyTitle"))+'</strong><p>'+esc(t(filtered?"emptyFilteredDesc":"emptyDesc"))+'</p><a href="'+esc(appLink("post"))+'" data-post-link>'+esc(t("emptyAction"))+' ↗</a></div>';}
function listingCard(a){
 const photo=a.image_url?'<img loading="lazy" src="'+esc(a.image_url)+'" alt="'+esc(a.title)+'">':'<span class="no-photo-icon">'+(catIcons[a.category]||"✦")+'</span>';
 return '<article class="listing-card" tabindex="0" role="button" data-open-id="'+Number(a.id)+'" aria-label="'+esc(a.title)+'"><div class="listing-thumb '+(!a.image_url?"no-photo":"")+'">'+photo+'<em>'+esc(cat(a.category))+'</em></div><div class="listing-info"><div class="listing-price">'+esc(displayPrice(a))+'</div><h3>'+esc(a.title)+'</h3><div class="listing-meta"><span>⌖ '+esc(a.city)+'</span><span>'+esc(date(a.created_at))+'</span></div></div></article>';
}
function externalCard(a){
 const href=String(a.source_url||"");
 if(!/^https:\/\/(?:www\.)?(?:ss\.lv|ss\.com)\/msg\//.test(href))return "";
 const image=a.image_url?'<img loading="lazy" src="'+esc(a.image_url)+'" alt="" referrerpolicy="no-referrer">':'<span class="no-photo-icon">'+(catIcons[a.category]||"✦")+'</span>';
 const suffix=a.price_unit==="month"?t("externalMonth"):a.price_unit==="day"?t("externalDay"):"";
 const shownPrice=a.price_unit==="negotiable"?t(a.category==="jobs"?"advSalaryUnknown":"advNegotiable"):euro(a.price);
 const jobLabel=professionOptions.find(x=>x[0]===a.attributes?.profession);
 const info=a.attributes?.district||(jobLabel?t(jobLabel[1]):a.attributes?.make)||"";
 return '<article class="listing-card external-card"><a class="external-card-link" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(a.title)+' · SS.lv">'+
   '<div class="listing-thumb '+(!a.image_url?"no-photo":"")+'">'+image+'</div>'+
   '<div class="listing-info"><div class="listing-price">'+esc(shownPrice)+' <span class="external-unit">'+esc(suffix)+'</span></div>'+
   '<h3>'+esc(a.title)+'</h3><div class="listing-meta"><span>⌖ '+esc(a.city)+(info?' · '+esc(info):'')+'</span><span>'+esc(date(a.published_at))+'</span></div>'+
   '<div class="external-open"><span>'+esc(t("externalOpen"))+' · SS.lv</span><span>↗</span></div></div></a></article>';
}
async function loadListings(){
 const p=params(),query=new URLSearchParams();
 ["q","category","city","min","max","sort","page",...advancedKeys].forEach(k=>{if(p.get(k))query.set(k,p.get(k));});
 const signature=query.toString();
 if(signature===lastSearch)return;
 lastSearch=signature;
 $("#cards").innerHTML=loading();$("#pagination").innerHTML="";
 const [nativeCall,externalCall]=await Promise.allSettled([
   fetchJSON("/api/listings?"+signature),
   fetchJSON("/api/external?"+signature)
 ]);
 const nativeData=nativeCall.status==="fulfilled"?nativeCall.value:null;
 const externalData=externalCall.status==="fulfilled"?externalCall.value:null;
 backendReady=Boolean(nativeData||externalData);
 if(!backendReady){lastSearch=null;$("#cards").innerHTML=errorState();$("#view-counter").textContent="";return;}
 const nativeItems=nativeData?.items||[],externalItems=externalData?.items||[];
 const nativeCount=nativeData?.total||0,externalCount=externalData?.total||0;
 $("#view-counter").textContent=t("found")+": "+(nativeCount+externalCount);
 let html=nativeItems.map(listingCard).join("");
 if(externalItems.length){
  html+='<div class="source-intro"><div class="source-flag">'+esc(t("externalSection"))+' <span>SS.lv</span></div><h3>'+esc(t("externalTitle"))+'</h3><p>'+esc(t("externalDesc"))+'</p></div>';
  html+=externalItems.map(externalCard).join("");
 }
 if(!html){const filtered=[...query.keys()].some(k=>k!=="page");html=noResults(filtered);}
 $("#cards").innerHTML=html;
 const pageNum=Math.max(1,Number(p.get("page"))||1);
 const maxPages=Math.max(Math.ceil(nativeCount/24),Math.ceil(externalCount/24));
 let buttons="";
 if(maxPages>1){
  if(pageNum>1)buttons+='<button type="button" data-page="'+(pageNum-1)+'">← '+esc(t("back"))+'</button>';
  buttons+='<button disabled>'+esc(t("page"))+' '+pageNum+' '+esc(t("of"))+' '+maxPages+'</button>';
  if(pageNum<maxPages)buttons+='<button type="button" data-page="'+(pageNum+1)+'">'+esc(t("next"))+' →</button>';
 }
 $("#pagination").innerHTML=buttons;
}
function setLayout(which){
 layout=which;
 $$(".view-choice").forEach(b=>b.classList.toggle("active",b.dataset.layout===which));
 $("#cards").hidden=which==="map";$("#pagination").hidden=which==="map";$("#map-board").hidden=which!=="map";
 if(which==="map")loadMap();
}
function createTile(map){return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);}
function ensureListMap(){
 if(!window.L){$("#map-message").textContent=t("unknownError");return false;}
 if(!listMap){
  listMap=L.map("map-canvas",{scrollWheelZoom:false}).setView([56.9496,24.1052],7);
  createTile(listMap);listMarkers=L.layerGroup().addTo(listMap);
 }
 requestAnimationFrame(()=>listMap.invalidateSize());
 return true;
}
async function loadMap(){
 const label=$("#map-message");label.textContent=t("mapLoading");
 if(!ensureListMap())return;
 const p=params(),query=new URLSearchParams();
 ["q","category","city","min","max"].forEach(k=>{if(p.get(k))query.set(k,p.get(k));});
 try{
  const r=await fetchJSON("/api/map?"+query.toString());listMarkers.clearLayers();
  const bounds=[];
  for(const ad of r.items){
   const lat=Number(ad.latitude),lng=Number(ad.longitude);
   if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
   const marker=L.marker([lat,lng],{icon:L.divIcon({className:"map-price-marker",html:"<span>"+esc(euro(ad.price))+"</span>",iconSize:[90,32],iconAnchor:[45,16]})});
   marker.bindPopup('<div class="map-popup-title">'+esc(ad.title)+'</div><div>'+esc(ad.city)+'</div><div class="map-popup-price">'+esc(euro(ad.price))+'</div><button class="map-popup-link" data-open-id="'+Number(ad.id)+'" type="button">'+esc(t("mapViewAd"))+'</button>');
   listMarkers.addLayer(marker);bounds.push([lat,lng]);
  }
  if(bounds.length===1)listMap.setView(bounds[0],12);
  if(bounds.length>1)listMap.fitBounds(bounds,{padding:[30,30],maxZoom:12});
  label.textContent=bounds.length?"":t("mapNoPins");
 }catch(e){label.textContent=t("errorDesc");}
}
function cleanupModalMaps(){if(postMap){postMap.remove();postMap=null;postMarker=null;}if(detailMap){detailMap.remove();detailMap=null;}}
function showDrawer(html){cleanupModalMaps();$("#drawer-body").innerHTML=html;$("#drawer").hidden=false;document.body.style.overflow="hidden";$("#drawer-close").focus();}
function closeDrawer(){cleanupModalMaps();$("#drawer").hidden=true;document.body.style.overflow="";}
async function session(){
 if(!ON_APP){location.href=appLink(params().get("view")||"post");return null;}
 const a=window.hatchable&&window.hatchable.auth;if(!a){toast(t("postNoSite"));return null;}
 try{const sess=await a.getSession();if(sess?.user)return sess.user;}catch(e){}
 const to=route(params().get("view")||"post");location.href="/login?next="+encodeURIComponent(to)+"&lang="+lang;return null;
}
function selectOptions(items){return items.map(([value,key])=>'<option value="'+value+'">'+esc(t(key))+'</option>').join("");}
function formField(name,label,type="text",attrs=""){return '<label>'+esc(t(label))+'<input name="'+name+'" type="'+type+'" '+attrs+' required></label>';}
async function openPost(){
 const user=await session();if(!user)return;
 const html='<span class="kicker">'+esc(t("postKicker"))+'</span><h2>'+esc(t("postTitle"))+'</h2><p class="hint">'+esc(t("postDesc"))+'</p>'+
 '<form id="post-form" class="form-grid">'+
 '<label>'+esc(t("postCategory"))+'<select name="category">'+selectOptions(Object.entries(catKeys))+'</select></label>'+
 '<label>'+esc(t("postType"))+'<select name="deal_type">'+selectOptions([["sell","postSell"],["rent","postRent"],["buy","postBuy"],["offer","postOffer"]])+'</select></label>'+
 '<label class="full">'+esc(t("postName"))+'<input name="title" minlength="8" maxlength="110" required placeholder="'+esc(t("postNamePh"))+'"></label>'+
 '<label class="full">'+esc(t("postDescription"))+'<textarea name="description" required minlength="20" maxlength="4000" placeholder="'+esc(t("postDescriptionPh"))+'"></textarea></label>'+
 '<label>'+esc(t("postCity"))+'<input name="city" required maxlength="80" placeholder="'+esc(t("postCityPh"))+'"></label>'+
 formField("price","postPrice","number",'min="0" max="9999999999" step="1"')+
 '<label data-property-field>'+esc(t("postArea"))+'<input type="number" name="area" min="0" max="999999" step=".1"></label>'+
 '<label data-property-field>'+esc(t("postRooms"))+'<input type="number" name="rooms" min="0" max="100"></label>'+
 formField("contact_name","postContact","text",'maxlength="80"')+
 '<label>'+esc(t("postPhone"))+'<input name="contact_phone" type="tel" maxlength="35" placeholder="'+esc(t("postPhonePh"))+'"></label>'+
 '<div class="full category-form-fields" id="post-category-fields"></div>'+ '<label class="full">'+esc(t("postPhotos"))+'<input type="file" name="photos" id="photos" accept="image/jpeg,image/png,image/webp" multiple></label>'+
 '<p class="hint full" style="margin:-10px 0 1px">'+esc(t("postPhotoHint"))+'</p><div id="photo-preview" class="photo-preview full"></div>'+
 '<div class="full"><label>'+esc(t("postMapLabel"))+'</label><p class="hint">'+esc(t("postMapHint"))+'</p><div class="post-map-box"><div id="post-map"></div><div class="pin-footer"><span id="pin-status">'+esc(t("postPinNone"))+'</span><button type="button" id="pin-remove">'+esc(t("postPinRemove"))+'</button></div></div></div>'+
 '<p class="full privacy-note">'+esc(t("postPrivacy"))+'</p>'+
 '<button type="submit" class="primary-action full" id="post-submit">'+esc(t("postSubmit"))+' →</button><div id="post-msg" role="status" class="full"></div></form>';
 showDrawer(html);
 $("#post-form").querySelector("[name=category]").addEventListener("change",renderPostCategoryFields);
 renderPostCategoryFields();
 let previews=[];
 $("#photos").addEventListener("change",e=>{
  previews.forEach(x=>URL.revokeObjectURL(x));previews=[];
  let files=[...e.target.files];if(files.length>6){toast(t("postFileError"));e.target.value="";return;}
  const wrap=$("#photo-preview");wrap.replaceChildren();
  files.forEach(f=>{if(f.type.startsWith("image/")){const u=URL.createObjectURL(f);previews.push(u);const img=document.createElement("img");img.src=u;img.alt=f.name;wrap.appendChild(img);}});
 });
 if(window.L){
  requestAnimationFrame(()=>{
   if(!$("#post-map"))return;
   postMap=L.map("post-map",{scrollWheelZoom:false}).setView([56.9496,24.1052],7);createTile(postMap);
   postMap.on("click",e=>{if(postMarker)postMarker.setLatLng(e.latlng);else{postMarker=L.marker(e.latlng,{draggable:true}).addTo(postMap);postMarker.on("dragend",()=>{$("#pin-status").textContent=t("postPinSelected");});}$("#pin-status").textContent=t("postPinSelected");});
   postMap.invalidateSize();
  });
 }
 $("#pin-remove").addEventListener("click",()=>{if(postMap&&postMarker){postMap.removeLayer(postMarker);postMarker=null;}$("#pin-status").textContent=t("postPinNone");});
 $("#post-form").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.target,fd=new FormData(f),btn=$("#post-submit"),status=$("#post-msg");
  const images=[...($("#photos").files||[])];
  if(images.length>6||images.some(x=>x.size>4*1024*1024||!["image/jpeg","image/png","image/webp"].includes(x.type))){status.innerHTML='<div class="notice error">'+esc(t("postFileError"))+'</div>';return;}
  btn.disabled=true;btn.textContent=t("postSending");status.innerHTML="";
  try{
   const keys=[];
   for(let i=0;i<images.length;i++){
     btn.textContent=t("postUpload")+" "+(i+1)+"/"+images.length+"…";
     const form=new FormData();form.append("file",images[i]);
     const result=await fetchJSON("/api/upload",{method:"POST",body:form});keys.push(result.key);
   }
   const body={};
   ["title","description","category","deal_type","city","price","area","rooms","contact_name","contact_phone"].forEach(k=>body[k]=fd.get(k)||"");
   body.attributes={};for(const [k,v] of fd.entries()){if(k.startsWith("a_")&&String(v).trim())body.attributes[k.slice(2)]=String(v).trim();}
   body.images=keys;
   if(postMarker){const p=postMarker.getLatLng();body.latitude=p.lat;body.longitude=p.lng;}else{body.latitude=null;body.longitude=null;}
   const result=await fetchJSON("/api/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   status.innerHTML='<div class="notice">✓ '+esc(t("postSuccess"))+'<p><a class="modal-link" href="'+esc(appLink("mine"))+'">'+esc(t("postMine"))+' →</a></p></div>';
   f.reset();$("#photo-preview").innerHTML="";previews.forEach(x=>URL.revokeObjectURL(x));previews=[];
   if(postMarker){postMap.removeLayer(postMarker);postMarker=null;}$("#pin-status").textContent=t("postPinNone");
  }catch(err){status.innerHTML='<div class="notice error">'+esc(err.message||t("unknownError"))+'</div>';}
  finally{btn.disabled=false;btn.textContent=t("postSubmit")+" →";}
 });
}
async function openMine(){
 const u=await session();if(!u)return;
 showDrawer('<span class="kicker">'+esc(t("myKicker"))+'</span><h2>'+esc(t("myTitle"))+'</h2><div id="my-list" class="loading-placeholder">'+esc(t("loading"))+'</div>');
 try{
  const r=await fetchJSON("/api/mine");
  $("#my-list").innerHTML=r.items.length?r.items.map(a=>'<article class="mine-item"><h4>'+esc(a.title)+'</h4><p>'+esc(a.city)+' · '+esc(displayPrice(a))+'</p><span class="item-status '+esc(a.status)+'">'+esc(t("status"+a.status[0].toUpperCase()+a.status.slice(1)))+'</span><button type="button" class="remove-own" data-delete="'+Number(a.id)+'">'+esc(t("delete"))+'</button></article>').join(""):'<div class="notice">'+esc(t("myEmpty"))+'</div>';
 }catch(err){$("#my-list").innerHTML='<div class="notice error">'+esc(err.message)+'</div>';}
 $("#my-list").addEventListener("click",async e=>{
   const b=e.target.closest("button[data-delete]");if(!b)return;
   if(!confirm(t("deleteConfirm")))return;
   b.disabled=true;
   try{await fetchJSON("/api/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Number(b.dataset.delete)})});toast(t("deleteSuccess"));b.closest(".mine-item").remove();}
   catch(err){toast(err.message||t("unknownError"));b.disabled=false;}
 });
}
async function openDetails(id){
 if(!Number.isSafeInteger(Number(id))||Number(id)<1)return;
 showDrawer('<span class="kicker">'+esc(t("detailKicker"))+'</span><div id="detail" class="loading-placeholder">'+esc(t("loading"))+'</div>');
 try{
  const r=await fetchJSON("/api/listing/"+Number(id));const a=r.item;
  const pictures=a.images?.length?'<div class="detail-photos">'+a.images.map((src,i)=>'<img src="'+esc(src)+'" alt="'+esc(a.title)+' '+(i+1)+'" loading="lazy">').join("")+'</div>':'';
  const phone=a.contact_phone?'<a href="tel:'+esc(String(a.contact_phone).replace(/[^0-9+]/g,""))+'">☎ '+esc(a.contact_phone)+'</a>':'<p>'+esc(t("detailPhoneHidden"))+'</p>';
  const hasCoords=Number.isFinite(Number(a.latitude))&&Number.isFinite(Number(a.longitude))&&a.latitude!=null&&a.longitude!=null;
  const specs=[a.city,cat(a.category),t(dealKeys[a.deal_type]||"sale")];if(a.area)specs.push(a.area+" m²");if(a.rooms)specs.push(t("rooms")+": "+a.rooms);
  $("#detail").innerHTML=pictures+'<h2>'+esc(a.title)+'</h2><div class="detail-price">'+esc(displayPrice(a))+'</div><div class="detail-specs">'+specs.map(s=>'<span>'+esc(s)+'</span>').join("")+'</div><p class="detail-desc">'+esc(a.description)+'</p>'+
  (hasCoords?'<h3>'+esc(t("detailLocation"))+'</h3><div class="detail-map" id="detail-map"></div>':'')+
  '<section class="detail-contact"><h3>'+esc(t("detailContact"))+'</h3><p>'+esc(a.contact_name)+'</p>'+phone+'</section><p class="drawer-subtle">'+esc(t("detailSafety"))+'</p><p class="drawer-subtle">'+esc(t("adDate"))+': '+esc(date(a.created_at))+'</p>';
  if(hasCoords&&window.L){
   requestAnimationFrame(()=>{
    if(!$("#detail-map"))return;
    detailMap=L.map("detail-map",{scrollWheelZoom:false}).setView([Number(a.latitude),Number(a.longitude)],13);createTile(detailMap);L.marker([Number(a.latitude),Number(a.longitude)]).addTo(detailMap);detailMap.invalidateSize();
   });
  }
 }catch(e){$("#detail").innerHTML='<div class="notice error">'+esc(t("detailNotFound"))+'</div>';}
}
async function openAdmin(){
 if(!ON_APP){if(!backendReady){toast(t("postNoSite"));return;}location.href=appLink("admin");return;}
 showDrawer('<span class="kicker">'+esc(t("adminKicker"))+'</span><h2>'+esc(t("adminTitle"))+'</h2><p class="hint">'+esc(t("adminOnly"))+'</p><div id="admin-queue" class="loading-placeholder">'+esc(t("loading"))+'</div>');
 async function refresh(){
  try{
   const r=await fetchJSON("/api/admin");
   $("#admin-queue").innerHTML=r.items.length?r.items.map(a=>'<article class="admin-item"><h4>'+esc(a.title)+'</h4><p>'+esc(a.description)+'</p><p>'+esc(a.city)+' · '+esc(displayPrice(a))+' · '+esc(a.contact_name)+'</p>'+(a.image_url?'<img style="max-height:160px;border-radius:8px" src="'+esc(a.image_url)+'" alt="">':'')+'<div class="admin-actions"><button type="button" data-review="'+Number(a.id)+'" data-status="approved">'+esc(t("approve"))+'</button><button type="button" class="reject" data-review="'+Number(a.id)+'" data-status="rejected">'+esc(t("reject"))+'</button></div></article>').join(""):'<div class="notice">'+esc(t("adminEmpty"))+'</div>';
  }catch(e){$("#admin-queue").innerHTML='<div class="notice error">'+esc(t("adminOnly"))+'</div>';}
 }
 await refresh();
 $("#admin-remove-action").addEventListener("click",async()=>{
  const id=Number($("#admin-delete-id").value);if(!Number.isSafeInteger(id)||id<1)return;
  if(!confirm(t("deleteConfirm")))return;
  try{await fetchJSON("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:"removed"})});toast(t("deleteSuccess"));$("#admin-delete-id").value="";await refresh();}catch(e){toast(e.message||t("unknownError"));}
 });
 $("#admin-queue").addEventListener("click",async e=>{
  const b=e.target.closest("button[data-review]");if(!b)return;b.disabled=true;
  try{await fetchJSON("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Number(b.dataset.review),status:b.dataset.status})});await refresh();}
  catch(err){toast(err.message);b.disabled=false;}
 });
}
function openAbout(){showDrawer('<span class="kicker">MURDILIMAX</span><h2>'+esc(t("aboutTitle"))+'</h2><p class="detail-desc">'+esc(t("aboutText"))+'</p><div class="notice">'+esc(t("aboutNote"))+'</div>');}
function sync(){
 readFilters();
 const p=params(),view=p.get("view")||"home";
 if(view==="home"){closeDrawer();loadListings();if(layout==="map")loadMap();return;}
 if(view==="post")return openPost();
 if(view==="mine")return openMine();
 if(view==="admin")return openAdmin();
 if(view==="about"){openAbout();return;}
 if(view==="ad")return openDetails(p.get("id"));
 closeDrawer();loadListings();
}
function navigateCurrent(p){history.pushState({}, "", "/?"+p.toString());lastSearch=null;sync();}
function init(){
 applyStatic();
 $$(".language").forEach(b=>b.addEventListener("click",()=>setLanguage(b.dataset.lang)));
 $("#hero-search").addEventListener("submit",e=>{e.preventDefault();navigateCurrent(filterQuery());$("#listings").scrollIntoView({behavior:"smooth"});});
 $("#filter-category").addEventListener("change",renderAdvancedFilters);
 $("#apply-filters").addEventListener("click",()=>{navigateCurrent(filterQuery());$("#listings").scrollIntoView({behavior:"smooth"});});
 $$(".cat").forEach(b=>b.addEventListener("click",()=>{const p=filterQuery();p.set("category",b.dataset.category);advancedKeys.forEach(k=>p.delete(k));navigateCurrent(p);$("#listings").scrollIntoView({behavior:"smooth"});}));
 $$(".view-choice").forEach(b=>b.addEventListener("click",()=>setLayout(b.dataset.layout)));
 $("#cards").addEventListener("click",e=>{const b=e.target.closest("[data-open-id]");if(b)go("ad",{id:Number(b.dataset.openId)});const retry=e.target.closest("[data-retry]");if(retry){lastSearch=null;loadListings();}});
 $("#cards").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const b=e.target.closest("[data-open-id]");if(b){e.preventDefault();go("ad",{id:Number(b.dataset.openId)});}}});
 $("#pagination").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b)return;const p=filterQuery();p.set("page",b.dataset.page);navigateCurrent(p);$("#listings").scrollIntoView({behavior:"smooth"});});
 $("#map-board").addEventListener("click",e=>{const b=e.target.closest("[data-open-id]");if(b)go("ad",{id:Number(b.dataset.openId)});});
 $("#drawer-close").addEventListener("click",()=>go("home"));$("#drawer").addEventListener("click",e=>{if(e.target.hasAttribute("data-close"))go("home");});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#drawer").hidden)go("home");});
 // Account navigation is always available, independent of listing API load.
 window.addEventListener("popstate",()=>{lastSearch=null;sync();});
 if(ON_APP&&window.hatchable?.auth)window.hatchable.auth.getSession().then(s=>{if(s?.user)$("#sign-in").textContent=t("navAccount");}).catch(()=>{});
 sync();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();