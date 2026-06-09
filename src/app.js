import { renderMemoryGame } from "./features/memoryGame.js";
import { renderProgressDashboard } from "./features/progressDashboard.js";
import { renderReadingPractice } from "./features/readingPractice.js";
import { loadProgress, saveProgress } from "./services/progressStore.js";

const viewRoot = document.querySelector("#view-root");
const navTabs = document.querySelectorAll("[data-view]");
const goalFill = document.querySelector("[data-goal-fill]");
const goalLabel = document.querySelector("[data-goal-label]");

let currentView = "reading";
let progress = saveProgress(loadProgress());

function updateGoal() {
  const completed = Math.min(progress.completedToday, 3);
  goalFill.style.width = `${(completed / 3) * 100}%`;
  goalLabel.textContent = `${completed} of 3 complete`;
}

function setProgress(nextProgress, options = {}) {
  progress = nextProgress;
  updateGoal();
  if (options.render !== false) {
    renderCurrentView();
  }
}

function renderCurrentView() {
  if (currentView === "memory") {
    renderMemoryGame(viewRoot, progress, setProgress);
    return;
  }

  if (currentView === "progress") {
    renderProgressDashboard(viewRoot, progress, setProgress);
    return;
  }

  renderReadingPractice(viewRoot, progress, setProgress);
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentView = tab.dataset.view;
    navTabs.forEach((item) => {
      item.classList.toggle("is-active", item === tab);
    });
    renderCurrentView();
  });
});

updateGoal();
renderCurrentView();
