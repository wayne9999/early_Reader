import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAPACITOR_ENV === "development";

/**
 * Capacitor shell for iOS and Android.
 *
 * - The web build in `dist/` is the source of truth. Run `npm run build`
 *   before `npx cap sync` so both native shells load the latest React app.
 * - `androidScheme: "https"` lets Android use Universal Links + WebView
 *   HTTPS. iOS defaults to `capacitor://` and does not need this set.
 * - In development, set CAPACITOR_ENV=development to point the WebView at
 *   the Vite dev server for hot reload on real devices. The server URL
 *   must be reachable from the device; usually your workstation LAN IP.
 */
const config: CapacitorConfig = {
  appId: "org.myreadnest.app",
  appName: "ReadNest",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    ...(isDev
      ? {
          url: process.env.CAPACITOR_DEV_URL ?? "http://127.0.0.1:4173",
          cleartext: true
        }
      : {
          hostname: "myreadnest.org"
        })
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: true,
    scheme: "ReadNest"
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    App: {
      // Deep-link scheme (fallback to Universal Links / App Links).
      launchUrl: "https://myreadnest.org/"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#fff7d7"
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true
    }
  }
};

export default config;
