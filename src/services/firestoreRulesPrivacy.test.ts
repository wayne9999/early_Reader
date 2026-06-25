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

  it("requires student learning events to be self-owned and skill-scoped", () => {
    expect(rules).toContain("match /learningEvents/{eventId}");
    expect(rules).toContain("request.resource.data.userId == request.auth.uid");
    expect(rules).toContain("\"activity_round_advanced\"");
    expect(rules).toContain("request.resource.data.area in [\"phonics\", \"sightWords\", \"fluency\", \"workingMemory\", \"consistency\"]");
  });

  it("scopes assignment links to the teacher or student on that link", () => {
    expect(rules).toContain("resource.data.studentId == request.auth.uid || resource.data.teacherId == request.auth.uid");
  });

  it("prevents declined teacher links from receiving new student progress snapshots", () => {
    expect(rules).toContain("resource.data.status in [\"requested\", \"active\"]");
  });

  it("supports a teacher-visible student placement queue without client-side assignment writes", () => {
    expect(rules).toContain("match /studentPlacementQueue/{studentId}");
    expect(rules).toContain("request.resource.data.status in [\"unassigned\", \"requested\"]");
    expect(rules).toContain("userRole() == \"teacher\" || isAdmin()");
    expect(rules).toContain("request.query.limit <= 25");
  });

  it("scopes classroom data to admins or classroom members", () => {
    expect(rules).toContain("function isClassroomMember(classroomId)");
    expect(rules).toContain("userRole() == \"admin\" || isClassroomMember(classroomId)");
  });

  it("keeps subscription authority backend-only", () => {
    expect(rules).toContain("match /subscriptions/{userId}");
    expect(rules).toContain("allow create, update, delete: if false;");
  });

  it("keeps AI summaries and insights backend-authored but readable to assigned teachers", () => {
    expect(rules).toContain("match /learningSummaries/{summaryId}");
    expect(rules).toContain("match /aiInsights/{insightId}");
    expect(rules).toContain("match /learningCoachState/{stateId}");
    expect(rules).toContain("allow read: if ownsUserDocument(userId) || isTeacherAssignedTo(userId);");
    expect(rules).toContain("allow create, update, delete: if false;");
  });

  it("keeps AI analysis jobs backend-only while allowing scoped status reads", () => {
    expect(rules).toContain("match /aiAnalysisJobs/{jobId}");
    expect(rules).toContain("resource.data.studentId == request.auth.uid");
    expect(rules).toContain("isTeacherAssignedTo(resource.data.studentId)");
    expect(rules).toContain("allow create, update, delete: if false;");
  });

  it("keeps AI budget records backend-only", () => {
    expect(rules).toContain("match /aiBudget/{document=**}");
    expect(rules).toContain("allow read, create, update, delete: if false;");
  });

  it("supports teacher invite codes without allowing client deletes", () => {
    expect(rules).toContain("match /teacherInvites/{inviteId}");
    expect(rules).toContain("request.resource.data.teacherId == request.auth.uid");
    expect(rules).toContain("allow delete: if false;");
  });

  it("keeps support case creation behind the rate-limited backend", () => {
    expect(rules).toContain("match /supportCases/{caseId}");
    expect(rules).toContain("allow create, delete: if false;");
  });

  it("keeps rate-limit counters backend-only", () => {
    expect(rules).toContain("match /abuseRateLimits/{limitId}");
    expect(rules).toContain("allow read, create, update, delete: if false;");
  });

  it("limits learning and analytics event payload shape", () => {
    expect(rules).toContain("request.resource.data.metadata.size() <= 16");
    expect(rules).toContain("request.resource.data.metadata.size() <= 12");
    expect(rules).toContain("request.resource.data.label.size() <= 180");
  });

  it("keeps operational logs backend-authored and admin-only", () => {
    expect(rules).toContain("match /systemLogs/{logId}");
    expect(rules).toContain("allow read: if isAdmin();");
    expect(rules).toContain("allow create, update, delete: if false;");
  });
});
