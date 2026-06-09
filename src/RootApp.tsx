import { useEffect, useMemo, useState } from "react";
import { SignInPanel } from "./features/auth/SignInPanel";
import { useAuth } from "./features/auth/AuthProvider";
import { MemoryGame } from "./features/memory/MemoryGame";
import { ProgressDashboard } from "./features/progress/ProgressDashboard";
import { ReadingPractice } from "./features/reading/ReadingPractice";
import { SupportPage } from "./features/support/SupportPage";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { billingConfig } from "./services/billingConfig";
import { defaultProgress, loadProgress, saveProgress } from "./services/progressRepository";
import type { AppView, Progress } from "./types";

const navItems: Array<{ id: AppView; label: string }> = [
  { id: "reading", label: "Reading" },
  { id: "memory", label: "Memory" },
  { id: "progress", label: "Progress" },
  { id: "teacher", label: "Teacher" },
  { id: "donate", label: "Donate" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account" }
];

function openDonationLink() {
  if (billingConfig.donationLink) {
    window.open(billingConfig.donationLink, "_blank", "noopener,noreferrer");
  }
}

export function RootApp() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>("reading");
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const goalCompleted = Math.min(progress.completedToday, 3);

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

  const view = useMemo(() => {
    if (isAuthLoading || isProgressLoading) {
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
    };

    if (currentView === "memory") {
      return <MemoryGame progress={progress} onProgressChange={handleProgressChange} />;
    }

    if (currentView === "progress") {
      return <ProgressDashboard progress={progress} user={user} onProgressChange={handleProgressChange} />;
    }

    if (currentView === "teacher") {
      return <TeacherDashboard progress={progress} user={user} />;
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

    return <ReadingPractice progress={progress} onProgressChange={handleProgressChange} />;
  }, [currentView, isAuthLoading, isProgressLoading, progress, user]);

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
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-tab${currentView === item.id ? " is-active" : ""}`}
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
