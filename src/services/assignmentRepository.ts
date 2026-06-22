import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { AppUser, Progress, StudentPlacementQueue, TeacherLoadStatus, TeacherStudentLink, UserProfile } from "../types";
import { getFirebaseRuntime } from "./firebase";

export const DEFAULT_TEACHER_CAPACITY = 12;
const TEACHER_DIRECTORY_LIMIT = 12;
const PLACEMENT_QUEUE_LIMIT = 25;
const ASSIGNMENT_STORAGE_KEY = "readnest-teacher-assignments-v1";
const PLACEMENT_STORAGE_KEY = "readnest-student-placement-v1";
const fallbackTeacherDirectory: UserProfile[] = [
  {
    uid: "demo-teacher-lina",
    role: "teacher",
    displayName: "Ms. Lina Carter",
    email: "lina.teacher@example.com",
    picture: null,
    teacherCode: "LINA-READ",
    bio: "Kindergarten and grade 1 reading guide who uses songs, sound tapping, and quick confidence wins.",
    gradeBands: ["K", "1"],
    specialties: ["rhyming", "beginning sounds", "sight words"],
    maxStudentLoad: 10,
    activeStudentCount: 4,
    payModelNote: "Paid per active assigned student after teacher approval."
  },
  {
    uid: "demo-teacher-marcus",
    role: "teacher",
    displayName: "Mr. Marcus Reed",
    email: "marcus.teacher@example.com",
    picture: null,
    teacherCode: "REED-READ",
    bio: "Grade 1 and 2 reading coach focused on sentence fluency, story order, and vocabulary growth.",
    gradeBands: ["1", "2"],
    specialties: ["sentence fluency", "story sequencing", "word meaning"],
    maxStudentLoad: 12,
    activeStudentCount: 9,
    payModelNote: "Paid per active assigned student with load kept visible to families."
  },
  {
    uid: "demo-teacher-nia",
    role: "teacher",
    displayName: "Ms. Nia Brooks",
    email: "nia.teacher@example.com",
    picture: null,
    teacherCode: "NIA-READ",
    bio: "Early literacy specialist who helps hesitant readers practice calmly with clear next steps.",
    gradeBands: ["K", "1", "2"],
    specialties: ["reading confidence", "phonics review", "memory routines"],
    maxStudentLoad: 8,
    activeStudentCount: 8,
    payModelNote: "Currently full so students can choose a teacher with enough attention available."
  }
];

function fallbackTeacherSearch(searchTerm: string) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (normalizedTerm.length < 2) {
    return sortTeachersForStudentChoice(fallbackTeacherDirectory);
  }

  return sortTeachersForStudentChoice(
    fallbackTeacherDirectory.filter((teacher) =>
      [teacher.displayName, teacher.email, teacher.teacherCode, teacher.bio]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedTerm))
    )
  );
}

function localAssignmentKey(userId: string) {
  return `${ASSIGNMENT_STORAGE_KEY}:${userId}`;
}

function loadLocalAssignments(userId: string): TeacherStudentLink[] {
  return JSON.parse(localStorage.getItem(localAssignmentKey(userId)) || "[]") as TeacherStudentLink[];
}

function saveLocalAssignments(userId: string, assignments: TeacherStudentLink[]) {
  localStorage.setItem(localAssignmentKey(userId), JSON.stringify(assignments));
}

function localPlacementKey(userId: string) {
  return `${PLACEMENT_STORAGE_KEY}:${userId}`;
}

function loadLocalPlacement(userId: string): StudentPlacementQueue | null {
  return JSON.parse(localStorage.getItem(localPlacementKey(userId)) || "null") as StudentPlacementQueue | null;
}

function saveLocalPlacement(userId: string, placement: StudentPlacementQueue) {
  localStorage.setItem(localPlacementKey(userId), JSON.stringify(placement));
}

export function teacherLoadStatus(teacher: UserProfile): TeacherLoadStatus {
  const activeStudentCount = teacher.activeStudentCount ?? 0;
  const maxStudentLoad = teacher.maxStudentLoad ?? DEFAULT_TEACHER_CAPACITY;

  if (activeStudentCount >= maxStudentLoad) {
    return "full";
  }

  if (activeStudentCount / maxStudentLoad >= 0.75) {
    return "nearlyFull";
  }

  return "open";
}

export function availableTeacherSlots(teacher: UserProfile) {
  return Math.max((teacher.maxStudentLoad ?? DEFAULT_TEACHER_CAPACITY) - (teacher.activeStudentCount ?? 0), 0);
}

export function sortTeachersForStudentChoice(teachers: UserProfile[]) {
  return [...teachers].sort((first, second) => {
    const firstStatus = teacherLoadStatus(first);
    const secondStatus = teacherLoadStatus(second);

    if (firstStatus === "full" && secondStatus !== "full") {
      return 1;
    }

    if (firstStatus !== "full" && secondStatus === "full") {
      return -1;
    }

    return (first.activeStudentCount ?? 0) - (second.activeStudentCount ?? 0)
      || first.displayName.localeCompare(second.displayName);
  });
}

export async function searchTeachers(searchTerm: string): Promise<UserProfile[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return fallbackTeacherSearch(searchTerm);
  }

  const normalizedTerm = searchTerm.trim();

  if (normalizedTerm.length < 2) {
    const directoryQuery = query(
      collection(runtime.db, "teacherDirectory"),
      limit(TEACHER_DIRECTORY_LIMIT)
    );
    const snapshot = await getDocs(directoryQuery);

    return sortTeachersForStudentChoice(snapshot.docs.map((teacherDoc) => teacherDoc.data() as UserProfile));
  }

  const byCode = query(
    collection(runtime.db, "teacherDirectory"),
    where("teacherCode", "==", normalizedTerm.toUpperCase()),
    limit(TEACHER_DIRECTORY_LIMIT)
  );
  const byEmail = query(
    collection(runtime.db, "teacherDirectory"),
    where("email", "==", normalizedTerm.toLowerCase()),
    limit(TEACHER_DIRECTORY_LIMIT)
  );
  const [codeSnapshot, emailSnapshot] = await Promise.all([getDocs(byCode), getDocs(byEmail)]);
  const teachers = new Map<string, UserProfile>();

  [...codeSnapshot.docs, ...emailSnapshot.docs].forEach((teacherDoc) => {
    teachers.set(teacherDoc.id, teacherDoc.data() as UserProfile);
  });

  return sortTeachersForStudentChoice([...teachers.values()]);
}

export async function upsertStudentPlacementQueue(
  student: AppUser,
  studentProfile: UserProfile,
  progress: Progress,
  options: {
    status: StudentPlacementQueue["status"];
    requestedTeacher?: UserProfile | null;
    assignedTeacher?: UserProfile | null;
  }
) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const placement: StudentPlacementQueue = {
    id: student.id,
    studentId: student.id,
    studentName: studentProfile.displayName || student.name,
    studentEmail: student.email ?? studentProfile.email ?? null,
    status: options.status,
    holdingTeacherName: options.status === "unassigned" ? "ReadNest holding space" : null,
    requestedTeacherId: options.requestedTeacher?.uid ?? null,
    requestedTeacherName: options.requestedTeacher?.displayName ?? null,
    assignedTeacherId: options.assignedTeacher?.uid ?? null,
    assignedTeacherName: options.assignedTeacher?.displayName ?? null,
    latestProgressSnapshot: progress,
    requestedAt: options.status === "requested" ? new Date().toISOString() : undefined,
    assignedAt: options.status === "assigned" ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: student.id,
    updatedBy: student.id
  };

  if (!runtime || !firebaseUser) {
    saveLocalPlacement(student.id, placement);
    return placement;
  }

  const firebasePlacement = {
    ...placement,
    id: firebaseUser.uid,
    studentId: firebaseUser.uid,
    requestedAt: options.status === "requested" ? serverTimestamp() : null,
    assignedAt: options.status === "assigned" ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: firebaseUser.uid,
    updatedBy: firebaseUser.uid
  };

  await setDoc(doc(runtime.db, "studentPlacementQueue", firebaseUser.uid), firebasePlacement, { merge: true });

  return {
    ...placement,
    id: firebaseUser.uid,
    studentId: firebaseUser.uid
  };
}

export async function loadStudentPlacement(user: AppUser | null): Promise<StudentPlacementQueue | null> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    return user ? loadLocalPlacement(user.id) : null;
  }

  const snapshot = await getDoc(doc(runtime.db, "studentPlacementQueue", firebaseUser.uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<StudentPlacementQueue, "id">)
  };
}

export async function loadOpenStudentPlacementQueue(user: AppUser | null): Promise<StudentPlacementQueue[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    return [];
  }

  const queueQuery = query(
    collection(runtime.db, "studentPlacementQueue"),
    where("status", "==", "unassigned"),
    limit(PLACEMENT_QUEUE_LIMIT)
  );
  const snapshot = await getDocs(queueQuery);

  return snapshot.docs.map((placementDoc) => ({
    id: placementDoc.id,
    ...(placementDoc.data() as Omit<StudentPlacementQueue, "id">)
  }));
}

export async function claimPlacementStudent(studentId: string) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return null;
  }

  const callable = httpsCallable<{ studentId: string }, { linkId: string; status: TeacherStudentLink["status"] }>(
    runtime.functions,
    "claimPlacementStudent"
  );
  const response = await callable({ studentId });

  return response.data;
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
    const linkId = `${teacher.uid}_${student.id}`;
    const assignments = loadLocalAssignments(student.id).filter((assignment) => assignment.id !== linkId);

    saveLocalAssignments(student.id, [
      {
        id: linkId,
        teacherId: teacher.uid,
        teacherName: teacher.displayName,
        teacherEmail: teacher.email,
        studentId: student.id,
        studentName: studentProfile.displayName || student.name,
        studentEmail: student.email ?? null,
        status: "requested",
        latestProgressSnapshot: progress,
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      ...assignments
    ]);
    await upsertStudentPlacementQueue(student, studentProfile, progress, {
      status: "requested",
      requestedTeacher: teacher
    });
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

  await upsertStudentPlacementQueue(student, studentProfile, progress, {
    status: "requested",
    requestedTeacher: teacher
  });
}

export async function loadStudentAssignments(user: AppUser | null): Promise<TeacherStudentLink[]> {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser || !user) {
    return user ? loadLocalAssignments(user.id) : [];
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
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    return;
  }

  await updateDoc(doc(runtime.db, "teacherStudentLinks", linkId), {
    status,
    updatedAt: serverTimestamp()
  });

  const assignments = await loadTeacherAssignments({
    id: firebaseUser.uid,
    name: firebaseUser.displayName ?? "Teacher",
    email: firebaseUser.email ?? undefined
  });
  const activeStudentCount = assignments.filter((assignment) => assignment.status === "active").length;

  await updateDoc(doc(runtime.db, "teacherDirectory", firebaseUser.uid), {
    activeStudentCount,
    updatedAt: serverTimestamp()
  });
}

export async function syncAssignmentProgress(user: AppUser | null, progress: Progress) {
  if (!user) {
    return;
  }

  const assignments = await loadStudentAssignments(user);
  const runtime = getFirebaseRuntime();

  if (!runtime) {
    saveLocalAssignments(
      user.id,
      assignments.map((assignment) => ({
        ...assignment,
        latestProgressSnapshot: progress,
        updatedAt: new Date().toISOString()
      }))
    );
    const placement = loadLocalPlacement(user.id);

    if (placement) {
      saveLocalPlacement(user.id, {
        ...placement,
        latestProgressSnapshot: progress,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id
      });
    }
    return;
  }

  await Promise.all(
    [
      ...assignments
        .filter((assignment) => assignment.status !== "declined")
        .map((assignment) =>
          updateDoc(doc(runtime.db, "teacherStudentLinks", assignment.id), {
            latestProgressSnapshot: progress,
            updatedAt: serverTimestamp()
          })
        ),
      updateDoc(doc(runtime.db, "studentPlacementQueue", user.id), {
        latestProgressSnapshot: progress,
        updatedAt: serverTimestamp(),
        updatedBy: user.id
      }).catch(() => undefined)
    ]
  );
}
