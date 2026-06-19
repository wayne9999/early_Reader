import type { AppView, UserProfile, UserRole } from "../types";

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
  rhymes: "rhymes",
  soundSort: "sound-sort",
  sentenceBuilder: "sentence-builder",
  storyOrder: "story-order",
  wordMeaning: "word-meaning",
  teacher: "teacher",
  donate: "donate",
  support: "support",
  account: "account"
};

const viewByRoutePath = Object.fromEntries(
  Object.entries(routePathByView).map(([view, path]) => [path, view])
) as Record<string, AppView>;

const guestViews = new Set<AppView>(["reading", "memory", "donate", "support", "account"]);
const pendingAuthRouteKey = "readnest-pending-auth-route-v1";

const viewsByRole: Record<UserRole, Set<AppView>> = {
  student: new Set([
    "reading",
    "memory",
    "progress",
    "findTeacher",
    "rhymes",
    "soundSort",
    "sentenceBuilder",
    "storyOrder",
    "wordMeaning",
    "donate",
    "support",
    "account"
  ]),
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

export function savePendingAuthView(view: AppView) {
  if (typeof window === "undefined" || !requiresAuthentication(view)) {
    return;
  }

  window.sessionStorage.setItem(pendingAuthRouteKey, routePathByView[view]);
}

export function loadPendingAuthView(): AppView | null {
  if (typeof window === "undefined") {
    return null;
  }

  const pendingPath = normalizePath(window.sessionStorage.getItem(pendingAuthRouteKey) ?? "");

  return viewByRoutePath[pendingPath] ?? null;
}

export function clearPendingAuthView() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(pendingAuthRouteKey);
}

function normalizePath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}
