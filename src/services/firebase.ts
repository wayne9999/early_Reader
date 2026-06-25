import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck
} from "firebase/app-check";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

type FirebaseRuntime = {
  analytics: Promise<Analytics | null>;
  app: FirebaseApp;
  appCheck: AppCheck | null;
  auth: Auth;
  db: Firestore;
  functions: Functions;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let runtime: FirebaseRuntime | null = null;

export function getFirebaseRuntime() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!runtime) {
    const app = initializeApp(firebaseConfig);
    const appCheck = appCheckSiteKey
      ? initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true
        })
      : null;

    runtime = {
      analytics: measurementId
        ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
        : Promise.resolve(null),
      app,
      appCheck,
      auth: getAuth(app),
      db: getFirestore(app),
      functions: getFunctions(app, "us-central1")
    };
  }

  return runtime;
}

export function isFirebaseConfigured() {
  return hasFirebaseConfig();
}
