import { httpsCallable } from "firebase/functions";
import type { SubscriptionTierId } from "../types";
import { billingConfig } from "./billingConfig";
import { getFirebaseRuntime } from "./firebase";

type CheckoutSessionResponse = {
  url?: string;
};

export function checkoutFallbackLink(tier: SubscriptionTierId) {
  if (tier === "familyPlus") {
    return billingConfig.familyPlusLink;
  }

  if (tier === "teacherPro") {
    return billingConfig.teacherProLink;
  }

  return "";
}

export async function startSubscriptionCheckout(tier: SubscriptionTierId) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || tier === "free") {
    return checkoutFallbackLink(tier);
  }

  try {
    const createCheckoutSession = httpsCallable<{ tier: SubscriptionTierId }, CheckoutSessionResponse>(
      runtime.functions,
      "createCheckoutSession"
    );
    const response = await createCheckoutSession({ tier });
    const url = response.data.url;

    if (url) {
      return url;
    }
  } catch (error) {
    const fallbackLink = checkoutFallbackLink(tier);

    if (fallbackLink) {
      return fallbackLink;
    }

    throw error;
  }

  return checkoutFallbackLink(tier);
}
