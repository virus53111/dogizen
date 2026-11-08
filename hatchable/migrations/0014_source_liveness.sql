-- Source availability verification separate from the publisher's RSS timestamp.
-- A 404/410 is treated as suspect first, and confirmed only on a second check.
ALTER TABLE external_listings ADD COLUMN IF NOT EXISTS source_checked_at TIMESTAMPTZ;
ALTER TABLE external_listings ADD COLUMN IF NOT EXISTS source_missing_at TIMESTAMPTZ;
ALTER TABLE external_listings ADD COLUMN IF NOT EXISTS source_missing_confirmed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS external_source_verification_idx
 ON external_listings(source_checked_at,published_at DESC)
 WHERE source_missing_confirmed_at IS NULL;