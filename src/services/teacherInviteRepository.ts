import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { AppUser, TeacherInvite, UserProfile } from "../types";
import { getFirebaseRuntime } from "./firebase";

export type AcceptInviteResult = {
  status: "active" | "requested";
  teacherName: string;
  linkId?: string;
};

const INVITE_STORAGE_KEY = "readnest-teacher-invites-v1";

function localInviteKey(userId: string) {
  return `${INVITE_STORAGE_KEY}:${userId}`;
}

function createInviteCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `READ-${suffix}`;
}

function thirtyDaysFromNow() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function loadLocalInvites(userId: string): TeacherInvite[] {
  return JSON.parse(localStorage.getItem(localInviteKey(userId)) || "[]") as TeacherInvite[];
}

function saveLocalInvites(userId: string, invites: TeacherInvite[]) {
  localStorage.setItem(localInviteKey(userId), JSON.stringify(invites));
}

export async function createTeacherInvite(user: AppUser, profile: UserProfile, autoApprove = false) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const invite: Omit<TeacherInvite, "id"> = {
    teacherId: user.id,
    teacherName: profile.displayName,
    code: createInviteCode(),
    status: "active",
    autoApprove,
    expiresAt: thirtyDaysFromNow(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: user.id,
    updatedBy: user.id
  };

  if (!runtime || !firebaseUser) {
    const localInvite = { ...invite, id: invite.code };
    saveLocalInvites(user.id, [localInvite, ...loadLocalInvites(user.id)]);
    return localInvite;
  }

  const inviteRef = await addDoc(collection(runtime.db, "teacherInvites"), {
    ...invite,
    teacherId: firebaseUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: firebaseUser.uid,
    updatedBy: firebaseUser.uid
  });

  return { ...invite, id: inviteRef.id, teacherId: firebaseUser.uid };
}

export async function loadTeacherInvites(user: AppUser | null) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!user) {
    return [];
  }

  if (!runtime || !firebaseUser) {
    return loadLocalInvites(user.id);
  }

  const invitesQuery = query(
    collection(runtime.db, "teacherInvites"),
    where("teacherId", "==", firebaseUser.uid),
    limit(10)
  );
  const snapshot = await getDocs(invitesQuery);

  return snapshot.docs.map((inviteDoc) => ({
    id: inviteDoc.id,
    ...(inviteDoc.data() as Omit<TeacherInvite, "id">)
  }));
}

export async function revokeTeacherInvite(user: AppUser, invite: TeacherInvite) {
  const runtime = getFirebaseRuntime();
  const revokedInvite: TeacherInvite = { ...invite, status: "revoked", updatedAt: new Date().toISOString() };

  if (!runtime || !runtime.auth.currentUser) {
    saveLocalInvites(
      user.id,
      loadLocalInvites(user.id).map((localInvite) => (localInvite.id === invite.id ? revokedInvite : localInvite))
    );
    return revokedInvite;
  }

  await updateDoc(doc(runtime.db, "teacherInvites", invite.id), {
    status: "revoked",
    updatedAt: serverTimestamp(),
    updatedBy: runtime.auth.currentUser.uid
  });

  return revokedInvite;
}

export async function acceptTeacherInviteCode(code: string): Promise<AcceptInviteResult> {
  const trimmedCode = code.trim().toUpperCase();

  if (trimmedCode.length < 4) {
    throw new Error("Enter the invite code your teacher shared.");
  }

  const runtime = getFirebaseRuntime();

  if (!runtime || !runtime.auth.currentUser) {
    // Demo mode has no backend; simulate a pending request so the flow stays testable.
    return { status: "requested", teacherName: "Demo Teacher" };
  }

  const acceptInvite = httpsCallable<{ code: string }, AcceptInviteResult>(runtime.functions, "acceptTeacherInvite");
  const response = await acceptInvite({ code: trimmedCode });

  return response.data;
}
