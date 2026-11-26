const miniApp = window.Telegram?.WebApp;
const button = document.getElementById('openCatalog');
const status = document.getElementById('miniStatus');

function openCatalog() {
  try { localStorage.setItem('mm-over18', 'yes'); } catch {}
  try { sessionStorage.setItem('mm-from-telegram', '1'); } catch {}
  location.replace('/#catalog');
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
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
  let customToken;
  let signedInUser;
  button.onclick = async () => {
    button.disabled = true;
    status.textContent = 'Входим через Telegram…';
    try {
      if (!signedInUser) {
        const [{ initializeApp, getApps }, { getAuth, signInWithCustomToken, setPersistence, browserLocalPersistence }, response] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
          fetch('/auth/config', { signal: AbortSignal.timeout(12000) }),
        ]);
        if (!response.ok) throw new Error('unavailable');
        const config = await response.json();
        const auth = getAuth(getApps()[0] || initializeApp(config));
        await setPersistence(auth, browserLocalPersistence);
        customToken ||= (await post('/auth/telegram/mini-app', { initData: miniApp.initData })).customToken;
        ({ user: signedInUser } = await signInWithCustomToken(auth, customToken));
      }
      await post('/auth/session', { idToken: await signedInUser.getIdToken() });
      openCatalog();
    } catch (error) {
      if (['invalid_launch', 'launch_used', 'auth/invalid-custom-token'].includes(error.message) ||
          error.code === 'auth/invalid-custom-token') {
        status.textContent = 'Закройте приложение и откройте снова из меню бота.';
      } else if (error.message === 'account_banned') {
        status.textContent = 'Доступ к этому аккаунту ограничен.';
      } else {
        status.textContent = 'Не удалось войти. Нажмите кнопку ещё раз.';
        button.disabled = false;
      }
    }
  };
}
