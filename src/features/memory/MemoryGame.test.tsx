import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordLearningEvent } from "../../services/learningEventRepository";
import { defaultProgress } from "../../services/progressRepository";
import { MemoryGame } from "./MemoryGame";

vi.mock("../../shared/speech", () => ({
  celebrate: vi.fn(),
  speak: vi.fn()
}));

vi.mock("../../services/learningEventRepository", () => ({
  recordLearningEvent: vi.fn()
}));

describe("MemoryGame", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("700px"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  it("records board starts, resets, and card reveals", async () => {
    const user = userEvent.setup();
    const student = { id: "student-1", name: "Reader" };

    render(<MemoryGame progress={defaultProgress} user={student} onProgressChange={vi.fn()} />);

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "memory_started",
      "Memory board started",
      "workingMemory",
        expect.objectContaining({ pairs: 5, cards: 10, availablePairs: 10, contentTier: "registered" })
    );

    await user.click(screen.getAllByRole("button", { name: "Hidden memory card" })[0]);

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "memory_card_revealed",
      expect.any(String),
      "workingMemory",
      expect.objectContaining({ pickInTurn: 1, matchedPairs: 0 })
    );

    await user.click(screen.getByRole("button", { name: "New game" }));

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "memory_started",
      "New memory board",
      "workingMemory",
      expect.objectContaining({ action: "new_game" })
    );
  });

  it("keeps mobile boards compact and leaves mismatches visible long enough to review", async () => {
    render(<MemoryGame progress={defaultProgress} user={null} onProgressChange={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: "Hidden memory card" })).toHaveLength(8);

    act(() => fireEvent.click(screen.getAllByRole("button", { name: "Hidden memory card" })[0]));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Hidden memory card" })).toHaveLength(7));
    const firstVisibleCard = Array.from(document.querySelectorAll<HTMLButtonElement>(".memory-card"))
      .find((button) => button.getAttribute("aria-label") !== "Hidden memory card");
    const firstLabel = firstVisibleCard?.getAttribute("aria-label");
    expect(firstLabel).toBeTruthy();
    const secondCard = screen
      .getAllByRole("button", { name: "Hidden memory card" })
      .find((button) => !button.textContent?.includes(firstLabel ?? ""));
    expect(secondCard).toBeDefined();

    act(() => fireEvent.click(secondCard!));

    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    expect(screen.getAllByRole("button", { name: "Hidden memory card" }).length).toBeLessThan(8);

    await new Promise((resolve) => window.setTimeout(resolve, 500));

    expect(screen.getAllByRole("button", { name: "Hidden memory card" })).toHaveLength(8);
  }, 7000);
});
