#!/usr/bin/env node
import fs from 'fs';
import { Client } from 'pg';

// Usage: set DATABASE_URL to your Supabase Postgres connection string (service_role DB URL)
// Example: DATABASE_URL="postgresql://postgres:...@db.xxxxxx.supabase.co:5432/postgres"

const sqlFiles = [
  './supabase_setup.sql',
  './fix_storage_policies.sql'
];

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL is not set. Provide a Supabase Postgres connection string.');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    for (const file of sqlFiles) {
      console.log(`Running SQL file: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      // Split by semicolon to run statements sequentially
      const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err) {
          // Log and continue — many statements may fail if already present
          console.warn(`Statement failed (continuing): ${err.message || err}`);
        }
      }
    }
    console.log('Database setup script finished.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ensure_db failed:', err);
  process.exit(1);
});
