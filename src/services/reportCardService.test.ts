import { describe, expect, it } from "vitest";
import { analyzeStudent } from "./learningAnalysisService";
import { defaultProgress } from "./progressRepository";
import { buildStudentReportCardHtml } from "./reportCardService";
import type { StudentSummary } from "../types";

function student(overrides: Partial<StudentSummary> = {}): StudentSummary {
  return {
    id: "student-1",
    name: "Ava Reader",
    gradeBand: "1",
    lastActive: "Today",
    progress: {
      ...defaultProgress,
      knownWords: { cat: 2, sun: 1, map: 1 },
      readingSessions: 7,
      memoryWins: 3,
      memoryMoves: 28,
      memoryTurns: 28,
      activityCompletions: 4,
      completedToday: 2
    },
    ...overrides
  };
}

describe("reportCardService", () => {
  it("builds a concise parent report with quarter and annual comparisons", () => {
    const learner = student();
    const html = buildStudentReportCardHtml(learner, analyzeStudent(learner), "Ms. Carter");

    expect(html).toContain("ReadNest Progress Report");
    expect(html).toContain("Quarter And Annual Comparison");
    expect(html).toContain("Annual Goal");
    expect(html).toContain("Current Goals");
    expect(html).toContain("Ms. Carter");
  });

  it("escapes student and teacher text before writing report html", () => {
    const learner = student({ name: "<script>alert('x')</script>" });
    const html = buildStudentReportCardHtml(learner, analyzeStudent(learner), "<b>Teacher</b>");

    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<b>Teacher</b>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;Teacher&lt;/b&gt;");
  });
});
