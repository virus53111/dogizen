import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeMaybeGzip, firstValue, mapProductRow, parseCsv } from './feed-utils.mjs';
import { verifyMerchantPrices } from './storefront-price.mjs';
import { configuredMerchantNames, searchConfiguredMerchantFeeds } from './merchant-feeds.mjs';
import { getTradedoublerStatus, searchTradedoublerProducts, tradedoublerConfigured } from './tradedoubler-products.mjs';

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

let catalogCache = null;
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

function normalizeSearch(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function productMatches(product, query) {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch([
    product.name,
    product.brand,
    product.sku,
    product.model,
    product.mpn,
    product.ean,
    product.category,
    product.description,
    product.merchant,
  ].filter(Boolean).join(' '));
  return q.split(' ').filter(Boolean).every(token => haystack.includes(token));
}

function dedupeProducts(products) {
  const seen = new Set();
  const output = [];
  for (const product of products) {
    if (!product || !product.name || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) continue;
    const key = `${product.merchant || ''}|${product.url || product.merchantUrl || product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(product);
  }
  return output;
}

function mergeStores(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const store of Array.isArray(list) ? list : []) {
      if (!store?.name || store.ok === false) continue;
      const key = String(store.name).toLowerCase();
      const existing = map.get(key);
      const count = Number(store.total ?? store.count ?? 0);
      if (!existing) {
        map.set(key, {
          name: store.name,
          count: Number.isFinite(count) ? count : 0,
          mode: store.mode,
        });
      } else if (Number.isFinite(count) && count > existing.count) {
        existing.count = count;
      }
    }
  }
  return [...map.values()];
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
    priceSource: 'merchant_product_page',
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
  const mirror = verification.products.find(product => /mirror touch/i.test(product.name || ''));
  console.log(`Ottocast page-price verification: verified=${verification.verified}, corrected=${verification.corrected}${mirror ? `, mirrorTouch=${mirror.price}` : ''}`);

  return {
    products: verification.products,
    source: { name: 'Ottocast', ok: true, count: verification.products.length, mode: 'storefront' },
    verifiedPrices: verification.verified,
    correctedPrices: verification.corrected,
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
  return { url };
}

async function loadOttocastBackup() {
  const feed = await resolveBackupFeed();
  const compressed = await fetchBuffer(feed.url);
  const rows = parseCsv(decodeMaybeGzip(compressed));
  const products = rows
    .map(mapProductRow)
    .map(product => ({ ...product, merchant: 'Ottocast', url: product.merchantUrl || product.url }))
    .filter(product => product.id && product.name && product.price > 0);
  if (!products.length) throw new Error('Backup feed returned no usable products');
  return {
    products,
    source: { name: 'Ottocast', ok: true, count: products.length, mode: 'backup_feed' },
    verifiedPrices: 0,
    correctedPrices: 0,
  };
}

async function loadOttocast() {
  try {
    return await loadOttocastStorefront();
  } catch (error) {
    console.error(`Ottocast storefront refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    try {
      return await loadOttocastBackup();
    } catch (backupError) {
      console.error(`Ottocast backup refresh failed: ${backupError instanceof Error ? backupError.message : 'unknown error'}`);
      return {
        products: fallbackProducts,
        source: { name: 'Ottocast', ok: false, count: fallbackProducts.length, mode: 'snapshot' },
        verifiedPrices: 0,
        correctedPrices: 0,
      };
    }
  }
}

async function loadUnifiedCatalog() {
  const [merchantFeeds, ottocast, tradedoubler] = await Promise.all([
    searchConfiguredMerchantFeeds('', 100000),
    loadOttocast(),
    getTradedoublerStatus(),
  ]);

  const products = dedupeProducts([
    ...merchantFeeds.products,
    ...ottocast.products,
  ]);
  const sources = [
    ...merchantFeeds.sources,
    ottocast.source,
    ...tradedoubler.sources,
  ];
  const connected = sources.filter(source => source.ok && (source.count > 0 || source.searchOnly));
  const stores = mergeStores(connected);

  console.log(`Unified catalog: ${products.length} cached products, ${stores.length} active stores (${stores.map(store => `${store.name}=${store.count}`).join(', ')})`);

  return {
    products,
    meta: {
      source: 'Direct merchant catalog feeds',
      fetchedAt: new Date().toISOString(),
      live: stores.length > 0,
      priceSource: 'merchant_direct',
      productCount: products.length,
      storeCount: stores.length,
      stores,
      sources,
      tradedoublerConfigured: tradedoubler.configured,
      verifiedPrices: ottocast.verifiedPrices,
      correctedPrices: ottocast.correctedPrices,
    },
  };
}

async function getProducts() {
  const now = Date.now();
  if (catalogCache && now - catalogCache.cachedAt < CACHE_MS) return catalogCache.payload;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const payload = await loadUnifiedCatalog();
      catalogCache = { cachedAt: Date.now(), payload };
      return payload;
    } catch (error) {
      console.error(`Unified catalog refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      if (catalogCache) {
        return {
          ...catalogCache.payload,
          meta: { ...catalogCache.payload.meta, live: false, stale: true, warning: 'Live refresh temporarily failed; showing cached data.' },
        };
      }
      return {
        products: fallbackProducts,
        meta: {
          source: 'Local product snapshot',
          fetchedAt: null,
          live: false,
          stale: true,
          priceSource: 'snapshot',
          productCount: fallbackProducts.length,
          storeCount: 1,
          stores: [{ name: 'Ottocast', count: fallbackProducts.length, mode: 'snapshot' }],
          sources: [],
          tradedoublerConfigured: tradedoublerConfigured(),
          warning: 'Live sources are temporarily unavailable; showing the last local snapshot.',
        },
      };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function searchAllMerchants(query) {
  const q = String(query || '').trim().slice(0, 120);
  const [catalog, tradedoubler] = await Promise.all([
    getProducts(),
    q.length >= 2 ? searchTradedoublerProducts(q, 120) : Promise.resolve({ products: [], sources: [] }),
  ]);

  const localProducts = q.length >= 2
    ? catalog.products.filter(product => productMatches(product, q))
    : catalog.products;
  const products = dedupeProducts([
    ...tradedoubler.products,
    ...localProducts,
  ]);
  const stores = mergeStores(catalog.meta?.stores, tradedoubler.sources);

  return {
    products,
    meta: {
      ...catalog.meta,
      query: q,
      productCount: products.length,
      storeCount: stores.length,
      stores,
      searchSources: tradedoubler.sources,
      fetchedAt: new Date().toISOString(),
    },
  };
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

function sendJson(res, status, payload, cacheControl = 'public, max-age=120, stale-while-revalidate=600') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
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
    const payload = await getProducts();
    return sendJson(res, 200, {
      ok: true,
      service: 'cenaradar-feed-api',
      cachedProducts: payload.products.length,
      source: payload.meta?.source || null,
      priceSource: payload.meta?.priceSource || null,
      storeCount: payload.meta?.storeCount || 0,
      stores: payload.meta?.stores || [],
      tradedoublerConfigured: tradedoublerConfigured(),
      verifiedPrices: payload.meta?.verifiedPrices || 0,
      correctedPrices: payload.meta?.correctedPrices || 0,
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/integrations') {
    const tradedoubler = await getTradedoublerStatus();
    return sendJson(res, 200, {
      merchantFeeds: configuredMerchantNames(),
      tradedoubler: {
        configured: tradedoubler.configured,
        sources: tradedoubler.sources,
      },
    }, 'no-store');
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    try {
      const query = url.searchParams.get('q') || '';
      return sendJson(res, 200, await searchAllMerchants(query), 'public, max-age=60, stale-while-revalidate=300');
    } catch (error) {
      return sendJson(res, 502, { error: error instanceof Error ? error.message : 'Search failed' }, 'no-store');
    }
  }

  if (req.method === 'GET' && (url.pathname === '/api/ottocast' || url.pathname === '/api/products')) {
    return sendJson(res, 200, await getProducts(), 'public, max-age=300, stale-while-revalidate=900');
  }

  return sendJson(res, 404, { error: 'Not found' }, 'no-store');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CenaRadar feed API listening on ${PORT}`);
  void getProducts()
    .then(payload => console.log(`Product warmup: ${payload.products.length} products, stores=${payload.meta?.storeCount || 0}, live=${Boolean(payload.meta?.live)}`))
    .catch(error => console.error(`Product warmup failed: ${error instanceof Error ? error.message : 'unknown error'}`));
});
