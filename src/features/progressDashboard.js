import { progressTips } from "../data/content.js";
import { clearProgress } from "../services/progressStore.js";

export function renderProgressDashboard(root, progress, onProgressChange) {
  const template = document.querySelector("#progress-template");
  root.replaceChildren(template.content.cloneNode(true));

  const statsGrid = root.querySelector("[data-stats-grid]");
  const nextSteps = root.querySelector("[data-next-steps]");
  const knownWordCount = Object.keys(progress.knownWords).length;
  const memoryTurns = progress.memoryTurns ?? progress.memoryMoves ?? 0;
  const averageTurns =
    progress.memoryWins > 0 ? Math.round(memoryTurns / progress.memoryWins) : 0;

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

  statsGrid.replaceChildren(
    ...stats.map((stat) => {
      const item = document.createElement("article");
      item.className = "stat-card";
      item.innerHTML = `
        <strong>${stat.value}</strong>
        <span>${stat.label}</span>
        <p>${stat.note}</p>
      `;
      return item;
    })
  );

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

  nextSteps.replaceChildren(
    ...personalizedTips.map((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      return item;
    })
  );

  root.querySelector("[data-reset-progress]").addEventListener("click", () => {
    const shouldReset = window.confirm("Reset all local progress for this browser?");
    if (shouldReset) {
      onProgressChange(clearProgress());
    }
  });
}
