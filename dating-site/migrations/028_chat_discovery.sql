ALTER TABLE mm_messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES mm_messages(id) ON DELETE SET NULL;
ALTER TABLE mm_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS mm_chat_typing (
 conversation_id UUID NOT NULL REFERENCES mm_conversations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE INDEX IF NOT EXISTS mm_chat_typing_expiry ON mm_chat_typing(expires_at);
CREATE INDEX IF NOT EXISTS mm_messages_thread_date ON mm_messages(conversation_id,created_at DESC);
CREATE INDEX IF NOT EXISTS mm_messages_sender_date ON mm_messages(sender_id,created_at DESC);
CREATE INDEX IF NOT EXISTS mm_member_details_goal ON mm_member_profile_details(looking_for);
