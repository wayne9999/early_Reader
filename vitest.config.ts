import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules", "dist", "tests/e2e"],
    globals: false,
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage"
    }
  }
});
