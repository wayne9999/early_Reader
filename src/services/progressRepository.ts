import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AppUser, Progress } from "../types";
import { getFirebaseRuntime } from "./firebase";

const STORAGE_KEY = "readnest-progress-v2";

export const defaultProgress: Progress = {
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

function normalizeDailyProgress(progress: Progress): Progress {
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

function normalizeStoredProgress(value: Partial<Progress> | null | undefined): Progress {
  return normalizeDailyProgress({
    ...defaultProgress,
    ...value,
    knownWords: value?.knownWords ?? {},
    memoryTurns: value?.memoryTurns ?? value?.memoryMoves ?? 0,
    bestMemoryTurns: value?.bestMemoryTurns ?? null
  });
}

function localKey(user: AppUser | null) {
  return user ? `${STORAGE_KEY}:${user.id}` : `${STORAGE_KEY}:guest`;
}

function loadLocalProgress(user: AppUser | null) {
  try {
    const rawProgress = localStorage.getItem(localKey(user));
    return normalizeStoredProgress(rawProgress ? (JSON.parse(rawProgress) as Partial<Progress>) : null);
  } catch {
    return normalizeStoredProgress(null);
  }
}

function saveLocalProgress(progress: Progress, user: AppUser | null) {
  const nextProgress = normalizeDailyProgress(progress);
  localStorage.setItem(localKey(user), JSON.stringify(nextProgress));
  return nextProgress;
}

export async function loadProgress(user: AppUser | null): Promise<Progress> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !user || !firebaseUser) {
    return loadLocalProgress(user);
  }

  const progressRef = doc(runtime.db, "users", firebaseUser.uid, "learning", "progress");
  const snapshot = await getDoc(progressRef);
  const progress = normalizeStoredProgress(snapshot.exists() ? (snapshot.data() as Partial<Progress>) : null);

  if (!snapshot.exists()) {
    await saveProgress(progress, user);
  }

  return progress;
}

export async function saveProgress(progress: Progress, user: AppUser | null): Promise<Progress> {
  const nextProgress = normalizeDailyProgress(progress);
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !user || !firebaseUser) {
    return saveLocalProgress(nextProgress, user);
  }

  const userRef = doc(runtime.db, "users", firebaseUser.uid);
  const progressRef = doc(runtime.db, "users", firebaseUser.uid, "learning", "progress");

  await setDoc(
    userRef,
    {
      displayName: user.name,
      email: user.email ?? null,
      picture: user.picture ?? null,
      provider: user.provider ?? null,
      auth0Subject: user.id,
      firebaseUid: firebaseUser.uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await setDoc(
    progressRef,
    {
      ...nextProgress,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return nextProgress;
}

export async function clearProgress(user: AppUser | null): Promise<Progress> {
  return saveProgress(normalizeStoredProgress(null), user);
}

export function recordKnownWord(progress: Progress, word: string): Progress {
  return {
    ...progress,
    knownWords: {
      ...progress.knownWords,
      [word]: (progress.knownWords[word] || 0) + 1
    }
  };
}

export function recordReadingSession(progress: Progress): Progress {
  return {
    ...progress,
    readingSessions: progress.readingSessions + 1,
    completedToday: Math.min(progress.completedToday + 1, 3)
  };
}

export function recordMemoryWin(progress: Progress, turns: number): Progress {
  const previousBest = progress.bestMemoryTurns;

  return {
    ...progress,
    memoryWins: progress.memoryWins + 1,
    memoryMoves: progress.memoryMoves + turns,
    memoryTurns: progress.memoryTurns + turns,
    bestMemoryTurns: previousBest === null || turns < previousBest ? turns : previousBest,
    completedToday: Math.min(progress.completedToday + 1, 3)
  };
}
