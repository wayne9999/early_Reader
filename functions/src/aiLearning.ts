import { FieldValue, type DocumentData, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";

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

type InsightGuardrailStatus = "passed" | "fallback" | "blocked";

type NextBestActivity = {
  title: string;
  route: string;
  reason: string;
  skillArea: SkillArea;
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
  teacherSummary: string;
  parentSummary: string;
  nextBestActivity: NextBestActivity;
  confidence: "low" | "medium" | "high";
  strengths: Array<{ area: SkillArea; label: string; evidence: string }>;
  needsPractice: Array<{ area: SkillArea; label: string; evidence: string; nextStep: string }>;
  recommendedTeacherActions: string[];
  suggestedHomePractice: string[];
  skillFocusAreas: SkillArea[];
  evidence: {
    sourceEventCount: number;
    topMissedItems: string[];
    topMasteredItems: string[];
    recentLabels: string[];
  };
  guardrail: {
    status: InsightGuardrailStatus;
    checkedAt: FieldValue;
    notes: string[];
  };
  aiDisclosure: string;
  model: string;
  promptVersion: "readnest-ai-v2";
  sourceDataWindow: StudentLearningSummary["eventWindow"];
  createdAt: FieldValue;
  updatedAt: FieldValue;
  createdBy: "ai-worker";
  updatedBy: "ai-worker";
};

type OpenAiInsightPayload = {
  summary: string;
  teacherSummary: string;
  parentSummary: string;
  nextBestActivity: NextBestActivity;
  confidence: "low" | "medium" | "high";
  strengths: Array<{ area: SkillArea; label: string; evidence: string }>;
  needsPractice: Array<{ area: SkillArea; label: string; evidence: string; nextStep: string }>;
  recommendedTeacherActions: string[];
  suggestedHomePractice: string[];
  skillFocusAreas: SkillArea[];
};

export type OpenAiInsightResult = {
  insight: StudentAiInsight;
  inputTokens: number;
  outputTokens: number;
};

const SKILL_LABELS: Record<SkillArea, string> = {
  phonics: "Phonics patterns",
  sightWords: "Sight word recognition",
  fluency: "Sentence fluency",
  workingMemory: "Working memory",
  consistency: "Practice consistency"
};

const SKILL_AREAS: SkillArea[] = ["phonics", "sightWords", "fluency", "workingMemory", "consistency"];

const ROUTE_BY_SKILL: Record<SkillArea, string> = {
  phonics: "#/sound-sort",
  sightWords: "#/reading",
  fluency: "#/sentence-builder",
  workingMemory: "#/memory",
  consistency: "#/progress"
};

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

function confidenceForSummary(summary: StudentLearningSummary): "low" | "medium" | "high" {
  const scoredAttempts = summary.skills.reduce((total, skill) => total + skill.attempts, 0);

  if (summary.sourceEventCount >= 30 && scoredAttempts >= 12) {
    return "high";
  }

  if (summary.sourceEventCount >= 12 && scoredAttempts >= 5) {
    return "medium";
  }

  return "low";
}

function nextBestActivityForSkill(skill: SkillSummary | undefined, summary: StudentLearningSummary): NextBestActivity {
  const area = skill?.area ?? "sightWords";
  const missed = skill?.missedItems[0] ?? summary.topMissedItems[0];
  const label = SKILL_LABELS[area];

  return {
    title: area === "consistency" ? "Finish one short practice path" : `Practice ${label.toLowerCase()}`,
    route: ROUTE_BY_SKILL[area],
    reason: missed
      ? `Recent practice shows ${missed} needs another short, confident try.`
      : `This is the next useful skill area based on the latest practice pattern.`,
    skillArea: area
  };
}

function skillFocusAreasFromNeeds(needsPractice: SkillSummary[]) {
  const areas = needsPractice.map((skill) => skill.area);

  return areas.length ? areas : ["sightWords" as SkillArea];
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
  const confidence = confidenceForSummary(summary);
  const nextBestActivity = nextBestActivityForSkill(primaryNeed, summary);
  const summaryText =
    summary.sourceEventCount === 0
      ? "No recent learning events are available yet. Start with short practice and generate a new insight after the learner completes a few rounds."
      : `Recent practice shows ${summary.sourceEventCount} tracked interactions. Focus next on ${SKILL_LABELS[primaryNeed.area].toLowerCase()} using short, repeated practice.`;

  return {
    studentId: summary.studentId,
    status: "ready",
    summary: summaryText,
    teacherSummary: summaryText,
    parentSummary:
      summary.sourceEventCount === 0
        ? "Your child is ready to start. Try one short reading or memory activity, then check progress again."
        : `Your child has been practicing. A helpful next step is a short ${SKILL_LABELS[primaryNeed.area].toLowerCase()} activity with praise after a successful try.`,
    nextBestActivity,
    confidence,
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
    skillFocusAreas: skillFocusAreasFromNeeds(needsPractice),
    evidence: {
      sourceEventCount: summary.sourceEventCount,
      topMissedItems: summary.topMissedItems,
      topMasteredItems: summary.topMasteredItems,
      recentLabels: summary.recentLabels
    },
    guardrail: {
      status: "fallback",
      checkedAt: FieldValue.serverTimestamp(),
      notes: ["Rule-based insight used without an external AI provider."]
    },
    aiDisclosure: "Instructional support only. This is not a diagnosis or medical evaluation.",
    model: "rule-based-v1",
    promptVersion: "readnest-ai-v2",
    sourceDataWindow: summary.eventWindow,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: "ai-worker",
    updatedBy: "ai-worker"
  };
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 480) : fallback;
}

function cleanSkillArea(value: unknown, fallback: SkillArea): SkillArea {
  return isSkillArea(value) ? value : fallback;
}

function cleanList(value: unknown, fallback: string[], maxItems = 5) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 220))
    .slice(0, maxItems);
}

function cleanConfidence(value: unknown, fallback: StudentAiInsight["confidence"]) {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function cleanNextBestActivity(value: unknown, fallback: NextBestActivity): NextBestActivity {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const skillArea = cleanSkillArea(source.skillArea, fallback.skillArea);

  return {
    title: cleanString(source.title, fallback.title),
    route: cleanString(source.route, ROUTE_BY_SKILL[skillArea] ?? fallback.route),
    reason: cleanString(source.reason, fallback.reason),
    skillArea
  };
}

function normalizeOpenAiPayload(payload: unknown, fallback: StudentAiInsight): OpenAiInsightPayload {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};

  return {
    summary: cleanString(source.summary, fallback.summary),
    teacherSummary: cleanString(source.teacherSummary, fallback.teacherSummary),
    parentSummary: cleanString(source.parentSummary, fallback.parentSummary),
    nextBestActivity: cleanNextBestActivity(source.nextBestActivity, fallback.nextBestActivity),
    confidence: cleanConfidence(source.confidence, fallback.confidence),
    strengths: Array.isArray(source.strengths)
      ? source.strengths.slice(0, 3).map((item, index) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          area: cleanSkillArea(row.area, fallback.strengths[index]?.area ?? "sightWords"),
          label: cleanString(row.label, fallback.strengths[index]?.label ?? "Emerging strength"),
          evidence: cleanString(row.evidence, fallback.strengths[index]?.evidence ?? "Recent practice shows developing confidence.")
        };
      })
      : fallback.strengths,
    needsPractice: Array.isArray(source.needsPractice)
      ? source.needsPractice.slice(0, 4).map((item, index) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          area: cleanSkillArea(row.area, fallback.needsPractice[index]?.area ?? "fluency"),
          label: cleanString(row.label, fallback.needsPractice[index]?.label ?? "Practice focus"),
          evidence: cleanString(row.evidence, fallback.needsPractice[index]?.evidence ?? "More scored practice is needed."),
          nextStep: cleanString(row.nextStep, fallback.needsPractice[index]?.nextStep ?? "Use one short guided practice round, then retry independently.")
        };
      })
      : fallback.needsPractice,
    recommendedTeacherActions: cleanList(source.recommendedTeacherActions, fallback.recommendedTeacherActions, 5),
    suggestedHomePractice: cleanList(source.suggestedHomePractice, fallback.suggestedHomePractice, 4),
    skillFocusAreas: Array.isArray(source.skillFocusAreas)
      ? source.skillFocusAreas.filter(isSkillArea).slice(0, 4)
      : fallback.skillFocusAreas
  };
}

const UNSAFE_INSIGHT_TERMS = [
  "diagnosis",
  "diagnose",
  "dyslexia",
  "adhd",
  "autism",
  "disorder",
  "disabled",
  "disability",
  "medical condition",
  "learning disability"
];

function collectInsightText(insight: OpenAiInsightPayload) {
  return [
    insight.summary,
    insight.teacherSummary,
    insight.parentSummary,
    insight.nextBestActivity.title,
    insight.nextBestActivity.reason,
    ...insight.recommendedTeacherActions,
    ...insight.suggestedHomePractice,
    ...insight.strengths.flatMap((strength) => [strength.label, strength.evidence]),
    ...insight.needsPractice.flatMap((need) => [need.label, need.evidence, need.nextStep])
  ].join(" ").toLowerCase();
}

function assertInsightGuardrails(insight: OpenAiInsightPayload) {
  const text = collectInsightText(insight);
  const blockedTerms = UNSAFE_INSIGHT_TERMS.filter((term) => text.includes(term));

  if (blockedTerms.length) {
    throw new Error(`AI insight failed safety guardrail for unsupported terms: ${blockedTerms.join(", ")}`);
  }
}

function outputTextFromResponsesApi(response: unknown) {
  const data = response && typeof response === "object" ? response as Record<string, unknown> : {};

  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item) => {
      const outputItem = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return Array.isArray(outputItem.content) ? outputItem.content : [];
    })
    .map((content) => {
      const contentItem = content && typeof content === "object" ? content as Record<string, unknown> : {};
      return typeof contentItem.text === "string" ? contentItem.text : "";
    })
    .join("");
}

function usageFromResponsesApi(response: unknown) {
  const data = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const usage = data.usage && typeof data.usage === "object" ? data.usage as Record<string, unknown> : {};
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;

  return { inputTokens, outputTokens };
}

export async function buildOpenAiInsight(options: {
  apiKey: string;
  model: string;
  summary: StudentLearningSummary;
}): Promise<OpenAiInsightResult> {
  const fallback = buildRuleBasedInsight(options.summary);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: options.model,
      store: false,
      input: [
        {
          role: "system",
          content:
            "You are an early literacy instructional coach for kindergarten through grade 2. Use only the provided compact learning summary. Return concise, evidence-based teaching support. Do not diagnose medical, learning, or developmental conditions."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create a teacher-facing ReadNest insight from this compact student learning summary.",
            allowedSkillAreas: SKILL_AREAS,
            learningSummary: options.summary,
            requirements: [
              "Keep recommendations practical for a 5 minute lesson.",
              "Mention evidence from the summary.",
              "Avoid child email, payment, diagnosis, disability labels, or sensitive claims.",
              "Use warm, professional teacher language.",
              "Also provide a parent-friendly summary and one next best activity for the student."
            ]
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "readnest_student_insight",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "summary",
              "teacherSummary",
              "parentSummary",
              "nextBestActivity",
              "confidence",
              "strengths",
              "needsPractice",
              "recommendedTeacherActions",
              "suggestedHomePractice",
              "skillFocusAreas"
            ],
            properties: {
              summary: { type: "string" },
              teacherSummary: { type: "string" },
              parentSummary: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              nextBestActivity: {
                type: "object",
                additionalProperties: false,
                required: ["title", "route", "reason", "skillArea"],
                properties: {
                  title: { type: "string" },
                  route: { type: "string" },
                  reason: { type: "string" },
                  skillArea: { type: "string", enum: SKILL_AREAS }
                }
              },
              strengths: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["area", "label", "evidence"],
                  properties: {
                    area: { type: "string", enum: SKILL_AREAS },
                    label: { type: "string" },
                    evidence: { type: "string" }
                  }
                }
              },
              needsPractice: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["area", "label", "evidence", "nextStep"],
                  properties: {
                    area: { type: "string", enum: SKILL_AREAS },
                    label: { type: "string" },
                    evidence: { type: "string" },
                    nextStep: { type: "string" }
                  }
                }
              },
              recommendedTeacherActions: {
                type: "array",
                maxItems: 5,
                items: { type: "string" }
              },
              suggestedHomePractice: {
                type: "array",
                maxItems: 4,
                items: { type: "string" }
              },
              skillFocusAreas: {
                type: "array",
                maxItems: 4,
                items: { type: "string", enum: SKILL_AREAS }
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI insight request failed with ${response.status}`);
  }

  const responseData = await response.json();
  const text = outputTextFromResponsesApi(responseData);
  const usage = usageFromResponsesApi(responseData);
  const normalized = normalizeOpenAiPayload(JSON.parse(text), fallback);
  assertInsightGuardrails(normalized);

  return {
    insight: {
      ...fallback,
      ...normalized,
      model: options.model,
      evidence: fallback.evidence,
      guardrail: {
        status: "passed",
        checkedAt: FieldValue.serverTimestamp(),
        notes: ["Structured output validated and non-diagnostic language guardrail passed."]
      },
      aiDisclosure: "AI-assisted instructional support only. This is not a diagnosis or medical evaluation.",
      promptVersion: "readnest-ai-v2",
      sourceDataWindow: options.summary.eventWindow,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "ai-worker",
      updatedBy: "ai-worker"
    },
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens
  };
}

export async function loadRecentLearningEvents(db: Firestore, studentId: string, maxEvents = 200) {
  const snapshot = await db
    .collection(`users/${studentId}/learningEvents`)
    .orderBy("createdAt", "desc")
    .limit(maxEvents)
    .get();

  return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
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
  batch.set(db.doc(`users/${studentId}/learningCoachState/current`), {
    studentId,
    status: "ready",
    activeJobStatus: "succeeded",
    lastInsightId: insightRef.id,
    lastInsightAt: FieldValue.serverTimestamp(),
    eventsSinceLastInsight: 0,
    currentRecommendation: insight.nextBestActivity,
    skillFocusAreas: insight.skillFocusAreas,
    confidence: insight.confidence,
    providerModel: insight.model,
    guardrailStatus: insight.guardrail.status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "ai-worker"
  } satisfies DocumentData, { merge: true });

  await batch.commit();

  return insightRef.id;
}
