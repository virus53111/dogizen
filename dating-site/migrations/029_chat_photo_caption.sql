ALTER TABLE mm_chat_photos ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '' CHECK (char_length(caption)<=500);
