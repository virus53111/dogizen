-- Only new tickets require a notification. Existing conversations stay in the inbox.
ALTER TABLE mm_support_tickets ADD COLUMN notify_after TIMESTAMPTZ;
ALTER TABLE mm_support_tickets ALTER COLUMN notify_after SET DEFAULT NOW();
CREATE INDEX mm_support_mail_pending ON mm_support_tickets(notify_after) WHERE notify_after IS NOT NULL;

CREATE TABLE IF NOT EXISTS mm_support_mail_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  recipient text NOT NULL
);
