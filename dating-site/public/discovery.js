(()=>{
const words={ru:['Рекомендации по моим фильтрам','Пригласить друга','Ссылка скопирована','Статистика моих анкет','Посещения с согласия за 30 дней','Симпатии (всего)','Диалоги','Предыдущее фото','Следующее фото','Установить приложение','В меню браузера выберите «Добавить на главный экран» или «Установить приложение».'],en:['Recommendations using my filters','Invite a friend','Link copied','My profile statistics','Consented visits in 30 days','Likes (total)','Conversations','Previous photo','Next photo','Install app','Use your browser menu to add to home screen or install the app.'],de:['Empfehlungen nach meinen Filtern','Freunde einladen','Link kopiert','Meine Profilstatistik','Einvernehmliche Besuche in 30 Tagen','Likes insgesamt','Unterhaltungen','Vorheriges Foto','Nächstes Foto','App installieren','Wähle im Browsermenü „Zum Startbildschirm“ oder „App installieren“.'],lv:['Ieteikumi pēc maniem filtriem','Uzaicināt draugu','Saite nokopēta','Manu anketu statistika','Apmeklējumi ar piekrišanu 30 dienās','Simpātijas kopā','Sarunas','Iepriekšējais foto','Nākamais foto','Instalēt lietotni','Pārlūka izvēlnē izvēlies pievienot sākuma ekrānam vai instalēt lietotni.'],lt:['Rekomendacijos pagal mano filtrus','Pakviesti draugą','Nuoroda nukopijuota','Mano anketų statistika','Apsilankymai su sutikimu per 30 dienų','Simpatijos iš viso','Pokalbiai','Ankstesnė nuotrauka','Kita nuotrauka','Įdiegti programėlę','Naršyklės meniu pasirinkite pridėti prie pradžios ekrano arba įdiegti programėlę.'],et:['Soovitused minu filtrite järgi','Kutsu sõber','Link kopeeritud','Minu profiilide statistika','Nõusolekuga külastused 30 päeva jooksul','Meeldimisi kokku','Vestlused','Eelmine foto','Järgmine foto','Paigalda rakendus','Vali brauseri menüüst avalehele lisamine või rakenduse paigaldamine.']};
const W=i=>(words[document.documentElement.lang]||words.en)[i];
const el=(tag,txt)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;return e};
const button=(txt,fn)=>{const b=el("button",txt);b.type="button";b.className="btn btn-outline";b.onclick=fn;return b};
window.mmGalleryControls=(root,photos)=>{
 if(photos.length<2)return;const cover=root.querySelector("#galleryMain"),thumbs=[...root.querySelectorAll("[data-photo]")];if(!cover||thumbs.length!==photos.length)return;
 let index=0;const nav=el("div");nav.className="mm-gallery-nav";const count=el("span","1 / "+photos.length);
 const select=n=>{index=(n+photos.length)%photos.length;thumbs[index].click();count.textContent=(index+1)+" / "+photos.length};
 const prev=button("‹",()=>select(index-1)),next=button("›",()=>select(index+1));prev.setAttribute("aria-label",W(7));next.setAttribute("aria-label",W(8));nav.append(prev,count,next);cover.after(nav);
 thumbs.forEach((b,i)=>{b.addEventListener("click",()=>{index=i;count.textContent=(i+1)+" / "+photos.length});b.querySelector("img")?.setAttribute("loading","lazy")});
 nav.onkeydown=e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();select(index+(e.key==="ArrowLeft"?-1:1))}};
 let start=null;cover.addEventListener("touchstart",e=>{start=e.changedTouches[0].clientX},{passive:true});cover.addEventListener("touchend",e=>{if(start!==null){const d=e.changedTouches[0].clientX-start;if(Math.abs(d)>50)select(index+(d<0?1:-1));start=null}},{passive:true});
};
window.mmMountStats=async(root)=>{
 const box=el("section");box.className="mm-community";box.append(el("h3",W(3)));root.append(box);
 try{const r=await fetch("/api/profile-stats",{cache:"no-store"});if(!r.ok)return;const d=await r.json();for(const p of d.listings){const row=el("article");row.append(el("strong",p.display_name),el("p",W(4)+": "+p.visits+" · "+W(5)+": "+p.likes+" · "+W(6)+": "+p.conversations));box.append(row)}}catch{}
};
let installEvent;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e});
document.addEventListener("DOMContentLoaded",()=>{
 const grid=document.querySelector("#advancedFilters .advanced-grid");
 if(grid){
 const label=el("label");label.append(el("span",t("interests")));const interest=el("input");interest.type="search";interest.id="mmInterestFilter";interest.maxLength=100;interest.placeholder=t("interestsHint");label.append(interest);
 const goalLabel=el("label");goalLabel.append(el("span",t("lookingFor")));const goal=el("select");goal.id="mmGoalFilter";for(const [v,k] of [["","all"],["friendship","goalFriendship"],["dating","goalDating"],["relationship","goalRelationship"],["activities","goalActivities"],["open","goalOpen"]]){const o=el("option",t(k));o.value=v;goal.append(o)}goalLabel.append(goal);
 grid.prepend(label,goalLabel);const reload=()=>{window.mmExtra.interest=interest.value.trim();window.mmExtra.goal=goal.value;window.mmExtra.page=1;loadListings()};interest.addEventListener("change",reload);goal.addEventListener("change",reload);
 const recommend=button(W(0),async()=>{if(!await getSession()){location.assign(loginPath({panel:"mine"}));return}
 const result=document.getElementById("mmRecommendations")||el("section");result.id="mmRecommendations";result.className="mm-community";grid.after(result);result.replaceChildren(el("h3",W(0)));
 try{const response=await fetch("/api/recommendations",{cache:"no-store"});if(!response.ok)throw Error();const data=await response.json();if(!data.listings.length)result.append(el("p",t("emptyTitle")+" · "+t("postProfile")));for(const p of data.listings)result.append(button(p.display_name+" · "+p.city,()=>window.mmOpenProfile(p.id)))}catch{result.append(el("p",t("error")))}
 });grid.append(recommend);
 }
 const footer=document.querySelector(".footer-links")||document.querySelector("footer");
 if(footer){footer.append(button(W(1),async()=>{const url=location.origin+(state.lang==="ru"?"/":"/"+state.lang+"/");try{if(navigator.share)await navigator.share({title:"MurdiliMax",url});else{await navigator.clipboard.writeText(url);toast(W(2))}}catch(e){if(e.name!=="AbortError")prompt(W(1),url)}}),button(W(9),async()=>{if(installEvent){await installEvent.prompt();installEvent=null}else alert(W(10))}))}
 if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
});
})();
