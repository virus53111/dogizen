(()=>{
const labels={"ru":["Пригласить друзей","Поделитесь персональной ссылкой с друзьями.","Копировать ссылку","Поделиться","Войти","Скопировано","Не удалось загрузить ссылку. Повторите попытку.","Повторить","В каталог"],"en":["Invite friends","Share your personal invitation link with friends.","Copy link","Share","Sign in","Copied","Could not load the link. Try again.","Retry","Back to catalog"],"de":["Freunde einladen","Teile deinen persönlichen Einladungslink mit Freunden.","Link kopieren","Teilen","Anmelden","Kopiert","Link konnte nicht geladen werden.","Erneut versuchen","Zum Katalog"],"lv":["Uzaicināt draugus","Dalies ar savu personīgo uzaicinājuma saiti.","Kopēt saiti","Dalīties","Ienākt","Nokopēts","Neizdevās ielādēt saiti.","Mēģināt vēlreiz","Uz katalogu"],"lt":["Pakviesti draugus","Pasidalinkite asmenine kvietimo nuoroda.","Kopijuoti nuorodą","Dalintis","Prisijungti","Nukopijuota","Nepavyko įkelti nuorodos.","Bandyti dar kartą","Į katalogą"],"et":["Kutsu sõpru","Jaga sõpradega oma isiklikku kutselinki.","Kopeeri link","Jaga","Logi sisse","Kopeeritud","Linki ei õnnestunud laadida.","Proovi uuesti","Kataloogi"]};
const lang=new URLSearchParams(location.search).get('lang');
const L=Object.hasOwn(labels,lang)?labels[lang]:labels.ru,$=id=>document.getElementById(id);
document.documentElement.lang=Object.hasOwn(labels,lang)?lang:'ru';
document.title=L[0]+' · MurdiliMax';
for(const [id,i] of Object.entries({title:0,description:1,copy:2,share:3,login:4,retry:7,home:8}))$(id).textContent=L[i];
$('home').href=lang&&lang!=='ru'&&Object.hasOwn(labels,lang)?'/'+lang+'/':'/';
$('login').href='/login?next='+encodeURIComponent(location.pathname+location.search);
let loading=false;
async function load(){
 if(loading)return;loading=true;$('retry').hidden=true;$('status').textContent='';
 try{await window.MM_authReady;const r=await fetch('/api/invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});
 if(r.status===401){$('login').hidden=false;$('inviteBox').hidden=true;return}
 if(!r.ok)throw Error();const d=await r.json();if(!/^[a-f0-9-]{36}$/i.test(d.code||''))throw Error();
 const u=new URL($('home').href);u.searchParams.set('ref',d.code);$('inviteLink').value=u.href;
 $('login').hidden=true;$('inviteBox').hidden=false;$('share').hidden=!navigator.share;
 }catch{$('status').textContent=L[6];$('retry').hidden=false}finally{loading=false}
}
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('inviteLink').value);$('status').textContent=L[5]}catch{$('inviteLink').select();try{if(document.execCommand('copy'))$('status').textContent=L[5]}catch{}}};
$('share').onclick=async()=>{try{await navigator.share({title:'MurdiliMax',url:$('inviteLink').value})}catch{}};
$('retry').onclick=load;window.addEventListener('mm:auth-session',load);void load();
})();
