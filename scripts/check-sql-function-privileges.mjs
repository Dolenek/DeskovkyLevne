import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const migrationsPattern = path.join(repositoryRoot, "infra", "db", "migrations", "*.sql");
const explicitlyManagedNames = new Set([
  "canonical_product_slug",
  "extract_category_tags",
  "normalize_alias_ean",
  "seller_priority",
]);

const isManagedFunction = (functionName) =>
  functionName.startsWith("catalog_") ||
  functionName.startsWith("refresh_catalog_") ||
  functionName.startsWith("refresh_canonical_") ||
  functionName.startsWith("rebuild_catalog_") ||
  functionName.startsWith("record_catalog_") ||
  functionName === "apply_catalog_presentation_fallback" ||
  explicitlyManagedNames.has(functionName);

const functionPattern = /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)/gi;
const publicGrantPattern = /grant\s+execute\s+on\s+function[\s\S]*?\s+to\s+public\s*;/i;

const failures = [];
for await (const migrationPath of glob(migrationsPattern)) {
  const sql = await readFile(migrationPath, "utf8");
  for (const match of sql.matchAll(functionPattern)) {
    if (!isManagedFunction(match[1])) {
      failures.push(`${path.basename(migrationPath)}: unmanaged function ${match[1]}`);
    }
  }
  if (publicGrantPattern.test(sql)) {
    failures.push(`${path.basename(migrationPath)}: grants function execution to PUBLIC`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("All TlamaSite SQL functions use the managed privilege policy.");
