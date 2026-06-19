import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSignupIntent,
  labelFromSignupPath,
  loadSignupIntent,
  roleFromSignupPath,
  saveSignupIntent
} from "./signupIntent";

describe("signupIntent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("maps parent child signup to the student role", () => {
    expect(roleFromSignupPath("parentChild")).toBe("student");
    expect(labelFromSignupPath("parentChild")).toBe("Parent / Child");
  });

  it("maps teacher signup to the teacher role", () => {
    expect(roleFromSignupPath("teacher")).toBe("teacher");
    expect(labelFromSignupPath("teacher")).toBe("Teacher");
  });

  it("saves, loads, and clears the selected signup path", () => {
    saveSignupIntent("teacher");

    expect(loadSignupIntent()).toBe("teacher");

    clearSignupIntent();

    expect(loadSignupIntent()).toBeNull();
  });

  it("ignores unknown stored values", () => {
    localStorage.setItem("readnest-signup-intent-v1", "admin");

    expect(loadSignupIntent()).toBeNull();
  });
});
