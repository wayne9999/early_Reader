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
    expect(rules).toContain("request.query.limit <= 12");
  });

  it("lets teachers read student history only when actively assigned", () => {
    expect(rules).toContain("function isTeacherAssignedTo(studentId)");
    expect(rules).toContain("allow read: if ownsUserDocument(userId) || isTeacherAssignedTo(userId);");
  });

  it("scopes assignment links to the teacher or student on that link", () => {
    expect(rules).toContain("resource.data.studentId == request.auth.uid || resource.data.teacherId == request.auth.uid");
  });

  it("prevents declined teacher links from receiving new student progress snapshots", () => {
    expect(rules).toContain("resource.data.status in [\"requested\", \"active\"]");
  });

  it("scopes classroom data to admins or classroom members", () => {
    expect(rules).toContain("function isClassroomMember(classroomId)");
    expect(rules).toContain("userRole() == \"admin\" || isClassroomMember(classroomId)");
  });

  it("keeps subscription authority backend-only", () => {
    expect(rules).toContain("match /subscriptions/{userId}");
    expect(rules).toContain("allow create, update, delete: if false;");
  });

  it("supports teacher invite codes without allowing client deletes", () => {
    expect(rules).toContain("match /teacherInvites/{inviteId}");
    expect(rules).toContain("request.resource.data.teacherId == request.auth.uid");
    expect(rules).toContain("allow delete: if false;");
  });
});
