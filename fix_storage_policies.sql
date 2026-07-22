-- fix_storage_policies.sql
-- Run this in your Supabase SQL Editor to fix the Unauthorized error on image upload

-- Make sure the new buckets exist and are public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
(
  'uylar',
  'uylar',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
),
(
  'Kvartiralar',
  'Kvartiralar',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- RLS for 'uylar' bucket (Houses)
DROP POLICY IF EXISTS "allow anon upload to uylar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon read uylar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete uylar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon update uylar bucket" ON storage.objects;

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

CREATE POLICY "allow anon update uylar bucket"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'uylar');

-- RLS for 'Kvartiralar' bucket (Apartments)
DROP POLICY IF EXISTS "allow anon upload to Kvartiralar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon read Kvartiralar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon delete Kvartiralar bucket" ON storage.objects;
DROP POLICY IF EXISTS "allow anon update Kvartiralar bucket" ON storage.objects;

CREATE POLICY "allow anon upload to Kvartiralar bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'Kvartiralar');

CREATE POLICY "allow anon read Kvartiralar bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'Kvartiralar');

CREATE POLICY "allow anon delete Kvartiralar bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'Kvartiralar');

CREATE POLICY "allow anon update Kvartiralar bucket"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'Kvartiralar');
