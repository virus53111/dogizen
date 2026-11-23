-- Preserve real, publicly visible legacy listings without inventing owner IDs.
-- PRIVATE administrative staging archive; never displayed in /api/listings.
CREATE TABLE IF NOT EXISTS mm_legacy_imports (
  legacy_id UUID PRIMARY KEY,
  source_host TEXT NOT NULL DEFAULT 'https://murdilimax.com',
  public_snapshot JSONB NOT NULL CHECK (jsonb_typeof(public_snapshot) = 'object'),
  photo_backup_key TEXT,
  owner_uid TEXT,
  mapping_state VARCHAR(24) NOT NULL DEFAULT 'awaiting_owner'
    CHECK (mapping_state IN ('awaiting_owner','verified','imported','excluded')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_at TIMESTAMPTZ,
  CHECK (mapping_state <> 'imported' OR (owner_uid IS NOT NULL AND linked_at IS NOT NULL))
);
