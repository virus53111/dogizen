import { gunzipSync } from 'node:zlib';

export function decodeMaybeGzip(buffer) {
  const bytes = Buffer.from(buffer);
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return gunzipSync(bytes).toString('utf8');
  }
  return bytes.toString('utf8');
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((value, index) =>
    (index === 0 ? value.replace(/^\uFEFF/, '') : value).trim(),
  );

  return rows
    .slice(1)
    .filter(values => values.some(value => value !== ''))
    .map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

export function firstValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return '';
}

export function mapProductRow(row) {
  const price = Number.parseFloat(firstValue(row, ['search_price', 'store_price', 'price'])) || 0;
  const merchantUrl = firstValue(row, ['merchant_deep_link', 'merchant_url', 'product_url']);
  return {
    id: String(firstValue(row, ['aw_product_id', 'product_id', 'merchant_product_id'])),
    name: firstValue(row, ['product_name', 'name']),
    sku: firstValue(row, ['merchant_product_id', 'mpn', 'model_number']),
    description: firstValue(row, ['product_short_description', 'description', 'merchant_category']),
    price,
    currency: firstValue(row, ['currency']) || 'USD',
    image: firstValue(row, ['merchant_image_url', 'large_image', 'aw_image_url']),
    url: merchantUrl,
    merchantUrl,
    delivery: firstValue(row, ['delivery_cost', 'delivery_time']) || 'Check with retailer',
    brand: firstValue(row, ['brand_name']) || firstValue(row, ['merchant_name']) || 'Ottocast',
    inStock: firstValue(row, ['in_stock', 'stock_status', 'is_for_sale']),
    lastUpdated: firstValue(row, ['last_updated', 'Last Imported']),
    category: firstValue(row, ['merchant_category', 'category_name']),
  };
}
