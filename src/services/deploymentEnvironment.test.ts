import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const validatorPath = resolve(process.cwd(), "scripts", "validate-deployment-env.mjs");

function validateEnvironment(env: Record<string, string>) {
  return spawnSync(process.execPath, [validatorPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      VITE_STRIPE_DONATION_LINK: "",
      ...env
    }
  });
}

describe("deployment environment boundaries", () => {
  it("accepts the dedicated development Firebase project", () => {
    const result = validateEnvironment({
      VITE_APP_ENVIRONMENT: "development",
      VITE_STRIPE_MODE: "test",
      VITE_FIREBASE_PROJECT_ID: "readnest-dev-f9c67",
      VITE_EXPECTED_FIREBASE_PROJECT_ID: "readnest-dev-f9c67",
      VITE_FORBIDDEN_FIREBASE_PROJECT_ID: "readnest-f9c67"
    });

    expect(result.status).toBe(0);
  });

  it("rejects production Firebase from a development build", () => {
    const result = validateEnvironment({
      VITE_APP_ENVIRONMENT: "development",
      VITE_STRIPE_MODE: "test",
      VITE_FIREBASE_PROJECT_ID: "readnest-f9c67",
      VITE_EXPECTED_FIREBASE_PROJECT_ID: "readnest-dev-f9c67",
      VITE_FORBIDDEN_FIREBASE_PROJECT_ID: "readnest-f9c67"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("belongs to the opposite environment");
  });

  it("rejects development Firebase from a production build", () => {
    const result = validateEnvironment({
      VITE_APP_ENVIRONMENT: "production",
      VITE_STRIPE_MODE: "live",
      VITE_FIREBASE_PROJECT_ID: "readnest-dev-f9c67",
      VITE_EXPECTED_FIREBASE_PROJECT_ID: "readnest-f9c67",
      VITE_FORBIDDEN_FIREBASE_PROJECT_ID: "readnest-dev-f9c67"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("belongs to the opposite environment");
  });
});
