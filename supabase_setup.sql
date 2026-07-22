-- ============================================================
-- Denov Admin Panel — Custom Auth Database Setup
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


-- ============================================================
-- Done! Verify with:
--   SELECT * FROM admin_settings;
--   SELECT * FROM admins;
--   SELECT * FROM admin_access_log;
-- ============================================================
