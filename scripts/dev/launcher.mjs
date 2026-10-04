import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadApiEnvironment } from "./environment.mjs";
import { createProcessSupervisor } from "./processes.mjs";

const npmCliPath = (environment) => {
  const candidates = [environment.npm_execpath,
    resolve(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
    resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")];
  const cliPath = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!cliPath) throw new Error("[vite] npm CLI not found. Start through npm run dev.");
  return cliPath;
};

export const runDevelopment = async ({
  rootDir, environment = process.env, arguments: cliArguments = process.argv.slice(2),
  spawnChild, logError = console.error, signalSource = process,
}) => {
  const apiDir = resolve(rootDir, "apps/api-go");
  const apiEnvironment = loadApiEnvironment(resolve(apiDir, ".env"), environment);
  const apiOnly = cliArguments.includes("--api-only");
  const frontendArguments = cliArguments.filter((argument) => argument !== "--api-only");
  const frontendCli = apiOnly ? null : npmCliPath(environment);
  const supervisor = createProcessSupervisor({ spawnChild, logError });
  const handleSignal = () => { void supervisor.stop(0); };
  signalSource.on("SIGINT", handleSignal);
  signalSource.on("SIGTERM", handleSignal);
  try {
    await supervisor.start("api", "go", ["run", "./cmd/server"], { cwd: apiDir, env: apiEnvironment });
    if (!apiOnly) await supervisor.start("vite", process.execPath,
      [frontendCli, "run", "dev:frontend", "--", ...frontendArguments], { cwd: rootDir, env: environment });
  } catch { await supervisor.stop(1); }
  const exitCode = await supervisor.completed;
  signalSource.off("SIGINT", handleSignal);
  signalSource.off("SIGTERM", handleSignal);
  return exitCode;
};
