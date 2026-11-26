import { createHash, createPublicKey, verify } from 'node:crypto';

// Telegram's production Ed25519 key, from the Mini Apps documentation.
const telegramPublicKey = createPublicKey({
  key: Buffer.from('302a300506032b6570032100e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d', 'hex'),
  format: 'der', type: 'spki',
});

export function nativeTelegramUid(telegramId) {
  return `mmtg_${createHash('sha256').update(String(telegramId)).digest('hex')}`;
}

export function readTelegramLaunch(data, botId, { key = telegramPublicKey, now = Date.now() } = {}) {
  if (typeof data !== 'string' || data.length > 12000 || !/^\d{1,16}$/.test(botId)) return null;
  const values = new Map();
  for (const [name, value] of new URLSearchParams(data)) {
    if (!/^[a-z_]+$/.test(name) || values.has(name) || /[\r\n]/.test(value)) return null;
    values.set(name, value);
  }
  const encoded = values.get('signature');
  const timestamp = values.get('auth_date');
  if (!/^[A-Za-z0-9_-]{86}={0,2}$/.test(encoded ?? '') || !/^\d{10}$/.test(timestamp ?? '')) return null;
  const issued = Number(timestamp) * 1000;
  if (issued < now - 300000 || issued > now + 15000) return null;
  values.delete('signature');
  values.delete('hash');
  const fields = [...values.keys()].sort().map(name => `${name}=${values.get(name)}`);
  const signature = Buffer.from(encoded, 'base64url');
  if (signature.length !== 64 || !verify(null, Buffer.from(`${botId}:WebAppData\n${fields.join('\n')}`), key, signature)) return null;
  try {
    const user = JSON.parse(values.get('user'));
    if (!Number.isSafeInteger(user?.id) || user.id <= 0 || user.is_bot === true) return null;
    return { telegramId: String(user.id), signatureHash: createHash('sha256').update(signature).digest('hex'), startParam: values.get('start_param') };
  } catch {
    return null;
  }
}
