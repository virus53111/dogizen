/* MurdiliMax v4 — private member messaging, favorites, and safety controls */
(function(){
"use strict";
const I18N=window.MM_I18N.I18N;
const V=k=>(I18N[state.lang]||I18N.ru)[k]||I18N.ru[k]||k;
window.MM_v4=V;
const $=s=>document.querySelector(s);
const safe=s=>escapeHTML(s);
let chats=[],activeChat=null,loading=false;
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
async function fetchChats(){const r=await fetch("/api/chat/list");if(!r.ok)throw Error(V("error"));const d=await r.json();chats=d.chats||[];renderChats();const total=chats.reduce((a,c)=>a+Number(c.unread||0),0);const badge=$("#inboxUnreadBadge");badge.textContent=total>99?"99+":String(total);badge.classList.toggle("hidden",total<1)}
async function showInbox(wanted){
 if(!await ensureLogin({panel:"inbox"}))return;
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
 $("#chatText").disabled=blocked;$("#chatSendBtn").disabled=$("#chatText").disabled;
 $("#chatBlockBtn").disabled=blocked&&!d.blocked_by_me;
 $("#chatBlockBtn").textContent=d.blocked_by_me?V("unblock"):V("block");
 setError(blocked?V("blocked"):"");
 const c=chats.find(x=>x.id===id);if(c)c.unread=0;
 renderChats();window.mmRefreshActivity?.();
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
 setInterval(()=>{if(!document.hidden&&state.user&&$("#messagesDialog").open&&!loading)fetchChats().catch(()=>{})},30000);
}
document.addEventListener("DOMContentLoaded",bind);
})();