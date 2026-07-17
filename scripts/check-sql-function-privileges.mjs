import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectMigrationPrivilegeFailures } from "./sql-function-privileges.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const migrationsPattern = path.join(repositoryRoot, "infra", "db", "migrations", "*.sql");
const failures = await collectMigrationPrivilegeFailures(migrationsPattern);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("All TlamaSite SQL functions use the managed privilege policy.");
