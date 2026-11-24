/* Opt-in guestbook and related listings. Never render untrusted text as HTML. */
(()=>{
 const translations={
 ru:["Гостевая книга","Все объявления автора","Настройки гостевой книги и объявлений","Разрешить гостевую книгу","Связать эту анкету с другими моими анкетами, где включено то же разрешение","Сохранить","Записи пока отсутствуют","Запись до 500 символов","Отправить на одобрение","Ожидает одобрения","Одобрить","Удалить","Участник","Войдите, чтобы оставить запись","Запись будет видна всем после одобрения владельцем. Не публикуйте контакты или личные данные.","Не удалось выполнить действие. Проверьте текст или попробуйте позже.","Удалить эту запись?","Настройки сохранены","Запись отправлена на одобрение","Открыть анкету","Пока нет других связанных анкет","Жалоба на запись"],
 en:["Guestbook","All listings by this author","Guestbook and listing settings","Enable guestbook","Link this listing to my other listings with the same permission","Save","No entries yet","Entry of up to 500 characters","Submit for approval","Awaiting approval","Approve","Delete","Member","Sign in to leave an entry","Your entry becomes public after the owner approves it. Do not post contacts or personal data.","Action failed. Check the text or try again later.","Delete this entry?","Settings saved","Entry submitted for approval","Open profile","No other linked listings yet","Report entry"],
 de:["Gästebuch","Alle Anzeigen dieses Autors","Gästebuch- und Anzeigeneinstellungen","Gästebuch aktivieren","Diese Anzeige mit meinen anderen freigegebenen Anzeigen verknüpfen","Speichern","Noch keine Einträge","Eintrag mit bis zu 500 Zeichen","Zur Freigabe senden","Wartet auf Freigabe","Freigeben","Löschen","Mitglied","Anmelden, um einen Eintrag zu hinterlassen","Der Eintrag wird nach Freigabe öffentlich. Keine Kontaktdaten oder persönlichen Daten veröffentlichen.","Aktion fehlgeschlagen. Text prüfen oder später erneut versuchen.","Diesen Eintrag löschen?","Einstellungen gespeichert","Eintrag zur Freigabe gesendet","Profil öffnen","Noch keine weiteren verknüpften Anzeigen","Eintrag melden"],
 lv:["Viesu grāmata","Visi autora sludinājumi","Viesu grāmatas un sludinājumu iestatījumi","Ieslēgt viesu grāmatu","Saistīt šo anketu ar citām manām anketām, kurām dota tāda pati atļauja","Saglabāt","Pagaidām nav ierakstu","Ieraksts līdz 500 rakstzīmēm","Nosūtīt apstiprināšanai","Gaida apstiprinājumu","Apstiprināt","Dzēst","Dalībnieks","Piesakieties, lai atstātu ierakstu","Ieraksts būs publisks pēc īpašnieka apstiprinājuma. Nepublicējiet kontaktinformāciju vai personas datus.","Darbība neizdevās. Pārbaudiet tekstu vai mēģiniet vēlāk.","Dzēst šo ierakstu?","Iestatījumi saglabāti","Ieraksts nosūtīts apstiprināšanai","Atvērt anketu","Pagaidām nav citu saistītu anketu","Ziņot par ierakstu"],
 lt:["Svečių knyga","Visi autoriaus skelbimai","Svečių knygos ir skelbimų nustatymai","Įjungti svečių knygą","Susieti šį skelbimą su kitais mano skelbimais, kuriems suteiktas toks pat leidimas","Išsaugoti","Įrašų dar nėra","Įrašas iki 500 ženklų","Pateikti patvirtinti","Laukiama patvirtinimo","Patvirtinti","Ištrinti","Narys","Prisijunkite, kad paliktumėte įrašą","Įrašas bus viešas savininkui jį patvirtinus. Neskelbkite kontaktų ar asmens duomenų.","Veiksmas nepavyko. Patikrinkite tekstą arba bandykite vėliau.","Ištrinti šį įrašą?","Nustatymai išsaugoti","Įrašas pateiktas patvirtinti","Atverti anketą","Kitų susietų skelbimų dar nėra","Pranešti apie įrašą"],
 et:["Külalisteraamat","Kõik autori kuulutused","Külalisteraamatu ja kuulutuste seaded","Luba külalisteraamat","Seo see kuulutus minu teiste kuulutustega, millel on sama luba","Salvesta","Sissekandeid veel pole","Kuni 500 tähemärgiga sissekanne","Saada kinnitamiseks","Ootab kinnitamist","Kinnita","Kustuta","Liige","Sissekande tegemiseks logi sisse","Sissekanne muutub avalikuks pärast omaniku kinnitust. Ära avalda kontakt- ega isikuandmeid.","Toiming ebaõnnestus. Kontrolli teksti või proovi hiljem.","Kustutada see sissekanne?","Seaded salvestatud","Sissekanne saadeti kinnitamiseks","Ava profiil","Teisi seotud kuulutusi veel pole","Teata sissekandest"]
 };
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 const button=(text,fn)=>{const b=el("button",text,"btn btn-outline");b.type="button";b.onclick=fn;return b};
 const L=()=>translations[document.documentElement.lang]||translations.en;
 async function request(id,body){
  const r=await fetch("/api/profile-community?listing_id="+encodeURIComponent(id),body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing_id:id,...body}),cache:"no-store"}:{cache:"no-store"});
  if(!r.ok)throw Error(String(r.status));
  return r.json();
 }
 function reportEntry(id,entry){
  const profile=document.getElementById("profileModal"),report=document.getElementById("reportModal"),form=document.getElementById("reportForm");
  if(!report||!form)return;
  if(profile?.open)profile.close();
  form.elements.listing_id.value=id;
  const details=form.elements.details;if(details)details.value="Guestbook entry ID: "+entry.id;
  report.showModal();
 }
 async function render(root,id,settings=false){
  const l=L();
  try{
   const data=await request(id);if(!root.isConnected)return;
   root.replaceChildren();
   async function change(body,notice){
    const old=root.querySelector(".mm-community-status");if(old)old.textContent="";
    for(const b of root.querySelectorAll("button"))b.disabled=true;
    try{await request(id,body);await render(root,id,settings);const message=root.querySelector(".mm-community-status");if(message)message.textContent=notice||""}
    catch{if(old)old.textContent=l[15]}finally{for(const b of root.querySelectorAll("button"))b.disabled=false}
   }
   if(settings&&data.owner){
    root.append(el("h3",l[2]));
    const checkbox=(text,checked)=>{const label=el("label",null,"mm-community-check"),input=el("input");input.type="checkbox";input.checked=checked;label.append(input,document.createTextNode(" "+text));root.append(label);return input};
    const guest=checkbox(l[3],data.settings.guestbook_enabled),group=checkbox(l[4],data.settings.author_group_enabled);
    root.append(button(l[5],()=>change({action:"settings",guestbook_enabled:guest.checked,author_group_enabled:group.checked},l[17])));
   }
   if(!settings&&data.author_group_enabled){
    root.append(el("h3",l[1]));const others=data.listings.filter(p=>p.id!==id);
    if(!others.length)root.append(el("p",l[20]));
    for(const p of others){const a=el("a",null,"mm-author-card");const url=new URL(location.href);url.searchParams.set("listing",p.id);a.href=url.pathname+url.search;
     if(typeof p.avatar_url==="string"&&p.avatar_url.startsWith("/media/")){const img=el("img");img.src=p.avatar_url;img.alt="";img.loading="lazy";a.append(img)}
     a.append(el("span",[p.display_name,p.headline,p.city].filter(Boolean).join(" · ")));a.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();window.mmOpenProfile(p.id)};root.append(a)}
   }
   if(data.guestbook_enabled||(settings&&data.owner)){
    root.append(el("h3",l[0]));if(!data.entries.length)root.append(el("p",l[6]));
    for(const entry of data.entries){
     const item=el("article",null,"mm-guest-entry");
     item.append(el("strong",l[12]),el("p",entry.body));
     if(!entry.approved)item.append(el("small",l[9]));
     if(data.owner&&!entry.approved&&data.guestbook_enabled)item.append(button(l[10],()=>change({action:"approve",entry_id:entry.id})));
     if(data.owner||entry.mine)item.append(button(l[11],()=>{if(confirm(l[16]))change({action:"remove",entry_id:entry.id})}));
     if(!settings&&entry.approved)item.append(button(l[21],()=>reportEntry(id,entry)));
     root.append(item);
    }
    if(!settings&&data.can_write){
     const form=el("form"),area=el("textarea");area.maxLength=500;area.required=true;area.rows=3;area.placeholder=l[7];area.setAttribute("aria-label",l[7]);
     const send=el("button",l[8],"btn btn-primary");send.type="submit";form.append(el("p",l[14]),area,send);form.onsubmit=e=>{e.preventDefault();change({action:"write",body:area.value},l[18])};root.append(form);
    }else if(!settings&&!data.owner&&!state.user)root.append(button(l[13],()=>location.assign(loginPath({listing:id}))));
   }
   const status=el("p",null,"mm-community-status");status.setAttribute("role","status");root.append(status);
  }catch(e){if(settings&&root.isConnected)root.textContent=l[15];else root.remove()}
 }
 window.mmMountCommunity=(id,content)=>{const root=el("section",null,"mm-community");content.append(root);render(root,id)};
 window.mmMountCommunitySettings=(listing,row)=>{
  const root=el("section",null,"mm-community");root.hidden=true;const toggle=button(L()[2],()=>{root.hidden=!root.hidden;if(!root.hidden)render(root,listing.id,true)});
  row.append(toggle,root);
 };
})();
