import { useEffect, useMemo, useState } from "react";
import { progressTips } from "../../data/content";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { formatEventTime, nextStudentPractice, summarizeByArea, summarizeEvents } from "../../services/learningEventSummary";
import { clearProgress } from "../../services/progressRepository";
import type { AppUser, LearningEvent, Progress } from "../../types";

type ProgressDashboardProps = {
  progress: Progress;
  user: AppUser | null;
  onProgressChange: (progress: Progress) => void;
};

export function ProgressDashboard({ progress, user, onProgressChange }: ProgressDashboardProps) {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const knownWordCount = Object.keys(progress.knownWords).length;
  const memoryTurns = progress.memoryTurns ?? progress.memoryMoves ?? 0;
  const averageTurns = progress.memoryWins > 0 ? Math.round(memoryTurns / progress.memoryWins) : 0;
  const eventSummary = useMemo(() => summarizeEvents(events), [events]);
  const areaSummaries = useMemo(() => summarizeByArea(events).filter((area) => area.interactions > 0), [events]);
  const nextPractice = useMemo(() => nextStudentPractice(events), [events]);
  const stats = [
    { label: "Known words", value: knownWordCount, note: "Sight words marked as known." },
    { label: "Reading sessions", value: progress.readingSessions, note: "Sentence practices completed." },
    { label: "Memory boards", value: progress.memoryWins, note: "Full matching boards completed." },
    {
      label: "Best memory board",
      value: progress.bestMemoryTurns ?? "Not yet",
      note: "Fewest turns used to finish a board."
    },
    {
      label: "Avg. memory turns",
      value: averageTurns || "Not yet",
      note: "Average turns across completed boards."
    },
    {
      label: "Skill activities",
      value: progress.activityCompletions,
      note: "Logged-in learning games completed."
    },
    {
      label: "Interactions",
      value: eventSummary.totalInteractions,
      note: "Recent learning actions saved for this account."
    },
    {
      label: "Answer accuracy",
      value: eventSummary.accuracy === null ? "Not yet" : `${eventSummary.accuracy}%`,
      note: "Correct choices from logged activity attempts."
    }
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

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h2>Your reading progress</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => void resetProgress()}>
          Reset progress
        </button>
      </div>
      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <p>{stat.note}</p>
          </article>
        ))}
      </div>
      <article className="practice-panel">
        <p className="eyebrow">Next best practice</p>
        <h3>{nextPractice}</h3>
        <p className="helper-text">
          This uses your recent reading, memory, and activity attempts. Teachers see more detail only when you are assigned to them.
        </p>
      </article>

      <section className="student-dashboard-grid">
        <article className="practice-panel">
          <p className="eyebrow">Activities practiced</p>
          {areaSummaries.length ? (
            <div className="area-summary-list">
              {areaSummaries.map((area) => (
                <div className="area-summary-row" key={area.area}>
                  <span>
                    <strong>{area.label}</strong>
                    <small>{area.interactions} interactions</small>
                  </span>
                  <em>{area.accuracy === null ? "Listening" : `${area.accuracy}%`}</em>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper-text">Complete a reading, memory, or activity round to start filling this in.</p>
          )}
        </article>

        <article className="practice-panel">
          <p className="eyebrow">Recent activity</p>
          {events.length ? (
            <ul className="history-list">
              {events.slice(0, 6).map((event) => (
                <li key={event.id ?? `${event.type}-${event.label}-${event.createdAt}`}>
                  <strong>{event.label}</strong>
                  <span>{event.type.replace("_", " ")} - {formatEventTime(event)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No recent activity has been saved yet.</p>
          )}
        </article>
      </section>

      <article className="practice-panel">
        <h3>Recommended next steps</h3>
        <ul className="next-steps">
          {personalizedTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </article>
    </>
  );
}
