-- Supabase migration: synchronize frontend property schema and storage buckets
-- Run this in the Supabase SQL editor against the target project.

-- 1) Ensure the properties table exists with the expected columns for the frontend.
CREATE TABLE IF NOT EXISTS public.properties (
  id                 TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title              TEXT        NOT NULL DEFAULT '',
  description        TEXT        NOT NULL DEFAULT '',
  price              NUMERIC     NOT NULL DEFAULT 0,
  currency           TEXT        NOT NULL DEFAULT 'USD',
  city               TEXT        NOT NULL DEFAULT 'Tashkent',
  district           TEXT        NOT NULL DEFAULT '',
  full_address       TEXT        NOT NULL DEFAULT '',
  google_maps_link   TEXT        NOT NULL DEFAULT '',
  property_type      TEXT        NOT NULL DEFAULT 'Apartment',
  rooms              INTEGER     NOT NULL DEFAULT 2,
  bathrooms          INTEGER     NOT NULL DEFAULT 1,
  area               NUMERIC     DEFAULT NULL,
  floor              INTEGER     NOT NULL DEFAULT 1,
  total_floors       INTEGER     NOT NULL DEFAULT 1,
  parking            BOOLEAN     NOT NULL DEFAULT false,
  furniture          BOOLEAN     NOT NULL DEFAULT false,
  construction_year  INTEGER     NOT NULL DEFAULT 2023,
  phone_number       TEXT        NOT NULL DEFAULT '',
  telegram_username  TEXT        NOT NULL DEFAULT '',
  status             TEXT        NOT NULL DEFAULT 'Active',
  is_featured        BOOLEAN     NOT NULL DEFAULT false,
  images             JSONB       NOT NULL DEFAULT '[]',
  features           JSONB       NOT NULL DEFAULT '[]',
  views              INTEGER     NOT NULL DEFAULT 0,
  category           TEXT        NOT NULL DEFAULT 'house',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  createdDate        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Add missing properties columns if the table already exists.
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Tashkent';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS full_address TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'Apartment';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS rooms INTEGER NOT NULL DEFAULT 2;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS area NUMERIC DEFAULT NULL;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS floor INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS total_floors INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS parking BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS furniture BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS construction_year INTEGER NOT NULL DEFAULT 2023;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS telegram_username TEXT NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'house';
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS createdDate TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3) Explicitly alter the area column to be nullable (in case it exists as NOT NULL).
-- This handles the case where the table already exists with NOT NULL constraint.
ALTER TABLE IF EXISTS public.properties
  ALTER COLUMN area DROP NOT NULL,
  ALTER COLUMN area SET DEFAULT NULL;

-- 4) Ensure indexes exist for performance on common property queries.
CREATE INDEX IF NOT EXISTS properties_category_idx ON public.properties (category);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties (status);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties (created_at DESC);

-- 5) Ensure storage buckets exist for the frontend upload flow.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uylar', 'uylar', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('kvartiralar', 'kvartiralar', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5) Add RLS policies for upload and read access on the new buckets.
DROP POLICY IF EXISTS "allow anon upload to uylar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon read uylar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete uylar bucket" ON storage.objects;

CREATE POLICY "allow anon upload to uylar bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'uylar');

CREATE POLICY "allow anon read uylar bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'uylar');

CREATE POLICY "allow anon delete uylar bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'uylar');

DROP POLICY IF EXISTS "allow anon upload to kvartiralar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon read kvartiralar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete kvartiralar bucket" ON storage.objects;

CREATE POLICY "allow anon upload to kvartiralar bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'kvartiralar');

CREATE POLICY "allow anon read kvartiralar bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'kvartiralar');

CREATE POLICY "allow anon delete kvartiralar bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'kvartiralar');
