CREATE TABLE IF NOT EXISTS mm_telegram_content_log (
 day DATE PRIMARY KEY,
 content_key TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('claimed','sent','failed','uncertain')),
 claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 finished_at TIMESTAMPTZ
);
