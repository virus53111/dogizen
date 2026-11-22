CREATE TABLE IF NOT EXISTS mm_listings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
  owner_id TEXT NOT NULL,
  display_name VARCHAR(65) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 85),
  country VARCHAR(3) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) DEFAULT '',
  category VARCHAR(40) NOT NULL DEFAULT 'social',
  languages VARCHAR(200) DEFAULT '',
  description TEXT NOT NULL,
  avatar_url TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, headline TEXT DEFAULT '', is_commercial INTEGER NOT NULL DEFAULT 0 CHECK(is_commercial=0), CHECK(category IN ('dating','women-men','women-serious','women-women','men-women','men-serious','men-men','couples','trans-dating','social','events')));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
  listing_id TEXT NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE,
  reason VARCHAR(120) NOT NULL,
  details TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, status TEXT NOT NULL DEFAULT 'open', handled_at TEXT);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_listing_photos (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))), listing_id TEXT NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE, photo_url TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_conversations (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))), listing_id TEXT NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE, requester_id TEXT NOT NULL, publisher_id TEXT NOT NULL, blocked_by TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (listing_id, requester_id), CHECK (requester_id <> publisher_id));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_messages (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))), conversation_id TEXT NOT NULL REFERENCES mm_conversations(id) ON DELETE CASCADE, sender_id TEXT NOT NULL, body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1200), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, seen_at TEXT DEFAULT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_favorites (user_id TEXT NOT NULL, listing_id TEXT NOT NULL REFERENCES mm_listings(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, listing_id));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mm_chat_reports (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-8'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))), conversation_id TEXT NOT NULL REFERENCES mm_conversations(id) ON DELETE CASCADE, reporter_id TEXT NOT NULL, reason VARCHAR(120) NOT NULL, details TEXT NOT NULL DEFAULT '', status VARCHAR(16) NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, handled_at TEXT DEFAULT NULL);
--> statement-breakpoint
CREATE INDEX mm_message_order ON mm_messages(conversation_id,created_at);
--> statement-breakpoint
CREATE INDEX mm_listing_order ON mm_listings(status,created_at);
