/* MurdiliMax v4 — private member messaging, favorites, and safety controls */
(function(){
"use strict";
const I18N={
ru:{messages:"Сообщения",favorites:"Избранное",refresh:"Обновить",messageNotice:"Приватная переписка зарегистрированных пользователей. Не отправляйте предоплату незнакомым людям.",chatSelect:"Выберите беседу слева или начните её из анкеты.",complain:"Жалоба",block:"Заблокировать",unblock:"Разблокировать",sendMessage:"Отправить",chatText:"Напишите сообщение…",blocked:"Эта переписка заблокирована.",emptyChats:"У вас пока нет переписок. Откройте опубликованную анкету и нажмите «Написать».",write:"Написать",myChats:"Мои переписки",favoritesCaption:"Сохранённые анкеты доступны из аккаунта.",emptyFavorites:"Вы ещё не сохраняли анкеты.",openProfile:"Открыть",remove:"Удалить",chatReportTitle:"Пожаловаться на переписку",chatReportCaption:"Жалоба будет проверена модератором. Сообщите конкретную причину.",chatReportSent:"Жалоба отправлена модератору.",reportReason:"Причина",details:"Подробности",sendReport:"Отправить жалобу",signin:"Для этой функции войдите в аккаунт.",demoChat:"Это демонстрационная анкета — переписка недоступна.",messageSent:"Сообщение отправлено",blockConfirm:"Заблокировать переписку? В ней нельзя будет отправлять сообщения, пока вы её не разблокируете.",error:"Ошибка соединения",noContent:"Сообщений пока нет. Начните общение вежливо.",previewChat:"Личные сообщения доступны только зарегистрированным пользователям, но проверка личности и возраста ещё не подключена."},
en:{messages:"Messages",favorites:"Saved",refresh:"Refresh",messageNotice:"Private member messages. Never send advance payments to strangers.",chatSelect:"Select a chat or start one from a listing.",complain:"Report",block:"Block",unblock:"Unblock",sendMessage:"Send",chatText:"Write a message…",blocked:"This chat is blocked.",emptyChats:"No conversations yet. Open a published listing and tap Message.",write:"Message",myChats:"Conversations",favoritesCaption:"Your saved listings are stored in your account.",emptyFavorites:"No saved listings yet.",openProfile:"Open",remove:"Remove",chatReportTitle:"Report conversation",chatReportCaption:"A moderator will review your report.",chatReportSent:"Report sent to moderation.",reportReason:"Reason",details:"Details",sendReport:"Send report",signin:"Sign in to use this feature.",demoChat:"This is a fictional sample. Messaging is disabled.",messageSent:"Message sent",blockConfirm:"Block this conversation? No messages can be sent until you unblock it.",error:"Connection error",noContent:"No messages yet. Say hello!",previewChat:"Messaging is available to signed-in users only. Identity and age verification are not yet connected."},
de:{messages:"Nachrichten",favorites:"Merkliste",refresh:"Aktualisieren",messageNotice:"Private Nachrichten. Keine Vorauszahlungen an Unbekannte senden.",chatSelect:"Wähle einen Chat oder starte einen über ein Profil.",complain:"Melden",block:"Blockieren",unblock:"Entsperren",sendMessage:"Senden",chatText:"Nachricht schreiben…",blocked:"Dieser Chat ist blockiert.",emptyChats:"Noch keine Unterhaltungen.",write:"Nachricht",myChats:"Unterhaltungen",favoritesCaption:"Gespeicherte Anzeigen in deinem Konto.",emptyFavorites:"Keine gespeicherten Anzeigen.",openProfile:"Öffnen",remove:"Entfernen",chatReportTitle:"Unterhaltung melden",chatReportCaption:"Moderatoren prüfen deine Meldung.",chatReportSent:"Meldung eingereicht.",reportReason:"Grund",details:"Details",sendReport:"Meldung senden",signin:"Bitte anmelden.",demoChat:"Fiktives Demo-Profil: keine Nachrichten möglich.",messageSent:"Nachricht gesendet",blockConfirm:"Unterhaltung blockieren?",error:"Verbindungsfehler",noContent:"Noch keine Nachrichten.",previewChat:"Nachrichten nur für eingeloggte Nutzer. Identitäts- und Altersprüfung sind noch nicht verbunden."},
lv:{messages:"Ziņas",favorites:"Izlase",refresh:"Atjaunot",messageNotice:"Privātas ziņas. Nesūti avansu svešiniekiem.",chatSelect:"Izvēlies saraksti vai sāc to no sludinājuma.",complain:"Ziņot",block:"Bloķēt",unblock:"Atbloķēt",sendMessage:"Sūtīt",chatText:"Raksti ziņu…",blocked:"Sarakste ir bloķēta.",emptyChats:"Tev vēl nav sarakstu.",write:"Rakstīt",myChats:"Sarakstes",favoritesCaption:"Saglabātie sludinājumi ir tavā kontā.",emptyFavorites:"Vēl nav saglabātu sludinājumu.",openProfile:"Atvērt",remove:"Noņemt",chatReportTitle:"Ziņot par saraksti",chatReportCaption:"Moderators izskatīs ziņojumu.",chatReportSent:"Ziņojums nosūtīts.",reportReason:"Iemesls",details:"Detaļas",sendReport:"Nosūtīt ziņojumu",signin:"Lūdzu pieslēdzies.",demoChat:"Šis ir demonstrācijas profils; ziņas nav pieejamas.",messageSent:"Ziņa nosūtīta",blockConfirm:"Bloķēt saraksti?",error:"Savienojuma kļūda",noContent:"Vēl nav ziņu.",previewChat:"Ziņas tikai reģistrētiem lietotājiem. Identitātes un vecuma pārbaude vēl nav pieslēgta."}
};
const V=k=>(I18N[state.lang]||I18N.ru)[k]||I18N.ru[k]||k;
window.MM_v4=V;
const $=s=>document.querySelector(s);
const safe=s=>escapeHTML(s);
let chats=[],activeChat=null,loading=false;
function isUUID(s){return /^[0-9a-f-]{36}$/i.test(s||"")}
function loginRedirect(query){toast(V("signin"));location.href="/login?next="+encodeURIComponent("/"+(query?"?"+query:""))}
async function authUser(){try{return (await fetch("/api/session").then(r=>r.json()))?.user||null}catch{return null}}
function applyTranslations(){
 document.querySelectorAll("[data-t]").forEach(el=>{if(I18N[state.lang]?.[el.dataset.t])el.textContent=V(el.dataset.t)});
 const area=$("#chatText");if(area)area.placeholder=V("chatText");
 const btn=$("#chatBlockBtn");if(btn&&activeChat)btn.textContent=activeChat.blocked_by_me?V("unblock"):V("block");
}
function setError(s){$("#chatInfo").textContent=s||""}
async function ensureLogin(query){const user=await authUser();state.user=user;updateLogin();if(!user){loginRedirect(query);return false}return true}
function shortDate(val){try{return new Date(val).toLocaleString(state.lang,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return ""}}
function renderChats(){
 const container=$("#chatSidebar");
 if(!chats.length){container.innerHTML='<div class="chat-panel-empty">'+safe(V("emptyChats"))+'</div>';return}
 container.innerHTML=chats.map(x=>'<button type="button" class="chat-person '+(activeChat?.id===x.id?"active":"")+'" data-chat="'+safe(x.id)+'"><span class="person-icon">✉</span><span class="person-copy"><strong>'+safe(x.display_name||"")+'</strong><small>'+safe(x.last_message||x.city||"")+'</small></span>'+(x.unread?'<b class="bubble-count">'+Number(x.unread)+'</b>':"")+'</button>').join("");
}
async function fetchChats(){const r=await fetch("/api/chat/list");if(!r.ok)throw Error(V("error"));const d=await r.json();chats=d.chats||[];renderChats();const total=chats.reduce((a,c)=>a+Number(c.unread||0),0);const badge=$("#inboxUnreadBadge");badge.textContent=total>99?"99+":String(total);badge.classList.toggle("hidden",total<1)}
async function showInbox(wanted){
 if(!await ensureLogin(wanted?"chat="+encodeURIComponent(wanted):""))return;
 const dlg=$("#messagesDialog");if(!dlg.open)dlg.showModal();
 $("#chatEmpty").classList.toggle("hidden",!!activeChat);
 $("#chatActive").classList.toggle("hidden",!activeChat);
 try{await fetchChats();if(wanted)await selectChat(wanted);else if(activeChat)await selectChat(activeChat.id);else{$("#chatEmpty").classList.remove("hidden");$("#chatActive").classList.add("hidden")}}catch(e){$("#chatSidebar").textContent=e.message}
}
async function selectChat(id){
 if(!isUUID(id))return;
 const thread=chats.find(c=>c.id===id);
 if(!thread){setError(V("error"));return}
 activeChat=thread;
 renderChats();
 $("#chatEmpty").classList.add("hidden");$("#chatActive").classList.remove("hidden");
 $("#chatListingName").textContent=thread.display_name+" · "+(thread.city||"");
 $("#chatMessages").innerHTML='<div class="chat-panel-empty">'+safe(t("loading"))+'</div>';
 const r=await fetch("/api/chat/messages?conversation_id="+encodeURIComponent(id));
 if(!r.ok){setError(V("error"));return}
 const d=await r.json();
 activeChat={...thread,blocked:d.blocked,blocked_by_me:d.blocked_by_me};
 const list=d.messages||[];
 $("#chatMessages").innerHTML=list.length?list.map(m=>'<div class="chat-msg '+(m.mine?"mine":"")+'">'+safe(m.body)+'<time>'+shortDate(m.created_at)+'</time></div>').join(""):'<div class="chat-panel-empty">'+safe(V("noContent"))+'</div>';
 $("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
 const blocked=!!d.blocked;
 $("#chatText").disabled=blocked;$("#chatSendBtn").disabled=blocked;
 $("#chatBlockBtn").disabled=blocked&&!d.blocked_by_me;
 $("#chatBlockBtn").textContent=d.blocked_by_me?V("unblock"):V("block");
 setError(blocked?V("blocked"):"");
 const c=chats.find(x=>x.id===id);if(c)c.unread=0;
 renderChats();
}
async function sendCurrent(e){
 e.preventDefault();if(loading||!activeChat)return;
 const body=$("#chatText").value.trim();
 if(!body||body.length>1200)return;
 const button=$("#chatSendBtn");button.disabled=true;loading=true;setError("");
 try{
  const r=await fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:activeChat.id,body})});
  const d=await r.json();if(!r.ok)throw Error(d.error||V("error"));
  $("#chatText").value="";
  await selectChat(activeChat.id);await fetchChats();
 }catch(err){setError(err.message)}finally{button.disabled=!!activeChat?.blocked;loading=false}
}
window.mmStartChat=async function(id){
 if(!isUUID(id))return toast(V("demoChat"));
 if(!await ensureLogin("chat="+encodeURIComponent(id)))return;
 try{
  const r=await fetch("/api/chat/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id})});
  const d=await r.json();if(!r.ok)throw Error(d.error||V("error"));
  $("#profileModal")?.close();
  await showInbox();
  await selectChat(d.conversation_id);
 }catch(e){toast(e.message||V("error"))}
};
async function blockCurrent(){
 if(!activeChat)return;
 const action=activeChat.blocked_by_me?"unblock":"block";
 if(action==="block"&&!confirm(V("blockConfirm")))return;
 try{
  const r=await fetch("/api/chat/block",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:activeChat.id,action})});
  const data=await r.json();if(!r.ok)throw Error(data.error||V("error"));
  await selectChat(activeChat.id);await fetchChats();
 }catch(e){setError(e.message)}
}
async function reportChat(e){
 e.preventDefault();if(!activeChat)return;
 const body={conversation_id:activeChat.id,...Object.fromEntries(new FormData(e.target))};
 try{
  const r=await fetch("/api/chat/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(data.error||V("error"));
  $("#chatReportDialog").close();e.target.reset();toast(V("chatReportSent"));
 }catch(e){toast(e.message)}
}
async function fetchFavorites(){
 const user=await authUser();if(!user)return [];
 const r=await fetch("/api/favorites");if(!r.ok)throw Error(V("error"));
 const json=await r.json();return json.listings||[];
}
async function showFavorites(){
 const dlg=$("#favoritesDialog");if(!dlg.open)dlg.showModal();
 const container=$("#favoritesContent");container.textContent=t("loading");
 const user=await authUser();
 if(!user){container.innerHTML='<div class="chat-panel-empty">'+safe(V("signin"))+' <a href="/login?next=%2F" class="brand-pink">'+safe(t("login"))+'</a></div>';return}
 try{
  const favorites=await fetchFavorites();
  if(!favorites.length){container.innerHTML='<div class="chat-panel-empty">♡ '+safe(V("emptyFavorites"))+'</div>';return}
  container.innerHTML=favorites.map(p=>'<div class="favorite-item"><div class="favorite-thumb">'+(p.avatar_url?'<img src="'+safe(p.avatar_url)+'" alt="">':"♡")+'</div><div class="favorite-details"><strong>'+safe(p.display_name)+', '+Number(p.age)+'</strong><small>'+(FLAGS[p.country]||"")+' '+safe(p.city)+' · '+safe(window.MM_categoryLabel(p.category,state.lang))+'</small></div><div class="fav-actions"><button class="btn btn-outline" data-open="'+safe(p.id)+'">'+safe(V("openProfile"))+'</button><button class="btn btn-text" data-remove="'+safe(p.id)+'">×</button></div></div>').join("");
 }catch(e){container.textContent=e.message}
}
async function removeFavorite(id){const r=await fetch("/api/favorites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id,action:"remove"})});if(!r.ok)throw Error(V("error"));let favs=getFavs().filter(x=>x!==id);localStorage.setItem("mm-favs",JSON.stringify(favs));render();await showFavorites()}
async function hydrateSaved(){
 const user=await authUser();if(!user)return;
 try{
  const favorites=await fetchFavorites();
  const local=getFavs().filter(x=>x.startsWith("demo-"));
  localStorage.setItem("mm-favs",JSON.stringify([...new Set([...local,...favorites.map(x=>x.id)])]));render()
 }catch{}
}
function bind(){
 applyTranslations();
 $("#inboxBtn").innerHTML='✉ <span data-t="messages">'+V("messages")+'</span><b class="nav-unread hidden" id="inboxUnreadBadge">0</b>';
 for(const id of ["inboxBtn","footerInbox"])$("#"+id).onclick=()=>showInbox();
 for(const id of ["favoritesBtn","footerFavorites"])$("#"+id).onclick=showFavorites;
 $("#refreshChats").onclick=async()=>{try{await fetchChats();if(activeChat)await selectChat(activeChat.id)}catch(e){setError(e.message)}};
 $("#chatSidebar").onclick=e=>{const b=e.target.closest("[data-chat]");if(b)selectChat(b.dataset.chat)};
 $("#chatSendForm").onsubmit=sendCurrent;
 $("#chatBlockBtn").onclick=blockCurrent;
 $("#chatReportBtn").onclick=()=>$("#chatReportDialog").showModal();
 $("#chatReportForm").onsubmit=reportChat;
 $("#favoritesContent").onclick=async e=>{const opener=e.target.closest("[data-open]"),del=e.target.closest("[data-remove]");
  if(opener){$("#favoritesDialog").close();window.mmOpenProfile(opener.dataset.open);return}
  if(del){try{await removeFavorite(del.dataset.remove)}catch(e){toast(e.message)}}
 };
 $("#language").addEventListener("change",applyTranslations);
 const chatId=new URLSearchParams(location.search).get("chat");
 if(chatId&&isUUID(chatId)){history.replaceState({}, "", "/");window.mmStartChat(chatId)}
 else{hydrateSaved();authUser().then(u=>{if(u)fetchChats().catch(()=>{})})}
}
document.addEventListener("DOMContentLoaded",bind);
})();