
-- Visibility is voluntary and account-wide. Existing balances stay private.
ALTER TABLE users ADD COLUMN mp_public BOOLEAN NOT NULL DEFAULT FALSE;
CREATE VIEW mm_public_points AS
 SELECT l.id AS listing_id,l.owner_id,p.display_name,p.avatar_url,l.created_at,
 GREATEST(0,COALESCE((SELECT SUM(e.days::bigint+30*e.months::bigint) FROM mm_vip_events e WHERE e.user_id=u.id),0))::bigint AS points
 FROM mm_listings l JOIN users u ON u.id=l.owner_id JOIN mm_public_listings p ON p.id=l.id
 WHERE l.status='approved' AND p.status='approved' AND p.messaging_enabled IS TRUE
 AND u.mp_public IS TRUE AND NOT COALESCE(u.incognito,FALSE)
 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=u.id);
