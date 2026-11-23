-- Reciprocal likes are only between real Firebase member owners.
-- Manual/archived profiles cannot receive likes or manufacture matches.
CREATE TABLE IF NOT EXISTS mm_member_likes (
  liker_id TEXT NOT NULL,
  liked_owner_id TEXT NOT NULL,
  listing_id UUID NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (liker_id, liked_owner_id),
  CONSTRAINT mm_member_likes_no_self CHECK (liker_id <> liked_owner_id)
);
CREATE INDEX IF NOT EXISTS mm_member_likes_target
  ON mm_member_likes(liked_owner_id, created_at DESC);
