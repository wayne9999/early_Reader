import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import type { AppUser, LearningEvent, LearningEventType, SkillArea } from "../types";
import { getFirebaseRuntime } from "./firebase";

const EVENT_STORAGE_KEY = "readnest-events-v1";

function localEventKey(user: AppUser | null) {
  return `${EVENT_STORAGE_KEY}:${user?.id ?? "guest"}`;
}

export async function recordLearningEvent(
  user: AppUser | null,
  type: LearningEventType,
  label: string,
  area: SkillArea,
  metadata: LearningEvent["metadata"] = {}
) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const event: LearningEvent = {
    userId: user?.id ?? "guest",
    type,
    label,
    area,
    metadata,
    createdAt: new Date().toISOString()
  };

  if (!runtime || !firebaseUser) {
    const key = localEventKey(user);
    const events = JSON.parse(localStorage.getItem(key) || "[]") as LearningEvent[];
    localStorage.setItem(key, JSON.stringify([event, ...events].slice(0, 100)));
    return;
  }

  await addDoc(collection(runtime.db, "users", firebaseUser.uid, "learningEvents"), {
    ...event,
    environment: import.meta.env.VITE_APP_ENVIRONMENT ?? "development",
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? null,
    userId: firebaseUser.uid,
    createdAt: serverTimestamp()
  });
}

export async function loadLearningEvents(user: AppUser | null, userId?: string): Promise<LearningEvent[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const targetUserId = userId ?? firebaseUser?.uid;

  if (!runtime || !firebaseUser || !targetUserId) {
    const events = JSON.parse(localStorage.getItem(localEventKey(user)) || "[]") as LearningEvent[];
    return events;
  }

  const eventsQuery = query(
    collection(runtime.db, "users", targetUserId, "learningEvents"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(eventsQuery);

  return snapshot.docs.map((eventDoc) => ({
    id: eventDoc.id,
    ...(eventDoc.data() as LearningEvent)
  }));
}
