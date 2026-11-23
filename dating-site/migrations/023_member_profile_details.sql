-- Optional non-sensitive matchmaking preferences belong to verified member accounts.
-- No changes to existing public catalog views, admin profiles, or photos.
CREATE TABLE IF NOT EXISTS mm_member_profile_details (
  listing_id UUID PRIMARY KEY REFERENCES mm_listings(id) ON DELETE CASCADE,
  looking_for VARCHAR(24) NOT NULL DEFAULT '',
  interests VARCHAR(240) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mm_member_goal CHECK (looking_for IN ('','friendship','dating','relationship','activities','open'))
);
