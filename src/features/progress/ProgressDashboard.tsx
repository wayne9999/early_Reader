import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { progressTips } from "../../data/content";
import { loadLatestStudentInsight, loadLearningCoachState } from "../../services/aiInsightRepository";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { formatEventTime, nextStudentPractice, summarizeByArea, summarizeEvents } from "../../services/learningEventSummary";
import { clearProgress } from "../../services/progressRepository";
import type { AppUser, LearningCoachState, LearningEvent, Progress, StudentAiInsight } from "../../types";

type ProgressDashboardProps = {
  progress: Progress;
  user: AppUser | null;
  onProgressChange: (progress: Progress) => void;
};

export function ProgressDashboard({ progress, user, onProgressChange }: ProgressDashboardProps) {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [coachInsight, setCoachInsight] = useState<StudentAiInsight | null>(null);
  const [coachState, setCoachState] = useState<LearningCoachState | null>(null);
  const knownWordCount = Object.keys(progress.knownWords).length;
  const memoryTurns = progress.memoryTurns ?? progress.memoryMoves ?? 0;
  const averageTurns = progress.memoryWins > 0 ? Math.round(memoryTurns / progress.memoryWins) : 0;
  const eventSummary = useMemo(() => summarizeEvents(events), [events]);
  const allAreaSummaries = useMemo(() => summarizeByArea(events), [events]);
  const areaSummaries = useMemo(() => allAreaSummaries.filter((area) => area.interactions > 0), [allAreaSummaries]);
  const nextPractice = useMemo(() => nextStudentPractice(events), [events]);
  const coachRecommendation = coachInsight?.nextBestActivity ?? coachState?.currentRecommendation ?? null;
  const dailyGoal = 3;
  const goalCompleted = Math.min(progress.completedToday, dailyGoal);
  const goalPercent = Math.round((goalCompleted / dailyGoal) * 100);
  const displayName = user?.name?.split(" ")[0] ?? "Reader";
  const streakDays = Math.max(1, Math.min(6, progress.completedToday + Math.floor((progress.readingSessions + progress.activityCompletions) / 3)));
  const starsEarned = knownWordCount * 12 + progress.memoryWins * 20 + progress.activityCompletions * 18 + progress.readingSessions * 10;
  const weeklyBars = [2, 3, 1, 4, 3, 5, Math.max(1, progress.completedToday)].map((value, index) => ({
    label: ["M", "T", "W", "T", "F", "S", "S"][index],
    value
  }));
  const stats = [
    { label: "Stars earned", value: starsEarned, note: "Practice points collected.", icon: "☆" },
    {
      label: "Accuracy",
      value: eventSummary.accuracy === null ? "New" : `${eventSummary.accuracy}%`,
      note: "Correct choices in recent activities.",
      icon: "◎"
    },
    { label: "Attempts", value: eventSummary.totalInteractions || knownWordCount + progress.activityCompletions, note: "Live learning interactions.", icon: "↗" },
    { label: "Best streak", value: `${streakDays} days`, note: "Practice rhythm this week.", icon: "♨" },
    { label: "Known words", value: knownWordCount, note: "Sight words marked as known.", icon: "Aa" },
    { label: "Memory boards", value: progress.memoryWins, note: "Full matching boards completed.", icon: "□" },
    {
      label: "Best memory board",
      value: progress.bestMemoryTurns ?? "Not yet",
      note: "Fewest turns used to finish a board.",
      icon: "✓"
    },
    {
      label: "Avg. memory turns",
      value: averageTurns || "Not yet",
      note: "Average turns across completed boards.",
      icon: "↺"
    }
  ];
  const strengthItems = [
    knownWordCount > 0 ? "Sight Words" : "Listening",
    progress.memoryWins > 0 ? "Memory" : "Trying",
    progress.readingSessions > 0 ? "Reading" : "Starting"
  ];

  const personalizedTips = [
    knownWordCount < 5
      ? "Focus on a few familiar sight words before adding more."
      : "Add one harder word and keep reviewing mastered words.",
    progress.readingSessions < 3
      ? "Complete short sentence practice on three different days."
      : "Try asking the child to read one sentence without audio first.",
    progress.memoryWins === 0
      ? "Finish one full memory board to start tracking best and average turns."
      : "Replay the memory board and try to finish with fewer turns.",
    progress.activityCompletions < 3
      ? "Try one logged-in activity that targets sound, meaning, or sentence order."
      : "Keep rotating activities so practice stays fresh.",
    ...progressTips.slice(0, 2)
  ];

  async function resetProgress() {
    const shouldReset = window.confirm("Reset all local progress for this browser?");

    if (shouldReset) {
      onProgressChange(await clearProgress(user));
    }
  }

  useEffect(() => {
    let isMounted = true;

    loadLearningEvents(user).then((loadedEvents) => {
      if (isMounted) {
        setEvents(loadedEvents);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, progress]);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setCoachInsight(null);
      setCoachState(null);
      return () => {
        isMounted = false;
      };
    }

    Promise.all([
      loadLatestStudentInsight(user.id),
      loadLearningCoachState(user.id)
    ]).then(([latestInsight, latestState]) => {
      if (isMounted) {
        setCoachInsight(latestInsight);
        setCoachState(latestState);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, progress]);

  return (
    <>
      <div className="section-heading dashboard-heading">
        <div>
          <p className="eyebrow">My dashboard</p>
          <h2>Hi {displayName}! Ready to read?</h2>
          <p className="helper-text">Every short round helps your reading garden grow.</p>
        </div>
        <span className="streak-pill" aria-label={`${streakDays} day streak`}>♨ {streakDays} day streak</span>
        <button className="secondary-button" type="button" onClick={() => void resetProgress()}>
          Reset progress
        </button>
      </div>

      <section className="student-hero-grid">
        <article className="practice-panel goal-spotlight">
          <div className="goal-ring" style={{ "--goal-progress": `${goalPercent}%` } as CSSProperties}>
            <strong>{goalCompleted}/{dailyGoal}</strong>
            <span>activities</span>
          </div>
          <div>
            <p className="eyebrow">Today's reading goal</p>
            <h3>Keep going, you're doing great!</h3>
            <p className="helper-text">Finish short activities to earn stars and keep your streak warm.</p>
          </div>
        </article>

        <article className="practice-panel next-best-card">
          <p className="eyebrow">Next best for you</p>
          <h3>{coachRecommendation?.title ?? nextPractice}</h3>
          <p>{coachRecommendation?.reason ?? "Start now and grow one skill today."}</p>
          {coachRecommendation?.route ? (
            <a className="secondary-button" href={coachRecommendation.route}>
              Start activity
            </a>
          ) : null}
          {coachState?.activeJobStatus === "queued" || coachState?.activeJobStatus === "running" ? (
            <small className="helper-text">Learning Coach is refreshing your path from your latest practice.</small>
          ) : null}
        </article>
      </section>

      <div className="dashboard-stat-grid">
        {stats.slice(0, 4).map((stat) => (
          <article className="dashboard-stat-card" key={stat.label}>
            <span aria-hidden="true">{stat.icon}</span>
            <div>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <article className="practice-panel skill-garden-panel">
        <p className="eyebrow">Your skill garden</p>
        <h3>Every skill grows when you practice.</h3>
        <div className="skill-garden-grid">
          {allAreaSummaries.map((area, index) => (
            <div className={`skill-sprout sprout-${index % 4}`} key={area.area}>
              <span aria-hidden="true">{area.interactions > 0 ? "♧" : "♢"}</span>
              <strong>{area.label}</strong>
              <small>{area.interactions > 3 ? "Blooming" : area.interactions > 0 ? "Growing" : "Sprouting"}</small>
            </div>
          ))}
        </div>
      </article>

      <section className="student-dashboard-grid">
        <article className="practice-panel strength-panel">
          <p className="eyebrow">Super strengths</p>
          {strengthItems.map((strength) => (
            <div className="strength-row" key={strength}>
              <strong>{strength}</strong>
              <span aria-hidden="true">★</span>
            </div>
          ))}
        </article>

        <article className="practice-panel practice-path-panel">
          <p className="eyebrow">Let's practice</p>
          {(areaSummaries.length ? areaSummaries.slice(0, 3) : allAreaSummaries.slice(0, 3)).map((area) => (
            <div className="practice-path-row" key={area.area}>
              <strong>{area.label}</strong>
              <span aria-hidden="true">›</span>
            </div>
          ))}
        </article>

        <article className="practice-panel weekly-panel">
          <p className="eyebrow">This week</p>
          <h3>Minutes read</h3>
          <div className="weekly-bars" aria-label="Weekly reading activity">
            {weeklyBars.map((bar) => (
              <span key={`${bar.label}-${bar.value}`} style={{ "--bar-height": `${bar.value * 18}px` } as CSSProperties}>
                <i />
                <small>{bar.label}</small>
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="student-dashboard-grid">
        <article className="practice-panel live-activity-panel">
          <p className="eyebrow">Live learning trail</p>
          {events.length ? (
            <ul className="history-list live-history">
              {events.slice(0, 6).map((event) => (
                <li key={event.id ?? `${event.type}-${event.label}-${event.createdAt}`}>
                  <strong>{event.label}</strong>
                  <span>{event.type.replace("_", " ")} - {formatEventTime(event)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">Complete a reading, memory, or activity round to start filling this in.</p>
          )}
        </article>

        <article className="practice-panel">
          <h3>Recommended next steps</h3>
          {coachInsight?.parentSummary ? <p className="helper-text">{coachInsight.parentSummary}</p> : null}
          <ul className="next-steps">
            {(coachInsight?.suggestedHomePractice.length ? coachInsight.suggestedHomePractice : personalizedTips).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          {coachInsight?.aiDisclosure ? <p className="helper-text">{coachInsight.aiDisclosure}</p> : null}
        </article>
      </section>
    </>
  );
}
