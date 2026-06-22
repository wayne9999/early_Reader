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

export async function trackProductEvent(
  user: AppUser | null,
  eventName: ProductEventName,
  metadata: ProductEventMetadata = {}
) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const event = {
    eventName,
    metadata: safeMetadata(metadata),
    userId: firebaseUser?.uid ?? "anonymous",
    createdAt: new Date().toISOString()
  };

  if (!runtime || !firebaseUser) {
    if (import.meta.env.DEV) {
      console.info("ReadNest analytics event", event);
    }
    return;
  }

  await addDoc(collection(runtime.db, "analyticsEvents"), {
    ...event,
    userId: firebaseUser.uid,
    createdAt: serverTimestamp()
  });
}
