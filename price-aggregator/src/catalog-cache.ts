const CACHE_KEY = 'cenaradar:catalog-cache:v1';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LIVE_WAIT_MS = 900;

const nativeFetch = window.fetch.bind(window);
const inflight = new Map<string, Promise<Response>>();

type CachedCatalog = {
  savedAt: number;
  body: string;
  status: number;
  contentType: string;
};

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isCatalogRequest(input: RequestInfo | URL, init?: RequestInit) {
  const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method !== 'GET') return false;
  const url = requestUrl(input);
  return /cenaradar-feed-api\.onrender\.com\/api\/(products|ottocast)(?:\?|$)/.test(url);
}

function readCache(): CachedCatalog | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as CachedCatalog | null;
    if (!parsed?.body || !parsed.savedAt || Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cachedResponse(cache: CachedCatalog) {
  return new Response(cache.body, {
    status: cache.status || 200,
    headers: {
      'Content-Type': cache.contentType || 'application/json; charset=utf-8',
      'X-CenaRadar-Cache': 'browser',
    },
  });
}

function liveRequest(input: RequestInfo | URL, init?: RequestInit) {
  const key = requestUrl(input);
  const existing = inflight.get(key);
  if (existing) return existing.then(response => response.clone());

  const pending = nativeFetch(input, init).then(async response => {
    if (response.ok) {
      try {
        const body = await response.clone().text();
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          body,
          status: response.status,
          contentType: response.headers.get('content-type') || 'application/json; charset=utf-8',
        } satisfies CachedCatalog));
      } catch {
        // Browser storage can be unavailable or full; live response still wins.
      }
    }
    return response;
  }).finally(() => {
    window.setTimeout(() => inflight.delete(key), 1000);
  });

  inflight.set(key, pending);
  return pending.then(response => response.clone());
}

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (!isCatalogRequest(input, init)) return nativeFetch(input, init);

  const cache = readCache();
  const live = liveRequest(input, init);
  if (!cache) return live;

  const winner = await Promise.race([
    live.then(response => ({ type: 'live' as const, response })),
    new Promise<{ type: 'cache' }>(resolve => window.setTimeout(() => resolve({ type: 'cache' }), LIVE_WAIT_MS)),
  ]);

  if (winner.type === 'live') return winner.response;
  void live.catch(() => undefined);
  return cachedResponse(cache);
};
