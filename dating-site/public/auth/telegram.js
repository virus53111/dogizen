const endpoint = '/auth/telegram/';

export async function requestTelegramConfirmation(member) {
  const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
  return sendEmailVerification(member, { url: location.href });
}

async function post(name, body = {}) {
  const response = await fetch(endpoint + name, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'telegram_unavailable');
  return result;
}

function loadWidget() {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.Login?.auth) return resolve();
    const script = document.createElement('script');
    script.src = 'https://oauth.telegram.org/js/telegram-login.js?6';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

export async function mountTelegram({ button, mode, onSuccess, onError }) {
  if (!button) return;
  let attempt;
  async function prepare() {
    const challenge = await post('challenge');
    attempt = { ...challenge, expiresAt: Date.now() + 240000 };
  }
  try {
    await prepare();
    await loadWidget();
  } catch {
    return;
  }
  button.hidden = false;
  button.onclick = () => {
    if (!attempt || attempt.expiresAt <= Date.now()) {
      button.disabled = true;
      prepare().then(() => onError('try_again'), () => onError('telegram_unavailable'))
        .finally(() => { button.disabled = false; });
      return;
    }
    const { clientId, nonce } = attempt;
    attempt = null;
    button.disabled = true;
    const complete = async (result) => {
      try {
        if (!result?.id_token) throw new Error('telegram_cancelled');
        await onSuccess(await post('complete', { idToken: result.id_token, mode }));
      } catch (error) {
        onError(error.message);
      } finally {
        button.disabled = false;
      }
    };
    try {
      window.Telegram.Login.auth({ client_id: Number(clientId), nonce }, complete);
    } catch {
      button.disabled = false;
      onError('telegram_unavailable');
    }
  };
}
