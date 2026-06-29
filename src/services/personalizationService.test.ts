import { describe, expect, it } from "vitest";
import { learningActivities } from "../data/content";
import { defaultProgress } from "./progressRepository";
import { buildStudentPersonalizedPlan, personalizeActivityRounds } from "./personalizationService";
import type { LearningEvent, UserProfile } from "../types";

const studentProfile: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Jayden Reader",
  email: "jayden@example.com",
  picture: null,
  gradeLevel: "1",
  readingGoal: "phonics"
};

const events: LearningEvent[] = [
  {
    userId: "student-1",
    type: "activity_answer",
    label: "Rhyme Rocket: sun",
    area: "phonics",
    metadata: {
      target: "sun",
      selectedChoice: "map",
      correctChoice: "run",
      correct: false
    },
    createdAt: "2026-06-28T01:00:00.000Z"
  },
  {
    userId: "student-1",
    type: "activity_answer",
    label: "Sound Sort: map",
    area: "phonics",
    metadata: {
      target: "m",
      selectedChoice: "map",
      correctChoice: "map",
      correct: true
    },
    createdAt: "2026-06-28T01:01:00.000Z"
  }
];

describe("personalizationService", () => {
  it("builds a student plan from profile goals and recent missed items", () => {
    const plan = buildStudentPersonalizedPlan({
      profile: studentProfile,
      progress: defaultProgress,
      events
    });

    expect(plan.learnerName).toBe("Jayden");
    expect(plan.gradeLabel).toBe("Grade 1");
    expect(plan.goalLabel).toBe("Sounding out words");
    expect(plan.focusAreas[0]).toBe("phonics");
    expect(plan.missedItems).toContain("sun");
    expect(plan.recommendations[0]).toMatchObject({
      view: "soundSort",
      skillArea: "phonics",
      priority: "start"
    });
  });

  it("moves recently missed rounds earlier without removing practice rounds", () => {
    const rhymeActivity = learningActivities.find((activity) => activity.id === "rhymes");

    expect(rhymeActivity).toBeDefined();

    const personalized = personalizeActivityRounds({
      activity: rhymeActivity!,
      profile: studentProfile,
      events,
      focusAreas: ["phonics"]
    });

    expect(personalized.rounds).toHaveLength(rhymeActivity!.rounds.length);
    expect(personalized.rounds[0].prompt).toContain("sun");
    expect(personalized.reason).toContain("sun");
  });
});
