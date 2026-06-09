import { progressTips } from "../../data/content";
import { clearProgress } from "../../services/progressRepository";
import type { AppUser, Progress } from "../../types";

type ProgressDashboardProps = {
  progress: Progress;
  user: AppUser | null;
  onProgressChange: (progress: Progress) => void;
};

export function ProgressDashboard({ progress, user, onProgressChange }: ProgressDashboardProps) {
  const knownWordCount = Object.keys(progress.knownWords).length;
  const memoryTurns = progress.memoryTurns ?? progress.memoryMoves ?? 0;
  const averageTurns = progress.memoryWins > 0 ? Math.round(memoryTurns / progress.memoryWins) : 0;
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
    ...progressTips.slice(0, 2)
  ];

  async function resetProgress() {
    const shouldReset = window.confirm("Reset all local progress for this browser?");

    if (shouldReset) {
      onProgressChange(await clearProgress(user));
    }
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Caregiver view</p>
          <h2>Progress that is simple to understand</h2>
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
