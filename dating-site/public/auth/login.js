import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,browserLocalPersistence,setPersistence,signInWithCustomToken,reload} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {registerOrSignIn,sendResetWithFallback} from "./email-flow.js?v=20261125-recovery";
import {mountTelegram,requestTelegramConfirmation} from "./telegram.js";

const requested=new URLSearchParams(location.search).get("next")||"/";
let destination="/";
try { const back=new URL(requested,location.origin); if(back.origin===location.origin) destination=back.pathname+back.search+back.hash; } catch {}
const langMatch=destination.match(/^\/(en|de|lv|lt|et)\//);
const locale=langMatch?.[1]||"ru";
const telegramLink=new URLSearchParams(location.search).get("telegram")==="link";
const labels={"Регистрация":["Registracija","Registreerimine"],"Вход":["Prisijungimas","Sisselogimine"],"Создать аккаунт":["Sukurti paskyrą","Loo konto"],"Войти":["Prisijungti","Logi sisse"],"Уже есть аккаунт?":["Jau turite paskyrą?","Konto on juba olemas?"],"Нет аккаунта?":["Neturite paskyros?","Kontot pole?"],"Зарегистрироваться":["Registruotis","Registreeru"],"Минимум 12 символов":["Bent 12 ženklų","Vähemalt 12 tähemärki"],"Электронная почта":["El. paštas","E-post"],"Пароль":["Slaptažodis","Parool"],"Забыли пароль?":["Pamiršote slaptažodį?","Unustasid parooli?"],"или":["arba","või"],"Продолжить с Google":["Tęsti su Google","Jätka Google'iga"],"Проверьте почту и пароль.":["Patikrinkite el. paštą ir slaptažodį.","Kontrolli e-posti ja parooli."],"Выберите более длинный пароль.":["Pasirinkite ilgesnį slaptažodį.","Vali pikem parool."],"Этот адрес уже зарегистрирован. Войдите или восстановите пароль.":["Šis adresas jau registruotas. Prisijunkite arba atkurkite slaptažodį.","See aadress on juba registreeritud. Logi sisse või taasta parool."],"Разрешите открытие окна Google в браузере.":["Leiskite naršyklėje atverti Google langą.","Luba brauseris Google'i hüpikaken."],"Вход через Google отменён.":["Prisijungimas per Google atšauktas.","Google'iga sisselogimine tühistati."],"Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору.":["Adresas murdilimax.com turi būti leidžiamas Firebase Authentication. Praneškite administratoriui.","Aadress murdilimax.com peab olema Firebase Authenticationis lubatud. Teavita administraatorit."],"Этот способ входа пока не включён.":["Šis prisijungimo būdas dar neįjungtas.","See sisselogimisviis pole veel lubatud."],"Проверьте подключение к интернету.":["Patikrinkite interneto ryšį.","Kontrolli internetiühendust."],"Слишком много попыток. Попробуйте позже.":["Per daug bandymų. Bandykite vėliau.","Liiga palju katseid. Proovi hiljem."],"Не удалось завершить вход. Попробуйте ещё раз.":["Nepavyko prisijungti. Bandykite dar kartą.","Sisselogimine ebaõnnestus. Proovi uuesti."],"Если адрес зарегистрирован, вы получите письмо для смены пароля.":["Jei adresas registruotas, gausite slaptažodžio keitimo laišką.","Kui aadress on registreeritud, saad parooli muutmise kirja."]};
const western={"Регистрация":["Registration","Registrierung","Reģistrācija"],"Вход":["Sign in","Anmelden","Pieteikšanās"],"Создать аккаунт":["Create account","Konto erstellen","Izveidot kontu"],"Войти":["Sign in","Anmelden","Pieteikties"],"Уже есть аккаунт?":["Already have an account?","Bereits ein Konto?","Jau ir konts?"],"Нет аккаунта?":["No account yet?","Noch kein Konto?","Nav konta?"],"Зарегистрироваться":["Register","Registrieren","Reģistrēties"],"Минимум 12 символов":["At least 12 characters","Mindestens 12 Zeichen","Vismaz 12 rakstzīmes"],"Электронная почта":["Email","E-Mail","E-pasts"],"Пароль":["Password","Passwort","Parole"],"Забыли пароль?":["Forgot password?","Passwort vergessen?","Aizmirsi paroli?"],"или":["or","oder","vai"],"Продолжить с Google":["Continue with Google","Mit Google fortfahren","Turpināt ar Google"],"Проверьте почту и пароль.":["Check your email and password.","Prüfe E-Mail und Passwort.","Pārbaudi e-pastu un paroli."],"Выберите более длинный пароль.":["Choose a longer password.","Wähle ein längeres Passwort.","Izvēlies garāku paroli."],"Этот адрес уже зарегистрирован. Войдите или восстановите пароль.":["This address is registered. Sign in or reset your password.","Diese Adresse ist bereits registriert. Melde dich an oder setze das Passwort zurück.","Šī adrese jau ir reģistrēta. Piesakies vai atjauno paroli."],"Разрешите открытие окна Google в браузере.":["Allow the Google popup in your browser.","Erlaube das Google-Popup im Browser.","Atļauj Google uznirstošo logu pārlūkā."],"Вход через Google отменён.":["Google sign-in cancelled.","Google-Anmeldung abgebrochen.","Pieteikšanās ar Google atcelta."],"Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору.":["The domain must be authorized in Firebase Authentication. Contact the administrator.","Die Domain muss in Firebase Authentication zugelassen sein. Kontaktiere den Administrator.","Domēnam jābūt atļautam Firebase Authentication. Sazinies ar administratoru."],"Этот способ входа пока не включён.":["This sign-in method is not enabled yet.","Diese Anmeldemethode ist noch nicht aktiviert.","Šī pieteikšanās metode vēl nav ieslēgta."],"Проверьте подключение к интернету.":["Check your internet connection.","Prüfe deine Internetverbindung.","Pārbaudi interneta savienojumu."],"Слишком много попыток. Попробуйте позже.":["Too many attempts. Try again later.","Zu viele Versuche. Versuche es später erneut.","Pārāk daudz mēģinājumu. Mēģini vēlāk."],"Не удалось завершить вход. Попробуйте ещё раз.":["Could not sign in. Try again.","Anmeldung fehlgeschlagen. Versuche es erneut.","Neizdevās pieteikties. Mēģini vēlreiz."],"Если адрес зарегистрирован, вы получите письмо для смены пароля.":["If the address is registered, you will receive a password reset email.","Wenn die Adresse registriert ist, erhältst du eine E-Mail zum Zurücksetzen des Passworts.","Ja adrese ir reģistrēta, saņemsi vēstuli paroles maiņai."]};
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
const flowLabels={"ru":["Войти","Регистрация по email","","","","","","","","Не удалось войти. Если у вас ещё нет аккаунта, выберите регистрацию по email.","","Вход или регистрация по email временно недоступны. Сообщите администратору.","Не удалось завершить регистрацию. Проверьте адрес и пароль (не менее 12 символов).","",""],"en":["Sign in","Register with email","","","","","","","","Could not sign in. If you are new, select Register with email.","","Email sign-in or registration is temporarily unavailable. Contact the administrator.","Could not register. Check the email and password (at least 12 characters).","",""],"de":["Anmelden","Mit E-Mail registrieren","","","","","","","","Anmeldung fehlgeschlagen. Neue Nutzer wählen E-Mail-Registrierung.","","E-Mail-Anmeldung oder Registrierung derzeit nicht verfügbar. Kontaktieren Sie den Administrator.","Registrierung fehlgeschlagen. Prüfen Sie E-Mail und Passwort (mindestens 12 Zeichen).","",""],"lv":["Pieteikties","Reģistrēties ar e-pastu","","","","","","","","Neizdevās pieteikties. Ja jums nav konta, izvēlieties reģistrāciju ar e-pastu.","","E-pasta reģistrācija vai pieteikšanās īslaicīgi nav pieejama. Sazinieties ar administratoru.","Reģistrācija neizdevās. Pārbaudiet e-pastu un paroli (vismaz 12 rakstzīmes).","",""],"lt":["Prisijungti","Registruotis el. paštu","","","","","","","","Nepavyko prisijungti. Jei neturite paskyros, registruokitės el. paštu.","","Registracija arba prisijungimas el. paštu laikinai nepasiekiami. Susisiekite su administratoriumi.","Registracija nepavyko. Patikrinkite el. paštą ir slaptažodį (bent 12 ženklų).","",""],"et":["Logi sisse","Registreeru e-postiga","","","","","","","","Sisselogimine ebaõnnestus. Kui sul pole kontot, registreeru e-postiga.","","E-postiga sisselogimine või registreerimine pole hetkel saadaval. Võta ühendust administraatoriga.","Registreerimine ebaõnnestus. Kontrolli e-posti ja parooli (vähemalt 12 märki).","",""]};
const L=flowLabels[locale]||flowLabels.ru;
const instantLabels={"ru":["Введите email и пароль."],"en":["Enter your email and password."],"de":["Geben Sie E-Mail und Passwort ein."],"lv":["Ievadiet e-pastu un paroli."],"lt":["Įveskite el. paštą ir slaptažodį."],"et":["Sisesta e-post ja parool."]};
const I=instantLabels[locale]||instantLabels.ru;
const recoveryLabels={"ru":["Этот email уже зарегистрирован. Введите прежний пароль или нажмите «Забыли пароль?».","Запрос на восстановление принят. Если аккаунт существует, проверьте входящие и спам.","Не удалось отправить письмо для смены пароля. Повторите позже.","Введите email в поле выше."],"en":["This email is already registered. Enter your original password or select Forgot password.","Reset request accepted. If the account exists, check your inbox and spam.","Could not request a password reset. Try again later.","Enter your email above."],"de":["Diese E-Mail ist bereits registriert. Geben Sie Ihr bisheriges Passwort ein oder wählen Sie Passwort vergessen.","Anfrage angenommen. Falls das Konto existiert, prüfen Sie Posteingang und Spam.","Passwort-Reset konnte nicht angefordert werden. Versuchen Sie es später.","Geben Sie oben Ihre E-Mail ein."],"lv":["Šis e-pasts jau reģistrēts. Ievadiet iepriekšējo paroli vai izvēlieties Aizmirsāt paroli.","Pieprasījums pieņemts. Ja konts pastāv, pārbaudiet iesūtni un surogātpastu.","Neizdevās pieprasīt paroles maiņu. Mēģiniet vēlāk.","Ievadiet e-pastu augstāk."],"lt":["Šis el. paštas jau registruotas. Įveskite ankstesnį slaptažodį arba pasirinkite Pamiršote slaptažodį.","Užklausa priimta. Jei paskyra egzistuoja, patikrinkite gautuosius ir šlamštą.","Nepavyko pateikti slaptažodžio atkūrimo užklausos. Bandykite vėliau.","Įveskite el. paštą viršuje."],"et":["See e-post on juba registreeritud. Sisesta varasem parool või vali Unustasid parooli.","Taotlus vastu võetud. Kui konto on olemas, kontrolli postkasti ja rämpsposti.","Parooli lähtestamise taotlus ebaõnnestus. Proovi hiljem.","Sisesta ülal oma e-post."]};
const R=recoveryLabels[locale]||recoveryLabels.ru;
let registering=false;
const modeButton=document.querySelector("#switchMode");
const loginMode=document.querySelector("#loginMode"),registerMode=document.querySelector("#registerMode");
loginMode.textContent=L[0];registerMode.textContent=L[1];document.querySelector("#modeHint").textContent=I[0];
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
  document.querySelector("#reset").hidden=false;
  status.textContent="";
}
modeButton.onclick=()=>setMode(!registering);loginMode.onclick=()=>setMode(false);registerMode.onclick=()=>setMode(true);
setMode(new URLSearchParams(location.search).get("mode")==="register");
const config=await fetch("/auth/config").then(response=>response.json());
const sameOriginGoogle=config.authDomain==="murdilimax.com"&&location.origin==="https://murdilimax.com";
const googleRedirectKey="mm-google-redirect";
const auth=getAuth(initializeApp(config));
auth.languageCode=locale;
await setPersistence(auth,browserLocalPersistence);


const emailAction={url:location.origin+"/login?next="+encodeURIComponent(destination)};
async function establishSession(user){
  const token=await user.getIdToken(true);
  const response=await fetch("/auth/session",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({idToken:token})
  });
  if(!response.ok)throw new Error("session");
}
async function finish(user){
  await establishSession(user);
  if(telegramLink){location.reload();return;}
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
const startGooglePopup=()=>run(async()=>finish((await signInWithPopup(auth,googleProvider)).user));
const googleButton=document.querySelector("#google");
googleButton.onclick=startGooglePopup;
if(sameOriginGoogle){
  const popup=document.querySelector("#googlePopup");
  popup.textContent=({ru:"Открыть Google в отдельном окне",de:"Google in separatem Fenster öffnen",lv:"Atvērt Google atsevišķā logā",lt:"Atidaryti Google atskirame lange",et:"Ava Google eraldi aknas"})[locale]||"Open Google in a separate window";
  popup.hidden=false;
  popup.onclick=startGooglePopup;
  googleButton.onclick=()=>run(async()=>{
    sessionStorage.setItem(googleRedirectKey,"1");
    try{await signInWithRedirect(auth,googleProvider);}
    catch(error){sessionStorage.removeItem(googleRedirectKey);throw error;}
  });
}
form.onsubmit=event=>{
  event.preventDefault();
  run(async()=>{
    const address=email.value.trim(),secret=password.value;
    if(!registering)return finish((await signInWithEmailAndPassword(auth,address,secret)).user);
    let existing=false;
    try{
      const result=await registerOrSignIn(createUserWithEmailAndPassword,async(...args)=>{existing=true;return signInWithEmailAndPassword(...args);},auth,address,secret);
      await finish(result.user);
    }catch(error){
      if(existing&&["auth/invalid-credential","auth/wrong-password","auth/user-not-found","auth/email-already-in-use"].includes(error?.code)){
        setMode(false);status.textContent=R[0];return;
      }
      throw error;
    }
  });
};
document.querySelector("#reset").onclick=()=>{
  const address=email.value.trim();
  if(!address){status.textContent=R[3];email.focus();return;}
  if(!email.reportValidity())return;
  run(async()=>{
    try{await sendResetWithFallback(sendPasswordResetEmail,auth,address,emailAction);status.textContent=R[1];}
    catch(error){
      console.warn("Firebase password reset:",error?.code||"unknown");
      if(error?.code==="auth/user-not-found"){status.textContent=R[1];return;}
      status.textContent=R[2]+(error?.code==="auth/too-many-requests"?" "+tr("Слишком много попыток. Попробуйте позже."):"");
    }
  });
};

// Restore a previously created Firebase account without asking for email confirmation.
await auth.authStateReady();
const returningFromGoogle=sameOriginGoogle&&sessionStorage.getItem(googleRedirectKey)==="1";
if(returningFromGoogle){
  sessionStorage.removeItem(googleRedirectKey);
  await run(async()=>{
    const result=await getRedirectResult(auth);
    if(!result?.user)throw new Error("google_redirect_incomplete");
    await finish(result.user);
  });
}else if(!telegramLink && auth.currentUser && new URLSearchParams(location.search).get("mode")!=="register"){
  await run(()=>finish(auth.currentUser));
}

const telegramButton=document.querySelector("#telegram");
const telegramLabels=({
  ru:["Войти через Telegram","Привязать Telegram","Сначала войдите через email или Google, затем привяжите Telegram в разделе «Мои данные».","Нажмите кнопку Telegram ещё раз.","Не удалось завершить вход через Telegram.","Сначала подтвердите email.","Мы отправили письмо. Перейдите по ссылке и вернитесь на эту страницу.","Этот Telegram или аккаунт уже связан с другой учётной записью."],
  lv:["Ieiet ar Telegram","Piesaistīt Telegram","Vispirms piesakieties ar e-pastu vai Google un piesaistiet Telegram sadaļā Mani dati.","Nospiediet Telegram pogu vēlreiz.","Neizdevās pieteikties ar Telegram.","Vispirms apstipriniet e-pastu.","Atveriet e-pasta saiti un atgriezieties šajā lapā.","Šis Telegram profils vai konts jau ir piesaistīts citam kontam."],
})[locale]||["Sign in with Telegram","Link Telegram","First sign in with email or Google, then link Telegram in My data.","Press the Telegram button again.","Telegram sign-in could not be completed.","Verify your email first.","Open the link in your email, then return here.","This Telegram profile or site account is already linked elsewhere."];

async function configureTelegram(){
  const available=await fetch('/auth/telegram/availability').catch(()=>null);
  if(!available?.ok)return;
  const onError=code=>{status.textContent=telegramLabels[({link_required:2,try_again:3,verification_required:5,already_linked:7})[code]??4];};
  const member=auth.currentUser;
  telegramButton.textContent=telegramLabels[telegramLink?1:0];
  if(telegramLink&&member){
    await reload(member);
    if(!member.emailVerified){
      onError('verification_required');
      const button=document.querySelector('#telegramVerifyEmail');
      button.hidden=false;
      button.onclick=()=>run(async()=>{
        await requestTelegramConfirmation(member);
        status.textContent=telegramLabels[6];
      });
      return;
    }
    await establishSession(member);
  }
  if(telegramLink&&!member)return;
  await mountTelegram({button:telegramButton,mode:telegramLink?'link':'login',onError,onSuccess:async result=>{
    if(telegramLink){location.replace(destination);return;}
    await finish((await signInWithCustomToken(auth,result.customToken)).user);
  }});
}
void configureTelegram().catch(()=>{status.textContent=telegramLabels[4];});
