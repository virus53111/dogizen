-- Track authenticated privacy deletion requests without erasing accounts automatically.
-- A request must not trigger removal of evidence needed for safety/moderation.
CREATE TABLE IF NOT EXISTS mm_privacy_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id TEXT NOT NULL,
 request_type VARCHAR(24) NOT NULL DEFAULT 'delete_account'
   CHECK (request_type IN ('delete_account')),
 status VARCHAR(20) NOT NULL DEFAULT 'open'
   CHECK (status IN ('open','reviewing')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS mm_privacy_one_active_request
 ON mm_privacy_requests(user_id,request_type)
 WHERE status IN ('open','reviewing');
CREATE INDEX IF NOT EXISTS mm_privacy_queue_idx ON mm_privacy_requests(created_at DESC);
