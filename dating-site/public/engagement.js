(()=>{
const words={"ru":["Поднять анкету бесплатно","Следующее поднятие через 24 часа","Анкета поднята","Режим инкогнито","Скрыть онлайн-статус и посещения. После выключения включите видимость и посещения отдельно.","Сохранить","Приватный альбом","Запросить доступ","Запрос отправлен","Открыть фото","Добавить фото","Разрешить","Отозвать доступ","Удалить фото","Поддержка","Тема","Сообщение","Отправить обращение","Ответ администратора","Ожидает ответа","Действие недоступно или превышен лимит","Обращение отправлено","Удалить фото навсегда?","Реакции","Убрать реакцию","Размещайте только разрешённые фотографии совершеннолетних. Откровенные и нежелательные материалы запрещены."],"en":["Bump profile for free","Next bump after 24 hours","Profile bumped","Incognito mode","Hide online status and visits. After disabling, enable visibility and visits separately.","Save","Private album","Request access","Request sent","Open photo","Add photo","Allow","Revoke access","Delete photo","Support","Subject","Message","Send ticket","Administrator reply","Awaiting reply","Action unavailable or limit reached","Ticket sent","Delete photo permanently?","Reactions","Remove reaction","Only upload authorized photos of adults. Explicit or unwanted material is prohibited."],"de":["Profil kostenlos hochschieben","Nächste Anhebung nach 24 Stunden","Profil hochgeschoben","Inkognito-Modus","Online-Status und Besuche verbergen. Sichtbarkeit und Besuche danach separat aktivieren.","Speichern","Privates Album","Zugang anfragen","Anfrage gesendet","Foto öffnen","Foto hinzufügen","Erlauben","Zugang widerrufen","Foto löschen","Support","Betreff","Nachricht","Anfrage senden","Antwort der Administration","Wartet auf Antwort","Aktion nicht verfügbar oder Limit erreicht","Anfrage gesendet","Foto endgültig löschen?","Reaktionen","Reaktion entfernen","Nur erlaubte Fotos Erwachsener hochladen. Explizite oder unerwünschte Inhalte sind verboten."],"lv":["Pacelt anketu bez maksas","Nākamā pacelšana pēc 24 stundām","Anketa pacelta","Inkognito režīms","Paslēpt tiešsaistes statusu un apmeklējumus. Pēc izslēgšanas ieslēdziet tos atsevišķi.","Saglabāt","Privātais albums","Pieprasīt piekļuvi","Pieprasījums nosūtīts","Atvērt foto","Pievienot foto","Atļaut","Atsaukt piekļuvi","Dzēst foto","Atbalsts","Temats","Ziņa","Nosūtīt pieprasījumu","Administratora atbilde","Gaida atbildi","Darbība nav pieejama vai sasniegts limits","Pieprasījums nosūtīts","Dzēst foto neatgriezeniski?","Reakcijas","Noņemt reakciju","Augšupielādējiet tikai atļautus pilngadīgo foto. Nepiedienīgi un nevēlami attēli aizliegti."],"lt":["Nemokamai pakelti anketą","Kitas pakėlimas po 24 valandų","Anketa pakelta","Inkognito režimas","Slėpti prisijungimo būseną ir apsilankymus. Išjungę įjunkite juos atskirai.","Išsaugoti","Privatus albumas","Prašyti prieigos","Prašymas išsiųstas","Atverti nuotrauką","Pridėti nuotrauką","Leisti","Atšaukti prieigą","Ištrinti nuotrauką","Pagalba","Tema","Žinutė","Siųsti užklausą","Administratoriaus atsakymas","Laukiama atsakymo","Veiksmas negalimas arba pasiekta riba","Užklausa išsiųsta","Ištrinti nuotrauką visam laikui?","Reakcijos","Pašalinti reakciją","Įkelkite tik leistinas suaugusiųjų nuotraukas. Nepadorūs ir nepageidaujami vaizdai draudžiami."],"et":["Tõsta profiil tasuta üles","Järgmine tõstmine 24 tunni pärast","Profiil tõstetud","Inkognito režiim","Peida võrgusolek ja külastused. Pärast väljalülitamist luba need eraldi.","Salvesta","Privaatalbum","Taotle ligipääsu","Taotlus saadetud","Ava foto","Lisa foto","Luba","Tühista ligipääs","Kustuta foto","Tugi","Teema","Sõnum","Saada päring","Administraatori vastus","Ootab vastust","Toiming pole saadaval või piir täis","Päring saadetud","Kustutada foto jäädavalt?","Reaktsioonid","Eemalda reaktsioon","Laadi üles ainult lubatud täiskasvanute fotod. Sündsusetud ja soovimatud pildid on keelatud."]},W=i=>(words[document.documentElement.lang]||words.en)[i];
window.mmEngagementText=W;
const el=(tag,txt)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;return n};
const btn=(txt,fn)=>{const b=el('button',txt);b.type='button';b.className='btn btn-outline';b.onclick=fn;return b};
async function api(path,data){const r=await fetch('/api/'+path,data instanceof FormData?{method:'POST',body:data,cache:'no-store'}:data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'}:{cache:'no-store'});if(!r.ok)throw Object.assign(Error(W(20)),{status:r.status});return r.json()}
function section(title){const b=el('section');b.className='mm-community mm-engagement';b.append(el('h3',title));return b}
function msg(box){const m=el('p');m.setAttribute('role','status');box.append(m);return m}
async function busy(button,notice,fn){button.disabled=true;try{await fn()}catch(e){notice.textContent=e.message}finally{if(button.isConnected)button.disabled=false}}
window.mmMountEngagement=async(root)=>{
 const box=section(W(3)),notice=msg(box);root.prepend(box);
 try{const d=await api('engagement');const label=el('label'),check=el('input');check.type='checkbox';check.checked=d.incognito;label.append(check,document.createTextNode(' '+W(3)));box.append(label,el('p',W(4)));
 const save=btn(W(5),()=>busy(save,notice,async()=>{await api('engagement',{action:'incognito',enabled:check.checked});notice.textContent='✓';await showMy();loadListings()}));box.append(save);
 for(const row of document.querySelectorAll('#myContent .my-item')){const item=row.querySelector('[data-mm-listing]');if(!item)continue;const bump=d.bumps.find(x=>x.id===item.dataset.mmListing);if(!bump)continue;const b=btn(bump.can_bump?W(0):W(1),()=>busy(b,notice,async()=>{await api('engagement',{action:'bump',listing_id:bump.id});notice.textContent=W(2);await showMy();loadListings()}));b.disabled=!bump.can_bump;row.append(b)}
 }catch(e){notice.textContent=e.message}
};
window.mmMountAlbum=async(id,root,owner=false)=>{
 const box=section(W(6));root.append(box);const refresh=async()=>{
  const d=await api('private-album?listing_id='+encodeURIComponent(id));if(!box.isConnected)return;
  if(!d.owner&&!d.count){box.remove();return}box.replaceChildren(el('h3',W(6)+' · '+d.count));const notice=msg(box);
  const act=(action,extra={})=>api('private-album',{action,listing_id:id,...extra});
  for(const p of d.photos){const row=el('div');const link=el('a',W(9));link.className='btn btn-outline';link.target='_blank';link.rel='noopener noreferrer';link.href='/api/private-album?listing_id='+encodeURIComponent(id)+'&photo_id='+encodeURIComponent(p.id);row.append(link);if(d.owner){const del=btn(W(13),()=>{if(confirm(W(22)))busy(del,notice,async()=>{await act('delete',{photo_id:p.id});await refresh()})});row.append(del)}box.append(row)}
  if(d.owner){
   const input=el('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';const upload=btn(W(10),()=>busy(upload,notice,async()=>{const file=input.files[0];if(!file||file.size>4194304||!confirm(W(25)))return;const fd=new FormData();fd.set('action','upload');fd.set('listing_id',id);fd.set('photo',file);await api('private-album',fd);await refresh()}));box.append(el('p',W(25)),input,upload);
   for(const r of d.requests){const row=el('div');row.append(el('strong',r.display_name));const b=btn(r.approved?W(12):W(11),()=>busy(b,notice,async()=>{await act(r.approved?'revoke':'grant',{request_id:r.request_id});await refresh()}));row.append(b);box.append(row)}
  }else if(!d.approved){const b=btn(d.pending?W(8):W(7),()=>busy(b,notice,async()=>{await act('request');await refresh()}));b.disabled=d.pending;box.append(b)}
 };
 try{if(!owner&&!await getSession()){box.remove();return}await refresh()}catch{box.remove()}
};
window.mmMountSupport=async(root, onSignInRequired)=>{
 const box=section(W(14));root.append(box);const refresh=async()=>{
  const d=await api('support');if(!box.isConnected)return;box.replaceChildren(el('h3',W(14)));const notice=msg(box);
  const subject=el('input');subject.placeholder=W(15);subject.maxLength=100;subject.setAttribute('aria-label',W(15));
  const body=el('textarea');body.placeholder=W(16);body.maxLength=2000;body.setAttribute('aria-label',W(16));
  const send=btn(W(17),()=>busy(send,notice,async()=>{await api('support',{subject:subject.value,body:body.value});await refresh()}));if(root.id==='support'){
    const subjectLabel=el('label',W(15)),bodyLabel=el('label',W(16));
    subject.placeholder='';body.placeholder='';
    subjectLabel.append(subject);bodyLabel.append(body);
    box.append(subjectLabel,bodyLabel,send);
  }else{box.append(subject,body,send)}
  for(const t of d.tickets){const row=el('article');row.append(el('strong',t.subject),el('p',t.body),el('p',t.reply?W(18)+': '+t.reply:W(19)));box.append(row)}
 };try{await refresh()}catch(e){if(e.status===401 && onSignInRequired){onSignInRequired();return}box.append(el('p',e.message))}
};
})();

async function openSupportFromLink() {
  if (new URLSearchParams(location.search).get('support') !== '1') return;
  const gate = document.getElementById('ageGate');
  if (gate && !gate.classList.contains('dismissed')) {
    document.getElementById('enterAge').addEventListener('click', openSupportFromLink, {once:true});
    return;
  }
  await window.MM_authReady;
  const dialog = document.createElement('dialog');
  dialog.id = 'support';
  dialog.setAttribute('aria-label', window.mmEngagementText(14));
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'support-close';
  close.textContent = '×';
  const labels = {ru:'Закрыть', en:'Close', de:'Schließen', lv:'Aizvērt', lt:'Uždaryti', et:'Sulge'};
  close.setAttribute('aria-label', labels[document.documentElement.lang] || labels.en);
  close.onclick = () => dialog.close();
  dialog.append(close);
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    const url = new URL(location.href);
    url.searchParams.delete('support');
    url.hash = '';
    history.replaceState(history.state, '', url);
    dialog.remove();
    document.querySelector('a[href="?support=1#support"]')?.focus();
  }, {once:true});
  dialog.showModal();
  await window.mmMountSupport(dialog, () => location.assign(loginPath()));
}
window.addEventListener('DOMContentLoaded', openSupportFromLink);
