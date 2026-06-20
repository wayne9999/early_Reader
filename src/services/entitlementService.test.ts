import { describe, expect, it } from "vitest";
import { studentActivityAccess } from "./entitlementService";
import type { UserProfile } from "../types";

const freeStudent: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Reader",
  email: "reader@example.com",
  picture: null,
  subscriptionTier: "free",
  subscriptionStatus: "free"
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

    expect(
      studentActivityAccess(
        {
          ...freeStudent,
          subscriptionTier: "familyPlus",
          subscriptionStatus: "active"
        },
        "wordMeaning"
      )
    ).toBe("allowed");
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
});
