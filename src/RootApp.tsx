import { useEffect, useMemo, useState } from "react";
import { RoleSetup } from "./features/account/RoleSetup";
import { SignInPanel } from "./features/auth/SignInPanel";
import { useAuth } from "./features/auth/AuthProvider";
import { MemoryGame } from "./features/memory/MemoryGame";
import { ProgressDashboard } from "./features/progress/ProgressDashboard";
import { ReadingPractice } from "./features/reading/ReadingPractice";
import { FindTeacher } from "./features/student/FindTeacher";
import { SupportPage } from "./features/support/SupportPage";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { syncAssignmentProgress } from "./services/assignmentRepository";
import { billingConfig } from "./services/billingConfig";
import { defaultProgress, loadProgress, saveProgress } from "./services/progressRepository";
import { loadUserProfile } from "./services/userProfileRepository";
import type { AppUser, AppView, Progress, UserProfile, UserRole } from "./types";

const studentNavItems: Array<{ id: AppView; label: string }> = [
  { id: "reading", label: "Reading" },
  { id: "memory", label: "Memory" },
  { id: "progress", label: "Progress" },
  { id: "findTeacher", label: "Find Teacher" },
  { id: "donate", label: "Donate" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account" }
];

const teacherNavItems: Array<{ id: AppView; label: string }> = [
  { id: "teacher", label: "Teacher" },
  { id: "support", label: "Plans" },
  { id: "donate", label: "Donate" },
  { id: "account", label: "Account" }
];

const adminNavItems: Array<{ id: AppView; label: string }> = [
  { id: "teacher", label: "Admin View" },
  { id: "support", label: "Plans" },
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
  const [currentView, setCurrentView] = useState<AppView>("reading");
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const goalCompleted = Math.min(progress.completedToday, 3);
  const navItems =
    profile?.role === "admin"
      ? adminNavItems
      : profile?.role === "teacher"
        ? teacherNavItems
        : profile?.role === "student"
          ? studentNavItems
          : publicNavItems;

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
    let isMounted = true;

    setIsProfileLoading(true);
    loadUserProfile(user)
      .then((loadedProfile) => {
        if (isMounted) {
          setProfile(loadedProfile);
          if (loadedProfile?.role === "teacher" || loadedProfile?.role === "admin") {
            setCurrentView("teacher");
          }
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

    if (user && !profile) {
      return <RoleSetup user={user} onProfileCreated={setProfile} />;
    }

    if ((profile?.role === "teacher" || profile?.role === "admin") && !["teacher", "support", "donate", "account"].includes(currentView)) {
      return <TeacherDashboard progress={progress} user={user} />;
    }

    if (profile?.role === "student" && currentView === "teacher") {
      return <ProgressDashboard progress={progress} user={user} onProgressChange={handleProgressChange} />;
    }

    if (currentView === "memory") {
      return <MemoryGame progress={progress} user={user} onProgressChange={handleProgressChange} />;
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
      return <SignInPanel />;
    }

    return <ReadingPractice progress={progress} user={user} onProgressChange={handleProgressChange} />;
  }, [currentView, isAuthLoading, isProfileLoading, isProgressLoading, profile, progress, user]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Learning areas">
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
              onClick={() => setCurrentView(item.id)}
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
