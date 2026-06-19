import type { SignupPath, UserRole } from "../types";

const SIGNUP_INTENT_KEY = "readnest-signup-intent-v1";

export function roleFromSignupPath(path: SignupPath): UserRole {
  return path === "teacher" ? "teacher" : "student";
}

export function labelFromSignupPath(path: SignupPath) {
  return path === "teacher" ? "Teacher" : "Parent / Child";
}

export function saveSignupIntent(path: SignupPath) {
  localStorage.setItem(SIGNUP_INTENT_KEY, path);
}

export function loadSignupIntent(): SignupPath | null {
  const value = localStorage.getItem(SIGNUP_INTENT_KEY);
  return value === "parentChild" || value === "teacher" ? value : null;
}

export function clearSignupIntent() {
  localStorage.removeItem(SIGNUP_INTENT_KEY);
}
