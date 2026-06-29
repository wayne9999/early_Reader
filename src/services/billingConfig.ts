import type { SubscriptionTier } from "../types";

export const billingConfig = {
  environment: import.meta.env.VITE_APP_ENVIRONMENT || "development",
  stripeMode: import.meta.env.VITE_STRIPE_MODE || "test",
  donationLink: import.meta.env.VITE_STRIPE_DONATION_LINK || "",
  familyPlusLink: import.meta.env.VITE_STRIPE_FAMILY_PLUS_LINK || "",
  teacherProLink: import.meta.env.VITE_STRIPE_TEACHER_PRO_LINK || "",
  customerPortalLink: import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_LINK || ""
};

export function isStripeLinkCompatible(link: string) {
  if (!link) {
    return false;
  }

  const isTestLink = link.includes("/test_");

  return billingConfig.stripeMode === "test" ? isTestLink : !isTestLink;
}

export function isTemporaryStripePortalSession(link: string) {
  if (!link) {
    return false;
  }

  try {
    const url = new URL(link);

    return url.hostname.endsWith("billing.stripe.com") && url.pathname.includes("/session");
  } catch {
    return false;
  }
}

export function isCustomerPortalConfigured() {
  return Boolean(billingConfig.customerPortalLink) && !isTemporaryStripePortalSession(billingConfig.customerPortalLink);
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free Reader",
    price: "$0",
    audience: "Families getting started",
    description: "A useful starter path for one young reader.",
    perks: [
      "Guest Reading and Memory activities",
      "Signed-in Rhymes and Sounds practice",
      "Basic personalized dashboard signals",
      "Read-aloud support"
    ],
    cta: "Included"
  },
  {
    id: "familyPlus",
    name: "Family Plus",
    price: "$7/month",
    audience: "Parents and caregivers",
    description: "A richer personalized path for home reading growth.",
    perks: [
      "Unlock premium Story Steps and Word Garden practice",
      "Unlock Echo Reader and Voice Quest premium voice games",
      "More guided packs shaped around missed words and goals",
      "Cloud progress sync across devices",
      "Printable weekly practice plans",
      "Parent-friendly strengths and next-step summaries"
    ],
    cta: "Start Family Plus",
    paymentEnvKey: "VITE_STRIPE_FAMILY_PLUS_LINK"
  },
  {
    id: "teacherPro",
    name: "Teacher Pro",
    price: "$19/month",
    audience: "Tutors, teachers, and small groups",
    description: "Actionable student insight for targeted reading support.",
    perks: [
      "Assigned-student roster and classroom dashboard",
      "Premium activity review including voice-powered practice",
      "Strength and growth-area analysis",
      "Intervention group planning",
      "Exportable progress summaries",
      "AI-supported recommendation workflow when enabled"
    ],
    cta: "Start Teacher Pro",
    paymentEnvKey: "VITE_STRIPE_TEACHER_PRO_LINK"
  }
];

export function isBillingConfigured() {
  return Boolean(
    isStripeLinkCompatible(billingConfig.donationLink)
      || isStripeLinkCompatible(billingConfig.familyPlusLink)
      || isStripeLinkCompatible(billingConfig.teacherProLink)
  );
}

export function linkForTier(tier: SubscriptionTier) {
  if (tier.id === "familyPlus") {
    return billingConfig.familyPlusLink;
  }

  if (tier.id === "teacherPro") {
    return billingConfig.teacherProLink;
  }

  return "";
}
