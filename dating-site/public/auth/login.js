import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,inMemoryPersistence,setPersistence} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form=document.querySelector("#account");
const email=document.querySelector("#email");
const password=document.querySelector("#password");
const status=document.querySelector("#status");
let registering=false;
const modeButton=document.querySelector("#switchMode");
modeButton.onclick=()=>{
  registering=!registering;
  document.title=(registering?"Регистрация":"Вход")+" · MurdiliMax";
  document.querySelector("#title").textContent=registering?"Регистрация":"Вход";
  document.querySelector("#submit").textContent=registering?"Создать аккаунт":"Войти";
  document.querySelector("#prompt").textContent=registering?"Уже есть аккаунт?":"Нет аккаунта?";
  modeButton.textContent=registering?"Войти":"Зарегистрироваться";
  password.autocomplete=registering?"new-password":"current-password";
  password.minLength=registering?6:0;
  password.placeholder=registering?"Минимум 6 символов":"";
  document.querySelector("#reset").hidden=registering;
  status.textContent="";
};
const config=await fetch("/auth/config").then(response=>response.json());
const auth=getAuth(initializeApp(config));
auth.languageCode="ru";
await setPersistence(auth,inMemoryPersistence);

const requested=new URLSearchParams(location.search).get("next")||"/";
let destination="/";
try { const back=new URL(requested,location.origin); if(back.origin===location.origin) destination=back.pathname+back.search+back.hash; } catch {}
const emailAction={url:location.origin+"/login?next="+encodeURIComponent(destination)};
async function finish(user){
  if(!user.emailVerified){
    await sendEmailVerification(user,emailAction);
    status.textContent="Письмо отправлено. Подтвердите адрес по ссылке и войдите снова.";
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
    const messages={"auth/invalid-credential":"Проверьте почту и пароль.","auth/weak-password":"Выберите более длинный пароль.","auth/email-already-in-use":"Этот адрес уже зарегистрирован. Войдите или восстановите пароль.","auth/popup-blocked":"Разрешите открытие окна Google в браузере.","auth/too-many-requests":"Слишком много попыток. Попробуйте позже."};
    status.textContent=messages[error.code]||"Не удалось завершить вход. Попробуйте ещё раз.";
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
  run(async()=>{await sendPasswordResetEmail(auth,email.value.trim(),emailAction);status.textContent="Если адрес зарегистрирован, вы получите письмо для смены пароля."});
};
