import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleSetup } from "./features/account/RoleSetup";
import { SubscriptionPrompt } from "./features/account/SubscriptionPrompt";
import { LearningActivityPage } from "./features/activities/LearningActivityPage";
import { SignInPanel } from "./features/auth/SignInPanel";
import { useAuth } from "./features/auth/AuthProvider";
import { MemoryGame } from "./features/memory/MemoryGame";
import { ProgressDashboard } from "./features/progress/ProgressDashboard";
import { ReadingPractice } from "./features/reading/ReadingPractice";
import { FindTeacher } from "./features/student/FindTeacher";
import { SupportPage } from "./features/support/SupportPage";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { syncAssignmentProgress } from "./services/assignmentRepository";
import {
  canAccessView,
  clearPendingAuthView,
  hashForView,
  homeViewForRole,
  loadPendingAuthView,
  parseAppRoute,
  requiresAuthentication,
  savePendingAuthView,
  type AppRouteState
} from "./services/appRoutes";
import { billingConfig } from "./services/billingConfig";
import { paidStudentActivitiesDescription, studentActivityAccess } from "./services/entitlementService";
import { defaultProgress, loadProgress, saveProgress } from "./services/progressRepository";
import { clearSignupIntent, loadSignupIntent } from "./services/signupIntent";
import { loadUserProfile } from "./services/userProfileRepository";
import type { AppUser, AppView, Progress, SignupPath, UserProfile, UserRole } from "./types";

const studentNavItems: Array<{ id: AppView; label: string }> = [
  { id: "reading", label: "Reading" },
  { id: "memory", label: "Memory" },
  { id: "rhymes", label: "Rhymes" },
  { id: "soundSort", label: "Sounds" },
  { id: "sentenceBuilder", label: "Sentences" },
  { id: "storyOrder", label: "Story" },
  { id: "wordMeaning", label: "Words" },
  { id: "progress", label: "Progress" },
  { id: "findTeacher", label: "Find Teacher" },
  { id: "donate", label: "Donate" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account" }
];

const teacherNavItems: Array<{ id: AppView; label: string }> = [
  { id: "teacher", label: "Dashboard" },
  { id: "reading", label: "Reading" },
  { id: "memory", label: "Memory" },
  { id: "rhymes", label: "Rhymes" },
  { id: "soundSort", label: "Sounds" },
  { id: "sentenceBuilder", label: "Sentences" },
  { id: "storyOrder", label: "Story" },
  { id: "wordMeaning", label: "Words" },
  { id: "support", label: "Support" },
  { id: "donate", label: "Donate" },
  { id: "account", label: "Account" }
];

const adminNavItems: Array<{ id: AppView; label: string }> = [
  { id: "teacher", label: "Admin View" },
  { id: "support", label: "Support" },
  { id: "donate", label: "Donate" },
  { id: "account", label: "Account" }
];

const publicNavItems: Array<{ id: AppView; label: string }> = [
  { id: "reading", label: "Reading" },
  { id: "memory", label: "Memory" },
  { id: "donate", label: "Donate" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account" }
];

const roleIndicatorMeta: Record<UserRole, { label: string; shortLabel: string; detail: string }> = {
  student: {
    label: "Student",
    shortLabel: "S",
    detail: "Practice mode"
  },
  teacher: {
    label: "Teacher",
    shortLabel: "T",
    detail: "Class tools"
  },
  admin: {
    label: "Admin",
    shortLabel: "A",
    detail: "System access"
  }
};

function openDonationLink() {
  if (billingConfig.donationLink) {
    window.open(billingConfig.donationLink, "_blank", "noopener,noreferrer");
  }
}

function RoleIndicator({ role }: { role: UserRole }) {
  const meta = roleIndicatorMeta[role];

  return (
    <div className={`role-indicator is-${role}`} aria-label={`Signed in as ${meta.label}`}>
      <span aria-hidden="true">{meta.shortLabel}</span>
      <strong>{meta.label}</strong>
      <small>{meta.detail}</small>
    </div>
  );
}

function AccountStatusIndicator({ user }: { user: AppUser | null }) {
  if (!user) {
    return (
      <div className="account-status is-guest" aria-label="Browsing as guest">
        <span aria-hidden="true" />
        <strong>Guest</strong>
        <small>Local practice</small>
      </div>
    );
  }

  return (
    <div className="account-status is-signed-in" aria-label={`Signed in as ${user.name}`}>
      <span aria-hidden="true" />
      <strong>Signed in</strong>
      <small>{user.name}</small>
    </div>
  );
}

export function RootApp() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [routeState, setRouteState] = useState<AppRouteState>(() => parseAppRoute(window.location.hash));
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pendingAuthView, setPendingAuthView] = useState<AppView | null>(() => loadPendingAuthView());
  const [signupIntent, setSignupIntent] = useState<SignupPath | null>(() => loadSignupIntent());
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [postSubscriptionView, setPostSubscriptionView] = useState<AppView | null>(null);
  const goalCompleted = Math.min(progress.completedToday, 3);
  const navItems =
    profile?.role === "admin"
      ? adminNavItems
      : profile?.role === "teacher"
        ? teacherNavItems
        : profile?.role === "student"
          ? studentNavItems
          : publicNavItems;
  const currentView = routeState.view;
  const requestedAuthView = currentView === "account" ? routeState.nextView ?? pendingAuthView : null;
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const navigateToView = useCallback((view: AppView, options: { nextView?: AppView | null; replace?: boolean } = {}) => {
    const nextHash = hashForView(view, options.nextView ?? null);
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

    if (options.replace) {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }

    setRouteState(parseAppRoute(nextHash));
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    const syncRoute = () => setRouteState(parseAppRoute(window.location.hash));

    if (!window.location.hash) {
      navigateToView("reading", { replace: true });
    }

    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);

    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, [navigateToView]);

  useEffect(() => {
    let isMounted = true;

    setIsProgressLoading(true);
    loadProgress(user)
      .then((loadedProgress) => {
        if (isMounted) {
          setProgress(loadedProgress);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsProgressLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    setSignupIntent(loadSignupIntent());
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    setIsProfileLoading(true);
    loadUserProfile(user)
      .then((loadedProfile) => {
        if (isMounted) {
          setProfile(loadedProfile);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || isProfileLoading) {
      return;
    }

    if (!user && requiresAuthentication(currentView)) {
      savePendingAuthView(currentView);
      setPendingAuthView(currentView);
      navigateToView("account", { nextView: currentView, replace: true });
      return;
    }

    if (user && profile && requestedAuthView) {
      const nextView = canAccessView(profile, requestedAuthView) ? requestedAuthView : homeViewForRole(profile.role);

      clearPendingAuthView();
      setPendingAuthView(null);
      navigateToView(nextView, {
        replace: true
      });
      return;
    }

    if (user && profile && pendingAuthView) {
      const nextView = canAccessView(profile, pendingAuthView) ? pendingAuthView : homeViewForRole(profile.role);

      clearPendingAuthView();
      setPendingAuthView(null);
      navigateToView(nextView, { replace: true });
      return;
    }

    if (user && profile && !canAccessView(profile, currentView)) {
      navigateToView(homeViewForRole(profile.role), { replace: true });
    }
  }, [currentView, isAuthLoading, isProfileLoading, navigateToView, pendingAuthView, profile, requestedAuthView, user]);

  const view = useMemo(() => {
    if (isAuthLoading || isProgressLoading || isProfileLoading) {
      return (
        <article className="practice-panel">
          <p className="eyebrow">Loading</p>
          <h2>Getting your learning space ready...</h2>
        </article>
      );
    }

    const handleProgressChange = (nextProgress: Progress) => {
      setProgress(nextProgress);
      void saveProgress(nextProgress, user);
      void syncAssignmentProgress(user, nextProgress);
    };

    const handleProfileCreated = (createdProfile: UserProfile) => {
      const targetView = requestedAuthView ?? pendingAuthView ?? currentView;
      const nextView = canAccessView(createdProfile, targetView) ? targetView : homeViewForRole(createdProfile.role);

      setProfile(createdProfile);
      clearSignupIntent();
      setSignupIntent(null);
      clearPendingAuthView();
      setPendingAuthView(null);

      if (createdProfile.role === "student" && createdProfile.subscriptionStatus !== "active") {
        setPostSubscriptionView(nextView);
        setShowSubscriptionPrompt(true);
        return;
      }

      navigateToView(nextView, { replace: true });
    };

    const continueAfterSubscriptionPrompt = () => {
      const nextView = postSubscriptionView ?? homeViewForRole(profile?.role ?? "student");

      setShowSubscriptionPrompt(false);
      setPostSubscriptionView(null);
      navigateToView(nextView, { replace: true });
    };

    if (!user && requiresAuthentication(currentView)) {
      return <SignInPanel redirectView={currentView} />;
    }

    if (user && !profile) {
      return (
        <RoleSetup
          user={user}
          preferredSignupPath={signupIntent}
          onProfileCreated={handleProfileCreated}
        />
      );
    }

    if (user && profile && showSubscriptionPrompt) {
      return (
        <SubscriptionPrompt
          user={user}
          profile={profile}
          onProfileUpdated={setProfile}
          onContinue={continueAfterSubscriptionPrompt}
        />
      );
    }

    if (profile && !canAccessView(profile, currentView)) {
      return (
        <article className="practice-panel">
          <p className="eyebrow">Opening workspace</p>
          <h2>Taking you to the right page...</h2>
        </article>
      );
    }

    if (currentView === "memory") {
      return <MemoryGame progress={progress} user={user} onProgressChange={handleProgressChange} />;
    }

    if (
      currentView === "rhymes" ||
      currentView === "soundSort" ||
      currentView === "sentenceBuilder" ||
      currentView === "storyOrder" ||
      currentView === "wordMeaning"
    ) {
      if (studentActivityAccess(profile, currentView) === "locked") {
        return (
          <article className="practice-panel subscription-prompt">
            <p className="eyebrow">Family Plus activity</p>
            <h2>Subscribe to unlock this activity</h2>
            <p className="helper-text">
              This activity is part of the paid student path. Family Plus unlocks {paidStudentActivitiesDescription()}.
            </p>
            <div className="subscription-actions">
              <button
                className="primary-button"
                disabled={!billingConfig.familyPlusLink}
                type="button"
                onClick={() => {
                  if (billingConfig.familyPlusLink) {
                    window.open(billingConfig.familyPlusLink, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Start Family Plus
              </button>
              <button className="secondary-button" type="button" onClick={() => navigateToView("rhymes")}>
                Use free activities
              </button>
            </div>
          </article>
        );
      }

      return (
        <LearningActivityPage
          activityId={currentView}
          progress={progress}
          user={user}
          onProgressChange={handleProgressChange}
        />
      );
    }

    if (currentView === "progress") {
      return <ProgressDashboard progress={progress} user={user} onProgressChange={handleProgressChange} />;
    }

    if (currentView === "teacher") {
      return <TeacherDashboard progress={progress} user={user} />;
    }

    if (currentView === "findTeacher" && profile?.role === "student") {
      return <FindTeacher progress={progress} user={user} profile={profile} />;
    }

    if (currentView === "donate") {
      return <SupportPage initialFocus="donation" />;
    }

    if (currentView === "support") {
      return <SupportPage />;
    }

    if (currentView === "account") {
      return <SignInPanel redirectView={requestedAuthView} />;
    }

    return <ReadingPractice progress={progress} user={user} onProgressChange={handleProgressChange} />;
  }, [
    currentView,
    isAuthLoading,
    isProfileLoading,
    isProgressLoading,
    navigateToView,
    pendingAuthView,
    postSubscriptionView,
    profile,
    progress,
    requestedAuthView,
    showSubscriptionPrompt,
    signupIntent,
    user
  ]);

  return (
    <div className={`app-shell${isMenuOpen ? " is-menu-open" : ""}`}>
      <button
        className="mobile-menu-button"
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="main-menu"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <button
        className="mobile-menu-scrim"
        type="button"
        aria-label="Close menu"
        tabIndex={isMenuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <aside className="sidebar" id="main-menu" aria-label="Learning areas">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <div>
            <p className="eyebrow">Early reader MVP</p>
            <h1>ReadNest</h1>
            <div className="identity-stack">
              <AccountStatusIndicator user={user} />
              {profile ? <RoleIndicator role={profile.role} /> : null}
            </div>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-tab${item.id === "donate" ? " nav-donate" : ""}${currentView === item.id ? " is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => navigateToView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="donation-card" aria-labelledby="donation-title">
          <p className="eyebrow">Mission fund</p>
          <h2 id="donation-title">Help a child read</h2>
          <p>Donations support free lessons, accessibility work, hosting, and classroom tools.</p>
          <button type="button" onClick={openDonationLink} disabled={!billingConfig.donationLink}>
            Donate
          </button>
        </section>

        <section className="daily-goal" aria-labelledby="goal-title">
          <h2 id="goal-title">Today</h2>
          <p>Practice 3 short activities. Keep sessions calm, brief, and repeatable.</p>
          <div className="goal-meter" aria-label="Daily activities completed">
            <span style={{ width: `${(goalCompleted / 3) * 100}%` }} />
          </div>
          <strong>{goalCompleted} of 3 complete</strong>
        </section>
      </aside>

      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">A calm practice space</p>
            <h2>Play with words. Grow your reading.</h2>
            <p>
              Built for kindergarten through grade 2 learners with large text, short turns, read-aloud
              support, and caregiver-visible progress.
            </p>
          </div>
          <div className="hero-scene" aria-hidden="true">
            <div className="book-shape">
              <span>A</span>
              <span>B</span>
              <span>C</span>
              <span>go</span>
            </div>
          </div>
        </section>

        <section className="view-root" aria-live="polite">
          {view}
        </section>
      </main>
    </div>
  );
}
