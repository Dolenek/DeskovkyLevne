import { glob, readFile } from "node:fs/promises";
import path from "node:path";

const explicitlyManagedNames = new Set([
  "canonical_product_slug",
  "extract_category_tags",
  "normalize_alias_ean",
  "seller_priority",
]);

const functionPattern =
  /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)/gi;
const publicGrantPattern =
  /grant\s+execute\s+on\s+function[\s\S]*?\s+to\s+public\s*;/i;

export const isManagedFunction = (functionName) =>
  functionName.startsWith("catalog_") ||
  functionName.startsWith("refresh_catalog_") ||
  functionName.startsWith("refresh_canonical_") ||
  functionName.startsWith("rebuild_catalog_") ||
  functionName.startsWith("record_catalog_") ||
  functionName === "apply_catalog_presentation_fallback" ||
  explicitlyManagedNames.has(functionName);

export const analyzeSQLFunctionPrivileges = (migrationName, sql) => {
  const failures = [];
  for (const match of sql.matchAll(functionPattern)) {
    if (!isManagedFunction(match[1])) {
      failures.push(`${migrationName}: unmanaged function ${match[1]}`);
    }
  }
  if (publicGrantPattern.test(sql)) {
    failures.push(`${migrationName}: grants function execution to PUBLIC`);
  }
  return failures;
};

export const collectMigrationPrivilegeFailures = async (migrationsPattern) => {
  const failures = [];
  for await (const migrationPath of glob(migrationsPattern)) {
    const sql = await readFile(migrationPath, "utf8");
    failures.push(
      ...analyzeSQLFunctionPrivileges(path.basename(migrationPath), sql)
    );
  }
  return failures;
};
