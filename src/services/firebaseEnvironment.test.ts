import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function configureFirebase(projectId: string, expected: string, forbidden: string) {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "public-test-key");
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", `${projectId}.firebaseapp.com`);
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", projectId);
  vi.stubEnv("VITE_FIREBASE_APP_ID", "1:123:web:test");
  vi.stubEnv("VITE_EXPECTED_FIREBASE_PROJECT_ID", expected);
  vi.stubEnv("VITE_FORBIDDEN_FIREBASE_PROJECT_ID", forbidden);
}

describe("Firebase runtime environment boundary", () => {
  it("allows the expected project", async () => {
    configureFirebase("readnest-dev-f9c67", "readnest-dev-f9c67", "readnest-f9c67");
    const { isFirebaseConfigured } = await import("./firebase");

    expect(isFirebaseConfigured()).toBe(true);
  });

  it("throws when development receives the production project", async () => {
    configureFirebase("readnest-f9c67", "readnest-dev-f9c67", "readnest-f9c67");
    const { getFirebaseRuntime, isFirebaseConfigured } = await import("./firebase");

    expect(() => isFirebaseConfigured()).toThrow("expected readnest-dev-f9c67");
    expect(() => getFirebaseRuntime()).toThrow("expected readnest-dev-f9c67");
  });
});
