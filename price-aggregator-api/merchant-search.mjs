import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';
const QUERY_CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

function clean(value = '') {
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
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

  const type = node['@type'];
  const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
  let output = [];

  if (isProduct) {
    const offerRaw = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
    const offers = offerRaw.flatMap(offer => {
      if (!offer || typeof offer !== 'object') return [];
      if (Array.isArray(offer.offers)) return offer.offers;
      return [offer];
    });
    const prices = offers
      .map(offer => positiveNumber(offer.price ?? offer.lowPrice))
      .filter(Boolean);
    const price = prices.length ? Math.min(...prices) : null;
    const offer = offers.find(item => positiveNumber(item?.price ?? item?.lowPrice) === price) || offers[0] || {};
    const image = Array.isArray(node.image) ? node.image[0] : typeof node.image === 'object' ? node.image?.url : node.image;
    const url = absoluteUrl(baseUrl, offer.url || node.url || '');
    const name = clean(node.name || '');
    if (name && price && url) {
      output.push({
        id: `${merchant}:${node.sku || node.productID || node.mpn || url}`,
        name,
        sku: clean(node.sku || node.mpn || node.productID || ''),
        description: clean(node.description || '').slice(0, 320),
        price,
        compareAtPrice: null,
        currency: clean(offer.priceCurrency || 'EUR') || 'EUR',
        image: absoluteUrl(baseUrl, image || ''),
        url,
        merchantUrl: url,
        merchant,
        delivery: '',
        brand: clean(typeof node.brand === 'object' ? node.brand?.name : node.brand || ''),
        inStock: String(offer.availability || '').toLowerCase().includes('outofstock') ? '0' : '1',
        priceSource: 'merchant_search_page',
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

function parseJsonLd($, merchant, baseUrl) {
  const products = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      products.push(...productFromJsonLd(parsed, merchant, baseUrl));
    } catch {
      // Ignore malformed third-party blocks.
    }
  });
  return products;
}

function findCompactCard($, anchor, productHrefRegex) {
  let node = $(anchor);
  for (let depth = 0; depth < 8; depth += 1) {
    const parent = node.parent();
    if (!parent.length) break;
    const text = clean(parent.text());
    const productLinks = parent.find('a').filter((_, el) => productHrefRegex.test($(el).attr('href') || '')).length;
    if (/€/.test(text) && text.length < 3500 && productLinks <= 4) return parent;
    node = parent;
  }
  return $(anchor).parent();
}

function firstImage($, card, baseUrl) {
  const img = card.find('img').first();
  return absoluteUrl(baseUrl, img.attr('src') || img.attr('data-src') || img.attr('data-original') || '');
}

function firstEuroPrice(text) {
  const normalized = clean(text);
  const patterns = [
    /(\d{1,3}(?:[ .]\d{3})*[,.]\d{2})\s*€/,
    /(\d+[,.]\d{2})\s*€/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const value = positiveNumber(match?.[1]);
    if (value) return value;
  }
  return null;
}

function parseDateksFallback($) {
  const baseUrl = 'https://www.dateks.lv';
  const productHref = /\/(?:en\/|ru\/)?cenas\/[^/]+\/(\d+)-[^?#]+/i;
  const results = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(productHref);
    if (!match) return;
    const url = absoluteUrl(baseUrl, href);
    if (!url || seen.has(url)) return;
    const name = clean($(el).text());
    if (name.length < 4) return;
    const card = findCompactCard($, el, productHref);
    const text = clean(card.text());
    const price = firstEuroPrice(text);
    if (!price) return;
    seen.add(url);
    const skuMatch = text.match(/(?:Preces kods|Product code|Код товара)\s*:?\s*([^\s|]+)/i);
    const unavailable = /nav pieejama|not available|недоступ/i.test(text);
    results.push({
      id: `Dateks.lv:${match[1]}`,
      name,
      sku: clean(skuMatch?.[1] || ''),
      description: '',
      price,
      compareAtPrice: null,
      currency: 'EUR',
      image: firstImage($, card, baseUrl),
      url,
      merchantUrl: url,
      merchant: 'Dateks.lv',
      delivery: /Noliktavā|In stock|На складе/i.test(text) ? 'In stock' : /Pasūtāms|Can be ordered|Под заказ/i.test(text) ? 'Orderable' : '',
      brand: clean(name.split(' ')[0] || ''),
      inStock: unavailable ? '0' : '1',
      priceSource: 'merchant_search_page',
      lastUpdated: null,
      category: '',
    });
  });
  return results;
}

function parse220Fallback($) {
  const baseUrl = 'https://220.lv';
  const productHref = /\/lv\/.+(?:\?|&)id=(\d+)/i;
  const results = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(productHref);
    if (!match) return;
    const url = absoluteUrl(baseUrl, href);
    if (!url || seen.has(url)) return;
    const name = clean($(el).text());
    if (name.length < 4) return;
    const card = findCompactCard($, el, productHref);
    const text = clean(card.text());
    let price = firstEuroPrice(text);

    if (!price) {
      const compact = text.match(/(\d{1,4})\s*(\d{2})\s*€/);
      if (compact) price = positiveNumber(`${compact[1]}.${compact[2]}`);
    }
    if (!price) return;
    seen.add(url);
    results.push({
      id: `220.lv:${match[1]}`,
      name,
      sku: '',
      description: '',
      price,
      compareAtPrice: null,
      currency: 'EUR',
      image: firstImage($, card, baseUrl),
      url,
      merchantUrl: url,
      merchant: '220.lv',
      delivery: /IZŅEM ŠODIEN|IZŅEM RĪT/i.test(text) ? 'Pickup available' : /SAŅEM/i.test(text) ? 'Delivery available' : '',
      brand: clean(name.split(' ')[0] || ''),
      inStock: '1',
      priceSource: 'merchant_search_page',
      lastUpdated: null,
      category: '',
    });
  });
  return results;
}

function parseRdFallback($) {
  const baseUrl = 'https://www.rdveikals.lv';
  const productHref = /(?:^|\/)products\/lv\/\d+\/(\d+)\/[^?#]+\.html(?:[?#].*)?$/i;
  const results = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(productHref);
    if (!match) return;
    const rootedHref = href.startsWith('/') ? href : `/${href.replace(/^\.\//, '')}`;
    const url = absoluteUrl(baseUrl, rootedHref);
    if (!url || seen.has(url)) return;
    const name = clean($(el).text());
    if (name.length < 4) return;
    const card = findCompactCard($, el, productHref);
    const text = clean(card.text());
    const price = firstEuroPrice(text);
    if (!price) return;
    seen.add(url);
    results.push({
      id: `RD Electronics:${match[1]}`,
      name,
      sku: '',
      description: '',
      price,
      compareAtPrice: null,
      currency: 'EUR',
      image: firstImage($, card, baseUrl),
      url,
      merchantUrl: url,
      merchant: 'RD Electronics',
      delivery: /Saņem šodien/i.test(text) ? 'Pickup today' : /Saņem rīt|Saņem rītdien/i.test(text) ? 'Pickup tomorrow' : /Saņem no/i.test(text) ? 'Delivery available' : '',
      brand: '',
      inStock: /Nav pieejams|Izpārdots/i.test(text) ? '0' : '1',
      priceSource: 'merchant_search_page',
      lastUpdated: null,
      category: '',
    });
  });
  return results;
}

function dedupe(products, limit = 24) {
  const seen = new Set();
  const output = [];
  for (const product of products) {
    const key = `${product.merchant}|${product.url || product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(product);
    if (output.length >= limit) break;
  }
  return output;
}

async function searchDateks(query) {
  const searchUrl = `https://www.dateks.lv/meklet?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const structured = parseJsonLd($, 'Dateks.lv', 'https://www.dateks.lv');
  const fallback = parseDateksFallback($);
  return dedupe(structured.length ? structured : fallback, 24);
}

async function search220(query) {
  const searchUrl = `https://220.lv/lv/search?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const structured = parseJsonLd($, '220.lv', 'https://220.lv');
  const fallback = parse220Fallback($);
  return dedupe(structured.length ? structured : fallback, 24);
}

async function searchRd(query) {
  const searchUrl = `https://www.rdveikals.lv/search/lv/word/${encodeURIComponent(query)}/page/1/`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const structured = parseJsonLd($, 'RD Electronics', 'https://www.rdveikals.lv');
  const fallback = parseRdFallback($);
  return dedupe(structured.length ? structured : fallback, 24);
}

export async function searchPublicMerchants(query) {
  const q = clean(query).slice(0, 120);
  if (q.length < 2) return { products: [], sources: [] };
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < QUERY_CACHE_MS) return cached.payload;

  const connectors = [
    ['Dateks.lv', searchDateks],
    ['220.lv', search220],
    ['RD Electronics', searchRd],
  ];
  const settled = await Promise.allSettled(connectors.map(([, fn]) => fn(q)));
  const products = [];
  const sources = settled.map((result, index) => {
    const name = connectors[index][0];
    if (result.status === 'fulfilled') {
      products.push(...result.value);
      return { name, ok: true, count: result.value.length };
    }
    return { name, ok: false, count: 0, error: result.reason instanceof Error ? result.reason.message : 'Search failed' };
  });

  const payload = { products: dedupe(products, 72), sources, fetchedAt: new Date().toISOString() };
  cache.set(key, { time: Date.now(), payload });
  return payload;
}
