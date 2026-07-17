import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit-ts/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
