/* MurdiliMax v4 — private member messaging, favorites, and safety controls */
(function(){
"use strict";
const I18N=window.MM_I18N.I18N;
const V=k=>(I18N[state.lang]||I18N.ru)[k]||I18N.ru[k]||k;
window.MM_v4=V;
const $=s=>document.querySelector(s);
const safe=s=>escapeHTML(s);
let chats=[],activeChat=null,loading=false,replyTo=null,chatSeq=0,lastTyping=0,polling=false;
const chatWords={ru:['Ответить','Удалить','Прочитано','Печатает…','Сообщение удалено','Отменить ответ','Удалить сообщение у обоих участников?'],en:['Reply','Delete','Read','Typing…','Message deleted','Cancel reply','Delete this message for both participants?'],de:['Antworten','Löschen','Gelesen','Schreibt…','Nachricht gelöscht','Antwort abbrechen','Nachricht für beide löschen?'],lv:['Atbildēt','Dzēst','Izlasīts','Raksta…','Ziņa dzēsta','Atcelt atbildi','Dzēst ziņu abiem dalībniekiem?'],lt:['Atsakyti','Ištrinti','Perskaityta','Rašo…','Žinutė ištrinta','Atšaukti atsakymą','Ištrinti žinutę abiem dalyviams?'],et:['Vasta','Kustuta','Loetud','Kirjutab…','Sõnum kustutatud','Tühista vastus','Kustutada sõnum mõlemale osalejale?']};
const photoWords={"ru":["Разрешить обмен фото в этом диалоге","Отправить фото","Фото доступно после взаимного разрешения","Открыть фото","Отправляйте только разрешённые фотографии совершеннолетних. Непристойные и нежелательные фото запрещены.","Фотография"],"en":["Allow photo exchange in this chat","Send photo","Photos require mutual permission","Open photo","Only share authorized photos of adults. Unwanted or explicit images are prohibited.","Photo"],"de":["Fotoaustausch in diesem Chat erlauben","Foto senden","Fotos erfordern gegenseitige Zustimmung","Foto öffnen","Nur erlaubte Fotos Erwachsener teilen. Unerwünschte oder explizite Bilder sind verboten.","Foto"],"lv":["Atļaut foto apmaiņu šajā sarunā","Nosūtīt foto","Foto vajadzīga abu piekrišana","Atvērt foto","Kopīgo tikai atļautus pilngadīgo foto. Nevēlami un nepiedienīgi attēli aizliegti.","Foto"],"lt":["Leisti keistis nuotraukomis šiame pokalbyje","Siųsti nuotrauką","Nuotraukoms reikia abipusio leidimo","Atverti nuotrauką","Siųskite tik leistinas suaugusiųjų nuotraukas. Nepageidaujami ir nepadorūs vaizdai draudžiami.","Nuotrauka"],"et":["Luba selles vestluses fotode jagamist","Saada foto","Fotod nõuavad mõlema nõusolekut","Ava foto","Jaga ainult lubatud täiskasvanute fotosid. Soovimatud ja sündsusetud pildid on keelatud.","Foto"]};
const P=i=>(photoWords[state.lang]||photoWords.en)[i];
const W=i=>(chatWords[state.lang]||chatWords.en)[i];
function setReply(message){replyTo=message;const panel=$('#mmReplyPanel');if(panel){panel.hidden=!message;panel.querySelector('span').textContent=message?.body?.slice(0,120)||''}}
function isUUID(s){return /^[0-9a-f-]{36}$/i.test(s||"")}
function loginRedirect(params){toast(V("signin"));location.assign(loginPath(params))}
async function authUser(){try{if(window.MM_authReady)await window.MM_authReady;return (await fetch("/api/session").then(r=>r.json()))?.user||null}catch{return null}}
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
async function fetchChats(){const r=await fetch("/api/chat/list");if(!r.ok)throw Error(V("error"));const d=await r.json();chats=d.chats||[];renderChats();const total=chats.reduce((a,c)=>a+Number(c.unread||0),0);const badge=$("#inboxUnreadBadge");if(window.mmRefreshActivity)window.mmRefreshActivity();else{badge.textContent=total>99?"99+":String(total);badge.classList.toggle("hidden",total<1)}}
async function showInbox(wanted){
 if(!await ensureLogin({panel:"inbox"}))return;
 const dlg=$("#messagesDialog");if(!dlg.open)dlg.showModal();
 $("#chatEmpty").classList.toggle("hidden",!!activeChat);
 $("#chatActive").classList.toggle("hidden",!activeChat);
 try{await fetchChats();if(wanted)await selectChat(wanted);else if(activeChat)await selectChat(activeChat.id);else{$("#chatEmpty").classList.remove("hidden");$("#chatActive").classList.add("hidden")}}catch(e){$("#chatSidebar").textContent=e.message}
}
async function selectChat(id,quiet=false){
 if(!isUUID(id))return;
 const thread=chats.find(c=>c.id===id);
 if(!thread){setError(V("error"));return}
 const seq=++chatSeq,changed=activeChat?.id!==id;
 if(changed){setReply(null);if($('#mmPhotoFile')){$('#mmPhotoFile').value='';$('#mmPhotoFile').disabled=true;$('#mmPhotoSend').disabled=true;$('#mmPhotoConsent').checked=false}}
 activeChat=thread;
 renderChats();
 $("#chatEmpty").classList.add("hidden");$("#chatActive").classList.remove("hidden");
 $("#chatListingName").textContent=thread.display_name+" · "+(thread.city||"");
 if(!quiet)$("#chatMessages").innerHTML='<div class="chat-panel-empty">'+safe(t("loading"))+'</div>';
 const r=await fetch("/api/chat/messages?conversation_id="+encodeURIComponent(id));
 if(!r.ok){setError(V("error"));return}
 const d=await r.json();if(seq!==chatSeq||!$('#messagesDialog').open)return;
 activeChat={...thread,blocked:d.blocked,blocked_by_me:d.blocked_by_me};
 const list=d.messages||[];
 const pane=$("#chatMessages"),atBottom=pane.scrollHeight-pane.scrollTop-pane.clientHeight<80;
 const markup=list.length?list.map(m=>'<div class="chat-msg '+(m.mine?"mine":"")+'">'+(m.reply_preview&&!m.deleted_at?'<blockquote class="mm-chat-quote">'+safe(m.reply_preview)+'</blockquote>':'')+(m.deleted_at?'<em>'+safe(W(4))+'</em>':(m.has_photo?'<a target="_blank" rel="noopener noreferrer" href="/api/chat/photos?message_id='+encodeURIComponent(m.id)+'">'+safe(P(3))+'</a>':safe(m.body)))+'<time>'+shortDate(m.created_at)+(m.mine&&m.seen_at&&!m.deleted_at?' · '+safe(W(2)):'')+'</time>'+(!m.deleted_at?'<div class="mm-chat-actions"><button type="button" data-reply="'+safe(m.id)+'">'+safe(W(0))+'</button>'+(m.mine?'<button type="button" data-delete-message="'+safe(m.id)+'">'+safe(W(1))+'</button>':'')+'</div>':'')+'</div>').join(""):'<div class="chat-panel-empty">'+safe(V("noContent"))+'</div>';
 if(pane.innerHTML!==markup){const pos=pane.scrollTop;pane.innerHTML=markup;if(!quiet||atBottom)pane.scrollTop=pane.scrollHeight;else pane.scrollTop=pos}
 activeChat.messages=list;
 const typing=$('#mmTyping');if(typing)typing.textContent=d.typing?W(3):"";
 refreshPhotoConsent(id,seq).catch(()=>{});

 const blocked=!!d.blocked;
 $("#chatText").disabled=blocked;$("#chatSendBtn").disabled=$("#chatText").disabled;
 $("#chatBlockBtn").disabled=blocked&&!d.blocked_by_me;
 $("#chatBlockBtn").textContent=d.blocked_by_me?V("unblock"):V("block");
 setError(blocked?V("blocked"):"");
 const c=chats.find(x=>x.id===id);if(c)c.unread=0;
 renderChats();window.mmRefreshActivity?.();
}
async function refreshPhotoConsent(id,seq){
 const r=await fetch("/api/chat/photos?conversation_id="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok||seq!==chatSeq)return;
 const d=await r.json();if(seq!==chatSeq)return;
 const check=$("#mmPhotoConsent"),send=$("#mmPhotoSend"),file=$("#mmPhotoFile");
 if(!check||!send||!file)return;
 if(!check.disabled)check.checked=d.enabled===true;
 send.disabled=!d.allowed||loading;file.disabled=!d.allowed||loading;
 $("#mmPhotoStatus").textContent=d.allowed?"":P(2);
}
async function sendCurrent(e){
 e.preventDefault();if(loading||!activeChat)return;
 const body=$("#chatText").value.trim();
 if(!body||body.length>1200)return;
 const button=$("#chatSendBtn");button.disabled=true;loading=true;setError("");
 try{
  const r=await fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:activeChat.id,body,reply_to:replyTo?.id||null})});
  const d=await r.json();if(!r.ok)throw Error(d.error||V("error"));
  $("#chatText").value="";setReply(null);
  await selectChat(activeChat.id);await fetchChats();
 }catch(err){setError(err.message)}finally{button.disabled=!!activeChat?.blocked;loading=false}
}
window.mmStartChat=async function(id){
 if(!isUUID(id))return toast(V("missingProfile"));
 if(!await ensureLogin({chat:id}))return;
 
 try{
  const r=await fetch("/api/chat/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id})});
  const d=await r.json();if(!r.ok)throw Error(d.error||V("error"));
  if($("#profileModal")?.open)$("#profileModal").close();
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
 if(!user){container.innerHTML='<div class="chat-panel-empty">'+safe(V("signin"))+' <a href="'+safe(loginPath({panel:"favorites"}))+'" class="brand-pink">'+safe(t("login"))+'</a></div>';return}
 try{
  const favorites=await fetchFavorites();
  if(!favorites.length){container.innerHTML='<div class="chat-panel-empty">♡ '+safe(V("emptyFavorites"))+'</div>';return}
  container.innerHTML=favorites.map(p=>'<div class="favorite-item"><div class="favorite-thumb">'+(p.avatar_url?'<img src="'+safe(p.avatar_url)+'" alt="">':"♡")+'</div><div class="favorite-details"><strong>'+safe(p.display_name)+', '+Number(p.age)+'</strong><small>'+(FLAGS[p.country]||"")+' '+safe(p.city)+' · '+safe(window.MM_categoryLabel(p.category,state.lang))+'</small></div><div class="fav-actions"><button class="btn btn-outline" data-open="'+safe(p.id)+'">'+safe(V("openProfile"))+'</button><button class="btn btn-text" data-remove="'+safe(p.id)+'">×</button></div></div>').join("");
 }catch(e){container.textContent=e.message}
}
async function removeFavorite(id){const r=await fetch("/api/favorites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id,action:"remove"})});if(!r.ok)throw Error(V("error"));favoriteIds.delete(id);render();await showFavorites()}
function bind(){
 applyTranslations();
 $("#inboxBtn").innerHTML='✉ <span data-t="messages">'+V("messages")+'</span><b class="nav-unread hidden" id="inboxUnreadBadge">0</b>';
 for(const id of ["inboxBtn","footerInbox"])$("#"+id).onclick=()=>showInbox();
 for(const id of ["favoritesBtn","footerFavorites"])$("#"+id).onclick=showFavorites;
 $("#refreshChats").onclick=async()=>{try{await fetchChats();if(activeChat)await selectChat(activeChat.id)}catch(e){setError(e.message)}};
 $("#chatSidebar").onclick=e=>{const b=e.target.closest("[data-chat]");if(b)selectChat(b.dataset.chat)};
 $("#chatSendForm").onsubmit=sendCurrent;
 const typing=document.createElement("p");typing.id="mmTyping";typing.setAttribute("aria-live","polite");$("#chatSendForm").before(typing);
 const photos=document.createElement("div");photos.className="mm-chat-photo-controls";
 const photoLabel=document.createElement("label"),photoConsent=document.createElement("input");photoConsent.type="checkbox";photoConsent.id="mmPhotoConsent";photoLabel.append(photoConsent,document.createTextNode(" "+P(0)));
 const file=document.createElement("input");file.type="file";file.accept="image/jpeg,image/png,image/webp";file.id="mmPhotoFile";file.disabled=true;file.setAttribute("aria-label",P(5));
 const photoSend=document.createElement("button");photoSend.type="button";photoSend.id="mmPhotoSend";photoSend.className="btn btn-outline";photoSend.disabled=true;photoSend.textContent=P(1);
 const photoStatus=document.createElement("small");photoStatus.id="mmPhotoStatus";const photoWarning=document.createElement("small");photoWarning.textContent=P(4);
 photos.append(photoLabel,photoWarning,file,photoSend,photoStatus);$("#chatSendForm").after(photos);
 photoConsent.onchange=async()=>{if(!activeChat)return;const id=activeChat.id,enabled=photoConsent.checked;photoConsent.disabled=true;try{const r=await fetch("/api/chat/photos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:id,action:"consent",enabled})});if(!r.ok)throw Error(V("error"))}catch(e){setError(e.message)}finally{photoConsent.disabled=false;if(activeChat?.id===id)refreshPhotoConsent(id,chatSeq).catch(()=>{})}};
 photoSend.onclick=async()=>{if(!activeChat||loading||!file.files[0]||!confirm(P(4)))return;const id=activeChat.id;loading=true;photoSend.disabled=true;try{const body=new FormData();body.set("conversation_id",id);body.set("action","send");body.set("photo",file.files[0]);const r=await fetch("/api/chat/photos",{method:"POST",body});if(!r.ok)throw Error(V("error"));file.value="";if(activeChat?.id===id)await selectChat(id,true);await fetchChats()}catch(e){setError(e.message)}finally{loading=false;if(activeChat?.id===id)refreshPhotoConsent(id,chatSeq).catch(()=>{})}};
 const reply=document.createElement("div");reply.id="mmReplyPanel";reply.hidden=true;const preview=document.createElement("span"),cancel=document.createElement("button");cancel.type="button";cancel.textContent=W(5);cancel.onclick=()=>setReply(null);reply.append(preview,cancel);$("#chatSendForm").before(reply);
 $("#chatMessages").addEventListener("click",async e=>{
  const a=e.target.closest("[data-reply]"),b=e.target.closest("[data-delete-message]");if(!activeChat||loading)return;
  if(a&&!activeChat.blocked){const m=activeChat.messages?.find(m=>m.id===a.dataset.reply&&!m.deleted_at);if(m){setReply(m);$("#chatText").focus()}}
  if(b&&confirm(W(6))){const id=activeChat.id;try{const r=await fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:id,action:"delete",message_id:b.dataset.deleteMessage})});if(!r.ok)throw Error(V("error"));if(activeChat?.id===id)await selectChat(id,true);await fetchChats()}catch(e){setError(e.message)}}
 });
 $("#chatText").addEventListener("input",()=>{if(!activeChat||activeChat.blocked||!$("#chatText").value.trim()||Date.now()-lastTyping<4000)return;lastTyping=Date.now();fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:activeChat.id,action:"typing",active:true})}).catch(()=>{})});
 $("#chatBlockBtn").onclick=blockCurrent;
 $("#chatReportBtn").onclick=()=>$("#chatReportDialog").showModal();
 $("#chatReportForm").onsubmit=reportChat;
 $("#favoritesContent").onclick=async e=>{const opener=e.target.closest("[data-open]"),del=e.target.closest("[data-remove]");
  if(opener){$("#favoritesDialog").close();window.mmOpenProfile(opener.dataset.open);return}
  if(del){try{await removeFavorite(del.dataset.remove)}catch(e){toast(e.message)}}
 };
 $("#language").addEventListener("change",applyTranslations);
 const query = new URLSearchParams(location.search);
 initializeFavorites().catch(()=>{});
 authUser().then(user=>{
  if (!user) return;
  const chat = query.get("chat");
  if (chat && isUUID(chat)) {
   consumeReturnKey("chat");
   window.mmStartChat(chat);
  } else if (query.get("panel")==="inbox") {
   consumeReturnKey("panel");
   showInbox();
  } else {
   if (query.get("panel")==="favorites") {
    consumeReturnKey("panel");
    showFavorites();
   }
   fetchChats().catch(()=>{});
  }
 });
 setInterval(async()=>{if(document.hidden||!state.user||!$("#messagesDialog").open||loading||polling||!activeChat)return;polling=true;try{await selectChat(activeChat.id,true)}catch{}finally{polling=false}},4000);
 setInterval(()=>{if(!document.hidden&&state.user&&$("#messagesDialog").open&&!loading)fetchChats().catch(()=>{})},30000);
}
document.addEventListener("DOMContentLoaded",bind);
})();