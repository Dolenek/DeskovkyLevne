import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(
  testDirectory,
  "..",
  "..",
  "infra",
  "db",
  "migrations"
);

const readNormalizedMigration = async (migrationName) => {
  const sql = await readFile(path.join(migrationsDirectory, migrationName), "utf8");
  return sql.toLowerCase().replace(/\s+/g, " ");
};

test("daily history remains seller-partitioned with explicit time bounds", async () => {
  const sql = await readNormalizedMigration(
    "20260228_canonical_daily_history_refresh.sql"
  );

  assert.match(
    sql,
    /primary key \(canonical_product_id, seller, price_date\)/
  );
  assert.match(
    sql,
    /scraped_at >= date_trunc\('day', p_since\)/
  );
  assert.match(
    sql,
    /scraped_at < date_trunc\('day', p_until\)/
  );
  assert.match(
    sql,
    /order by canonical_product_id, seller, price_date, scraped_at asc, id asc/
  );
  assert.match(
    sql,
    /order by canonical_product_id, seller, price_date, scraped_at desc, id desc/
  );
  assert.match(
    sql,
    /on conflict \(canonical_product_id, seller, price_date\) do update/
  );
});

test("catalog refresh preserves canonical and seller-level state", async () => {
  const sql = await readNormalizedMigration(
    "20260229_canonical_catalog_state_refresh.sql"
  );

  assert.match(
    sql,
    /public\.canonical_product_slug\( p\.seller, p\.product_code, p\.product_name_normalized \)/
  );
  assert.match(
    sql,
    /on conflict \(product_name_normalized, seller\) do update/
  );
  assert.match(sql, /delta\.seller = existing\.seller/);
  assert.match(
    sql,
    /order by public\.seller_priority\(css\.seller\), css\.latest_scraped_at desc/
  );
  assert.match(
    sql,
    /on conflict \(product_name_normalized\) do update/
  );
  assert.match(sql, /coalesce\(m\.seller_count, 1\) as seller_count/);
  assert.match(sql, /delete from public\.catalog_slug_seller_state existing/);
  assert.match(sql, /delete from public\.catalog_slug_state existing/);
});

test("security migration keeps public, API, and maintenance capabilities separate", async () => {
  const sql = await readNormalizedMigration(
    "20260302_security_roles_and_rpc_lockdown.sql"
  );

  assert.match(sql, /revoke execute on function %s from public/);
  assert.match(sql, /array\['anon', 'authenticated'\]/);
  assert.match(
    sql,
    /grant execute on function %s to tlamasite_maintenance/
  );
  assert.match(
    sql,
    /grant execute on function public\.canonical_product_slug\(text, text, text\) to tlamasite_api/
  );
  assert.match(sql, /grant select on table public\.product_price_snapshots to tlamasite_maintenance/);
  assert.match(sql, /grant select on table public\.catalog_slug_state to anon/);
  assert.match(sql, /alter table public\.catalog_slug_state enable row level security/);
  assert.match(sql, /on public\.catalog_slug_state for select to anon, tlamasite_api/);
  assert.match(sql, /on public\.catalog_slug_state for all to tlamasite_maintenance/);
});
