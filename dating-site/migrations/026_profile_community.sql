-- Opt-in features, off for every existing and new listing by default.
CREATE TABLE IF NOT EXISTS mm_profile_community (
 listing_id UUID PRIMARY KEY REFERENCES mm_listings(id) ON DELETE CASCADE,
 guestbook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 author_group_enabled BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS mm_guestbook_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id UUID NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE,
 writer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body VARCHAR(500) NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
 approved BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mm_guestbook_listing ON mm_guestbook_entries(listing_id,created_at DESC);
CREATE INDEX IF NOT EXISTS mm_guestbook_writer ON mm_guestbook_entries(writer_id,created_at DESC);
