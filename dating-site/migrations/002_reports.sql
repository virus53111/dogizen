CREATE TABLE IF NOT EXISTS mm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE,
  reason VARCHAR(120) NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)