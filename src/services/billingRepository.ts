import { httpsCallable } from "firebase/functions";
import type { SubscriptionTierId } from "../types";
import { billingConfig } from "./billingConfig";
import { getFirebaseRuntime } from "./firebase";

type CheckoutSessionResponse = {
  url?: string;
};

export async function startSubscriptionCheckout(tier: SubscriptionTierId) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    throw new Error("Sign in before starting a subscription.");
  }

  if (tier === "free") {
    throw new Error("Choose a paid subscription plan.");
  }

  const callableName = billingConfig.stripeMode === "test"
    ? "createCheckoutSessionTest"
    : "createCheckoutSession";
  const createCheckoutSession = httpsCallable<{ tier: SubscriptionTierId }, CheckoutSessionResponse>(
    runtime.functions,
    callableName
  );
  const response = await createCheckoutSession({ tier });
  const url = response.data.url;

  if (!url) {
    throw new Error("Stripe did not return a checkout page.");
  }

  return url;
}

export async function createBillingPortalUrl() {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    throw new Error("Sign in before managing billing.");
  }

  const callableName = billingConfig.stripeMode === "test"
    ? "createBillingPortalSessionTest"
    : "createBillingPortalSession";
  const createPortalSession = httpsCallable<Record<string, never>, CheckoutSessionResponse>(
    runtime.functions,
    callableName
  );
  const response = await createPortalSession({});

  if (!response.data.url) {
    throw new Error("Stripe did not return a billing portal page.");
  }

  return response.data.url;
}
