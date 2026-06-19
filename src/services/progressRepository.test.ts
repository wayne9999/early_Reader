import { describe, expect, it } from "vitest";
import {
  defaultProgress,
  recordActivityCompletion,
  recordKnownWord,
  recordMemoryWin,
  recordReadingSession
} from "./progressRepository";

describe("progressRepository helpers", () => {
  it("tracks repeated known words without losing existing words", () => {
    const first = recordKnownWord(defaultProgress, "sun");
    const second = recordKnownWord(first, "sun");
    const third = recordKnownWord(second, "map");

    expect(third.knownWords).toEqual({
      sun: 2,
      map: 1
    });
  });

  it("caps completedToday at the daily goal", () => {
    const progress = {
      ...defaultProgress,
      completedToday: 3
    };

    expect(recordReadingSession(progress).completedToday).toBe(3);
  });

  it("records memory wins, total turns, and the best board", () => {
    const firstWin = recordMemoryWin(defaultProgress, 12);
    const secondWin = recordMemoryWin(firstWin, 8);

    expect(secondWin.memoryWins).toBe(2);
    expect(secondWin.memoryTurns).toBe(20);
    expect(secondWin.memoryMoves).toBe(20);
    expect(secondWin.bestMemoryTurns).toBe(8);
  });

  it("records logged-in activity completions toward the daily goal", () => {
    const progress = recordActivityCompletion(defaultProgress);

    expect(progress.activityCompletions).toBe(1);
    expect(progress.completedToday).toBe(1);
  });
});
