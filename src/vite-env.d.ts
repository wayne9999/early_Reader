/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENVIRONMENT?: "development" | "production";
  readonly VITE_FIREBASE_APP_CHECK_SITE_KEY?: string;
  readonly VITE_STRIPE_MODE?: "test" | "live";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
