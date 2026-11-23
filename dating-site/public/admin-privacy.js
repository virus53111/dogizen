"use strict";
(async()=>{
 const q=document.getElementById("privacyQueue"),stat=document.getElementById("privacyQueueStatus");
 const button=document.getElementById("refreshPrivacy");
 if(!q||!stat||!button)return;
 async function refreshPrivacy(){
  button.disabled=true;stat.textContent="Загружаем запросы...";
  try{
   const response=await fetch("/api/admin/privacy-requests",{cache:"no-store"});
   if(response.status===401||response.status===403){stat.textContent="Доступ только владельцу сайта.";return}
   if(!response.ok)throw Error("Ошибка запроса: "+response.status);
   const data=await response.json();q.replaceChildren();
   if(!data.requests.length)q.textContent="Новых запросов нет.";
   for(const request of data.requests){
    const item=document.createElement("div");item.className="report";
    const title=document.createElement("strong");
    title.textContent=request.email||"Аккаунт без email";
    const desc=document.createElement("p");
    desc.textContent="Запрос "+request.id+" · "+request.status+" · "+new Date(request.created_at).toLocaleString("ru-RU");
    item.append(title,desc);q.append(item);
   }
   stat.textContent="Отправка запроса не удаляет данные. Обработка проводится вручную.";
  }catch(e){stat.textContent=e.message}
  finally{button.disabled=false}
 }
 button.addEventListener("click",refreshPrivacy);
 if(window.MM_authReady)await window.MM_authReady;
 await refreshPrivacy();
})();
