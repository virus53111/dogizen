import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,browserLocalPersistence,setPersistence} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


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
let registering=false;
const modeButton=document.querySelector("#switchMode");
modeButton.onclick=()=>{
  registering=!registering;
  document.title=(registering?tr("Регистрация"):tr("Вход"))+" · MurdiliMax";
  document.querySelector("#title").textContent=registering?tr("Регистрация"):tr("Вход");
  document.querySelector("#submit").textContent=registering?tr("Создать аккаунт"):tr("Войти");
  document.querySelector("#prompt").textContent=registering?tr("Уже есть аккаунт?"):tr("Нет аккаунта?");
  modeButton.textContent=registering?tr("Войти"):tr("Зарегистрироваться");
  password.autocomplete=registering?"new-password":"current-password";
  password.minLength=registering?12:0;
  password.placeholder=registering?tr("Минимум 12 символов"):"";
  document.querySelector("#reset").hidden=registering;
  status.textContent="";
};
const config=await fetch("/auth/config").then(response=>response.json());
const auth=getAuth(initializeApp(config));
auth.languageCode=locale;
await setPersistence(auth,browserLocalPersistence);


const emailAction={url:location.origin+"/login?next="+encodeURIComponent(destination)};
async function finish(user){
  if(!user.emailVerified){
    await sendEmailVerification(user,emailAction);
    status.textContent=tr("Письмо отправлено. Подтвердите адрес по ссылке и войдите снова.");
    return;
  }
  const response=await fetch("/auth/session",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({idToken:await user.getIdToken()})
  });
  if(!response.ok)throw new Error("session");
  location.replace("/login?next="+encodeURIComponent(destination));
}
async function run(action){
  status.textContent="";
  const buttons=document.querySelectorAll("button");
  buttons.forEach(button=>button.disabled=true);
  try{await action()}catch(error){
    const messages={"auth/invalid-credential":tr("Проверьте почту и пароль."),"auth/weak-password":tr("Выберите более длинный пароль."),"auth/email-already-in-use":tr("Этот адрес уже зарегистрирован. Войдите или восстановите пароль."),"auth/popup-blocked":tr("Разрешите открытие окна Google в браузере."),"auth/popup-closed-by-user":tr("Вход через Google отменён."),"auth/unauthorized-domain":tr("Адрес murdilimax.com нужно разрешить в Firebase Authentication. Сообщите администратору."),"auth/operation-not-allowed":tr("Этот способ входа пока не включён."),"auth/network-request-failed":tr("Проверьте подключение к интернету."),"auth/too-many-requests":tr("Слишком много попыток. Попробуйте позже.")};
    console.warn("Ошибка входа Firebase:",error?.code||"unknown");
    status.textContent=messages[error.code]||tr("Не удалось завершить вход. Попробуйте ещё раз.");
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
