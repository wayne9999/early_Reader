import { logEvent } from "firebase/analytics";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { AppUser } from "../types";
import { getFirebaseRuntime } from "./firebase";

export type ProductEventName =
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "activity_started"
  | "activity_completed"
  | "practice_streak"
  | "paywall_viewed"
  | "checkout_clicked"
  | "subscription_active"
  | "subscription_canceled"
  | "teacher_invite_sent"
  | "teacher_invite_accepted"
  | "report_downloaded"
  | "ai_insight_requested";

type ProductEventMetadata = Record<string, string | number | boolean | null>;

function safeMetadata(metadata: ProductEventMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) =>
      !key.toLowerCase().includes("name")
      && !key.toLowerCase().includes("email")
      && !key.toLowerCase().includes("child")
      && value !== undefined
    )
  );
}

/**
 * Dual-write to Firestore (durable audit + backend jobs) and Firebase
 * Analytics (funnels + audiences in GA4). GA4 gets the event even for
 * anonymous visitors so paywall/signup drop-off is measurable.
 */
export async function trackProductEvent(
  user: AppUser | null,
  eventName: ProductEventName,
  metadata: ProductEventMetadata = {}
) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const cleanMetadata = safeMetadata(metadata);
  const event = {
    eventName,
    environment: import.meta.env.VITE_APP_ENVIRONMENT ?? "development",
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? null,
    metadata: cleanMetadata,
    userId: firebaseUser?.uid ?? "anonymous",
    createdAt: new Date().toISOString()
  };

  // Fire GA4 for every visitor, signed-in or not, so anonymous funnel steps
  // (paywall_viewed before signup, for example) are visible.
  if (runtime) {
    runtime.analytics
      .then((analytics) => {
        if (analytics) {
          logEvent(analytics, eventName, cleanMetadata);
        }
      })
      .catch(() => undefined);
  }

  if (!runtime || !firebaseUser) {
    if (import.meta.env.DEV) {
      console.info("ReadNest analytics event", event);
    }
    return;
  }

  try {
    await addDoc(collection(runtime.db, "analyticsEvents"), {
      ...event,
      userId: firebaseUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (writeError) {
    // Analytics failure must never break a user flow.
    if (import.meta.env.DEV) {
      console.warn("ReadNest analytics write failed", writeError);
    }
  }
}
