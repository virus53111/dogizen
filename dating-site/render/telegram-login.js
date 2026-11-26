import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose';
import { getCookie, rateLimit } from './security.js';
import { nativeTelegramUid, readTelegramLaunch } from './telegram-mini-app.js';
import { CODE } from './vip.js';

const origin = 'https://murdilimax.com';
const issuer = 'https://oauth.telegram.org';
const keys = createRemoteJWKSet(new URL('/.well-known/jwks.json', issuer));
const firebaseAudience = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
const nonceCookie = '__Host-mm_telegram_nonce';
const cookieOptions = { secure: true, httpOnly: true, sameSite: 'strict', path: '/' };

export async function telegramLogin({ db, projectId }) {
  const router = Router();
  const clientId = process.env.TELEGRAM_CLIENT_ID;
  let signer;
  if (clientId && process.env.TELEGRAM_FIREBASE_SIGNER_FILE) {
    const credentials = JSON.parse(await readFile(process.env.TELEGRAM_FIREBASE_SIGNER_FILE, 'utf8'));
    if (credentials.project_id !== projectId || !credentials.client_email?.endsWith(`@${projectId}.iam.gserviceaccount.com`)) {
      throw new Error('Telegram login requires a signer from the Firebase project');
    }
    signer = { email: credentials.client_email, keyId: credentials.private_key_id, key: await importPKCS8(credentials.private_key, 'RS256') };
  }
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!signer || req.hostname !== 'murdilimax.com') return res.status(404).end();
    next();
  });

  const attempts = rateLimit({ limit: 20, windowMs: 15 * 60 * 1000 });
  router.get('/availability', (_req, res) => res.json({ available: true }));
  const mintToken = (uid, telegramId) => new SignJWT(telegramId ? { uid, claims: { mm_telegram_id: telegramId } } : { uid })
    .setProtectedHeader({ alg: 'RS256', kid: signer.keyId })
    .setIssuer(signer.email).setSubject(signer.email).setAudience(firebaseAudience)
    .setIssuedAt().setExpirationTime('5m').sign(signer.key);

  router.post('/mini-app', attempts, async (req, res, next) => {
    if (req.get('origin') !== origin) return res.status(403).end();
    const launch = readTelegramLaunch(req.body?.initData, clientId);
    if (!launch) return res.status(401).json({ error: 'invalid_launch' });
    try {
      const result = await db.transaction(async query => {
        const linked = await query(`SELECT u.id, t.subject FROM mm_telegram_accounts t JOIN users u ON u.id=t.user_id
          WHERE t.telegram_user_id=$1`, [launch.telegramId]);
        const account = linked.rows[0];
        const uid = account?.id || nativeTelegramUid(launch.telegramId);
        const native = !account || account.subject === `mini:${launch.telegramId}`;
        const ban = await query('SELECT 1 FROM mm_vip_bans WHERE user_id=$1', [uid]);
        if (ban.rowCount) return { status: 403, error: 'account_banned' };
        await query('DELETE FROM mm_telegram_launches WHERE expires_at < NOW()');
        const claimed = await query(`INSERT INTO mm_telegram_launches (signature_hash, expires_at)
          VALUES ($1, NOW()+INTERVAL '6 minutes') ON CONFLICT DO NOTHING RETURNING signature_hash`, [launch.signatureHash]);
        if (!claimed.rowCount) return { status: 409, error: 'launch_used' };
        return { customToken: await mintToken(uid, native ? launch.telegramId : undefined) };
      });
      if (result.error) return res.status(result.status).json({ error: result.error });
      const referral = String(launch.startParam || '').replace(/^ref_/, '');
      if (launch.startParam?.startsWith('ref_') && CODE.test(referral) && !getCookie(req, 'mm_ref')) {
        res.cookie('mm_ref', referral, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 86400000, path: '/' });
      }
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });
  router.post('/challenge', attempts, (req, res) => {
    if (req.get('origin') !== origin) return res.status(403).end();
    const nonce = randomBytes(32).toString('base64url');
    res.cookie(nonceCookie, nonce, { ...cookieOptions, maxAge: 300000 });
    res.json({ clientId, nonce });
  });

  router.post('/complete', attempts, async (req, res, next) => {
    if (req.get('origin') !== origin) return res.status(403).end();
    const { idToken, mode } = req.body ?? {};
    if (mode !== 'link' && mode !== 'login') return res.status(400).end();
    if (mode === 'link' && !req.user?.verified) return res.status(403).json({ error: 'verification_required' });
    const nonce = getCookie(req, nonceCookie);
    res.clearCookie(nonceCookie, cookieOptions);
    if (!nonce || typeof idToken !== 'string' || idToken.length > 10000) return res.status(400).end();

    let subject, telegramUserId;
    try {
      const { payload } = await jwtVerify(idToken, keys, {
        issuer, algorithms: ['RS256'], maxTokenAge: '5m', clockTolerance: 10,
        requiredClaims: ['aud', 'sub', 'exp', 'iat', 'nonce'],
      });
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      const audienceMatches = audiences.some(audience => audience === clientId ||
        (Number.isSafeInteger(audience) && String(audience) === clientId));
      const validSubject = typeof payload.sub === 'string' && /^[\x21-\x7e]{1,255}$/.test(payload.sub);
      if (!audienceMatches || payload.nonce !== nonce || !validSubject) {
        console.warn('Telegram sign-in: claims rejected', { audienceMatches, nonceMatches: payload.nonce === nonce, validSubject });
        return res.status(401).end();
      }
      subject = payload.sub;
      telegramUserId = Number.isSafeInteger(payload.id) && payload.id > 0 ? String(payload.id) : null;
    } catch (error) {
      console.warn('Telegram sign-in: token rejected', error?.code, error?.claim);
      return res.status(401).end();
    }

    try {
      if (mode === 'link') {
        const result = await db.query(`
          INSERT INTO mm_telegram_accounts (subject, user_id, telegram_user_id) VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING RETURNING subject`, [subject, req.user.id, telegramUserId]);
        if (result.rowCount) return res.json({ linked: true });
        const existing = await db.query('SELECT 1 FROM mm_telegram_accounts WHERE subject=$1 AND user_id=$2', [subject, req.user.id]);
        if (!existing.rowCount) return res.status(409).json({ error: 'already_linked' });
        if (telegramUserId) {
          try {
            await db.query(`UPDATE mm_telegram_accounts SET telegram_user_id=$3
              WHERE subject=$1 AND user_id=$2 AND telegram_user_id IS NULL`, [subject, req.user.id, telegramUserId]);
          } catch (error) {
            if (error?.code === '23505') return res.status(409).json({ error: 'already_linked' });
            throw error;
          }
        }
        return res.json({ linked: true });
      }

      const result = await db.query(`
        SELECT u.id FROM mm_telegram_accounts t JOIN users u ON u.id=t.user_id
        WHERE t.subject=$1 AND u.email_verified_at IS NOT NULL`, [subject]);
      if (!result.rowCount) return res.status(404).json({ error: 'link_required' });
      const customToken = await mintToken(result.rows[0].id);
      return res.json({ customToken });
    } catch (error) {
      return next(error);
    }
  });
  return router;
}
