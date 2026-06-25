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
const expectedProjectId = import.meta.env.VITE_EXPECTED_FIREBASE_PROJECT_ID;
const forbiddenProjectId = import.meta.env.VITE_FORBIDDEN_FIREBASE_PROJECT_ID;
const appEnvironment = import.meta.env.VITE_APP_ENVIRONMENT ?? "development";

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

function assertSafeFirebaseEnvironment() {
  if (expectedProjectId && firebaseConfig.projectId !== expectedProjectId) {
    throw new Error(
      `ReadNest ${appEnvironment} Firebase configuration expected ${expectedProjectId}, received ${firebaseConfig.projectId || "no project"}.`
    );
  }

  if (forbiddenProjectId && firebaseConfig.projectId === forbiddenProjectId) {
    throw new Error(
      `ReadNest ${appEnvironment} cannot use Firebase project ${forbiddenProjectId}.`
    );
  }

  if (
    expectedProjectId &&
    forbiddenProjectId &&
    expectedProjectId === forbiddenProjectId
  ) {
    throw new Error("ReadNest Firebase environment boundaries are misconfigured.");
  }
}

let runtime: FirebaseRuntime | null = null;

export function getFirebaseRuntime() {
  if (!hasFirebaseConfig()) {
    if (appEnvironment === "production") {
      throw new Error("Production Firebase configuration is missing.");
    }

    return null;
  }

  assertSafeFirebaseEnvironment();

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
  if (!hasFirebaseConfig()) {
    if (appEnvironment === "production") {
      throw new Error("Production Firebase configuration is missing.");
    }

    return false;
  }

  assertSafeFirebaseEnvironment();
  return true;
}
