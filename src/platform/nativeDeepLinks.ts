import { whenNative } from "./nativeBridge";

/**
 * Wire native Universal Links / App Links to hash-based ReadNest routes.
 *
 * When a user taps `https://myreadnest.org/#/reading` (or any deep link into
 * the app) on iOS or Android, the OS launches the Capacitor shell and emits
 * an `appUrlOpen` event with the tapped URL. The web app's router listens on
 * `hashchange`, so we translate the deep-link path into a hash change.
 *
 * The web build never subscribes because `whenNative()` short-circuits.
 */
export async function installDeepLinkHandler() {
  await whenNative(async () => {
    const { App } = await import("@capacitor/app");

    App.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);

        // Same-origin universal link: preserve hash route as-is.
        if (parsed.hostname === "myreadnest.org" || parsed.hostname.endsWith(".myreadnest.org")) {
          const hash = parsed.hash || "#/";
          if (window.location.hash !== hash) {
            window.location.hash = hash;
          }
          return;
        }

        // Custom scheme fallback (e.g. readnest://reading) — treat the path
        // as a route.
        if (parsed.protocol === "readnest:") {
          const route = parsed.pathname || parsed.host || "/";
          window.location.hash = `#/${route.replace(/^\/+/, "")}`;
        }
      } catch {
        // Malformed URL from the OS — safest to ignore rather than crash.
      }
    });
  });
}
