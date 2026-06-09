import type { AppUser, Progress, StudentSummary } from "../types";
import { defaultProgress } from "./progressRepository";

const demoStudents: StudentSummary[] = [
  {
    id: "demo-ava",
    name: "Ava",
    gradeBand: "K",
    lastActive: "Today",
    progress: {
      ...defaultProgress,
      knownWords: { cat: 3, sun: 2, map: 1 },
      readingSessions: 8,
      memoryWins: 4,
      memoryMoves: 48,
      memoryTurns: 48,
      bestMemoryTurns: 9,
      completedToday: 2,
      lastPracticeDate: new Date().toISOString().slice(0, 10)
    }
  },
  {
    id: "demo-miles",
    name: "Miles",
    gradeBand: "1",
    lastActive: "Yesterday",
    progress: {
      ...defaultProgress,
      knownWords: { cat: 4, sun: 4, map: 3, run: 3, ship: 1 },
      readingSessions: 14,
      memoryWins: 6,
      memoryMoves: 62,
      memoryTurns: 62,
      bestMemoryTurns: 8,
      completedToday: 0,
      lastPracticeDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    }
  },
  {
    id: "demo-zara",
    name: "Zara",
    gradeBand: "2",
    lastActive: "3 days ago",
    progress: {
      ...defaultProgress,
      knownWords: { because: 1, before: 1, together: 2 },
      readingSessions: 5,
      memoryWins: 1,
      memoryMoves: 17,
      memoryTurns: 17,
      bestMemoryTurns: 17,
      completedToday: 0,
      lastPracticeDate: new Date(Date.now() - 259200000).toISOString().slice(0, 10)
    }
  }
];

export function getClassroomStudents(currentProgress: Progress, user: AppUser | null): StudentSummary[] {
  const currentStudent: StudentSummary = {
    id: user?.id ?? "current-reader",
    name: user?.name ?? "Current reader",
    gradeBand: "1",
    lastActive: "Now",
    progress: currentProgress
  };

  return [currentStudent, ...demoStudents];
}
