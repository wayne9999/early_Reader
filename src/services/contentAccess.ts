import type { AppUser, ContentAccessTier, SubscriptionRecord, UserProfile } from "../types";
import { hasActiveFamilyPlus, hasActiveTeacherPro } from "./subscriptionRepository";

const tierRank: Record<ContentAccessTier, number> = {
  guest: 0,
  registered: 1,
  paid: 2
};

export type TieredContent = {
  accessTier?: ContentAccessTier;
};

export function contentAccessTier(
  user: AppUser | null,
  profile?: UserProfile | null,
  subscription?: SubscriptionRecord | null
): ContentAccessTier {
  if (profile?.role === "admin") {
    return "paid";
  }

  if (profile?.role === "teacher") {
    return hasActiveTeacherPro(subscription ?? null) ? "paid" : "registered";
  }

  if (profile?.role === "student") {
    return hasActiveFamilyPlus(subscription ?? null)
      || (subscription?.source === "demo" && profile.subscriptionTier === "familyPlus" && profile.subscriptionStatus === "active")
      ? "paid"
      : "registered";
  }

  return user ? "registered" : "guest";
}

export function filterContentForTier<T extends TieredContent>(items: T[], tier: ContentAccessTier) {
  return items.filter((item) => tierRank[item.accessTier ?? "guest"] <= tierRank[tier]);
}

export function contentTierSummary(tier: ContentAccessTier) {
  if (tier === "paid") {
    return {
      label: "Full practice library",
      message: "Paid plan active: using the widest word, sound, sentence, memory, and voice practice sets."
    };
  }

  if (tier === "registered") {
    return {
      label: "Account practice library",
      message: "Signed-in learners get more variety, saved progress, and a clearer path to the next level."
    };
  }

  return {
    label: "Starter practice library",
    message: "Guests can try a smaller starter set before creating a free account."
  };
}
