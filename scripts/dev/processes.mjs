import { spawn } from "node:child_process";

const signalProcessGroup = (child, signal) => {
  if (!child.pid) return;
  try { process.kill(-child.pid, signal); }
  catch (error) { if (error.code !== "ESRCH") throw error; }
};

const terminateWindowsTree = (child, spawnChild) => {
  if (!child.pid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const taskkill = spawnChild("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    taskkill.once("error", reject);
    taskkill.once("exit", resolve);
  });
};

const stopChildren = async (children, { platform, spawnChild, gracePeriodMs }) => {
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, gracePeriodMs); });
  try {
    const stops = children.map(({ child, closed }) => {
      if (platform === "win32") return terminateWindowsTree(child, spawnChild);
      signalProcessGroup(child, "SIGTERM");
      return closed;
    });
    await Promise.race([Promise.all(stops), timeout]);
    if (platform !== "win32") children.forEach(({ child }) => signalProcessGroup(child, "SIGKILL"));
  } finally { clearTimeout(timer); }
};

const startChild = (supervisor, name, command, args, options) => {
  if (supervisor.stopping) return Promise.resolve();
  const child = supervisor.options.spawnChild(command, args, {
    stdio: "inherit", detached: supervisor.options.platform !== "win32", ...options,
  });
  const closed = new Promise((resolve) => { child.once("close", resolve); });
  supervisor.children.push({ child, closed });
  child.once("exit", (code, signal) => {
    if (supervisor.stopping) return;
    supervisor.options.logError(`[${name}] exited${signal ? ` via ${signal}` : ` with code ${code}`}`);
    void supervisor.stop(code ?? 1);
  });
  return new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", (error) => {
      supervisor.options.logError(`[${name}] could not start (${error.code ?? "spawn error"}).`);
      void supervisor.stop(1);
      reject(error);
    });
  });
};

export const createProcessSupervisor = ({
  platform = process.platform, spawnChild = spawn, logError = console.error, gracePeriodMs = 2000,
} = {}) => {
  let finish;
  const completed = new Promise((resolve) => { finish = resolve; });
  const supervisor = { children: [], stopping: false, options: { platform, spawnChild, logError, gracePeriodMs } };
  supervisor.stop = async (code = 0) => {
    if (supervisor.stopping) return completed;
    supervisor.stopping = true;
    try { await stopChildren(supervisor.children, supervisor.options); }
    catch (error) { logError(`[dev] Process cleanup failed (${error.code ?? "unknown error"}).`); code = 1; }
    finish(code);
    return completed;
  };
  return { start: (...args) => startChild(supervisor, ...args), stop: supervisor.stop, completed };
};
