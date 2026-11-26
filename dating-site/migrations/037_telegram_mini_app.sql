ALTER TABLE mm_telegram_accounts ADD COLUMN IF NOT EXISTS telegram_user_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS mm_telegram_launches (
  signature_hash TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
