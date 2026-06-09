const STORAGE_KEY = "readnest-progress-v1";

const defaultProgress = {
  knownWords: {},
  readingSessions: 0,
  memoryWins: 0,
  memoryMoves: 0,
  memoryTurns: 0,
  bestMemoryTurns: null,
  completedToday: 0,
  lastPracticeDate: ""
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyProgress(progress) {
  const today = todayKey();
  if (progress.lastPracticeDate === today) {
    return progress;
  }

  return {
    ...progress,
    completedToday: 0,
    lastPracticeDate: today
  };
}

export function loadProgress() {
  try {
    const rawProgress = localStorage.getItem(STORAGE_KEY);
    const parsed = rawProgress ? JSON.parse(rawProgress) : {};
    const migratedProgress = {
      ...defaultProgress,
      ...parsed,
      memoryTurns: parsed.memoryTurns ?? parsed.memoryMoves ?? 0
    };
    return normalizeDailyProgress(migratedProgress);
  } catch {
    return normalizeDailyProgress(defaultProgress);
  }
}

export function saveProgress(progress) {
  const nextProgress = normalizeDailyProgress({ ...defaultProgress, ...progress });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
  return nextProgress;
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return normalizeDailyProgress(defaultProgress);
}

export function recordKnownWord(progress, word) {
  return saveProgress({
    ...progress,
    knownWords: {
      ...progress.knownWords,
      [word]: (progress.knownWords[word] || 0) + 1
    }
  });
}

export function recordReadingSession(progress) {
  return saveProgress({
    ...progress,
    readingSessions: progress.readingSessions + 1,
    completedToday: Math.min(progress.completedToday + 1, 3)
  });
}

export function recordMemoryWin(progress, turns) {
  const previousBest = progress.bestMemoryTurns;
  const bestMemoryTurns =
    previousBest === null || turns < previousBest ? turns : previousBest;

  return saveProgress({
    ...progress,
    memoryWins: progress.memoryWins + 1,
    memoryMoves: progress.memoryMoves + turns,
    memoryTurns: progress.memoryTurns + turns,
    bestMemoryTurns,
    completedToday: Math.min(progress.completedToday + 1, 3)
  });
}
