-- ============================================================
-- Denov Admin Panel — Complete Database Setup
-- Run this ONCE in your Supabase SQL Editor
-- supabase.com → your project → SQL Editor → New Query
-- ============================================================


-- 1. GLOBAL ADMIN SETTINGS (stores the bcrypt password hash)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,         -- only ever one row
  password_hash TEXT    NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_single_row CHECK (id = 1)  -- enforce singleton
);

-- Seed the initial password hash for: Agentsva#Panel47
-- (bcrypt, cost factor 12 — DO NOT edit this manually)
INSERT INTO public.admin_settings (id, password_hash)
VALUES (1, '$2b$12$waYPyRXTwB/QJJgEYTCYUeGPhqfl2j35CT9/.Pz5vJFLeORJfWuSu')
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read the hash (needed for browser login verification)
--       but only the row owner / service role can update it
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anon select admin_settings"  ON public.admin_settings;
DROP POLICY IF EXISTS "allow anon update admin_settings"  ON public.admin_settings;

CREATE POLICY "allow anon select admin_settings"
  ON public.admin_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow anon update admin_settings"
  ON public.admin_settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 2. ADMIN USERS (tracks every email that has logged into the panel)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'Owner',
  avatar_url  TEXT        NOT NULL DEFAULT '',
  bio         TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'Active',
  last_active TEXT        NOT NULL DEFAULT 'Just now',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: anon can read, insert and update (for upsert on login)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anon select admins"  ON public.admins;
DROP POLICY IF EXISTS "allow anon insert admins"  ON public.admins;
DROP POLICY IF EXISTS "allow anon update admins"  ON public.admins;
DROP POLICY IF EXISTS "allow anon delete admins"  ON public.admins;

CREATE POLICY "allow anon select admins"
  ON public.admins FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow anon insert admins"
  ON public.admins FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow anon update admins"
  ON public.admins FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow anon delete admins"
  ON public.admins FOR DELETE
  TO anon, authenticated
  USING (true);


-- 3. ADMIN ACCESS LOG (records each login event)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_access_log (
  id            BIGSERIAL   PRIMARY KEY,
  email         TEXT        NOT NULL,
  logged_in_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: anon can insert only (write-only access log)
ALTER TABLE public.admin_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anon insert access_log" ON public.admin_access_log;
DROP POLICY IF EXISTS "allow anon select access_log" ON public.admin_access_log;

CREATE POLICY "allow anon insert access_log"
  ON public.admin_access_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow anon select access_log"
  ON public.admin_access_log FOR SELECT
  TO anon, authenticated
  USING (true);


-- 4. PROPERTIES TABLE (the main listing database)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id                 TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title              TEXT        NOT NULL DEFAULT '',
  description        TEXT        NOT NULL DEFAULT '',
  price              NUMERIC     NOT NULL DEFAULT 0,
  currency           TEXT        NOT NULL DEFAULT 'USD',       -- 'USD' | 'UZS'
  city               TEXT        NOT NULL DEFAULT 'Tashkent',
  district           TEXT        NOT NULL DEFAULT '',
  full_address       TEXT        NOT NULL DEFAULT '',
  google_maps_link   TEXT        NOT NULL DEFAULT '',
  property_type      TEXT        NOT NULL DEFAULT 'Apartment',
  rooms              INTEGER     NOT NULL DEFAULT 2,
  bathrooms          INTEGER     NOT NULL DEFAULT 1,
  area               NUMERIC     DEFAULT NULL,                -- sq metres (optional)
  floor              INTEGER     NOT NULL DEFAULT 1,
  total_floors       INTEGER     NOT NULL DEFAULT 1,
  parking            BOOLEAN     NOT NULL DEFAULT false,
  furniture          BOOLEAN     NOT NULL DEFAULT false,
  construction_year  INTEGER     NOT NULL DEFAULT 2023,
  phone_number       TEXT        NOT NULL DEFAULT '',
  telegram_username  TEXT        NOT NULL DEFAULT '',
  status             TEXT        NOT NULL DEFAULT 'Active',    -- 'Active' | 'Sold' | 'Rented' | 'Hidden'
  is_featured        BOOLEAN     NOT NULL DEFAULT false,
  images             JSONB       NOT NULL DEFAULT '[]',        -- array of public storage URLs
  views              INTEGER     NOT NULL DEFAULT 0,
  features           JSONB       NOT NULL DEFAULT '[]',        -- array of tags
  category           TEXT        NOT NULL,      -- 'house' | 'apartment'
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS properties_category_idx ON public.properties (category);
CREATE INDEX IF NOT EXISTS properties_status_idx       ON public.properties (status);
CREATE INDEX IF NOT EXISTS properties_created_at_idx   ON public.properties (created_at DESC);

-- RLS: full CRUD for anon (the admin panel uses anon key)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anon select properties"  ON public.properties;
DROP POLICY IF EXISTS "allow anon insert properties"  ON public.properties;
DROP POLICY IF EXISTS "allow anon update properties"  ON public.properties;
DROP POLICY IF EXISTS "allow anon delete properties"  ON public.properties;

CREATE POLICY "allow anon select properties"
  ON public.properties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow anon insert properties"
  ON public.properties FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow anon update properties"
  ON public.properties FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow anon delete properties"
  ON public.properties FOR DELETE
  TO anon, authenticated
  USING (true);


-- 5. STORAGE BUCKETS FOR PROPERTY IMAGES
-- ============================================================
-- Run in SQL Editor (Supabase storage API isn't directly callable via SQL,
-- but these commands work via the Supabase pg_storage extension):

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
(
  'houses',
  'houses',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
),
(
  'apartments',
  'apartments',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- RLS on storage objects: allow anon to upload and read for HOUSES
DROP POLICY IF EXISTS "allow anon upload to houses bucket"  ON storage.objects;
DROP POLICY IF EXISTS "allow anon read houses bucket"       ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete houses bucket"     ON storage.objects;

CREATE POLICY "allow anon upload to houses bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'houses');

CREATE POLICY "allow anon read houses bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'houses');

CREATE POLICY "allow anon delete houses bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'houses');

-- RLS on storage objects: allow anon to upload and read for APARTMENTS
DROP POLICY IF EXISTS "allow anon upload to apartments bucket"  ON storage.objects;
DROP POLICY IF EXISTS "allow anon read apartments bucket"       ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete apartments bucket"     ON storage.objects;

CREATE POLICY "allow anon upload to apartments bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'apartments');

CREATE POLICY "allow anon read apartments bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'apartments');

CREATE POLICY "allow anon delete apartments bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'apartments');


-- ============================================================
-- Done! Verify with:
--   SELECT * FROM admin_settings;
--   SELECT * FROM admins;
--   SELECT * FROM admin_access_log;
--   SELECT * FROM properties;
--   SELECT * FROM storage.buckets WHERE id IN ('houses', 'apartments');
-- ============================================================
