-- Public read-only presentation of real, archived listings.
-- Existing snapshots stay intact; a verified Firebase owner must be linked before messaging.
CREATE OR REPLACE VIEW mm_public_listings AS
  SELECT id,display_name,headline,age,country,city,district,category,languages,
         description,avatar_url,featured,is_commercial,created_at,status,
         TRUE AS messaging_enabled
  FROM mm_listings WHERE status='approved'
  UNION ALL
  SELECT a.legacy_id AS id,
         LEFT(p->>'display_name',65)::varchar(65) AS display_name,
         LEFT(COALESCE(p->>'headline',''),120)::varchar(120) AS headline,
         (p->>'age')::integer AS age,
         LEFT(p->>'country',3)::varchar(3) AS country,
         LEFT(p->>'city',100)::varchar(100) AS city,
         LEFT(COALESCE(p->>'district',''),100)::varchar(100) AS district,
         LEFT(p->>'category',40)::varchar(40) AS category,
         LEFT(COALESCE(p->>'languages',''),200)::varchar(200) AS languages,
         p->>'description' AS description,
         ('/media/murdilimax/legacy/'||a.legacy_id||'.webp')::text AS avatar_url,
         FALSE AS featured,FALSE AS is_commercial,
         (p->>'created_at')::timestamptz AS created_at,
         'approved'::varchar(24) AS status,
         FALSE AS messaging_enabled
  FROM mm_legacy_imports a
  CROSS JOIN LATERAL (SELECT a.public_snapshot->'listing' AS p) s
  WHERE a.mapping_state='awaiting_owner' AND a.owner_uid IS NULL
    AND NOT EXISTS (SELECT 1 FROM mm_listings m WHERE m.id=a.legacy_id);
