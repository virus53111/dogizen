-- New members should not reveal activity until they explicitly enable it.
-- Preserve each existing member's current preference.
ALTER TABLE users ALTER COLUMN visible SET DEFAULT FALSE;
