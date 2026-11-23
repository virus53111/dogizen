import express from 'express';
import { createHash } from 'node:crypto';
import { getCookie, rateLimit } from './security.js';
import { canReadPhoto } from './media-access.js';
import multer from 'multer';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, storage, init } from './runtime.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'render/firebase.public.json'), 'utf8'));
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const reportRate = rateLimit({ limit: 6, windowMs: 60 * 60 * 1000 });
const sessionRate = rateLimit({ limit: 30, windowMs: 5 * 60 * 1000 });
const writeRate = rateLimit({ limit: 100, windowMs: 60 * 1000 });
app.use((req, res, next) => {
  res.set('X-Frame-Options', 'DENY');
  res.set('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure && ['murdilimax.com', 'www.murdilimax.com'].includes(req.hostname))
    res.set('Strict-Transport-Security', 'max-age=15552000');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && origin !== req.protocol + '://' + req.get('host'))
      return res.status(403).json({ error: 'Недопустимый источник' });
    const site = req.get('sec-fetch-site');
    if (site && !['same-origin', 'none'].includes(site))
      return res.status(403).json({ error: 'Недопустимый источник' });
  }
  if (req.method === 'POST') {
    if (req.path === '/api/report') return reportRate(req, res, next);
    if (req.path === '/auth/session') return sessionRate(req, res, next);
    if (req.path.startsWith('/api/')) return writeRate(req, res, next);
  }
  next();
});
app.use(express.json({ limit: '200kb' }), express.urlencoded({ extended: false }));
async function verify(token) {
  if (!token || token.length > 10000) return null;
  try {
    const { payload } = await jwtVerify(token, keys, {
      audience: config.projectId,
      issuer: 'https://securetoken.google.com/' + config.projectId,
      algorithms: ['RS256']
    });
    if (!payload.sub || !payload.email || payload.email_verified !== true) return null;
    return { id: String(payload.sub), email: String(payload.email), verified: true };
  } catch { return null; }
}
app.use(async (req, res, next) => {
  try {
    const bearer = req.get('authorization') || '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : getCookie(req, 'mm_token');
    req.user = await verify(token);
    next();
  } catch (error) { next(error); }
});
const owner = u => !!u && u.verified && u.email.toLowerCase() === 'dshtriters@gmail.com';
const session = (u, visible = false) => u ? {
  id: u.id, email: u.email, ownerPanel: owner(u), canMessage: true, visible
} : null;
const userOnly = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'Требуется вход' });
const safeNext = value => {
  const s = String(value || '/');
  return s.startsWith('/') && !s.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(s) ? s : '/';
};
app.get('/healthz', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});
app.get('/robots.txt', (req, res, next) => {
  if (!['murdilimax.com','www.murdilimax.com'].includes(req.hostname)) {
    return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  }
  next();
});
app.get('/auth/config', (req, res) => res.json(config));
app.post('/auth/session', async (req, res) => {
  const token = String(req.body?.idToken || '');
  const user = await verify(token);
  if (!user) return res.status(401).json({ error: 'Подтвердите email и войдите повторно' });
  const memberRecord = await db.query("INSERT INTO users(id,email,email_verified_at) VALUES ($1,$2,NOW()) ON CONFLICT(id) DO UPDATE SET email=$2,email_verified_at=NOW() RETURNING visible", [user.id, user.email]);
  res.cookie('mm_token', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 55 * 60 * 1000, path: '/' });
  res.set('Cache-Control', 'no-store');
  res.json({ user: session(user, memberRecord.rows[0]?.visible === true) });
});
app.post('/auth/logout', (req, res) => {
  res.clearCookie('mm_token', { path: '/', sameSite: 'lax', secure: true });
  res.json({ ok: true });
});
app.get('/login', (req, res) => {
  const dest = safeNext(req.query.next);
  if (owner(req.user)) return res.redirect('/admin.html');
  res.redirect(req.user ? dest : '/auth/login.html?next=' + encodeURIComponent(dest));
});
// Retire the old dead /login.html Firebase-incompatible form.
app.get('/login.html', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.redirect(302, '/login?next=' + encodeURIComponent(safeNext(req.query.next)));
});
app.get('/api/session', async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!req.user) return res.json({ user: null });
  try {
    const state = await db.query('SELECT visible FROM users WHERE id=$1', [req.user.id]);
    return res.json({ user: session(req.user, state.rows[0]?.visible === true) });
  } catch (error) { next(error); }
});
app.get('/media/*', async (req, res, next) => {
  try {
    const key = String(req.params[0] || '');
    if (!/^murdilimax\/(?:photos|admin-profiles|admin-edited|legacy)\/[a-z0-9._-]{1,120}$/i.test(key))
      return res.status(404).end();
    const access = await canReadPhoto(db, '/media/' + key, req.user, owner(req.user));
    if (!access.allowed) return res.status(404).end();
    const file = await storage.get(key);
    if (!file) return res.status(404).end();
    res.set('Cache-Control', access.public ? 'public, max-age=60' : 'no-store');
    res.set('Cross-Origin-Resource-Policy', 'same-origin');
    res.type(file.contentType).send(file.buffer);
  } catch (e) { next(e); }
});
app.post('/api/presence', userOnly, async (req, res, next) => {
  try {
    const visible = typeof req.body?.visible === 'boolean' ? req.body.visible : null;
    await db.query('UPDATE users SET visible=COALESCE($2,visible),last_seen=NOW() WHERE id=$1', [req.user.id, visible]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.get('/api/room', userOnly, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT id,user_id,name,body,EXTRACT(EPOCH FROM created_at)::bigint AS sent FROM mm_room ORDER BY created_at DESC LIMIT 70');
    res.set('Cache-Control', 'no-store');
    res.json({ messages: rows.rows.reverse().map(m => ({
      id: m.id, name: 'Участник ' + createHash('sha256').update(String(m.user_id)).digest('hex').slice(0, 6).toUpperCase(), body: m.body, sent: Number(m.sent),
      mine: !!req.user && m.user_id === req.user.id
    })) });
  } catch (e) { next(e); }
});
app.post('/api/room', userOnly, async (req, res, next) => {
  try {
    if (req.body?.action === 'report') {
      const id = String(req.body.message_id || '');
      const reason = String(req.body.reason || '').trim().slice(0,500);
      if (!/^[0-9a-f-]{36}$/i.test(id) || reason.length < 5) return res.status(400).json({ error: 'Укажите причину' });
      const reports = await db.query("SELECT COUNT(*)::integer AS n FROM mm_room_reports WHERE user_id=$1 AND created_at > NOW()-INTERVAL '24 hours'", [req.user.id]);
      if ((reports.rows[0]?.n || 0) >= 8) return res.status(429).json({ error: 'Лимит жалоб на сегодня' });
      await db.query('INSERT INTO mm_room_reports(message_id,user_id,reason) SELECT id,$2,$3 FROM mm_room WHERE id=$1 AND user_id<>$2', [id, req.user.id, reason]);
      return res.json({ ok: true });
    }
    const body = String(req.body?.body || '').trim();
    if (!body || body.length > 1200) return res.status(400).json({ error: 'Недопустимое сообщение' });
    const counter = await db.query("SELECT COUNT(*)::integer AS n,MAX(created_at) AS latest FROM mm_room WHERE user_id=$1 AND created_at>NOW()-INTERVAL '1 hour'", [req.user.id]);
    if (counter.rows[0].n >= 60 || (counter.rows[0].latest && Date.now() - new Date(counter.rows[0].latest).getTime() < 5000))
      return res.status(429).json({ error: 'Слишком частые сообщения' });
    await db.query('INSERT INTO mm_room(user_id,body,name) VALUES($1,$2,$3)', [req.user.id, body, 'Участник ' + createHash('sha256').update(req.user.id).digest('hex').slice(0, 6).toUpperCase()]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 6, fields: 40, parts: 46 } });
const adminUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 40, parts: 41 } });
const routes = ['listings', 'listing', 'create', 'mine', 'favorites', 'report', 'chat/list', 'chat/start',
  'chat/messages', 'chat/block', 'chat/report', 'legacy/claim', 'claim', 'admin/me', 'admin/listings', 'admin/manual', 'admin/manage', 'admin/reports', 'admin/claim-invite'];
for (const slug of routes) {
  const mod = await import('../api/' + slug + '.js');
  const acceptsUpload = ['create','admin/manual','admin/manage'].includes(slug);
  const parsesUpload = !acceptsUpload ? [] : [(slug === 'create' ? upload : adminUpload).any()];
  // Reject unauthenticated/non-owner requests BEFORE multipart parsing (up to 24 MB).
  app.all('/api/' + slug, (req, res, next) => {
    if (mod.methods && !mod.methods.includes(req.method))
      return res.status(405).json({ error: 'Метод недоступен' });
    if (mod.access === 'user' && !req.user)
      return res.status(401).json({ error: 'Требуется вход' });
    if (slug.startsWith('admin/') && !owner(req.user))
      return res.status(403).json({ error: 'Доступ только владельцу сайта' });
    next();
  }, ...parsesUpload, async (req, res, next) => {
    if (acceptsUpload) req.files = (req.files || []).map(f => ({
      field: f.fieldname, filename: f.originalname, contentType: f.mimetype, buffer: f.buffer
    }));
    try { return await mod.default(req, res); } catch (e) { next(e); }
  });
}
app.get('/', (req, res) => res.sendFile(path.join(root, 'public/index.html')));
app.use(express.static(path.join(root, 'public'), { maxAge: '1h' }));
app.use((req, res) => res.status(404).json({ error: 'Страница не найдена' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const uploadError = err.code?.startsWith('LIMIT_');
  const invalidBody = err.type === 'entity.parse.failed' || err.status === 400;
  res.status(uploadError ? 413 : invalidBody ? 400 : 500).json({
    error: uploadError ? 'Превышены лимиты загрузки фото или формы' : invalidBody ? 'Некорректные данные запроса' : 'Ошибка сервера'
  });
});
await init();
const port = Number(process.env.PORT || 10000);
app.listen(port, '0.0.0.0', () => console.log('MurdiliMax listening on ' + port));