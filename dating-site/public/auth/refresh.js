import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, onIdTokenChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
try {
  const settings = await fetch('/auth/config').then(r => r.json());
  const firebase = getApps()[0] || initializeApp(settings);
  const auth = getAuth(firebase);
  await setPersistence(auth, browserLocalPersistence);
  onIdTokenChanged(auth, async member => {
    try {
      if (member && member.emailVerified) {
        await fetch('/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: await member.getIdToken() }) });
      } else {
        await fetch('/auth/logout', { method: 'POST' });
      }
    } catch (e) { console.warn('Could not refresh session', e); }
    window.MM_finishAuth?.();
  });
} catch (e) { console.warn('Could not initialize Firebase', e); window.MM_finishAuth?.(); }