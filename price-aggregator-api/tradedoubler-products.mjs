const API_ORIGIN = 'https://api.tradedoubler.com';
const TOKEN = String(process.env.TRADEDOUBLER_PRODUCTS_TOKEN || '').trim();
const CACHE_MS = Number(process.env.TRADEDOUBLER_CACHE_MS || 15 * 60 * 1000);
const DEFAULT_PROGRAM_ID = '380228';
const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';

let discoveryCache = null;

function clean(value = '') {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function positiveNumber(value) {
  const candidate = typeof value === 'object' && value !== null ? value.value : value;
  const number = Number.parseFloat(String(candidate ?? '').replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parsePrograms() {
  const json = String(process.env.TRADEDOUBLER_PROGRAMS_JSON || '').trim();
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => typeof item === 'string' || typeof item === 'number'
            ? { programId: String(item), name: String(item) === DEFAULT_PROGRAM_ID ? '220.lv' : `Program ${item}` }
            : {
                programId: String(item?.programId || item?.id || ''),
                name: clean(item?.name || ''),
              })
          .filter(item => item.programId);
      }
    } catch (error) {
      console.error(`TRADEDOUBLER_PROGRAMS_JSON is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  const ids = String(process.env.TRADEDOUBLER_PROGRAM_IDS || DEFAULT_PROGRAM_ID)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return ids.map(programId => ({
    programId,
    name: programId === DEFAULT_PROGRAM_ID ? '220.lv' : `Program ${programId}`,
  }));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function programName(program, feeds) {
  for (const feed of feeds) {
    const matched = Array.isArray(feed?.programs)
      ? feed.programs.find(item => String(item?.programId) === String(program.programId))
      : null;
    if (matched?.name) return clean(matched.name);
  }
  return program.name || `Program ${program.programId}`;
}

async function discoverProgram(program) {
  const url = `${API_ORIGIN}/1.0/productFeeds.json;programId=${encodeURIComponent(program.programId)}?token=${encodeURIComponent(TOKEN)}`;
  const payload = await fetchJson(url);
  const feeds = Array.isArray(payload?.feeds)
    ? payload.feeds.filter(feed => feed && feed.feedId && feed.active !== false && feed.visible !== false)
    : [];
  return {
    programId: program.programId,
    name: programName(program, feeds),
    feeds,
  };
}

async function discoverPrograms() {
  if (!TOKEN) return [];
  if (discoveryCache && Date.now() - discoveryCache.time < CACHE_MS) return discoveryCache.programs;

  const configured = parsePrograms();
  const settled = await Promise.allSettled(configured.map(discoverProgram));
  const programs = settled.map((result, index) => {
    const configuredProgram = configured[index];
    if (result.status === 'fulfilled') return { ...result.value, ok: result.value.feeds.length > 0 };
    return {
      programId: configuredProgram.programId,
      name: configuredProgram.name,
      feeds: [],
      ok: false,
      error: result.reason instanceof Error ? result.reason.message : 'Feed discovery failed',
    };
  });

  discoveryCache = { time: Date.now(), programs };
  return programs;
}

function feedProductCount(feeds) {
  return feeds.reduce((sum, feed) => {
    const count = Number(feed?.numberOfProducts || 0);
    return sum + (Number.isFinite(count) && count > 0 ? count : 0);
  }, 0);
}

export function tradedoublerConfigured() {
  return Boolean(TOKEN);
}

export async function getTradedoublerStatus() {
  if (!TOKEN) return { configured: false, sources: [] };
  const programs = await discoverPrograms();
  return {
    configured: true,
    sources: programs.map(program => ({
      name: program.name,
      ok: Boolean(program.ok && program.feeds.length),
      count: feedProductCount(program.feeds),
      total: feedProductCount(program.feeds),
      mode: 'tradedoubler_products_api',
      programId: program.programId,
      feedCount: program.feeds.length,
      searchOnly: true,
      ...(program.error ? { error: program.error } : {}),
    })),
  };
}

function latestPrice(offer, product) {
  const direct = positiveNumber(offer?.price) || positiveNumber(product?.price);
  if (direct) {
    const currency = clean(offer?.price?.currency || product?.price?.currency || offer?.currency || product?.currency || 'EUR').toUpperCase();
    return { value: direct, currency };
  }

  const history = Array.isArray(offer?.priceHistory) ? offer.priceHistory : [];
  const candidates = history
    .map(entry => ({
      value: positiveNumber(entry?.price),
      currency: clean(entry?.price?.currency || entry?.currency || 'EUR').toUpperCase(),
      date: Number(entry?.date || 0),
    }))
    .filter(entry => entry.value);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.date - b.date);
  return candidates[candidates.length - 1];
}

function stockValue(offer) {
  const numeric = Number(offer?.inStock);
  if (Number.isFinite(numeric)) return numeric > 0 ? '1' : '0';
  const availability = clean(offer?.availability);
  if (!availability) return '1';
  if (/out.?of.?stock|unavailable|sold.?out|nav pieej|izpārdots|^false$|^no$/i.test(availability)) return '0';
  return '1';
}

function imageUrl(product) {
  if (typeof product?.productImage === 'string') return clean(product.productImage);
  return clean(product?.productImage?.url || product?.imageUrl || product?.image || '');
}

function productCategory(product) {
  const categories = Array.isArray(product?.categories) ? product.categories : [];
  return clean(categories[0]?.name || categories[0]?.tdCategoryName || product?.category || '');
}

function mapResultProduct(product, program, allowedFeedIds) {
  const identifiers = product?.identifiers || {};
  const offers = Array.isArray(product?.offers) ? product.offers : [];
  return offers
    .filter(offer => !allowedFeedIds.size || allowedFeedIds.has(String(offer?.feedId)))
    .map((offer, index) => {
      const price = latestPrice(offer, product);
      const merchantUrl = clean(offer?.sourceProductUrl || product?.sourceProductUrl || '');
      if (!price || !merchantUrl || !product?.name) return null;
      const deliveryTime = clean(offer?.deliveryTime || product?.deliveryTime || '');
      const shippingCost = clean(offer?.shippingCost || product?.shippingCost || '');
      const delivery = [deliveryTime, shippingCost].filter(Boolean).join(' · ');
      const sourceId = clean(offer?.sourceProductId || product?.sourceProductId || offer?.id || product?.id || `${index}`);
      const modifiedRaw = offer?.modified || product?.modified;
      const modifiedNumber = Number(modifiedRaw);
      const lastUpdated = Number.isFinite(modifiedNumber) && modifiedNumber > 100000000000
        ? new Date(modifiedNumber).toISOString()
        : clean(modifiedRaw || '') || null;

      return {
        id: `td:${program.programId}:${sourceId}`,
        name: clean(product.name),
        sku: clean(identifiers.sku || product.sku || ''),
        model: clean(product.model || ''),
        mpn: clean(identifiers.mpn || product.mpn || ''),
        ean: clean(identifiers.ean || product.ean || identifiers.upc || ''),
        description: clean(product.shortDescription || product.description || '').slice(0, 360),
        price: price.value,
        compareAtPrice: null,
        currency: price.currency || 'EUR',
        image: imageUrl(product),
        url: merchantUrl,
        merchantUrl,
        merchant: program.name || clean(offer?.programName) || 'Store',
        delivery,
        brand: clean(product.brand || product.manufacturer || ''),
        inStock: stockValue(offer),
        priceSource: 'tradedoubler_products_api',
        lastUpdated,
        category: productCategory(product),
        programId: program.programId,
        feedId: String(offer?.feedId || ''),
      };
    })
    .filter(Boolean);
}

async function searchFeed(program, feed, query, limit) {
  const parts = [
    `fid=${encodeURIComponent(feed.feedId)}`,
    'sourceproducturl=true',
    `limit=${Math.max(1, Math.min(1000, limit))}`,
    `q=${encodeURIComponent(query)}`,
  ];
  const url = `${API_ORIGIN}/1.0/products.json;${parts.join(';')}?token=${encodeURIComponent(TOKEN)}`;
  const payload = await fetchJson(url);
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const allowedFeedIds = new Set([String(feed.feedId)]);
  return products.flatMap(product => mapResultProduct(product, program, allowedFeedIds));
}

export async function searchTradedoublerProducts(query, limit = 80) {
  const q = clean(query).slice(0, 120);
  if (!TOKEN || q.length < 2) return { products: [], sources: [] };

  const programs = await discoverPrograms();
  const activePrograms = programs.filter(program => program.ok && program.feeds.length);
  if (!activePrograms.length) {
    return {
      products: [],
      sources: programs.map(program => ({
        name: program.name,
        ok: false,
        count: 0,
        total: 0,
        mode: 'tradedoubler_products_api',
        ...(program.error ? { error: program.error } : {}),
      })),
    };
  }

  const tasks = [];
  for (const program of activePrograms) {
    const feeds = program.feeds.slice(0, 12);
    const perFeed = Math.max(10, Math.ceil(limit / Math.max(1, feeds.length)));
    for (const feed of feeds) tasks.push({ program, feed, perFeed });
  }

  const settled = await Promise.allSettled(tasks.map(task => searchFeed(task.program, task.feed, q, task.perFeed)));
  const products = [];
  const matchedByProgram = new Map();
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const task = tasks[index];
    products.push(...result.value);
    matchedByProgram.set(task.program.programId, (matchedByProgram.get(task.program.programId) || 0) + result.value.length);
  });

  const sources = activePrograms.map(program => ({
    name: program.name,
    ok: true,
    count: matchedByProgram.get(program.programId) || 0,
    total: feedProductCount(program.feeds),
    mode: 'tradedoubler_products_api',
    programId: program.programId,
    feedCount: program.feeds.length,
    searchOnly: true,
  }));

  return { products: products.slice(0, limit), sources };
}
