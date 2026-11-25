import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,browserLocalPersistence,setPersistence,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {sendVerificationWithFallback,verifiedToken} from "./email-flow.js?v=20261125-email";

const requested=new URLSearchParams(location.search).get("next")||"/";
let destination="/";
try { const back=new URL(requested,location.origin); if(back.origin===location.origin) destination=back.pathname+back.search+back.hash; } catch {}
const langMatch=destination.match(/^\/(en|de|lv|lt|et)\//);
const locale=langMatch?.[1]||"ru";
const labels={"Регистрация":["Registracija","Registreerimine"],"Вход":["Prisijungimas","Sisselogimine"],"Создать аккаунт":["Sukurti paskyrą","Loo konto"],"Войти":["Prisijungti","Logi sisse"],"Уже есть аккаунт?":["Jau turite paskyrą?","Konto on juba olemas?"],"Нет аккаунта?":["Neturite paskyros?","Kontot pole?"],"Зарегистрироваться":["Registruotis","Registreeru"],"Минимум 12 символов":["Bent 12 ženklų","Vähemalt 12 tähemärki"],"Электронная почта":["El. paštas","E-post"],"Пароль":["Slaptažodis","Parool"],"Забыли пароль?":["Pamiršote slaptažodį?","Unustasid parooli?"],"или":["arba","või"],"Продолжить с Google":["Tęsti su Google","Jätka Google'iga"],"Письмо отправлено. Подтвердите адрес по ссылке и войдите снова.":["Laiškas išsiųstas. Patvirtinkite adresą paspaudę nuorodą ir vėl prisijunkite.","Kiri saadetud. Kinnita aadress lingi kaudu ja logi uuesti sisse."],"Проверьте почту и пароль.":["Patikrinkite el. paštą ir slaptažodį.","Kontrolli e-posti ja parooli."],"Выберите более длинный пароль.":["Pasirinkite ilgesnį slaptažodį.","Vali pikem parool."],"Этот адрес уже зарегистрирован. Войдите или восстановите пароль.":["Šis adresas jau registruotas. Prisijunkite arba atkurkite slaptažodį.","See aadress on juba registreeritud. Logi sisse või taasta parool."],"Разрешите открытие окна Google в браузере.":["Leiskite naršyklėje atverti Google langą.","Luba brauseris Google'i hüpikaken."],"Вход через Google отменён.":["Prisijungimas per Google atšauktas.","Google'iga sisselogimine tühistati."],"Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору.":["Adresas murdilimax.com turi būti leidžiamas Firebase Authentication. Praneškite administratoriui.","Aadress murdilimax.com peab olema Firebase Authenticationis lubatud. Teavita administraatorit."],"Этот способ входа пока не включён.":["Šis prisijungimo būdas dar neįjungtas.","See sisselogimisviis pole veel lubatud."],"Проверьте подключение к интернету.":["Patikrinkite interneto ryšį.","Kontrolli internetiühendust."],"Слишком много попыток. Попробуйте позже.":["Per daug bandymų. Bandykite vėliau.","Liiga palju katseid. Proovi hiljem."],"Не удалось завершить вход. Попробуйте ещё раз.":["Nepavyko prisijungti. Bandykite dar kartą.","Sisselogimine ebaõnnestus. Proovi uuesti."],"Если адрес зарегистрирован, вы получите письмо для смены пароля.":["Jei adresas registruotas, gausite slaptažodžio keitimo laišką.","Kui aadress on registreeritud, saad parooli muutmise kirja."]};
const western={"Регистрация":["Registration","Registrierung","Reģistrācija"],"Вход":["Sign in","Anmelden","Pieteikšanās"],"Создать аккаунт":["Create account","Konto erstellen","Izveidot kontu"],"Войти":["Sign in","Anmelden","Pieteikties"],"Уже есть аккаунт?":["Already have an account?","Bereits ein Konto?","Jau ir konts?"],"Нет аккаунта?":["No account yet?","Noch kein Konto?","Nav konta?"],"Зарегистрироваться":["Register","Registrieren","Reģistrēties"],"Минимум 12 символов":["At least 12 characters","Mindestens 12 Zeichen","Vismaz 12 rakstzīmes"],"Электронная почта":["Email","E-Mail","E-pasts"],"Пароль":["Password","Passwort","Parole"],"Забыли пароль?":["Forgot password?","Passwort vergessen?","Aizmirsi paroli?"],"или":["or","oder","vai"],"Продолжить с Google":["Continue with Google","Mit Google fortfahren","Turpināt ar Google"],"Письмо отправлено. Подтвердите адрес по ссылке и войдите снова.":["Email sent. Verify your address using the link and sign in again.","E-Mail gesendet. Bestätige deine Adresse über den Link und melde dich erneut an.","Vēstule nosūtīta. Apstiprini adresi, izmantojot saiti, un piesakies vēlreiz."],"Проверьте почту и пароль.":["Check your email and password.","Prüfe E-Mail und Passwort.","Pārbaudi e-pastu un paroli."],"Выберите более длинный пароль.":["Choose a longer password.","Wähle ein längeres Passwort.","Izvēlies garāku paroli."],"Этот адрес уже зарегистрирован. Войдите или восстановите пароль.":["This address is registered. Sign in or reset your password.","Diese Adresse ist bereits registriert. Melde dich an oder setze das Passwort zurück.","Šī adrese jau ir reģistrēta. Piesakies vai atjauno paroli."],"Разрешите открытие окна Google в браузере.":["Allow the Google popup in your browser.","Erlaube das Google-Popup im Browser.","Atļauj Google uznirstošo logu pārlūkā."],"Вход через Google отменён.":["Google sign-in cancelled.","Google-Anmeldung abgebrochen.","Pieteikšanās ar Google atcelta."],"Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору.":["The domain must be authorized in Firebase Authentication. Contact the administrator.","Die Domain muss in Firebase Authentication zugelassen sein. Kontaktiere den Administrator.","Domēnam jābūt atļautam Firebase Authentication. Sazinies ar administratoru."],"Этот способ входа пока не включён.":["This sign-in method is not enabled yet.","Diese Anmeldemethode ist noch nicht aktiviert.","Šī pieteikšanās metode vēl nav ieslēgta."],"Проверьте подключение к интернету.":["Check your internet connection.","Prüfe deine Internetverbindung.","Pārbaudi interneta savienojumu."],"Слишком много попыток. Попробуйте позже.":["Too many attempts. Try again later.","Zu viele Versuche. Versuche es später erneut.","Pārāk daudz mēģinājumu. Mēģini vēlāk."],"Не удалось завершить вход. Попробуйте ещё раз.":["Could not sign in. Try again.","Anmeldung fehlgeschlagen. Versuche es erneut.","Neizdevās pieteikties. Mēģini vēlreiz."],"Если адрес зарегистрирован, вы получите письмо для смены пароля.":["If the address is registered, you will receive a password reset email.","Wenn die Adresse registriert ist, erhältst du eine E-Mail zum Zurücksetzen des Passworts.","Ja adrese ir reģistrēta, saņemsi vēstuli paroles maiņai."]};
const tr=s=>locale==="ru"?s:locale==="lt"||locale==="et"?(labels[s]?.[locale==="lt"?0:1]||s):(western[s]?.[["en","de","lv"].indexOf(locale)]||s);
document.documentElement.lang=locale;
document.title=tr("Вход")+" · MurdiliMax";
for(const [selector,label] of [["#title","Вход"],["label[for=email]","Электронная почта"],["label[for=password]","Пароль"],["#submit","Войти"],["#reset","Забыли пароль?"],[".or","или"],["#google","Продолжить с Google"],["#prompt","Нет аккаунта?"],["#switchMode","Зарегистрироваться"]]){
 const node=document.querySelector(selector);if(node)node.textContent=tr(label);
}
const brand=document.querySelector(".brand");if(brand&&locale!=="ru")brand.href="/"+locale+"/";

const form=document.querySelector("#account");
const email=document.querySelector("#email");
const password=document.querySelector("#password");
const status=document.querySelector("#status");
const flowLabels={"ru":["Войти","Регистрация по email","Новый пользователь? Выберите «Регистрация по email».","Подтвердите электронную почту","Письмо отправлено. Откройте ссылку в письме. Если его нет, проверьте спам и нажмите «Отправить повторно».","Отправить повторно","Я подтвердил почту","Адрес ещё не подтверждён. Откройте ссылку в письме.","Аккаунт создан, но отправить письмо не удалось. Попробуйте повторно.","Не удалось войти. Если у вас ещё нет аккаунта, выберите регистрацию по email.","Повторная отправка доступна через минуту.","Вход или регистрация по email временно недоступны. Сообщите администратору.","Не удалось завершить регистрацию. Проверьте адрес и пароль (не менее 12 символов).","Адрес электронной почты","Использовать другой аккаунт"],"en":["Sign in","Register with email","New here? Select Register with email.","Verify your email","Email sent. Open the link in the message. If it is missing, check spam and select Resend.","Resend email","I verified my email","Email not yet verified. Open the link in the message.","Account created, but the email could not be sent. Try resending.","Could not sign in. If you are new, select Register with email.","You can resend after one minute.","Email sign-in or registration is temporarily unavailable. Contact the administrator.","Could not register. Check the email and password (at least 12 characters).","Email address","Use another account"],"de":["Anmelden","Mit E-Mail registrieren","Neu hier? Wählen Sie die E-Mail-Registrierung.","E-Mail bestätigen","E-Mail gesendet. Öffnen Sie den Link. Prüfen Sie ggf. den Spam-Ordner und senden Sie erneut.","Erneut senden","E-Mail bestätigt","E-Mail noch nicht bestätigt. Öffnen Sie den Link in der Nachricht.","Konto erstellt, aber E-Mail konnte nicht gesendet werden. Erneut versuchen.","Anmeldung fehlgeschlagen. Neue Nutzer wählen E-Mail-Registrierung.","Erneutes Senden nach einer Minute möglich.","E-Mail-Anmeldung oder Registrierung derzeit nicht verfügbar. Kontaktieren Sie den Administrator.","Registrierung fehlgeschlagen. Prüfen Sie E-Mail und Passwort (mindestens 12 Zeichen).","E-Mail-Adresse","Anderes Konto verwenden"],"lv":["Pieteikties","Reģistrēties ar e-pastu","Jauns lietotājs? Izvēlieties reģistrāciju ar e-pastu.","Apstipriniet e-pastu","Vēstule nosūtīta. Atveriet saiti vēstulē. Pārbaudiet surogātpastu un, ja vajag, nosūtiet vēlreiz.","Nosūtīt vēlreiz","E-pasts apstiprināts","E-pasts vēl nav apstiprināts. Atveriet saiti vēstulē.","Konts izveidots, bet vēstuli neizdevās nosūtīt. Mēģiniet vēlreiz.","Neizdevās pieteikties. Ja jums nav konta, izvēlieties reģistrāciju ar e-pastu.","Atkārtota nosūtīšana pēc minūtes.","E-pasta reģistrācija vai pieteikšanās īslaicīgi nav pieejama. Sazinieties ar administratoru.","Reģistrācija neizdevās. Pārbaudiet e-pastu un paroli (vismaz 12 rakstzīmes).","E-pasta adrese","Izmantot citu kontu"],"lt":["Prisijungti","Registruotis el. paštu","Naujas naudotojas? Pasirinkite registraciją el. paštu.","Patvirtinkite el. paštą","Laiškas išsiųstas. Atidarykite nuorodą. Jei laiško nėra, patikrinkite šlamštą ir siųskite dar kartą.","Siųsti dar kartą","Patvirtinau el. paštą","El. paštas dar nepatvirtintas. Atidarykite nuorodą laiške.","Paskyra sukurta, bet laiško išsiųsti nepavyko. Bandykite dar kartą.","Nepavyko prisijungti. Jei neturite paskyros, registruokitės el. paštu.","Pakartotinai siųsti galima po minutės.","Registracija arba prisijungimas el. paštu laikinai nepasiekiami. Susisiekite su administratoriumi.","Registracija nepavyko. Patikrinkite el. paštą ir slaptažodį (bent 12 ženklų).","El. pašto adresas","Naudoti kitą paskyrą"],"et":["Logi sisse","Registreeru e-postiga","Uus kasutaja? Vali e-postiga registreerumine.","Kinnita e-post","Kiri saadetud. Ava kirjas olev link. Kui kirja pole, kontrolli rämpsposti ja saada uuesti.","Saada uuesti","Kinnitasin e-posti","E-post pole veel kinnitatud. Ava kirjas olev link.","Konto loodi, kuid kirja saatmine ebaõnnestus. Proovi uuesti.","Sisselogimine ebaõnnestus. Kui sul pole kontot, registreeru e-postiga.","Uuesti saab saata minuti pärast.","E-postiga sisselogimine või registreerimine pole hetkel saadaval. Võta ühendust administraatoriga.","Registreerimine ebaõnnestus. Kontrolli e-posti ja parooli (vähemalt 12 märki).","E-posti aadress","Kasuta teist kontot"]};
const L=flowLabels[locale]||flowLabels.ru;
let registering=false;
const modeButton=document.querySelector("#switchMode");
const loginMode=document.querySelector("#loginMode"),registerMode=document.querySelector("#registerMode"),panel=document.querySelector("#verifyPanel");
loginMode.textContent=L[0];registerMode.textContent=L[1];document.querySelector("#modeHint").textContent=L[2];document.querySelector("#verifyTitle").textContent=L[3];document.querySelector("#resend").textContent=L[5];document.querySelector("#checkVerified").textContent=L[6];document.querySelector("#otherAccount").textContent=L[14];
function setMode(value){
  registering=value;
  document.title=(registering?tr("Регистрация"):tr("Вход"))+" · MurdiliMax";
  document.querySelector("#title").textContent=registering?tr("Регистрация"):tr("Вход");
  document.querySelector("#submit").textContent=registering?tr("Создать аккаунт"):tr("Войти");
  document.querySelector("#prompt").textContent=registering?tr("Уже есть аккаунт?"):tr("Нет аккаунта?");
  modeButton.textContent=registering?tr("Войти"):tr("Зарегистрироваться");
  loginMode.setAttribute("aria-pressed",String(!registering));registerMode.setAttribute("aria-pressed",String(registering));
  password.autocomplete=registering?"new-password":"current-password";
  password.minLength=registering?12:0;
  password.placeholder=registering?tr("Минимум 12 символов"):"";
  document.querySelector("#reset").hidden=registering||!panel.hidden;
  status.textContent="";
}
modeButton.onclick=()=>setMode(!registering);loginMode.onclick=()=>setMode(false);registerMode.onclick=()=>setMode(true);
setMode(new URLSearchParams(location.search).get("mode")==="register");
const config=await fetch("/auth/config").then(response=>response.json());
const auth=getAuth(initializeApp(config));
auth.languageCode=locale;
await setPersistence(auth,browserLocalPersistence);


const emailAction={url:location.origin+"/login?next="+encodeURIComponent(destination)};
let lastSent=0;
function showVerification(user){panel.hidden=false;form.hidden=true;document.querySelector("#reset").hidden=true;document.querySelector("#verifyAddress").textContent=L[13]+": "+(user.email||"");}
async function deliver(user){
  showVerification(user);
  if(Date.now()-lastSent<60000){status.textContent=L[10];return;}
  try{await sendVerificationWithFallback(sendEmailVerification,user,emailAction);lastSent=Date.now();status.textContent=L[4];}
  catch(error){console.warn("Firebase verification email:",error?.code||"unknown");status.textContent=L[8]+(error?.code==="auth/too-many-requests"?" "+tr("Слишком много попыток. Попробуйте позже."):"");}
}
async function finish(user,{send=true}={}){
  const token=await verifiedToken(user);
  if(!token){showVerification(user);if(send)await deliver(user);else status.textContent=L[7];return;}
  const response=await fetch("/auth/session",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({idToken:token})
  });
  if(!response.ok)throw new Error("session");
  location.replace("/login?next="+encodeURIComponent(destination));
}
async function run(action){
  status.textContent="";
  const buttons=document.querySelectorAll("button");
  buttons.forEach(button=>button.disabled=true);
  try{await action()}catch(error){
    const messages={"auth/invalid-credential":registering?L[12]:L[9],"auth/user-not-found":L[9],"auth/wrong-password":L[9],"auth/invalid-email":registering?L[12]:L[9],"auth/admin-restricted-operation":L[11],"auth/weak-password":tr("Выберите более длинный пароль."),"auth/email-already-in-use":tr("Этот адрес уже зарегистрирован. Войдите или восстановите пароль."),"auth/popup-blocked":tr("Разрешите открытие окна Google в браузере."),"auth/popup-closed-by-user":tr("Вход через Google отменён."),"auth/unauthorized-domain":tr("Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору."),"auth/operation-not-allowed":L[11],"auth/network-request-failed":tr("Проверьте подключение к интернету."),"auth/too-many-requests":tr("Слишком много попыток. Попробуйте позже.")};
    console.warn("Ошибка входа Firebase:",error?.code||"unknown");
    status.textContent=messages[error.code]||(registering?L[12]:tr("Не удалось завершить вход. Попробуйте ещё раз."));
  }finally{buttons.forEach(button=>button.disabled=false)}
}
const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:"select_account"});
document.querySelector("#google").onclick=()=>run(async()=>finish((await signInWithPopup(auth,googleProvider)).user));
form.onsubmit=event=>{
  event.preventDefault();
  const sign=registering?createUserWithEmailAndPassword:signInWithEmailAndPassword;
  run(async()=>finish((await sign(auth,email.value.trim(),password.value)).user));
};
document.querySelector("#reset").onclick=()=>{
  if(!email.reportValidity())return;
  run(async()=>{await sendPasswordResetEmail(auth,email.value.trim(),emailAction);status.textContent=tr("Если адрес зарегистрирован, вы получите письмо для смены пароля.")});
};

document.querySelector("#resend").onclick=()=>run(async()=>{const user=auth.currentUser;if(!user)throw new Error("session");const token=await verifiedToken(user);if(token)return finish(user,{send:false});await deliver(user);});
document.querySelector("#checkVerified").onclick=()=>run(async()=>{const user=auth.currentUser;if(!user)throw new Error("session");await finish(user,{send:false});});
document.querySelector("#otherAccount").onclick=()=>run(async()=>{await signOut(auth);lastSent=0;panel.hidden=true;form.hidden=false;password.value="";setMode(false);});
await auth.authStateReady();
if(auth.currentUser&&!auth.currentUser.emailVerified){showVerification(auth.currentUser);status.textContent=L[7];}
