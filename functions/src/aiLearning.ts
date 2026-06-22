import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

type SkillArea = "phonics" | "sightWords" | "fluency" | "workingMemory" | "consistency";

type LearningEvent = {
  id: string;
  type?: string;
  label?: string;
  area?: SkillArea;
  metadata?: Record<string, unknown>;
  createdAt?: unknown;
};

type SkillSummary = {
  area: SkillArea;
  interactions: number;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  missedItems: string[];
  masteredItems: string[];
};

export type StudentLearningSummary = {
  studentId: string;
  sourceEventCount: number;
  generatedAt: FieldValue;
  eventWindow: {
    limit: number;
    newestEventAt: unknown;
    oldestEventAt: unknown;
  };
  skills: SkillSummary[];
  topMissedItems: string[];
  topMasteredItems: string[];
  recentLabels: string[];
};

export type StudentAiInsight = {
  studentId: string;
  status: "ready";
  summary: string;
  strengths: Array<{ area: SkillArea; label: string; evidence: string }>;
  needsPractice: Array<{ area: SkillArea; label: string; evidence: string; nextStep: string }>;
  recommendedTeacherActions: string[];
  suggestedHomePractice: string[];
  evidence: {
    sourceEventCount: number;
    topMissedItems: string[];
    topMasteredItems: string[];
  };
  aiDisclosure: string;
  model: "rule-based-v1";
  promptVersion: "readnest-ai-v1";
  sourceDataWindow: StudentLearningSummary["eventWindow"];
  createdAt: FieldValue;
  updatedAt: FieldValue;
  createdBy: "ai-worker";
  updatedBy: "ai-worker";
};

const SKILL_LABELS: Record<SkillArea, string> = {
  phonics: "Phonics patterns",
  sightWords: "Sight word recognition",
  fluency: "Sentence fluency",
  workingMemory: "Working memory",
  consistency: "Practice consistency"
};

const SKILL_AREAS: SkillArea[] = ["phonics", "sightWords", "fluency", "workingMemory", "consistency"];

function isSkillArea(value: unknown): value is SkillArea {
  return typeof value === "string" && SKILL_AREAS.includes(value as SkillArea);
}

function labelFromEvent(event: LearningEvent) {
  const target = event.metadata?.target;
  const word = event.metadata?.word;
  const selectedChoice = event.metadata?.selectedChoice;

  if (typeof target === "string" && target.trim()) {
    return target;
  }

  if (typeof word === "string" && word.trim()) {
    return word;
  }

  if (typeof selectedChoice === "string" && selectedChoice.trim()) {
    return selectedChoice;
  }

  return event.label?.trim() || "Practice item";
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topItems(values: string[], maxItems = 5) {
  return Object.entries(countBy(values))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxItems)
    .map(([item]) => item);
}

export function summarizeLearningEvents(studentId: string, events: LearningEvent[]): StudentLearningSummary {
  const byArea = new Map<SkillArea, LearningEvent[]>();

  for (const area of SKILL_AREAS) {
    byArea.set(area, []);
  }

  for (const event of events) {
    if (isSkillArea(event.area)) {
      byArea.get(event.area)?.push(event);
    }
  }

  const skills = SKILL_AREAS.map((area) => {
    const areaEvents = byArea.get(area) ?? [];
    const attempts = areaEvents.filter((event) => typeof event.metadata?.correct === "boolean");
    const correct = attempts.filter((event) => event.metadata?.correct === true);
    const incorrect = attempts.filter((event) => event.metadata?.correct === false);

    return {
      area,
      interactions: areaEvents.length,
      attempts: attempts.length,
      correct: correct.length,
      incorrect: incorrect.length,
      accuracy: attempts.length ? Math.round((correct.length / attempts.length) * 100) : null,
      missedItems: topItems(incorrect.map(labelFromEvent), 4),
      masteredItems: topItems(correct.map(labelFromEvent), 4)
    };
  });

  return {
    studentId,
    sourceEventCount: events.length,
    generatedAt: FieldValue.serverTimestamp(),
    eventWindow: {
      limit: events.length,
      newestEventAt: events[0]?.createdAt ?? null,
      oldestEventAt: events[events.length - 1]?.createdAt ?? null
    },
    skills,
    topMissedItems: topItems(skills.flatMap((skill) => skill.missedItems), 6),
    topMasteredItems: topItems(skills.flatMap((skill) => skill.masteredItems), 6),
    recentLabels: events.slice(0, 8).map(labelFromEvent)
  };
}

function statusFromSkill(skill: SkillSummary) {
  if (skill.attempts === 0 && skill.interactions < 3) {
    return "needsEvidence";
  }

  if (skill.accuracy !== null && skill.accuracy >= 75) {
    return "strong";
  }

  if (skill.accuracy !== null && skill.accuracy < 55) {
    return "needsPractice";
  }

  if (skill.interactions >= 6) {
    return "developing";
  }

  return "needsEvidence";
}

export function buildRuleBasedInsight(summary: StudentLearningSummary): StudentAiInsight {
  const rankedSkills = [...summary.skills].sort((a, b) => {
    const aScore = a.accuracy ?? (a.interactions ? 50 : 0);
    const bScore = b.accuracy ?? (b.interactions ? 50 : 0);
    return bScore - aScore;
  });
  const strongest = rankedSkills.filter((skill) => statusFromSkill(skill) === "strong").slice(0, 2);
  const needsPractice = [...summary.skills]
    .filter((skill) => statusFromSkill(skill) !== "strong")
    .sort((a, b) => {
      const aScore = a.accuracy ?? (a.interactions ? 45 : 0);
      const bScore = b.accuracy ?? (b.interactions ? 45 : 0);
      return aScore - bScore;
    })
    .slice(0, 3);
  const primaryNeed = needsPractice[0] ?? rankedSkills[rankedSkills.length - 1];
  const missedPhrase = summary.topMissedItems.length ? summary.topMissedItems.join(", ") : "new practice items";

  return {
    studentId: summary.studentId,
    status: "ready",
    summary:
      summary.sourceEventCount === 0
        ? "No recent learning events are available yet. Start with short practice and generate a new insight after the learner completes a few rounds."
        : `Recent practice shows ${summary.sourceEventCount} tracked interactions. Focus next on ${SKILL_LABELS[primaryNeed.area].toLowerCase()} using short, repeated practice.`,
    strengths: strongest.map((skill) => ({
      area: skill.area,
      label: SKILL_LABELS[skill.area],
      evidence: `${skill.correct} correct attempts${skill.masteredItems.length ? `, including ${skill.masteredItems.join(", ")}` : ""}.`
    })),
    needsPractice: needsPractice.map((skill) => ({
      area: skill.area,
      label: SKILL_LABELS[skill.area],
      evidence:
        skill.attempts > 0
          ? `${skill.incorrect} review moments across ${skill.attempts} scored attempts${skill.missedItems.length ? `, especially ${skill.missedItems.join(", ")}` : ""}.`
          : `${skill.interactions} interactions logged, but not enough scored attempts yet.`,
      nextStep:
        skill.missedItems.length
          ? `Review ${skill.missedItems.slice(0, 3).join(", ")} with listen, say, then independent try.`
          : `Run one short ${SKILL_LABELS[skill.area].toLowerCase()} activity and capture independent responses.`
    })),
    recommendedTeacherActions: [
      `Start with a 5-minute mini-lesson on ${SKILL_LABELS[primaryNeed.area].toLowerCase()}.`,
      `Use two known items before one challenge item: ${missedPhrase}.`,
      "Check whether the learner can answer without audio support before increasing difficulty."
    ],
    suggestedHomePractice: [
      "Practice for 5 minutes, then stop after a successful response.",
      summary.topMissedItems.length
        ? `Read and repeat these items: ${summary.topMissedItems.slice(0, 3).join(", ")}.`
        : "Read one familiar sentence together, then let the child try it independently."
    ],
    evidence: {
      sourceEventCount: summary.sourceEventCount,
      topMissedItems: summary.topMissedItems,
      topMasteredItems: summary.topMasteredItems
    },
    aiDisclosure: "Instructional support only. This is not a diagnosis or medical evaluation.",
    model: "rule-based-v1",
    promptVersion: "readnest-ai-v1",
    sourceDataWindow: summary.eventWindow,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: "ai-worker",
    updatedBy: "ai-worker"
  };
}

export async function loadRecentLearningEvents(db: Firestore, studentId: string, maxEvents = 200) {
  const snapshot = await db
    .collection(`users/${studentId}/learningEvents`)
    .orderBy("createdAt", "desc")
    .limit(maxEvents)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as LearningEvent[];
}

export async function writeStudentInsight(db: Firestore, studentId: string, summary: StudentLearningSummary, insight: StudentAiInsight) {
  const insightRef = db.collection(`users/${studentId}/aiInsights`).doc();
  const batch = db.batch();

  batch.set(db.doc(`users/${studentId}/learningSummaries/current`), {
    ...summary,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "ai-worker"
  } satisfies DocumentData);
  batch.set(insightRef, insight satisfies DocumentData);

  await batch.commit();

  return insightRef.id;
}
