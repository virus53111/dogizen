-- Allow the site administrator to publish consented adults' submissions without creating fake Firebase members.
-- Keep all origin/consent evidence private and never create a messaging identity on their behalf.
CREATE TABLE IF NOT EXISTS mm_manual_profiles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by TEXT NOT NULL,
 display_name VARCHAR(65) NOT NULL CHECK (length(trim(display_name))>0),
 headline VARCHAR(120) NOT NULL DEFAULT '',
 age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 85),
 country VARCHAR(3) NOT NULL,
 city VARCHAR(100) NOT NULL,
 district VARCHAR(100) NOT NULL DEFAULT '',
 category VARCHAR(40) NOT NULL DEFAULT 'social'
   CHECK (category IN ('dating','women-men','women-serious','women-women','men-women','men-serious','men-men','couples','trans-dating','social','events')),
 languages VARCHAR(200) NOT NULL DEFAULT '',
 description TEXT NOT NULL CHECK (length(trim(description))>=20),
 avatar_url TEXT NOT NULL,
 consent_note TEXT NOT NULL CHECK (length(trim(consent_note))>=10),
 consent_attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 featured BOOLEAN NOT NULL DEFAULT FALSE,
 status VARCHAR(15) NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','hidden')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mm_manual_profiles_status_date ON mm_manual_profiles(status,created_at DESC);

-- Match the exact columns of the existing mm_public_listings view.
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
    AND NOT EXISTS (SELECT 1 FROM mm_listings m WHERE m.id=a.legacy_id)
  UNION ALL
  SELECT id,display_name,headline,age,country,city,district,category,languages,
         description,avatar_url,featured,FALSE AS is_commercial,
         created_at,'approved'::varchar(24) AS status,
         FALSE AS messaging_enabled
  FROM mm_manual_profiles WHERE status='approved';
