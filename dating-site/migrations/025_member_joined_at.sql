-- Keep unknown historical join dates NULL. Only new accounts get a timestamp.
ALTER TABLE users ADD COLUMN joined_at TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN joined_at SET DEFAULT NOW();
