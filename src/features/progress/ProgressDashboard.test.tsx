import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadLatestStudentInsight, loadLearningCoachState } from "../../services/aiInsightRepository";
import { loadLearningEvents } from "../../services/learningEventRepository";
import { defaultProgress } from "../../services/progressRepository";
import { ProgressDashboard } from "./ProgressDashboard";

vi.mock("../../services/aiInsightRepository", () => ({
  loadLatestStudentInsight: vi.fn(),
  loadLearningCoachState: vi.fn()
}));

vi.mock("../../services/learningEventRepository", () => ({
  loadLearningEvents: vi.fn()
}));

vi.mock("../../services/progressRepository", async () => {
  const actual = await vi.importActual<typeof import("../../services/progressRepository")>("../../services/progressRepository");

  return {
    ...actual,
    clearProgress: vi.fn()
  };
});

describe("ProgressDashboard", () => {
  beforeEach(() => {
    vi.mocked(loadLearningEvents).mockResolvedValue([]);
    vi.mocked(loadLearningCoachState).mockResolvedValue(null);
    vi.mocked(loadLatestStudentInsight).mockResolvedValue(null);
  });

  it("uses the saved Learning Coach recommendation and parent summary when available", async () => {
    vi.mocked(loadLatestStudentInsight).mockResolvedValue({
      studentId: "student-1",
      status: "ready",
      summary: "Focus on sounds.",
      parentSummary: "Practice short vowel sounds for five minutes.",
      nextBestActivity: {
        title: "Practice sounds and phonics",
        route: "#/sound-sort",
        reason: "Short vowel sounds need one more confident try.",
        skillArea: "phonics"
      },
      strengths: [],
      needsPractice: [],
      recommendedTeacherActions: [],
      suggestedHomePractice: ["Say the sound, tap the word, then read it."],
      evidence: {
        sourceEventCount: 12,
        topMissedItems: ["sun"],
        topMasteredItems: []
      },
      aiDisclosure: "Instructional support only.",
      model: "rule-based-v1",
      promptVersion: "readnest-ai-v2"
    });

    render(
      <ProgressDashboard
        progress={defaultProgress}
        user={{ id: "student-1", name: "Jayden" }}
        onProgressChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Practice sounds and phonics" })).toBeInTheDocument();
    });

    expect(screen.getByText("Short vowel sounds need one more confident try.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start activity" })).toHaveAttribute("href", "#/sound-sort");
    expect(screen.getByText("Practice short vowel sounds for five minutes.")).toBeInTheDocument();
    expect(screen.getByText("Say the sound, tap the word, then read it.")).toBeInTheDocument();
  });
});
