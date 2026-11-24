CREATE TABLE IF NOT EXISTS mm_push_keys (singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK(singleton), public_key TEXT NOT NULL, private_key TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mm_push_subscriptions (endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, p256dh TEXT NOT NULL, auth TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'ru', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_push_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS mm_push_user ON mm_push_subscriptions(user_id);
