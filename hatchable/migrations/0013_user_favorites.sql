-- Private, account-owned favorites. Snapshots preserve attributed SS.lv links after RSS expiry.
CREATE TABLE IF NOT EXISTS user_favorites (
 user_id TEXT NOT NULL,
 kind VARCHAR(12) NOT NULL CHECK(kind IN ('native','external')),
 listing_id BIGINT NOT NULL CHECK(listing_id > 0),
 snapshot JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,kind,listing_id)
);
CREATE INDEX IF NOT EXISTS user_favorites_recent_idx ON user_favorites(user_id,updated_at DESC);