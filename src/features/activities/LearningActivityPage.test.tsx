import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProgress } from "../../services/progressRepository";
import { loadLearningEvents, recordLearningEvent } from "../../services/learningEventRepository";
import { learningActivities } from "../../data/content";
import { filterContentForTier } from "../../services/contentAccess";
import { LearningActivityPage } from "./LearningActivityPage";

vi.mock("../../shared/speech", () => ({
  celebrate: vi.fn(),
  speak: vi.fn(),
  speakSentence: vi.fn()
}));

vi.mock("../../services/learningEventRepository", () => ({
  loadLearningEvents: vi.fn(),
  recordLearningEvent: vi.fn()
}));

describe("LearningActivityPage", () => {
  beforeEach(() => {
    vi.mocked(loadLearningEvents).mockResolvedValue([]);
    vi.mocked(recordLearningEvent).mockReset();
  });

  it("coaches wrong choices and records one completion after the registered rounds", async () => {
    const user = userEvent.setup();
    const onProgressChange = vi.fn();
    const correctChoices = ["hat", "run", "top", "red", "make", "rug", "night", "dish", "wall", "bee", "win"];

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

    expect(screen.getByRole("heading", { name: /rhymes badge earned/i })).toBeInTheDocument();
    expect(screen.getByText(/play again to beat your score/i)).toBeInTheDocument();
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
        rounds: 11,
        correctAnswers: 11,
        contentTier: "registered"
      })
    );

    await user.click(screen.getByRole("button", { name: "win" }));

    expect(onProgressChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Play again" }));

    expect(screen.getByText("Round 1 of 11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "hat" })).toBeEnabled();
  });

  it.each(learningActivities.map((activity) => [activity.id, activity.rounds.length]))(
    "%s provides a complete registered practice path",
    (activityId, roundCount) => {
      const visibleRoundCount = filterContentForTier(
        learningActivities.find((activity) => activity.id === activityId)?.rounds ?? [],
        "registered"
      ).length;

      render(
        <LearningActivityPage
          activityId={activityId}
          progress={defaultProgress}
          user={{ id: "student-1", name: "Reader" }}
          onProgressChange={vi.fn()}
        />
      );

      expect(roundCount).toBeGreaterThanOrEqual(10);
      expect(visibleRoundCount).toBeGreaterThanOrEqual(10);
      expect(screen.getByText(`Round 1 of ${visibleRoundCount}`)).toBeInTheDocument();
    }
  );
});
