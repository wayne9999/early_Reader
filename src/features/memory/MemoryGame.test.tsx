import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
  it("records board starts, resets, and card reveals", async () => {
    const user = userEvent.setup();
    const student = { id: "student-1", name: "Reader" };

    render(<MemoryGame progress={defaultProgress} user={student} onProgressChange={vi.fn()} />);

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "memory_started",
      "Memory board started",
      "workingMemory",
      expect.objectContaining({ pairs: 6, cards: 12 })
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
});
