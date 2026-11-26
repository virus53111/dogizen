import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { readTelegramLaunch } from '../render/telegram-mini-app.js';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const botId = '9196177350';
const now = 1795698000000;

function signedLaunch({ user = { id: 4294967297 }, issued = now, audience = botId } = {}) {
  const authDate = Math.floor(issued / 1000);
  const values = new URLSearchParams({ user: JSON.stringify(user), auth_date: String(authDate), start_param: 'ref_test' });
  const message = `${audience}:WebAppData\nauth_date=${authDate}\nstart_param=ref_test\nuser=${JSON.stringify(user)}`;
  values.set('hash', 'ignored-by-public-key-validation');
  values.set('signature', sign(null, Buffer.from(message), privateKey).toString('base64url'));
  return values;
}

const verified = values => readTelegramLaunch(values.toString(), botId, { key: publicKey, now });

test('Mini App accepts a fresh Ed25519-signed identity for the configured bot', () => {
  const result = verified(signedLaunch());
  assert.equal(result.telegramId, '4294967297');
  assert.match(result.signatureHash, /^[a-f0-9]{64}$/);
});

test('Mini App rejects a modified identity, stale launch, duplicate field and wrong bot', () => {
  const modified = signedLaunch();
  modified.set('user', JSON.stringify({ id: 42 }));
  const duplicate = signedLaunch();
  duplicate.append('auth_date', String(now / 1000));
  assert.equal(verified(modified), null);
  assert.equal(verified(duplicate), null);
  assert.equal(verified(signedLaunch({ issued: now - 301000 })), null);
  assert.equal(verified(signedLaunch({ audience: '1234' })), null);
});
