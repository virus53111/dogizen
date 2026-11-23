CREATE TABLE IF NOT EXISTS mm_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)