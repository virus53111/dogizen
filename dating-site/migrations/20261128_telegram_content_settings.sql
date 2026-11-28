CREATE TABLE IF NOT EXISTS mm_telegram_content_settings (
 singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
 enabled BOOLEAN NOT NULL DEFAULT FALSE,
 token_ciphertext TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
