/* MurdiliMax: private mutual likes for real member-owned approved profiles. */
(function(){
"use strict";
const dictionaries={
 ru:{nav:"Взаимные симпатии",button:"♡ Нравится",liked:"♥ Нравится",pending:"Сохраняем симпатию…",match:"♥ Это взаимно! Теперь вы можете написать друг другу.",empty:"Совпадений пока нет. Симпатия появится здесь, когда другой человек тоже отметит вашу опубликованную анкету.",signin:"Войдите в аккаунт, чтобы увидеть совпадения.",open:"Открыть анкету",remove:"Отменить симпатию",load:"Загружаем…",error:"Не удалось загрузить. Попробуйте ещё раз.",hint:"Совпадения возникают только между реальными пользователями с опубликованными анкетами.",noProfiles:"Если ваша анкета пока не опубликована, взаимного совпадения ещё не будет."},
 en:{nav:"Mutual likes",button:"♡ Like",liked:"♥ Liked",pending:"Saving your like…",match:"♥ It's mutual! You can now message each other.",empty:"No matches yet. A mutual like will appear when the other person also likes your published profile.",signin:"Sign in to see your matches.",open:"View profile",remove:"Unlike",load:"Loading…",error:"Could not load. Try again.",hint:"Matches are only between real members with published profiles.",noProfiles:"A mutual match requires your own approved profile."},
 de:{nav:"Gegenseitige Likes",button:"♡ Gefällt mir",liked:"♥ Gefällt mir",pending:"Gefällt mir wird gespeichert…",match:"♥ Gegenseitig! Ihr könnt euch jetzt schreiben.",empty:"Noch keine Übereinstimmungen. Beide Personen müssen ein veröffentlichtes Profil haben und sich gegenseitig mögen.",signin:"Melde dich an, um deine Übereinstimmungen zu sehen.",open:"Profil öffnen",remove:"Gefällt mir entfernen",load:"Wird geladen…",error:"Laden fehlgeschlagen. Versuche es erneut.",hint:"Übereinstimmungen gibt es nur zwischen echten Mitgliedern mit veröffentlichten Profilen.",noProfiles:"Du benötigst ein freigegebenes Profil für eine gegenseitige Übereinstimmung."},
 lv:{nav:"Savstarpējas simpātijas",button:"♡ Patīk",liked:"♥ Patīk",pending:"Saglabājam simpātiju…",match:"♥ Simpātijas ir abpusējas! Tagad varat viens otram rakstīt.",empty:"Pagaidām nav savstarpēju simpātiju. Tās parādīsies, kad otrs cilvēks arī atzīmēs tavu publicēto profilu.",signin:"Piesakies, lai apskatītu simpātijas.",open:"Atvērt profilu",remove:"Noņemt simpātiju",load:"Ielādē…",error:"Neizdevās ielādēt. Mēģini vēlreiz.",hint:"Savstarpējas simpātijas iespējamas tikai starp īstiem lietotājiem ar publicētiem profiliem.",noProfiles:"Savstarpējai simpātijai vajadzīgs arī tavs apstiprināts profils."}
};
const msg=k=>(dictionaries[state.lang]||dictionaries.ru)[k]||dictionaries.ru[k];
const $=id=>document.getElementById(id);
let liked=new Set(),loaded=false;
async function refresh(){
 const res=await fetch("/api/likes",{cache:"no-store"});
 if(!res.ok)throw Error(msg("error"));
 const body=await res.json();
 liked=new Set(Array.isArray(body.liked_ids)?body.liked_ids:[]);
 loaded=true;
 return body;
}
function showButton(button,id){
 button.textContent=liked.has(id)?msg("liked"):msg("button");
 button.setAttribute("aria-pressed",String(liked.has(id)));
 button.title=liked.has(id)?msg("remove"):msg("button");
}
window.mmMountLike=async function(id,content){
 const holder=content.querySelector(".profile-actions");
 if(!holder||!id)return;
 const button=document.createElement("button");
 button.type="button";button.className="btn btn-outline mm-like-btn";button.id="likeThis";
 button.dataset.like=id;
 showButton(button,id);
 holder.prepend(button);
 if(state.user&&!loaded){try{await refresh();if(button.isConnected)showButton(button,id)}catch{}}
 button.onclick=async()=>{
  button.disabled=true;
  try{
   if(!state.user){
    if(window.MM_authReady)await window.MM_authReady;
    const session=await fetch("/api/session",{cache:"no-store"});
    const data=await session.json();
    if(!data.user){location.assign(loginPath({listing:id}));return}
    state.user=data.user;
   }
   const remove=liked.has(id);
   const r=await fetch("/api/likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id,action:remove?"remove":"add"})});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||msg("error"));
   if(remove)liked.delete(id);else liked.add(id);
   showButton(button,id);
   if(data.matched)toast(msg("match"));
  }catch(error){toast(error.message||msg("error"))}
  finally{button.disabled=false}
 };
};
async function showMatches(){
 const dlg=$("matchesDialog"),list=$("matchesContent");
 if(!dlg||!list)return;
 if(!dlg.open)dlg.showModal();
 list.textContent=msg("load");
 try{
  if(window.MM_authReady)await window.MM_authReady;
  const session=await fetch("/api/session",{cache:"no-store"});
  const account=await session.json();
  if(!account.user){
   list.replaceChildren();
   const p=document.createElement("p");p.textContent=msg("signin");
   const a=document.createElement("a");a.href=loginPath({panel:"matches"});a.textContent=msg("signin");a.className="btn btn-outline";
   list.append(p,a);return;
  }
  state.user=account.user;
  const data=await refresh();
  list.replaceChildren();
  const note=document.createElement("p");note.className="chat-note";note.textContent=msg("hint");list.append(note);
  if(!data.matches?.length){
   const empty=document.createElement("p");empty.textContent=msg("empty");list.append(empty);return;
  }
  for(const p of data.matches){
   const row=document.createElement("div");row.className="favorite-item";
   const thumb=document.createElement("div");thumb.className="favorite-thumb";
   if(p.avatar_url){
    const img=document.createElement("img");img.src=p.avatar_url;img.alt="";img.loading="lazy";thumb.append(img);
   }else thumb.textContent="♥";
   const detail=document.createElement("div");detail.className="favorite-details";
   const name=document.createElement("strong");name.textContent=p.display_name+", "+p.age;
   const city=document.createElement("small");city.textContent=p.city+", "+p.country;
   detail.append(name,city);
   const buttons=document.createElement("div");buttons.className="fav-actions";
   const open=document.createElement("button");open.type="button";open.className="btn btn-outline";open.textContent=msg("open");
   open.onclick=()=>{dlg.close();window.mmOpenProfile(p.id)};
   const cancel=document.createElement("button");cancel.type="button";cancel.className="btn btn-text";cancel.textContent=msg("remove");
   cancel.onclick=async()=>{
    cancel.disabled=true;
    try{
     const r=await fetch("/api/likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:p.id,action:"remove"})});
     if(!r.ok)throw Error(msg("error"));
     liked.delete(p.id);
     await showMatches();
    }catch(err){toast(err.message||msg("error"));cancel.disabled=false}
   };
   buttons.append(open,cancel);row.append(thumb,detail,buttons);list.append(row);
  }
 }catch(error){list.textContent=error.message||msg("error")}
}
function mount(){
 for(const id of ["matchesBtn","matchesFromFavorites"])$(id)?.addEventListener("click",()=>{
  if(id==="matchesFromFavorites")$("favoritesDialog")?.close();
  showMatches();
 });
 const query=new URLSearchParams(location.search);
 if(query.get("panel")==="matches"){
  query.delete("panel");
  const address=new URL(location.href);address.search=query.toString();
  history.replaceState(history.state,"",address);
  if(localStorage.getItem("mm-over18")==="yes")showMatches();
 }
}
document.addEventListener("DOMContentLoaded",mount);
})();
