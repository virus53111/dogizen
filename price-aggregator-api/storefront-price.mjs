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

function jsonLdPrice(html) {
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
          const values = offers
            .flatMap(offer => [offer?.price, offer?.lowPrice])
            .map(positiveNumber)
            .filter(Boolean);
          if (values.length) return Math.min(...values);
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

export function extractPrimaryPrice(html) {
  return metaPrice(html) || jsonLdPrice(html);
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

export async function verifyMerchantPrices(products, fetchHtml, { concurrency = 8 } = {}) {
  let corrected = 0;
  let verified = 0;

  const next = await mapPool(products, concurrency, async product => {
    if (!product?.merchantUrl) return product;
    try {
      const html = await fetchHtml(product.merchantUrl);
      const pagePrice = extractPrimaryPrice(html);
      if (!pagePrice) return product;
      verified += 1;
      if (Math.abs(pagePrice - Number(product.price || 0)) >= 0.005) corrected += 1;
      return {
        ...product,
        price: pagePrice,
        priceSource: 'merchant_product_page',
        storefrontListPrice: product.price,
      };
    } catch {
      return product;
    }
  });

  return { products: next, verified, corrected };
}
