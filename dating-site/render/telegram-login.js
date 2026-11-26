import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose';
import { getCookie, rateLimit } from './security.js';

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

    let subject;
    try {
      const { payload } = await jwtVerify(idToken, keys, {
        issuer, audience: clientId, algorithms: ['RS256'], maxTokenAge: '5m',
        requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
      });
      if (payload.nonce !== nonce || typeof payload.sub !== 'string' || !/^[0-9]{1,64}$/.test(payload.sub)) {
        return res.status(401).end();
      }
      subject = payload.sub;
    } catch {
      return res.status(401).end();
    }

    try {
      if (mode === 'link') {
        const result = await db.query(`
          INSERT INTO mm_telegram_accounts (subject, user_id) VALUES ($1, $2)
          ON CONFLICT DO NOTHING RETURNING subject`, [subject, req.user.id]);
        if (result.rowCount) return res.json({ linked: true });
        const existing = await db.query('SELECT 1 FROM mm_telegram_accounts WHERE subject=$1 AND user_id=$2', [subject, req.user.id]);
        return existing.rowCount ? res.json({ linked: true }) : res.status(409).json({ error: 'already_linked' });
      }

      const result = await db.query(`
        SELECT u.id FROM mm_telegram_accounts t JOIN users u ON u.id=t.user_id
        WHERE t.subject=$1 AND u.email_verified_at IS NOT NULL`, [subject]);
      if (!result.rowCount) return res.status(404).json({ error: 'link_required' });
      const customToken = await new SignJWT({ uid: result.rows[0].id })
        .setProtectedHeader({ alg: 'RS256', kid: signer.keyId })
        .setIssuer(signer.email).setSubject(signer.email).setAudience(firebaseAudience)
        .setIssuedAt().setExpirationTime('5m').sign(signer.key);
      return res.json({ customToken });
    } catch (error) {
      return next(error);
    }
  });
  return router;
}
