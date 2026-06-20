import type { AppView, UserProfile } from "../types";

const freeStudentActivityViews = new Set<AppView>(["rhymes", "soundSort", "sentenceBuilder"]);
const paidStudentActivityViews = new Set<AppView>([
  "rhymes",
  "soundSort",
  "sentenceBuilder",
  "storyOrder",
  "wordMeaning"
]);

export function isPaidFamilyProfile(profile: UserProfile | null) {
  return profile?.role === "student"
    && profile.subscriptionTier === "familyPlus"
    && profile.subscriptionStatus === "active";
}

export function studentActivityAccess(profile: UserProfile | null, view: AppView) {
  if (!paidStudentActivityViews.has(view)) {
    return "notActivity" as const;
  }

  if (!profile) {
    return "locked" as const;
  }

  if (profile.role === "teacher" || profile.role === "admin") {
    return "allowed" as const;
  }

  if (isPaidFamilyProfile(profile)) {
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
