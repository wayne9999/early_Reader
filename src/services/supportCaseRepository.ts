import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { AppUser, SupportCase, SupportCaseType } from "../types";
import { getFirebaseRuntime } from "./firebase";

const SUPPORT_CASE_STORAGE_KEY = "readnest-support-cases-v1";

function localSupportCases() {
  const rawCases = localStorage.getItem(SUPPORT_CASE_STORAGE_KEY);
  return rawCases ? (JSON.parse(rawCases) as SupportCase[]) : [];
}

function cleanText(value: string, limit: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, limit);
}

export async function createSupportCase(
  user: AppUser,
  input: {
    type: SupportCaseType;
    subject: string;
    message: string;
    contactEmail?: string | null;
  }
) {
  const subject = cleanText(input.subject, 120);
  const message = cleanText(input.message, 1200);

  if (!subject || !message) {
    throw new Error("Add a short subject and message before sending support.");
  }

  const supportCase: SupportCase = {
    userId: user.id,
    type: input.type,
    subject,
    message,
    contactEmail: input.contactEmail ?? user.email ?? null,
    status: "open",
    createdBy: user.id,
    updatedBy: user.id
  };
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    const localCase = {
      ...supportCase,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(SUPPORT_CASE_STORAGE_KEY, JSON.stringify([localCase, ...localSupportCases()]));
    return localCase;
  }

  const docRef = await addDoc(collection(runtime.db, "supportCases"), {
    ...supportCase,
    userId: firebaseUser.uid,
    createdBy: firebaseUser.uid,
    updatedBy: firebaseUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    ...supportCase,
    id: docRef.id
  };
}
