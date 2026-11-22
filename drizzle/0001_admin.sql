CREATE TABLE mm_admin (singleton INTEGER PRIMARY KEY CHECK(singleton=1),user_id TEXT UNIQUE NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,window_start INTEGER NOT NULL DEFAULT 0,last_step INTEGER NOT NULL DEFAULT -1);
--> statement-breakpoint
CREATE TABLE mm_admin_sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE mm_admin_audit (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, object_id TEXT NOT NULL, at TEXT DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TRIGGER mm_status_audit AFTER UPDATE OF status ON mm_listings WHEN NEW.status<>OLD.status BEGIN INSERT INTO mm_admin_audit(actor,action,object_id) VALUES(CASE WHEN NEW.status='pending' THEN NEW.owner_id ELSE COALESCE((SELECT user_id FROM mm_admin WHERE enabled=1),'system') END,NEW.status,NEW.id); END;
