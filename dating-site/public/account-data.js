"use strict";
(async()=>{
 const $=id=>document.getElementById(id), status=$("privacyStatus");
 try{
  if(window.MM_authReady)await window.MM_authReady;
  const response=await fetch("/api/session",{cache:"no-store"});
  if(!response.ok)throw Error("Не удалось проверить авторизацию");
  const data=await response.json();
  if(!data.user){$("privacyLogin").hidden=false;status.textContent="Войдите, чтобы получить доступ к своим данным.";return}
  $("privacyControls").hidden=false;
  $("accountIdentity").textContent=data.user.email ? "Вы вошли как "+data.user.email : "Вы вошли через Telegram";
  $("telegramOnlyHelp").hidden=!!data.user.email;
  if(data.user.emailVerified){
   void fetch('/auth/telegram/availability').then(result=>{
    if(result.ok)$("telegramLinkControl").hidden=false;
   }).catch(()=>{});
   const button=$("telegramConnect"), linkStatus=$("telegramConnectStatus");
   button.onclick=async()=>{
    button.disabled=true;
    linkStatus.textContent="Открываем Telegram…";
    try{
     const response=await fetch('/auth/telegram/browser-link',{method:'POST'});
     if(!response.ok)throw Error();
     const {url}=await response.json();
     linkStatus.textContent="В Telegram нажмите «Подключить мой аккаунт».";
     location.href=url;
    }catch{
     linkStatus.textContent="Не удалось открыть Telegram. Попробуйте ещё раз.";
    }finally{button.disabled=false}
   };
  }
  async function refresh(){
   const r=await fetch("/api/privacy",{cache:"no-store"});
   if(!r.ok)throw Error("Не удалось загрузить список запросов");
   const {requests=[]}=await r.json();
   const parent=$("myRequests");parent.replaceChildren();
   if(!requests.length){parent.textContent="Запросов пока нет.";return}
   for(const item of requests){
    const row=document.createElement("p");
    const when=new Date(item.created_at);
    row.textContent="Запрос №"+item.id.slice(0,8)+" · "+(item.status==="open"?"Ожидает проверки":"На рассмотрении")+" · "+(isNaN(when.getTime())?"":when.toLocaleDateString());
    parent.append(row);
   }
  }
  await refresh();
  $("privacyRequestForm").onsubmit=async e=>{
   e.preventDefault();
   if($("confirmation").value.trim()!=="УДАЛИТЬ АККАУНТ"){status.textContent="Введите точную фразу подтверждения.";return}
   const button=$("privacySubmit");button.disabled=true;
   status.textContent="Отправляем запрос...";
   try{
    const r=await fetch("/api/privacy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"request_deletion",confirmation:$("confirmation").value.trim()})});
    const body=await r.json();
    if(!r.ok)throw Error(body.error||"Не удалось отправить запрос");
    status.textContent="Запрос принят. Аккаунт и данные пока не удалены.";
    $("confirmation").value="";
    await refresh();
   }catch(err){status.textContent=err.message}
   finally{button.disabled=false}
  };
 }catch(err){status.textContent=err.message||"Ошибка при проверке данных"}
})();
