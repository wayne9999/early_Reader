import { doc, getDoc } from "firebase/firestore";
import type { AppUser, SubscriptionRecord, UserProfile } from "../types";
import { getFirebaseRuntime } from "./firebase";

export const freeSubscription: SubscriptionRecord = {
  userId: "guest",
  tier: "free",
  status: "free",
  source: "demo"
};

export function profileSubscriptionFallback(profile: UserProfile | null): SubscriptionRecord {
  return {
    userId: profile?.uid ?? "guest",
    tier: profile?.subscriptionTier ?? "free",
    status: profile?.subscriptionStatus ?? "free",
    source: "demo",
    updatedBy: "frontend-development-fallback"
  };
}

export async function loadTrustedSubscription(
  user: AppUser | null,
  profile: UserProfile | null
): Promise<SubscriptionRecord> {
  if (!user) {
    return freeSubscription;
  }

  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return profileSubscriptionFallback(profile);
  }

  const snapshot = await getDoc(doc(runtime.db, "subscriptions", firebaseUser.uid));

  if (!snapshot.exists()) {
    return {
      ...freeSubscription,
      userId: firebaseUser.uid,
      source: "stripe",
      updatedBy: "missing-subscription-document"
    };
  }

  const subscription = snapshot.data() as SubscriptionRecord;

  return {
    ...subscription,
    userId: firebaseUser.uid,
    source: subscription.source ?? "stripe"
  };
}

export function hasActiveFamilyPlus(subscription: SubscriptionRecord | null) {
  return subscription?.tier === "familyPlus" && subscription.status === "active";
}

export function hasActiveTeacherPro(subscription: SubscriptionRecord | null) {
  return subscription?.tier === "teacherPro" && subscription.status === "active";
}

export function needsBillingAttention(subscription: SubscriptionRecord | null) {
  return subscription?.status === "pastDue" || subscription?.status === "canceled";
}
