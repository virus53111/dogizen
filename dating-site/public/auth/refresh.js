import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, onIdTokenChanged, signOut, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { sendVerificationWithFallback } from './email-flow.js?v=20261125-recovery';

const verifyText = {
  ru: 'Можно смотреть анкеты и сохранять избранное. Для общения подтвердите почту.',
  en: 'Browse profiles and save favorites now. Verify your email to chat.',
  de: 'Profile ansehen und Favoriten speichern. Zum Chatten E-Mail bestätigen.',
  lv: 'Skatiet profilus un saglabājiet izlasi. Lai sarakstītos, apstipriniet e-pastu.',
  lt: 'Naršykite profilius ir išsaugokite mėgstamus. Norėdami bendrauti, patvirtinkite el. paštą.',
  et: 'Vaata profiile ja salvesta lemmikuid. Vestlemiseks kinnita e-post.'
};
try {
  const settings = await fetch('/auth/config').then(r => r.json());
  const firebase = getApps()[0] || initializeApp(settings);
  const auth = getAuth(firebase);
  await setPersistence(auth, browserLocalPersistence);
  let signingOut = false;
  let pendingRefresh = Promise.resolve();
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.getAttribute('action') !== '/logout') return;
    event.preventDefault();
    if (signingOut) return;
    signingOut = true;
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      await pendingRefresh;
      let sub=null;
      try{const reg=await navigator.serviceWorker?.getRegistration();sub=await reg?.pushManager?.getSubscription()}catch{}
      const response = await fetch('/auth/logout', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({push_endpoint:sub?.endpoint||null}) });
      if(response.ok){try{await sub?.unsubscribe()}catch{}await signOut(auth)}
      if (!response.ok) throw new Error('Logout failed');
      location.replace('/auth/login.html');
    } catch {
      signingOut = false;
      if (button) button.disabled = false;
      window.alert('Не удалось выйти. Проверьте соединение и попробуйте ещё раз.');
    }
  });
  onIdTokenChanged(auth, member => {
    if (signingOut) return;
    pendingRefresh = pendingRefresh.then(async () => {
    if (signingOut) return;
    try {
      if (member) {
        const response = await fetch('/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: await member.getIdToken() }) });
        document.getElementById('mm-pending-email')?.remove();
        if (response.ok && !member.emailVerified) {
          const locale = document.documentElement.lang || 'ru';
          const link = document.createElement('a');
          link.id = 'mm-pending-email';
          link.href = '/auth/login.html?next=' + encodeURIComponent(location.pathname);
          link.textContent = verifyText[locale] || verifyText.en;
          (document.querySelector('main') || document.body).prepend(link);
          if (sessionStorage.getItem('mm-send-verification') === member.uid) {
            sessionStorage.removeItem('mm-send-verification');
            auth.languageCode = locale;
            sendVerificationWithFallback(sendEmailVerification, member, {url: location.origin + link.getAttribute('href')})
              .catch(() => console.warn('Verification email can be requested again on the account page'));
          }
        }
      } else {
        document.getElementById('mm-pending-email')?.remove();
        await fetch('/auth/logout', { method: 'POST' });
      }
    } catch (e) { console.warn('Could not refresh session', e); }
    if (!signingOut) {window.MM_finishAuth?.();window.dispatchEvent(new Event("mm:auth-session"));}
    });
  });
} catch (e) { console.warn('Could not initialize Firebase', e); window.MM_finishAuth?.(); window.dispatchEvent(new Event('mm:auth-session')); }