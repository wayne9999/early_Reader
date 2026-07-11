// Runtime bridge to Capacitor. In web builds Capacitor is not present, so we
// dynamically import and fall back to `isNative = false` without pulling any
// Capacitor code into the web bundle. All feature adapters go through
// `whenNative()` so the native branch is completely tree-shaken when the app
// runs on the web.

let capacitorCache: typeof import("@capacitor/core") | null = null;
let capacitorImportPromise: Promise<typeof import("@capacitor/core") | null> | null = null;

async function importCapacitorCore() {
  if (capacitorCache) {
    return capacitorCache;
  }

  if (capacitorImportPromise) {
    return capacitorImportPromise;
  }

  // Only load Capacitor when the WebView actually injects it. On plain web
  // there is no `window.Capacitor`, so we skip the import entirely and let
  // Vite tree-shake the module.
  if (typeof window === "undefined" || !("Capacitor" in window)) {
    return null;
  }

  capacitorImportPromise = import("@capacitor/core")
    .then((mod) => {
      capacitorCache = mod;
      return mod;
    })
    .catch(() => null);

  return capacitorImportPromise;
}

export type NativePlatform = "web" | "ios" | "android";

/**
 * Returns the current Capacitor platform. Safe to call on the web — resolves
 * to "web" when Capacitor is not present.
 */
export async function getPlatform(): Promise<NativePlatform> {
  const mod = await importCapacitorCore();

  if (!mod) {
    return "web";
  }

  const platform = mod.Capacitor.getPlatform();

  if (platform === "ios" || platform === "android") {
    return platform;
  }

  return "web";
}

export async function isNative(): Promise<boolean> {
  const mod = await importCapacitorCore();
  return mod?.Capacitor.isNativePlatform() ?? false;
}

/**
 * Run `fn` only when the app is inside the native Capacitor shell. Returns
 * `undefined` on the web without evaluating `fn`, which is important so
 * bundlers can dead-code-eliminate any native-only imports inside the
 * callback (they are lazy, awaited only when native).
 */
export async function whenNative<T>(fn: () => Promise<T>): Promise<T | undefined> {
  if (await isNative()) {
    return fn();
  }

  return undefined;
}
