import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rules = readFileSync("firestore.rules", "utf8");

describe("firestore privacy rules", () => {
  it("keeps full teacher profiles private to the owning teacher", () => {
    expect(rules).toContain("match /teacherProfiles/{teacherId}");
    expect(rules).toContain("allow read: if ownsUserDocument(teacherId);");
  });

  it("uses a limited teacher directory for student search", () => {
    expect(rules).toContain("match /teacherDirectory/{teacherId}");
    expect(rules).toContain("allow list: if isSignedIn()");
    expect(rules).toContain("request.query.limit <= 10");
  });

  it("lets teachers read student history only when actively assigned", () => {
    expect(rules).toContain("function isTeacherAssignedTo(studentId)");
    expect(rules).toContain("allow read: if ownsUserDocument(userId) || isTeacherAssignedTo(userId);");
  });

  it("scopes assignment links to the teacher or student on that link", () => {
    expect(rules).toContain("resource.data.studentId == request.auth.uid || resource.data.teacherId == request.auth.uid");
  });

  it("scopes classroom data to admins or classroom members", () => {
    expect(rules).toContain("function isClassroomMember(classroomId)");
    expect(rules).toContain("userRole() == \"admin\" || isClassroomMember(classroomId)");
  });
});
