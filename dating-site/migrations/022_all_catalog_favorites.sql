-- Favorites must work for every published profile source (member/manual/legacy).
-- Retain existing member favorites without modifying or deleting their original rows.
CREATE TABLE IF NOT EXISTS mm_catalog_favorites (
  user_id TEXT NOT NULL,
  listing_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS mm_catalog_favorites_user_date
  ON mm_catalog_favorites(user_id, created_at DESC);
INSERT INTO mm_catalog_favorites(user_id, listing_id, created_at)
SELECT user_id, listing_id, created_at FROM mm_favorites
ON CONFLICT (user_id,listing_id) DO NOTHING;
