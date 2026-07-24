#!/usr/bin/env node
import { Client } from 'pg';

// This script inspects `public.properties` and fixes the `category` column
// where it is missing or does not match a best-effort mapping from `property_type`.
// Usage: set `DATABASE_URL` to your Supabase Postgres connection string (service_role DB URL)

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL is not set. Provide a Supabase Postgres connection string.');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    // Audit table to record changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties_category_fix_log (
        id BIGSERIAL PRIMARY KEY,
        property_id TEXT NOT NULL,
        old_category TEXT,
        new_category TEXT,
        reason TEXT,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const res = await client.query(`
      SELECT id, category, property_type
      FROM public.properties
      WHERE category IS NULL
        OR lower(category) NOT IN ('house','apartment')
        OR (
          lower(category) != CASE WHEN lower(COALESCE(property_type, '')) LIKE '%apart%' THEN 'apartment' ELSE 'house' END
        )
    `);

    console.log(`Found ${res.rowCount} properties to inspect.`);

    for (const row of res.rows) {
      const id = row.id;
      const oldCategory = row.category;
      const propertyType = row.property_type || '';
      const desired = propertyType.toLowerCase().includes('apart') ? 'apartment' : 'house';

      if (oldCategory === desired) continue; // nothing to do

      console.log(`Updating ${id}: '${oldCategory}' -> '${desired}' (inferred from property_type='${propertyType}')`);

      await client.query(
        `INSERT INTO properties_category_fix_log (property_id, old_category, new_category, reason) VALUES ($1,$2,$3,$4)`,
        [id, oldCategory, desired, 'sync_from_property_type']
      );

      await client.query(`UPDATE public.properties SET category = $1 WHERE id = $2`, [desired, id]);
    }

    console.log('Category fix-up complete. Review properties_category_fix_log for details.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('fix_property_categories failed:', err);
  process.exit(1);
});
