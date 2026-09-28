import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 10000);
const here = dirname(fileURLToPath(import.meta.url));
const STORE = process.env.ANALYTICS_FILE || join(here, 'analytics-store.json');
let analytics = load();

function load() { try { return JSON.parse(readFileSync(STORE, 'utf8')); } catch { return { days: {} }; } }
function clean(value, max = 160) { return String(value || '').replace(/[<>\u0000-\u001f]/g, '').slice(0, max); }
function bump(target, key) { target[key] = (target[key] || 0) + 1; }
function save() { try { writeFileSync(STORE, JSON.stringify(analytics)); } catch (error) { console.error('Save failed', error.message); } }
function record(payload = {}) {
  const date = new Date().toISOString().slice(0, 10);
  const site = ['murdilimax', 'cenaradar'].includes(payload.site) ? payload.site : 'unknown';
  const day = analytics.days[date] ||= { sites: {} };
  const row = day.sites[site] ||= { views: 0, sessions: {}, events: {}, paths: {}, sources: {}, devices: {}, languages: {} };
  const event = clean(payload.event || 'page_view', 40);
  const session = clean(payload.session, 80);
  if (event === 'page_view') row.views += 1;
  if (session) row.sessions[session] = 1;
  bump(row.events, event); bump(row.paths, clean(payload.path || '/')); bump(row.sources, clean(payload.source || 'direct', 100));
  bump(row.devices, clean(payload.device || 'unknown', 30)); bump(row.languages, clean(payload.language || 'unknown', 20));
  const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  for (const key of Object.keys(analytics.days)) if (key < cutoff) delete analytics.days[key];
  save();
}
function summary() {
  const sites = {};
  for (const [date, day] of Object.entries(analytics.days).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [site, row] of Object.entries(day.sites || {})) {
      const total = sites[site] ||= { views: 0, visitors: 0, events: {}, paths: {}, sources: {}, devices: {}, languages: {}, daily: [] };
      total.views += row.views || 0; total.visitors += Object.keys(row.sessions || {}).length;
      total.daily.push({ date, views: row.views || 0, visitors: Object.keys(row.sessions || {}).length });
      for (const group of ['events', 'paths', 'sources', 'devices', 'languages']) for (const [key, count] of Object.entries(row[group] || {})) total[group][key] = (total[group][key] || 0) + count;
    }
  }
  return { generatedAt: new Date().toISOString(), sites };
}
function json(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 12000) reject(Error('Too large')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Error('Invalid JSON')); } }); req.on('error', reject); }); }
function send(res, status, data) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); }

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  try {
    if (req.method === 'GET' && (path === '/' || path === '/health')) return send(res, 200, { ok: true });
    if (req.method === 'POST' && path === '/api/analytics') { record(await json(req)); return send(res, 202, { ok: true }); }
    if (req.method === 'GET' && path === '/api/analytics/summary') return send(res, 200, summary());
    return send(res, 404, { error: 'Not found' });
  } catch (error) { return send(res, 400, { error: error.message }); }
}).listen(PORT, '0.0.0.0', () => console.log(`Analytics API ready on ${PORT}`));
