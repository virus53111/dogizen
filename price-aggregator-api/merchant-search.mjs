import * as cheerio from 'cheerio';
import { firstValue, parseCsv } from './feed-utils.mjs';
import { searchConfiguredMerchantFeeds } from './merchant-feeds.mjs';

const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';
const QUERY_CACHE_MS = 10 * 60 * 1000;
const ENABLE_PUBLIC_PAGE_SEARCH = process.env.ENABLE_PUBLIC_PAGE_SEARCH === '1';
const cache = new Map();

function clean(value = '') {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function positiveNumber(value) {
  if (value == null) return null;
  const raw = clean(value)
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  const number = Number.parseFloat(raw);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function absoluteUrl(base, href = '') {
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'lv,en;q=0.8,ru;q=0.7',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function productFromJsonLd(node, merchant, baseUrl) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(item => productFromJsonLd(item, merchant, baseUrl));

  let output = [];
  const type = node['@type'];
  const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
  if (isProduct) {
    const rawOffers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
    const offers = rawOffers.flatMap(offer => Array.isArray(offer?.offers) ? offer.offers : offer ? [offer] : []);
    const priced = offers
      .map(offer => ({ offer, price: positiveNumber(offer?.price ?? offer?.lowPrice) }))
      .filter(item => item.price)
      .sort((a, b) => a.price - b.price);
    const selected = priced[0];
    const imageRaw = Array.isArray(node.image) ? node.image[0] : typeof node.image === 'object' ? node.image?.url : node.image;
    const url = absoluteUrl(baseUrl, selected?.offer?.url || node.url || '');
    const name = clean(node.name || '');
    if (name && selected?.price && url) {
      output.push({
        id: `${merchant}:${node.sku || node.productID || node.mpn || url}`,
        name,
        sku: clean(node.sku || node.mpn || node.productID || ''),
        description: clean(node.description || '').slice(0, 360),
        price: selected.price,
        compareAtPrice: null,
        currency: clean(selected.offer?.priceCurrency || 'EUR') || 'EUR',
        image: absoluteUrl(baseUrl, imageRaw || ''),
        url,
        merchantUrl: url,
        merchant,
        delivery: '',
        brand: clean(typeof node.brand === 'object' ? node.brand?.name : node.brand || ''),
        inStock: String(selected.offer?.availability || '').toLowerCase().includes('outofstock') ? '0' : '1',
        priceSource: 'merchant_public_page',
        lastUpdated: null,
        category: clean(node.category || ''),
      });
    }
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') output = output.concat(productFromJsonLd(value, merchant, baseUrl));
  }
  return output;
}

function parseJsonLd(html, merchant, baseUrl) {
  const $ = cheerio.load(html);
  const products = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      products.push(...productFromJsonLd(JSON.parse(raw), merchant, baseUrl));
    } catch {
      // Ignore malformed third-party JSON-LD.
    }
  });
  return dedupe(products, 24);
}

function dedupe(products, limit = 100) {
  const seen = new Set();
  const output = [];
  for (const product of products) {
    const key = `${product.merchant || ''}|${product.url || product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(product);
    if (output.length >= limit) break;
  }
  return output;
}

async function searchPublicPage(name, baseUrl, searchUrl) {
  const html = await fetchHtml(searchUrl);
  return parseJsonLd(html, name, baseUrl);
}

async function searchDateks(query) {
  return searchPublicPage('Dateks.lv', 'https://www.dateks.lv', `https://www.dateks.lv/meklet?q=${encodeURIComponent(query)}`);
}

async function search220(query) {
  return searchPublicPage('220.lv', 'https://220.lv', `https://220.lv/lv/search?q=${encodeURIComponent(query)}`);
}

async function searchRd(query) {
  return searchPublicPage('RD Electronics', 'https://www.rdveikals.lv', `https://www.rdveikals.lv/search/lv/word/${encodeURIComponent(query)}/page/1/`);
}

export async function searchPublicMerchants(query) {
  const q = clean(query).slice(0, 120);
  if (q.length < 2) return { products: [], sources: [] };
  const key = `${ENABLE_PUBLIC_PAGE_SEARCH ? 'pages' : 'feeds'}:${q.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < QUERY_CACHE_MS) return cached.payload;

  const feedResult = await searchConfiguredMerchantFeeds(q);
  const products = [...feedResult.products];
  const sources = [...feedResult.sources];

  if (ENABLE_PUBLIC_PAGE_SEARCH) {
    const connectors = [
      ['Dateks.lv', searchDateks],
      ['220.lv', search220],
      ['RD Electronics', searchRd],
    ];
    const settled = await Promise.allSettled(connectors.map(([, fn]) => fn(q)));
    settled.forEach((result, index) => {
      const name = connectors[index][0];
      if (result.status === 'fulfilled') {
        products.push(...result.value);
        sources.push({ name, ok: true, count: result.value.length, mode: 'public_page' });
      } else {
        sources.push({ name, ok: false, count: 0, mode: 'public_page', error: result.reason instanceof Error ? result.reason.message : 'Search failed' });
      }
    });
  }

  const payload = { products: dedupe(products, 120), sources, fetchedAt: new Date().toISOString() };
  cache.set(key, { time: Date.now(), payload });
  return payload;
}

async function inspectAwinFeedList() {
  const apiKey = process.env.AWIN_DATAFEED_API_KEY || '';
  if (!apiKey) return;
  const response = await fetch(`https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(apiKey)}`, {
    headers: { 'User-Agent': UA, Accept: 'text/csv,text/plain,*/*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rows = parseCsv(await response.text());
  const candidates = rows.filter(row => {
    const region = clean(firstValue(row, ['Primary Region', 'primary_region'])).toUpperCase();
    const name = clean(firstValue(row, ['Advertiser Name', 'advertiser_name', 'Merchant Name', 'merchant_name']));
    return region === 'LV' || /220\.lv|1a\.lv|dateks|euronics|ksenukai|modivo|eapavi|douglas/i.test(name);
  });
  const compact = candidates.slice(0, 50).map(row => ({
    advertiserId: clean(firstValue(row, ['Advertiser ID', 'advertiser_id', 'Merchant ID', 'merchant_id'])),
    advertiser: clean(firstValue(row, ['Advertiser Name', 'advertiser_name', 'Merchant Name', 'merchant_name'])),
    region: clean(firstValue(row, ['Primary Region', 'primary_region'])),
    membership: clean(firstValue(row, ['Membership Status', 'membership_status'])),
    feedId: clean(firstValue(row, ['Feed ID', 'feed_id', 'Datafeed ID', 'data_feed_id'])),
    feedName: clean(firstValue(row, ['Feed Name', 'feed_name', 'Datafeed Name', 'datafeed_name'])),
    language: clean(firstValue(row, ['Language', 'language'])),
    lastImported: clean(firstValue(row, ['Last Imported', 'last_imported'])),
  }));
  console.log(`Awin feed candidates (${compact.length}/${rows.length}): ${JSON.stringify(compact)}`);
}

void inspectAwinFeedList().catch(error => {
  console.error(`Awin feed inspection failed: ${error instanceof Error ? error.message : 'unknown error'}`);
});
