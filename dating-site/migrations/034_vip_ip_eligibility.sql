
-- One bonus-eligible identity per observed IP, without banning ordinary accounts.
CREATE TABLE mm_vip_ip_identity (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 ip_hash TEXT NOT NULL,
 eligible BOOLEAN NOT NULL,
 first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX mm_vip_one_eligible_ip ON mm_vip_ip_identity(ip_hash) WHERE eligible;
-- Preserve historical awards. Existing inviter takes priority for historical shared IP.
WITH first_ip AS (
 SELECT DISTINCT ON (a.user_id) a.user_id,a.ip_hash,a.day
 FROM mm_vip_activity a WHERE a.ip_hash IS NOT NULL ORDER BY a.user_id,a.day
), ranked AS (
 SELECT f.*,row_number() OVER(PARTITION BY f.ip_hash ORDER BY
 (EXISTS(SELECT 1 FROM mm_vip_referrals r WHERE r.inviter=f.user_id)) DESC,
 (EXISTS(SELECT 1 FROM mm_vip_events e WHERE e.user_id=f.user_id AND e.kind='campaign')) DESC,
 f.day,f.user_id) AS rank FROM first_ip f
)
INSERT INTO mm_vip_ip_identity(user_id,ip_hash,eligible,first_seen)
 SELECT user_id,ip_hash,rank=1,day::timestamp AT TIME ZONE 'UTC' FROM ranked;
