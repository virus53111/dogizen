/* Private in-app activity. No external notifications or tracking without consent. */
(()=>{
const words={
ru:["Личные сообщения пока недоступны: владелец ещё не подключил аккаунт.","Активность","Непрочитанные сообщения","Взаимные симпатии","Записи гостевой книги на одобрение","Посетители за 30 дней","Показывать мои посещения другим согласившимся участникам и видеть их посещения моих анкет","Сохранить настройки","Нет посетителей","Блокировать пользователя","Разблокировать пользователя","Заблокировать общение с этим участником во всех анкетах?","Не удалось выполнить действие","Мои данные и приватность","Создать анкету","Мои объявления","Открыть сообщения","Взаимные симпатии","Откройте настройки гостевой книги нужной анкеты для одобрения записей.","Получить доступ к своей старой анкете: запросите у администратора персональное приглашение на ваш подтверждённый email."],
en:["Private messages unavailable until the owner connects an account.","Activity","Unread messages","Mutual likes","Guestbook entries awaiting approval","Visitors in the last 30 days","Share my visits with other consenting members and see their visits to my profiles","Save settings","No visitors","Block member","Unblock member","Block contact with this member across all profiles?","Could not complete action","My data and privacy","Create profile","My listings","Open messages","Mutual likes","Open the relevant listing's guestbook settings to approve entries.","To reclaim an old profile, ask the administrator for a personal invitation tied to your verified email."],
de:["Private Nachrichten sind erst möglich, wenn der Inhaber sein Konto verbunden hat.","Aktivität","Ungelesene Nachrichten","Gegenseitige Likes","Gästebucheinträge zur Freigabe","Besucher der letzten 30 Tage","Meine Besuche mit anderen zustimmenden Mitgliedern teilen und ihre Besuche sehen","Einstellungen speichern","Keine Besucher","Mitglied blockieren","Blockierung aufheben","Kontakt mit diesem Mitglied in allen Profilen blockieren?","Aktion fehlgeschlagen","Meine Daten und Datenschutz","Profil erstellen","Meine Anzeigen","Nachrichten öffnen","Gegenseitige Likes","Öffne die Gästebucheinstellungen des Profils zur Freigabe.","Bitte den Administrator um eine persönliche Einladung an deine bestätigte E-Mail-Adresse, um ein altes Profil zu übernehmen."],
lv:["Privātās ziņas nav pieejamas, kamēr īpašnieks nav piesaistījis kontu.","Aktivitāte","Nelasītas ziņas","Savstarpējas simpātijas","Viesu grāmatas ieraksti apstiprināšanai","Apmeklētāji pēdējās 30 dienās","Kopīgot manus apmeklējumus ar citiem dalībniekiem, kas piekrituši, un redzēt viņu apmeklējumus","Saglabāt iestatījumus","Nav apmeklētāju","Bloķēt dalībnieku","Atbloķēt dalībnieku","Bloķēt saziņu ar šo dalībnieku visās anketās?","Darbība neizdevās","Mani dati un privātums","Izveidot anketu","Mani sludinājumi","Atvērt ziņas","Savstarpējas simpātijas","Atveriet anketas viesu grāmatas iestatījumus, lai apstiprinātu ierakstus.","Lai atgūtu veco anketu, lūdziet administratoram personisku uzaicinājumu uz apstiprināto e-pastu."],
lt:["Asmeninės žinutės nepasiekiamos, kol savininkas neprijungė paskyros.","Aktyvumas","Neskaitytos žinutės","Abipusės simpatijos","Svečių knygos įrašai, laukiantys patvirtinimo","Lankytojai per 30 dienų","Rodyti mano apsilankymus kitiems sutikusiems nariams ir matyti jų apsilankymus","Išsaugoti nustatymus","Lankytojų nėra","Blokuoti narį","Atblokuoti narį","Blokuoti bendravimą su šiuo nariu visose anketose?","Veiksmas nepavyko","Mano duomenys ir privatumas","Sukurti anketą","Mano skelbimai","Atverti žinutes","Abipusės simpatijos","Atverkite anketos svečių knygos nustatymus ir patvirtinkite įrašus.","Norėdami atgauti seną anketą, paprašykite administratoriaus asmeninio kvietimo į patvirtintą el. paštą."],
et:["Privaatsõnumid pole saadaval, kuni omanik on konto ühendanud.","Aktiivsus","Lugemata sõnumid","Vastastikused meeldimised","Kinnitust ootavad külalisteraamatu sissekanded","Külastajad viimase 30 päeva jooksul","Jaga minu külastusi teiste nõustunud liikmetega ja näita nende külastusi","Salvesta seaded","Külastajaid pole","Blokeeri liige","Eemalda blokeering","Blokeerida suhtlus selle liikmega kõigis profiilides?","Toiming ebaõnnestus","Minu andmed ja privaatsus","Loo profiil","Minu kuulutused","Ava sõnumid","Vastastikused meeldimised","Sissekannete kinnitamiseks ava profiili külalisteraamatu seaded.","Vana profiili taastamiseks küsi administraatorilt isiklik kutse oma kinnitatud e-posti aadressile."]
};
const keys=["unavailable","activity","unread","matches","guestbook","visitors","consent","save","empty","block","unblock","confirm","error","data","create","mine","inbox","likes","guesthint","claim"];
const L=k=>(words[document.documentElement.lang]||words.en)[keys.indexOf(k)]||k;
window.mmMemberText=L;
const make=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;return e};
const btn=(txt,fn)=>{const b=make("button",txt,"btn btn-outline");b.type="button";b.onclick=fn;return b};
async function api(body,summary=false){const r=await fetch("/api/member-activity"+(summary?"?summary=1":""),body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"}:{cache:"no-store"});if(!r.ok)throw Error(L("error"));return r.json()}
let current=null,pending=false,activityBtn;
function badge(id,value){const b=document.getElementById(id);if(!b)return;const n=Number(value)||0;b.textContent=n>99?"99+":String(n);b.classList.toggle("hidden",n===0)}
async function refresh(){if(pending||document.hidden||!state.user)return;pending=true;try{current=await api(null,true);badge("inboxUnreadBadge",current.unread);badge("mmActivityBadge",current.new_matches+current.guestbook);if(activityBtn)activityBtn.title=L("matches")+": "+current.matches+" · "+L("guestbook")+": "+current.guestbook;}catch{}finally{pending=false}}
window.mmRefreshActivity=refresh;
function dashboard(root,data){
 root.replaceChildren();root.append(make("h3",L("activity")));
 const counts=make("div",null,"mm-activity-counts");
 for(const key of ["unread","matches","guestbook"]){const box=make("div");box.append(make("strong",String(data[key]||0)),make("small",L(key)));counts.append(box)}root.append(counts);
 const links=make("div",null,"mm-activity-links");
 const open=id=>{const m=document.getElementById("myModal");if(m?.open)m.close();document.getElementById(id)?.click()};
 links.append(btn(L("inbox"),()=>open("inboxBtn")),btn(L("likes"),async()=>{try{await api({action:"matches_seen"});refresh()}catch{}open("matchesBtn")}),btn(L("create"),()=>open("postBtn")));
 const privacy=make("a",L("data"),"btn btn-outline");privacy.href="/account-data.html";links.append(privacy);root.append(links,make("p",L("guesthint")),make("p",L("claim")));
 const label=make("label",null,"mm-community-check"),check=make("input");check.type="checkbox";check.checked=!!data.share_visits;label.append(check,document.createTextNode(" "+L("consent")));root.append(label);
 const status=make("p");status.setAttribute("role","status");
 root.append(btn(L("save"),async()=>{try{await api({action:"visits_setting",enabled:check.checked});current=await api();dashboard(root,current);refresh()}catch{status.textContent=L("error")}}),status);
 if(data.blocks?.length){root.append(make("h3",L("block")));for(const item of data.blocks)root.append(btn((item.display_name||"—")+" · "+L("unblock"),async()=>{try{await api({action:"unblock_id",block_id:item.id});dashboard(root,await api());refresh()}catch{status.textContent=L("error")}}))}
 if(data.share_visits){root.append(make("h3",L("visitors")));if(!data.visitors.length)root.append(make("p",L("empty")));for(const v of data.visitors){const b=btn(v.display_name+" · "+v.city+" · "+new Date(v.visited_at).toLocaleDateString(document.documentElement.lang),()=>{document.getElementById("myModal")?.close();window.mmOpenProfile(v.profile_id)});root.append(b)}}
}
window.mmMountDashboard=async function(){const parent=document.getElementById("myContent");if(!parent)return;const root=make("section",L("activity"),"mm-community mm-dashboard");parent.prepend(root);try{current=await api();if(root.isConnected){dashboard(root,current);window.mmMountStats?.(root.parentElement);window.mmMountPush?.(root.parentElement);window.mmMountEngagement?.(root.parentElement);window.mmMountSupport?.(root.parentElement)}refresh()}catch{root.textContent=L("error")}};
window.mmProfileActivity=async function(id,content){
 try{
 if(!await getSession()||!content.isConnected)return;
 const target=content.querySelector(".profile-actions");if(!target)return;
 const button=btn(L("block"),()=>{});button.hidden=true;target.append(button);
 const d=await api({action:"block_status",listing_id:id});if(!button.isConnected||!d.can_block){button.remove();return}
 let blocked=d.blocked;button.textContent=L(blocked?"unblock":"block");button.hidden=false;
 button.onclick=async()=>{if(!blocked&&!confirm(L("confirm")))return;button.disabled=true;try{await api({action:blocked?"unblock":"block",listing_id:id});blocked=!blocked;button.textContent=L(blocked?"unblock":"block");refresh()}catch{toast(L("error"))}finally{button.disabled=false}};
 if(button.isConnected&&document.getElementById("profileModal")?.open)await api({action:"visit",listing_id:id});
 }catch{}
};
document.addEventListener("DOMContentLoaded",async()=>{
 const nav=document.querySelector(".nav-actions");if(!nav)return;
 activityBtn=btn("♧ "+L("activity"),()=>showMy());activityBtn.className="nav-shortcut";
 const b=make("b","0","nav-unread hidden");b.id="mmActivityBadge";activityBtn.append(b);nav.append(activityBtn);
 state.user=await getSession();if(!state.user){activityBtn.hidden=true;return}
 refresh();setInterval(refresh,30000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
});
})();
