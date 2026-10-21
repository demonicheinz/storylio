import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Embedded PostgreSQL instances are memory-heavy; bound parallel workers in CI.
    maxWorkers: 2,
    include: ["tests/**/*.test.ts"],
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
