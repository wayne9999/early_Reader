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
  it("allows free students into three extra signed-in activities", () => {
    expect(studentActivityAccess(freeStudent, "rhymes")).toBe("allowed");
    expect(studentActivityAccess(freeStudent, "soundSort")).toBe("allowed");
    expect(studentActivityAccess(freeStudent, "sentenceBuilder")).toBe("allowed");
  });

  it("locks later activities until Family Plus is active", () => {
    expect(studentActivityAccess(freeStudent, "storyOrder")).toBe("locked");
    expect(studentActivityAccess(freeStudent, "wordMeaning")).toBe("locked");

    expect(studentActivityAccess(freeStudent, "wordMeaning", activeFamilyPlus)).toBe("allowed");
  });

  it("lets teachers review all activities", () => {
    expect(
      studentActivityAccess(
        {
          uid: "teacher-1",
          role: "teacher",
          displayName: "Teacher",
          email: "teacher@example.com",
          picture: null
        },
        "storyOrder"
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
      teacherDashboardAccess(teacher, {
        userId: "teacher-1",
        tier: "teacherPro",
        status: "active",
        source: "stripe"
      })
    ).toBe("allowed");
  });
});
