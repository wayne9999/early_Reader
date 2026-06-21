import type { AppView, SubscriptionRecord, UserProfile } from "../types";
import { hasActiveFamilyPlus, hasActiveTeacherPro } from "./subscriptionRepository";

const freeStudentActivityViews = new Set<AppView>(["rhymes", "soundSort", "sentenceBuilder"]);
const paidStudentActivityViews = new Set<AppView>([
  "rhymes",
  "soundSort",
  "sentenceBuilder",
  "storyOrder",
  "wordMeaning"
]);

export function isPaidFamilyProfile(profile: UserProfile | null, subscription?: SubscriptionRecord | null) {
  return profile?.role === "student" && (
    hasActiveFamilyPlus(subscription ?? null)
    || (subscription?.source === "demo" && profile.subscriptionTier === "familyPlus" && profile.subscriptionStatus === "active")
  );
}

export function studentActivityAccess(profile: UserProfile | null, view: AppView, subscription?: SubscriptionRecord | null) {
  if (!paidStudentActivityViews.has(view)) {
    return "notActivity" as const;
  }

  if (!profile) {
    return "locked" as const;
  }

  if (profile.role === "teacher" || profile.role === "admin") {
    return "allowed" as const;
  }

  if (isPaidFamilyProfile(profile, subscription)) {
    return "allowed" as const;
  }

  return freeStudentActivityViews.has(view) ? "allowed" as const : "locked" as const;
}

export function freeStudentActivitiesDescription() {
  return "Reading, Memory, Rhymes, Sounds, and Sentences";
}

export function paidStudentActivitiesDescription() {
  return "Story Steps, Word Garden, full progress history, and future premium packs";
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
