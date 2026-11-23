import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { getCookie, rateLimit } from '../render/security.js';

test('bad percent-encoding in the session cookie fails closed instead of crashing', () => {
  const req = value => ({ get: name => name === 'cookie' ? value : '' });
  assert.equal(getCookie(req('mm_token=%E0%A4%A'), 'mm_token'), '');
  assert.equal(getCookie(req('other=no; mm_token=hello%20world'), 'mm_token'), 'hello world');
  assert.equal(getCookie(req('other=no'), 'mm_token'), '');
  assert.equal(getCookie(req('mm_token=' + 'x'.repeat(12001)), 'mm_token'), '');
});

test('IP rate-limiting blocks floods and leaves other visitors unaffected', () => {
  const limit = rateLimit({ limit: 2, windowMs: 300000 });
  function request(ip) {
    const result = { code: 200, calls: 0, headers: {} };
    const res = {
      setHeader(k,v) { result.headers[k] = v; },
      status(n) { result.code = n; return this; },
      json(body) { result.body = body; return this; }
    };
    limit({ ip }, res, () => { result.calls++; });
    return result;
  }
  assert.equal(request('203.0.113.1').calls, 1);
  assert.equal(request('203.0.113.1').calls, 1);
  const blocked = request('203.0.113.1');
  assert.equal(blocked.code, 429);
  assert.equal(blocked.calls, 0);
  assert.ok(Number(blocked.headers['Retry-After']) > 0);
  assert.equal(request('203.0.113.2').calls, 1);
});

test('server authorizes users and owner before accepting multipart uploads', async () => {
  const code = await fs.readFile('render/server.js', 'utf8');
  assert.match(code, /const parsesUpload = !acceptsUpload/);
  assert.match(code, /if \(mod\.access === 'user' && !req\.user\)/);
  assert.match(code, /if \(slug\.startsWith\('admin\/'\) && !owner\(req\.user\)\)/);
  const auth = code.indexOf("if (mod.access === 'user' && !req.user)");
  const multer = code.indexOf("}, ...parsesUpload, async (req, res, next) => {");
  assert.ok(auth >= 0 && multer > auth);
  assert.match(code, /maxAge: 55 \* 60 \* 1000/);
  assert.match(code, /secure: true, maxAge/);
  assert.match(code, /app\.get\('\/login\.html'/);
});

test('browser hardening, media namespace and report throttles are enabled', async () => {
  const code = await fs.readFile('render/server.js', 'utf8');
  for (const header of ['X-Frame-Options', 'Content-Security-Policy', 'Strict-Transport-Security', 'Permissions-Policy'])
    assert.ok(code.includes(header), header);
  assert.match(code, /reportRate = rateLimit/);
  assert.match(code, /sessionRate = rateLimit/);
  assert.match(code, /writeRate = rateLimit/);
  assert.match(code, /photos\|admin-profiles\|admin-edited\|legacy/);
  assert.match(code, /Лимит жалоб на сегодня/);
  assert.doesNotMatch(code, /req\.user\.email\.split\('@'\)/);
  assert.match(code, /createHash\('sha256'\)/);
});

test('all admin publication paths recognize both relationship categories', async () => {
  const approval = await fs.readFile('api/admin/listings.js', 'utf8');
  const management = await fs.readFile('api/admin/manage.js', 'utf8');
  for (const category of ['noncommercial', 'support']) {
    assert.ok(approval.includes("'" + category + "'"));
    assert.ok(management.includes('"' + category + '"'));
  }
});

test('new accounts default to private activity without changing existing preferences', async () => {
  const runtime = await fs.readFile('render/runtime.js', 'utf8');
  const migration = await fs.readFile('migrations/018_private_presence_default.sql', 'utf8');
  assert.match(runtime, /visible BOOLEAN DEFAULT FALSE/);
  assert.match(migration, /ALTER TABLE users ALTER COLUMN visible SET DEFAULT FALSE/);
  assert.doesNotMatch(migration, /UPDATE users/);
});
