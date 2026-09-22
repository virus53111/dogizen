import * as cheerio from 'cheerio';
import { decodeMaybeGzip, firstValue, parseCsv } from './feed-utils.mjs';

const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';
const CACHE_MS = Number(process.env.MERCHANT_FEED_CACHE_MS || 15 * 60 * 1000);
const cache = new Map();

function clean(value = '') {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function numberValue(value) {
  const raw = clean(value)
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalize(value = '') {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function matches(product, query) {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize([
    product.name,
    product.brand,
    product.model,
    product.sku,
    product.mpn,
    product.ean,
    product.category,
    product.description,
  ].filter(Boolean).join(' '));
  return q.split(' ').filter(Boolean).every(token => haystack.includes(token));
}

function parseSources() {
  const raw = process.env.MERCHANT_FEEDS_JSON || '';
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([name, value]) => (
      typeof value === 'string' ? { name, url: value } : { name, ...(value || {}) }
    ));
    return list
      .filter(item => item && item.name && item.url)
      .map(item => ({
        name: clean(item.name),
        url: clean(item.url),
        format: clean(item.format || 'auto').toLowerCase(),
        currency: clean(item.currency || 'EUR').toUpperCase(),
      }));
  } catch (error) {
    console.error(`MERCHANT_FEEDS_JSON is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}

async function fetchFeedBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/xml,text/xml,text/csv,application/json,text/plain,*/*',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function field(row, names) {
  return clean(firstValue(row, names));
}

function stockValue(value) {
  const raw = clean(value);
  if (!raw) return '1';
  if (/out.?of.?stock|unavailable|nav pieej|izpārdots|^false$|^no$/i.test(raw)) return '0';
  const numeric = Number.parseFloat(raw.replace(',', '.'));
  if (Number.isFinite(numeric)) return numeric > 0 ? '1' : '0';
  return '1';
}

function mapCsvRow(row, source, index) {
  const name = field(row, ['name', 'Name', 'product_name', 'Product Name', 'title', 'Title']);
  const price = numberValue(field(row, ['price', 'Price', 'search_price', 'store_price', 'sale_price', 'current_price']));
  const url = field(row, ['merchant_deep_link', 'sourceProductUrl', 'productURL', 'product_url', 'url', 'URL', 'link', 'Link']);
  if (!name || !price || !url) return null;

  const model = field(row, ['model', 'Model', 'model_number']);
  const mpn = field(row, ['mpn', 'MPN', 'manufacturer_part_number']);
  const ean = field(row, ['ean', 'EAN', 'gtin', 'GTIN', 'upc', 'UPC', 'isbn', 'ISBN']);
  const sku = field(row, ['sku', 'SKU', 'merchant_product_id', 'product_id']) || mpn || ean || model;
  const deliveryCost = field(row, ['delivery_latvija', 'delivery_cost', 'shippingCost', 'shipping']);
  const deliveryDays = field(row, ['delivery_days_latvija', 'delivery_time']);
  const delivery = deliveryDays
    ? `${deliveryDays} d.${deliveryCost ? ` · ${deliveryCost} €` : ''}`
    : deliveryCost || field(row, ['delivery']);

  return {
    id: `${source.name}:${field(row, ['id', 'product_id', 'productId']) || ean || mpn || sku || index}`,
    name,
    sku,
    model,
    mpn,
    ean,
    description: field(row, ['description', 'Description', 'product_short_description', 'short_description']).slice(0, 360),
    price,
    compareAtPrice: numberValue(field(row, ['old_price', 'product_price_old', 'rrp_price', 'compare_at_price'])),
    currency: field(row, ['currency', 'Currency', 'currencyISOCode']) || source.currency,
    image: field(row, ['imageURL', 'image_url', 'merchant_image_url', 'aw_image_url', 'image', 'Image']),
    url,
    merchantUrl: url,
    merchant: source.name,
    delivery,
    brand: field(row, ['brand', 'brand_name', 'Brand', 'manufacturer', 'Manufacturer']),
    inStock: stockValue(field(row, ['in_stock', 'stock_status', 'availability', 'available', 'stock'])),
    priceSource: 'merchant_feed',
    lastUpdated: field(row, ['last_updated', 'updated_at', 'modifiedDate']) || null,
    category: field(row, ['category_full', 'category', 'category_name', 'merchant_category', 'product_type']),
  };
}

function parseCsvFeed(text, source) {
  return parseCsv(text).map((row, index) => mapCsvRow(row, source, index)).filter(Boolean);
}

function nodeText(node, names) {
  for (const name of names) {
    const found = node.find(name).first();
    if (found.length) {
      const value = clean(found.text() || found.attr('value') || '');
      if (value) return value;
    }
    const attr = node.attr(name);
    if (attr) return clean(attr);
  }
  return '';
}

function parseXmlFeed(text, source) {
  const $ = cheerio.load(text, { xmlMode: true });
  let nodes = $('product');
  if (!nodes.length) nodes = $('item');
  if (!nodes.length) nodes = $('offer');
  const products = [];

  nodes.each((index, el) => {
    const node = $(el);
    const name = nodeText(node, ['name', 'title', 'product_name']);
    const price = numberValue(nodeText(node, ['price', 'search_price', 'store_price', 'sale_price']));
    const url = nodeText(node, ['merchant_deep_link', 'sourceProductUrl', 'productURL', 'product_url', 'url', 'link']);
    if (!name || !price || !url) return;

    const model = nodeText(node, ['model', 'model_number']);
    const mpn = nodeText(node, ['mpn', 'manufacturer_part_number']);
    const ean = nodeText(node, ['ean', 'gtin', 'upc', 'isbn']);
    const sku = nodeText(node, ['sku', 'merchant_product_id', 'product_id']) || mpn || ean || model;
    const deliveryCost = nodeText(node, ['delivery_latvija', 'delivery_cost', 'shippingCost', 'shipping']);
    const deliveryDays = nodeText(node, ['delivery_days_latvija', 'delivery_time']);
    const delivery = deliveryDays
      ? `${deliveryDays} d.${deliveryCost ? ` · ${deliveryCost} €` : ''}`
      : deliveryCost || nodeText(node, ['delivery']);

    products.push({
      id: `${source.name}:${nodeText(node, ['id', 'product_id']) || ean || mpn || sku || index}`,
      name,
      sku,
      model,
      mpn,
      ean,
      description: nodeText(node, ['description', 'product_short_description', 'short_description']).slice(0, 360),
      price,
      compareAtPrice: numberValue(nodeText(node, ['old_price', 'product_price_old', 'rrp_price', 'compare_at_price'])),
      currency: nodeText(node, ['currency', 'currencyISOCode']) || source.currency,
      image: nodeText(node, ['imageURL', 'image_url', 'merchant_image_url', 'image']),
      url,
      merchantUrl: url,
      merchant: source.name,
      delivery,
      brand: nodeText(node, ['brand', 'brand_name', 'manufacturer']),
      inStock: stockValue(nodeText(node, ['in_stock', 'stock_status', 'availability', 'available', 'stock'])),
      priceSource: 'merchant_feed',
      lastUpdated: nodeText(node, ['last_updated', 'updated_at', 'modifiedDate']) || null,
      category: nodeText(node, ['category_full', 'category', 'category_name', 'merchant_category', 'product_type']),
    });
  });

  return products;
}

function flattenJsonProducts(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  for (const key of ['products', 'items', 'offers', 'data', 'results']) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function parseJsonFeed(text, source) {
  const rows = flattenJsonProducts(JSON.parse(text));
  return rows.map((row, index) => mapCsvRow(row, source, index)).filter(Boolean);
}

async function loadSource(source) {
  const existing = cache.get(source.url);
  if (existing && Date.now() - existing.time < CACHE_MS) return existing.products;

  const buffer = await fetchFeedBuffer(source.url);
  const text = decodeMaybeGzip(buffer);
  const trimmed = text.trimStart();
  const format = source.format === 'auto'
    ? (trimmed.startsWith('<') ? 'xml' : trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'csv')
    : source.format;

  let products;
  if (format === 'xml') products = parseXmlFeed(text, source);
  else if (format === 'json') products = parseJsonFeed(text, source);
  else products = parseCsvFeed(text, source);

  cache.set(source.url, { time: Date.now(), products });
  console.log(`Merchant feed loaded: ${source.name}=${products.length}`);
  return products;
}

export function configuredMerchantNames() {
  return parseSources().map(source => source.name);
}

export async function searchConfiguredMerchantFeeds(query, limitPerSource = 30) {
  const sources = parseSources();
  if (!sources.length) return { products: [], sources: [] };

  const settled = await Promise.allSettled(sources.map(source => loadSource(source)));
  const products = [];
  const statuses = [];

  settled.forEach((result, index) => {
    const source = sources[index];
    if (result.status === 'fulfilled') {
      const matchesFound = result.value.filter(product => matches(product, query)).slice(0, limitPerSource);
      products.push(...matchesFound);
      statuses.push({ name: source.name, ok: true, count: matchesFound.length, total: result.value.length, mode: 'feed' });
    } else {
      statuses.push({
        name: source.name,
        ok: false,
        count: 0,
        total: 0,
        mode: 'feed',
        error: result.reason instanceof Error ? result.reason.message : 'Feed failed',
      });
    }
  });

  return { products, sources: statuses };
}
