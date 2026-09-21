function decodeHtml(value = '') {
  return String(value)
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function positiveNumber(value) {
  const n = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function metaPrice(html) {
  const patterns = [
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["'][^>]*>/i,
    /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:price:amount["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = positiveNumber(match?.[1]);
    if (value) return value;
  }
  return null;
}

function metaCurrency(html) {
  const patterns = [
    /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:currency["'][^>]*>/i,
    /<meta[^>]+property=["']og:price:currency["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:price:currency["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return String(match[1]).trim().toUpperCase();
  }
  return '';
}

function jsonLdOffer(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const raw = decodeHtml(match[1]).trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      const stack = [...nodes];
      while (stack.length) {
        const node = stack.shift();
        if (!node || typeof node !== 'object') continue;
        const type = node['@type'];
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
        if (isProduct && node.offers) {
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          const candidates = offers
            .map(offer => ({
              price: positiveNumber(offer?.price) || positiveNumber(offer?.lowPrice),
              currency: String(offer?.priceCurrency || '').trim().toUpperCase(),
            }))
            .filter(offer => offer.price);
          if (candidates.length) return candidates.sort((a, b) => a.price - b.price)[0];
        }
        for (const value of Object.values(node)) {
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) stack.push(...value);
            else stack.push(value);
          }
        }
      }
    } catch {
      // Ignore malformed third-party JSON-LD blocks.
    }
  }
  return null;
}

export function extractPrimaryOffer(html) {
  const meta = metaPrice(html);
  if (meta) return { price: meta, currency: metaCurrency(html) || 'USD' };
  return jsonLdOffer(html);
}

async function mapPool(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

function usdStorefrontUrl(value) {
  const url = new URL(value);
  url.searchParams.set('country', 'US');
  url.searchParams.set('currency', 'USD');
  return url.toString();
}

export async function verifyMerchantPrices(products, fetchHtml, { concurrency = 8 } = {}) {
  let corrected = 0;
  let verified = 0;

  const next = await mapPool(products, concurrency, async product => {
    if (!product?.merchantUrl) return product;
    try {
      const html = await fetchHtml(usdStorefrontUrl(product.merchantUrl));
      const offer = extractPrimaryOffer(html);
      if (!offer?.price) return product;
      verified += 1;
      if (Math.abs(offer.price - Number(product.price || 0)) >= 0.005) corrected += 1;
      return {
        ...product,
        price: offer.price,
        currency: offer.currency || 'USD',
        priceSource: 'merchant_product_page',
        storefrontListPrice: product.price,
      };
    } catch {
      return product;
    }
  });

  return { products: next, verified, corrected };
}
