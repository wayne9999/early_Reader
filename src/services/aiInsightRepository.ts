import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { AiAnalysisJob, AppUser, LearningCoachState, StudentAiInsight } from "../types";
import { getFirebaseRuntime } from "./firebase";

const LOCAL_INSIGHT_KEY = "readnest-ai-insights-v1";

function localInsightKey(studentId: string) {
  return `${LOCAL_INSIGHT_KEY}:${studentId}`;
}

export async function loadLatestStudentInsight(studentId: string): Promise<StudentAiInsight | null> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    const stored = localStorage.getItem(localInsightKey(studentId));
    return stored ? JSON.parse(stored) as StudentAiInsight : null;
  }

  const insightsQuery = query(
    collection(runtime.db, "users", studentId, "aiInsights"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(insightsQuery);
  const latest = snapshot.docs[0];

  if (!latest) {
    return null;
  }

  return {
    id: latest.id,
    ...(latest.data() as StudentAiInsight)
  };
}

export async function loadLatestStudentInsightJob(studentId: string): Promise<AiAnalysisJob | null> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return null;
  }

  const jobsQuery = query(
    collection(runtime.db, "aiAnalysisJobs"),
    where("studentId", "==", studentId),
    limit(10)
  );
  const snapshot = await getDocs(jobsQuery);
  const jobs = snapshot.docs.map((jobDoc) => ({
    id: jobDoc.id,
    ...(jobDoc.data() as AiAnalysisJob)
  }));

  return jobs.sort((left, right) => timestampMillis(right.createdAt) - timestampMillis(left.createdAt))[0] ?? null;
}

export async function loadLearningCoachState(studentId: string): Promise<LearningCoachState | null> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return null;
  }

  const stateDoc = await getDoc(doc(runtime.db, "users", studentId, "learningCoachState", "current"));

  if (!stateDoc.exists()) {
    return null;
  }

  return stateDoc.data() as LearningCoachState;
}

function timestampMillis(value: unknown) {
  if (typeof value === "string") {
    return Date.parse(value) || 0;
  }

  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }

  return 0;
}

export async function requestStudentInsight(user: AppUser | null, studentId: string): Promise<Pick<AiAnalysisJob, "id" | "status">> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    const fallbackInsight: StudentAiInsight = {
      id: "local-preview",
      studentId,
      status: "ready",
      summary: "Backend AI insights require Firebase sign-in. This local preview keeps the dashboard usable during development.",
      strengths: [],
      needsPractice: [],
      recommendedTeacherActions: ["Sign in with Firebase and request an updated insight after student practice is logged."],
      suggestedHomePractice: ["Complete one short reading activity and one memory activity."],
      parentSummary: "Sign in to save practice history and unlock backend-generated learning coach summaries.",
      teacherSummary: "Firebase sign-in is required before secure teacher insights can be generated.",
      nextBestActivity: {
        title: "Try Reading or Memory",
        route: "#/reading",
        reason: "Local preview mode does not have enough saved history for a personalized path yet.",
        skillArea: "sightWords"
      },
      confidence: "low",
      skillFocusAreas: ["sightWords"],
      evidence: {
        sourceEventCount: 0,
        topMissedItems: [],
        topMasteredItems: [],
        recentLabels: []
      },
      guardrail: {
        status: "fallback",
        notes: ["Local preview only; no backend AI provider was called."]
      },
      aiDisclosure: "Instructional support only. This is not a diagnosis or medical evaluation.",
      model: "local-preview",
      promptVersion: "readnest-ai-v2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(localInsightKey(studentId), JSON.stringify(fallbackInsight));
    return { id: "local-preview", status: "succeeded" };
  }

  const callable = httpsCallable<{ studentId: string; consentAccepted: boolean }, { jobId: string; status: AiAnalysisJob["status"] }>(
    runtime.functions,
    "requestStudentInsight"
  );
  const response = await callable({ studentId, consentAccepted: true });

  return {
    id: response.data.jobId,
    status: response.data.status
  };
}
