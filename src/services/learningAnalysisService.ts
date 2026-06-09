import type { Progress, SkillInsight, StudentSummary, TeacherAnalysis } from "../types";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function statusFromScore(score: number): SkillInsight["status"] {
  if (score >= 72) {
    return "strong";
  }

  if (score >= 45) {
    return "watch";
  }

  return "needsSupport";
}

function knownWordCount(progress: Progress) {
  return Object.keys(progress.knownWords).length;
}

function averageMemoryTurns(progress: Progress) {
  return progress.memoryWins > 0 ? progress.memoryTurns / progress.memoryWins : 0;
}

function createInsight(
  area: SkillInsight["area"],
  label: string,
  score: number,
  evidence: string,
  nextStep: string
): SkillInsight {
  const normalizedScore = clampScore(score);

  return {
    area,
    label,
    score: normalizedScore,
    status: statusFromScore(normalizedScore),
    evidence,
    nextStep
  };
}

export function analyzeStudent(student: StudentSummary): TeacherAnalysis {
  const { progress } = student;
  const words = knownWordCount(progress);
  const memoryAverage = averageMemoryTurns(progress);
  const consistencyScore = progress.completedToday >= 3 ? 95 : progress.readingSessions >= 10 ? 72 : 38;
  const memoryScore = progress.memoryWins === 0 ? 25 : clampScore(100 - Math.max(memoryAverage - 8, 0) * 7);
  const insights = [
    createInsight(
      "sightWords",
      "Sight word recognition",
      words * 14,
      `${words} unique sight words have been marked known.`,
      words < 6 ? "Review 3 familiar words, then introduce 1 new word." : "Add a harder word and keep mixed review."
    ),
    createInsight(
      "fluency",
      "Reading fluency",
      progress.readingSessions * 7,
      `${progress.readingSessions} sentence reading sessions completed.`,
      progress.readingSessions < 8
        ? "Use one short sentence twice: first with audio, then without audio."
        : "Ask the learner to read one familiar sentence before listening."
    ),
    createInsight(
      "workingMemory",
      "Working memory",
      memoryScore,
      progress.memoryWins
        ? `${progress.memoryWins} boards completed, best board ${progress.bestMemoryTurns ?? "not set"} turns.`
        : "No completed memory board yet.",
      progress.memoryWins
        ? "Replay one board and aim for fewer turns while naming each card."
        : "Complete one small memory board with adult modeling."
    ),
    createInsight(
      "consistency",
      "Practice consistency",
      consistencyScore,
      `${progress.completedToday} of 3 daily activities completed today.`,
      progress.completedToday < 3 ? "Schedule one more 3-minute practice block today." : "Keep the routine and avoid adding extra load."
    )
  ];
  const strengths = insights.filter((insight) => insight.status === "strong");
  const growthAreas = insights.filter((insight) => insight.status !== "strong");
  const primaryNeed = growthAreas[0] ?? insights[0];

  return {
    studentId: student.id,
    summary: `${student.name} is strongest in ${
      strengths[0]?.label.toLowerCase() ?? "early practice routines"
    } and should next focus on ${primaryNeed.label.toLowerCase()}.`,
    strengths,
    growthAreas,
    recommendedPlan: [
      primaryNeed.nextStep,
      "Keep the activity under 5 minutes and stop after a successful response.",
      "Log whether the learner needed audio support, independent reading, or adult prompting."
    ],
    aiReadinessNote:
      "This is rule-based analysis. A production AI service should run on the backend, use consent-aware data, cite evidence, and avoid making diagnostic claims."
  };
}

export function analyzeClassroom(students: StudentSummary[]) {
  const analyses = students.map(analyzeStudent);
  const needsSupport = analyses.flatMap((analysis) => analysis.growthAreas).filter((insight) => insight.status === "needsSupport");
  const topNeed = needsSupport[0]?.label ?? "consistent practice";

  return {
    analyses,
    headline: `${students.length} learners tracked. Most urgent instructional focus: ${topNeed}.`,
    recommendedTeacherActions: [
      "Group learners by the first growth area shown in their analysis.",
      "Use short intervention cycles: model, guided try, independent try.",
      "Review trend changes weekly instead of reacting to one session."
    ]
  };
}
