import { describe, expect, it } from "vitest";
import { nextStudentPractice, recentNeeds, summarizeByArea, summarizeEvents } from "./learningEventSummary";
import type { LearningEvent } from "../types";

const events: LearningEvent[] = [
  {
    userId: "student-1",
    type: "activity_answer",
    label: "Rhyming: sun",
    area: "phonics",
    metadata: { correct: false, selectedChoice: "map", correctChoice: "fun" },
    createdAt: "2026-06-21T01:00:00.000Z"
  },
  {
    userId: "student-1",
    type: "activity_answer",
    label: "Rhyming: sun",
    area: "phonics",
    metadata: { correct: true, selectedChoice: "fun", correctChoice: "fun" },
    createdAt: "2026-06-21T01:01:00.000Z"
  },
  {
    userId: "student-1",
    type: "reading_completed",
    label: "The sun is up.",
    area: "fluency",
    createdAt: "2026-06-21T01:02:00.000Z"
  }
];

describe("learningEventSummary", () => {
  it("summarizes attempts and recent needs from learning events", () => {
    expect(summarizeEvents(events)).toMatchObject({
      totalInteractions: 3,
      answeredAttempts: 2,
      correctAnswers: 1,
      incorrectAnswers: 1,
      completedActivities: 1,
      areasPracticed: 2,
      accuracy: 50
    });

    expect(summarizeByArea(events).find((area) => area.area === "phonics")).toMatchObject({
      interactions: 2,
      correct: 1,
      incorrect: 1,
      accuracy: 50
    });

    expect(recentNeeds(events)[0]).toMatchObject({
      label: "Rhyming: sun",
      selectedChoice: "map",
      correctChoice: "fun"
    });
    expect(nextStudentPractice(events)).toMatch(/sounds and phonics/i);
  });
});
