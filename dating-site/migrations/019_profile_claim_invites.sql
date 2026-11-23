-- Private, one-time profile ownership invites for consented adult members.
-- A bearer link alone is insufficient: the signed-in Firebase email must match
-- the invite recipient chosen by the verified owner of MurdiliMax.
CREATE TABLE IF NOT EXISTS mm_profile_claim_invites (
  manual_profile_id UUID PRIMARY KEY REFERENCES mm_manual_profiles(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  recipient_email_hash CHAR(64) NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mm_profile_claim_expiry_idx ON mm_profile_claim_invites(expires_at);
CREATE TABLE IF NOT EXISTS mm_profile_claim_audit (
  listing_id UUID PRIMARY KEY REFERENCES mm_listings(id) ON DELETE CASCADE,
  claimed_by TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  manual_consent_note TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
