import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = resolve(rootDir, "apps/api-go");
const apiEnvPath = resolve(apiDir, ".env");
const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8080";
const isWindows = process.platform === "win32";

const loadApiEnv = () => {
  if (!existsSync(apiEnvPath)) {
    console.error("[api] Missing apps/api-go/.env. Copy .env.example and set DATABASE_URL.");
    process.exitCode = 1;
    return null;
  }

  const env = { ...process.env };
  const lines = readFileSync(apiEnvPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key) {
      env[key] = value;
    }
  }
  return env;
};

const spawnProcess = (name, command, args, options) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    console.error(`[${name}] exited${signal ? ` via ${signal}` : ` with code ${code}`}`);
    shutdown(code ?? 1);
  });

  return child;
};

let shuttingDown = false;
const children = [];

const shutdown = (code = 0) => {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const apiEnv = loadApiEnv();
if (apiEnv) {
  children.push(spawnProcess("api", "go", ["run", "./cmd/server"], {
    cwd: apiDir,
    env: apiEnv,
  }));
}

children.push(spawnProcess("vite", "npm", ["run", "dev:frontend"], {
  cwd: rootDir,
  env: {
    ...process.env,
    VITE_API_PROXY_TARGET: apiTarget,
  },
}));
