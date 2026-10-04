import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

export const loadApiEnvironment = (envPath, inheritedEnvironment) => {
  const fileEnvironment = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : {};
  const environment = { ...fileEnvironment, ...inheritedEnvironment };
  if (!environment.DATABASE_URL?.trim()) {
    throw new Error("[api] Set DATABASE_URL in apps/api-go/.env or the process environment before starting.");
  }
  return environment;
};
