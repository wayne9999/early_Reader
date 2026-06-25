import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { recordLearningEvent } from "../../services/learningEventRepository";
import { defaultProgress } from "../../services/progressRepository";
import { ReadingPractice } from "./ReadingPractice";

vi.mock("../../shared/speech", () => ({
  celebrate: vi.fn(),
  speak: vi.fn(),
  speakSentence: vi.fn(),
  speakSounds: vi.fn(),
  speakWord: vi.fn()
}));

vi.mock("../../services/learningEventRepository", () => ({
  recordLearningEvent: vi.fn()
}));

describe("ReadingPractice", () => {
  it("records word, sound, sentence, skip, and completion interactions", async () => {
    const user = userEvent.setup();
    const onProgressChange = vi.fn();
    const student = { id: "student-1", name: "Reader" };

    render(<ReadingPractice progress={defaultProgress} user={student} onProgressChange={onProgressChange} />);

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "reading_started",
      "cat",
      "sightWords",
      expect.objectContaining({ level: "starter", word: "cat", wordIndex: 1 })
    );

    await user.click(screen.getByRole("button", { name: "Read the word aloud" }));
    await user.click(screen.getByRole("button", { name: "c" }));
    await user.click(screen.getByRole("button", { name: "Hear sounds" }));
    await user.click(screen.getByRole("button", { name: "Listen" }));

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "word_listened",
      "cat",
      "sightWords",
      expect.objectContaining({ word: "cat" })
    );
    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "sound_listened",
      "c",
      "phonics",
      expect.objectContaining({ sound: "c", phonicsWord: "cat" })
    );
    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "sound_listened",
      "cat",
      "phonics",
      expect.objectContaining({ phonicsWord: "cat" })
    );
    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "sentence_listened",
      "The cat can nap.",
      "fluency",
      expect.objectContaining({ word: "cat" })
    );

    await user.click(screen.getByRole("button", { name: "Next word" }));

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "word_skipped",
      "cat",
      "sightWords",
      expect.objectContaining({ action: "next_word" })
    );

    await user.click(screen.getByRole("button", { name: "Complete reading" }));

    expect(onProgressChange).toHaveBeenCalledWith(expect.objectContaining({ readingSessions: 1, completedToday: 1 }));
    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "reading_completed",
      "I see the sun.",
      "fluency",
      expect.objectContaining({ word: "sun", correct: true })
    );
  });

  it("does not record a skip when a learner knows a word", async () => {
    const user = userEvent.setup();
    const student = { id: "student-1", name: "Reader" };

    vi.mocked(recordLearningEvent).mockClear();
    render(<ReadingPractice progress={defaultProgress} user={student} onProgressChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "I know it" }));

    expect(recordLearningEvent).toHaveBeenCalledWith(
      student,
      "word_known",
      "cat",
      "sightWords",
      expect.objectContaining({ correct: true })
    );
    expect(recordLearningEvent).not.toHaveBeenCalledWith(
      student,
      "word_skipped",
      "cat",
      "sightWords",
      expect.anything()
    );
  });
});
