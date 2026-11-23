"use strict";
(async()=>{
  const $=q=>document.querySelector(q);
  const box=$("#message");
  const params=new URLSearchParams(location.hash.replace(/^#/,""));
  const fromLink=params.get("token");
  if(fromLink && /^[A-Za-z0-9_-]{43}$/.test(fromLink))sessionStorage.setItem("mm-claim-invite",fromLink);
  // Keep bearer tokens out of browsing history and referrer headers.
  if(location.hash)history.replaceState(null,"",location.pathname);
  const token=sessionStorage.getItem("mm-claim-invite");
  if(!token){box.textContent="Приглашение отсутствует или повреждено. Запроси новую ссылку у администратора.";return}
  try{
    if(window.MM_authReady)await window.MM_authReady;
    const response=await fetch("/api/session",{cache:"no-store"});
    const data=await response.json();
    if(!data.user){$("#loginRequired").hidden=false;box.textContent="Войди с тем email, на который выдана ссылка.";return}
    $("#claimForm").hidden=false;
    box.textContent="Вошли как "+data.user.email+". Проверь свой email и подтверди данные.";
  }catch{box.textContent="Не удалось проверить вход. Обнови страницу."}
  $("#claimForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=$("#claimSubmit");
    if(!e.currentTarget.reportValidity())return;
    btn.disabled=true;box.textContent="Подтверждаем анкету...";
    try{
      const response=await fetch("/api/claim",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token,adultConfirmed:$("#adult").checked,consentConfirmed:$("#consent").checked})
      });
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Не удалось подтвердить анкету");
      sessionStorage.removeItem("mm-claim-invite");
      $("#claimForm").hidden=true;
      box.textContent=data.listing?.status==="approved"?"Анкета закреплена за твоим аккаунтом. Теперь посетители смогут написать тебе.":"Анкета закреплена за твоим аккаунтом и ожидает проверки администратора.";
      const link=document.createElement("a");
      link.href="/?panel=mine";
      link.textContent="Перейти к своим анкетам";
      box.append(" ",link);
    }catch(error){box.textContent=error.message;btn.disabled=false}
  });
})();