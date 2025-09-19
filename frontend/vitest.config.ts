import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
    reporters: ["default"],
    coverage: { reporter: ["text", "lcov"], provider: "v8" },
  },
  resolve: {
    alias: {
      "@memory": path.resolve(__dirname, "../packages/memory-sdk/src"),
      "@mcp": path.resolve(__dirname, "../packages/mcp-server/src"),
    },
  },
});