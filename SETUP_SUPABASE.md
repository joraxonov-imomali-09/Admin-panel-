Supabase Setup
=================

This project requires a Supabase project configured with the proper tables and storage buckets.

Two SQL files are provided to create the required database/table and storage policies:

- `supabase_setup.sql` — creates `properties`, `admins`, admin settings and policies.
- `fix_storage_policies.sql` — creates storage buckets `uylar` and `Kvartiralar` and storage RLS policies.

Run options:

1) Quick (recommended): Run both SQL files in the Supabase SQL Editor

- Go to your Supabase project → SQL Editor → New Query
- Paste the contents of `supabase_setup.sql` and run
- Paste the contents of `fix_storage_policies.sql` and run

2) Automated (requires DB connection): Use the included Node script to run the SQL files directly

- Ensure `DATABASE_URL` environment variable points to your Supabase Postgres connection string (service role DB URL)
- Install deps: `npm install`
- Run: `npm run ensure-db`

Notes
- The automated script uses the Postgres connection (service role) and should be run from a secure environment (CI, local machine with secrets).
- If you prefer not to run the automated script, running the SQL manually in the SQL Editor is safe and recommended.
