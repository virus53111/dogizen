/* MurdiliMax — enhanced taxonomy, search controls and profile photo galleries. */
(function(){
const X=window.MM_I18N.X;
window.mmExtra={min_age:"",max_age:"",sort:"newest",language:"",photo:"",commercial:"",featured:"",page:1};
const ex=k=>(X[state.lang]||X.ru)[k]||X.ru[k]||k;
let collapsed=window.matchMedia("(max-width: 780px)").matches;
function titleFor(id){return window.MM_categoryLabel(id,state.lang)}
function groupMarkup(g){const items=window.MM_CATEGORIES.filter(x=>x.group===g.id);return '<div class="category-group"><div class="category-group-title"><span class="group-ico">'+g.icon+'</span><span>'+escapeHTML(g.name[state.lang]||g.name.ru)+'</span></div><div class="category-group-links">'+items.map(c=>'<button type="button" class="cat-item '+(state.category===c.id?"active":"")+'" data-category="'+c.id+'"><span class="cat-glyph">'+c.icon+'</span><span>'+escapeHTML(titleFor(c.id))+'</span></button>').join("")+'</div></div>'}
function drawGroups(){const exp=document.getElementById("categoryExplorer");if(!exp)return;exp.classList.toggle("collapsed",collapsed);exp.innerHTML='<div class="category-explorer-head"><div><h3>✧ '+ex("categoryHeadline")+'</h3><p>'+ex("categorySub")+'</p></div><button type="button" class="cat-collapse" id="toggleCategories">'+(collapsed?ex("showCategories"):ex("hideCategories"))+' '+(collapsed?"⌄":"⌃")+'</button></div><div class="category-groups">'+window.MM_CATEGORY_GROUPS.map(groupMarkup).join("")+'</div>';document.getElementById("toggleCategories").onclick=()=>{collapsed=!collapsed;drawGroups()}}
const POPULAR=["","noncommercial","support","women-men","men-women","couples","social","events"];
function drawChips(){const root=document.getElementById("categoryChips");if(!root)return;root.innerHTML=POPULAR.map(id=>'<button type="button" class="chip '+(state.category===id?"selected":"")+'" data-cat="'+id+'">'+(id?(window.MM_categoryById(id)?.icon||"✧"):"✧")+' <span>'+escapeHTML(id?titleFor(id):t("all"))+'</span></button>').join("")}
function selectCategory(id){state.category=(state.category===id? "":id);window.mmExtra.page=1;fillCategories();drawGroups();drawChips();loadListings();document.getElementById("catalog").scrollIntoView({behavior:"smooth",block:"start"})}
function drawPostCategory(){const el=document.getElementById("postCategory");if(!el)return;const selected=el.value;setOptions(el,window.MM_CATEGORIES.map(c=>[c.id,titleFor(c.id)]),window.MM_categoryById(selected)?selected:(window.MM_categoryById(state.category)?state.category:"dating"));showComplianceNote()}
function showComplianceNote(){document.getElementById("commercialNote").textContent=t("photoPolicy")}
function renderExtraLanguage(){document.querySelectorAll("[data-t]").forEach(el=>{if(X[state.lang]?.[el.dataset.t]||X.ru[el.dataset.t])el.textContent=ex(el.dataset.t)});const sels=document.querySelector("#sortFilter");if(sels){[...sels.options].forEach((o,i)=>o.textContent=ex("sortLabels")[i])}drawGroups();drawChips();drawPostCategory()}
/* Catalog reads approved member profiles exclusively from the API. */
window.mmRenderExtras=function(){document.getElementById("galleryViewBtn")?.classList.toggle("current",state.mode==="gallery");document.getElementById("cards")?.classList.toggle("photo-gallery",state.mode==="gallery");drawGroups();drawChips();const count=state.totalReal||0;document.getElementById("totalCount").textContent=state.loading?"…":String(count);const pager=document.getElementById("pagination");const size=48,pages=Math.ceil((state.totalReal||0)/size);if(pages>1){pager.classList.remove("hidden");pager.innerHTML='<button type="button" class="pager" data-page="'+(window.mmExtra.page-1)+'" '+(window.mmExtra.page<=1?"disabled":"")+'>'+ex("back")+'</button><span class="pager-number">'+ex("page")+' '+window.mmExtra.page+' / '+pages+'</span><button type="button" class="pager" data-page="'+(window.mmExtra.page+1)+'" '+(window.mmExtra.page>=pages?"disabled":"")+'>'+ex("next")+'</button>'}else{pager.classList.add("hidden");pager.innerHTML=""}};
const listingIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function restoreListingFromAddress() {
  const id = new URL(location.href).searchParams.get("listing");
  if (!listingIdPattern.test(id || "") || localStorage.getItem("mm-over18") !== "yes") return;
  window.mmOpenProfile(id);
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("enterAge").addEventListener("click", () => queueMicrotask(restoreListingFromAddress));
  document.getElementById("profileModal").addEventListener("close", () => {
    const url = new URL(location.href);
    if (!url.searchParams.has("listing")) return;
    url.searchParams.delete("listing");
    history.replaceState(history.state, "", url);
  });
  restoreListingFromAddress();
});
window.mmOpenProfile=function(id){const p=state.visible.find(x=>x.id===id);/* No fictional profiles are rendered. */if(!listingIdPattern.test(id))return false;const modal=document.getElementById("profileModal"),content=document.getElementById("profileContent");const url=new URL(location.href);
url.searchParams.set("listing",id);
history.replaceState(history.state,"",url);
content.textContent=t("loading");if(!modal.open)modal.showModal();
(async()=>{try{const r=await fetch("/api/listing?id="+encodeURIComponent(id));if(r.status===404)throw Error(({ru:"Объявление недоступно",en:"Listing unavailable",de:"Anzeige nicht verfügbar",lv:"Sludinājums nav pieejams",lt:"Skelbimas nepasiekiamas",et:"Kuulutus pole saadaval"})[state.lang] || "Listing unavailable");
if(!r.ok)throw Error(t("error"));const data=await r.json(),item=data.listing;const canMessage=item.messaging_enabled!==false;const gallery=(data.photos||[]).map(x=>x.photo_url);if(item.avatar_url&&!gallery.includes(item.avatar_url))gallery.unshift(item.avatar_url);const first=gallery[0]||"";const cover=first?'<img src="'+escapeHTML(first)+'" alt="'+escapeHTML(item.display_name)+'">':'<span style="font-size:80px">✿</span>';const goals={friendship:"goalFriendship",dating:"goalDating",relationship:"goalRelationship",activities:"goalActivities",open:"goalOpen"};
const goalName=goals[item.looking_for] ? t(goals[item.looking_for]) : "";
const extraDetails=(goalName ? '<span>🎯 '+escapeHTML(t("lookingFor"))+': '+escapeHTML(goalName)+'</span>' : '')+
(item.interests ? '<span>✨ '+escapeHTML(t("interests"))+': '+escapeHTML(item.interests)+'</span>' : '');
const thumbs=gallery.length>1?'<div class="gallery-thumbs">'+gallery.map((src,i)=>'<button data-photo="'+i+'" class="'+(i===0?"active":"")+'" title="'+ex("photos")+' '+(i+1)+'"><img src="'+escapeHTML(src)+'"></button>').join("")+'</div>':"";content.innerHTML='<div class="gallery-main" id="galleryMain">'+cover+'</div>'+thumbs+'<div class="eyebrow">'+escapeHTML(titleFor(item.category))+'</div><h2>'+escapeHTML(item.display_name)+', '+Number(item.age)+'</h2>'+presenceLabel(item.last_seen)+newMemberLabel(item)+(item.headline?'<div class="ad-detail-head">'+escapeHTML(item.headline)+'</div>':"")+'<div class="profile-modal-geo">⌖ '+(FLAGS[item.country]||"🌍")+' '+escapeHTML(countryLabel(item.country))+' · '+escapeHTML(item.city)+(item.district?' · '+escapeHTML(item.district):"")+'</div><p class="profile-modal-desc">'+escapeHTML(item.description)+'</p><div class="detail-info"><span>🌐 '+escapeHTML(item.languages||"—")+'</span><span>'+escapeHTML(titleFor(item.category))+'</span>'+(item.is_commercial?'<span>'+ex("commercial")+'</span>':"")+extraDetails+'</div><div class="detail-safety">⚠ '+ex("legalTip")+'</div><div class="profile-actions"><button class="btn btn-primary" id="messageThis">✉ '+(window.MM_v4?window.MM_v4("write"):"Написать")+'</button><button class="btn btn-outline" id="reportThis">⚑ '+ex("report")+'</button></div>';
content.querySelectorAll("[data-photo]").forEach(btn=>btn.onclick=()=>{const img=gallery[Number(btn.dataset.photo)];document.getElementById("galleryMain").innerHTML='<img src="'+escapeHTML(img)+'" alt="'+escapeHTML(item.display_name)+'">';content.querySelectorAll("[data-photo]").forEach(x=>x.classList.toggle("active",x===btn))});
const messageButton=document.getElementById("messageThis");if(canMessage){messageButton.onclick=()=>{if(window.mmStartChat)window.mmStartChat(item.id)}}else{const note=document.createElement("small");note.className="mm-card-unavailable";note.textContent=window.mmMemberText?.("unavailable")||"";messageButton.parentNode.insertBefore(note,messageButton);messageButton.remove();}
if(canMessage&&window.mmMountLike)window.mmMountLike(item.id,content);
if(canMessage&&window.mmMountCommunity)window.mmMountCommunity(item.id,content);
if(canMessage&&window.mmProfileActivity)window.mmProfileActivity(item.id,content);
if(canMessage)window.mmMountAlbum?.(item.id,content);
if(window.mmGalleryControls)window.mmGalleryControls(content,gallery);
document.getElementById("reportThis").onclick=()=>{modal.close();document.getElementById("reportForm").elements.listing_id.value=item.id;document.getElementById("reportModal").showModal()};
}catch(err){content.innerHTML='<p>'+escapeHTML(err.message)+'</p>'}})();return true};
window.resetAdvancedFilters=function(){document.getElementById("radiusFilter").value="";syncRadius();window.mmExtra={min_age:"",max_age:"",sort:"newest",language:"",photo:"",commercial:"",featured:"",page:1};document.getElementById("minAge").value="18";document.getElementById("maxAge").value="85";document.getElementById("sortFilter").value="newest";document.getElementById("photoOnly").checked=false;document.getElementById("onlineOnly").checked=false;document.getElementById("newMemberOnly").checked=false;document.getElementById("spokenLanguageFilter").value="";if(document.getElementById("mmInterestFilter"))document.getElementById("mmInterestFilter").value="";if(document.getElementById("mmGoalFilter"))document.getElementById("mmGoalFilter").value="";};
function reload(){window.mmExtra.page=1;loadListings()}
function bind(){
document.getElementById("galleryViewBtn").onclick=()=>{state.mode="gallery";window.mmExtra.page=1;loadListings()};
document.getElementById("categoryExplorer").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b)selectCategory(b.dataset.category)});
document.getElementById("categoryChips").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(b)selectCategory(b.dataset.cat)});
document.getElementById("pagination").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b||b.disabled)return;window.mmExtra.page=Number(b.dataset.page);loadListings();document.getElementById("catalog").scrollIntoView({behavior:"smooth"})});
document.getElementById("minAge").addEventListener("change",e=>{const v=Number(e.target.value);window.mmExtra.min_age=v>=18&&v<=85?String(v):"";reload()});
document.getElementById("maxAge").addEventListener("change",e=>{const v=Number(e.target.value);window.mmExtra.max_age=v>=18&&v<=85?String(v):"";reload()});
document.getElementById("sortFilter").addEventListener("change",e=>{window.mmExtra.sort=e.target.value;reload()});
document.getElementById("spokenLanguageFilter").addEventListener("change",e=>{window.mmExtra.language=e.target.value.trim().slice(0,40);reload()});
document.getElementById("newMemberOnly").addEventListener("change",e=>{window.mmExtra.new_member=e.target.checked?"1":"";reload()});
document.getElementById("onlineOnly").addEventListener("change",e=>{window.mmExtra.online=e.target.checked?"1":"";reload()});
document.getElementById("photoOnly").addEventListener("change",e=>{window.mmExtra.photo=e.target.checked?"1":"";reload()});

document.getElementById("resetAdvanced").onclick=()=>{window.resetAdvancedFilters();loadListings()};
document.getElementById("language").addEventListener("change",()=>renderExtraLanguage());
document.getElementById("postCountry").addEventListener("change",showComplianceNote);
document.getElementById("postCategory").addEventListener("change",showComplianceNote);
document.getElementById("postBtn").addEventListener("click",()=>{drawPostCategory()});
document.getElementById("ctaPost").addEventListener("click",()=>{drawPostCategory()});
document.getElementById("categoryFilter").addEventListener("change",()=>{window.mmExtra.page=1;drawGroups();drawChips()});
document.getElementById("countryFilter").addEventListener("change",()=>{window.mmExtra.page=1});
document.getElementById("cityFilter").addEventListener("change",()=>{window.mmExtra.page=1});
document.getElementById("districtFilter").addEventListener("change",()=>{window.mmExtra.page=1});
document.getElementById("keyword").addEventListener("input",()=>{window.mmExtra.page=1});
renderExtraLanguage();
}
window.mmEnhanceMine=function(listings){
 const rows=[...document.querySelectorAll("#myContent .my-item")];
 const labels=state.lang==="lt"?["Redaguoti","Ištrinti anketą","Išsaugoti","Ištrinti anketą visam laikui? Ji dings iš katalogo, o susiję pokalbiai bus ištrinti. To atšaukti negalima.","Redaguoti skelbimą"]:
 state.lang==="et"?["Muuda","Kustuta profiil","Salvesta","Kustutada profiil jäädavalt? See kaob kataloogist ja seotud vestlused kustutatakse. Seda ei saa tagasi võtta.","Muuda kuulutust"]:
 state.lang==="ru"?["Изменить","Удалить анкету","Сохранить","Удалить анкету навсегда? Она исчезнет из каталога и связанные с ней переписки будут удалены. Это нельзя отменить.","Редактирование объявления"]:
 state.lang==="de"?["Bearbeiten","Profil löschen","Speichern","Profil endgültig löschen? Es verschwindet aus dem Katalog und die zugehörigen Nachrichten werden gelöscht. Dies kann nicht rückgängig gemacht werden.","Anzeige bearbeiten"]:
 state.lang==="lv"?["Rediģēt","Dzēst profilu","Saglabāt","Neatgriezeniski dzēst šo profilu? Tas pazudīs no kataloga, un saistītās sarakstes tiks dzēstas. To nevar atsaukt.","Rediģēt sludinājumu"]:["Edit","Delete profile","Save","Permanently delete this profile? It will disappear from the catalogue and its conversations will be deleted. This cannot be undone.","Edit listing"];
 rows.forEach((row,i)=>{
  const listing=listings[i];if(!listing)return;
  const actions=document.createElement("div");actions.className="owner-actions";
  const edit=document.createElement("button");edit.className="btn btn-outline";edit.textContent=labels[0];
  const del=document.createElement("button");del.type="button";del.className="btn btn-text";del.textContent=labels[1];
  actions.append(edit,del);row.append(actions);actions.dataset.mmListing=listing.id;window.mmMountAlbum?.(listing.id,row,true);if(window.mmMountCommunitySettings)window.mmMountCommunitySettings(listing,row);
  del.onclick=async()=>{
   if(!confirm(labels[3]))return;del.disabled=true;
   try{const r=await fetch("/api/mine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete",id:listing.id})});const j=await r.json();if(!r.ok||!j.ok)throw Error(t("error"));toast(labels[1]);showMy();loadListings()}catch(e){toast(e.message)}finally{del.disabled=false}
  };
  edit.onclick=()=>{
   let modal=document.getElementById("editListingModal");
   if(!modal){modal=document.createElement("dialog");modal.id="editListingModal";modal.className="modal modal-form";document.body.append(modal)}
   const goalOptions=[["","goalUnspecified"],["friendship","goalFriendship"],["dating","goalDating"],["relationship","goalRelationship"],["activities","goalActivities"],["open","goalOpen"]].map(([code,key])=>'<option value="'+code+'">'+escapeHTML(t(key))+'</option>').join("");
   modal.innerHTML='<button class="modal-x" id="editClose" aria-label="Close">×</button><h2>'+labels[4]+'</h2><form id="editForm"><label><span>'+ex("headline")+'</span><input name="headline" maxlength="120"></label><label><span>'+t("lookingFor")+'</span><select name="looking_for">'+goalOptions+'</select></label><label><span>'+t("interests")+'</span><input name="interests" maxlength="240" autocomplete="off"></label><label><span>'+t("aboutMe")+'</span><textarea name="description" rows="7" maxlength="1600" minlength="20" required></textarea></label><div class="form-message" id="editError"></div><button type="submit" class="btn btn-primary wide">'+labels[2]+'</button></form>';
   modal.querySelector("#editClose").onclick=()=>modal.close();
   const form=modal.querySelector("#editForm");
   form.elements.headline.value=listing.headline||"";
   form.elements.looking_for.value=listing.looking_for||"";
   form.elements.interests.value=listing.interests||"";
   form.elements.description.value=listing.description||"";
   form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector("button[type=submit]");btn.disabled=true;
     try{const r=await fetch("/api/mine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"edit",id:listing.id,headline:form.elements.headline.value,description:form.elements.description.value,looking_for:form.elements.looking_for.value,interests:form.elements.interests.value})});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||t("error"));modal.close();showMy();loadListings()}catch(err){modal.querySelector("#editError").textContent=err.message}finally{btn.disabled=false}};
   modal.showModal();
  };
 });
};
document.addEventListener("DOMContentLoaded",bind);
})();