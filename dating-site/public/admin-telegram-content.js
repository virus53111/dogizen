(()=>{
 const root=document.getElementById('telegramContentPanel');if(!root)return;
 const status=root.querySelector('#telegramContentStatus'),history=root.querySelector('#telegramContentHistory');
 const labels={claimed:'Зарезервировано',sent:'Отправлено',failed:'Ошибка Telegram',uncertain:'Доставка не подтверждена'};
 const messages={ready:'Бот проверен. Автопубликации включены.',disabled:'Автопубликации выключены.',token_required:'На сервере нет токена бота. Введите его ниже.',invalid_token:'Проверьте формат токена.',wrong_bot:'Токен не принадлежит @MurdiliMaxLoginBot или недействителен.',channel_unavailable:'Боту недоступен канал @SinfulLiness.',permission_required:'Разрешите боту публиковать сообщения в канале.',secure_storage_unavailable:'Защищённое хранилище не настроено. Нужна настройка на сервере.',telegram_unavailable:'Telegram временно недоступен.',configuration_failed:'Не удалось сохранить настройки.',forbidden:'Требуется доступ владельца.'};
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;return n};
 const form=el('form');form.autocomplete='off';form.hidden=true;
 const label=el('label','Токен @MurdiliMaxLoginBot (только если отсутствует на сервере)');
 const input=el('input');input.type='password';input.autocomplete='off';input.spellcheck=false;input.maxLength=121;input.style.width='100%';label.append(input);
 const note=el('p','Токен можно получить в @BotFather. Вводите его только здесь, не отправляйте в чат.');label.append(note);
 const enable=el('button','Проверить бота и включить');enable.type='submit';enable.className='btn btn-primary';
 const disable=el('button','Выключить');disable.type='button';disable.className='btn btn-outline';
 const feedback=el('p');feedback.setAttribute('role','status');
 form.append(label,enable,disable,feedback);status.after(form);
 let busy=false;
 async function load(){
  try{
   const r=await fetch('/api/admin/telegram-content',{cache:'no-store'});if(!r.ok)throw Error();
   const d=await r.json();
   status.textContent=d.enabled?'Автопубликации включены: ежедневно в 18:00 по Риге.':d.credentialAvailable?'Токен доступен. Нажмите «Проверить бота и включить».':d.canSaveToken?'Публикации выключены. Нужен токен бота.':'Публикации выключены. На сервере отсутствует защищённая конфигурация.';
   form.hidden=false;label.hidden=!!d.credentialAvailable||!d.canSaveToken;input.required=!label.hidden;
   enable.disabled=busy||d.enabled||(!d.credentialAvailable&&!d.canSaveToken);disable.disabled=busy||!d.requested;
   history.replaceChildren();
   for(const item of d.history){const p=el('p',item.day+' · '+item.content_key+' · '+(labels[item.status]||'Неизвестно'));history.append(p)}
  }catch{form.hidden=true;status.textContent='Не удалось получить статус. Требуется доступ владельца.'}
 }
 async function save(enabled){
  if(busy)return;busy=true;enable.disabled=true;disable.disabled=true;
  const token=enabled&&!label.hidden?input.value.trim():'';
  input.value='';
  try{
   const r=await fetch('/api/admin/telegram-content',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({enabled,...(token?{token}:{})})});
   const d=await r.json();feedback.textContent=messages[d.result||d.error]||'Не удалось сохранить настройки.';
  }catch{feedback.textContent='Не удалось связаться с сервером.'}
  finally{busy=false;await load()}
 }
 form.addEventListener('submit',e=>{e.preventDefault();void save(true)});disable.onclick=()=>void save(false);
 root.querySelector('#telegramContentRefresh').onclick=load;
 Promise.resolve(window.MM_authReady).then(load,load);
})();
