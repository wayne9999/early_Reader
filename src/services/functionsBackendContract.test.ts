import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const functionsSource = readFileSync("functions/src/index.ts", "utf8");

describe("Firebase backend contract", () => {
  it("enforces App Check by default in production", () => {
    expect(functionsSource).toContain("const enforceAppCheck = process.env.READNEST_ENFORCE_APP_CHECK");
    expect(functionsSource).toContain(": isProductionEnvironment;");
  });

  describe("acceptTeacherInvite", () => {
    it("is exposed as a callable", () => {
      expect(functionsSource).toContain("export const acceptTeacherInvite = onCall(");
    });

    it("only accepts active, unexpired invites", () => {
      expect(functionsSource).toContain('invite.status !== "active"');
      expect(functionsSource).toContain("expiresAtMs && expiresAtMs < Date.now()");
    });

    it("consumes the invite so codes are single-use", () => {
      expect(functionsSource).toContain('status: "accepted"');
      expect(functionsSource).toContain("acceptedBy: studentId");
    });

    it("respects teacher capacity for auto-approved invites", () => {
      expect(functionsSource).toContain("This teacher's roster is full");
    });

    it("restricts acceptance to student accounts", () => {
      expect(functionsSource).toContain('studentProfile.role !== "student"');
    });
  });

  describe("fulfillDataDeletion", () => {
    it("is exposed as an admin-only callable", () => {
      expect(functionsSource).toContain("export const fulfillDataDeletion = onCall(");
      expect(functionsSource).toContain('requesterDoc.data()?.role !== "admin"');
    });

    it("requires explicit confirmation of the target user id", () => {
      expect(functionsSource).toContain("confirmation !== targetUserId");
    });

    it("deletes the full user document subtree and the auth account", () => {
      expect(functionsSource).toContain("db.recursiveDelete(db.doc(`users/${targetUserId}`))");
      expect(functionsSource).toContain("getAuth().deleteUser(targetUserId)");
    });

    it("removes assignment links, invites, child profiles, and analytics events", () => {
      expect(functionsSource).toContain('db.collection("teacherStudentLinks").where("studentId", "==", targetUserId)');
      expect(functionsSource).toContain('db.collection("teacherStudentLinks").where("teacherId", "==", targetUserId)');
      expect(functionsSource).toContain('db.collection("teacherInvites").where("teacherId", "==", targetUserId)');
      expect(functionsSource).toContain('db.collection("childProfiles").where("parentUid", "==", targetUserId)');
      expect(functionsSource).toContain('db.collection("analyticsEvents").where("userId", "==", targetUserId)');
    });

    it("resolves the originating support case when provided", () => {
      expect(functionsSource).toContain('resolution: "dataDeleted"');
    });
  });
});
