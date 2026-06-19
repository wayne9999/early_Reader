import { describe, expect, it } from "vitest";
import {
  canAccessView,
  hashForView,
  homeViewForRole,
  parseAppRoute,
  requiresAuthentication,
  signupPathForView
} from "./appRoutes";
import type { UserProfile } from "../types";

const studentProfile: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Jayden",
  email: "jayden@example.com",
  picture: null
};

const teacherProfile: UserProfile = {
  uid: "teacher-1",
  role: "teacher",
  displayName: "Mrs. Baker",
  email: "teacher@example.com",
  picture: null
};

describe("appRoutes", () => {
  it("parses shareable hash routes and account return targets", () => {
    expect(parseAppRoute("#/donate")).toEqual({ view: "donate", nextView: null });
    expect(parseAppRoute("#/find-teacher")).toEqual({ view: "findTeacher", nextView: null });
    expect(parseAppRoute("#/account?next=teacher")).toEqual({ view: "account", nextView: "teacher" });
    expect(parseAppRoute("")).toEqual({ view: "reading", nextView: null });
  });

  it("builds hash routes that work on static hosting", () => {
    expect(hashForView("support")).toBe("#/support");
    expect(hashForView("account", "progress")).toBe("#/account?next=progress");
  });

  it("identifies protected and role-specific pages", () => {
    expect(requiresAuthentication("reading")).toBe(false);
    expect(requiresAuthentication("teacher")).toBe(true);
    expect(canAccessView(studentProfile, "progress")).toBe(true);
    expect(canAccessView(studentProfile, "teacher")).toBe(false);
    expect(canAccessView(teacherProfile, "teacher")).toBe(true);
    expect(canAccessView(teacherProfile, "progress")).toBe(false);
    expect(homeViewForRole("teacher")).toBe("teacher");
    expect(homeViewForRole("student")).toBe("reading");
    expect(signupPathForView("teacher")).toBe("teacher");
    expect(signupPathForView("findTeacher")).toBe("parentChild");
    expect(signupPathForView("support")).toBeNull();
  });
});
