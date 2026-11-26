import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInWithCustomToken, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const miniApp = window.Telegram?.WebApp;
const button = document.getElementById('openCatalog');
const status = document.getElementById('miniStatus');

function openInBrowser(event) {
  event.preventDefault();
  miniApp.openLink(event.currentTarget.href);
}

function showAccountHelp() {
  const startParam = new URLSearchParams(miniApp.initData).get('start_param');
  const match = /^ref_([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.exec(startParam || '');
  const register = document.getElementById('miniRegister');
  if (match) register.href = '/?ref=' + encodeURIComponent(match[1]);
  register.onclick = openInBrowser;
  document.getElementById('miniLinkAccount').onclick = openInBrowser;
  document.getElementById('miniAccountHelp').hidden = false;
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'unavailable');
  return result;
}

if (!miniApp?.initData) {
  document.getElementById('openInTelegram').hidden = false;
} else {
  miniApp.ready();
  miniApp.expand();
  button.hidden = false;
  button.onclick = async () => {
    button.disabled = true;
    status.textContent = 'Входим в ваш аккаунт…';
    try {
      const response = await fetch('/auth/config');
      if (!response.ok) throw new Error('unavailable');
      const auth = getAuth(initializeApp(await response.json()));
      await setPersistence(auth, browserLocalPersistence);
      const { customToken } = await post('/auth/telegram/mini-app', { initData: miniApp.initData });
      const { user } = await signInWithCustomToken(auth, customToken);
      await post('/auth/session', { idToken: await user.getIdToken() });
      try { sessionStorage.setItem('mm-from-telegram', '1'); } catch {}
      location.replace('/#catalog');
    } catch (error) {
      if (error.message === 'link_required') {
        status.textContent = 'Для этого аккаунта Telegram ещё нет привязки к Mini App.';
        showAccountHelp();
      } else if (['invalid_launch', 'launch_used'].includes(error.message)) {
        status.textContent = 'Закройте Mini App и снова откройте её через бота.';
      } else {
        status.textContent = 'Не удалось войти. Попробуйте открыть приложение заново.';
      }
    } finally {
      button.disabled = false;
    }
  };
}
