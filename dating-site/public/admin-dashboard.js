/* Moderation for real registered, admin-published, and preserved archived profiles. */
"use strict";
let status="approved";
let adminItems=[],adminQuery='';
const $=q=>document.querySelector(q);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sourceName={member:"Участник",manual:"Добавлено через админку",legacy:"Сохранённая анкета"};
const statusLabel={pending:"На проверке",approved:"Опубликованы",rejected:"Скрыты / отклонены"};
function notice(msg,isError=false){const el=$("#message");el.textContent=msg;el.style.color=isError?"#a62447":"#1c705a"}
async function read(url,opts={}){
 const r=await fetch(url,{cache:"no-store",...opts});
 let json={};try{json=await r.json()}catch{}
 if(!r.ok)throw Object.assign(new Error(json.error||"Ошибка "+r.status),{status:r.status});
 return json;
}
function authGate(code){
 document.body.classList.remove("admin-verified");
 const gate=$("#adminGate");gate.hidden=false;
 const blocked=code===403;
 gate.innerHTML=blocked
  ?'<h2>Доступ запрещён</h2><p>Войдите под подтверждённой учётной записью администратора.</p><a class="btn btn-dark" href="/auth/login.html?next=%2Fadmin.html">Сменить аккаунт</a>'
  :'<h2>Вход в админку</h2><p>Для управления анкетами требуется вход владельца.</p><a class="btn btn-dark" href="/auth/login.html?next=%2Fadmin.html">Войти</a>';
}
function button(label,action,id,source,featured){
 return '<button type="button" class="btn btn-outline admin-action" data-action="'+action+'" data-id="'+esc(id)+'" data-source="'+esc(source)+'" data-featured="'+Boolean(featured)+'">'+label+'</button>';
}
function render(){
 const target=$("#list");
 if(!adminItems.length){target.innerHTML='<div class="empty"><h3>В этом разделе анкет нет</h3><p>Переключите вкладку или добавьте анкету.</p></div>';return}
 const shown=adminItems.filter(item=>!adminQuery||[item.display_name,item.city,item.country,item.headline,item.source].join(' ').toLowerCase().includes(adminQuery));
 if(!shown.length){target.textContent='Нет совпадений';return;}
 target.innerHTML=shown.map(item=>{
  const photo=item.avatar_url?'<img loading="lazy" src="'+esc(item.avatar_url)+'" alt="Фото анкеты" class="admin-photo">':"";
  const meta=[item.country,item.city,item.district,item.category].filter(Boolean).map(esc).join(" · ");
  let actions=button("✎ Редактировать","edit",item.id,item.source);
  if(item.status==="approved")actions+=button("Скрыть","hide",item.id,item.source);
  else actions+=button("Опубликовать","publish",item.id,item.source);
  if(item.status==="approved"&&item.source!=="legacy")actions+=button(item.featured?"Убрать выделение":"★ Выделить","feature",item.id,item.source,!item.featured);
  actions+=button("Удалить","delete",item.id,item.source);
  return '<article class="ad-row" data-profile="'+esc(item.id)+'"><div class="admin-profile"><div>'+photo+'</div><div class="admin-profile-text"><div class="ad-meta">'+esc(sourceName[item.source]||"Анкета")+'</div><h3>'+esc(item.display_name)+', '+Number(item.age)+'</h3><div class="ad-meta">'+meta+' · '+esc(item.created_at)+'</div>'+(item.headline?'<strong>'+esc(item.headline)+'</strong>':"")+'<div class="ad-desc">'+esc(item.description)+'</div></div></div><div class="ad-buttons">'+actions+'</div></article>'
 }).join("");
}
async function refresh(){
 try{
  const json=await read("/api/admin/listings?status="+encodeURIComponent(status));
  document.body.classList.add("admin-verified");$("#adminGate").hidden=true;
  adminItems=json.listings||[];
  $("#stats").innerHTML=["pending","approved","rejected"].map(k=>'<div class="stat-box"><strong>'+Number((json.stats||[]).find(s=>s.status===k)?.total||0)+'</strong><span>'+statusLabel[k]+'</span></div>').join("");
  document.querySelectorAll("[data-status]").forEach(b=>b.classList.toggle("selected",b.dataset.status===status));
  render();
  read('/api/admin/overview').then(data=>{const box=$('#adminOverview');if(box)box.textContent='Подтверждённые аккаунты: '+data.accounts+' · Опубликовано: '+data.published+' · С перепиской: '+data.messaging+' · Гостевая книга на проверке: '+data.guestbook_pending+' · Жалобы на чат: '+data.chat_reports+' · Приватные фото: '+data.photos;}).catch(()=>{});
  $("#reports").innerHTML=(json.reports||[]).length?(json.reports||[]).map(q=>'<div class="report"><strong>'+esc(q.reason)+'</strong><br><small>'+esc(q.display_name)+' · '+esc(q.created_at)+'</small></div>').join(""):"Жалоб пока нет";
 }catch(e){if(e.status===401||e.status===403)authGate(e.status);else notice(e.message,true)}
}
const editDialog=$("#adminEditModal"),editForm=$("#adminEditForm");
function edit(item){
 const names=["display_name","age","country","city","district","category","headline","languages","description"];
 for(const name of names)editForm.elements.namedItem(name).value=item[name]??"";
 editForm.elements.namedItem("id").value=item.id;
 editForm.elements.namedItem("source").value=item.source;
 editForm.elements.namedItem("photo").value="";
 $("#adminEditPreview").src=item.avatar_url||"";
 $("#editError").textContent="";
 editDialog.showModal();
}
async function takeAction(item,action,button){
 if(action==="edit"){edit(item);return}
 if(action==="delete"&&!confirm('Удалить анкету «'+item.display_name+'»? Действие необратимо.'))return;
 button.disabled=true;notice("");
 try{
  const body={action,id:item.id,source:item.source};
  if(action==="feature")body.featured=button.dataset.featured==="true";
  await read("/api/admin/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  await refresh();
  notice(action==="delete"?"Анкета удалена":action==="hide"?"Анкета скрыта":"Изменения сохранены");
 }catch(e){notice(e.message,true)}finally{button.disabled=false}
}
$("#list").addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");if(!b)return;
 const item=adminItems.find(x=>x.id===b.dataset.id && x.source===b.dataset.source);
 if(item)takeAction(item,b.dataset.action,b)
});
editForm.addEventListener("submit",async e=>{
 e.preventDefault();
 if(!editForm.reportValidity())return;
 const submit=$("#adminSaveBtn");submit.disabled=true;$("#editError").textContent="Сохраняем...";
 try{
  const body=new FormData(editForm);
  body.set("action","edit");
  if(!editForm.elements.namedItem("photo").files.length)body.delete("photo");
  await read("/api/admin/manage",{method:"POST",body});
  editDialog.close();await refresh();notice("Анкета обновлена");
 }catch(err){$("#editError").textContent=err.message}finally{submit.disabled=false}
});
$("#editCancel").onclick=()=>editDialog.close();
editDialog.addEventListener("click",e=>{if(e.target===editDialog)editDialog.close()});
document.querySelectorAll("[data-status]").forEach(b=>b.addEventListener("click",()=>{status=b.dataset.status;refresh()}));
const search=document.createElement('input');search.type='search';search.placeholder='Поиск по имени, городу или источнику';search.setAttribute('aria-label',search.placeholder);search.style.cssText='width:100%;max-width:450px;padding:10px;margin:12px 0';search.oninput=()=>{adminQuery=search.value.trim().toLowerCase();render()};
const overview=document.createElement('p');overview.id='adminOverview';overview.setAttribute('role','status');$('#list').before(overview,search);
Promise.resolve(window.MM_authReady).then(()=>refresh(),()=>refresh());
