import type { SignupPath, SubscriptionTierId } from "../types";

const SUBSCRIPTION_INTENT_KEY = "readnest-subscription-intent-v1";

export function signupPathForSubscriptionTier(tier: SubscriptionTierId): SignupPath | null {
  if (tier === "familyPlus") {
    return "parentChild";
  }

  if (tier === "teacherPro") {
    return "teacher";
  }

  return null;
}

export function saveSubscriptionIntent(tier: SubscriptionTierId) {
  if (tier === "free") {
    clearSubscriptionIntent();
    return;
  }

  window.sessionStorage.setItem(SUBSCRIPTION_INTENT_KEY, tier);
}

export function loadSubscriptionIntent(): SubscriptionTierId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(SUBSCRIPTION_INTENT_KEY);

  return value === "familyPlus" || value === "teacherPro" ? value : null;
}

export function clearSubscriptionIntent() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SUBSCRIPTION_INTENT_KEY);
}
