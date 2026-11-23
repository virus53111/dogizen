/* Small, dependency-free hardening helpers for the single-instance Render service. */
export function getCookie(req, name) {
  const item = String(req.get?.('cookie') || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(name + '='));
  if (!item) return '';
  try {
    const value = decodeURIComponent(item.slice(name.length + 1));
    return value.length <= 12000 ? value : '';
  } catch {
    // A malformed Cookie header must never crash Express or authenticate anyone.
    return '';
  }
}
export function rateLimit({ limit, windowMs, maxClients = 10000 }) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 128);
    let item = clients.get(key);
    if (!item || item.until <= now) {
      if (clients.size >= maxClients) {
        for (const [id, value] of clients) if (value.until <= now) clients.delete(id);
        if (clients.size >= maxClients) clients.delete(clients.keys().next().value);
      }
      item = { count: 0, until: now + windowMs };
      clients.set(key, item);
    }
    if (item.count >= limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((item.until - now) / 1000))));
      return res.status(429).json({ error: 'Слишком много запросов. Повторите позже.' });
    }
    item.count++;
    next();
  };
}
