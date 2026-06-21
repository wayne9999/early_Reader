import type { LearningEvent, SkillArea } from "../types";

export type AreaSummary = {
  area: SkillArea;
  label: string;
  interactions: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
};

const areaLabels: Record<SkillArea, string> = {
  phonics: "Sounds and phonics",
  sightWords: "Sight words",
  fluency: "Reading fluency",
  workingMemory: "Memory",
  consistency: "Practice routine"
};

const areaOrder: SkillArea[] = ["sightWords", "phonics", "fluency", "workingMemory", "consistency"];

function metadataBoolean(event: LearningEvent, key: string) {
  return event.metadata?.[key] === true;
}

function hasCorrectness(event: LearningEvent) {
  return typeof event.metadata?.correct === "boolean";
}

function eventTime(event: LearningEvent) {
  const value = event.createdAt;

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  return "Recently";
}

export function formatEventTime(event: LearningEvent) {
  return eventTime(event);
}

export function summarizeEvents(events: LearningEvent[]) {
  const answeredEvents = events.filter(hasCorrectness);
  const correctAnswers = answeredEvents.filter((event) => metadataBoolean(event, "correct")).length;
  const incorrectAnswers = answeredEvents.length - correctAnswers;
  const completedActivities = events.filter((event) =>
    event.type === "activity_completed" || event.type === "memory_completed" || event.type === "reading_completed"
  ).length;
  const areasPracticed = new Set(events.map((event) => event.area)).size;
  const accuracy = answeredEvents.length ? Math.round((correctAnswers / answeredEvents.length) * 100) : null;

  return {
    totalInteractions: events.length,
    answeredAttempts: answeredEvents.length,
    correctAnswers,
    incorrectAnswers,
    completedActivities,
    areasPracticed,
    accuracy
  };
}

export function summarizeByArea(events: LearningEvent[]): AreaSummary[] {
  return areaOrder.map((area) => {
    const areaEvents = events.filter((event) => event.area === area);
    const answeredEvents = areaEvents.filter(hasCorrectness);
    const correct = answeredEvents.filter((event) => metadataBoolean(event, "correct")).length;
    const incorrect = answeredEvents.length - correct;

    return {
      area,
      label: areaLabels[area],
      interactions: areaEvents.length,
      correct,
      incorrect,
      accuracy: answeredEvents.length ? Math.round((correct / answeredEvents.length) * 100) : null
    };
  });
}

export function recentNeeds(events: LearningEvent[]) {
  return events
    .filter((event) => hasCorrectness(event) && !metadataBoolean(event, "correct"))
    .slice(0, 5)
    .map((event) => ({
      id: event.id ?? `${event.type}-${event.label}-${event.createdAt}`,
      label: event.label,
      area: areaLabels[event.area],
      selectedChoice: event.metadata?.selectedChoice,
      correctChoice: event.metadata?.correctChoice,
      createdAt: formatEventTime(event)
    }));
}

export function nextStudentPractice(events: LearningEvent[]) {
  const areaSummaries = summarizeByArea(events)
    .filter((area) => area.interactions > 0)
    .sort((left, right) => {
      const leftAccuracy = left.accuracy ?? 101;
      const rightAccuracy = right.accuracy ?? 101;

      return leftAccuracy - rightAccuracy || right.interactions - left.interactions;
    });
  const focus = areaSummaries.find((area) => area.incorrect > 0) ?? areaSummaries[0];

  if (!focus) {
    return "Try Reading or Memory first so your dashboard can learn what to recommend.";
  }

  if (focus.accuracy === null) {
    return `Keep practicing ${focus.label.toLowerCase()} and finish one round so progress can be measured.`;
  }

  if (focus.accuracy < 70) {
    return `Spend a short session on ${focus.label.toLowerCase()} and use the Listen buttons before answering.`;
  }

  return `Nice progress in ${focus.label.toLowerCase()}. Try one harder round next.`;
}
