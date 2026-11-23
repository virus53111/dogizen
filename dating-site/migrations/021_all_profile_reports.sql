-- Reports apply to ANY published profile, not only Firebase member listings.
-- Keep reports after a listing is hidden/deleted, for abuse-review evidence.
CREATE TABLE IF NOT EXISTS mm_catalog_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  source VARCHAR(12) NOT NULL CHECK (source IN ('member','manual','legacy')),
  display_name VARCHAR(65) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT '',
  country VARCHAR(3) NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL DEFAULT '',
  reason VARCHAR(120) NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status VARCHAR(12) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mm_catalog_reports_status_created
  ON mm_catalog_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS mm_catalog_reports_listing
  ON mm_catalog_reports(listing_id);
