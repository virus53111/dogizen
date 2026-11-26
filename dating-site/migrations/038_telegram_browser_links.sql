CREATE TABLE mm_telegram_browser_links (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX mm_telegram_browser_links_expiry ON mm_telegram_browser_links (expires_at);
