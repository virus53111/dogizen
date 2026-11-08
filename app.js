(()=>{
"use strict";
const HOST="https://murdilimax.hatchable.site";
const ON_APP=/\.hatchable\.site$/.test(location.hostname);
const API=ON_APP?"":HOST;
const $=s=>document.querySelector(s);
const cats={realty:"Недвижимость",cars:"Автомобили",electronics:"Электроника",jobs:"Работа",services:"Услуги",home:"Дом и сад",other:"Разное"};
const icons={realty:"⌂",cars:"🚗",electronics:"▣",jobs:"▤",services:"⚒",home:"◈",other:"✦"};
const deals={sell:"Продажа",rent:"Аренда",buy:"Куплю",offer:"Предложение"};
let currentPage=1,lastSearch="";
function escapeText(t){return String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function euro(p){let n=Number(p);return Number.isFinite(n)?new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(n)+" €":"Цена по запросу";}
function stamp(x){try{return new Date(x).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"});}catch{return "";}}
function toast(s){const t=$("#toast");t.textContent=s;t.hidden=false;setTimeout(()=>t.hidden=true,4200);}
function fail(text){return '<div class="fetch-error"><strong>Не удалось загрузить данные</strong><p>'+escapeText(text)+'</p><button id="retry" type="button">Повторить</button></div>';}
function qs(){return new URLSearchParams(location.search);}
function appLink(view){return (ON_APP?"":HOST)+"/?view="+encodeURIComponent(view);}
async function fetchJSON(path,opts={}){const r=await fetch(API+path,opts);let v;try{v=await r.json();}catch{v={error:"Сервер временно недоступен."};}if(!r.ok)throw Error(v.error||"Ошибка запроса ("+r.status+")");return v;}
function setUrl(next){history.pushState({}, "",location.pathname+"?"+next);syncFromUrl();}
function grabFilters(){
 const p=new URLSearchParams();p.set("view","home");
 const q=$("#hero-q").value.trim();if(q)p.set("q",q);
 const cat=$("#filter-category").value;if(cat!=="all")p.set("category",cat);
 const city=$("#filter-city").value.trim();if(city)p.set("city",city);
 const min=$("#filter-min").value;if(min)p.set("min",min);
 const max=$("#filter-max").value;if(max)p.set("max",max);
 const sort=$("#filter-sort").value;if(sort!=="new")p.set("sort",sort);
 return p;
}
function displayFilters(){
 const p=qs();const val=(id,name,def="")=>{if($(id))$(id).value=p.get(name)||def;};
 val("#hero-q","q");val("#filter-category","category","all");
 val("#filter-city","city");val("#filter-min","min");val("#filter-max","max");val("#filter-sort","sort","new");
 document.querySelectorAll(".category-card").forEach(b=>b.classList.toggle("active",b.dataset.category===(p.get("category")||"")));
 const cat=p.get("category");$("#results-title").textContent=cat&&cats[cat]?cats[cat]:"Свежие объявления";
}
function card(ad){
 const category=cats[ad.category]||"Объявление";
 const photo=ad.image_url?'<img src="'+escapeText(ad.image_url)+'" alt="" loading="lazy">':'<span>'+icons[ad.category]+'</span>';
 return '<article class="listing-card" tabindex="0" role="button" data-open-id="'+Number(ad.id)+'" aria-label="Открыть объявление: '+escapeText(ad.title)+'"><div class="thumb '+(!ad.image_url?"no-photo":"")+'">'+photo+'<em>'+category+'</em></div><div class="details"><div class="price">'+euro(ad.price)+'</div><h3>'+escapeText(ad.title)+'</h3><div class="meta"><span>⌖ '+escapeText(ad.city)+'</span><span>'+escapeText(stamp(ad.created_at))+'</span></div></div></article>';
}
async function loadListings(){
 const p=qs();const query=new URLSearchParams();
 for(const key of ["q","category","city","min","max","sort","page"])if(p.has(key))query.set(key,p.get(key));
 const qStr=query.toString();if(lastSearch===qStr)return;lastSearch=qStr;
 $("#cards").innerHTML='<div class="loading"><div class="loading-dot"></div><p>Загружаем объявления…</p></div>';$("#pagination").innerHTML="";
 try{
  const data=await fetchJSON("/api/listings?"+query);
  $("#view-counter").textContent=data.total+" объявлений";
  if(!data.items.length){
   const custom=[...query.keys()].some(k=>!["page"].includes(k));
   $("#cards").innerHTML='<div class="empty"><span>⌂</span><strong>'+(custom?"По этому запросу объявлений пока нет":"Здесь пока нет объявлений")+'</strong><p>'+(custom?"Попробуйте изменить условия поиска.":"Станьте первым, кто разместит объявление на MURDILIMAX.")+'</p><a href="'+appLink("post")+'">Подать объявление ↗</a></div>';
  }else $("#cards").innerHTML=data.items.map(card).join("");
  let page=data.page, maxPage=Math.ceil(data.total/24);
  if(maxPage>1){let html="";if(page>1)html+='<button data-page="'+(page-1)+'">← Назад</button>';html+='<button disabled>Страница '+page+' из '+maxPage+'</button>';if(page<maxPage)html+='<button data-page="'+(page+1)+'">Далее →</button>';$("#pagination").innerHTML=html;}
 }catch(e){lastSearch="";$("#cards").innerHTML=fail(e.message);$("#view-counter").textContent="";}
}
function showDrawer(html){
 $("#drawer-body").innerHTML=html;$("#drawer").hidden=false;document.body.style.overflow="hidden";$("#drawer-close").focus();
}
function closeDrawer(){ $("#drawer").hidden=true;document.body.style.overflow="";}
async function requireSession(){
 if(!ON_APP){location.href=appLink(qs().get("view")||"post");return false;}
 const auth=window.hatchable&&window.hatchable.auth;
 if(!auth){toast("Авторизация пока недоступна.");return false;}
 try{let session=await auth.getSession();if(session?.user)return session.user;}
 catch(e){console.error("session failed",e);}
 location.href="/login?next="+encodeURIComponent(location.pathname+location.search);
 return false;
}
function field(name,label,type="text",attrs=""){
 return '<label>'+label+'<input name="'+name+'" type="'+type+'" '+attrs+' required></label>';
}
async function openPost(){
 if(!(await requireSession()))return;
 showDrawer('<span class="section-kicker">НОВОЕ ОБЪЯВЛЕНИЕ</span><h2>Расскажите о своём предложении</h2><p class="hint">Публикация бесплатная. Все объявления проходят модерацию перед появлением на сайте.</p><form id="post-form" class="form-grid">'+
 '<label>Категория<select name="category" required><option value="realty">Недвижимость</option><option value="cars">Автомобили</option><option value="electronics">Электроника</option><option value="jobs">Работа</option><option value="services">Услуги</option><option value="home">Дом и сад</option><option value="other">Разное</option></select></label>'+
 '<label>Тип объявления<select name="deal_type"><option value="sell">Продам</option><option value="rent">Сдам в аренду</option><option value="buy">Куплю</option><option value="offer">Предложу услугу</option></select></label>'+
 '<label class="full">Название<input name="title" minlength="8" maxlength="110" placeholder="Например: Светлая двухкомнатная квартира" required></label>'+
 '<label class="full">Описание<textarea name="description" minlength="20" maxlength="4000" placeholder="Расскажите о состоянии, особенностях и условиях" required></textarea></label>'+
 field("city","Город")+field("price","Цена, €","number",'min="0" max="9999999999" step="1"')+
 '<label>Площадь, м² (если есть)<input name="area" type="number" min="0" max="999999" step=".1"></label><label>Комнат (если есть)<input name="rooms" type="number" min="0" max="100"></label>'+
 field("contact_name","Ваше имя")+ '<label>Телефон для связи (необязательно)<input name="contact_phone" type="tel" maxlength="35" placeholder="+371 …"></label>'+
 '<label class="full">Фотография (JPG, PNG, WebP — до 4 МБ)<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style="padding:9px"></label>'+
 '<p class="hint full">Размещайте только свои объявления. Номер телефона будет виден покупателям, если вы его укажете. Не публикуйте чужие личные данные.</p>'+
 '<button type="submit" class="full">Отправить на проверку →</button><div id="post-msg" class="full" role="status"></div></form>');
 $("#post-form").addEventListener("submit",async e=>{
  e.preventDefault();const form=e.target,fd=new FormData(form),btn=form.querySelector('button[type="submit"]'),msg=$("#post-msg");btn.disabled=true;btn.textContent="Публикуем…";
  try{
   let key="";const file=fd.get("photo");
   if(file&&file.size){if(file.size>4*1024*1024)throw Error("Файл не должен превышать 4 МБ.");const upload=new FormData();upload.append("file",file);const x=await fetchJSON("/api/upload",{method:"POST",body:upload});key=x.key;}
   const obj={};for(const key of ["title","description","category","deal_type","city","price","area","rooms","contact_name","contact_phone"])obj[key]=fd.get(key)||"";
   obj.image_key=key;
   const result=await fetchJSON("/api/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj)});
   msg.innerHTML='<div class="notice">✓ '+escapeText(result.message)+'<br><a href="'+appLink("mine")+'">Посмотреть мои объявления →</a></div>';form.reset();
  }catch(err){msg.innerHTML='<div class="notice error">'+escapeText(err.message)+'</div>';}finally{btn.disabled=false;btn.textContent="Отправить на проверку →";}
 });
}
async function openMine(){
 if(!(await requireSession()))return;
 showDrawer('<span class="section-kicker">ЛИЧНЫЙ КАБИНЕТ</span><h2>Мои объявления</h2><div id="mine-items" class="loading">Загружаем…</div>');
 try{
 const {items}=await fetchJSON("/api/mine");
 const status={pending:"На проверке",approved:"Опубликовано",rejected:"Отклонено"};
 $("#mine-items").innerHTML=items.length?items.map(x=>'<div class="mine-item"><h4>'+escapeText(x.title)+'</h4><p class="drawer-subtle">'+escapeText(x.city)+' · '+euro(x.price)+'</p><span class="item-status '+escapeText(x.status)+'">'+(status[x.status]||x.status)+'</span></div>').join(""):'<div class="notice">У вас пока нет объявлений. <a href="'+appLink("post")+'">Разместить первое →</a></div>';
 }catch(e){$("#mine-items").innerHTML=fail(e.message);}
}
async function openDetails(id){
 showDrawer('<span class="section-kicker">ПОДРОБНОСТИ ОБЪЯВЛЕНИЯ</span><div id="listing-detail" class="loading">Загружаем…</div>');
 try{
 const {item:x}=await fetchJSON("/api/listing/"+id);
 $("#listing-detail").innerHTML=(x.image_url?'<img class="drawer-image" src="'+escapeText(x.image_url)+'" alt="'+escapeText(x.title)+'">':'')+
 '<h2>'+escapeText(x.title)+'</h2><div class="detail-price">'+euro(x.price)+'</div><div class="detail-specs"><span>⌖ '+escapeText(x.city)+'</span><span>'+escapeText(cats[x.category]||"Объявление")+'</span><span>'+escapeText(deals[x.deal_type]||"Продажа")+'</span>'+(x.area?'<span>'+escapeText(x.area)+' м²</span>':'')+(x.rooms?'<span>'+escapeText(x.rooms)+' комн.</span>':'')+'</div>'+
 '<p class="detail-desc">'+escapeText(x.description)+'</p><div class="detail-contact"><h3>Связаться с продавцом</h3><p>'+escapeText(x.contact_name)+'</p>'+(x.contact_phone?'<a href="tel:'+escapeText(x.contact_phone.replace(/[^\\d+]/g,""))+'">☎ '+escapeText(x.contact_phone)+'</a>':'<p>Контактный телефон не указан.</p>')+'</div><p class="drawer-subtle">Опубликовано: '+escapeText(stamp(x.created_at))+'</p>';
 }catch(e){$("#listing-detail").innerHTML=fail(e.message);}
}
async function openAdmin(){
 if(!ON_APP){location.href=appLink("admin");return;}
 showDrawer('<span class="section-kicker">АДМИНИСТРИРОВАНИЕ</span><h2>Модерация объявлений</h2><div class="hint">Только для администратора проекта.</div><div id="admin-items">Загружаем…</div>');
 async function refresh(){
  try{
   const d=await fetchJSON("/api/admin");
   $("#admin-items").innerHTML=d.items.length?d.items.map(x=>'<div class="admin-item"><h4>'+escapeText(x.title)+'</h4><p>'+escapeText(x.description)+'</p><p class="drawer-subtle">'+escapeText(x.city)+' · '+euro(x.price)+' · '+escapeText(x.contact_name)+'</p>'+(x.image_url?'<img src="'+escapeText(x.image_url)+'" style="height:130px;max-width:100%;object-fit:cover" alt="">':'')+'<div class="admin-actions"><button data-review="'+Number(x.id)+'" data-status="approved">Одобрить</button><button data-review="'+Number(x.id)+'" data-status="rejected" class="reject">Отклонить</button></div></div>').join(""):'<div class="notice">Нет объявлений на проверке.</div>';
  }catch(e){$("#admin-items").innerHTML='<div class="notice error">'+escapeText(e.message)+'</div>';}
 }
 await refresh();
 $("#admin-items").addEventListener("click",async e=>{
 const b=e.target.closest("button[data-review]");if(!b)return;b.disabled=true;try{await fetchJSON("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Number(b.dataset.review),status:b.dataset.status})});await refresh();}catch(err){toast(err.message);b.disabled=false;}
 });
}
function openAbout(){showDrawer('<span class="section-kicker">О ПРОЕКТЕ</span><h2>MURDILIMAX Объявления</h2><p class="detail-desc">Независимая доска частных объявлений для недвижимости, автомобилей, услуг и других категорий. Размещение бесплатно, объявления проверяются перед публикацией. Мы не посредник в сделках и не принимаем платежи за товары. Не отправляйте предоплату незнакомым людям, проверяйте документы и информацию перед покупкой.</p><div class="notice">Проект развивается. Если вы обнаружили подозрительное объявление, не совершайте переводов и сообщите администрации через контакты сайта, когда они будут опубликованы.</div>');}
async function syncFromUrl(){
 displayFilters();
 const p=qs();const view=p.get("view")||"home";
 if(view==="home"){closeDrawer();await loadListings();return;}
 if(view==="post"){await openPost();return;}
 if(view==="mine"){await openMine();return;}
 if(view==="admin"){await openAdmin();return;}
 if(view==="about"){openAbout();return;}
 if(view==="ad"){await openDetails(p.get("id"));return;}
 closeDrawer();await loadListings();
}
function initialize(){
 $("#hero-search").addEventListener("submit",e=>{e.preventDefault();const p=grabFilters();p.delete("page");setUrl(p.toString());$("#listings").scrollIntoView({behavior:"smooth",block:"start"});});
 $("#apply-filters").addEventListener("click",()=>{const p=grabFilters();p.delete("page");setUrl(p.toString());});
 document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{const p=grabFilters();p.set("category",b.dataset.category);p.delete("page");setUrl(p.toString());$("#listings").scrollIntoView({behavior:"smooth"});}));
 $("#cards").addEventListener("click",e=>{const card=e.target.closest("[data-open-id]");if(card)setUrl("view=ad&id="+card.dataset.openId);else if(e.target.id==="retry"){lastSearch="";loadListings();}});
 $("#cards").addEventListener("keydown",e=>{if(["Enter"," "].includes(e.key)){const card=e.target.closest("[data-open-id]");if(card){e.preventDefault();setUrl("view=ad&id="+card.dataset.openId);}}});
 $("#pagination").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b)return;const p=grabFilters();p.set("page",b.dataset.page);setUrl(p.toString());$("#listings").scrollIntoView({behavior:"smooth"});});
 $("#drawer-close").addEventListener("click",()=>{history.pushState({}, "", "/?view=home");syncFromUrl();});
 $("#drawer").addEventListener("click",e=>{if(e.target.hasAttribute("data-close")){history.pushState({}, "", "/?view=home");syncFromUrl();}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#drawer").hidden){history.pushState({}, "", "/?view=home");syncFromUrl();}});
 window.addEventListener("popstate",()=>{lastSearch="";syncFromUrl();});
 document.querySelectorAll("[data-post-link]").forEach(a=>{a.href=appLink("post");});
 $("#post-link").href=appLink("post");
 $("#sign-in").href=ON_APP?"/login?next=%2F":HOST+"/login?next=%2F";
 if(ON_APP&&window.hatchable?.auth)window.hatchable.auth.getSession().then(s=>{if(s?.user)$("#sign-in").textContent="Мой аккаунт";}).catch(()=>{});
 syncFromUrl();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);else initialize();
})();