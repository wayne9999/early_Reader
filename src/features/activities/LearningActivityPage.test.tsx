import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultProgress } from "../../services/progressRepository";
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
  it("coaches wrong choices and records a correct completion once", async () => {
    const user = userEvent.setup();
    const onProgressChange = vi.fn();

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

    await user.click(screen.getByRole("button", { name: "hat" }));

    expect(screen.getByRole("heading", { name: /cat and hat both end/i })).toBeInTheDocument();
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange.mock.calls[0][0]).toMatchObject({
      activityCompletions: 1,
      completedToday: 1
    });

    await user.click(screen.getByRole("button", { name: "hat" }));

    expect(onProgressChange).toHaveBeenCalledTimes(1);
  });
});
