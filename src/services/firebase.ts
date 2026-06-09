import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseRuntime = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => Boolean(value));
}

let runtime: FirebaseRuntime | null = null;

export function getFirebaseRuntime() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!runtime) {
    const app = initializeApp(firebaseConfig);
    runtime = {
      app,
      auth: getAuth(app),
      db: getFirestore(app)
    };
  }

  return runtime;
}

export function isFirebaseConfigured() {
  return hasFirebaseConfig();
}
