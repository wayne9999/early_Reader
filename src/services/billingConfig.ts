import type { SubscriptionTier } from "../types";

export const billingConfig = {
  donationLink: import.meta.env.VITE_STRIPE_DONATION_LINK || "",
  familyPlusLink: import.meta.env.VITE_STRIPE_FAMILY_PLUS_LINK || "",
  teacherProLink: import.meta.env.VITE_STRIPE_TEACHER_PRO_LINK || "",
  customerPortalLink: import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_LINK || ""
};

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free Reader",
    price: "$0",
    audience: "Families getting started",
    description: "Core reading and memory practice for one learner.",
    perks: [
      "Guest Reading and Memory activities",
      "Three extra signed-in activities: Rhymes, Sounds, and Sentences",
      "Local progress tracking",
      "Read-aloud support"
    ],
    cta: "Included"
  },
  {
    id: "familyPlus",
    name: "Family Plus",
    price: "$7/month",
    audience: "Parents and caregivers",
    description: "Extra support for home practice and multiple children.",
    perks: [
      "Unlock Story Steps and Word Garden",
      "More guided practice packs as the library grows",
      "Cloud progress sync across devices",
      "Printable weekly practice plans",
      "Caregiver progress summaries"
    ],
    cta: "Start Family Plus",
    paymentEnvKey: "VITE_STRIPE_FAMILY_PLUS_LINK"
  },
  {
    id: "teacherPro",
    name: "Teacher Pro",
    price: "$19/month",
    audience: "Tutors, teachers, and small groups",
    description: "Classroom insight tools for targeted reading support.",
    perks: [
      "Student roster and classroom dashboard",
      "Strength and growth-area analysis",
      "Intervention group planning",
      "Exportable progress summaries",
      "AI-ready recommendation workflow"
    ],
    cta: "Start Teacher Pro",
    paymentEnvKey: "VITE_STRIPE_TEACHER_PRO_LINK"
  }
];

export function isBillingConfigured() {
  return Boolean(
    billingConfig.donationLink || billingConfig.familyPlusLink || billingConfig.teacherProLink
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
