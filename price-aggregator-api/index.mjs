import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeMaybeGzip, firstValue, mapProductRow, parseCsv } from './feed-utils.mjs';

const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.AWIN_DATAFEED_API_KEY || '';
const ADVERTISER_ID = String(process.env.AWIN_ADVERTISER_ID || '96499');
const FEED_ID = String(process.env.AWIN_FEED_ID || '107946');
const CACHE_MS = Number(process.env.FEED_CACHE_MS || 30 * 60 * 1000);
const FEED_LIST_URL = API_KEY ? `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(API_KEY)}` : '';
const ALLOWED_ORIGINS = new Set([
  'https://cenaradar.online',
  'https://www.cenaradar.online',
  'https://cenaradar.onrender.com',
]);

const here = dirname(fileURLToPath(import.meta.url));
const fallbackProducts = JSON.parse(readFileSync(join(here, 'fallback-products.json'), 'utf8'));

let cache = null;
let refreshPromise = null;

function field(row, names) {
  return firstValue(row, names);
}

function normalizeFeedUrl(url) {
  if (!url) return '';
  return url.replace('/adultcontent/1/', '/adultcontent/0/');
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CenaRadar/1.0 (+https://cenaradar.online)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CenaRadar/1.0 (+https://cenaradar.online)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function resolveAwinFeed() {
  if (!FEED_LIST_URL) throw new Error('AWIN_DATAFEED_API_KEY is not configured');
  const listText = await fetchText(FEED_LIST_URL);
  const feeds = parseCsv(listText);

  const match = feeds.find(row => {
    const advertiser = String(field(row, ['Advertiser ID', 'advertiser_id', 'Merchant ID', 'merchant_id']));
    const feed = String(field(row, ['Feed ID', 'feed_id', 'Datafeed ID', 'data_feed_id']));
    return advertiser === ADVERTISER_ID && feed === FEED_ID;
  });

  if (!match) throw new Error(`Awin feed ${FEED_ID} for advertiser ${ADVERTISER_ID} was not found`);

  const url = normalizeFeedUrl(field(match, ['URL', 'Url', 'url', 'Download URL', 'download_url']));
  if (!url) throw new Error('Awin feed download URL is missing');

  return {
    url,
    lastImported: field(match, ['Last Imported', 'last_imported', 'Last Update', 'last_updated']),
    name: field(match, ['Feed Name', 'feed_name', 'Datafeed Name', 'datafeed_name']) || 'Ottocast',
  };
}

async function loadRemoteProducts() {
  const feed = await resolveAwinFeed();
  const compressed = await fetchBuffer(feed.url);
  const csvText = decodeMaybeGzip(compressed);
  const rows = parseCsv(csvText);
  const products = rows
    .map(mapProductRow)
    .filter(product => product.id && product.name && product.url && product.price > 0);

  if (!products.length) throw new Error('Awin feed returned no usable products');

  return {
    products,
    meta: {
      source: 'Awin product feed',
      advertiser: 'Ottocast',
      advertiserId: ADVERTISER_ID,
      feedId: FEED_ID,
      feedName: feed.name,
      feedLastImported: feed.lastImported || null,
      fetchedAt: new Date().toISOString(),
      live: true,
    },
  };
}

async function getProducts() {
  const now = Date.now();
  if (cache && now - cache.cachedAt < CACHE_MS) return cache.payload;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const payload = await loadRemoteProducts();
      cache = { cachedAt: Date.now(), payload };
      return payload;
    } catch (error) {
      console.error(`Awin feed refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      if (cache) {
        return {
          ...cache.payload,
          meta: {
            ...cache.payload.meta,
            live: false,
            stale: true,
            warning: 'Live refresh temporarily failed; showing the most recent cached feed.',
          },
        };
      }
      return {
        products: fallbackProducts,
        meta: {
          source: 'Awin product feed snapshot',
          advertiser: 'Ottocast',
          advertiserId: ADVERTISER_ID,
          feedId: FEED_ID,
          feedName: 'OTTOCAST Default Product Feeds',
          feedLastImported: null,
          fetchedAt: null,
          live: false,
          stale: true,
          warning: 'Live feed is temporarily unavailable; showing the last verified snapshot.',
        },
      };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'cenaradar-feed-api',
      feedConfigured: Boolean(API_KEY),
      cachedProducts: cache?.payload?.products?.length || 0,
    });
  }

  if (req.method === 'GET' && (url.pathname === '/api/ottocast' || url.pathname === '/api/products')) {
    return sendJson(res, 200, await getProducts());
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CenaRadar feed API listening on ${PORT}`);
  void getProducts().then(payload => {
    console.log(`Awin feed warmup: ${payload.products.length} products, live=${Boolean(payload.meta?.live)}`);
  });
});
