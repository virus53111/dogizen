ALTER TABLE mm_stories ADD COLUMN submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL, ADD COLUMN submission_pending BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX mm_stories_submitter_date ON mm_stories(submitted_by,created_at DESC);
CREATE TABLE mm_story_photos(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 story_id UUID NOT NULL REFERENCES mm_stories(id) ON DELETE CASCADE,
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 5),
 body BYTEA NOT NULL CHECK(octet_length(body) BETWEEN 1 AND 4194304),
 UNIQUE(story_id,position)
);
