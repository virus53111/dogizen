import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeMaybeGzip, firstValue, mapProductRow, parseCsv } from './feed-utils.mjs';
import { verifyMerchantPrices } from './storefront-price.mjs';

const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.AWIN_DATAFEED_API_KEY || '';
const ADVERTISER_ID = String(process.env.AWIN_ADVERTISER_ID || '96499');
const FEED_ID = String(process.env.AWIN_FEED_ID || '107946');
const CACHE_MS = Number(process.env.FEED_CACHE_MS || 10 * 60 * 1000);
const FEED_LIST_URL = API_KEY ? `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(API_KEY)}` : '';
const OTTOCAST_ORIGIN = 'https://www.ottocast.com';
const ALLOWED_ORIGINS = new Set([
  'https://cenaradar.online',
  'https://www.cenaradar.online',
  'https://cenaradar.onrender.com',
]);

const here = dirname(fileURLToPath(import.meta.url));
const fallbackProducts = JSON.parse(readFileSync(join(here, 'fallback-products.json'), 'utf8')).map(product => ({
  ...product,
  url: '',
  merchantUrl: '',
  merchant: 'Ottocast',
}));

let cache = null;
let refreshPromise = null;

function field(row, names) {
  return firstValue(row, names);
}

function normalizeFeedUrl(url) {
  if (!url) return '';
  return url.replace('/adultcontent/1/', '/adultcontent/0/');
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)',
      Accept: 'application/json,text/plain,*/*',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CenaRadar/1.0 (+https://cenaradar.online)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function mapShopifyProduct(product) {
  const allVariants = Array.isArray(product.variants) ? product.variants : [];
  const availableVariants = allVariants.filter(variant => variant.available !== false);
  const variants = availableVariants.length ? availableVariants : allVariants;
  const priced = variants
    .map(variant => ({ ...variant, numericPrice: Number.parseFloat(String(variant.price || '0')) }))
    .filter(variant => Number.isFinite(variant.numericPrice) && variant.numericPrice > 0)
    .sort((a, b) => a.numericPrice - b.numericPrice);
  const chosen = priced[0];
  if (!chosen) return null;

  const destinationUrl = `${OTTOCAST_ORIGIN}/products/${encodeURIComponent(product.handle)}`;
  const compareCandidates = variants
    .map(variant => Number.parseFloat(String(variant.compare_at_price || '0')))
    .filter(value => Number.isFinite(value) && value > chosen.numericPrice);
  const compareAtPrice = compareCandidates.length ? Math.min(...compareCandidates) : null;
  const image = product.image?.src || product.images?.[0]?.src || '';
  const description = stripHtml(product.body_html || product.description || product.product_type || '').slice(0, 360);

  return {
    id: String(product.id || product.handle),
    name: product.title || product.handle,
    sku: chosen.sku || String(chosen.id || ''),
    description,
    price: chosen.numericPrice,
    compareAtPrice,
    currency: 'USD',
    image,
    url: destinationUrl,
    merchantUrl: destinationUrl,
    merchant: 'Ottocast',
    delivery: 'Check at checkout',
    brand: product.vendor || 'Ottocast',
    inStock: availableVariants.length > 0 ? '1' : '0',
    priceSource: 'merchant_storefront_list',
    lastUpdated: product.updated_at || null,
    category: product.product_type || 'Automotive electronics',
  };
}

async function loadOttocastStorefront() {
  const payload = await fetchJson(`${OTTOCAST_ORIGIN}/products.json?limit=250`);
  const sourceProducts = Array.isArray(payload?.products) ? payload.products : [];
  const baseProducts = sourceProducts.map(mapShopifyProduct).filter(Boolean);
  if (!baseProducts.length) throw new Error('Ottocast storefront returned no usable products');

  const verification = await verifyMerchantPrices(baseProducts, fetchText, { concurrency: 8 });
  const products = verification.products;
  const mirror = products.find(product => /mirror touch/i.test(product.name || ''));
  console.log(`Ottocast page-price verification: verified=${verification.verified}, corrected=${verification.corrected}${mirror ? `, mirrorTouch=${mirror.price}` : ''}`);

  return {
    products,
    meta: {
      source: 'Ottocast product pages',
      merchant: 'Ottocast',
      fetchedAt: new Date().toISOString(),
      live: true,
      priceSource: 'merchant_product_page',
      productCount: products.length,
      verifiedPrices: verification.verified,
      correctedPrices: verification.corrected,
    },
  };
}

async function resolveBackupFeed() {
  if (!FEED_LIST_URL) throw new Error('Backup feed is not configured');
  const listText = await fetchText(FEED_LIST_URL);
  const feeds = parseCsv(listText);

  const match = feeds.find(row => {
    const advertiser = String(field(row, ['Advertiser ID', 'advertiser_id', 'Merchant ID', 'merchant_id']));
    const feed = String(field(row, ['Feed ID', 'feed_id', 'Datafeed ID', 'data_feed_id']));
    return advertiser === ADVERTISER_ID && feed === FEED_ID;
  });

  if (!match) throw new Error(`Backup feed ${FEED_ID} was not found`);
  const url = normalizeFeedUrl(field(match, ['URL', 'Url', 'url', 'Download URL', 'download_url']));
  if (!url) throw new Error('Backup feed download URL is missing');

  return {
    url,
    lastImported: field(match, ['Last Imported', 'last_imported', 'Last Update', 'last_updated']),
    name: field(match, ['Feed Name', 'feed_name', 'Datafeed Name', 'datafeed_name']) || 'Ottocast',
  };
}

async function loadBackupFeed() {
  const feed = await resolveBackupFeed();
  const compressed = await fetchBuffer(feed.url);
  const csvText = decodeMaybeGzip(compressed);
  const rows = parseCsv(csvText);
  const products = rows
    .map(mapProductRow)
    .map(product => ({ ...product, merchant: 'Ottocast' }))
    .filter(product => product.id && product.name && product.price > 0);
  if (!products.length) throw new Error('Backup feed returned no usable products');

  return {
    products,
    meta: {
      source: 'Backup product feed',
      merchant: 'Ottocast',
      feedId: FEED_ID,
      feedName: feed.name,
      feedLastImported: feed.lastImported || null,
      fetchedAt: new Date().toISOString(),
      live: true,
      priceSource: 'backup_feed',
      productCount: products.length,
    },
  };
}

async function loadRemoteProducts() {
  try {
    return await loadOttocastStorefront();
  } catch (storefrontError) {
    console.error(`Ottocast storefront refresh failed: ${storefrontError instanceof Error ? storefrontError.message : 'unknown error'}`);
    return loadBackupFeed();
  }
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
      console.error(`Product refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      if (cache) {
        return {
          ...cache.payload,
          meta: { ...cache.payload.meta, live: false, stale: true, warning: 'Live refresh temporarily failed; showing cached data.' },
        };
      }
      return {
        products: fallbackProducts,
        meta: {
          source: 'Local product snapshot',
          merchant: 'Ottocast',
          fetchedAt: null,
          live: false,
          stale: true,
          priceSource: 'snapshot',
          warning: 'Live sources are temporarily unavailable; showing the last local snapshot.',
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
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'cenaradar-feed-api',
      cachedProducts: cache?.payload?.products?.length || 0,
      source: cache?.payload?.meta?.source || null,
      priceSource: cache?.payload?.meta?.priceSource || null,
      verifiedPrices: cache?.payload?.meta?.verifiedPrices || 0,
      correctedPrices: cache?.payload?.meta?.correctedPrices || 0,
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
    console.log(`Product warmup: ${payload.products.length} products, source=${payload.meta?.source}, live=${Boolean(payload.meta?.live)}`);
  });
});
