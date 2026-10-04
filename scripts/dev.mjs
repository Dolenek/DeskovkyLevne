import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDevelopment } from "./dev/launcher.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.exitCode = await runDevelopment({ rootDir });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
