import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseRuntime } from "./firebase";

type RuntimeErrorPayload = {
  source: "react-error-boundary" | "window-onerror" | "unhandled-rejection" | "checkout" | "manual";
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

const MAX_STACK = 4000;
const MAX_MESSAGE = 500;

function trim(value: string | null | undefined, limit: number) {
  if (!value) {
    return null;
  }

  return value.length > limit ? value.slice(0, limit) : value;
}

/**
 * Report a runtime error to Firestore so ops can inspect it after the fact.
 * Falls back to console.error when the runtime is not configured so local
 * developers still see the failure. Deliberately catches its own failure so
 * an error inside the error reporter cannot crash the caller.
 */
export async function reportRuntimeError(payload: RuntimeErrorPayload): Promise<string | null> {
  const runtime = getFirebaseRuntime();
  const message = trim(payload.message, MAX_MESSAGE) ?? "Unknown error";
  const record = {
    source: payload.source,
    message,
    stack: trim(payload.stack ?? null, MAX_STACK),
    componentStack: trim(payload.componentStack ?? null, MAX_STACK),
    environment: import.meta.env.VITE_APP_ENVIRONMENT ?? "development",
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? null,
    url: typeof window !== "undefined" ? window.location.href : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    metadata: payload.metadata ?? {},
    userId: runtime?.auth.currentUser?.uid ?? "anonymous",
    createdAt: new Date().toISOString()
  };

  if (!runtime) {
    if (import.meta.env.DEV) {
      console.error("ReadNest runtime error", record);
    }
    return null;
  }

  try {
    const docRef = await addDoc(collection(runtime.db, "runtimeErrors"), {
      ...record,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (writeError) {
    if (import.meta.env.DEV) {
      console.error("ReadNest runtime error (write failed)", record, writeError);
    }
    return null;
  }
}

let listenersInstalled = false;

/**
 * Install window-level listeners once so uncaught errors and unhandled
 * promise rejections flow to Firestore even when React does not touch them.
 */
export function installGlobalErrorListeners() {
  if (typeof window === "undefined" || listenersInstalled) {
    return;
  }

  listenersInstalled = true;

  window.addEventListener("error", (event) => {
    void reportRuntimeError({
      source: "window-onerror",
      message: event.message,
      stack: event.error instanceof Error ? event.error.stack ?? null : null,
      metadata: {
        filename: event.filename ?? null,
        lineno: event.lineno ?? null,
        colno: event.colno ?? null
      }
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "Unhandled promise rejection";
    void reportRuntimeError({
      source: "unhandled-rejection",
      message,
      stack: reason instanceof Error ? reason.stack ?? null : null
    });
  });
}
