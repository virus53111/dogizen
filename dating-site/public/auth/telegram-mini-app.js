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
  const telegramUser = miniApp.initDataUnsafe?.user;
  const name = telegramUser?.username ? '@' + telegramUser.username : telegramUser?.first_name;
  const identity = document.getElementById('miniIdentity');
  if (name) {
    identity.textContent = 'Аккаунт Telegram: ' + name;
    identity.hidden = false;
  }
  const startParam = new URLSearchParams(miniApp.initData).get('start_param');
  if (/^connect_[A-Za-z0-9_-]{43}$/.test(startParam || '')) {
    button.textContent = 'Мне 18+ · Подключить мой аккаунт';
  }
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
      } else if (error.message === 'browser_link_expired') {
        status.textContent = 'Ссылка истекла. В «Моих данных» на сайте можно открыть новую. Если уже подключили аккаунт, откройте приложение из меню бота.';
      } else if (error.message === 'already_linked') {
        status.textContent = 'У одного из аккаунтов уже есть другая привязка.';
      } else if (error.message === 'telegram_account_has_data') {
        status.textContent = 'В обоих аккаунтах есть данные. Обратитесь в поддержку, чтобы сохранить их при переносе.';
      } else {
        status.textContent = 'Не удалось войти. Нажмите кнопку ещё раз.';
        button.disabled = false;
      }
    }
  };
}
