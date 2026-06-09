import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import type { AppUser, Progress, TeacherStudentLink, UserProfile } from "../types";
import { getFirebaseRuntime } from "./firebase";

export async function searchTeachers(searchTerm: string): Promise<UserProfile[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || searchTerm.trim().length < 2) {
    return [];
  }

  const normalizedTerm = searchTerm.trim();
  const byCode = query(collection(runtime.db, "teacherProfiles"), where("teacherCode", "==", normalizedTerm.toUpperCase()));
  const byEmail = query(collection(runtime.db, "teacherProfiles"), where("email", "==", normalizedTerm.toLowerCase()));
  const [codeSnapshot, emailSnapshot] = await Promise.all([getDocs(byCode), getDocs(byEmail)]);
  const teachers = new Map<string, UserProfile>();

  [...codeSnapshot.docs, ...emailSnapshot.docs].forEach((teacherDoc) => {
    teachers.set(teacherDoc.id, teacherDoc.data() as UserProfile);
  });

  return [...teachers.values()];
}

export async function requestTeacherAssignment(
  teacher: UserProfile,
  student: AppUser,
  studentProfile: UserProfile,
  progress: Progress
) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return;
  }

  const linkId = `${teacher.uid}_${firebaseUser.uid}`;
  await setDoc(
    doc(runtime.db, "teacherStudentLinks", linkId),
    {
      teacherId: teacher.uid,
      teacherName: teacher.displayName,
      teacherEmail: teacher.email,
      studentId: firebaseUser.uid,
      studentName: studentProfile.displayName || student.name,
      studentEmail: student.email ?? null,
      status: "requested",
      latestProgressSnapshot: progress,
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function loadStudentAssignments(user: AppUser | null): Promise<TeacherStudentLink[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    return [];
  }

  const assignmentsQuery = query(collection(runtime.db, "teacherStudentLinks"), where("studentId", "==", firebaseUser.uid));
  const snapshot = await getDocs(assignmentsQuery);
  return snapshot.docs.map((assignmentDoc) => ({
    id: assignmentDoc.id,
    ...(assignmentDoc.data() as Omit<TeacherStudentLink, "id">)
  }));
}

export async function loadTeacherAssignments(user: AppUser | null): Promise<TeacherStudentLink[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    return [];
  }

  const assignmentsQuery = query(collection(runtime.db, "teacherStudentLinks"), where("teacherId", "==", firebaseUser.uid));
  const snapshot = await getDocs(assignmentsQuery);
  return snapshot.docs.map((assignmentDoc) => ({
    id: assignmentDoc.id,
    ...(assignmentDoc.data() as Omit<TeacherStudentLink, "id">)
  }));
}

export async function updateTeacherAssignmentStatus(linkId: string, status: TeacherStudentLink["status"]) {
  const runtime = getFirebaseRuntime();

  if (!runtime) {
    return;
  }

  await updateDoc(doc(runtime.db, "teacherStudentLinks", linkId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function syncAssignmentProgress(user: AppUser | null, progress: Progress) {
  const assignments = await loadStudentAssignments(user);
  const runtime = getFirebaseRuntime();

  if (!runtime) {
    return;
  }

  await Promise.all(
    assignments.map((assignment) =>
      updateDoc(doc(runtime.db, "teacherStudentLinks", assignment.id), {
        latestProgressSnapshot: progress,
        updatedAt: serverTimestamp()
      })
    )
  );
}
