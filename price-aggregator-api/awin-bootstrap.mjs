import { parseCsv } from './feed-utils.mjs';

const API_KEY = String(process.env.AWIN_DATAFEED_API_KEY || '').trim();
const FEED_LIST_URL = API_KEY
  ? `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(API_KEY)}`
  : '';
const UA = 'Mozilla/5.0 (compatible; CenaRadar/1.0; +https://cenaradar.online)';

function clean(value = '') {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normaliseRegion(value = '') {
  const region = clean(value).toUpperCase();
  if (region === 'LATVIA') return 'LV';
  return region;
}

function joinedStatus(value = '') {
  const status = clean(value).toLowerCase();
  return status === 'joined' || status === 'active' || status === 'accepted' || status === 'approved';
}

function normaliseFeedUrl(url = '') {
  return clean(url).replace('/adultcontent/1/', '/adultcontent/0/');
}

function existingSources() {
  const raw = String(process.env.MERCHANT_FEEDS_JSON || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([name, value]) => (
        typeof value === 'string' ? { name, url: value } : { name, ...(value || {}) }
      ));
    }
  } catch (error) {
    console.error(`Awin bootstrap: existing MERCHANT_FEEDS_JSON is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
  return [];
}

async function loadAwinSources() {
  if (!FEED_LIST_URL) return [];

  const response = await fetch(FEED_LIST_URL, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/csv,text/plain,*/*',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`feed list HTTP ${response.status}`);

  const rows = parseCsv(await response.text());
  const configuredRegions = String(process.env.AWIN_PRIMARY_REGIONS || 'LV')
    .split(',')
    .map(normaliseRegion)
    .filter(Boolean);
  const regions = new Set(configuredRegions);
  const advertiserIds = new Set(
    String(process.env.AWIN_ADVERTISER_IDS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  );
  const excluded = new Set(
    String(process.env.AWIN_EXCLUDE_ADVERTISERS || 'Ottocast')
      .split(',')
      .map(value => clean(value).toLowerCase())
      .filter(Boolean),
  );
  const maxFeeds = Math.max(1, Math.min(50, Number(process.env.AWIN_MAX_FEEDS || 20)));
  const seen = new Set();
  const sources = [];

  for (const row of rows) {
    const membership = clean(row['Membership Status'] || row.membership_status || '');
    if (!joinedStatus(membership)) continue;

    const advertiserId = clean(row['Advertiser ID'] || row.advertiser_id || row['Merchant ID'] || row.merchant_id || '');
    const advertiserName = clean(row['Advertiser Name'] || row.advertiser_name || row['Merchant Name'] || row.merchant_name || '');
    const primaryRegion = normaliseRegion(row['Primary Region'] || row.primary_region || row.region || '');
    const feedId = clean(row['Feed ID'] || row.feed_id || row['Datafeed ID'] || row.data_feed_id || '');
    const url = normaliseFeedUrl(row.URL || row.Url || row.url || row['Download URL'] || row.download_url || '');

    if (!advertiserName || !url) continue;
    if (excluded.has(advertiserName.toLowerCase())) continue;
    if (regions.size && !regions.has(primaryRegion) && !advertiserIds.has(advertiserId)) continue;

    const key = feedId || url;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({
      name: advertiserName,
      url,
      format: 'csv',
      currency: 'EUR',
      awinAdvertiserId: advertiserId,
      awinFeedId: feedId,
    });
    if (sources.length >= maxFeeds) break;
  }

  return sources;
}

if (API_KEY) {
  try {
    const existing = existingSources();
    const awinSources = await loadAwinSources();
    const existingKeys = new Set(existing.map(source => `${clean(source?.name).toLowerCase()}|${clean(source?.url)}`));
    const additions = awinSources.filter(source => !existingKeys.has(`${source.name.toLowerCase()}|${source.url}`));
    if (additions.length) {
      process.env.MERCHANT_FEEDS_JSON = JSON.stringify([...existing, ...additions]);
    }
    console.log(`Awin bootstrap: joined feeds discovered=${awinSources.length}, added=${additions.length}`);
  } catch (error) {
    console.error(`Awin bootstrap failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
