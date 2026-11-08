-- A moderated user-report queue for native listings and SS.lv RSS references.
-- Report authors are recorded only for rate limiting; they are not shown publicly.
CREATE TABLE IF NOT EXISTS listing_reports (
 id BIGSERIAL PRIMARY KEY,
 reporter_user_id TEXT NOT NULL,
 target_type VARCHAR(12) NOT NULL CHECK (target_type IN ('native','external')),
 target_id BIGINT NOT NULL CHECK (target_id > 0),
 reason VARCHAR(24) NOT NULL CHECK (reason IN ('fraud','prohibited','misleading','privacy','broken','other')),
 details TEXT NOT NULL DEFAULT '',
 status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 reviewed_at TIMESTAMPTZ,
 reviewed_by TEXT,
 review_note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS listing_reports_status_created_idx ON listing_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS listing_reports_user_created_idx ON listing_reports(reporter_user_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS listing_reports_one_open_idx ON listing_reports(reporter_user_id,target_type,target_id) WHERE status='open';