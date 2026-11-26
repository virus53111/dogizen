(function(){
"use strict";
window.MM_pointsLabels={"ru":{"top":"MurdiliMax TOP 20","leaders":"Лидеры по балансу MP","all":"Показать остальных","empty":"Пока нет участников, открывших свой баланс.","mine":"Мои поинты","visibility":"Показывать мои MP другим","privacy":"Включите, чтобы ваш баланс был виден в анкете, каталоге и TOP 20. По умолчанию скрыт. Режим невидимки также скрывает MP.","saved":"Настройка сохранена","gift":"🎁 Подарить MP","amount":"Количество MP","send":"Отправить","cancel":"Отмена","balance":"Доступно","confirm":"Отправить","success":"Подарок отправлен","failed":"Не удалось отправить. Проверьте баланс и повторите.","unavailable":"Нельзя отправить MP этому профилю.","login":"Войдите, чтобы подарить MP","loading":"Загрузка…"},"en":{"top":"MurdiliMax TOP 20","leaders":"MP balance leaders","all":"Show more","empty":"No members have made their balance public yet.","mine":"My points","visibility":"Show my MP to others","privacy":"Enable to show your balance on your profile, catalog and TOP 20. Private by default. Incognito also hides MP.","saved":"Setting saved","gift":"🎁 Gift MP","amount":"Amount of MP","send":"Send","cancel":"Cancel","balance":"Available","confirm":"Send","success":"Gift sent","failed":"Could not send. Check your balance and try again.","unavailable":"MP cannot be sent to this profile.","login":"Sign in to gift MP","loading":"Loading…"},"de":{"top":"MurdiliMax TOP 20","leaders":"MP-Rangliste","all":"Weitere anzeigen","empty":"Noch keine öffentlichen MP-Guthaben.","mine":"Meine Punkte","visibility":"Meine MP öffentlich anzeigen","privacy":"Guthaben im Profil, Katalog und TOP 20 anzeigen. Standardmäßig privat. Inkognito verbirgt MP ebenfalls.","saved":"Gespeichert","gift":"🎁 MP verschenken","amount":"Anzahl MP","send":"Senden","cancel":"Abbrechen","balance":"Verfügbar","confirm":"Senden","success":"Geschenk gesendet","failed":"Senden fehlgeschlagen. Guthaben prüfen.","unavailable":"Keine MP an dieses Profil möglich.","login":"Zum Verschenken anmelden","loading":"Lädt…"},"lv":{"top":"MurdiliMax TOP 20","leaders":"MP līderi","all":"Rādīt pārējos","empty":"Vēl neviens nav publiskojis savu MP atlikumu.","mine":"Mani punkti","visibility":"Rādīt manus MP citiem","privacy":"Rādīt atlikumu anketā, katalogā un TOP 20. Pēc noklusējuma privāts. Inkognito režīms arī slēpj MP.","saved":"Iestatījums saglabāts","gift":"🎁 Dāvināt MP","amount":"MP daudzums","send":"Nosūtīt","cancel":"Atcelt","balance":"Pieejams","confirm":"Nosūtīt","success":"Dāvana nosūtīta","failed":"Neizdevās nosūtīt. Pārbaudi atlikumu.","unavailable":"Šai anketai MP nevar nosūtīt.","login":"Ienāc, lai dāvinātu MP","loading":"Ielādē…"},"lt":{"top":"MurdiliMax TOP 20","leaders":"MP lyderiai","all":"Rodyti daugiau","empty":"Kol kas nėra viešų MP likučių.","mine":"Mano taškai","visibility":"Rodyti mano MP kitiems","privacy":"Rodyti likutį anketoje, kataloge ir TOP 20. Pagal nutylėjimą privatus. Inkognito taip pat slepia MP.","saved":"Nustatymas išsaugotas","gift":"🎁 Dovanoti MP","amount":"MP kiekis","send":"Siųsti","cancel":"Atšaukti","balance":"Turima","confirm":"Siųsti","success":"Dovana išsiųsta","failed":"Nepavyko siųsti. Patikrinkite likutį.","unavailable":"Šiai anketai MP siųsti negalima.","login":"Prisijunkite, kad dovanotumėte MP","loading":"Įkeliama…"},"et":{"top":"MurdiliMax TOP 20","leaders":"MP edetabel","all":"Näita teisi","empty":"Avalikke MP saldosid veel pole.","mine":"Minu punktid","visibility":"Näita minu MP teistele","privacy":"Näita saldot profiilis, kataloogis ja TOP 20-s. Vaikimisi privaatne. Inkognito peidab MP samuti.","saved":"Seade salvestatud","gift":"🎁 Kingi MP","amount":"MP kogus","send":"Saada","cancel":"Tühista","balance":"Saadaval","confirm":"Saada","success":"Kingitus saadetud","failed":"Saatmine ebaõnnestus. Kontrolli saldot.","unavailable":"Sellele profiilile MP saata ei saa.","login":"Logi sisse MP kinkimiseks","loading":"Laadimine…"}};
const lang=()=>typeof state!=='undefined'?state.lang:document.documentElement.lang;
const tr=()=>window.MM_pointsLabels[lang()]||window.MM_pointsLabels.ru;
const fmt=n=>new Intl.NumberFormat(lang()||'ru').format(Number(n));
const valid=n=>n!==null&&n!==undefined&&Number.isSafeInteger(Number(n))&&Number(n)>=0;
const el=(tag,cls,txt)=>{const a=document.createElement(tag);if(cls)a.className=cls;if(txt!==undefined)a.textContent=txt;return a};
const idPattern=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
window.mmPointsBadge=n=>valid(n)?'<span class="mp-badge">✦ '+fmt(n)+' MP</span>':'';
async function request(path,body){
 const r=await fetch(path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error(String(r.status));return r.json();
}
let ownSeq=0,leadersSeq=0;
async function refreshOwn(){
 const a=document.getElementById('mmOwnPoints');if(!a)return;const seq=++ownSeq;
 try{await window.MM_authReady;const data=await request('/api/vip');if(seq!==ownSeq)return;a.textContent='✦ '+tr().mine+': '+fmt(data.points)+' MP';a.href='/vip.html?lang='+encodeURIComponent(lang());a.hidden=false;}catch{if(seq===ownSeq)a.hidden=true}
}
function profileHref(id){const url=new URL(location.href);url.search='';url.searchParams.set('listing',id);return url.pathname+url.search;}
function leaderRow(p){
 const a=el('a','mp-leader');a.href=profileHref(p.id);a.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!window.mmOpenProfile)return;e.preventDefault();window.mmOpenProfile(p.id)};
 a.append(el('span','mp-rank',String(p.rank)));
 if(typeof p.avatar_url==='string'&&p.avatar_url.startsWith('/media/')){const img=el('img','mp-avatar');img.src=p.avatar_url;img.alt='';img.loading='lazy';a.append(img)}else a.append(el('span','mp-avatar mp-placeholder','✦'));
 a.append(el('span','mp-leader-name',p.display_name),el('strong','mp-leader-points',fmt(p.points)+' MP'));return a;
}
async function refreshLeaders(){
 const root=document.getElementById('mmPointsLeaderboard');if(!root)return;const seq=++leadersSeq,L=tr();
 const title=root.querySelector('h2'),sub=root.querySelector('.mp-leader-sub'),first=root.querySelector('.mp-leader-first'),rest=root.querySelector('.mp-leader-rest'),details=root.querySelector('details');
 title.textContent=L.top;sub.textContent=L.leaders;details.querySelector('summary').textContent=L.all;
 try{const data=await request('/api/points-leaderboard');if(seq!==leadersSeq)return;const rows=(data.leaders||[]).filter(p=>idPattern.test(p.id)&&valid(p.points)).slice(0,20);
 first.replaceChildren();rest.replaceChildren();if(!rows.length)first.append(el('p','mp-empty',L.empty));
 rows.forEach((p,i)=>(i<3?first:rest).append(leaderRow(p)));details.hidden=rows.length<=3;
 }catch{if(seq===leadersSeq){first.replaceChildren(el('p','mp-empty',L.failed));rest.replaceChildren();details.hidden=true}}
}
window.mmMountPointsProfile=function(item,content){
 const actions=content.querySelector('.profile-actions');if(!actions)return;
 const badge=el('p','mp-profile-balance');badge.hidden=!valid(item.mp_points);if(!badge.hidden)badge.textContent='✦ '+fmt(item.mp_points)+' MP';content.querySelector('h2')?.after(badge);
 if(!item.mp_giftable)return;
 const L=tr(),button=el('button','btn btn-outline mp-gift-button',L.gift);button.type='button';actions.append(button);
 const form=el('form','mp-profile-gift');form.hidden=true;
 const status=el('p','mp-gift-status');status.setAttribute('role','status');
 const info=el('p','mp-gift-info'),label=el('label','mp-amount-label',L.amount),amount=el('input','mp-amount');
 amount.type='number';amount.min='1';amount.step='1';amount.required=true;amount.inputMode='numeric';label.append(amount);
 const submit=el('button','btn btn-primary',L.send);submit.type='submit';submit.disabled=true;
 const cancel=el('button','btn btn-outline',L.cancel);cancel.type='button';cancel.onclick=()=>{form.hidden=true};
 const controls=el('div','mp-gift-controls');controls.append(submit,cancel);form.append(info,label,controls,status);actions.after(form);
 let available=0,pending=null,busy=false;
 async function check(){
  try{await window.MM_authReady;const d=await request('/api/vip?target='+encodeURIComponent(item.id));if(!form.isConnected)return;available=Math.max(0,Number(d.points)||0);info.textContent=L.balance+': '+fmt(available)+' MP';amount.max=String(Math.min(36500,available));submit.disabled=!d.can_gift||available<1;if(!d.can_gift)status.textContent=L.unavailable;else status.textContent='';}
  catch(e){if(!form.isConnected)return;submit.disabled=true;status.textContent=e.message==='401'?L.login:L.failed;if(e.message==='401'){const link=el('a','btn btn-outline',L.login);link.href='/login?next='+encodeURIComponent(profileHref(item.id));status.replaceChildren(link)}}
 }
 button.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden){status.textContent=L.loading;void check()}};
 form.onsubmit=async e=>{
  e.preventDefault();if(busy)return;const n=Number(amount.value);if(!Number.isSafeInteger(n)||n<1||n>Math.min(36500,available))return;
  if(!window.confirm(L.confirm+' '+fmt(n)+' MP → '+item.display_name+'?'))return;
  if(!pending||pending.days!==n)pending={action:'gift_profile',id:crypto.randomUUID(),code:item.id,days:n};
  busy=true;submit.disabled=true;cancel.disabled=true;
  try{
   await request('/api/vip',pending);pending=null;amount.value='';status.textContent=L.success;
   await check();status.textContent=L.success;
   if(typeof loadListings==='function')void loadListings(true);void refreshOwn();void refreshLeaders();
   if(badge.isConnected){try{const d=await request('/api/listing?id='+encodeURIComponent(item.id));if(!badge.isConnected)return;if(valid(d.listing.mp_points)){badge.textContent='✦ '+fmt(d.listing.mp_points)+' MP';badge.hidden=false}else{badge.textContent='';badge.hidden=true}}catch{}}
  }catch{status.textContent=L.failed;submit.disabled=false}
  finally{busy=false;cancel.disabled=false}
 };
};
function init(){
 if(!document.getElementById('mmPointsLeaderboard'))return;
 void refreshLeaders();void refreshOwn();
 window.addEventListener('mm:auth-session',refreshOwn);
 document.getElementById('language')?.addEventListener('change',()=>{void refreshLeaders();void refreshOwn()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){void refreshLeaders();void refreshOwn()}});
 setInterval(()=>{if(!document.hidden){void refreshLeaders();void refreshOwn()}},60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
