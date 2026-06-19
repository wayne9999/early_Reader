import type { AppView, SignupPath, UserProfile, UserRole } from "../types";

export type AppRouteState = {
  view: AppView;
  nextView: AppView | null;
};

export const defaultView: AppView = "reading";

export const routePathByView: Record<AppView, string> = {
  reading: "reading",
  memory: "memory",
  progress: "progress",
  findTeacher: "find-teacher",
  teacher: "teacher",
  donate: "donate",
  support: "support",
  account: "account"
};

export const routeLabelByView: Record<AppView, string> = {
  reading: "Reading practice",
  memory: "Memory game",
  progress: "Progress dashboard",
  findTeacher: "Find Teacher",
  teacher: "Teacher dashboard",
  donate: "Donate",
  support: "Support center",
  account: "Account"
};

const viewByRoutePath = Object.fromEntries(
  Object.entries(routePathByView).map(([view, path]) => [path, view])
) as Record<string, AppView>;

const guestViews = new Set<AppView>(["reading", "memory", "donate", "support", "account"]);

const viewsByRole: Record<UserRole, Set<AppView>> = {
  student: new Set(["reading", "memory", "progress", "findTeacher", "donate", "support", "account"]),
  teacher: new Set(["teacher", "donate", "support", "account"]),
  admin: new Set(["teacher", "donate", "support", "account"])
};

export function hashForView(view: AppView, nextView?: AppView | null) {
  const params = new URLSearchParams();

  if (nextView) {
    params.set("next", routePathByView[nextView]);
  }

  const query = params.toString();

  return `#/${routePathByView[view]}${query ? `?${query}` : ""}`;
}

export function parseAppRoute(hash: string): AppRouteState {
  const routeHash = hash.replace(/^#/, "");

  if (!routeHash) {
    return { view: defaultView, nextView: null };
  }

  const [rawPath, rawQuery = ""] = routeHash.split("?");
  const path = normalizePath(rawPath);
  const view = viewByRoutePath[path] ?? defaultView;
  const query = new URLSearchParams(rawQuery);
  const nextPath = normalizePath(query.get("next") ?? "");

  return {
    view,
    nextView: viewByRoutePath[nextPath] ?? null
  };
}

export function isGuestAccessibleView(view: AppView) {
  return guestViews.has(view);
}

export function requiresAuthentication(view: AppView) {
  return !isGuestAccessibleView(view);
}

export function canAccessView(profile: UserProfile, view: AppView) {
  return viewsByRole[profile.role].has(view);
}

export function homeViewForRole(role: UserRole): AppView {
  return role === "student" ? "reading" : "teacher";
}

export function signupPathForView(view: AppView): SignupPath | null {
  if (view === "teacher") {
    return "teacher";
  }

  if (view === "progress" || view === "findTeacher") {
    return "parentChild";
  }

  return null;
}

function normalizePath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}
