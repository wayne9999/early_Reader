import { describe, expect, it } from "vitest";
import {
  availableTeacherSlots,
  sortTeachersForStudentChoice,
  teacherLoadStatus
} from "./assignmentRepository";
import type { UserProfile } from "../types";

function teacher(overrides: Partial<UserProfile>): UserProfile {
  return {
    uid: overrides.uid ?? "teacher-1",
    role: "teacher",
    displayName: overrides.displayName ?? "Teacher",
    email: overrides.email ?? "teacher@example.com",
    picture: null,
    teacherCode: "READ-12345",
    maxStudentLoad: 12,
    activeStudentCount: 0,
    ...overrides
  };
}

describe("teacher assignment helpers", () => {
  it("labels teacher load from open to full", () => {
    expect(teacherLoadStatus(teacher({ activeStudentCount: 3, maxStudentLoad: 12 }))).toBe("open");
    expect(teacherLoadStatus(teacher({ activeStudentCount: 9, maxStudentLoad: 12 }))).toBe("nearlyFull");
    expect(teacherLoadStatus(teacher({ activeStudentCount: 12, maxStudentLoad: 12 }))).toBe("full");
  });

  it("sorts available teachers ahead of full teachers by lighter load", () => {
    const teachers = sortTeachersForStudentChoice([
      teacher({ uid: "full", displayName: "Full Teacher", activeStudentCount: 12 }),
      teacher({ uid: "medium", displayName: "Medium Teacher", activeStudentCount: 6 }),
      teacher({ uid: "light", displayName: "Light Teacher", activeStudentCount: 1 })
    ]);

    expect(teachers.map((item) => item.uid)).toEqual(["light", "medium", "full"]);
  });

  it("never shows negative available slots", () => {
    expect(availableTeacherSlots(teacher({ activeStudentCount: 14, maxStudentLoad: 12 }))).toBe(0);
  });
});
