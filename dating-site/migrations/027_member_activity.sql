-- Explicit opt-in to share profile visits. Existing users remain private.
CREATE TABLE IF NOT EXISTS mm_member_activity_settings (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 share_visits BOOLEAN NOT NULL DEFAULT FALSE,
 matches_seen_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch'
);
CREATE TABLE IF NOT EXISTS mm_profile_visits (
 listing_id UUID NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE,
 visitor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(listing_id,visitor_id)
);
CREATE INDEX IF NOT EXISTS mm_profile_visits_expiry ON mm_profile_visits(visited_at);
CREATE TABLE IF NOT EXISTS mm_member_blocks (
 id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
 blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(blocker_id,blocked_id),
 CHECK(blocker_id<>blocked_id)
);
CREATE INDEX IF NOT EXISTS mm_member_blocks_reverse ON mm_member_blocks(blocked_id,blocker_id);
CREATE OR REPLACE FUNCTION mm_pair_blocked(a TEXT,b TEXT) RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM mm_member_blocks WHERE (blocker_id=a AND blocked_id=b) OR (blocker_id=b AND blocked_id=a))
 OR EXISTS(SELECT 1 FROM mm_conversations WHERE blocked_by IS NOT NULL AND ((requester_id=a AND publisher_id=b) OR (requester_id=b AND publisher_id=a)));
$$;
