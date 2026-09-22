const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';
const TOKEN = process.env.TRADEDOUBLER_PRODUCTS_TOKEN || '';
const FEEDS_CACHE_MS = 60 * 60 * 1000;
const DEFAULT_PROGRAM_PATTERN = /(?:^|\b)(220(?:\.lv)?|1a(?:\.lv)?|ksenukai|euronics|rd\s*electronics|dateks)(?:\b|$)/i;
let feedsCache = null;

function clean(value = '') {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function positiveNumber(value) {
  if (value && typeof value === 'object' && 'value' in value) return positiveNumber(value.value);
  const n = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function feedLabel(feed) {
  const programs = Array.isArray(feed?.programs) ? feed.programs.map(program => clean(program?.name)).filter(Boolean) : [];
  return clean([...programs, feed?.name].filter(Boolean).join(' · '));
}

function feedAllowed(feed) {
  if (!feed?.active || feed?.visible === false) return false;
  const explicit = clean(process.env.TRADEDOUBLER_PROGRAM_MATCH || '');
  const label = feedLabel(feed);
  if (explicit) {
    const terms = explicit.split(',').map(term => term.trim().toLowerCase()).filter(Boolean);
    return terms.some(term => label.toLowerCase().includes(term));
  }
  return DEFAULT_PROGRAM_PATTERN.test(label);
}

async function getFeeds() {
  if (!TOKEN) return [];
  if (feedsCache && Date.now() - feedsCache.time < FEEDS_CACHE_MS) return feedsCache.feeds;
  const payload = await getJson(`https://api.tradedoubler.com/1.0/productFeeds?token=${encodeURIComponent(TOKEN)}`);
  const feeds = (Array.isArray(payload?.feeds) ? payload.feeds : [])
    .filter(feedAllowed)
    .map(feed => ({
      feedId: Number(feed.feedId),
      name: feedLabel(feed) || `Feed ${feed.feedId}`,
      currency: clean(feed.currencyISOCode || 'EUR') || 'EUR',
      language: clean(feed.languageISOCode || ''),
      products: Number(feed.numberOfProducts || 0),
      lastModified: feed.lastModifiedTime || null,
    }))
    .filter(feed => Number.isFinite(feed.feedId));
  feedsCache = { time: Date.now(), feeds };
  console.log(`Tradedoubler feeds selected: ${feeds.map(feed => `${feed.name}#${feed.feedId}(${feed.products})`).join(', ') || 'none'}`);
  return feeds;
}

function latestPriceHistory(offer) {
  const history = Array.isArray(offer?.priceHistory) ? offer.priceHistory : [];
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => Number(b?.date || 0) - Number(a?.date || 0));
  return sorted[0]?.price || null;
}

function productOfferToCenaRadar(product, offer, feed) {
  const directUrl = clean(offer?.sourceProductUrl || '');
  if (!directUrl) return null;
  const historyPrice = latestPriceHistory(offer);
  const price = positiveNumber(offer?.price) || positiveNumber(product?.price) || positiveNumber(historyPrice);
  if (!price) return null;
  const currency = clean(offer?.price?.currency || product?.price?.currency || historyPrice?.currency || feed.currency || 'EUR') || 'EUR';
  const identifiers = product?.identifiers || {};
  const sku = clean(identifiers.sku || identifiers.ean || identifiers.mpn || offer?.sourceProductId || '');
  const merchant = clean(offer?.programName || feed.name || 'Tradedoubler merchant');
  const category = Array.isArray(product?.categories) ? clean(product.categories[0]?.name || product.categories[0]?.tdCategoryName || '') : '';
  return {
    id: `td:${offer?.id || product?.id || `${feed.feedId}:${sku || directUrl}`}`,
    name: clean(product?.name || ''),
    sku,
    description: clean(product?.shortDescription || product?.description || '').slice(0, 360),
    price,
    compareAtPrice: null,
    currency,
    image: clean(product?.productImage?.url || ''),
    url: directUrl,
    merchantUrl: directUrl,
    merchant,
    delivery: clean(offer?.deliveryTime || offer?.shippingCost || ''),
    brand: clean(product?.brand || product?.manufacturer || ''),
    inStock: /out.?of.?stock|unavailable|not.?available/i.test(clean(offer?.availability || '')) ? '0' : '1',
    priceSource: 'tradedoubler_products_api',
    lastUpdated: offer?.modified ? new Date(Number(offer.modified)).toISOString() : feed.lastModified,
    category,
  };
}

async function searchFeed(feed, query) {
  const matrix = [
    `fid=${encodeURIComponent(feed.feedId)}`,
    `q=${encodeURIComponent(query)}`,
    'sourceproducturl=true',
    'limit=24',
  ].join(';');
  const payload = await getJson(`https://api.tradedoubler.com/1.0/products;${matrix}?token=${encodeURIComponent(TOKEN)}`);
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const output = [];
  for (const product of products) {
    const offers = Array.isArray(product?.offers) ? product.offers : [];
    for (const offer of offers) {
      if (Number(offer?.feedId) !== feed.feedId) continue;
      const mapped = productOfferToCenaRadar(product, offer, feed);
      if (mapped?.name) output.push(mapped);
    }
  }
  return output.slice(0, 24);
}

export function tradedoublerConfigured() {
  return Boolean(TOKEN);
}

export async function searchTradedoubler(query) {
  if (!TOKEN) return { products: [], sources: [] };
  const feeds = await getFeeds();
  if (!feeds.length) return { products: [], sources: [{ name: 'Tradedoubler', ok: true, count: 0, mode: 'products_api' }] };
  const settled = await Promise.allSettled(feeds.map(feed => searchFeed(feed, query)));
  const products = [];
  const sources = [];
  settled.forEach((result, index) => {
    const feed = feeds[index];
    if (result.status === 'fulfilled') {
      products.push(...result.value);
      sources.push({ name: feed.name, ok: true, count: result.value.length, mode: 'tradedoubler_products_api' });
    } else {
      sources.push({ name: feed.name, ok: false, count: 0, mode: 'tradedoubler_products_api', error: result.reason instanceof Error ? result.reason.message : 'API failed' });
    }
  });
  return { products, sources };
}
