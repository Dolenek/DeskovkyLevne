import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { runDevelopment } from "../../scripts/dev/launcher.mjs";
import { createProcessSupervisor } from "../../scripts/dev/processes.mjs";
import { processExists, spawnNodeFixture, temporaryProject, waitUntil } from "./support/devFixtures.mjs";

test("invalid configuration never starts either service", async (context) => {
  const rootDir = await temporaryProject(context);
  await assert.rejects(runDevelopment({ rootDir, environment: {}, spawnChild: () => {
    assert.fail("No process may start before configuration validation");
  } }), /Set DATABASE_URL/);
});

test("missing Go reports a controlled failure and does not start Vite", async (context) => {
  const rootDir = await temporaryProject(context);
  const messages = [];
  let attempts = 0;
  const exitCode = await runDevelopment({ rootDir, environment: {
    DATABASE_URL: "postgres://unused/db", npm_execpath: process.execPath,
  }, logError: (message) => messages.push(message), spawnChild: (...args) => {
    attempts += 1;
    return spawn(join(rootDir, "missing-go"), args[1], args[2]);
  } });
  assert.equal(exitCode, 1);
  assert.equal(attempts, 1);
  assert.match(messages.join("\n"), /api.*ENOENT/);
  assert.doesNotMatch(messages.join("\n"), /postgres/);
});

test("API-only mode shares environment loading and signal cleanup", async (context) => {
  const rootDir = await temporaryProject(context);
  const children = [];
  const signalSource = new EventEmitter();
  const running = runDevelopment({ rootDir, environment: { DATABASE_URL: "postgres://unused/db" },
    arguments: ["--api-only"], signalSource,
    spawnChild: spawnNodeFixture("setInterval(() => {}, 1000)", children) });
  context.after(() => signalSource.emit("SIGTERM"));
  await waitUntil(() => children.length === 1);
  assert.equal(children[0].command, "go");
  assert.equal(children[0].options.env.DATABASE_URL, "postgres://unused/db");
  signalSource.emit("SIGTERM");
  assert.equal(await running, 0);
  assert.equal(signalSource.listenerCount("SIGTERM"), 0);
  assert.equal(processExists(children[0].child.pid), false);
});

test("paired mode preserves frontend flags and lets Vite resolve proxy configuration", async (context) => {
  const rootDir = await temporaryProject(context);
  const children = [];
  const signalSource = new EventEmitter();
  const running = runDevelopment({ rootDir, environment: {
    DATABASE_URL: "postgres://unused/db", npm_execpath: process.execPath,
  }, arguments: ["--host", "127.0.0.1"], signalSource,
  spawnChild: spawnNodeFixture("setInterval(() => {}, 1000)", children), logError: () => {} });
  context.after(() => signalSource.emit("SIGTERM"));
  await waitUntil(() => children.length === 2);
  assert.equal(children[1].command, process.execPath);
  assert.deepEqual(children[1].args.slice(-2), ["--host", "127.0.0.1"]);
  assert.equal(children[1].options.env.VITE_API_PROXY_TARGET, undefined);
  children[1].child.kill("SIGTERM");
  assert.equal(await running, 1);
  assert.equal(processExists(children[0].child.pid), false);
});

test("shutdown also terminates a descendant that ignores SIGTERM", { skip: process.platform === "win32" }, async (context) => {
  const rootDir = await temporaryProject(context);
  const pidPath = join(rootDir, "descendant.pid");
  const descendantScript = `process.on("SIGTERM",()=>{});
    require('node:fs').writeFileSync(${JSON.stringify(pidPath)},String(process.pid));setInterval(()=>{},1000);`;
  const script = `require('node:child_process').spawn(process.execPath,
    ['-e', ${JSON.stringify(descendantScript)}],{stdio:'ignore'});setInterval(()=>{},1000);`;
  const children = [];
  const supervisor = createProcessSupervisor({ spawnChild: spawnNodeFixture(script, children), gracePeriodMs: 100 });
  context.after(() => supervisor.stop());
  await supervisor.start("fixture", "fixture", []);
  await waitUntil(async () => { try { return Boolean(await readFile(pidPath, "utf8")); } catch { return false; } });
  const descendantPid = Number(await readFile(pidPath, "utf8"));
  await supervisor.stop();
  await waitUntil(() => !processExists(descendantPid));
  assert.equal(processExists(children[0].child.pid), false);
});

test("Windows cleanup targets only owned process trees without a shell", async () => {
  const calls = [];
  const spawnChild = (command, args, options) => {
    calls.push({ command, args, options });
    const child = new EventEmitter();
    child.pid = 100 + calls.length;
    queueMicrotask(() => child.emit(command === "taskkill" ? "exit" : "spawn", 0));
    return child;
  };
  const supervisor = createProcessSupervisor({ platform: "win32", spawnChild });
  await supervisor.start("api", "go", ["run", "./cmd/server"]);
  await supervisor.start("vite", "node", ["npm-cli.js"]);
  assert.equal(await supervisor.stop(), 0);
  assert.equal(calls[0].options.detached, false);
  assert.equal(calls[0].options.shell, undefined);
  assert.deepEqual(calls.slice(2).map(({ command, args }) => [command, args]), [
    ["taskkill", ["/PID", "101", "/T", "/F"]],
    ["taskkill", ["/PID", "102", "/T", "/F"]],
  ]);
});
