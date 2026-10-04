import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { loadApiEnvironment } from "../../scripts/dev/environment.mjs";
import { temporaryProject, writeApiEnvironment } from "./support/devFixtures.mjs";

test("API dotenv handles quotes, comments, export and CRLF without changing the inherited environment", async (context) => {
  const rootDir = await temporaryProject(context);
  await writeApiEnvironment(rootDir, 'export DATABASE_URL="postgres://file/db?sslmode=disable"\r\nAPI_ADDRESS=":8081" # comment\r\nREDIS_PASSWORD=\'a#b\'\r\n');
  const inherited = { DATABASE_URL: "postgres://external/db", API_ADDRESS: ":9090" };
  const loaded = loadApiEnvironment(join(rootDir, "apps/api-go/.env"), inherited);
  assert.equal(loaded.DATABASE_URL, inherited.DATABASE_URL);
  assert.equal(loaded.API_ADDRESS, ":9090");
  assert.equal(loaded.REDIS_PASSWORD, "a#b");
  assert.equal(inherited.REDIS_PASSWORD, undefined);
  assert.equal(loadApiEnvironment(join(rootDir, "apps/api-go/.env"), {}).API_ADDRESS, ":8081");
});

test("an externally supplied DATABASE_URL works without a dotenv file", async (context) => {
  const rootDir = await temporaryProject(context);
  assert.equal(loadApiEnvironment(join(rootDir, "missing.env"), { DATABASE_URL: "postgres://external/db" })
    .DATABASE_URL, "postgres://external/db");
});

test("missing or explicitly empty database configuration fails before startup", async (context) => {
  const rootDir = await temporaryProject(context);
  const envPath = join(rootDir, "apps/api-go/.env");
  assert.throws(() => loadApiEnvironment(envPath, {}), /Set DATABASE_URL/);
  await writeApiEnvironment(rootDir, "DATABASE_URL=postgres://file/db");
  assert.throws(() => loadApiEnvironment(envPath, { DATABASE_URL: "  " }), /Set DATABASE_URL/);
});
