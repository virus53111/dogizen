(()=>{
 const root=document.getElementById('telegramContentPanel');if(!root)return;
 const status=root.querySelector('#telegramContentStatus'),history=root.querySelector('#telegramContentHistory');
 const labels={claimed:'Зарезервировано',sent:'Отправлено',failed:'Ошибка Telegram',uncertain:'Доставка не подтверждена'};
 async function load(){
  try{
   const r=await fetch('/api/admin/telegram-content',{cache:'no-store'});if(!r.ok)throw Error();
   const d=await r.json();
   status.textContent=d.enabled?'Публикации включены. Права бота подтверждаются при отправке.':d.requested?'Не задан корректный токен бота.':'Публикации выключены. Требуется настройка на сервере.';
   history.replaceChildren();
   for(const item of d.history){const p=document.createElement('p');p.textContent=item.day+' · '+item.content_key+' · '+(labels[item.status]||'Неизвестно');history.append(p)}
  }catch{status.textContent='Не удалось получить статус. Требуется доступ владельца.'}
 }
 root.querySelector('#telegramContentRefresh').onclick=load;
 Promise.resolve(window.MM_authReady).then(load,load);
})();
