import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserProfile } from "./userProfileRepository";

vi.mock("./firebase", () => ({
  getFirebaseRuntime: () => null
}));

describe("userProfileRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates student profiles without undefined teacher-only fields", async () => {
    const profile = await createUserProfile(
      { id: "student-1", name: "Jayden", email: "jayden@example.com" },
      "student",
      "parentChild",
      { parentConsentAccepted: true }
    );

    expect(profile).toMatchObject({
      uid: "student-1",
      role: "student",
      signupPath: "parentChild",
      subscriptionTier: "free",
      subscriptionStatus: "free",
      gradeLevel: "K",
      readingGoal: "confidence",
      preferredPracticeMinutes: 5,
      parentConsentAccepted: true,
      parentConsentVersion: "parent-consent-v1"
    });
    expect(Object.prototype.hasOwnProperty.call(profile, "teacherCode")).toBe(false);
  });

  it("refuses to create student profiles without parent consent", async () => {
    await expect(createUserProfile(
      { id: "student-1", name: "Jayden", email: "jayden@example.com" },
      "student",
      "parentChild"
    )).rejects.toThrow(/consent is required/i);
  });

  it("adds teacher certification defaults for teacher profiles", async () => {
    const profile = await createUserProfile(
      { id: "teacher-1", name: "Mrs. Baker", email: "teacher@example.com" },
      "teacher",
      "teacher"
    );

    expect(profile.teacherCode).toBeTruthy();
    expect(profile.certificationStatus).toBe("notSubmitted");
    expect(profile.certificationNote).toMatch(/state-based/i);
  });
});
