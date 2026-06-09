import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            auth: ["@auth0/auth0-react"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore"]
          }
        }
      }
    },
    server: {
      host: "127.0.0.1",
      port: 4173
    },
    preview: {
      host: "127.0.0.1",
      port: 4173
    }
  };
});
