import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/functions/lib/**"],
    coverage: {
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage"
    }
  }
});
