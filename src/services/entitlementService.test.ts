import { describe, expect, it } from "vitest";
import { studentActivityAccess, teacherDashboardAccess } from "./entitlementService";
import type { SubscriptionRecord, UserProfile } from "../types";

const freeStudent: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Reader",
  email: "reader@example.com",
  picture: null,
  subscriptionTier: "free",
  subscriptionStatus: "free"
};

const activeFamilyPlus: SubscriptionRecord = {
  userId: "student-1",
  tier: "familyPlus",
  status: "active",
  source: "stripe"
};

describe("entitlementService", () => {
  const activeTeacherPro: SubscriptionRecord = {
    userId: "teacher-1",
    tier: "teacherPro",
    status: "active",
    source: "stripe"
  };

  it("allows free students into two extra signed-in activities", () => {
    expect(studentActivityAccess(freeStudent, "rhymes")).toBe("allowed");
    expect(studentActivityAccess(freeStudent, "soundSort")).toBe("allowed");
  });

  it("locks later activities until Family Plus is active", () => {
    expect(studentActivityAccess(freeStudent, "sentenceBuilder")).toBe("locked");
    expect(studentActivityAccess(freeStudent, "storyOrder")).toBe("locked");
    expect(studentActivityAccess(freeStudent, "wordMeaning")).toBe("locked");
    expect(studentActivityAccess(freeStudent, "echoReader")).toBe("locked");
    expect(studentActivityAccess(freeStudent, "voiceQuest")).toBe("locked");

    expect(studentActivityAccess(freeStudent, "sentenceBuilder", activeFamilyPlus)).toBe("allowed");
    expect(studentActivityAccess(freeStudent, "wordMeaning", activeFamilyPlus)).toBe("allowed");
    expect(studentActivityAccess(freeStudent, "voiceQuest", activeFamilyPlus)).toBe("allowed");
  });

  it("requires Teacher Pro for premium teacher activity review", () => {
    const teacher: UserProfile = {
      uid: "teacher-1",
      role: "teacher",
      displayName: "Teacher",
      email: "teacher@example.com",
      picture: null
    };

    expect(studentActivityAccess(teacher, "rhymes")).toBe("allowed");
    expect(studentActivityAccess(teacher, "storyOrder")).toBe("locked");
    expect(
      studentActivityAccess(
        teacher,
        "storyOrder",
        activeTeacherPro
      )
    ).toBe("allowed");
  });

  it("locks teacher dashboard unless Teacher Pro is trusted active", () => {
    const teacher: UserProfile = {
      uid: "teacher-1",
      role: "teacher",
      displayName: "Teacher",
      email: "teacher@example.com",
      picture: null
    };

    expect(teacherDashboardAccess(teacher, { userId: "teacher-1", tier: "free", status: "free", source: "stripe" })).toBe("locked");
    expect(
      teacherDashboardAccess(teacher, activeTeacherPro)
    ).toBe("allowed");
  });
});
