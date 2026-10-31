/* Murdilimax Mobile: local-only profile metadata, no identity or antidetect claims. */
(()=>{'use strict';
 const KEY='murdilimax.mobile.profiles.v1';
 const $=id=>document.getElementById(id);
 const profileList=$('profiles'),count=$('profile-count'),search=$('search'),modal=$('profile-dialog'),form=$('profile-form');
 const input={name:$('profile-name'),group:$('profile-group'),url:$('profile-url'),notes:$('profile-notes')};
 let editing=null,deferredInstall=null,profiles=[],storageReady=true;
 const uuid=()=> (crypto.randomUUID ? crypto.randomUUID(): 'profile-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 function toast(message){const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{t.hidden=true},3100)}
 function getProfiles(){try {const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(data))throw Error('Invalid storage');return data.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').slice(0,500)}catch(e){storageReady=false;toast('Хранилище телефона недоступно: изменения не сохраняются');return []}}
 function save(){if(!storageReady){toast('Данные сохраняются только до закрытия страницы');return}try{localStorage.setItem(KEY,JSON.stringify(profiles))}catch(e){storageReady=false;toast('Не удалось сохранить данные: проверьте свободную память')}}
 function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n}
 function validUrl(v){if(!v)return '';try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return null;return u.href}catch(e){return null}}
 function createButton(label,cls,action){const b=node('button',cls,label);b.type='button';b.addEventListener('click',action);return b}
 function render(){
  count.textContent=String(profiles.length);profileList.replaceChildren();
  const needle=search.value.trim().toLowerCase();
  const matches=profiles.filter(p=>[p.name,p.group,p.notes].join(' ').toLowerCase().includes(needle));
  if(!matches.length){const empty=node('div','empty');empty.append(node('b','',needle?'Ничего не найдено':'Здесь будут ваши профили'),node('p','',needle?'Измените запрос для поиска.':'Создайте первый локальный профиль и добавьте к нему заметки.'));profileList.append(empty);return}
  for(const p of matches){
   const card=node('article','profile'),top=node('div','profile-top'),avatar=node('span','avatar',p.name.trim().charAt(0).toUpperCase()||'M'),info=node('div','profile-info'),label=node('b','',p.name),group=node('small','',p.group||'Без группы');
   info.append(label,group);top.append(avatar,info);card.append(top);
   if(p.notes)card.append(node('p','profile-note',p.notes.slice(0,150)));
   const bar=node('div','actions');
   bar.append(createButton('Изменить','',()=>openEditor(p)),createButton('Удалить','danger',()=>{
    if(!confirm('Удалить профиль «'+p.name+'» с этого телефона?'))return;
    profiles=profiles.filter(x=>x.id!==p.id);save();render();toast('Профиль удалён');
   }));
   const open=createButton('Открыть сайт ↗','open',()=>{
    const u=validUrl(p.url||'');
    if(!u){toast('Укажите адрес https:// в настройках профиля');return}
    // External browser = a regular browser; no fabricated isolation.
    window.open(u,'_blank','noopener,noreferrer');
   });open.disabled=!p.url;open.title='Откроется обычный браузер телефона без антидетект-изоляции';bar.append(open);card.append(bar);profileList.append(card);
  }
 }
 function openEditor(p){editing=p?p.id:null;$('dialog-title').textContent=p?'Редактировать профиль':'Новый профиль';input.name.value=p?.name||'';input.group.value=p?.group||'';input.url.value=p?.url||'';input.notes.value=p?.notes||'';modal.showModal();input.name.focus()}
 $('new-profile').addEventListener('click',()=>openEditor(null));
 $('cancel-dialog').addEventListener('click',()=>modal.close());$('close-form').addEventListener('click',()=>modal.close());
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const name=input.name.value.trim(),group=input.group.value.trim(),notes=input.notes.value.trim();
  const url=validUrl(input.url.value.trim());
  if(!name){input.name.focus();return}
  if(url===null){toast('Укажите http:// или https:// без логина и пароля');input.url.focus();return}
  const now=new Date().toISOString();
  if(editing){const index=profiles.findIndex(p=>p.id===editing);if(index<0)return;profiles[index]={...profiles[index],name,group,notes,url,updated:now}}
  else if(profiles.length>=500){toast('Лимит локального хранилища: 500 профилей');return}
  else profiles.unshift({id:uuid(),name,group,notes,url,created:now,updated:now});
  save();render();modal.close();toast('Профиль сохранён');
 });
 search.addEventListener('input',render);
 $('export-button').addEventListener('click',()=>{
  if(!profiles.length){toast('Нет профилей для экспорта');return}
  // No secrets or cookies stored in mobile app.
  const json=JSON.stringify({format:'murdilimax-mobile-metadata',version:1,exported:new Date().toISOString(),profiles:profiles.map(({id,name,group,notes,url,created,updated})=>({id,name,group,notes,url,created,updated}))},null,2);
  const file=new Blob([json],{type:'application/json'});
  const href=URL.createObjectURL(file);const a=document.createElement('a');a.href=href;a.download='murdilimax-mobile-profiles.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1500);toast('Экспорт JSON подготовлен');
 });
 $('theme-info').addEventListener('click',()=>$('info-dialog').showModal());$('close-info').addEventListener('click',()=>$('info-dialog').close());$('info-done').addEventListener('click',()=>$('info-dialog').close());
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;$('install-app').textContent='↧ Установить на телефон'});
 $('install-app').addEventListener('click',async()=>{
  if(deferredInstall){deferredInstall.prompt();const choice=await deferredInstall.userChoice;deferredInstall=null;if(choice?.outcome==='accepted')toast('Установка запрошена');return}
  $('info-dialog').showModal();
 });
 window.addEventListener('appinstalled',()=>toast('Murdilimax добавлен на экран телефона'));
 if('serviceWorker' in navigator && window.isSecureContext)window.addEventListener('load',()=>navigator.serviceWorker.register('/mobile/sw.js',{scope:'/mobile/'}).catch(()=>{}));
 profiles=getProfiles();render();
})();