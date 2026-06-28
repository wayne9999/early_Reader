import { learningActivities } from "../data/content";
import type {
  AppView,
  LearningActivity,
  LearningActivityRound,
  LearningCoachState,
  LearningEvent,
  Progress,
  SkillArea,
  StudentAiInsight,
  StudentReadingGoal,
  UserProfile
} from "../types";
import { summarizeByArea } from "./learningEventSummary";

export type PersonalizedRecommendation = {
  title: string;
  route: `#/${string}`;
  view: AppView;
  reason: string;
  skillArea: SkillArea;
  priority: "start" | "practice" | "stretch";
};

export type StudentPersonalizedPlan = {
  learnerName: string;
  gradeLabel: string;
  goalLabel: string;
  focusAreas: SkillArea[];
  missedItems: string[];
  masteredItems: string[];
  recommendations: PersonalizedRecommendation[];
  encouragement: string;
  planSource: "coach" | "recent-practice" | "profile" | "starter";
};

const goalLabels: Record<StudentReadingGoal, string> = {
  confidence: "Reading confidence",
  phonics: "Sounding out words",
  sightWords: "Sight word memory",
  fluency: "Smooth sentence reading"
};

const gradeLabels = {
  K: "Kindergarten",
  "1": "Grade 1",
  "2": "Grade 2"
} as const;

const skillLabels: Record<SkillArea, string> = {
  phonics: "sounds",
  sightWords: "sight words",
  fluency: "sentences",
  workingMemory: "memory",
  consistency: "practice routine"
};

const routeBySkill: Record<SkillArea, { view: AppView; route: `#/${string}`; title: string }> = {
  phonics: { view: "soundSort", route: "#/sound-sort", title: "Sound Sort" },
  sightWords: { view: "reading", route: "#/reading", title: "Reading Practice" },
  fluency: { view: "sentenceBuilder", route: "#/sentence-builder", title: "Sentence Builder" },
  workingMemory: { view: "memory", route: "#/memory", title: "Memory Match" },
  consistency: { view: "progress", route: "#/progress", title: "Daily Goal Check" }
};

const goalFocus: Record<StudentReadingGoal, SkillArea> = {
  confidence: "fluency",
  phonics: "phonics",
  sightWords: "sightWords",
  fluency: "fluency"
};

const starterFocusByGrade: Record<"K" | "1" | "2", SkillArea[]> = {
  K: ["phonics", "sightWords", "workingMemory"],
  "1": ["sightWords", "fluency", "phonics"],
  "2": ["fluency", "sightWords", "phonics"]
};

function eventItem(event: LearningEvent) {
  const target = event.metadata?.target;
  const word = event.metadata?.word;
  const correctChoice = event.metadata?.correctChoice;

  if (typeof target === "string" && target.trim()) {
    return target.trim();
  }

  if (typeof word === "string" && word.trim()) {
    return word.trim();
  }

  if (typeof correctChoice === "string" && correctChoice.trim()) {
    return correctChoice.trim();
  }

  return event.label;
}

function uniqueRecent(values: string[], max = 6) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, max);
}

function roundText(round: LearningActivityRound) {
  return [round.target, round.prompt, round.correctChoice].join(" ").toLowerCase();
}

function focusAreasFromInputs(options: {
  profile?: UserProfile | null;
  events: LearningEvent[];
  coachInsight?: StudentAiInsight | null;
  coachState?: LearningCoachState | null;
}) {
  const fromCoach = options.coachInsight?.skillFocusAreas?.length
    ? options.coachInsight.skillFocusAreas
    : options.coachState?.skillFocusAreas ?? [];
  const fromRecentPractice = summarizeByArea(options.events)
    .filter((area) => area.interactions > 0)
    .sort((left, right) => {
      const leftScore = left.accuracy ?? (left.incorrect > 0 ? 45 : 65);
      const rightScore = right.accuracy ?? (right.incorrect > 0 ? 45 : 65);

      return leftScore - rightScore || right.incorrect - left.incorrect;
    })
    .map((area) => area.area);
  const fromGoal = options.profile?.readingGoal ? [goalFocus[options.profile.readingGoal]] : [];
  const fromGrade = starterFocusByGrade[options.profile?.gradeLevel ?? "K"];

  return uniqueRecent([...fromCoach, ...fromRecentPractice, ...fromGoal, ...fromGrade], 4) as SkillArea[];
}

function recommendationForArea(area: SkillArea, reason: string, priority: PersonalizedRecommendation["priority"]): PersonalizedRecommendation {
  const target = routeBySkill[area];

  return {
    title: target.title,
    route: target.route,
    view: target.view,
    reason,
    skillArea: area,
    priority
  };
}

export function buildStudentPersonalizedPlan(options: {
  profile?: UserProfile | null;
  progress: Progress;
  events: LearningEvent[];
  coachInsight?: StudentAiInsight | null;
  coachState?: LearningCoachState | null;
}): StudentPersonalizedPlan {
  const learnerName = options.profile?.displayName?.split(" ")[0] || "Reader";
  const gradeLevel = options.profile?.gradeLevel ?? "K";
  const readingGoal = options.profile?.readingGoal ?? "confidence";
  const focusAreas = focusAreasFromInputs(options);
  const missedItems = uniqueRecent(
    options.events
      .filter((event) => event.metadata?.correct === false)
      .map(eventItem),
    5
  );
  const masteredItems = uniqueRecent(
    options.events
      .filter((event) => event.metadata?.correct === true || event.type === "word_known")
      .map(eventItem),
    5
  );
  const coachRecommendation = options.coachInsight?.nextBestActivity ?? options.coachState?.currentRecommendation;
  const recommendations: PersonalizedRecommendation[] = [];

  if (coachRecommendation?.route && coachRecommendation.skillArea) {
    const route = coachRecommendation.route.startsWith("#/")
      ? coachRecommendation.route as `#/${string}`
      : `#/${coachRecommendation.route.replace(/^#?\//, "")}` as `#/${string}`;
    recommendations.push({
      title: coachRecommendation.title,
      route,
      view: routeBySkill[coachRecommendation.skillArea]?.view ?? "reading",
      reason: coachRecommendation.reason,
      skillArea: coachRecommendation.skillArea,
      priority: "start"
    });
  }

  for (const area of focusAreas) {
    if (recommendations.some((recommendation) => recommendation.skillArea === area)) {
      continue;
    }

    recommendations.push(recommendationForArea(
      area,
      missedItems.length
        ? `A quick ${skillLabels[area]} round will review ${missedItems.slice(0, 2).join(" and ")}.`
        : `This fits ${learnerName}'s ${goalLabels[readingGoal].toLowerCase()} goal.`,
      recommendations.length === 0 ? "start" : "practice"
    ));
  }

  if (!recommendations.some((recommendation) => recommendation.view === "memory")) {
    recommendations.push(recommendationForArea(
      "workingMemory",
      options.progress.memoryWins > 0 ? "Replay memory and try to beat your best board." : "Start a short memory board to build focus.",
      "stretch"
    ));
  }

  const planSource = coachRecommendation
    ? "coach"
    : options.events.length >= 3
      ? "recent-practice"
      : options.profile?.gradeLevel || options.profile?.readingGoal
        ? "profile"
        : "starter";

  return {
    learnerName,
    gradeLabel: gradeLabels[gradeLevel],
    goalLabel: goalLabels[readingGoal],
    focusAreas,
    missedItems,
    masteredItems,
    recommendations: recommendations.slice(0, 4),
    encouragement: masteredItems.length
      ? `${learnerName} is building confidence with ${masteredItems.slice(0, 2).join(" and ")}.`
      : `${learnerName}'s path will get smarter as more practice is saved.`,
    planSource
  };
}

export function personalizeActivityRounds(options: {
  activity: LearningActivity;
  profile?: UserProfile | null;
  events: LearningEvent[];
  focusAreas?: SkillArea[];
}) {
  const missedItems = uniqueRecent(
    options.events
      .filter((event) => event.metadata?.correct === false)
      .map(eventItem),
    8
  ).map((item) => item.toLowerCase());
  const masteredItems = uniqueRecent(
    options.events
      .filter((event) => event.metadata?.correct === true || event.type === "word_known")
      .map(eventItem),
    8
  ).map((item) => item.toLowerCase());
  const goalArea = options.profile?.readingGoal ? goalFocus[options.profile.readingGoal] : null;
  const skillMatchesGoal = goalArea === options.activity.skill || options.focusAreas?.includes(options.activity.skill);

  if (!missedItems.length && !masteredItems.length && !skillMatchesGoal) {
    return {
      rounds: options.activity.rounds,
      reason: "Starter order"
    };
  }

  const scored = options.activity.rounds.map((round, index) => {
    const text = roundText(round);
    const missedScore = missedItems.some((item) => text.includes(item)) ? 60 : 0;
    const masteredScore = masteredItems.some((item) => text.includes(item)) ? -12 : 0;
    const goalScore = skillMatchesGoal ? 8 : 0;

    return {
      round,
      index,
      score: missedScore + masteredScore + goalScore
    };
  });

  return {
    rounds: scored
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map((item) => item.round),
    reason: missedItems.length
      ? `Reviewing ${missedItems.slice(0, 2).join(" and ")} first`
      : skillMatchesGoal
        ? `Matched to ${options.profile?.readingGoal ? goalLabels[options.profile.readingGoal].toLowerCase() : "today's focus"}`
        : "Keeping mastered items in light review"
  };
}

export function activityTitleForView(view: AppView) {
  if (view === "reading") {
    return "Reading Practice";
  }

  if (view === "memory") {
    return "Memory Match";
  }

  return learningActivities.find((activity) => activity.id === view)?.title ?? "Practice";
}
