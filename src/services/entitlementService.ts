import type { AppView, SubscriptionRecord, UserProfile } from "../types";
import { hasActiveFamilyPlus, hasActiveTeacherPro } from "./subscriptionRepository";

const registeredActivityViews = new Set<AppView>(["rhymes", "soundSort"]);
const paidStudentActivityViews = new Set<AppView>([
  "sentenceBuilder",
  "storyOrder",
  "wordMeaning",
  "echoReader",
  "voiceQuest"
]);

export function isPaidFamilyProfile(profile: UserProfile | null, subscription?: SubscriptionRecord | null) {
  return profile?.role === "student" && (
    hasActiveFamilyPlus(subscription ?? null)
    || (subscription?.source === "demo" && profile.subscriptionTier === "familyPlus" && profile.subscriptionStatus === "active")
  );
}

export function studentActivityAccess(profile: UserProfile | null, view: AppView, subscription?: SubscriptionRecord | null) {
  if (!registeredActivityViews.has(view) && !paidStudentActivityViews.has(view)) {
    return "notActivity" as const;
  }

  if (!profile) {
    return "locked" as const;
  }

  if (profile.role === "admin") {
    return "allowed" as const;
  }

  if (registeredActivityViews.has(view)) {
    return "allowed" as const;
  }

  if (profile.role === "teacher") {
    return hasActiveTeacherPro(subscription ?? null) ? "allowed" as const : "locked" as const;
  }

  return isPaidFamilyProfile(profile, subscription) ? "allowed" as const : "locked" as const;
}

export function freeStudentActivitiesDescription() {
  return "Reading, Memory, Rhymes, and Sounds";
}

export function paidStudentActivitiesDescription() {
  return "Sentences, Story Steps, Word Garden, Echo Reader, Voice Quest, full progress history, and future premium packs";
}

export function teacherDashboardAccess(profile: UserProfile | null, subscription?: SubscriptionRecord | null) {
  if (!profile) {
    return "locked" as const;
  }

  if (profile.role === "admin") {
    return "allowed" as const;
  }

  if (profile.role !== "teacher") {
    return "notTeacher" as const;
  }

  if (hasActiveTeacherPro(subscription ?? null)) {
    return "allowed" as const;
  }

  if (subscription?.source === "demo" && profile.subscriptionTier === "teacherPro") {
    return "allowed" as const;
  }

  return "locked" as const;
}
