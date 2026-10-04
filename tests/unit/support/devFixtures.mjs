import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export const temporaryProject = async (context) => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-launcher-"));
  await mkdir(join(rootDir, "apps/api-go"), { recursive: true });
  context.after(() => rm(rootDir, { recursive: true, force: true }));
  return rootDir;
};

export const writeApiEnvironment = (rootDir, contents) =>
  writeFile(join(rootDir, "apps/api-go/.env"), contents);

export const spawnNodeFixture = (script, children) => (command, args, options) => {
  if (command === "taskkill") return spawn(command, args, options);
  const child = spawn(process.execPath, ["-e", script], { ...options, stdio: "ignore" });
  children.push({ child, command, args, options });
  return child;
};

export const waitUntil = async (predicate) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await predicate()) return;
    await delay(25);
  }
  assert.fail("Timed out waiting for the fixture");
};

export const processExists = (pid) => {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === "ESRCH") return false; throw error; }
};
