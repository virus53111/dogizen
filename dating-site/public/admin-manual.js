/* Secure owner-only manual listings. Real adult consent required. */
"use strict";
const $=sel=>document.querySelector(sel);
let current=[];
let editing=null;
const form=$("#manualForm"),stat=$("#formStatus"),gate=$("#accessGate"),workspace=$("#workspace"),photo=$("#photo");
function notice(message,error=false,location=stat){
 location.textContent=message||"";
 location.style.color=error?"#ff9cae":"#f3cc81";
}
async function api(url,options){
 const response=await fetch(url,{cache:"no-store",...options});
 let result={};
 try{result=await response.json()}catch{}
 if(!response.ok)throw Object.assign(new Error(result.error||"Ошибка "+response.status),{status:response.status});
 return result;
}
function field(name){return form.elements.namedItem(name)}
function reset(){
 editing=null;
 form.reset();
 field("action").value="create";field("id").value="";
 photo.required=true;photo.value="";
 $("#photoPreview").removeAttribute("src");
 $("#formTitle").textContent="Новая анкета";
 $("#submitBtn").textContent="Опубликовать анкету";
 $("#cancelEdit").hidden=true;
 notice("");
}
function startEdit(entry){
 editing=entry.id;
 const names=["display_name","age","country","city","district","category","headline","description","languages","consent_note"];
 for(const name of names)field(name).value=entry[name]??"";
 field("action").value="edit";field("id").value=entry.id;
 field("adultConfirmed").checked=false;field("consentConfirmed").checked=false;
 photo.required=false;photo.value="";
 const preview=$("#photoPreview");if(entry.avatar_url)preview.src=entry.avatar_url;else preview.removeAttribute("src");
 $("#formTitle").textContent="Редактирование: "+entry.display_name;
 $("#submitBtn").textContent="Сохранить изменения";
 $("#cancelEdit").hidden=false;
 $("#formPanel").scrollIntoView({behavior:"smooth",block:"start"});
 notice("Проверь данные и повторно подтверди согласие на публикацию.");
}
function actionButton(label,fn,cls=""){
 const b=document.createElement("button");
 b.type="button";b.className="mm-btn "+cls;b.textContent=label;
 b.onclick=async()=>{b.disabled=true;try{await fn()}catch(error){notice(error.message,true,$("#listStatus"))}finally{b.disabled=false}};
 return b;
}
function text(el,content){const node=document.createElement(el);node.textContent=String(content||"");return node}
function render(){
 const parent=$("#manualList");parent.replaceChildren();
 if(!current.length){parent.append(text("p","Анкет пока нет. Добавь первую через форму выше."));return}
 for(const item of current){
  const article=document.createElement("article");article.className="mm-card";
  const head=document.createElement("div");head.className="mm-card-head";
  const img=document.createElement("img");img.className="mm-card-photo";img.alt="Фото: "+item.display_name;
  if(item.avatar_url?.startsWith("/media/"))img.src=item.avatar_url;
  head.append(img);
  const info=document.createElement("div");
  const title=text("h3",item.display_name+", "+item.age);title.className="mm-card-name";info.append(title);
  const tag=text("span",item.status==="approved"?"Опубликовано":"Скрыто");tag.className="mm-card-tag";info.append(tag);
  const meta=text("p",item.country+" · "+item.city+(item.district?" · "+item.district:""));meta.className="mm-card-meta";info.append(meta);
  const description=text("p",item.description);description.className="mm-card-desc";info.append(description);head.append(info);article.append(head);
  const actions=document.createElement("div");actions.className="mm-card-action";
  actions.append(actionButton("Редактировать",()=>startEdit(item)));
  if(item.status==="approved")
   actions.append(actionButton("Скрыть",async()=>{await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"hide",id:item.id})});await load()}));
  else
   actions.append(actionButton("Опубликовать",async()=>{await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"publish",id:item.id})});await load()},"primary"));
  actions.append(actionButton("Удалить",async()=>{
   if(!confirm("Навсегда удалить анкету «"+item.display_name+"» и её фотографию?"))return;
   await api("/api/admin/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete",id:item.id})});
   if(editing===item.id)reset();
   await load();
  },"warning"));
  article.append(actions);parent.append(article);
 }
}
async function load(){
 const data=await api("/api/admin/manual");
 current=data.listings||[];
 render();
 notice("Опубликовано: "+current.filter(x=>x.status==="approved").length+" · скрыто: "+current.filter(x=>x.status!=="approved").length,false,$("#listStatus"));
 return data;
}
$("#cancelEdit").onclick=reset;
photo.addEventListener("change",()=>{
 const chosen=photo.files?.[0],preview=$("#photoPreview");
 if(!chosen){if(!editing)preview.removeAttribute("src");return}
 if(chosen.size>4*1024*1024){photo.value="";notice("Размер фото не должен превышать 4 МБ.",true);return}
 const reader=new FileReader();
 reader.onload=()=>{preview.src=reader.result};
 reader.readAsDataURL(chosen);
});
form.addEventListener("submit",async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=$("#submitBtn");button.disabled=true;notice("Сохраняем анкету...");
 try{
  const data=new FormData(form);
  const response=await api("/api/admin/manual",{method:"POST",body:data});
  reset();
  notice((response.listing?.status==="approved"?"Анкета опубликована!":"Анкета сохранена.")+" Открой каталог, чтобы увидеть её.");
  await load();
 }catch(error){notice(error.message,true)}finally{button.disabled=false}
});
(async()=>{
 try{
  if(window.MM_authReady)await window.MM_authReady;
  await load();
  gate.hidden=true;workspace.hidden=false;
 }catch(error){
  gate.hidden=false;workspace.hidden=true;
  gate.replaceChildren();
  const heading=text("h2",error.status===403?"Нет доступа":"Войдите в админку");
  const info=text("p",error.status===403?"Доступ есть только у подтверждённого владельца сайта.":"Для добавления анкет нужен вход в аккаунт владельца.");
  info.className="mm-muted";
  const link=document.createElement("a");link.href="/login?next=%2Fadmin-create.html";link.className="mm-btn primary";link.textContent="Войти";
  gate.append(heading,info,link);
 }
})();
