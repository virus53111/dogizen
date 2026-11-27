CREATE TABLE mm_stories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug)<=120),
 title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 150),
 author_name TEXT NOT NULL CHECK (length(author_name) BETWEEN 1 AND 80),
 language TEXT NOT NULL CHECK(language IN ('ru','en','de','lv','lt','et')),
 category TEXT NOT NULL CHECK(category IN ('real-life','romance','relationships','fiction')),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 40 AND 50000),
 seo_title TEXT NOT NULL DEFAULT '' CHECK(length(seo_title)<=150),
 seo_description TEXT NOT NULL DEFAULT '' CHECK(length(seo_description)<=200),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 published_at TIMESTAMPTZ,
 CHECK(status<>'published' OR published_at IS NOT NULL)
);
CREATE INDEX mm_stories_public_date ON mm_stories(published_at DESC,id) WHERE status='published';
CREATE INDEX mm_stories_public_category ON mm_stories(category,published_at DESC) WHERE status='published';
