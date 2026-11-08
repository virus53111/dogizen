(()=>{
"use strict";
const $=s=>document.querySelector(s), esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtPrice=n=>new Intl.NumberFormat("ru-RU",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0);
const date=s=>s?new Date(s).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"}):"—";
const labels={summary:["Панель управления","Основные показатели сайта"],ads:["Объявления пользователей","Проверка, редактирование и удаление"],external:["Реальные предложения SS.lv","Можно скрыть отдельную внешнюю ссылку. Редактировать чужие объявления нельзя."],reports:["Жалобы на объявления","Проверка подозрительных предложений. Объявления не скрываются до решения модератора."],users:["Зарегистрированные пользователи","Проверенные email и блокировка новых публикаций"],moderators:["Модераторы по email","Назначайте только доверенных людей"],audit:["История действий","Кто и когда выполнял операции"]};
const categories={realty:"Недвижимость",cars:"Автомобили",electronics:"Электроника",jobs:"Работа",services:"Услуги",home:"Дом и сад",other:"Разное"};
const state={tab:"summary",role:null,page:1,status:"all",search:"",email:null,ads:new Map(),users:new Map(),external:new Map()};
function notice(message,error=false){const n=$("#staff-status");n.textContent=message;n.classList.toggle("error",error);n.hidden=false;setTimeout(()=>{if(n.textContent===message)n.hidden=true;},6500);}
async function api(path,options={}){
 let r=await fetch("/api/staff"+path,{credentials:"same-origin",cache:"no-store",...options});
 if(r.status===401||r.status===302||r.redirected&&r.url.includes("/login")){
   location.href="/login?next="+encodeURIComponent("/admin.html");throw Error("Требуется вход");
 }
 let data;try{data=await r.json();}catch{data={error:"Сервер ответил неожиданным форматом"};}
 if(!r.ok)throw Error(data.error||"Ошибка "+r.status);
 return data;
}
async function send(action,details){return api("",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...details})});}
function noItems(s){return '<div class="staff-empty">'+esc(s)+'</div>';}
function control(tag,cls,txt,attrs=""){return '<button class="'+cls+'" '+attrs+'>'+esc(txt)+'</button>';}
function badge(s){return '<span class="staff-pill '+esc(s)+'">'+({pending:"На проверке",approved:"Опубликовано",rejected:"Отклонено"}[s]||esc(s))+'</span>';}
function pager(items){
 const prev=state.page>1?'<button type="button" data-page="'+(state.page-1)+'">← Назад</button>':'';
 const next=items.length===50&&state.page<30?'<button type="button" data-page="'+(state.page+1)+'">Далее →</button>':'';
 return '<div class="staff-pagination">'+prev+'<span class="staff-muted">Страница '+state.page+'</span>'+next+'</div>';
}
async function render(){
 $("#staff-title").textContent=labels[state.tab][0];$("#staff-intro").textContent=labels[state.tab][1];
 $("#staff-nav").querySelectorAll("button").forEach(el=>el.classList.toggle("active",el.dataset.tab===state.tab));
 $("#staff-content").innerHTML='<div class="staff-loading">Загрузка данных…</div>';
 try{
  if(state.tab==="summary")return await summary();
  if(state.tab==="ads")return await ads();
  if(state.tab==="users")return await users();
  if(state.tab==="moderators")return await moderators();
  if(state.tab==="external")return await external();
  if(state.tab==="reports")return await reports();
  if(state.tab==="audit")return await audit();
 }catch(e){$("#staff-content").innerHTML='<div class="staff-card"><h2>Не удалось загрузить</h2><p>'+esc(e.message)+'</p></div>';notice(e.message,true);}
}
function switchTab(tab){if(!labels[tab])return;if(state.role!=="owner"&&["users","moderators","audit"].includes(tab))return;state.tab=tab;state.page=1;state.status=tab==="reports"?"open":"all";state.search="";render();}
async function summary(){
 const r=await api("?view=summary");state.role=r.role;state.email=r.email;$("#staff-email").textContent=r.email;
 if(r.role!=="owner")document.querySelectorAll("[data-owner]").forEach(e=>e.hidden=true);
 const d=r.stats;
 $("#staff-content").innerHTML='<div class="staff-stats">'+
  [['Ожидают проверки',d.ads.pending],['Жалоб к проверке',d.reports],['Опубликовано',d.ads.approved],['Внешних предложений',d.external],['Зарегистрировано',d.users]].map(([k,n])=>'<div class="stat-box"><span>'+esc(k)+'</span><strong>'+Number(n||0)+'</strong></div>').join("")+'</div>'+
  '<div class="staff-card"><h2>Ваша панель готова</h2><p>Админские действия защищены подтверждённым входом по email. '+(r.role==="owner"?"Вы — единственный главный администратор. Новых модераторов можно приглашать по адресу электронной почты.":"Вы назначены модератором и можете проверять, редактировать и убирать объявления.")+'</p><p>Заблокированных пользователей: <b>'+d.banned+'</b> · Модераторов: <b>'+d.moderators+'</b></p><button class="staff-button" data-switch="ads">Перейти к объявлениям →</button></div>'+
  '<div class="staff-card"><h2>Об объявлениях других сайтов</h2><p>На витрине показываются предложения из RSS SS.lv. Продавцы SS.lv не регистрировались на MURDILIMAX; их объявления можно скрыть, но нельзя выдавать за свои.</p></div>';
}
async function ads(){
 const r=await api("?view=ads&status="+encodeURIComponent(state.status)+"&page="+state.page);
 state.ads=new Map(r.items.map(a=>[String(a.id),a]));
 const toolbar='<div class="staff-toolbar"><label class="staff-field">Статус<select id="ads-status"><option value="all">Все</option><option value="pending">На проверке</option><option value="approved">Опубликованные</option><option value="rejected">Отклонённые</option></select></label><button class="staff-button" data-load="ads">Показать</button></div>';
 if(!r.items.length){$("#staff-content").innerHTML=toolbar+noItems("В этом разделе объявлений пока нет.");$("#ads-status").value=state.status;return;}
 const table='<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Объявление</th><th>Цена / город</th><th>Автор</th><th>Статус</th><th>Действия</th></tr></thead><tbody>'+
 r.items.map(a=>'<tr><td><div class="staff-td-image">'+(a.image_url?'<img loading="lazy" src="'+esc(a.image_url)+'" alt="">':'<span class="fallback-image">▦</span>')+'<div><strong>#'+a.id+' · '+esc(a.title)+'</strong><br><small>'+esc(date(a.created_at))+' · '+esc(categories[a.category]||a.category)+'</small></div></div></td><td><strong>'+esc(fmtPrice(a.price))+'</strong><br><small>'+esc(a.city)+'</small></td><td><small>'+esc(a.author_email||a.contact_name||"—")+'</small></td><td>'+badge(a.status)+'</td><td><div class="staff-actions">'+
  control('button','staff-secondary','Изменить','data-edit="'+a.id+'"')+
  (a.status!=="approved"?control('button','staff-secondary','✓ Одобрить','data-id="'+a.id+'" data-status="approved"'):"")+
  (a.status!=="rejected"?control('button','staff-secondary','Отклонить','data-id="'+a.id+'" data-status="rejected"'):"")+
  control('button','staff-danger','Удалить','data-delete="'+a.id+'"')+'</div></td></tr>').join("")+
 '</tbody></table></div>';
 $("#staff-content").innerHTML=toolbar+table+pager(r.items);
 $("#ads-status").value=state.status;
}
async function users(){
 const r=await api("?view=users&page="+state.page+"&q="+encodeURIComponent(state.search));
 state.users=new Map(r.items.map(u=>[u.id,u]));
 const search='<div class="staff-toolbar"><label class="staff-field">Email или имя<input type="search" id="users-search" maxlength="100" placeholder="Найти пользователя" value="'+esc(state.search)+'"></label><button class="staff-button" data-load="users">Поиск</button></div>';
 if(!r.items.length){$("#staff-content").innerHTML=search+noItems("Пользователей пока нет.");return;}
 const table='<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Пользователь</th><th>Зарегистрирован</th><th>Объявлений</th><th>Доступ</th><th>Действия</th></tr></thead><tbody>'+r.items.map(u=>
  '<tr><td><strong>'+esc(u.email)+'</strong><br><small>'+esc(u.name||"—")+'</small></td><td>'+esc(date(u.created_at))+'<br><small>'+(u.email_verified_at?"Email подтверждён":"Не подтверждён")+'</small></td><td>'+u.ads_count+'</td><td>'+ (u.banned?'<span class="staff-pill rejected">Заблокирован</span>':'<span class="staff-pill approved">Активен</span>')+'</td><td><div class="staff-actions">'+
  (u.email?.toLowerCase()===state.email?'Главный администратор':u.banned?control('button','staff-secondary','Разблокировать','data-unban="'+esc(u.id)+'"'):control('button','staff-danger','Заблокировать','data-ban="'+esc(u.id)+'"'))+
  '</div></td></tr>').join("")+'</tbody></table></div>';
 $("#staff-content").innerHTML=search+table+pager(r.items);
}
async function moderators(){
 const r=await api("?view=moderators");
 const form='<div class="staff-card"><h2>Добавить модератора</h2><p>Введите электронную почту. Когда человек войдёт в MURDILIMAX и подтвердит свой email одноразовым кодом, получит доступ к проверке и редактированию объявлений. Назначать других модераторов он не сможет.</p><form id="mod-form" class="staff-toolbar"><label class="staff-field">Email модератора<input type="email" id="mod-email" placeholder="moderator@example.com" required maxlength="254"></label><button type="submit" class="staff-button">Добавить</button></form></div>';
 const table='<div class="staff-card"><h2>Назначенные модераторы</h2>'+(r.items.length?'<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Email</th><th>Дата назначения</th><th>Действие</th></tr></thead><tbody>'+r.items.map(m=>'<tr><td><strong>'+esc(m.email)+'</strong></td><td>'+esc(date(m.created_at))+'</td><td>'+control('button','staff-danger','Отозвать доступ','data-remove-mod="'+esc(m.email)+'"')+'</td></tr>').join("")+'</tbody></table></div>':noItems("Пока нет модераторов."))+'</div>';
 $("#staff-content").innerHTML=form+table;
}
async function external(){
 const r=await api("?view=external&page="+state.page);
 state.external=new Map(r.items.map(x=>[x.source_url,x]));
 const intro='<div class="staff-card"><h2>Каталог из открытых источников</h2><p>Внешние объявления синхронизируются с SS.lv автоматически. Здесь можно скрыть конкретную запись с MURDILIMAX, но изменить или удалить оригинал на SS.lv нельзя.</p></div>';
 if(!r.items.length){$("#staff-content").innerHTML=intro+noItems("Нет внешних объявлений.");return;}
 const table='<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Предложение</th><th>Цена</th><th>Источник</th><th>Статус</th><th>Действия</th></tr></thead><tbody>'+r.items.map(x=>
  '<tr><td><div class="staff-td-image">'+(x.image_url?'<img src="'+esc(x.image_url)+'" alt="" loading="lazy">':'<span class="fallback-image">↗</span>')+'<div><strong>'+esc(x.title)+'</strong><br><small>'+esc(x.city)+'</small></div></div></td><td>'+esc(fmtPrice(x.price))+'</td><td><a href="'+esc(x.source_url)+'" target="_blank" rel="noopener noreferrer">SS.lv ↗</a></td><td>'+ (x.hidden?'<span class="staff-pill rejected">Скрыто</span>':'<span class="staff-pill approved">Видно</span>')+'</td><td>'+control('button',x.hidden?"staff-secondary":"staff-danger",x.hidden?"Вернуть":"Скрыть",'data-external="'+esc(x.source_url)+'" data-hidden="'+String(!!x.hidden)+'"')+'</td></tr>').join("")+'</tbody></table></div>';
 $("#staff-content").innerHTML=intro+table+pager(r.items);
}
async function reports(){
 const r=await api("?view=reports&status="+encodeURIComponent(["open","resolved","dismissed","all"].includes(state.status)?state.status:"open")+"&page="+state.page);
 const reasons={fraud:"Мошенничество",prohibited:"Запрещённые товары",misleading:"Ложная информация",privacy:"Личные данные",broken:"Нерабочая ссылка",other:"Другое"};
 const toolbar='<div class="staff-toolbar"><label class="staff-field">Статус<select id="reports-status"><option value="open">Новые</option><option value="resolved">Обработанные</option><option value="dismissed">Отклонённые</option><option value="all">Все</option></select></label><button class="staff-button" data-load="reports">Показать</button></div>';
 if(!r.items.length){$("#staff-content").innerHTML=toolbar+noItems("Жалоб с таким статусом нет.");$("#reports-status").value=["open","resolved","dismissed","all"].includes(state.status)?state.status:"open";return;}
 const table='<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Жалоба</th><th>Объявление</th><th>Объяснение</th><th>Результат</th><th>Действия</th></tr></thead><tbody>'+r.items.map(a=>{
  const isNew=a.status==="open";
  const info=a.target_type==="native"?"MURDILIMAX #"+a.target_id+" · "+esc(a.native_status||"удалено"):"SS.lv #"+a.target_id+(a.external_hidden?" · скрыто":"");
  const source=a.target_type==="external"&&a.source_url?'<a href="'+esc(a.source_url)+'" rel="noopener noreferrer" target="_blank">Оригинал ↗</a>':"";
  const actions=isNew?'<div class="staff-actions">'+control("button","staff-secondary","✓ Рассмотрено",'data-report-id="'+a.id+'" data-decision="resolve"')+control("button","staff-danger","Скрыть и закрыть",'data-report-id="'+a.id+'" data-decision="hide"')+control("button","staff-secondary","Отклонить жалобу",'data-report-id="'+a.id+'" data-decision="dismiss"')+'</div>':"—";
  return '<tr><td><strong>№'+a.id+' · '+esc(reasons[a.reason]||a.reason)+'</strong><br><small>'+esc(date(a.created_at))+'</small></td><td><strong>'+esc(a.title)+'</strong><br><small>'+info+'</small><br>'+source+'</td><td><small>'+esc(a.details||"Без комментария")+'</small></td><td>'+esc(a.status==="open"?"Ожидает":a.status==="resolved"?"Обработана":"Отклонена")+'</td><td>'+actions+'</td></tr>';
 }).join("")+'</tbody></table></div>';
 $("#staff-content").innerHTML=toolbar+table+pager(r.items);
 $("#reports-status").value=["open","resolved","dismissed","all"].includes(state.status)?state.status:"open";
}
async function audit(){
 const r=await api("?view=audit");
 $("#staff-content").innerHTML=r.items.length?r.items.map(x=>'<article class="staff-audit"><strong>'+esc(x.action)+' · '+esc(x.target_type)+' · '+esc(x.target_id)+'</strong><p>'+esc(x.details||"")+'</p><small>'+esc(x.actor_email)+' · '+esc(date(x.created_at))+'</small></article>').join(""):noItems("Действий пока нет.");
}
function editModal(id){
 const a=state.ads.get(String(id));if(!a)return;
 const categoryOptions=Object.entries(categories).map(([k,v])=>'<option value="'+k+'"'+(k===a.category?" selected":"")+'>'+esc(v)+'</option>').join("");
 $("#staff-modal-body").innerHTML='<h2>Редактирование #'+a.id+'</h2><p class="admin-help">Изменения сразу появятся на сайте для опубликованных объявлений. Проверяйте контактные данные и жалобы.</p><form id="staff-edit-form" class="staff-edit"><label>Название<input name="title" minlength="8" maxlength="110" required value="'+esc(a.title)+'"></label><label>Категория<select name="category">'+categoryOptions+'</select></label><label>Город<input name="city" required minlength="2" maxlength="80" value="'+esc(a.city)+'"></label><label>Цена, €<input name="price" type="number" min="0" step="1" required value="'+Number(a.price)+'"></label><label>Описание<textarea name="description" minlength="20" maxlength="4000" required>'+esc(a.description)+'</textarea></label><button type="submit" class="staff-button">Сохранить изменения</button></form>';
 $("#staff-modal").hidden=false;
 $("#staff-edit-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,b={};new FormData(f).forEach((v,k)=>b[k]=v);try{await send("edit",{id:a.id,...b});$("#staff-modal").hidden=true;notice("Объявление изменено");await render();}catch(err){notice(err.message,true);}});
}
function closeModal(){$("#staff-modal").hidden=true;}
async function handleClick(e){
 const tab=e.target.closest("[data-tab]");if(tab)return switchTab(tab.dataset.tab);
 const switcher=e.target.closest("[data-switch]");if(switcher)return switchTab(switcher.dataset.switch);
 const page=e.target.closest("[data-page]");if(page){state.page=Number(page.dataset.page);return render();}
 const loading=e.target.closest("[data-load]");if(loading){if(loading.dataset.load==="ads")state.status=$("#ads-status").value;if(loading.dataset.load==="users"){state.search=$("#users-search").value.trim();state.page=1;}if(loading.dataset.load==="reports"){state.status=$("#reports-status").value;state.page=1;}return render();}
 const review=e.target.closest("[data-report-id]");
 if(review){
  const decision=review.dataset.decision,id=Number(review.dataset.reportId);
  if(decision==="hide"&&!confirm("Скрыть объявление на MURDILIMAX и закрыть жалобу?"))return;
  review.disabled=true;
  try{await send("report_review",{id,decision});notice("Жалоба обработана");await render();}
  catch(err){notice(err.message,true);review.disabled=false;}
  return;
 }
 const edit=e.target.closest("[data-edit]");if(edit)return editModal(edit.dataset.edit);
 const status=e.target.closest("[data-status]");if(status){try{await send("status",{id:Number(status.dataset.id),status:status.dataset.status});notice("Статус изменён");await render();}catch(err){notice(err.message,true);}return;}
 const del=e.target.closest("[data-delete]");if(del){if(!confirm("Безвозвратно удалить объявление #"+del.dataset.delete+" и его фотографии?"))return;try{await send("delete",{id:Number(del.dataset.delete)});notice("Объявление удалено");await render();}catch(err){notice(err.message,true);}return;}
 const ban=e.target.closest("[data-ban]");if(ban){const u=state.users.get(ban.dataset.ban);if(!u)return;const reason=prompt("Причина блокировки "+u.email+" (будут скрыты и отклонены его объявления):","Нарушение правил");if(reason===null)return;try{await send("ban",{user_id:u.id,reason});notice("Пользователь заблокирован");await render();}catch(err){notice(err.message,true);}return;}
 const unban=e.target.closest("[data-unban]");if(unban){if(!confirm("Разблокировать пользователя? Отклонённые объявления не станут автоматически опубликованными."))return;try{await send("unban",{user_id:unban.dataset.unban});notice("Пользователь разблокирован");await render();}catch(err){notice(err.message,true);}return;}
 const mod=e.target.closest("[data-remove-mod]");if(mod){if(!confirm("Отозвать права модератора у "+mod.dataset.removeMod+"?"))return;try{await send("moderator_remove",{email:mod.dataset.removeMod});notice("Права модератора отозваны");await render();}catch(err){notice(err.message,true);}return;}
 const ext=e.target.closest("[data-external]");if(ext){const hide=ext.dataset.hidden!=="true";if(hide&&!confirm("Скрыть внешнее объявление из выдачи MURDILIMAX?"))return;try{await send(hide?"external_hide":"external_restore",{source_url:ext.dataset.external});notice(hide?"Внешнее предложение скрыто":"Предложение восстановлено");await render();}catch(err){notice(err.message,true);}return;}
 if(e.target.closest("[data-close]"))return closeModal();
}
function init(){
 $("#staff-nav").addEventListener("click",handleClick);
 $("#staff-content").addEventListener("click",handleClick);
 $("#staff-modal").addEventListener("click",handleClick);
 $("#staff-refresh").addEventListener("click",render);
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
 $("#staff-content").addEventListener("submit",async e=>{
  if(e.target.id!=="mod-form")return;e.preventDefault();
  const input=$("#mod-email"),email=input.value.trim().toLowerCase();
  if(!email)return;
  try{await send("moderator_add",{email});notice("Модератор назначен. Попросите его войти на сайт по этому адресу.");await render();}
  catch(err){notice(err.message,true);}
 });
 summary().catch(e=>{
  if(String(e.message).includes("Требуется вход"))return;
  $("#staff-content").innerHTML='<div class="staff-card"><h2>Доступ закрыт</h2><p>'+esc(e.message)+'. Если это ваша учётная запись, войдите с подтверждённой почтой главного администратора.</p><a class="staff-button" href="/login?next=%2Fadmin.html">Войти по email</a></div>';
  notice(e.message,true);
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();