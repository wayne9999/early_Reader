import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleSetup } from "./features/account/RoleSetup";
import { SubscriptionManagement } from "./features/account/SubscriptionManagement";
import { SubscriptionPrompt } from "./features/account/SubscriptionPrompt";
import { LearningActivityPage } from "./features/activities/LearningActivityPage";
import { SignInPanel } from "./features/auth/SignInPanel";
import { useAuth } from "./features/auth/AuthProvider";
import { LegalPage } from "./features/legal/LegalPage";
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
import { billingConfig, isStripeLinkCompatible } from "./services/billingConfig";
import { startSubscriptionCheckout } from "./services/billingRepository";
import { paidStudentActivitiesDescription, studentActivityAccess, teacherDashboardAccess } from "./services/entitlementService";
import { defaultProgress, loadProgress, saveProgress } from "./services/progressRepository";
import { clearSignupIntent, loadSignupIntent } from "./services/signupIntent";
import { loadTrustedSubscription } from "./services/subscriptionRepository";
import { loadUserProfile } from "./services/userProfileRepository";
import type { AppUser, AppView, Progress, SignupPath, SubscriptionRecord, UserProfile, UserRole } from "./types";

type NavItem = { id: AppView; label: string; icon: string; badge?: string };
type NavGroup = { title: string; items: NavItem[]; defaultOpen?: boolean };

const activityNavItems: NavItem[] = [
  { id: "reading", label: "Reading", icon: "Aa" },
  { id: "memory", label: "Memory", icon: "?" },
  { id: "rhymes", label: "Rhymes", icon: "=" },
  { id: "soundSort", label: "Sounds", icon: ">" },
  { id: "sentenceBuilder", label: "Sentences", icon: "." },
  { id: "storyOrder", label: "Story", icon: "1" },
  { id: "wordMeaning", label: "Words", icon: "!" },
  { id: "echoReader", label: "Echo", icon: ">" },
  { id: "voiceQuest", label: "Voice Quest", icon: "*" }
];

const legalNavItems: NavItem[] = [
  { id: "privacy", label: "Privacy", icon: "i" },
  { id: "terms", label: "Terms", icon: "#" },
  { id: "childrenPrivacy", label: "Children", icon: "K" },
  { id: "refundPolicy", label: "Refunds", icon: "$" }
];

const studentNavGroups: NavGroup[] = [
  {
    title: "My space",
    items: [
      { id: "progress", label: "Dashboard", icon: "^" },
      { id: "findTeacher", label: "Find Teacher", icon: "T" }
    ],
    defaultOpen: true
  },
  { title: "Activities", items: activityNavItems, defaultOpen: true },
  {
    title: "Help",
    items: [
      { id: "donate", label: "Donate", icon: "$", badge: "Mission" },
      { id: "support", label: "Support", icon: "?" },
      { id: "account", label: "Account", icon: "R" }
    ],
    defaultOpen: true
  },
  { title: "Legal", items: legalNavItems }
];

const teacherNavGroups: NavGroup[] = [
  { title: "Workspace", items: [{ id: "teacher", label: "Dashboard", icon: "^" }], defaultOpen: true },
  { title: "Activities", items: activityNavItems, defaultOpen: true },
  {
    title: "Help",
    items: [
      { id: "support", label: "Support", icon: "?" },
      { id: "donate", label: "Donate", icon: "$", badge: "Mission" },
      { id: "account", label: "Account", icon: "R" }
    ],
    defaultOpen: true
  },
  { title: "Legal", items: legalNavItems }
];

const adminNavGroups: NavGroup[] = [
  { title: "Workspace", items: [{ id: "teacher", label: "Admin View", icon: "^" }], defaultOpen: true },
  {
    title: "Help",
    items: [
      { id: "support", label: "Support", icon: "?" },
      { id: "donate", label: "Donate", icon: "$", badge: "Mission" },
      { id: "account", label: "Account", icon: "R" }
    ],
    defaultOpen: true
  },
  { title: "Legal", items: legalNavItems }
];

const publicNavGroups: NavGroup[] = [
  {
    title: "Try now",
    items: [
      { id: "reading", label: "Reading", icon: "Aa" },
      { id: "memory", label: "Memory", icon: "?" }
    ],
    defaultOpen: true
  },
  {
    title: "Help",
    items: [
      { id: "donate", label: "Donate", icon: "$", badge: "Mission" },
      { id: "support", label: "Support", icon: "?" },
      { id: "account", label: "Account", icon: "R" }
    ],
    defaultOpen: true
  },
  { title: "Legal", items: legalNavItems }
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
  if (isStripeLinkCompatible(billingConfig.donationLink)) {
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
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [pendingAuthView, setPendingAuthView] = useState<AppView | null>(() => loadPendingAuthView());
  const [signupIntent, setSignupIntent] = useState<SignupPath | null>(() => loadSignupIntent());
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [postSubscriptionView, setPostSubscriptionView] = useState<AppView | null>(null);
  const goalCompleted = Math.min(progress.completedToday, 3);
  const navGroups =
    profile?.role === "admin"
      ? adminNavGroups
      : profile?.role === "teacher"
        ? teacherNavGroups
        : profile?.role === "student"
          ? studentNavGroups
          : publicNavGroups;
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
    let isMounted = true;

    setIsSubscriptionLoading(true);
    loadTrustedSubscription(user, profile)
      .then((loadedSubscription) => {
        if (isMounted) {
          setSubscription(loadedSubscription);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSubscriptionLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile, user]);

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
    if (isAuthLoading || isProgressLoading || isProfileLoading || isSubscriptionLoading) {
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
        setPostSubscriptionView(targetView === "account" ? "findTeacher" : nextView === "reading" ? "findTeacher" : nextView);
        setShowSubscriptionPrompt(true);
        return;
      }

      if (createdProfile.role === "teacher" && createdProfile.subscriptionStatus !== "active") {
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
      currentView === "wordMeaning" ||
      currentView === "echoReader" ||
      currentView === "voiceQuest"
    ) {
      if (studentActivityAccess(profile, currentView, subscription) === "locked") {
        const activityUpgradeTier = profile?.role === "teacher" ? "teacherPro" : "familyPlus";
        const activityUpgradeName = profile?.role === "teacher" ? "Teacher Pro" : "Family Plus";

        return (
          <article className="practice-panel subscription-prompt">
            <p className="eyebrow">Personalized path upgrade</p>
            <h2>Unlock the next layer of practice</h2>
            <p className="helper-text">
              This activity is part of the paid path. {activityUpgradeName} unlocks {paidStudentActivitiesDescription()}
              {profile?.role === "teacher" ? " for teacher review and student support." : " for students."}
            </p>
            <div className="subscription-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  void startSubscriptionCheckout(activityUpgradeTier).then((checkoutUrl) => {
                    if (checkoutUrl) {
                      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
                    }
                  });
                }}
              >
                Start {activityUpgradeName}
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
          profile={profile}
          onProgressChange={handleProgressChange}
        />
      );
    }

    if (currentView === "progress") {
      return <ProgressDashboard progress={progress} user={user} profile={profile} onProgressChange={handleProgressChange} />;
    }

    if (currentView === "teacher") {
      if (teacherDashboardAccess(profile, subscription) === "locked") {
        return (
          <article className="practice-panel subscription-prompt">
            <p className="eyebrow">Teacher insight workspace</p>
            <h2>Upgrade to review student growth signals</h2>
            <p className="helper-text">
              Teacher Pro unlocks the classroom dashboard, assigned-student analysis, report exports,
              intervention planning, and AI-supported recommendations when enabled.
            </p>
            <div className="subscription-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  void startSubscriptionCheckout("teacherPro").then((checkoutUrl) => {
                    if (checkoutUrl) {
                      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
                    }
                  });
                }}
              >
                Start Teacher Pro
              </button>
              <button className="secondary-button" type="button" onClick={() => navigateToView("support")}>
                Billing help
              </button>
            </div>
          </article>
        );
      }

      return <TeacherDashboard progress={progress} user={user} profile={profile} />;
    }

    if (currentView === "findTeacher" && profile?.role === "student") {
      return <FindTeacher progress={progress} user={user} profile={profile} />;
    }

    if (currentView === "donate") {
      return <SupportPage initialFocus="donation" />;
    }

    if (currentView === "support") {
      return <SupportPage profile={profile} user={user} />;
    }

    if (
      currentView === "privacy" ||
      currentView === "terms" ||
      currentView === "childrenPrivacy" ||
      currentView === "parentConsent" ||
      currentView === "teacherTerms" ||
      currentView === "refundPolicy"
    ) {
      return <LegalPage page={currentView} />;
    }

    if (currentView === "account") {
      return (
        <>
          {profile ? <SubscriptionManagement profile={profile} subscription={subscription} /> : null}
          <SignInPanel redirectView={requestedAuthView} />
        </>
      );
    }

    return <ReadingPractice progress={progress} user={user} onProgressChange={handleProgressChange} />;
  }, [
    currentView,
    isAuthLoading,
    isProfileLoading,
    isProgressLoading,
    isSubscriptionLoading,
    navigateToView,
    pendingAuthView,
    postSubscriptionView,
    profile,
    progress,
    requestedAuthView,
    showSubscriptionPrompt,
    signupIntent,
    subscription,
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
            <p className="eyebrow">Personalized reading paths</p>
            <h1>ReadNest</h1>
            <div className="identity-stack">
              <AccountStatusIndicator user={user} />
              {profile ? <RoleIndicator role={profile.role} /> : null}
            </div>
          </div>
        </div>

        {!user ? (
          <div className="sidebar-auth-actions" aria-label="Account shortcuts">
            <button type="button" onClick={() => navigateToView("account")}>
              <span aria-hidden="true">+</span>
              Create
            </button>
            <button type="button" onClick={() => navigateToView("account")}>
              <span aria-hidden="true">-&gt;</span>
              Login
            </button>
          </div>
        ) : null}

        <nav className="nav-tabs" aria-label="Main navigation">
          {navGroups.map((group) => {
            const isGroupActive = group.items.some((item) => item.id === currentView);

            return (
              <details className="nav-group" key={group.title} open={group.defaultOpen || isGroupActive}>
                <summary className="nav-group-title">{group.title}</summary>
                <div className="nav-subtabs">
                  {group.items.map((item) => (
                    <button
                      className={`nav-tab${item.id === "donate" ? " nav-donate" : ""}${currentView === item.id ? " is-active" : ""}`}
                      key={item.id}
                      type="button"
                      onClick={() => navigateToView(item.id)}
                    >
                      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.badge ? <small>{item.badge}</small> : null}
                    </button>
                  ))}
                </div>
              </details>
            );
          })}
        </nav>

        <section className="donation-card" aria-labelledby="donation-title">
          <p className="eyebrow">Mission fund</p>
          <h2 id="donation-title">Keep practice open</h2>
          <p>Donations support free starter activities, accessibility work, hosting, and classroom tools.</p>
          <button type="button" onClick={openDonationLink} disabled={!isStripeLinkCompatible(billingConfig.donationLink)}>
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
            <p className="eyebrow">Personalized early reading</p>
            <h2>A reading path that grows with each child.</h2>
            <p>
              Short, playful activities adapt around grade level, reading goals, recent misses, and teacher-visible
              progress so families know what to practice next.
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
        <footer className="site-footer" aria-label="Legal and support links">
          {legalNavItems.map((item) => (
            <button key={item.id} type="button" onClick={() => navigateToView(item.id)}>
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => navigateToView("parentConsent")}>Parent consent</button>
          <button type="button" onClick={() => navigateToView("teacherTerms")}>Teacher terms</button>
          <button type="button" onClick={() => navigateToView("support")}>Support</button>
        </footer>
      </main>
    </div>
  );
}
