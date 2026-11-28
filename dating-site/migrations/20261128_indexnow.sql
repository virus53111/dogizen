CREATE TABLE IF NOT EXISTS mm_indexnow_state (
 singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
 submitted JSONB NOT NULL DEFAULT '{}'::jsonb,
 last_attempt TIMESTAMPTZ,
 last_success TIMESTAMPTZ,
 last_status INTEGER,
 submitted_total BIGINT NOT NULL DEFAULT 0
);
