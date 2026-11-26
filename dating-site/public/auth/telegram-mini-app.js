const miniApp = window.Telegram?.WebApp;
const button = document.getElementById('openCatalog');
const status = document.getElementById('miniStatus');

function openInBrowser(event) {
  event.preventDefault();
  miniApp.openLink(event.currentTarget.href);
}

function openCatalog() {
  const startParam = new URLSearchParams(miniApp.initData).get('start_param');
  const match = /^ref_([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.exec(startParam || '');
  try { localStorage.setItem('mm-over18', 'yes'); } catch {}
  try { sessionStorage.setItem('mm-from-telegram', '1'); } catch {}
  location.replace(match ? '/?ref=' + encodeURIComponent(match[1]) + '#catalog' : '/#catalog');
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(6000),
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
  document.getElementById('miniLinkAccount').onclick = openInBrowser;
  document.getElementById('miniAccountHelp').hidden = false;
  button.hidden = false;
  button.onclick = async () => {
    button.disabled = true;
    status.textContent = 'Открываем каталог…';
    try {
      const { customToken } = await post('/auth/telegram/mini-app', { initData: miniApp.initData });
      const [{ initializeApp }, { getAuth, signInWithCustomToken, setPersistence, browserLocalPersistence }, response] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
        fetch('/auth/config', { signal: AbortSignal.timeout(6000) }),
      ]);
      if (!response.ok) throw new Error('unavailable');
      const auth = getAuth(initializeApp(await response.json()));
      await setPersistence(auth, browserLocalPersistence);
      const { user } = await signInWithCustomToken(auth, customToken);
      await post('/auth/session', { idToken: await user.getIdToken() });
    } catch {
      // The public catalog is available even when account sign-in cannot finish.
    } finally {
      openCatalog();
    }
  };
}
