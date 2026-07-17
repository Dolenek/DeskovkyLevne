import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeSQLFunctionPrivileges,
  isManagedFunction,
} from "../../scripts/sql-function-privileges.mjs";

test("managed SQL function families remain allowlisted", () => {
  assert.equal(isManagedFunction("catalog_preferred_product_name"), true);
  assert.equal(isManagedFunction("refresh_catalog_state_incremental"), true);
  assert.equal(isManagedFunction("canonical_product_slug"), true);
  assert.equal(isManagedFunction("unsafe_admin_function"), false);
});

test("privilege analysis rejects unmanaged functions", () => {
  const failures = analyzeSQLFunctionPrivileges(
    "dangerous.sql",
    "create or replace function public.unsafe_admin_function() returns void language sql as $$ select 1 $$;"
  );

  assert.deepEqual(failures, [
    "dangerous.sql: unmanaged function unsafe_admin_function",
  ]);
});

test("privilege analysis rejects PUBLIC execute grants across whitespace and case", () => {
  const failures = analyzeSQLFunctionPrivileges(
    "grant.sql",
    `GRANT EXECUTE ON FUNCTION public.catalog_safe(text)\nTO PuBlIc;`
  );

  assert.deepEqual(failures, [
    "grant.sql: grants function execution to PUBLIC",
  ]);
});

test("privilege analysis accepts managed functions without public grants", () => {
  const failures = analyzeSQLFunctionPrivileges(
    "safe.sql",
    `
      create function public.catalog_safe() returns void language sql as $$ select 1 $$;
      revoke execute on function public.catalog_safe() from public;
      grant execute on function public.catalog_safe() to tlamasite_maintenance;
    `
  );

  assert.deepEqual(failures, []);
});
