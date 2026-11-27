import { permitsPendingMember } from './pending-member.js';
import express from 'express';
import {CODE,recordInvitation} from './invitations.js';
import {registerStories} from './stories.js';
import {registerStoryPhotos} from './story-photos.js';
import { notifyMessage } from './push.js';
import { onlineCount, recentPhotos } from './catalog-extras.js';
import { createHash } from 'node:crypto';
import { getCookie, rateLimit } from './security.js';
import { telegramLogin } from './telegram-login.js';
import { nativeTelegramUid } from './telegram-mini-app.js';
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
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
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
app.use((req,res,next)=>{
 if(req.method==='GET'&&typeof req.query.ref==='string'&&CODE.test(req.query.ref)&&!getCookie(req,'mm_ref')){
  res.cookie('mm_ref',req.query.ref,{httpOnly:true,secure:true,sameSite:'lax',maxAge:30*86400000,path:'/'});
 }
 next();
});
app.get('/vip.html', (req,res)=>{const lang=['ru','en','de','lv','lt','et'].includes(req.query.lang)?req.query.lang:'ru';res.set('Cache-Control','no-store');res.redirect(302,'/invite.html?lang='+lang)});
app.get('/admin-vip.html', (req,res)=>res.redirect(302,'/admin.html'));
app.all(['/api/vip','/api/points-leaderboard','/api/admin/vip'], (req,res)=>res.set('Cache-Control','no-store').status(404).json({error:'not_available'}));
app.get(['/vip.js','/points-ui.js','/admin-vip.js','/auth/vip-verify.js'],(req,res)=>res.set('Cache-Control','no-store').type('application/javascript').send('/* inactive */'));
app.get(['/vip.css','/points-ui.css'],(req,res)=>res.set('Cache-Control','no-store').type('text/css').send('/* inactive */'));
const publicFiles = express.static(path.join(root, 'public'), { maxAge: '1h', setHeaders(res, file) {
  if (file.endsWith('.html') || file.endsWith('.js')) res.set('Cache-Control', 'no-cache');
} });
app.use((req, res, next) => {
  const asset = /\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/i.test(req.path);
  const protectedPath = /^\/(?:api|media|__)(?:\/|$)/i.test(req.path);
  return asset && !protectedPath ? publicFiles(req, res, next) : next();
});
app.use(express.json({ limit: '200kb' }), express.urlencoded({ extended: false }));
async function verify(token, allowNewTelegram = false) {
  if (!token || token.length > 10000) return null;
  try {
    const { payload } = await jwtVerify(token, keys, {
      audience: config.projectId,
      issuer: 'https://securetoken.google.com/' + config.projectId,
      algorithms: ['RS256']
    });
    if (!payload.sub) return null;
    if (payload.firebase?.sign_in_provider === 'custom' && !payload.email &&
        /^mmtg_[a-f0-9]{64}$/.test(payload.sub)) {
      const link = await db.query(`SELECT telegram_user_id FROM mm_telegram_accounts
        WHERE user_id=$1 AND subject LIKE 'mini:%'`, [payload.sub]);
      const telegramId = link.rows[0]?.telegram_user_id ||
        (allowNewTelegram && !link.rowCount ? payload.mm_telegram_id : null);
      if (typeof telegramId === 'string' && /^[1-9]\d{0,15}$/.test(telegramId) &&
          payload.sub === nativeTelegramUid(telegramId)) {
        return { id: payload.sub, email: '', verified: true, telegramId };
      }
    }
    if (!payload.email) return null;
    const verified = payload.email_verified === true;
    if (!verified && payload.firebase?.sign_in_provider !== 'password') return null;
    return { id: String(payload.sub), email: String(payload.email), verified };
  } catch { return null; }
}
app.use(async (req, res, next) => {
  try {
    const bearer = req.get('authorization') || '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : getCookie(req, 'mm_token');
    const identity = await verify(token);
    req.user = identity?.verified || permitsPendingMember(req.path, req.method) ? identity : null;
    if(req.user && /^\/(api|media)(\/|$)/i.test(req.path) && !/^\/api\/privacy(?:\/|$)/i.test(req.path)){
      const ban=await db.query('SELECT 1 FROM mm_vip_bans WHERE user_id=$1',[req.user.id]);
      if(ban.rows.length)return res.status(403).json({error:'account_banned'});
    }
    next();
  } catch (error) { next(error); }
});
const owner = u => !!u && u.verified && u.email.toLowerCase() === 'dshtriters@gmail.com';
const session = (u, visible = false, adminAllowed = false) => u ? {
  id: u.id, email: u.email, ownerPanel: adminAllowed === true, emailVerified: u.verified && !u.telegramId, canMessage: true, visible
} : null;
async function ownerAllowed(user){if(!owner(user))return false;const r=await db.query('SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1',[user.id]);return r.rows.length>0}
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
app.get('/auth/config', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const sameOrigin = process.env.GOOGLE_SAME_ORIGIN_AUTH === '1' && req.hostname === 'murdilimax.com';
  res.json(sameOrigin ? { ...config, authDomain: 'murdilimax.com' } : config);
});
app.use('/auth/telegram', await telegramLogin({ db, projectId: config.projectId }));
app.post('/auth/session', async (req, res, next) => {
 try {
  const token = String(req.body?.idToken || '');
  const user = await verify(token, true);
  if (!user) return res.status(401).json({ error: 'Войдите повторно' });
  const memberRecord = await db.transaction(async q=>{
    if (user.telegramId) {
      await q('SELECT pg_advisory_xact_lock(hashtext($1), 738292)', [user.telegramId]);
      const previous = await q('SELECT telegram_user_id FROM mm_telegram_accounts WHERE user_id=$1', [user.id]);
      if (previous.rowCount && !previous.rows[0].telegram_user_id) {
        throw Object.assign(new Error('Telegram account changed during sign-in'), { status: 409 });
      }
    }
    const ban=await q('SELECT 1 FROM mm_vip_bans WHERE user_id=$1',[user.id]);
    if(ban.rows.length)return null;
    const emailVerified = user.verified && !user.telegramId;
    const inserted=await q("INSERT INTO users(id,email,email_verified_at) VALUES ($1,$2,CASE WHEN $3::boolean THEN NOW() END) ON CONFLICT(id) DO NOTHING RETURNING visible",[user.id,user.email,emailVerified]);
    const result=inserted.rows.length?inserted:await q("UPDATE users SET email=$2,email_verified_at=CASE WHEN users.email=$2 THEN COALESCE(users.email_verified_at,CASE WHEN $3::boolean THEN NOW() END) ELSE CASE WHEN $3::boolean THEN NOW() END END WHERE id=$1 RETURNING visible",[user.id,user.email,emailVerified]);
    if (user.telegramId) {
      const link = await q(`INSERT INTO mm_telegram_accounts (subject, user_id, telegram_user_id) VALUES ($1,$2,$3)
        ON CONFLICT (telegram_user_id) DO UPDATE SET telegram_user_id=EXCLUDED.telegram_user_id
        WHERE mm_telegram_accounts.user_id=EXCLUDED.user_id AND mm_telegram_accounts.subject=EXCLUDED.subject
        RETURNING user_id`, [`mini:${user.telegramId}`, user.id, user.telegramId]);
      if (!link.rowCount) throw Object.assign(new Error('Telegram account changed during sign-in'), { status: 409 });
    }
    await recordInvitation(q,user.id,getCookie(req,'mm_ref'),inserted.rows.length>0);
    return result;
  });
  if(!memberRecord)return res.status(403).json({error:'account_banned'});
  res.clearCookie('mm_ref',{path:'/',secure:true,sameSite:'lax'});
  res.cookie('mm_token', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 55 * 60 * 1000, path: '/' });
  res.set('Cache-Control', 'no-store');
  res.json({ user: session(user, memberRecord.rows[0]?.visible === true, await ownerAllowed(user)) });
 } catch(error){next(error)}
});
app.post('/auth/logout', async (req, res, next) => {
  try { if(req.user&&typeof req.body?.push_endpoint==='string')await db.query('DELETE FROM mm_push_subscriptions WHERE user_id=$1 AND endpoint=$2',[req.user.id,req.body.push_endpoint]); } catch(e){return next(e)}
  res.clearCookie('mm_token', { path: '/', sameSite: 'lax', secure: true });
  res.json({ ok: true });
});
app.get('/login', async (req, res, next) => {
  const dest = safeNext(req.query.next);
  try { if (await ownerAllowed(req.user)) return res.redirect('/admin.html'); } catch(e){return next(e)}
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
    const state = await db.query(`SELECT visible,
      EXISTS (SELECT 1 FROM mm_listings WHERE owner_id=$1) AS has_listing
      FROM users WHERE id=$1`, [req.user.id]);
    const user = session(req.user, state.rows[0]?.visible === true, await ownerAllowed(req.user));
    return res.json({ user: { ...user, hasListing: state.rows[0]?.has_listing === true } });
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
    await db.query('UPDATE users SET visible=CASE WHEN incognito THEN FALSE ELSE COALESCE($2,visible) END,last_seen=NOW() WHERE id=$1', [req.user.id, visible]);
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
const routes = ['locations', 'listings', 'listing', 'profile-community', 'member-activity', 'profile-stats', 'recommendations', 'traffic', 'push', 'engagement', 'invitations', 'private-album', 'story-submit', 'support', 'create', 'mine', 'favorites', 'likes', 'report', 'chat/list', 'chat/start',
  'chat/messages', 'chat/photos', 'chat/block', 'chat/report', 'legacy/claim', 'claim', 'privacy', 'privacy/export', 'admin/stories', 'admin/me', 'admin/overview', 'admin/traffic', 'admin/support', 'admin/listings', 'admin/manual', 'admin/manage', 'admin/reports', 'admin/claim-invite', 'admin/privacy-requests'];
for (const slug of routes) {
  const mod = await import('../api/' + slug + '.js');
  const storyUpload = ['story-submit','admin/stories'].includes(slug);
  const acceptsUpload = storyUpload || ['create','admin/manual','admin/manage','chat/photos','private-album'].includes(slug);
  const parsesUpload = !acceptsUpload ? [] : [(slug === 'create' || storyUpload ? upload : adminUpload).any()];
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
    try {
      await mod.default(req, res);
      if(req.method==='POST'&&res.statusCode===200&&req.user&&((slug==='chat/messages'&&(!req.body?.action||req.body.action==='send'))||(slug==='chat/photos'&&req.body?.action==='send'))) {
        await notifyMessage(db,req.body.conversation_id,req.user.id).catch(()=>console.warn('Web Push delivery unavailable'));
      }
    } catch (e) { next(e); }
  });
}
app.get('/api/online-count', async (req,res,next)=> {
  res.set('Cache-Control','no-store');
  try { res.json(await onlineCount(db)); } catch(e) { next(e); }
});
app.get('/api/recent-photos', async (req,res,next)=> {
  res.set('Cache-Control','no-store');
  try { res.json(await recentPhotos(db)); } catch(e) { next(e); }
});
registerStoryPhotos(app,db,ownerAllowed);
registerStories(app,db,await fs.readFile(path.join(root,'public/sitemap.xml'),'utf8'));
app.get('/', (req, res) => res.sendFile(path.join(root, 'public/index.html')));
app.use(publicFiles);
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
