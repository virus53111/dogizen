/* MurdiliMax v4 — private member messaging, favorites, and safety controls */
(function(){
"use strict";
const I18N=window.MM_I18N.I18N;
const V=k=>(I18N[state.lang]||I18N.ru)[k]||I18N.ru[k]||k;
window.MM_v4=V;
const $=s=>document.querySelector(s);
const safe=s=>escapeHTML(s);
let reportedPhoto=null;
let chats=[],activeChat=null,loading=false,replyTo=null,chatSeq=0,lastTyping=0,polling=false;
const chatWords={ru:['Ответить','Удалить','Прочитано','Печатает…','Сообщение удалено','Отменить ответ','Удалить сообщение у обоих участников?'],en:['Reply','Delete','Read','Typing…','Message deleted','Cancel reply','Delete this message for both participants?'],de:['Antworten','Löschen','Gelesen','Schreibt…','Nachricht gelöscht','Antwort abbrechen','Nachricht für beide löschen?'],lv:['Atbildēt','Dzēst','Izlasīts','Raksta…','Ziņa dzēsta','Atcelt atbildi','Dzēst ziņu abiem dalībniekiem?'],lt:['Atsakyti','Ištrinti','Perskaityta','Rašo…','Žinutė ištrinta','Atšaukti atsakymą','Ištrinti žinutę abiem dalyviams?'],et:['Vasta','Kustuta','Loetud','Kirjutab…','Sõnum kustutatud','Tühista vastus','Kustutada sõnum mõlemale osalejale?']};
const photoWords={"ru":["Разрешить обмен фото в этом диалоге","Отправить фото","Фото доступно после взаимного разрешения","Открыть фото","Отправляйте только разрешённые фотографии совершеннолетних. Непристойные и нежелательные фото запрещены.","Фотография"],"en":["Allow photo exchange in this chat","Send photo","Photos require mutual permission","Open photo","Only share authorized photos of adults. Unwanted or explicit images are prohibited.","Photo"],"de":["Fotoaustausch in diesem Chat erlauben","Foto senden","Fotos erfordern gegenseitige Zustimmung","Foto öffnen","Nur erlaubte Fotos Erwachsener teilen. Unerwünschte oder explizite Bilder sind verboten.","Foto"],"lv":["Atļaut foto apmaiņu šajā sarunā","Nosūtīt foto","Foto vajadzīga abu piekrišana","Atvērt foto","Kopīgo tikai atļautus pilngadīgo foto. Nevēlami un nepiedienīgi attēli aizliegti.","Foto"],"lt":["Leisti keistis nuotraukomis šiame pokalbyje","Siųsti nuotrauką","Nuotraukoms reikia abipusio leidimo","Atverti nuotrauką","Siųskite tik leistinas suaugusiųjų nuotraukas. Nepageidaujami ir nepadorūs vaizdai draudžiami.","Nuotrauka"],"et":["Luba selles vestluses fotode jagamist","Saada foto","Fotod nõuavad mõlema nõusolekut","Ava foto","Jaga ainult lubatud täiskasvanute fotosid. Soovimatud ja sündsusetud pildid on keelatud.","Foto"]};
const mobileWords={"ru":["Диалоги","Прикрепить фото","Выберите фото JPG, PNG или WebP до 4 МБ","Предпросмотр фото","Подпись (необязательно)","Закрыть","Ожидаем разрешения собеседника","Включите обмен фото у обоих участников","Фото недоступно","Выбрать другое фото"],"en":["Chats","Attach photo","Choose JPG, PNG or WebP up to 4 MB","Photo preview","Caption (optional)","Close","Waiting for the other member's permission","Both members must allow photos","Photo unavailable","Choose another photo"],"de":["Chats","Foto anhängen","JPG, PNG oder WebP bis 4 MB auswählen","Fotovorschau","Bildunterschrift (optional)","Schließen","Warte auf Zustimmung des anderen Mitglieds","Beide Mitglieder müssen Fotos erlauben","Foto nicht verfügbar","Anderes Foto wählen"],"lv":["Sarunas","Pievienot foto","Izvēlies JPG, PNG vai WebP līdz 4 MB","Foto priekšskatījums","Paraksts (neobligāts)","Aizvērt","Gaida otra dalībnieka atļauju","Abiem dalībniekiem jāatļauj foto","Foto nav pieejams","Izvēlēties citu foto"],"lt":["Pokalbiai","Pridėti nuotrauką","Pasirinkite JPG, PNG arba WebP iki 4 MB","Nuotraukos peržiūra","Antraštė (neprivaloma)","Uždaryti","Laukiama kito nario leidimo","Abu nariai turi leisti nuotraukas","Nuotrauka nepasiekiama","Pasirinkti kitą nuotrauką"],"et":["Vestlused","Lisa foto","Vali JPG, PNG või WebP kuni 4 MB","Foto eelvaade","Pealkiri (valikuline)","Sulge","Ootab teise liikme luba","Mõlemad liikmed peavad fotosid lubama","Foto pole saadaval","Vali teine foto"]};
const M=i=>(mobileWords[state.lang]||mobileWords.en)[i];
let photoAllowed=false,previewUrl=null,previewChat=null,viewedPhoto=null,consentRequest=0;
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
 container.innerHTML=chats.map(x=>'<button type="button" class="chat-person '+(activeChat?.id===x.id?"active":"")+'" data-chat="'+safe(x.id)+'"><span class="person-icon">✉</span><span class="person-copy"><strong>'+safe(x.display_name||"")+'</strong><small>'+safe(x.last_message==='[photo]'?P(5):x.last_message||x.city||"")+'</small></span>'+(x.unread?'<b class="bubble-count">'+Number(x.unread)+'</b>':"")+'</button>').join("");
}
async function fetchChats(){const r=await fetch("/api/chat/list");if(!r.ok)throw Error(V("error"));const d=await r.json();chats=d.chats||[];renderChats();const total=chats.reduce((a,c)=>a+Number(c.unread||0),0);const badge=$("#inboxUnreadBadge");if(window.mmRefreshActivity)window.mmRefreshActivity();else{badge.textContent=total>99?"99+":String(total);badge.classList.toggle("hidden",total<1)}}
async function showInbox(wanted){
 if(!await ensureLogin({panel:"inbox"}))return;
 const dlg=$("#messagesDialog");if(!dlg.open)dlg.showModal();
 dlg.classList.remove('mm-chat-open');
 $("#chatEmpty").classList.toggle("hidden",!!activeChat);
 $("#chatActive").classList.toggle("hidden",!activeChat);
 try{await fetchChats();if(wanted)await selectChat(wanted);else if(activeChat)await selectChat(activeChat.id,true);else{$("#chatEmpty").classList.remove("hidden");$("#chatActive").classList.add("hidden")}}catch(e){$("#chatSidebar").textContent=e.message}
}
async function selectChat(id,quiet=false){
 if(!isUUID(id))return;
 const thread=chats.find(c=>c.id===id);
 if(!thread){setError(V("error"));return}
 const seq=++chatSeq,changed=activeChat?.id!==id;
 if(changed){setReply(null);closePhotoDialogs();photoAllowed=false;$('#mmPhotoConsent').checked=false;$('#mmPhotoConsent').disabled=true;$('#mmAttachPhoto').disabled=true;$('#mmPhotoStatus').textContent='';}
 if(!quiet)$('#messagesDialog').classList.add('mm-chat-open');
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
 const markup=list.length?list.map(m=>'<div class="chat-msg '+(m.mine?"mine":"")+'">'+(m.reply_preview&&!m.deleted_at?'<blockquote class="mm-chat-quote">'+safe(m.reply_preview)+'</blockquote>':'')+(m.deleted_at?'<em>'+safe(W(4))+'</em>':(m.has_photo?'<button class="mm-open-photo" type="button" data-open-photo="'+safe(m.id)+'">▧ '+safe(P(3))+'</button>'+(m.photo_caption?'<div class="mm-photo-caption">'+safe(m.photo_caption)+'</div>':"")+(!m.mine?'<button class="btn btn-text" type="button" data-report-photo="'+safe(m.id)+'">'+safe(V("complain"))+'</button>':""):safe(m.body)))+'<time>'+shortDate(m.created_at)+(m.mine&&m.seen_at&&!m.deleted_at?' · '+safe(W(2)):'')+'</time>'+(!m.deleted_at?'<div class="mm-chat-actions"><button type="button" data-reply="'+safe(m.id)+'">'+safe(W(0))+'</button>'+(m.mine?'<button type="button" data-delete-message="'+safe(m.id)+'">'+safe(W(1))+'</button>':'')+'</div>':'')+'</div>').join(""):'<div class="chat-panel-empty">'+safe(V("noContent"))+'</div>';
 if(pane.innerHTML!==markup){const pos=pane.scrollTop;pane.innerHTML=markup;if(!quiet||atBottom)pane.scrollTop=pane.scrollHeight;else pane.scrollTop=pos}
 activeChat.messages=list;
 if(viewedPhoto&&!list.some(m=>m.id===viewedPhoto&&m.has_photo&&!m.deleted_at))$('#mmPhotoViewer')?.close();
 const typing=$('#mmTyping');if(typing)typing.textContent=d.typing?W(3):"";
 refreshPhotoConsent(id,seq).catch(()=>{});

 const blocked=!!d.blocked;
 $("#chatText").disabled=blocked;$("#chatSendBtn").disabled=$("#chatText").disabled;
 $("#chatBlockBtn").disabled=blocked&&!d.blocked_by_me;
 $("#chatBlockBtn").textContent=d.blocked_by_me?V("unblock"):V("block");
 if(blocked)setError(V("blocked"));else if(!quiet)setError("");
 const c=chats.find(x=>x.id===id);if(c)c.unread=0;
 renderChats();window.mmRefreshActivity?.();
}
function closePhotoDialogs(){
 for(const id of ['mmPhotoPreview','mmPhotoViewer']){const d=$('#'+id);if(d?.open)d.close()}
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
 previewChat=null;viewedPhoto=null;
 const file=$('#mmPhotoFile');if(file)file.value='';
}
async function refreshPhotoConsent(id,seq){
 const ticket=++consentRequest;
 const r=await fetch("/api/chat/photos?conversation_id="+encodeURIComponent(id),{cache:"no-store"});
 if(!r.ok||seq!==chatSeq||ticket!==consentRequest)return;
 const d=await r.json();if(seq!==chatSeq||ticket!==consentRequest||activeChat?.id!==id)return;
 const check=$("#mmPhotoConsent"),send=$("#mmPhotoSend"),attach=$("#mmAttachPhoto");
 if(!check||!send||!attach)return;
 photoAllowed=d.allowed===true&&!activeChat.blocked;
 if(!check.dataset.saving){check.checked=d.enabled===true;check.disabled=!!activeChat.blocked}
 send.disabled=!photoAllowed||loading;attach.disabled=!!activeChat.blocked||loading;
 $("#mmPhotoStatus").textContent=photoAllowed?"":(d.enabled?M(6):M(7));
 if(!photoAllowed&&$('#mmPhotoViewer')?.open)$('#mmPhotoViewer').close();
 if(!photoAllowed&&$('#mmPhotoPreview')?.open)$('#mmPhotoPreviewError').textContent=P(2);
}
function showPhoto(id){
 if(!activeChat||!photoAllowed){setError(P(2));return}
 const viewer=$('#mmPhotoViewer'),img=$('#mmViewerImage');viewedPhoto=id;
 $('#mmViewerError').textContent='';img.hidden=false;
 img.src='/api/chat/photos?message_id='+encodeURIComponent(id);
 if(!viewer.open)viewer.showModal();
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
 const body={conversation_id:activeChat.id,...Object.fromEntries(new FormData(e.target)),...(reportedPhoto?{message_id:reportedPhoto}:{})};
 try{
  const r=await fetch("/api/chat/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(data.error||V("error"));
  $("#chatReportDialog").close();reportedPhoto=null;e.target.reset();toast(V("chatReportSent"));
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
 const make=(tag,txt,id)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(id)n.id=id;return n};
 const button=(txt,id,fn)=>{const b=make('button',txt,id);b.type='button';b.className='btn btn-outline';b.onclick=fn;return b};
 const inbox=$('#messagesDialog'),back=button('‹ '+M(0),'mmChatBack',()=>{inbox.classList.remove('mm-chat-open');closePhotoDialogs();chatSeq++;activeChat=null;renderChats();$('#chatActive').classList.add('hidden');$('#chatEmpty').classList.remove('hidden');$('#chatSidebar').querySelector('button')?.focus()});$('.chat-top').prepend(back);
 const photos=make('div',null,'mmPhotoControls');photos.className='mm-photo-permission';
 const photoLabel=make('label'),photoConsent=make('input',null,'mmPhotoConsent');photoConsent.type='checkbox';photoConsent.disabled=true;photoLabel.append(photoConsent,document.createTextNode(' '+P(0)));
 const photoStatus=make('small',null,'mmPhotoStatus');photoStatus.setAttribute('role','status');photos.append(photoLabel,photoStatus);$('.chat-top').after(photos);
 const file=make('input',null,'mmPhotoFile');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.hidden=true;file.setAttribute('aria-label',M(1));
 const attach=button('📎','mmAttachPhoto',()=>{if(!activeChat||loading)return;if(!photoAllowed){setError(photoConsent.checked?M(6):M(7));photoConsent.focus();return}file.click()});attach.setAttribute('aria-label',M(1));attach.title=M(1);attach.disabled=true;
 $('#chatSendForm').prepend(attach,file);
 const previewDialog=make('dialog',null,'mmPhotoPreview');previewDialog.className='mm-photo-preview-dialog';previewDialog.setAttribute('aria-label',M(3));
 const head=make('header');head.append(make('h2',M(3)),button('×','mmPreviewClose',()=>{if(!loading)previewDialog.close()}));head.lastChild.setAttribute('aria-label',M(5));
 const image=make('img',null,'mmPreviewImage');image.alt=M(3);
 const captionLabel=make('label',M(4)),caption=make('textarea',null,'mmPhotoCaption');caption.maxLength=500;caption.rows=2;caption.placeholder=M(4);captionLabel.append(caption);
 const warning=make('small',P(4)),err=make('p',null,'mmPhotoPreviewError');err.setAttribute('role','alert');
 const send=button(P(1),'mmPhotoSend',()=>sendPhoto());send.className='btn btn-primary';
 const choose=button(M(9),'mmChoosePhoto',()=>file.click());
 const controls=make('div');controls.className='mm-preview-actions';controls.append(choose,send);
 previewDialog.append(head,image,captionLabel,warning,err,controls);document.body.append(previewDialog);
 const viewer=make('dialog',null,'mmPhotoViewer');viewer.className='mm-photo-viewer';viewer.setAttribute('aria-label',P(5));const viewerImg=make('img',null,'mmViewerImage');viewerImg.alt=P(5);
 const viewerError=make('p',null,'mmViewerError');viewerError.setAttribute('role','status');
 const close=button('×','mmViewerClose',()=>viewer.close());close.setAttribute('aria-label',M(5));viewer.append(close,viewerImg,viewerError);document.body.append(viewer);
 viewerImg.onerror=()=>{viewerImg.hidden=true;viewerError.textContent=M(8)};
 viewer.addEventListener('close',()=>{viewerImg.removeAttribute('src');viewedPhoto=null});
 previewDialog.addEventListener('cancel',e=>{if(loading)e.preventDefault()});
 previewDialog.addEventListener('close',()=>{if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}image.removeAttribute('src');file.value='';caption.value='';previewChat=null;err.textContent=''});
 file.onchange=()=>{
  const chosen=file.files[0];if(!chosen||!activeChat||!photoAllowed)return;
  if(!['image/jpeg','image/png','image/webp'].includes(chosen.type)||chosen.size>4*1024*1024||chosen.size===0){file.value='';if(previewDialog.open)err.textContent=M(2);else setError(M(2));return}
  if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(chosen);previewChat=activeChat.id;image.src=previewUrl;err.textContent='';send.disabled=false;
  if(!previewDialog.open){caption.value='';previewDialog.showModal()}
 };
 photoConsent.onchange=async()=>{
  if(!activeChat)return;const id=activeChat.id,enabled=photoConsent.checked;photoConsent.dataset.saving='1';photoConsent.disabled=true;photoAllowed=false;send.disabled=true;consentRequest++;
  if(!enabled&&viewer.open)viewer.close();
  try{const r=await fetch('/api/chat/photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:id,action:'consent',enabled})});if(!r.ok)throw Error(V('error'))}catch(e){setError(e.message)}finally{delete photoConsent.dataset.saving;if(activeChat?.id===id)refreshPhotoConsent(id,chatSeq).catch(()=>{})}
 };
 async function sendPhoto(){
  if(!activeChat||activeChat.id!==previewChat||loading||!photoAllowed||!file.files[0])return;
  const id=activeChat.id;loading=true;send.disabled=true;choose.disabled=true;$('#mmPreviewClose').disabled=true;err.textContent='';
  try{const body=new FormData();body.set('conversation_id',id);body.set('action','send');body.set('photo',file.files[0]);body.set('caption',caption.value.trim());
   const r=await fetch('/api/chat/photos',{method:'POST',body});if(!r.ok)throw Error(r.status===403?P(2):V('error'));
   previewDialog.close();if(activeChat?.id===id)await selectChat(id,true);await fetchChats();
  }catch(e){err.textContent=e.message}finally{loading=false;choose.disabled=false;$('#mmPreviewClose').disabled=false;if(activeChat?.id===id)refreshPhotoConsent(id,chatSeq).catch(()=>{})}
 }
 inbox.addEventListener('close',()=>{chatSeq++;closePhotoDialogs();inbox.classList.remove('mm-chat-open')});
 const resize=()=>{const v=window.visualViewport;inbox.style.setProperty('--mm-chat-height',Math.floor(v?.height||window.innerHeight)+'px');inbox.style.setProperty('--mm-chat-top',Math.floor(v?.offsetTop||0)+'px')};resize();window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize);
 const reply=document.createElement("div");reply.id="mmReplyPanel";reply.hidden=true;const preview=document.createElement("span"),cancel=document.createElement("button");cancel.type="button";cancel.textContent=W(5);cancel.onclick=()=>setReply(null);reply.append(preview,cancel);$("#chatSendForm").before(reply);
 $("#chatMessages").addEventListener("click",async e=>{
  const a=e.target.closest("[data-reply]"),b=e.target.closest("[data-delete-message]"),report=e.target.closest("[data-report-photo]"),open=e.target.closest("[data-open-photo]");if(!activeChat||loading)return;
  if(open){showPhoto(open.dataset.openPhoto);return}
  if(report){reportedPhoto=report.dataset.reportPhoto;$("#chatReportDialog").showModal();return}
  if(a&&!activeChat.blocked){const m=activeChat.messages?.find(m=>m.id===a.dataset.reply&&!m.deleted_at);if(m){setReply(m);$("#chatText").focus()}}
  if(b&&confirm(W(6))){const id=activeChat.id;try{const r=await fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:id,action:"delete",message_id:b.dataset.deleteMessage})});if(!r.ok)throw Error(V("error"));if(activeChat?.id===id)await selectChat(id,true);await fetchChats()}catch(e){setError(e.message)}}
 });
 $("#chatText").addEventListener("input",()=>{if(!activeChat||activeChat.blocked||!$("#chatText").value.trim()||Date.now()-lastTyping<4000)return;lastTyping=Date.now();fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:activeChat.id,action:"typing",active:true})}).catch(()=>{})});
 $("#chatBlockBtn").onclick=blockCurrent;
 $("#chatReportBtn").onclick=()=>{reportedPhoto=null;$("#chatReportDialog").showModal()};
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