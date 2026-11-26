
-- Additive reward ledger. Existing profiles, photos and messages are untouched.
CREATE TABLE mm_vip_accounts(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid());
CREATE TABLE mm_vip_referrals(invitee TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,inviter TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','review','confirmed','rejected')),reason TEXT,reviewed_at TIMESTAMPTZ,CHECK(invitee<>inviter));
CREATE INDEX mm_vip_referrals_inviter ON mm_vip_referrals(inviter);
CREATE TABLE mm_vip_events(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,event_key TEXT NOT NULL UNIQUE,kind TEXT NOT NULL CHECK(kind IN ('referral','campaign','gift_sent','gift_received','revocation')),days INTEGER NOT NULL DEFAULT 0,months INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),CHECK(days<>0 OR months<>0));
CREATE INDEX mm_vip_events_user ON mm_vip_events(user_id,created_at);
CREATE TABLE mm_vip_activity(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,day DATE NOT NULL,ip_hash TEXT,PRIMARY KEY(user_id,day));
CREATE INDEX mm_vip_activity_ip ON mm_vip_activity(ip_hash) WHERE ip_hash IS NOT NULL;
CREATE TABLE mm_vip_config(singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK(singleton),ip_key TEXT NOT NULL DEFAULT (gen_random_uuid()::text||gen_random_uuid()::text));
INSERT INTO mm_vip_config(singleton) VALUES(TRUE);
CREATE TABLE mm_vip_telegram(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,telegram_id TEXT NOT NULL UNIQUE,linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE mm_vip_bans(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,reason TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE mm_vip_gifts(id UUID PRIMARY KEY,sender TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,days INTEGER NOT NULL CHECK(days>0),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),CHECK(sender<>recipient));
