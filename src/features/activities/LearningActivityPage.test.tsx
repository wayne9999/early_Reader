import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultProgress } from "../../services/progressRepository";
import { recordLearningEvent } from "../../services/learningEventRepository";
import { LearningActivityPage } from "./LearningActivityPage";

vi.mock("../../shared/speech", () => ({
  celebrate: vi.fn(),
  speak: vi.fn(),
  speakSentence: vi.fn()
}));

vi.mock("../../services/learningEventRepository", () => ({
  recordLearningEvent: vi.fn()
}));

describe("LearningActivityPage", () => {
  it("coaches wrong choices and records one completion after ten rounds", async () => {
    const user = userEvent.setup();
    const onProgressChange = vi.fn();
    const correctChoices = ["hat", "run", "top", "red", "make", "rug", "night", "dish", "wall", "bee"];

    render(
      <LearningActivityPage
        activityId="rhymes"
        progress={defaultProgress}
        user={{ id: "student-1", name: "Reader" }}
        onProgressChange={onProgressChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "sun" }));

    expect(screen.getByRole("heading", { name: /listen to the ending sound/i })).toBeInTheDocument();
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(recordLearningEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "student-1" }),
      "activity_answer",
      "Rhyme Rocket: cat",
      "phonics",
      expect.objectContaining({
        activityId: "rhymes",
        correct: false,
        selectedChoice: "sun",
        correctChoice: "hat"
      })
    );

    await user.click(screen.getByRole("button", { name: "Hear prompt" }));

    expect(recordLearningEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "student-1" }),
      "activity_prompt_listened",
      "Rhyme Rocket: cat",
      "phonics",
      expect.objectContaining({
        activityId: "rhymes",
        round: 1,
        target: "cat"
      })
    );

    for (let index = 0; index < correctChoices.length; index += 1) {
      await user.click(screen.getByRole("button", { name: correctChoices[index] }));

      if (index < correctChoices.length - 1) {
        expect(onProgressChange).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "Next round" }));
      }
    }

    expect(screen.getByRole("heading", { name: /tree and bee rhyme/i })).toBeInTheDocument();
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange.mock.calls[0][0]).toMatchObject({
      activityCompletions: 1,
      completedToday: 1
    });
    expect(recordLearningEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "student-1" }),
      "activity_completed",
      "Rhyme Rocket",
      "phonics",
      expect.objectContaining({
        activityId: "rhymes",
        rounds: 10,
        correctAnswers: 10
      })
    );

    await user.click(screen.getByRole("button", { name: "bee" }));

    expect(onProgressChange).toHaveBeenCalledTimes(1);
  });
});
